"""Compliance rules management and document compliance endpoints."""

from __future__ import annotations

from typing import cast, Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

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
from src.models.compliance import ComplianceFinding, ComplianceRule
from src.models.document import Document, DocumentExtraction

router = APIRouter(prefix="/api/compliance", tags=["compliance"])


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


class ThresholdsResponse(BaseModel):
    green: int
    yellow: int


class ThresholdsUpdate(BaseModel):
    green: int | None = None
    yellow: int | None = None


# ---------------------------------------------------------------------------
# Rules management
# ---------------------------------------------------------------------------


@router.get("/rules")
def list_rules(db: Session = Depends(get_db)) -> list[RuleResponse]:
    """List all compliance rules with current settings."""
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


@router.put("/rules/{rule_id}")
def update_rule(
    rule_id: str,
    body: RuleUpdate,
    db: Session = Depends(get_db),
) -> RuleResponse:
    """Update a compliance rule's settings."""
    rule = db.execute(
        select(ComplianceRule).where(ComplianceRule.rule_id == rule_id)
    ).scalar_one_or_none()

    if not rule:
        raise HTTPException(404, f"Rule not found: {rule_id}")

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

    db.commit()
    db.refresh(rule)

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


# ---------------------------------------------------------------------------
# Thresholds
# ---------------------------------------------------------------------------


@router.get("/thresholds")
def get_thresholds(db: Session = Depends(get_db)) -> ThresholdsResponse:
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
) -> ThresholdsResponse:
    if body.green is not None:
        set_setting(db, "compliance_threshold_green", str(body.green))
    if body.yellow is not None:
        set_setting(db, "compliance_threshold_yellow", str(body.yellow))
    return get_thresholds(db)


# ---------------------------------------------------------------------------
# Document compliance
# ---------------------------------------------------------------------------


@router.get("/documents/{document_id}")
def get_document_compliance(
    document_id: int,
    db: Session = Depends(get_db),
) -> ComplianceReport:
    """Get compliance report for a document. Runs checks if not yet done."""
    doc = db.execute(
        select(Document).where(Document.id == document_id)
    ).scalar_one_or_none()

    if not doc:
        raise HTTPException(404, "Document not found")

    # If already checked, reconstruct report from stored findings
    if doc.compliance_status is not None:
        return _build_report_from_stored(document_id, db)

    # Otherwise run checks
    return _run_compliance_check(doc, db)


@router.post("/documents/{document_id}/recheck")
def recheck_document_compliance(
    document_id: int,
    db: Session = Depends(get_db),
) -> ComplianceReport:
    """Re-run compliance checks for a document."""
    doc = db.execute(
        select(Document).where(Document.id == document_id)
    ).scalar_one_or_none()

    if not doc:
        raise HTTPException(404, "Document not found")

    return _run_compliance_check(doc, db)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def run_compliance_for_document(doc: Document, db: Session) -> ComplianceReport | None:
    """Run compliance checks for a document. Called from extraction pipeline."""
    return _run_compliance_check(doc, db)


def _run_compliance_check(doc: Document, db: Session) -> ComplianceReport:
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
    report = check_document(extraction, rules, db)

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
