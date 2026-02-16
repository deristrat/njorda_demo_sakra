# Spec: Rules-Based Compliance Checking

**Status:** Draft v3
**Date:** 2025-02-16

## 1. Overview

A data-driven, linter-style compliance engine that automatically checks uploaded advisory documents against a configurable set of rules. Rules are **stored in the database** and evaluated by a small set of generic **rule type implementations**. Adding a new rule is a pure data operation — no code changes required.

Rules produce **findings** (not binary pass/fail) — a single rule can emit zero, one, or many findings. Each finding has a severity level and an actionable remediation hint in Swedish.

Rules come in two tiers:
- **Tier 1 (Deterministic):** Field presence, value comparisons, structural checks. Fast, consistent, always reliable.
- **Tier 2 (AI-evaluated):** LLM-judged checks driven by a configurable prompt. Slower, probabilistic, marked clearly in the UI.

The system produces a **numeric compliance score** (0–100) per document, mapped to a traffic light via configurable thresholds.

Ships with **20 pre-seeded rules** based on LFD, FI, InsureSec REKO 2025 — good defaults that work out of the box for demos, testing, and onboarding.

## 2. Concepts

- **Rule Type**: A generic implementation function (e.g. `require_field`, `ai_evaluate`). A small set (~5) covers all rules. Registered in code via `@rule_type` decorator.
- **Rule**: A named check stored in the database. References a rule type + parameters. Has metadata: ID, name, category, tier, applicable doc types, severity, remediation hint, parent, scoring weight.
- **Finding**: A single issue emitted by a rule. Contains: severity, message, and optionally a `context` (which field/item triggered it). One rule can produce multiple findings.
- **Severity**: `error` or `warning`. Each rule has a default severity, overridable in the DB.
- **Tier**: `1` (deterministic) or `2` (AI-evaluated). Displayed differently in UI.
- **Rule Hierarchy**: Rules can reference a `parent_rule_id`. If the parent produces findings, children are skipped (status: `skipped`). Avoids noise.
- **Compliance Score**: 0–100 per document. Start at 100, deduct `max_deduction` for each failed rule. Skipped rules don't deduct.
- **Traffic Light**: Derived from score via configurable thresholds. Defaults: >= 85 green, >= 50 yellow, < 50 red.

## 3. Rule Types (Implementations)

A small set of generic Python functions that know how to evaluate a category of check. Each is parameterized via `rule_params` (JSON) stored on the rule row.

### 3.1 `require_field`

Checks that a field exists and is non-empty in the extracted data.

**Parameters:**
- `field_path` (string) — Dot-notation path into `ExtractionResult`. E.g. `"advisor.advisor_name"`, `"suitability.risk_profile"`, `"suitability"` (checks the whole object exists).

**Logic:**
- Resolve the path on the extraction data.
- If the value is `None`, empty string, or missing → emit one finding.
- Otherwise → pass (no findings).

**Covers:** ~14 of 20 rules (META_001–004, KYC_000–006, TRANSFER_001–003, ESG_001).

### 3.2 `require_any_items`

Checks that a list field contains at least one item.

**Parameters:**
- `field_path` (string) — Path to a list field. E.g. `"recommendations"`.

**Logic:**
- Resolve the path. If the list is `None`, empty, or missing → emit one finding.

**Covers:** REC_001.

### 3.3 `require_field_on_items`

Checks that every item in a list has a specific field populated. Emits one finding per item that fails.

**Parameters:**
- `list_path` (string) — Path to the list. E.g. `"recommendations"`.
- `item_field` (string) — Field name on each item. E.g. `"motivation"`.

**Logic:**
- For each item in the list, check if `item_field` is present and non-empty.
- Emit one finding per failing item, with context (e.g. item index or product name).

**Covers:** REC_002.

### 3.4 `ai_evaluate`

Sends extracted data + document text to an LLM with a configurable prompt. The LLM returns a structured judgment.

