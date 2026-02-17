"""Advisors endpoints — list, detail, and per-advisor documents."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import distinct, func, select
from sqlalchemy.orm import Session, joinedload

from src.database import get_db
from src.models.advisor import Advisor
from src.models.document import Document

router = APIRouter(prefix="/api", tags=["advisors"])


@router.get("/advisors")
def list_advisors(db: Session = Depends(get_db)):
    """List all advisors with aggregated stats."""
    doc_stats = (
        select(
            Document.advisor_id,
            func.count(Document.id).label("document_count"),
            func.count(distinct(Document.client_id)).label("client_count"),
            func.avg(Document.compliance_score)
            .filter(Document.status == "completed")
            .label("avg_compliance_score"),
            func.count(distinct(Document.client_id))
            .filter(Document.compliance_status == "red")
            .label("clients_with_issues"),
            func.max(Document.created_at).label("latest_document_date"),
        )
        .where(Document.advisor_id.is_not(None))
        .group_by(Document.advisor_id)
        .subquery()
    )

    rows = db.execute(
        select(
            Advisor,
            func.coalesce(doc_stats.c.document_count, 0).label("document_count"),
            func.coalesce(doc_stats.c.client_count, 0).label("client_count"),
            doc_stats.c.avg_compliance_score,
            func.coalesce(doc_stats.c.clients_with_issues, 0).label(
                "clients_with_issues"
            ),
            doc_stats.c.latest_document_date,
        ).outerjoin(doc_stats, Advisor.id == doc_stats.c.advisor_id)
    ).all()

    return [
        {
            "id": advisor.id,
            "advisor_name": advisor.advisor_name,
            "firm_name": advisor.firm_name,
            "license_number": advisor.license_number,
            "document_count": doc_count,
            "client_count": client_count,
            "avg_compliance_score": (
                round(avg_score) if avg_score is not None else None
            ),
            "clients_with_issues": issues,
            "latest_document_date": (
                latest_date.isoformat() if latest_date else None
            ),
        }
        for advisor, doc_count, client_count, avg_score, issues, latest_date in rows
    ]


@router.get("/advisors/{advisor_id}")
def get_advisor(advisor_id: int, db: Session = Depends(get_db)):
    """Get advisor detail with all fields."""
    advisor = db.execute(
        select(Advisor).where(Advisor.id == advisor_id)
    ).scalar_one_or_none()

    if not advisor:
        raise HTTPException(404, "Advisor not found")

    return {
        "id": advisor.id,
        "advisor_name": advisor.advisor_name,
        "firm_name": advisor.firm_name,
        "license_number": advisor.license_number,
        "created_at": advisor.created_at.isoformat(),
        "updated_at": advisor.updated_at.isoformat(),
    }


@router.get("/advisors/{advisor_id}/documents")
def get_advisor_documents(advisor_id: int, db: Session = Depends(get_db)):
    """Get all documents for a specific advisor."""
    advisor = db.execute(
        select(Advisor).where(Advisor.id == advisor_id)
    ).scalar_one_or_none()
    if not advisor:
        raise HTTPException(404, "Advisor not found")

    from src.routers.documents import _doc_summary

    docs = (
        db.execute(
            select(Document)
            .options(joinedload(Document.extractions))
            .where(Document.advisor_id == advisor_id)
            .order_by(Document.created_at.desc())
        )
        .unique()
        .scalars()
        .all()
    )

    return [_doc_summary(doc) for doc in docs]
