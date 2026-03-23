"""Compliance rules management and document compliance endpoints."""

from __future__ import annotations

from datetime import datetime
from typing import cast, Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from src.audit import record_audit_event
from src.auth import TokenInfo, get_current_user_optional, get_effective_user
from src.compliance.audit import record_rule_audit, rule_to_dict
from src.compliance.engine import (
    DEFAULT_THRESHOLD_GREEN,
    DEFAULT_THRESHOLD_YELLOW,
    check_document,
    get_rules_for_document,
)
from src.compliance.models import ComplianceReport
from src.compliance.seed import seed_default_rules
from src.database import get_db
from src.extraction.models import ExtractionResult
from src.models.app_settings import get_setting, set_setting
from src.models.compliance import ComplianceFinding, ComplianceRule, ComplianceRuleAudit
from src.models.document import Document, DocumentExtraction

router = APIRouter(prefix="/api/compliance", tags=["compliance"])


def _require_compliance_or_admin(user: TokenInfo) -> None:
    """Raise 403 if not compliance or njorda_admin."""
    if user.effective_role not in ("compliance", "njorda_admin"):
        raise HTTPException(403, "Åtkomst nekad")


def _check_doc_access(doc: Document, user: TokenInfo) -> None:
    """Raise 403 if advisor doesn't own this document."""
    if user.effective_role == "advisor" and doc.advisor_id != user.effective_advisor_id:
        raise HTTPException(403, "Åtkomst nekad")


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class RuleResponse(BaseModel):
    rule_id: str
    name: str
    description: str | None
    category: str
    tier: int
    rule_type: str
    rule_params: dict | None
    document_types: list[str] | None
    default_severity: str
    severity_override: str | None
    max_deduction: int
    remediation: str | None
    parent_rule_id: str | None
    enabled: bool
    sort_order: int


class RuleUpdate(BaseModel):
    enabled: bool | None = None
    severity_override: str | None = None
    name: str | None = None
    remediation: str | None = None
    max_deduction: int | None = None
    description: str | None = None
    rule_params: dict | None = None
    document_types: list[str] | None = None
    parent_rule_id: str | None = None  # "" means clear


class RuleCreate(BaseModel):
    rule_id: str
    name: str
    category: str
    rule_type: str
    default_severity: str
    description: str | None = None
    rule_params: dict | None = None
    document_types: list[str] = ["all"]
    parent_rule_id: str | None = None
    tier: int = 1
    max_deduction: int = 5
    remediation: str | None = None
    enabled: bool = True


class AuditEntryResponse(BaseModel):
    id: int
    rule_id: str
    action: str
    changed_by: str
    changed_at: str
    old_values: dict | None
    new_values: dict


class ThresholdsResponse(BaseModel):
    green: int
    yellow: int


class ThresholdsUpdate(BaseModel):
    green: int | None = None
    yellow: int | None = None


# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------

VALID_DOCUMENT_TYPES = {
    "all",
    "investment_advice",
    "pension_transfer",
    "suitability_assessment",
    "insurance_advice",
}

VALID_CONTEXT_FIELDS = {
    "client",
    "advisor",
    "suitability",
    "recommendations",
    "pension_provider_from",
    "pension_provider_to",
    "transfer_amount",
    "raw_data",
    "confidence_notes",
    "document_type",
    "document_date",
}