**Parameters:**
- `prompt` (string) — The evaluation prompt. Can reference placeholders like `{suitability_text}`, `{recommendations}`.
- `context_fields` (list of strings, optional) — Which extraction fields to include as context for the LLM.

**Logic:**
- Build context from extraction data + raw document text.
- Call LLM with the prompt.
- Parse structured response (pass/fail + explanation).
- Emit finding if failed, with the LLM's explanation as the message.

**Covers:** SUIT_001, SUIT_002, REC_003.

### 3.5 `custom`

Escape hatch for rules that need bespoke logic not expressible by the other types.

**Parameters:**
- `function_name` (string) — Name of a registered Python function.

**Logic:**
- Look up the function in a custom function registry.
- Call it with the standard `RuleContext`.
- Return its findings.

**Covers:** Future complex rules (e.g. cross-field comparisons, conditional logic).

### 3.6 Registration

```python
# backend/src/compliance/rule_types.py

@rule_type("require_field")
def check_require_field(ctx: RuleContext, params: dict) -> list[Finding]:
    value = resolve_field_path(ctx.data, params["field_path"])
    # Handle None, empty strings, and empty lists. Enums, dates, and
    # numbers are truthy when present so a simple `not` check won't work
    # for e.g. 0.0 — but that's fine since extractors use None for missing.
    if value is None or value == "":
        return [Finding(message=ctx.rule.name)]
    return []

@rule_type("require_any_items")
def check_require_any_items(ctx: RuleContext, params: dict) -> list[Finding]:
    items = resolve_field_path(ctx.data, params["field_path"])
    if not items:
        return [Finding(message=ctx.rule.name)]
    return []

@rule_type("require_field_on_items")
def check_require_field_on_items(ctx: RuleContext, params: dict) -> list[Finding]:
    items = resolve_field_path(ctx.data, params["list_path"]) or []
    findings = []
    for i, item in enumerate(items):
        val = getattr(item, params["item_field"], None)
        if val is None or val == "":
            label = getattr(item, "product_name", None) or f"#{i+1}"
            findings.append(Finding(
                message=f"{ctx.rule.name}: {label}",
                context={"index": i, "item_field": params["item_field"]},
            ))
    return findings

@rule_type("ai_evaluate")
async def check_ai_evaluate(ctx: RuleContext, params: dict) -> list[Finding]:
    if not ctx.raw_text:
        return []
    result = await ctx.llm_judge(prompt=params["prompt"], text=ctx.raw_text)
    if not result.passed:
        return [Finding(message=result.explanation)]
    return []
```

## 4. Data Model

### 4.1 `compliance_rules` — Rule Definitions (Source of Truth)

All rules live here. Pre-seeded on first startup / migration. Editable via settings UI.

| Column | Type | Description |
|--------|------|-------------|
| id | Integer PK | Auto-increment |
| rule_id | String(50) unique | e.g. "META_001" |
| name | String(200) | Swedish display name |
| description | Text nullable | Longer description |
| category | String(50) | "metadata", "kyc", "recommendations", "transfer", "esg", "suitability_quality", "costs" |
| tier | Integer | 1 or 2 |
| rule_type | String(50) | "require_field", "require_any_items", "require_field_on_items", "ai_evaluate", "custom" |
| rule_params | JSON | Parameters for the rule type, e.g. `{"field_path": "advisor.advisor_name"}` |
| document_types | JSON | Array of applicable types, e.g. `["investment_advice", "pension_transfer"]`. Use `["all"]` for universal. |
| default_severity | String(20) | "error" or "warning" |
| severity_override | String(20) nullable | Org override. Null = use default. |
| max_deduction | Integer | Points deducted on failure (0–100) |
| remediation | Text | Swedish actionable hint |
| parent_rule_id | String(50) FK → self nullable | If set, skip this rule when parent has findings |
| enabled | Boolean | Default true |
| sort_order | Integer | Display ordering within category |
| created_at | DateTime | |
| updated_at | DateTime | |

