"""Default compliance rules and seeding function."""

from __future__ import annotations

from sqlalchemy.orm import Session

from src.models.compliance import ComplianceRule

ALL = ["all"]
INV = "investment_advice"
PENSION = "pension_transfer"
SUIT = "suitability_assessment"
INS = "insurance_advice"

DEFAULT_RULES: list[dict] = [
    # -----------------------------------------------------------------------
    # Category: Metadata (META)
    # -----------------------------------------------------------------------
    {
        "rule_id": "META_001",
        "name": "Rådgivarens namn saknas",
        "category": "metadata",
        "tier": 1,
        "rule_type": "require_field",
        "rule_params": {"field_path": "advisor.advisor_name"},
        "document_types": ALL,
        "default_severity": "error",
        "max_deduction": 12,
        "remediation": "Ange rådgivarens fullständiga namn och roll i dokumentets inledning",
        "enabled": True,
        "sort_order": 10,
    },
    {
        "rule_id": "META_002",
        "name": "Företagsnamn saknas",
        "category": "metadata",
        "tier": 1,
        "rule_type": "require_field",
        "rule_params": {"field_path": "advisor.firm_name"},
        "document_types": ALL,
        "default_severity": "error",
        "max_deduction": 10,
        "remediation": "Ange företagets namn och organisationsnummer",
        "enabled": True,
        "sort_order": 20,
    },
    {
        "rule_id": "META_003",
        "name": "Dokumentdatum saknas",
        "category": "metadata",
        "tier": 1,
        "rule_type": "require_field",
        "rule_params": {"field_path": "document_date"},
        "document_types": ALL,
        "default_severity": "warning",
        "max_deduction": 3,
        "remediation": "Ange datum för rådgivningstillfället",
        "enabled": True,
        "sort_order": 30,
    },
    {
        "rule_id": "META_004",
        "name": "Kundnamn saknas",
        "category": "metadata",
        "tier": 1,
        "rule_type": "require_field",
        "rule_params": {"field_path": "client.person_name"},
        "document_types": ALL,
        "default_severity": "error",
        "max_deduction": 12,
        "remediation": "Ange kundens fullständiga namn",
        "enabled": True,
        "sort_order": 40,
    },
    # -----------------------------------------------------------------------
    # Category: KYC / Suitability (KYC)
    # -----------------------------------------------------------------------
    {
        "rule_id": "KYC_000",
        "name": "Lämplighetsbedömning saknas helt",
        "category": "kyc",
        "tier": 1,
        "rule_type": "require_field",
        "rule_params": {"field_path": "suitability"},
        "document_types": [INV, PENSION, SUIT],
        "default_severity": "error",
        "max_deduction": 15,
        "remediation": "Dokumentet saknar lämplighetsbedömning — lägg till kundprofil med riskprofil, erfarenhet och ekonomisk situation",
        "enabled": True,
        "sort_order": 100,
    },
    {
        "rule_id": "KYC_001",
        "name": "Ekonomisk situation ej dokumenterad",
        "category": "kyc",
        "tier": 1,
        "rule_type": "require_field",
        "rule_params": {"field_path": "suitability.financial_situation"},
        "document_types": [INV, PENSION, SUIT],
        "default_severity": "error",
        "max_deduction": 10,
        "parent_rule_id": "KYC_000",
        "remediation": "Beskriv kundens inkomst, tillgångar, skulder och utgifter",
        "enabled": True,
        "sort_order": 110,
    },
    {
        "rule_id": "KYC_002",
        "name": "Riskprofil saknas",
        "category": "kyc",
        "tier": 1,
        "rule_type": "require_field",
        "rule_params": {"field_path": "suitability.risk_profile"},
        "document_types": [INV, PENSION, SUIT],
        "default_severity": "error",
        "max_deduction": 10,
        "parent_rule_id": "KYC_000",
        "remediation": "Ange kundens risktolerans (t.ex. skala 1–7 eller beskrivning)",
        "enabled": True,
        "sort_order": 120,
    },
    {
        "rule_id": "KYC_003",
        "name": "Investeringshorisont saknas",
        "category": "kyc",
        "tier": 1,
        "rule_type": "require_field",
        "rule_params": {"field_path": "suitability.investment_horizon"},
        "document_types": [INV, SUIT],
        "default_severity": "warning",
        "max_deduction": 4,
        "parent_rule_id": "KYC_000",
        "remediation": 'Ange kundens tidshorisont (t.ex. "10 år", "långsiktig")',
        "enabled": True,
        "sort_order": 130,
    },
    {
        "rule_id": "KYC_004",
        "name": "Erfarenhetsnivå saknas",
        "category": "kyc",
        "tier": 1,
        "rule_type": "require_field",
        "rule_params": {"field_path": "suitability.experience_level"},
        "document_types": [INV, PENSION, SUIT],
        "default_severity": "error",
        "max_deduction": 8,
        "parent_rule_id": "KYC_000",
        "remediation": "Bedöm kundens kunskap och erfarenhet av finansiella instrument",
        "enabled": True,
        "sort_order": 140,
    },
    {
        "rule_id": "KYC_005",
        "name": "Förlusttolerans ej dokumenterad",
        "category": "kyc",
        "tier": 1,
        "rule_type": "require_field",
        "rule_params": {"field_path": "suitability.loss_tolerance"},
        "document_types": [INV, PENSION],
        "default_severity": "error",
        "max_deduction": 8,
        "parent_rule_id": "KYC_000",
        "remediation": "Dokumentera kundens förmåga att bära förluster",
        "enabled": True,
        "sort_order": 150,
    },
    {
        "rule_id": "KYC_006",
        "name": "Investeringsmål saknas",
        "category": "kyc",
        "tier": 1,
        "rule_type": "require_field",
        "rule_params": {"field_path": "suitability.investment_objective"},
        "document_types": [INV, SUIT],
        "default_severity": "warning",
        "max_deduction": 4,
        "parent_rule_id": "KYC_000",
        "remediation": "Ange kundens investeringsmål (t.ex. pension, buffert, tillväxt)",
        "enabled": True,
        "sort_order": 160,
    },
    # -----------------------------------------------------------------------
    # Category: Recommendations (REC)
    # -----------------------------------------------------------------------
    {
        "rule_id": "REC_001",
        "name": "Inga investeringsrekommendationer",
        "category": "recommendations",
        "tier": 1,
        "rule_type": "require_any_items",
        "rule_params": {"field_path": "recommendations"},
        "document_types": [INV],
        "default_severity": "error",
        "max_deduction": 12,
        "remediation": "Lägg till minst en produktrekommendation med namn och belopp",
        "enabled": True,
        "sort_order": 200,
    },
    {
        "rule_id": "REC_002",
        "name": "Rekommendation saknar motivering",
        "category": "recommendations",
        "tier": 1,
        "rule_type": "require_field_on_items",
        "rule_params": {"list_path": "recommendations", "item_field": "motivation"},
        "document_types": [INV, PENSION],
        "default_severity": "warning",
        "max_deduction": 4,
        "parent_rule_id": "REC_001",
        "remediation": "Motivera varje rekommendation — koppla till kundens mål och riskprofil",
        "enabled": True,
        "sort_order": 210,
    },
    {
        "rule_id": "REC_003",
        "name": "Riskmismatch utan motivering",
        "category": "recommendations",
        "tier": 2,
        "rule_type": "ai_evaluate",
        "rule_params": {
            "prompt": (
                "Analysera om någon rekommenderad produkt har en risknivå som "
                "överstiger kundens angivna riskprofil. Om så är fallet, "
                "kontrollera om det finns en tydlig motivering till avvikelsen. "
                "Svara med passed=true om risknivåerna matchar eller om "
                "avvikelsen är motiverad."
            ),
            "context_fields": ["suitability", "recommendations"],
        },
        "document_types": [INV],
        "default_severity": "error",
        "max_deduction": 12,
        "parent_rule_id": "REC_001",
        "remediation": "Produktens risk överstiger kundens riskprofil — lägg till avvikelsemotivering",
        "enabled": True,
        "sort_order": 220,
    },
    # -----------------------------------------------------------------------
    # Category: Pension Transfer (TRANSFER)
    # -----------------------------------------------------------------------
    {
        "rule_id": "TRANSFER_001",
        "name": "Nuvarande pensionsleverantör saknas",
        "category": "transfer",
        "tier": 1,
        "rule_type": "require_field",
        "rule_params": {"field_path": "pension_provider_from"},
        "document_types": [PENSION],
        "default_severity": "error",
        "max_deduction": 10,
        "remediation": "Ange vilken leverantör pensionen flyttas från",
        "enabled": True,
        "sort_order": 300,
    },
    {
        "rule_id": "TRANSFER_002",
        "name": "Ny pensionsleverantör saknas",
        "category": "transfer",
        "tier": 1,
        "rule_type": "require_field",
        "rule_params": {"field_path": "pension_provider_to"},
        "document_types": [PENSION],
        "default_severity": "error",
        "max_deduction": 10,
        "remediation": "Ange vilken leverantör pensionen flyttas till",
        "enabled": True,
        "sort_order": 310,
    },
    {
        "rule_id": "TRANSFER_003",
        "name": "Flyttbelopp saknas",
        "category": "transfer",
        "tier": 1,
        "rule_type": "require_field",
        "rule_params": {"field_path": "transfer_amount"},
        "document_types": [PENSION],
        "default_severity": "warning",
        "max_deduction": 4,
        "remediation": "Ange belopp som ska flyttas",
        "enabled": True,
        "sort_order": 320,
    },
    # -----------------------------------------------------------------------
    # Category: ESG / Sustainability (ESG) — disabled by default
    # -----------------------------------------------------------------------
    {
        "rule_id": "ESG_001",
        "name": "Hållbarhetspreferenser ej dokumenterade",
        "category": "esg",
        "tier": 1,
        "rule_type": "require_field",
        "rule_params": {"field_path": "suitability.sustainability_preference"},
        "document_types": [INV, PENSION],
        "default_severity": "warning",
        "max_deduction": 5,
        "remediation": "Dokumentera om kunden tillfrågats om hållbarhetspreferenser (ja/nej)",
        "enabled": False,
        "sort_order": 400,
    },
    # -----------------------------------------------------------------------
    # Category: Suitability Quality (SUIT) — Tier 2
    # -----------------------------------------------------------------------
    {
        "rule_id": "SUIT_001",
        "name": "Generisk lämplighetsförklaring",
        "category": "suitability_quality",
        "tier": 2,
        "rule_type": "ai_evaluate",
        "rule_params": {
            "prompt": (
                "Analysera lämplighetsförklaringen i detta rådgivningsdokument. "
                "Bedöm om texten är personligt anpassad till kundens specifika "
                "situation, eller om den verkar vara en generisk standardmall "
                "(copy-paste). Svara med passed=true om förklaringen är tydligt "
                "personlig."
            ),
            "context_fields": ["suitability"],
        },
        "document_types": [INV, PENSION, SUIT],
        "default_severity": "warning",
        "max_deduction": 5,
        "parent_rule_id": "KYC_000",
        "remediation": "Lämplighetsförklaringen verkar vara standardtext — anpassa till kundens specifika situation",
        "enabled": True,
        "sort_order": 500,
    },
    {
        "rule_id": "SUIT_002",
        "name": "Svag koppling mellan kunddata och råd",
        "category": "suitability_quality",
        "tier": 2,
        "rule_type": "ai_evaluate",
        "rule_params": {
            "prompt": (
                "Bedöm om rådgivningsdokumentet innehåller en tydlig koppling "
                "mellan kundens profil (mål, riskprofil, ekonomisk situation) "
                "och det givna rådet. Det ska finnas en explicit motivering av "
                "typen 'Produkt X rekommenderas eftersom den matchar ditt mål Y "
                "och din riskprofil Z'. Svara med passed=true om kopplingen är "
                "tydlig."
            ),
            "context_fields": ["suitability", "recommendations"],
        },
        "document_types": [INV, PENSION],
        "default_severity": "error",
        "max_deduction": 10,
        "parent_rule_id": "KYC_000",
        "remediation": "Lämplighetsförklaringen bör explicit koppla kundens mål, riskprofil och ekonomi till det givna rådet",
        "enabled": True,
        "sort_order": 510,
    },
    # -----------------------------------------------------------------------
    # Category: Costs & Remuneration (COST) — disabled by default
    # -----------------------------------------------------------------------
    {
        "rule_id": "COST_001",
        "name": "Ersättningsinformation saknas",
        "category": "costs",
        "tier": 1,
        "rule_type": "require_field",
        "rule_params": {"field_path": "remuneration"},
        "document_types": [INV, PENSION],
        "default_severity": "error",
        "max_deduction": 12,
        "remediation": "Redovisa ersättning till förmedlaren",
        "enabled": False,
        "sort_order": 600,
    },
    {
        "rule_id": "COST_002",
        "name": "Ersättning saknas i kronor",
        "category": "costs",
        "tier": 1,
        "rule_type": "require_field",
        "rule_params": {"field_path": "remuneration.amount_sek"},
        "document_types": [INV, PENSION],
        "default_severity": "warning",
        "max_deduction": 4,
        "parent_rule_id": "COST_001",
        "remediation": "Ange ersättning i både kronor (SEK) och procent (%)",
        "enabled": False,
        "sort_order": 610,
    },
]


def seed_default_rules(db: Session) -> int:
    """Insert default rules if compliance_rules table is empty.

    Returns the number of rules inserted.
    """
    existing = db.query(ComplianceRule).count()
    if existing > 0:
        return 0

    for rule_data in DEFAULT_RULES:
        db.add(ComplianceRule(**rule_data))
    db.commit()
    return len(DEFAULT_RULES)
