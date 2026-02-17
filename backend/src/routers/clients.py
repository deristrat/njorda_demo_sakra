"""Clients endpoints — list, detail, and per-client documents."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from src.database import get_db
from src.models.client import Client
from src.models.document import Document

router = APIRouter(prefix="/api", tags=["clients"])


@router.get("/clients")
def list_clients(db: Session = Depends(get_db)):
    """List all clients with aggregated document stats."""
    # Subquery for per-client aggregates
    doc_stats = (
        select(
            Document.client_id,
            func.count(Document.id).label("document_count"),
            func.count()
            .filter(Document.compliance_status == "red")
            .label("compliance_issues"),
            func.max(Document.created_at).label("latest_document_date"),
        )
        .where(Document.client_id.is_not(None))
        .group_by(Document.client_id)
        .subquery()
    )

    rows = db.execute(
        select(
            Client,
            func.coalesce(doc_stats.c.document_count, 0).label("document_count"),
            func.coalesce(doc_stats.c.compliance_issues, 0).label(
                "compliance_issues"
            ),
            doc_stats.c.latest_document_date,
        ).outerjoin(doc_stats, Client.id == doc_stats.c.client_id)
    ).all()

    return [
        {
            "id": client.id,
            "person_number": client.person_number,
            "person_name": client.person_name,
            "email": client.email,
            "phone": client.phone,
            "document_count": doc_count,
            "compliance_issues": issues,
            "latest_document_date": (
                latest_date.isoformat() if latest_date else None
            ),
        }
        for client, doc_count, issues, latest_date in rows
    ]


@router.get("/clients/{client_id}")
def get_client(client_id: int, db: Session = Depends(get_db)):
    """Get client detail with all fields."""
    client = db.execute(
        select(Client).where(Client.id == client_id)
    ).scalar_one_or_none()

    if not client:
        raise HTTPException(404, "Client not found")

    return {
        "id": client.id,
        "person_number": client.person_number,
        "person_name": client.person_name,
        "address": client.address,
        "email": client.email,
        "phone": client.phone,
        "created_at": client.created_at.isoformat(),
        "updated_at": client.updated_at.isoformat(),
    }


@router.get("/clients/{client_id}/documents")
def get_client_documents(client_id: int, db: Session = Depends(get_db)):
    """Get all documents for a specific client."""
    # Verify client exists
    client = db.execute(
        select(Client).where(Client.id == client_id)
    ).scalar_one_or_none()
    if not client:
        raise HTTPException(404, "Client not found")

    from src.routers.documents import _doc_summary

    from sqlalchemy.orm import joinedload

    docs = (
        db.execute(
            select(Document)
            .options(joinedload(Document.extractions))
            .where(Document.client_id == client_id)
            .order_by(Document.created_at.desc())
        )
        .unique()
        .scalars()
        .all()
    )

    return [_doc_summary(doc) for doc in docs]