### 4.2 `compliance_findings` — Results Per Document

| Column | Type | Description |
|--------|------|-------------|
| id | Integer PK | |
| document_id | Integer FK → documents (CASCADE) | |
| rule_id | String(50) FK → compliance_rules | |
| status | String(10) | "passed", "failed", "skipped" |
| severity | String(20) | Effective severity at check time |
| tier | Integer | 1 or 2 |
| findings_json | JSON nullable | Array of finding objects if failed. Null if passed/skipped. |
| checked_at | DateTime | |

> `findings_json` stores the list of Finding objects for rules that emit multiple (e.g. `require_field_on_items`). Single-finding rules just have a one-element array.

### 4.3 Denormalized on `documents` Table

| Column | Type | Description |
|--------|------|-------------|
| compliance_status | String(10) nullable | "green", "yellow", "red", null |
| compliance_score | Integer nullable | 0-100 |
| compliance_summary | JSON nullable | `{"total": 14, "passed": 12, "warnings": 1, "errors": 1, "skipped": 0}` |

### 4.4 Score Thresholds

Stored in `app_settings` (existing key-value table):

| Key | Default | Description |
|-----|---------|-------------|
| `compliance_threshold_green` | 85 | Score >= this = green |
| `compliance_threshold_yellow` | 50 | Score >= this = yellow, below = red |

## 5. Seed Data

On first run (or via a seed script), the `compliance_rules` table is populated with these 20 rules. This is the "batteries included" experience — works immediately for demos and new deployments.

### Category: Metadata (META)

| rule_id | name | rule_type | rule_params | doc_types | severity | pts | parent | remediation |
|---------|------|-----------|-------------|-----------|----------|-----|--------|-------------|
| META_001 | Rådgivarens namn saknas | require_field | `{"field_path": "advisor.advisor_name"}` | all | error | 12 | — | Ange rådgivarens fullständiga namn och roll i dokumentets inledning |
| META_002 | Företagsnamn saknas | require_field | `{"field_path": "advisor.firm_name"}` | all | error | 10 | — | Ange företagets namn och organisationsnummer |
| META_003 | Dokumentdatum saknas | require_field | `{"field_path": "document_date"}` | all | warning | 3 | — | Ange datum för rådgivningstillfället |
| META_004 | Kundnamn saknas | require_field | `{"field_path": "client.person_name"}` | all | error | 12 | — | Ange kundens fullständiga namn |

### Category: KYC / Suitability (KYC)

| rule_id | name | rule_type | rule_params | doc_types | severity | pts | parent | remediation |
|---------|------|-----------|-------------|-----------|----------|-----|--------|-------------|
| KYC_000 | Lämplighetsbedömning saknas helt | require_field | `{"field_path": "suitability"}` | inv, pension, suit | error | 15 | — | Dokumentet saknar lämplighetsbedömning — lägg till kundprofil med riskprofil, erfarenhet och ekonomisk situation |
| KYC_001 | Ekonomisk situation ej dokumenterad | require_field | `{"field_path": "suitability.financial_situation"}` | inv, pension, suit | error | 10 | KYC_000 | Beskriv kundens inkomst, tillgångar, skulder och utgifter |
| KYC_002 | Riskprofil saknas | require_field | `{"field_path": "suitability.risk_profile"}` | inv, pension, suit | error | 10 | KYC_000 | Ange kundens risktolerans (t.ex. skala 1–7 eller beskrivning) |
| KYC_003 | Investeringshorisont saknas | require_field | `{"field_path": "suitability.investment_horizon"}` | inv, suit | warning | 4 | KYC_000 | Ange kundens tidshorisont (t.ex. "10 år", "långsiktig") |
| KYC_004 | Erfarenhetsnivå saknas | require_field | `{"field_path": "suitability.experience_level"}` | inv, pension, suit | error | 8 | KYC_000 | Bedöm kundens kunskap och erfarenhet av finansiella instrument |
| KYC_005 | Förlusttolerans ej dokumenterad | require_field | `{"field_path": "suitability.loss_tolerance"}` | inv, pension | error | 8 | KYC_000 | Dokumentera kundens förmåga att bära förluster |
| KYC_006 | Investeringsmål saknas | require_field | `{"field_path": "suitability.investment_objective"}` | inv, suit | warning | 4 | KYC_000 | Ange kundens investeringsmål (t.ex. pension, buffert, tillväxt) |

