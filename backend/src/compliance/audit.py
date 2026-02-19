"""Audit trail helpers for compliance rule changes."""

from __future__ import annotations

from sqlalchemy.orm import Session

from src.models.compliance import ComplianceRule, ComplianceRuleAudit


def rule_to_dict(rule: ComplianceRule) -> dict:
    """Snapshot editable fields of a rule."""
    return {
        "name": rule.name,
        "description": rule.description,
        "enabled": rule.enabled,
        "severity_override": rule.severity_override,
        "max_deduction": rule.max_deduction,
        "remediation": rule.remediation,
        "rule_params": rule.rule_params,
        "document_types": rule.document_types,
        "parent_rule_id": rule.parent_rule_id,
    }


def record_rule_audit(
    db: Session,
    rule_id: str,
    action: str,
    changed_by: str,
    old_values: dict | None,
    new_values: dict,
) -> None:
    """Create an audit entry for a rule change."""
    db.add(
        ComplianceRuleAudit(
            rule_id=rule_id,
            action=action,
            changed_by=changed_by,
            old_values=old_values,
            new_values=new_values,
        )
    )
