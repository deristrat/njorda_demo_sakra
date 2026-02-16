"""Compliance engine — runs rules against extracted document data."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from src.compliance.models import (
    ComplianceReport,
    ComplianceSummary,
    Finding,
    RuleOutcome,
)
from src.compliance.rule_types import get_rule_type
from src.extraction.models import ExtractionResult
from src.models.app_settings import get_setting
from src.models.compliance import ComplianceRule


# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------

DEFAULT_THRESHOLD_GREEN = 85
DEFAULT_THRESHOLD_YELLOW = 50


# ---------------------------------------------------------------------------
# Rule loading
# ---------------------------------------------------------------------------


def get_rules_for_document(
    document_type: str,
    db: Session,
) -> list[ComplianceRule]:
    """Return enabled rules applicable to this document type.

    Rules are ordered so parents come before children (by parent_rule_id nulls
    first, then sort_order).
    """
    all_rules = (
        db.execute(
            select(ComplianceRule)
            .where(ComplianceRule.enabled.is_(True))
            .order_by(
                # Parents first (null parent_rule_id), then children
                ComplianceRule.parent_rule_id.is_(None).desc(),
                ComplianceRule.sort_order,
            )
        )
        .scalars()
        .all()
    )

    # Filter to rules whose document_types includes this type or "all"
    applicable = []
    for rule in all_rules:
        doc_types = rule.document_types or []
        if "all" in doc_types or document_type in doc_types:
            applicable.append(rule)

    return applicable


# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------


def check_document(
    extraction: ExtractionResult,
    rules: list[ComplianceRule],
    db: Session,
) -> ComplianceReport:
    """Run all rules against the extraction data.

    Handles parent-child hierarchy: if a parent rule fails (has findings),
    its children are skipped.
    """
    # Track which rules have failed (produced findings)
    failed_rule_ids: set[str] = set()
    outcomes: list[RuleOutcome] = []

    for rule in rules:
        effective_severity = rule.severity_override or rule.default_severity

        # Check parent hierarchy — skip if parent has findings
        if rule.parent_rule_id and rule.parent_rule_id in failed_rule_ids:
            outcomes.append(
                RuleOutcome(
                    rule_id=rule.rule_id,
                    rule_name=rule.name,
                    category=rule.category,
                    tier=rule.tier,
                    rule_type=rule.rule_type,
                    status="skipped",
                    severity=effective_severity,
                )
            )
            continue

        # Run the rule type implementation
        try:
            rule_type_fn = get_rule_type(rule.rule_type)
            findings: list[Finding] = rule_type_fn(
                extraction, rule.rule_params or {}, rule.name
            )
        except NotImplementedError:
            # Custom rules with no implementation — skip
            outcomes.append(
                RuleOutcome(
                    rule_id=rule.rule_id,
                    rule_name=rule.name,
                    category=rule.category,
                    tier=rule.tier,
                    rule_type=rule.rule_type,
                    status="skipped",
                    severity=effective_severity,
                )
            )
            continue

        if findings:
            failed_rule_ids.add(rule.rule_id)
            outcomes.append(
                RuleOutcome(
                    rule_id=rule.rule_id,
                    rule_name=rule.name,
                    category=rule.category,
                    tier=rule.tier,
                    rule_type=rule.rule_type,
                    status="failed",
                    severity=effective_severity,
                    findings=findings,
                    remediation=rule.remediation,
                )
            )
        else:
            outcomes.append(
                RuleOutcome(
                    rule_id=rule.rule_id,
                    rule_name=rule.name,
                    category=rule.category,
                    tier=rule.tier,
                    rule_type=rule.rule_type,
                    status="passed",
                    severity=effective_severity,
                )
            )

    # Compute score
    total_deduction = sum(
        rule.max_deduction
        for rule, outcome in zip(rules, outcomes)
        if outcome.status == "failed"
    )
    score = max(0, 100 - total_deduction)

    # Get thresholds
    threshold_green = int(
        get_setting(db, "compliance_threshold_green", str(DEFAULT_THRESHOLD_GREEN))
        or DEFAULT_THRESHOLD_GREEN
    )
    threshold_yellow = int(
        get_setting(db, "compliance_threshold_yellow", str(DEFAULT_THRESHOLD_YELLOW))
        or DEFAULT_THRESHOLD_YELLOW
    )

    if score >= threshold_green:
        status = "green"
    elif score >= threshold_yellow:
        status = "yellow"
    else:
        status = "red"

    # Build summary
    passed = sum(1 for o in outcomes if o.status == "passed")
    failed = sum(1 for o in outcomes if o.status == "failed")
    skipped = sum(1 for o in outcomes if o.status == "skipped")
    warnings = sum(
        1 for o in outcomes if o.status == "failed" and o.severity == "warning"
    )
    errors = sum(1 for o in outcomes if o.status == "failed" and o.severity == "error")

    return ComplianceReport(
        outcomes=outcomes,
        score=score,
        status=status,
        summary=ComplianceSummary(
            total_rules=len(outcomes),
            passed=passed,
            failed=failed,
            skipped=skipped,
            warnings=warnings,
            errors=errors,
        ),
    )