> Doc type shorthand: inv = investment_advice, pension = pension_transfer, suit = suitability_assessment, ins = insurance_advice

### Category: Recommendations (REC)

| rule_id | name | rule_type | rule_params | doc_types | severity | pts | parent | remediation |
|---------|------|-----------|-------------|-----------|----------|-----|--------|-------------|
| REC_001 | Inga investeringsrekommendationer | require_any_items | `{"field_path": "recommendations"}` | inv | error | 12 | — | Lägg till minst en produktrekommendation med namn och belopp |
| REC_002 | Rekommendation saknar motivering | require_field_on_items | `{"list_path": "recommendations", "item_field": "motivation"}` | inv, pension | warning | 4 | REC_001 | Motivera varje rekommendation — koppla till kundens mål och riskprofil |
| REC_003 | Riskmismatch utan motivering | ai_evaluate | `{"prompt": "Analysera om någon rekommenderad produkt har en risknivå som överstiger kundens angivna riskprofil. Om så är fallet, kontrollera om det finns en tydlig motivering till avvikelsen. Svara med passed=true om risknivåerna matchar eller om avvikelsen är motiverad.", "context_fields": ["suitability", "recommendations"]}` | inv | error | 12 | REC_001 | Produktens risk överstiger kundens riskprofil — lägg till avvikelsemotivering |

### Category: Pension Transfer (TRANSFER)

| rule_id | name | rule_type | rule_params | doc_types | severity | pts | parent | remediation |
|---------|------|-----------|-------------|-----------|----------|-----|--------|-------------|
| TRANSFER_001 | Nuvarande pensionsleverantör saknas | require_field | `{"field_path": "pension_provider_from"}` | pension | error | 10 | — | Ange vilken leverantör pensionen flyttas från |
| TRANSFER_002 | Ny pensionsleverantör saknas | require_field | `{"field_path": "pension_provider_to"}` | pension | error | 10 | — | Ange vilken leverantör pensionen flyttas till |
| TRANSFER_003 | Flyttbelopp saknas | require_field | `{"field_path": "transfer_amount"}` | pension | warning | 4 | — | Ange belopp som ska flyttas |

### Category: ESG / Sustainability (ESG) — disabled by default

| rule_id | name | rule_type | rule_params | doc_types | severity | pts | parent | enabled | remediation |
|---------|------|-----------|-------------|-----------|----------|-----|--------|---------|-------------|
| ESG_001 | Hållbarhetspreferenser ej dokumenterade | require_field | `{"field_path": "suitability.sustainability_preference"}` | inv, pension | warning | 5 | — | false | Dokumentera om kunden tillfrågats om hållbarhetspreferenser (ja/nej) |

> Requires adding `sustainability_preference` to the `SuitabilityAssessment` extraction model. Disabled until then.

### Category: Suitability Quality (SUIT) — Tier 2

