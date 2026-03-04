"""Helpers for recording system-wide audit events."""

from __future__ import annotations

from sqlalchemy.orm import Session

from src.models.audit_event import AuditEvent


def record_audit_event(
    db: Session,
    *,
    event_type: str,
    actor: str,
    summary: str,
    target_type: str | None = None,
    target_id: str | None = None,
    detail: dict | None = None,
) -> AuditEvent:
    """Create an audit event and flush (but don't commit) so the caller controls the transaction."""
    event = AuditEvent(
        event_type=event_type,
        actor=actor,
        summary=summary,
        target_type=target_type,
        target_id=target_id,
        detail=detail,
    )
    db.add(event)
    db.flush()
    return event