def _validate_rule_params(rule_type: str, params: dict) -> None:
    """Validate rule_params matches expected shape for rule_type. Raises HTTPException(422)."""
    if rule_type == "require_field":
        fp = params.get("field_path")
        if not isinstance(fp, str) or not fp.strip():
            raise HTTPException(422, "field_path krävs och får inte vara tomt")
    elif rule_type == "require_any_items":
        fp = params.get("field_path")
        if not isinstance(fp, str) or not fp.strip():
            raise HTTPException(422, "field_path krävs och får inte vara tomt")
    elif rule_type == "require_field_on_items":
        lp = params.get("list_path")
        ifield = params.get("item_field")
        if not isinstance(lp, str) or not lp.strip():
            raise HTTPException(422, "list_path krävs och får inte vara tomt")
        if not isinstance(ifield, str) or not ifield.strip():
            raise HTTPException(422, "item_field krävs och får inte vara tomt")
    elif rule_type == "ai_evaluate":
        prompt = params.get("prompt")
        if not isinstance(prompt, str) or not prompt.strip():
            raise HTTPException(422, "prompt krävs och får inte vara tomt")
        ctx = params.get("context_fields")
        if not isinstance(ctx, list):
            raise HTTPException(422, "context_fields måste vara en lista")
        invalid = set(ctx) - VALID_CONTEXT_FIELDS
        if invalid:
            raise HTTPException(
                422,
                f"Ogiltiga context_fields: {', '.join(sorted(invalid))}",
            )
    elif rule_type == "custom":
        fn = params.get("function_name")
        if not isinstance(fn, str) or not fn.strip():
            raise HTTPException(422, "function_name krävs och får inte vara tomt")


def _validate_parent_rule_id(
    current_rule_id: str, proposed_parent_id: str, db: Session
) -> None:
    """Check parent exists and detect circular references. Raises HTTPException(422)."""
    parent = db.execute(
        select(ComplianceRule).where(ComplianceRule.rule_id == proposed_parent_id)
    ).scalar_one_or_none()
    if not parent:
        raise HTTPException(422, f"Överordnad regel hittades inte: {proposed_parent_id}")

    # Walk the parent chain to detect cycles (max 10 levels)
    visited = {current_rule_id}
    cursor_id = proposed_parent_id
    for _ in range(10):
        if cursor_id in visited:
            raise HTTPException(422, "Cirkulär referens: regeln kan inte vara sin egen överordnad")
        visited.add(cursor_id)
        cursor_rule = db.execute(
            select(ComplianceRule).where(ComplianceRule.rule_id == cursor_id)
        ).scalar_one_or_none()
        if not cursor_rule or not cursor_rule.parent_rule_id:
            break
        cursor_id = cursor_rule.parent_rule_id


# ---------------------------------------------------------------------------
# Rules management (compliance + njorda_admin only)
# ---------------------------------------------------------------------------


@router.get("/rules")
def list_rules(
    db: Session = Depends(get_db),
    user: TokenInfo = Depends(get_effective_user),
) -> list[RuleResponse]:
    """List all compliance rules with current settings."""
    _require_compliance_or_admin(user)

    # Ensure rules are seeded
    seed_default_rules(db)

    rules = (
        db.execute(select(ComplianceRule).order_by(ComplianceRule.sort_order))
        .scalars()
        .all()
    )
    return [
        RuleResponse(
            rule_id=r.rule_id,
            name=r.name,
            description=r.description,
            category=r.category,
            tier=r.tier,
            rule_type=r.rule_type,
            rule_params=r.rule_params,
            document_types=r.document_types,
            default_severity=r.default_severity,
            severity_override=r.severity_override,
            max_deduction=r.max_deduction,
            remediation=r.remediation,
            parent_rule_id=r.parent_rule_id,
            enabled=r.enabled,
            sort_order=r.sort_order,
        )
        for r in rules
    ]


