"""System-wide audit log endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from src.auth import TokenInfo, get_effective_user
from src.database import get_db
from src.models.audit_event import AuditEvent

router = APIRouter(prefix="/api/audit", tags=["audit"])


def _require_compliance_or_admin(user: TokenInfo) -> None:
    if user.effective_role not in ("compliance", "njorda_admin"):
        raise HTTPException(403, "Åtkomst nekad")


@router.get("")
def list_audit_events(
    event_type: str | None = Query(None),
    search: str | None = Query(None),
    db: Session = Depends(get_db),
    user: TokenInfo = Depends(get_effective_user),
) -> list[dict]:
    """List audit events, newest first. Optional filters: event_type, search."""
    _require_compliance_or_admin(user)

    query = select(AuditEvent).order_by(AuditEvent.created_at.desc())

    if event_type:
        query = query.where(AuditEvent.event_type == event_type)

    if search:
        pattern = f"%{search}%"
        query = query.where(
            or_(
                AuditEvent.summary.ilike(pattern),
                AuditEvent.actor.ilike(pattern),
                AuditEvent.target_id.ilike(pattern),
            )
        )

    events = db.execute(query).scalars().all()
    return [
        {
            "id": e.id,
            "event_type": e.event_type,
            "actor": e.actor,
            "target_type": e.target_type,
            "target_id": e.target_id,
            "summary": e.summary,
            "created_at": e.created_at.isoformat(),
        }
        for e in events
    ]


@router.get("/{event_id}")
def get_audit_event(
    event_id: int,
    db: Session = Depends(get_db),
    user: TokenInfo = Depends(get_effective_user),
) -> dict:
    """Get a single audit event with full detail."""
    _require_compliance_or_admin(user)

    event = db.execute(
        select(AuditEvent).where(AuditEvent.id == event_id)
    ).scalar_one_or_none()

    if not event:
        raise HTTPException(404, "Händelse hittades inte")

    return {
        "id": event.id,
        "event_type": event.event_type,
        "actor": event.actor,
        "target_type": event.target_type,
        "target_id": event.target_id,
        "summary": event.summary,
        "detail": event.detail,
        "created_at": event.created_at.isoformat(),
    }
