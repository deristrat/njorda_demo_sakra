"""Tool definitions and executors for the AI chat assistant."""

from __future__ import annotations

import json
from typing import Any

from sqlalchemy import distinct, exists, func, select
from sqlalchemy.orm import Session, joinedload

from src.auth import TokenInfo
from src.models.advisor import Advisor
from src.models.client import Client
from src.models.document import Document, DocumentExtraction

# ---------------------------------------------------------------------------
# Tool definitions (Anthropic format)
# ---------------------------------------------------------------------------

TOOL_DEFINITIONS: list[dict] = [
    {
        "name": "list_clients",
        "description": "Lista alla klienter som rådgivaren har dokument för, med antal dokument och compliance-problem.",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "get_client_detail",
        "description": "Hämta detaljerad information om en specifik klient.",
        "input_schema": {
            "type": "object",
            "properties": {
                "client_id": {
                    "type": "integer",
                    "description": "Klientens ID",
                },
            },
            "required": ["client_id"],
        },
    },
    {
        "name": "get_client_documents",
        "description": "Hämta alla dokument för en specifik klient.",
        "input_schema": {
            "type": "object",
            "properties": {
                "client_id": {
                    "type": "integer",
                    "description": "Klientens ID",
                },
            },
            "required": ["client_id"],
        },
    },
    {
        "name": "list_documents",
        "description": "Lista alla dokument som rådgivaren har tillgång till.",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "get_document_detail",
        "description": "Hämta detaljerad information om ett specifikt dokument inklusive extraktionsdata.",
        "input_schema": {
            "type": "object",
            "properties": {
                "document_id": {
                    "type": "integer",
                    "description": "Dokumentets ID",
                },
            },
            "required": ["document_id"],
        },
    },
    {
        "name": "get_document_compliance",
        "description": "Hämta compliance-rapport för ett specifikt dokument med regelutfall och poäng.",
        "input_schema": {
            "type": "object",
            "properties": {
                "document_id": {
                    "type": "integer",
                    "description": "Dokumentets ID",
                },
            },
            "required": ["document_id"],
        },
    },
]


# ---------------------------------------------------------------------------
# Extra tools for compliance / admin roles
# ---------------------------------------------------------------------------

COMPLIANCE_EXTRA_TOOLS: list[dict] = [
    {
        "name": "list_advisors",
        "description": "Lista alla rådgivare med compliance-statistik (antal dokument, klienter, snittpoäng, klienter med avvikelser).",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "get_advisor_documents",
        "description": "Hämta alla dokument för en specifik rådgivare.",
        "input_schema": {
            "type": "object",
            "properties": {
                "advisor_id": {
                    "type": "integer",
                    "description": "Rådgivarens ID",
                },
            },
            "required": ["advisor_id"],
        },
    },
]


def get_tools_for_role(role: str) -> list[dict]:
    """Return tool definitions appropriate for the given role."""
    if role == "advisor":
        return TOOL_DEFINITIONS
    return TOOL_DEFINITIONS + COMPLIANCE_EXTRA_TOOLS


# ---------------------------------------------------------------------------
# Tool executors
# ---------------------------------------------------------------------------


def _advisor_client_filter(user: TokenInfo):
    return exists().where(
        Document.client_id == Client.id,
        Document.advisor_id == user.effective_advisor_id,
    )


def _doc_summary(doc: Document) -> dict:
    from src.routers.documents import _doc_summary as _router_doc_summary
    return _router_doc_summary(doc)


def execute_tool(
    tool_name: str,
    tool_input: dict[str, Any],
    db: Session,
    user: TokenInfo,
) -> str:
    """Execute a tool and return JSON string result for the LLM."""
    try:
        result = _EXECUTORS[tool_name](tool_input, db, user)
        return json.dumps(result, ensure_ascii=False, default=str)
    except KeyError:
        return json.dumps({"error": f"Okänt verktyg: {tool_name}"})
    except Exception as e:
        return json.dumps({"error": str(e)})


def _list_clients(_input: dict, db: Session, user: TokenInfo) -> Any:
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

    if user.effective_role == "advisor":
        query = query.where(_advisor_client_filter(user))

    rows = db.execute(query).all()
    return [
        {
            "id": c.id,
            "person_number": c.person_number,
            "person_name": c.person_name,
            "email": c.email,
            "phone": c.phone,
            "document_count": dc,
            "compliance_issues_red": red,
            "compliance_issues_yellow": yellow,
            "latest_document_date": ld.isoformat() if ld else None,
        }
        for c, dc, red, yellow, ld in rows
    ]


def _get_client_detail(input: dict, db: Session, user: TokenInfo) -> Any:
    client_id = input["client_id"]
    client = db.execute(
        select(Client).where(Client.id == client_id)
    ).scalar_one_or_none()
    if not client:
        return {"error": "Klienten hittades inte"}

    if user.effective_role == "advisor":
        has_doc = db.execute(
            select(Document.id).where(
                Document.client_id == client_id,
                Document.advisor_id == user.effective_advisor_id,
            ).limit(1)
        ).scalar_one_or_none()
        if not has_doc:
            return {"error": "Åtkomst nekad"}

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


def _get_client_documents(input: dict, db: Session, user: TokenInfo) -> Any:
    client_id = input["client_id"]
    client = db.execute(
        select(Client).where(Client.id == client_id)
    ).scalar_one_or_none()
    if not client:
        return {"error": "Klienten hittades inte"}

    query = (
        select(Document)
        .options(joinedload(Document.extractions))
        .where(Document.client_id == client_id)
        .order_by(Document.created_at.desc())
    )
    if user.effective_role == "advisor":
        query = query.where(Document.advisor_id == user.effective_advisor_id)

    docs = db.execute(query).unique().scalars().all()
    return [_doc_summary(doc) for doc in docs]