@router.post("/rules", status_code=201)
def create_rule(
    body: RuleCreate,
    db: Session = Depends(get_db),
    user: TokenInfo = Depends(get_effective_user),
) -> RuleResponse:
    """Create a new compliance rule."""
    _require_compliance_or_admin(user)

    # Check uniqueness
    existing = db.execute(
        select(ComplianceRule).where(ComplianceRule.rule_id == body.rule_id)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(409, f"Regel-ID finns redan: {body.rule_id}")

    # Validate
    if body.rule_params:
        _validate_rule_params(body.rule_type, body.rule_params)
    if not body.document_types:
        raise HTTPException(422, "Minst en dokumenttyp måste vara vald")
    invalid_types = set(body.document_types) - VALID_DOCUMENT_TYPES
    if invalid_types:
        raise HTTPException(
            422, f"Ogiltiga dokumenttyper: {', '.join(sorted(invalid_types))}"
        )
    if body.parent_rule_id:
        _validate_parent_rule_id(body.rule_id, body.parent_rule_id, db)

    # Auto-assign sort_order
    max_order = db.execute(
        select(func.max(ComplianceRule.sort_order))
    ).scalar() or 0
    sort_order = max_order + 10

    rule = ComplianceRule(
        rule_id=body.rule_id,
        name=body.name,
        description=body.description,
        category=body.category,
        tier=body.tier,
        rule_type=body.rule_type,
        rule_params=body.rule_params,
        document_types=body.document_types,
        default_severity=body.default_severity,
        max_deduction=body.max_deduction,
        remediation=body.remediation,
        parent_rule_id=body.parent_rule_id,
        enabled=body.enabled,
        sort_order=sort_order,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)

    record_rule_audit(
        db, rule.rule_id, "created", user.effective_username,
        None, rule_to_dict(rule),
    )
    record_audit_event(
        db,
        event_type="rule.created",
        actor=user.effective_username,
        summary=f"Skapade regel {rule.rule_id}",
        target_type="rule",
        target_id=rule.rule_id,
        detail=rule_to_dict(rule),
    )
    db.commit()

    return RuleResponse(
        rule_id=rule.rule_id,
        name=rule.name,
        description=rule.description,
        category=rule.category,
        tier=rule.tier,
        rule_type=rule.rule_type,
        rule_params=rule.rule_params,
        document_types=rule.document_types,
        default_severity=rule.default_severity,
        severity_override=rule.severity_override,
        max_deduction=rule.max_deduction,
        remediation=rule.remediation,
        parent_rule_id=rule.parent_rule_id,
        enabled=rule.enabled,
        sort_order=rule.sort_order,
    )


@router.put("/rules/{rule_id}")
def update_rule(
    rule_id: str,
    body: RuleUpdate,
    db: Session = Depends(get_db),
    user: TokenInfo = Depends(get_effective_user),
) -> RuleResponse:
    """Update a compliance rule's settings."""
    _require_compliance_or_admin(user)

    rule = db.execute(
        select(ComplianceRule).where(ComplianceRule.rule_id == rule_id)
    ).scalar_one_or_none()

    if not rule:
        raise HTTPException(404, f"Rule not found: {rule_id}")

    old_values = rule_to_dict(rule)

    if body.enabled is not None:
        rule.enabled = body.enabled
    if body.severity_override is not None:
        rule.severity_override = (
            body.severity_override if body.severity_override != "default" else None
        )
    if body.name is not None:
        rule.name = body.name
    if body.remediation is not None:
        rule.remediation = body.remediation
    if body.max_deduction is not None:
        rule.max_deduction = body.max_deduction
    if body.description is not None:
        rule.description = body.description
    if body.rule_params is not None:
        _validate_rule_params(rule.rule_type, body.rule_params)
        rule.rule_params = body.rule_params
    if body.document_types is not None:
        if not body.document_types:
            raise HTTPException(422, "Minst en dokumenttyp måste vara vald")
        invalid_types = set(body.document_types) - VALID_DOCUMENT_TYPES
        if invalid_types:
            raise HTTPException(
                422,
                f"Ogiltiga dokumenttyper: {', '.join(sorted(invalid_types))}",
            )
        rule.document_types = body.document_types
    if body.parent_rule_id is not None:
        if body.parent_rule_id == "":
            rule.parent_rule_id = None
        else:
            if body.parent_rule_id == rule_id:
                raise HTTPException(422, "En regel kan inte vara sin egen överordnad")
            _validate_parent_rule_id(rule_id, body.parent_rule_id, db)
            rule.parent_rule_id = body.parent_rule_id

    db.commit()
    db.refresh(rule)

    record_rule_audit(
        db, rule_id, "updated", user.effective_username,
        old_values, rule_to_dict(rule),
    )
    record_audit_event(
        db,
        event_type="rule.updated",
        actor=user.effective_username,
        summary=f"Uppdaterade regel {rule_id}",
        target_type="rule",
        target_id=rule_id,
        detail={"old": old_values, "new": rule_to_dict(rule)},
    )
    db.commit()

    return RuleResponse(
        rule_id=rule.rule_id,
        name=rule.name,
        description=rule.description,
        category=rule.category,
        tier=rule.tier,
        rule_type=rule.rule_type,
        rule_params=rule.rule_params,
        document_types=rule.document_types,
        default_severity=rule.default_severity,
        severity_override=rule.severity_override,
        max_deduction=rule.max_deduction,
        remediation=rule.remediation,
        parent_rule_id=rule.parent_rule_id,
        enabled=rule.enabled,
        sort_order=rule.sort_order,
    )


@router.get("/rules/{rule_id}/history")
def get_rule_history(
    rule_id: str,
    db: Session = Depends(get_db),
    user: TokenInfo = Depends(get_effective_user),
) -> list[AuditEntryResponse]:
    """Get version history for a compliance rule."""
    _require_compliance_or_admin(user)

    entries = (
        db.execute(
            select(ComplianceRuleAudit)
            .where(ComplianceRuleAudit.rule_id == rule_id)
            .order_by(ComplianceRuleAudit.changed_at.desc())
        )
        .scalars()
        .all()
    )
    return [
        AuditEntryResponse(
            id=e.id,
            rule_id=e.rule_id,
            action=e.action,
            changed_by=e.changed_by,
            changed_at=e.changed_at.isoformat(),
            old_values=e.old_values,
            new_values=e.new_values,
        )
        for e in entries
    ]


# ---------------------------------------------------------------------------
# Thresholds (compliance + njorda_admin only)
# ---------------------------------------------------------------------------


@router.get("/thresholds")
def get_thresholds(
    db: Session = Depends(get_db),
    user: TokenInfo = Depends(get_effective_user),
) -> ThresholdsResponse:
    _require_compliance_or_admin(user)
    green = int(
        get_setting(db, "compliance_threshold_green", str(DEFAULT_THRESHOLD_GREEN))
        or DEFAULT_THRESHOLD_GREEN
    )
    yellow = int(
        get_setting(db, "compliance_threshold_yellow", str(DEFAULT_THRESHOLD_YELLOW))
        or DEFAULT_THRESHOLD_YELLOW
    )
    return ThresholdsResponse(green=green, yellow=yellow)


@router.put("/thresholds")
def update_thresholds(
    body: ThresholdsUpdate,
    db: Session = Depends(get_db),
    user: TokenInfo = Depends(get_effective_user),
) -> ThresholdsResponse:
    _require_compliance_or_admin(user)
    if body.green is not None:
        set_setting(db, "compliance_threshold_green", str(body.green))
    if body.yellow is not None:
        set_setting(db, "compliance_threshold_yellow", str(body.yellow))
    _require_compliance_or_admin(user)
    green = int(
        get_setting(db, "compliance_threshold_green", str(DEFAULT_THRESHOLD_GREEN))
        or DEFAULT_THRESHOLD_GREEN
    )
    yellow = int(
        get_setting(db, "compliance_threshold_yellow", str(DEFAULT_THRESHOLD_YELLOW))
        or DEFAULT_THRESHOLD_YELLOW
    )
    return ThresholdsResponse(green=green, yellow=yellow)


# ---------------------------------------------------------------------------
# Document compliance (all roles, advisor restricted to own docs)
# ---------------------------------------------------------------------------


@router.get("/documents/{document_id}")
async def get_document_compliance(
    document_id: int,
    db: Session = Depends(get_db),
    user: TokenInfo = Depends(get_effective_user),
) -> ComplianceReport:
    """Get compliance report for a document. Runs checks if not yet done."""
    doc = db.execute(
        select(Document).where(Document.id == document_id)
    ).scalar_one_or_none()

    if not doc:
        raise HTTPException(404, "Document not found")

    _check_doc_access(doc, user)

    # If already checked, reconstruct report from stored findings
    if doc.compliance_status is not None:
        return _build_report_from_stored(document_id, db)

    # Otherwise run checks
    return await _run_compliance_check(doc, db)


@router.post("/documents/{document_id}/recheck")
async def recheck_document_compliance(
    document_id: int,
    db: Session = Depends(get_db),
    user: TokenInfo = Depends(get_effective_user),
) -> ComplianceReport:
    """Re-run compliance checks for a document."""
    doc = db.execute(
        select(Document).where(Document.id == document_id)
    ).scalar_one_or_none()

    if not doc:
        raise HTTPException(404, "Document not found")

    _check_doc_access(doc, user)

    return await _run_compliance_check(doc, db)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def run_compliance_for_document(doc: Document, db: Session) -> ComplianceReport | None:
    """Run compliance checks for a document. Called from extraction pipeline."""
    return await _run_compliance_check(doc, db)


async def _run_compliance_check(doc: Document, db: Session) -> ComplianceReport:
    """Internal: run checks, store results, update document."""
    # Ensure rules are seeded
    seed_default_rules(db)

    # Get the latest extraction
    extraction_row = db.execute(
        select(DocumentExtraction)
        .where(DocumentExtraction.document_id == doc.id)
        .where(DocumentExtraction.status == "completed")
        .order_by(DocumentExtraction.created_at.desc())
    ).scalar_one_or_none()

    if not extraction_row or not extraction_row.extraction_data:
        raise HTTPException(400, "No completed extraction found for this document")

    # Reconstruct ExtractionResult from stored JSON
    extraction = ExtractionResult(**extraction_row.extraction_data)
    document_type = (
        extraction.document_type.value if extraction.document_type else "unknown"
    )

    # Get applicable rules
    rules = get_rules_for_document(document_type, db)

    # Run checks
    report = await check_document(extraction, rules, db)

    # Clear previous findings
    db.execute(delete(ComplianceFinding).where(ComplianceFinding.document_id == doc.id))

    # Store new findings
    for outcome in report.outcomes:
        findings_data = None
        if outcome.findings:
            findings_data = [f.model_dump() for f in outcome.findings]

        db.add(
            ComplianceFinding(
                document_id=doc.id,
                rule_id=outcome.rule_id,
                status=outcome.status,
                severity=outcome.severity,
                tier=outcome.tier,
                findings_json=findings_data,
            )
        )

    # Update denormalized fields
    doc.compliance_status = report.status
    doc.compliance_score = report.score
    doc.compliance_summary = report.summary.model_dump()

    db.commit()
    return report


def _build_report_from_stored(document_id: int, db: Session) -> ComplianceReport:
    """Reconstruct a ComplianceReport from stored findings."""
    from src.compliance.models import ComplianceSummary, Finding, RuleOutcome

    findings = (
        db.execute(
            select(ComplianceFinding).where(
                ComplianceFinding.document_id == document_id
            )
        )
        .scalars()
        .all()
    )

    # Look up rule metadata for each finding
    rule_ids = [f.rule_id for f in findings]
    rules = {
        r.rule_id: r
        for r in db.execute(
            select(ComplianceRule).where(ComplianceRule.rule_id.in_(rule_ids))
        )
        .scalars()
        .all()
    }

    outcomes = []
    for f in findings:
        rule = rules.get(f.rule_id)
        finding_objects = []
        if f.findings_json:
            finding_objects = [Finding(**fd) for fd in f.findings_json]

        outcomes.append(
            RuleOutcome(
                rule_id=f.rule_id,
                rule_name=rule.name if rule else f.rule_id,
                category=rule.category if rule else "unknown",
                tier=f.tier,
                rule_type=rule.rule_type if rule else "unknown",
                status=cast(Literal["passed", "failed", "skipped"], f.status),
                severity=f.severity,
                findings=finding_objects,
                remediation=rule.remediation if rule and f.status == "failed" else None,
            )
        )

    # Get document for denormalized values
    doc = db.execute(select(Document).where(Document.id == document_id)).scalar_one()

    score = doc.compliance_score or 0
    status = cast(Literal["green", "yellow", "red"], doc.compliance_status or "red")
    summary_data = doc.compliance_summary or {}

    return ComplianceReport(
        outcomes=outcomes,
        score=score,
        status=status,
        summary=ComplianceSummary(
            total_rules=summary_data.get("total_rules", len(outcomes)),
            passed=summary_data.get("passed", 0),
            failed=summary_data.get("failed", 0),
            skipped=summary_data.get("skipped", 0),
            warnings=summary_data.get("warnings", 0),
            errors=summary_data.get("errors", 0),
        ),
    )