| rule_id | name | rule_type | rule_params | doc_types | severity | pts | parent | remediation |
|---------|------|-----------|-------------|-----------|----------|-----|--------|-------------|
| SUIT_001 | Generisk lämplighetsförklaring | ai_evaluate | `{"prompt": "Analysera lämplighetsförklaringen i detta rådgivningsdokument. Bedöm om texten är personligt anpassad till kundens specifika situation, eller om den verkar vara en generisk standardmall (copy-paste). Svara med passed=true om förklaringen är tydligt personlig.", "context_fields": ["suitability"]}` | inv, pension, suit | warning | 5 | KYC_000 | Lämplighetsförklaringen verkar vara standardtext — anpassa till kundens specifika situation |
| SUIT_002 | Svag koppling mellan kunddata och råd | ai_evaluate | `{"prompt": "Bedöm om rådgivningsdokumentet innehåller en tydlig koppling mellan kundens profil (mål, riskprofil, ekonomisk situation) och det givna rådet. Det ska finnas en explicit motivering av typen 'Produkt X rekommenderas eftersom den matchar ditt mål Y och din riskprofil Z'. Svara med passed=true om kopplingen är tydlig.", "context_fields": ["suitability", "recommendations"]}` | inv, pension | error | 10 | KYC_000 | Lämplighetsförklaringen bör explicit koppla kundens mål, riskprofil och ekonomi till det givna rådet |

### Category: Costs & Remuneration (COST) — disabled by default

| rule_id | name | rule_type | rule_params | doc_types | severity | pts | parent | enabled | remediation |
|---------|------|-----------|-------------|-----------|----------|-----|--------|---------|-------------|
| COST_001 | Ersättningsinformation saknas | require_field | `{"field_path": "remuneration"}` | inv, pension | error | 12 | — | false | Redovisa ersättning till förmedlaren |
| COST_002 | Ersättning saknas i kronor | require_field | `{"field_path": "remuneration.amount_sek"}` | inv, pension | warning | 4 | COST_001 | false | Ange ersättning i både kronor (SEK) och procent (%) |

### Summary

| | Count |
|---|---|
| Tier 1 (deterministic) | 17 |
| Tier 2 (AI-evaluated) | 3 |
| Enabled by default | 17 |
| Disabled by default | 3 (ESG_001, COST_001, COST_002) |
| **Total** | **20** |

Rules by type: `require_field` ×14, `require_any_items` ×1, `require_field_on_items` ×1, `ai_evaluate` ×3, `custom` ×0 (escape hatch available, no seed rules use it).

## 6. Engine

### 6.1 RuleContext

```python
class RuleContext:
    data: ExtractionResult       # Structured extraction
    raw_text: str | None         # Full document text (for Tier 2)
    document_type: DocumentType
    rule: ComplianceRule         # The current rule DB row (for access to name, params, etc.)
    llm_judge: Callable          # Async LLM helper for ai_evaluate
```

### 6.2 Core Interface

```python
# backend/src/compliance/engine.py

def get_rules_for_document(
    document_type: DocumentType,
    db: Session,
) -> list[ComplianceRule]:
    """
    Query compliance_rules table for rules that:
    1. Apply to this document_type (or "all")
    2. Are enabled
    Returned in execution order: parents before children, then by sort_order.
    """

async def check_document(
    extraction: ExtractionResult,
    rules: list[ComplianceRule],
    raw_text: str | None = None,
) -> ComplianceReport:
    """
    For each rule:
    1. Check if parent has findings → skip if so
    2. Look up rule_type implementation
    3. Call implementation with RuleContext + rule_params
    4. Collect findings
    Compute score and traffic light status.
    """
```

### 6.3 Score Calculation

```
score = max(0, 100 - sum(rule.max_deduction for rule in failed_rules))
```

Skipped rules don't deduct. Passed rules don't deduct. Only failed rules deduct their `max_deduction`.

For rules that emit multiple findings (e.g. `require_field_on_items` checking 5 recommendations, 2 fail): deduct `max_deduction` once per rule, not per finding. The findings give detail, the score gives the overall picture.

### 6.4 ComplianceReport

