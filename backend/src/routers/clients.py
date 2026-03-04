"""Clients endpoints — list, detail, and per-client documents."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import exists, func, select
from sqlalchemy.orm import Session, joinedload

from src.auth import TokenInfo, get_effective_user
from src.database import get_db
from src.models.client import Client
from src.models.document import Document

router = APIRouter(prefix="/api", tags=["clients"])


def _advisor_client_filter(user: TokenInfo):
    """Subquery: clients that have at least one document belonging to this advisor."""
    return exists().where(
        Document.client_id == Client.id,
        Document.advisor_id == user.effective_advisor_id,
    )


@router.get("/clients")
def list_clients(
    db: Session = Depends(get_db),
    user: TokenInfo = Depends(get_effective_user),
):
    """List all clients with aggregated document stats."""
    # Subquery for per-client aggregates
    doc_stats = (
        select(
            Document.client_id,
            func.count(Document.id).label("document_count"),
            func.count()
            .filter(Document.compliance_status == "red")
            .label("compliance_issues_red"),
            func.count()
            .filter(Document.compliance_status == "yellow")
            .label("compliance_issues_yellow"),
            func.max(Document.created_at).label("latest_document_date"),
        )
        .where(Document.client_id.is_not(None))
    )

    # Advisor: only count their own docs
    if user.effective_role == "advisor":
        doc_stats = doc_stats.where(Document.advisor_id == user.effective_advisor_id)

    doc_stats = doc_stats.group_by(Document.client_id).subquery()

    query = select(
        Client,
        func.coalesce(doc_stats.c.document_count, 0).label("document_count"),
        func.coalesce(doc_stats.c.compliance_issues_red, 0).label("compliance_issues_red"),
        func.coalesce(doc_stats.c.compliance_issues_yellow, 0).label("compliance_issues_yellow"),
        doc_stats.c.latest_document_date,
    ).outerjoin(doc_stats, Client.id == doc_stats.c.client_id)

    # Advisor: only clients linked via their documents
    if user.effective_role == "advisor":
        query = query.where(_advisor_client_filter(user))

    rows = db.execute(query).all()

    return [
        {
            "id": client.id,
            "person_number": client.person_number,
            "person_name": client.person_name,
            "email": client.email,
            "phone": client.phone,
            "document_count": doc_count,
            "compliance_issues_red": red,
            "compliance_issues_yellow": yellow,
            "latest_document_date": (
                latest_date.isoformat() if latest_date else None
            ),
        }
        for client, doc_count, red, yellow, latest_date in rows
    ]


@router.get("/clients/{client_id}")
def get_client(
    client_id: int,
    db: Session = Depends(get_db),
    user: TokenInfo = Depends(get_effective_user),
):
    """Get client detail with all fields."""
    client = db.execute(
        select(Client).where(Client.id == client_id)
    ).scalar_one_or_none()

    if not client:
        raise HTTPException(404, "Client not found")

    # Advisor: verify client is linked via their docs
    if user.effective_role == "advisor":
        has_doc = db.execute(
            select(Document.id).where(
                Document.client_id == client_id,
                Document.advisor_id == user.effective_advisor_id,
            ).limit(1)
        ).scalar_one_or_none()
        if not has_doc:
            raise HTTPException(403, "Åtkomst nekad")

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
def get_client_documents(
    client_id: int,
    db: Session = Depends(get_db),
    user: TokenInfo = Depends(get_effective_user),
):
    """Get all documents for a specific client."""
    # Verify client exists
    client = db.execute(
        select(Client).where(Client.id == client_id)
    ).scalar_one_or_none()
    if not client:
        raise HTTPException(404, "Client not found")

    from src.routers.documents import _doc_summary

    query = (
        select(Document)
        .options(joinedload(Document.extractions))
        .where(Document.client_id == client_id)
        .order_by(Document.created_at.desc())
    )

    # Advisor: only their docs for this client
    if user.effective_role == "advisor":
        query = query.where(Document.advisor_id == user.effective_advisor_id)

    docs = db.execute(query).unique().scalars().all()

    return [_doc_summary(doc) for doc in docs]
