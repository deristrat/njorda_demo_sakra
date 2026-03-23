"""Compliance engine — runs rules against extracted document data."""

from __future__ import annotations

import asyncio
import inspect
import logging
import time

from sqlalchemy import select
from sqlalchemy.orm import Session

log = logging.getLogger(__name__)

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


async def check_document(
    extraction: ExtractionResult,
    rules: list[ComplianceRule],
    db: Session,
) -> ComplianceReport:
    """Run all rules against the extraction data.

    Handles parent-child hierarchy: if a parent rule fails (has findings),
    its children are skipped.

    Sync rules (require_field, etc.) run first. Then async AI rules that
    aren't blocked by a failed parent are dispatched in parallel.
    """
    t_start = time.perf_counter()
    log.info("Compliance check starting — %d rules to evaluate", len(rules))

    # Track which rules have failed (produced findings)
    failed_rule_ids: set[str] = set()
    # Outcome per rule_id, preserving original order
    outcome_map: dict[str, RuleOutcome] = {}

    # --- Phase 1: run all sync rules sequentially ---
    deferred_async: list[ComplianceRule] = []
    t_sync = time.perf_counter()

    for rule in rules:
        effective_severity = rule.severity_override or rule.default_severity
        rule_type_fn = get_rule_type(rule.rule_type)

        # Async rules are deferred to phase 2
        if inspect.iscoroutinefunction(rule_type_fn):
            deferred_async.append(rule)
            continue

        # Check parent hierarchy — skip if parent has findings
        if rule.parent_rule_id and rule.parent_rule_id in failed_rule_ids:
            outcome_map[rule.rule_id] = RuleOutcome(
                rule_id=rule.rule_id,
                rule_name=rule.name,
                category=rule.category,
                tier=rule.tier,
                rule_type=rule.rule_type,
                status="skipped",
                severity=effective_severity,
            )
            continue

        # Run sync rule
        try:
            findings: list[Finding] = rule_type_fn(
                extraction, rule.rule_params or {}, rule.name
            )
        except NotImplementedError:
            outcome_map[rule.rule_id] = RuleOutcome(
                rule_id=rule.rule_id,
                rule_name=rule.name,
                category=rule.category,
                tier=rule.tier,
                rule_type=rule.rule_type,
                status="skipped",
                severity=effective_severity,
            )
            continue

        if findings:
            failed_rule_ids.add(rule.rule_id)
            outcome_map[rule.rule_id] = RuleOutcome(
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
        else:
            outcome_map[rule.rule_id] = RuleOutcome(
                rule_id=rule.rule_id,
                rule_name=rule.name,
                category=rule.category,
                tier=rule.tier,
                rule_type=rule.rule_type,
                status="passed",
                severity=effective_severity,
            )

    sync_count = len(outcome_map)
    log.info(
        "Phase 1 done — %d sync rules in %.1fms, %d deferred to async",
        sync_count, (time.perf_counter() - t_sync) * 1000, len(deferred_async),
    )

    # --- Phase 2: run async (AI) rules in parallel ---
    async_to_run: list[ComplianceRule] = []
    for rule in deferred_async:
        effective_severity = rule.severity_override or rule.default_severity
        if rule.parent_rule_id and rule.parent_rule_id in failed_rule_ids:
            outcome_map[rule.rule_id] = RuleOutcome(
                rule_id=rule.rule_id,
                rule_name=rule.name,
                category=rule.category,
                tier=rule.tier,
                rule_type=rule.rule_type,
                status="skipped",
                severity=effective_severity,
            )
        else:
            async_to_run.append(rule)

    if async_to_run:
        log.info(
            "Phase 2 — launching %d AI rules in parallel: %s",
            len(async_to_run), [r.rule_id for r in async_to_run],
        )
        t_async = time.perf_counter()

        async def _run_one(rule: ComplianceRule) -> tuple[str, list[Finding]]:
            t0 = time.perf_counter()
            rule_type_fn = get_rule_type(rule.rule_type)
            try:
                result = await rule_type_fn(
                    extraction, rule.rule_params or {}, rule.name
                )
                log.info("  AI rule %s completed in %.1fms", rule.rule_id, (time.perf_counter() - t0) * 1000)
                return rule.rule_id, result
            except Exception:
                log.warning("  AI rule %s failed in %.1fms", rule.rule_id, (time.perf_counter() - t0) * 1000)
                return rule.rule_id, []

        results = await asyncio.gather(*[_run_one(r) for r in async_to_run])
        log.info(
            "Phase 2 done — %d AI rules in %.1fms (parallel)",
            len(async_to_run), (time.perf_counter() - t_async) * 1000,
        )

        for rule, (rule_id, findings) in zip(async_to_run, results):
            effective_severity = rule.severity_override or rule.default_severity
            if findings:
                failed_rule_ids.add(rule.rule_id)
                outcome_map[rule.rule_id] = RuleOutcome(
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
            else:
                outcome_map[rule.rule_id] = RuleOutcome(
                    rule_id=rule.rule_id,
                    rule_name=rule.name,
                    category=rule.category,
                    tier=rule.tier,
                    rule_type=rule.rule_type,
                    status="passed",
                    severity=effective_severity,
                )

    # Rebuild outcomes in original rule order
    outcomes = [outcome_map[rule.rule_id] for rule in rules]

    log.info(
        "Compliance check done in %.1fms — score=%d, passed=%d, failed=%d, skipped=%d",
        (time.perf_counter() - t_start) * 1000,
        max(0, 100 - sum(r.max_deduction for r, o in zip(rules, outcomes) if o.status == "failed")),
        sum(1 for o in outcomes if o.status == "passed"),
        sum(1 for o in outcomes if o.status == "failed"),
        sum(1 for o in outcomes if o.status == "skipped"),
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