```python
class Finding(BaseModel):
    message: str
    context: dict | None = None  # e.g. {"index": 2, "product_name": "Fond X"}

class RuleOutcome(BaseModel):
    rule_id: str
    rule_name: str
    category: str
    tier: int
    rule_type: str
    status: Literal["passed", "failed", "skipped"]
    severity: str
    findings: list[Finding]
    remediation: str | None      # only if failed

class ComplianceSummary(BaseModel):
    total_rules: int
    passed: int
    failed: int
    skipped: int
    warnings: int                    # failed with severity=warning
    errors: int                      # failed with severity=error

class ComplianceReport(BaseModel):
    outcomes: list[RuleOutcome]
    score: int
    status: Literal["green", "yellow", "red"]
    summary: ComplianceSummary
```

## 7. API Endpoints

### Rules Management

- `GET /api/compliance/rules` — All rules from DB, grouped by category. Includes all metadata.
- `PUT /api/compliance/rules/{rule_id}` — Update rule fields (enabled, severity_override, name, remediation, rule_params, max_deduction).
- `POST /api/compliance/rules` — Create a new rule (data-driven — pick rule_type, set params).
- `DELETE /api/compliance/rules/{rule_id}` — Delete a custom rule (prevent deletion of seed rules? Or allow with confirmation).
- `GET /api/compliance/thresholds` — Current score thresholds.
- `PUT /api/compliance/thresholds` — Update thresholds.

### Document Compliance

- `GET /api/documents/{id}/compliance` — Full compliance report for a document.
- `POST /api/documents/{id}/compliance/recheck` — Re-run checks.

## 8. Backend Flow

When extraction completes for a document:

1. Get `document_type` from extraction result.
2. Query `compliance_rules` for applicable, enabled rules.
3. Run engine: `check_document(extraction, rules, raw_text)`.
4. Store `compliance_findings` rows (clear previous results first).
5. Compute score, apply thresholds, get traffic light.
6. Update denormalized fields on `documents` row.

Tier 1 rules run synchronously (fast). Tier 2 rules run async (LLM calls).

**Pipeline integration:** The extraction currently runs inside an SSE stream (`process_documents` in `documents.py`). Compliance checking slots in right after `extraction.status = "completed"`, before the SSE event is yielded. For Tier 1 rules this adds negligible latency. For Tier 2 (LLM calls), we should:
- **v1:** Only run Tier 1 rules during the pipeline. Tier 2 available via the recheck endpoint.
- **Later:** Run Tier 2 in background and update score when done (push via SSE or polling).

**Raw text for Tier 2:** The `ai_evaluate` rule type needs raw document text, which the extraction pipeline currently does not store. Options:
- Re-read the PDF and extract text when running Tier 2 rules (simplest for now).
- Add a `raw_text` column to `DocumentExtraction` and populate during extraction.
This is deferred to step 10 (Tier 2 implementation).

## 9. Seeding

A seed function runs on app startup (or via CLI) and inserts default rules **if the table is empty**. This ensures:
- Fresh deploys get all 20 rules immediately
- Dev/test environments start with a working rule set
- Existing deployments with customized rules are not overwritten

```python
# backend/src/compliance/seed.py

def seed_default_rules(db: Session):
    """Insert default rules if compliance_rules table is empty."""
    if db.query(ComplianceRule).count() > 0:
        return  # Already seeded or customized
    for rule_data in DEFAULT_RULES:
        db.add(ComplianceRule(**rule_data))
    db.commit()
```

`DEFAULT_RULES` is a list of dicts matching the seed data tables in section 5.

## 10. Frontend

### 10.1 Documents List — Traffic Light + Score

Add a **Regelefterlevnad** column to the documents table:

```
● 92    ← green dot, score number
▲ 64    ← yellow triangle, score
✕ 38    ← red X, score
— —     ← gray, not checked
```

Optionally show "2 av 14 flaggade" as tooltip or secondary text.

### 10.2 Document Detail — Compliance Panel

A panel on the document detail page (togglable like the PDF viewer):

