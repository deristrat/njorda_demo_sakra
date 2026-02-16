"""Pydantic models for compliance checking."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel


class Finding(BaseModel):
    """A single issue found by a compliance rule."""

    message: str
    context: dict[str, Any] | None = None


class RuleOutcome(BaseModel):
    """Result of running one rule against one document."""

    rule_id: str
    rule_name: str
    category: str
    tier: int
    rule_type: str
    status: Literal["passed", "failed", "skipped"]
    severity: str
    findings: list[Finding] = []
    remediation: str | None = None


class ComplianceSummary(BaseModel):
    total_rules: int
    passed: int
    failed: int
    skipped: int
    warnings: int  # failed with severity=warning
    errors: int  # failed with severity=error


class ComplianceReport(BaseModel):
    outcomes: list[RuleOutcome]
    score: int  # 0-100
    status: Literal["green", "yellow", "red"]
    summary: ComplianceSummary