def _list_documents(_input: dict, db: Session, user: TokenInfo) -> Any:
    query = (
        select(Document)
        .options(joinedload(Document.extractions))
        .order_by(Document.created_at.desc())
    )
    if user.effective_role == "advisor":
        query = query.where(Document.advisor_id == user.effective_advisor_id)

    docs = db.execute(query).unique().scalars().all()
    return [_doc_summary(doc) for doc in docs]


def _get_document_detail(input: dict, db: Session, user: TokenInfo) -> Any:
    document_id = input["document_id"]
    doc = (
        db.execute(
            select(Document)
            .options(joinedload(Document.extractions))
            .where(Document.id == document_id)
        )
        .unique()
        .scalar_one_or_none()
    )
    if not doc:
        return {"error": "Dokumentet hittades inte"}
    if user.effective_role == "advisor" and doc.advisor_id != user.effective_advisor_id:
        return {"error": "Åtkomst nekad"}

    extractions = []
    for ext in doc.extractions:
        ext_data = ext.extraction_data
        # Trim large extraction_data to keep tool results reasonable
        if ext_data and isinstance(ext_data, dict):
            trimmed = {k: v for k, v in ext_data.items() if k != "raw_data"}
            ext_data = trimmed

        extractions.append({
            "id": ext.id,
            "extractor_name": ext.extractor_name,
            "status": ext.status,
            "document_type": ext.document_type,
            "document_date": ext.document_date,
            "page_count": ext.page_count,
            "client_name": ext.client_name,
            "advisor_name": ext.advisor_name,
            "extraction_data": ext_data,
            "created_at": ext.created_at.isoformat(),
        })

    return {
        "id": doc.id,
        "original_filename": doc.original_filename,
        "file_size": doc.file_size,
        "mime_type": doc.mime_type,
        "status": doc.status,
        "client_id": doc.client_id,
        "advisor_id": doc.advisor_id,
        "compliance_status": doc.compliance_status,
        "compliance_score": doc.compliance_score,
        "created_at": doc.created_at.isoformat(),
        "extractions": extractions,
    }


def _get_document_compliance(input: dict, db: Session, user: TokenInfo) -> Any:
    from src.routers.compliance import _build_report_from_stored

    document_id = input["document_id"]
    doc = db.execute(
        select(Document).where(Document.id == document_id)
    ).scalar_one_or_none()

    if not doc:
        return {"error": "Dokumentet hittades inte"}
    if user.effective_role == "advisor" and doc.advisor_id != user.effective_advisor_id:
        return {"error": "Åtkomst nekad"}
    if doc.compliance_status is None:
        return {"error": "Ingen compliance-kontroll har utförts för detta dokument"}

    report = _build_report_from_stored(document_id, db)
    return report.model_dump(mode="json")


def _list_advisors(_input: dict, db: Session, user: TokenInfo) -> Any:
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
            .label("clients_with_issues_red"),
            func.count(distinct(Document.client_id))
            .filter(Document.compliance_status == "yellow")
            .label("clients_with_issues_yellow"),
        )
        .where(Document.advisor_id.is_not(None))
        .group_by(Document.advisor_id)
        .subquery()
    )

    query = select(
        Advisor,
        func.coalesce(doc_stats.c.document_count, 0).label("document_count"),
        func.coalesce(doc_stats.c.client_count, 0).label("client_count"),
        doc_stats.c.avg_compliance_score,
        func.coalesce(doc_stats.c.clients_with_issues_red, 0).label("clients_with_issues_red"),
        func.coalesce(doc_stats.c.clients_with_issues_yellow, 0).label("clients_with_issues_yellow"),
    ).outerjoin(doc_stats, Advisor.id == doc_stats.c.advisor_id)

    rows = db.execute(query).all()
    return [
        {
            "id": advisor.id,
            "advisor_name": advisor.advisor_name,
            "firm_name": advisor.firm_name,
            "document_count": doc_count,
            "client_count": client_count,
            "avg_compliance_score": round(avg_score) if avg_score is not None else None,
            "clients_with_issues_red": issues_red,
            "clients_with_issues_yellow": issues_yellow,
        }
        for advisor, doc_count, client_count, avg_score, issues_red, issues_yellow in rows
    ]


def _get_advisor_documents(input: dict, db: Session, user: TokenInfo) -> Any:
    advisor_id = input["advisor_id"]
    advisor = db.execute(
        select(Advisor).where(Advisor.id == advisor_id)
    ).scalar_one_or_none()
    if not advisor:
        return {"error": "Rådgivaren hittades inte"}

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


_EXECUTORS = {
    "list_clients": _list_clients,
    "get_client_detail": _get_client_detail,
    "get_client_documents": _get_client_documents,
    "list_documents": _list_documents,
    "get_document_detail": _get_document_detail,
    "get_document_compliance": _get_document_compliance,
    "list_advisors": _list_advisors,
    "get_advisor_documents": _get_advisor_documents,
}

# Swedish labels for tool names (used by frontend)
TOOL_LABELS = {
    "list_clients": "Hämtar klientlista",
    "get_client_detail": "Hämtar klientdetaljer",
    "get_client_documents": "Hämtar klientens dokument",
    "list_documents": "Hämtar dokumentlista",
    "get_document_detail": "Hämtar dokumentdetaljer",
    "get_document_compliance": "Hämtar compliance-rapport",
    "list_advisors": "Hämtar rådgivarlista",
    "get_advisor_documents": "Hämtar rådgivarens dokument",
}