**Header section:**
- Score prominently displayed: "92 / 100" with colored background
- Traffic light badge: Godkänd / Varningar / Underkänd
- Summary: "12 av 14 kontroller godkända — 1 varning, 1 fel"

**Findings list:**
- Failed rules first, grouped: errors then warnings
- Each row:
  - Severity icon (red circle / yellow triangle)
  - Tier badge if Tier 2: "AI" chip
  - Rule name
  - Finding message(s) — multiple findings shown as sub-items
  - Expandable: remediation hint
- Then a collapsible "Godkända kontroller" section showing passed rules (green checkmarks)
- Skipped rules shown as gray with note "Överhoppad — kontrolleras ej pga överordnad regel"

**Actions:**
- "Kontrollera igen" button — triggers recheck

### 10.3 Compliance Rules Settings Page

Route: `/settings/compliance`

**Threshold config** at top: two number inputs for green/yellow score cutoffs.

**Rules table** grouped by category:

| Regel | Typ | Regeltyp | Dokumenttyper | Allvarlighetsgrad | Poäng | Aktiv |
|-------|-----|----------|---------------|-------------------|-------|-------|
| Rådgivarens namn saknas | Auto | require_field | Alla | `[Fel ▾]` | 12 | `[✓]` |
| Generisk lämplighetsförklaring | AI | ai_evaluate | Rådgivning, Pension | `[Varning ▾]` | 5 | `[✓]` |

- Toggle to enable/disable
- Dropdown for severity: Standard / Varning / Fel
- Tier indicator: "Auto" (Tier 1) vs "AI" (Tier 2) badge
- Category headers as group separators
- Click row to expand/edit: name, remediation text, rule_params, max_deduction
- "Lägg till regel" button — form to create a new rule (pick type, set params)

## 11. File Structure

```
backend/src/compliance/
  __init__.py
  models.py              # Pydantic: Finding, RuleOutcome, ComplianceReport, ComplianceSummary
  rule_types.py           # @rule_type decorator, registry, implementations
  engine.py              # get_rules_for_document(), check_document(), score calculation
  seed.py                # Default rule definitions + seed function
  field_resolver.py      # resolve_field_path() — traverses dot-notation paths on Pydantic models, short-circuits on None

backend/src/models/
  compliance.py           # SQLAlchemy: ComplianceRule, ComplianceFinding

backend/src/routers/
  compliance.py           # API endpoints

frontend/src/pages/
  ComplianceSettingsPage.tsx

frontend/src/components/
  compliance/
    ComplianceStatusBadge.tsx   # Traffic light + score for list
    CompliancePanel.tsx         # Detail page panel
    ComplianceRulesTable.tsx    # Settings page
```

## 12. Implementation Order

1. **Backend: Pydantic models + rule types** — Finding, RuleOutcome, ComplianceReport. `@rule_type` decorator and the 5 implementations. `resolve_field_path()` utility.
2. **Backend: Engine** — `get_rules_for_document()`, `check_document()`, score calculation, hierarchy/skip logic.
3. **Backend: Seed data + tests** — DEFAULT_RULES list, seed function. Unit tests that run rules against mock ExtractionResult data.
4. **Backend: DB models + migration** — `compliance_rules`, `compliance_findings` tables. Denormalized fields on `documents`. Migration includes seeding.
5. **Backend: Pipeline integration** — Run compliance after extraction, store results, update document.
6. **Backend: API endpoints** — Rules CRUD, document compliance, thresholds.
7. **Frontend: Documents list** — Compliance column with traffic light + score.
8. **Frontend: Document detail** — Compliance panel.
9. **Frontend: Settings page** — Rules table with toggles, editing, and "add rule."
10. **Backend: Tier 2 rules** — LLM integration for `ai_evaluate` rule type.

> Steps 1–3 can be developed and tested in pure isolation (no DB, no API). The seed data doubles as test fixtures.
