"""Company-wide compliance report generation and retrieval."""

from __future__ import annotations

from datetime import datetime, timezone
from collections import Counter, defaultdict

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from src.audit import record_audit_event
from src.auth import TokenInfo, get_effective_user
from src.database import get_db
from src.models.advisor import Advisor
from src.models.compliance import ComplianceFinding, ComplianceRule
from src.models.compliance_report import ComplianceReportRun
from src.models.document import Document, DocumentExtraction

router = APIRouter(prefix="/api/reports", tags=["reports"])


def _require_compliance_or_admin(user: TokenInfo) -> None:
    if user.effective_role not in ("compliance", "njorda_admin"):
        raise HTTPException(403, "Åtkomst nekad")


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class ReportSummaryResponse(BaseModel):
    id: int
    title: str
    status: str
    generated_by: str
    summary_stats: dict | None
    created_at: str
    completed_at: str | None


class ReportDetailResponse(BaseModel):
    id: int
    title: str
    status: str
    generated_by: str
    report_data: dict | None
    summary_stats: dict | None
    created_at: str
    completed_at: str | None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post("/compliance", status_code=201)
def generate_compliance_report(
    db: Session = Depends(get_db),
    user: TokenInfo = Depends(get_effective_user),
) -> ReportDetailResponse:
    """Generate a new company-wide compliance report."""
    _require_compliance_or_admin(user)

    now = datetime.now(timezone.utc)
    title = f"Compliance-rapport {now.strftime('%B %Y').lower()}"

    # Create the report record
    report = ComplianceReportRun(
        title=title,
        status="generating",
        generated_by=user.effective_username,
    )
    db.add(report)
    db.flush()

    try:
        report_data = _build_report_data(db, user.effective_username, now)
        summary_stats = _extract_summary_stats(report_data)

        report.report_data = report_data
        report.summary_stats = summary_stats
        report.status = "completed"
        report.completed_at = now

        record_audit_event(
            db,
            event_type="report.generated",
            actor=user.effective_username,
            summary=f"Genererade compliance-rapport: {title}",
            target_type="report",
            target_id=str(report.id),
        )
        db.commit()
    except Exception:
        report.status = "failed"
        db.commit()
        raise

    return ReportDetailResponse(
        id=report.id,
        title=report.title,
        status=report.status,
        generated_by=report.generated_by,
        report_data=report.report_data,
        summary_stats=report.summary_stats,
        created_at=report.created_at.isoformat(),
        completed_at=report.completed_at.isoformat() if report.completed_at else None,
    )


@router.get("/compliance")
def list_compliance_reports(
    db: Session = Depends(get_db),
    user: TokenInfo = Depends(get_effective_user),
) -> list[ReportSummaryResponse]:
    """List all compliance reports, most recent first."""
    _require_compliance_or_admin(user)

    reports = (
        db.execute(
            select(ComplianceReportRun).order_by(ComplianceReportRun.created_at.desc())
        )
        .scalars()
        .all()
    )

    return [
        ReportSummaryResponse(
            id=r.id,
            title=r.title,
            status=r.status,
            generated_by=r.generated_by,
            summary_stats=r.summary_stats,
            created_at=r.created_at.isoformat(),
            completed_at=r.completed_at.isoformat() if r.completed_at else None,
        )
        for r in reports
    ]


@router.get("/compliance/{report_id}")
def get_compliance_report(
    report_id: int,
    db: Session = Depends(get_db),
    user: TokenInfo = Depends(get_effective_user),
) -> ReportDetailResponse:
    """Get the full report data for a specific compliance report."""
    _require_compliance_or_admin(user)

    report = db.execute(
        select(ComplianceReportRun).where(ComplianceReportRun.id == report_id)
    ).scalar_one_or_none()

    if not report:
        raise HTTPException(404, "Rapport hittades inte")

    return ReportDetailResponse(
        id=report.id,
        title=report.title,
        status=report.status,
        generated_by=report.generated_by,
        report_data=report.report_data,
        summary_stats=report.summary_stats,
        created_at=report.created_at.isoformat(),
        completed_at=report.completed_at.isoformat() if report.completed_at else None,
    )


# ---------------------------------------------------------------------------
# Report builder
# ---------------------------------------------------------------------------


def _build_report_data(db: Session, username: str, now: datetime) -> dict:
    """Query all documents with compliance data and build the full report snapshot."""

    # Get all documents that have been compliance-checked
    docs = (
        db.execute(
            select(Document).where(Document.compliance_status.isnot(None))
        )
        .scalars()
        .all()
    )

    total_documents = len(docs)
    reviewed_documents = total_documents  # all have compliance_status

    if total_documents == 0:
        return {
            "generated_at": now.isoformat(),
            "generated_by": username,
            "total_documents": 0,
            "reviewed_documents": 0,
            "average_score": 0,
            "status_distribution": {"green": 0, "yellow": 0, "red": 0},
            "compliance_rate": 0,
            "critical_items": [],
            "most_failed_rules": [],
            "advisor_breakdown": [],
            "document_type_coverage": {},
        }

    # Compute basic stats
    scores = [d.compliance_score or 0 for d in docs]
    average_score = round(sum(scores) / len(scores))

    status_counts = Counter(d.compliance_status for d in docs)
    status_distribution = {
        "green": status_counts.get("green", 0),
        "yellow": status_counts.get("yellow", 0),
        "red": status_counts.get("red", 0),
    }
    compliance_rate = round(status_distribution["green"] / total_documents * 100)

    # Load all advisors for name lookups
    advisors = {a.id: a for a in db.execute(select(Advisor)).scalars().all()}

    # Load rule metadata
    rules = {
        r.rule_id: r
        for r in db.execute(select(ComplianceRule)).scalars().all()
    }

    # Get the latest extraction per document for document_type + client_name
    doc_ids = [d.id for d in docs]
    extractions = (
        db.execute(
            select(DocumentExtraction)
            .where(DocumentExtraction.document_id.in_(doc_ids))
            .where(DocumentExtraction.status == "completed")
            .order_by(DocumentExtraction.created_at.desc())
        )
        .scalars()
        .all()
    )
    # Keep only latest extraction per document
    ext_by_doc: dict[int, DocumentExtraction] = {}
    for ext in extractions:
        if ext.document_id not in ext_by_doc:
            ext_by_doc[ext.document_id] = ext

    # Load all findings for these documents
    findings = (
        db.execute(
            select(ComplianceFinding)
            .where(ComplianceFinding.document_id.in_(doc_ids))
        )
        .scalars()
        .all()
    )
    findings_by_doc: dict[int, list[ComplianceFinding]] = defaultdict(list)
    for f in findings:
        findings_by_doc[f.document_id].append(f)

    # Build per-document info
    def _doc_info(doc: Document) -> dict:
        ext = ext_by_doc.get(doc.id)
        advisor = advisors.get(doc.advisor_id) if doc.advisor_id else None
        failed = [
            f for f in findings_by_doc.get(doc.id, []) if f.status == "failed"
        ]
        return {
            "document_id": doc.id,
            "filename": doc.original_filename,
            "client_name": ext.client_name if ext else None,
            "advisor_name": advisor.advisor_name if advisor else None,
            "document_type": ext.document_type if ext else None,
            "score": doc.compliance_score or 0,
            "status": doc.compliance_status,
            "failed_rules": [
                {
                    "rule_id": f.rule_id,
                    "rule_name": rules[f.rule_id].name if f.rule_id in rules else f.rule_id,
                    "severity": f.severity,
                    "findings": f.findings_json or [],
                }
                for f in failed
            ],
        }

    doc_infos = [_doc_info(d) for d in docs]

    # Critical items: red status documents
    critical_items = [
        di for di in doc_infos if di["status"] == "red"
    ]
    critical_items.sort(key=lambda x: x["score"])

    # Most failed rules
    rule_fail_counter: Counter[str] = Counter()
    for di in doc_infos:
        for fr in di["failed_rules"]:
            rule_fail_counter[fr["rule_id"]] += 1

    most_failed_rules = [
        {
            "rule_id": rule_id,
            "rule_name": rules[rule_id].name if rule_id in rules else rule_id,
            "fail_count": count,
            "category": rules[rule_id].category if rule_id in rules else "unknown",
        }
        for rule_id, count in rule_fail_counter.most_common(10)
    ]

    # Advisor breakdown
    advisor_docs: dict[int | None, list[dict]] = defaultdict(list)
    for di in doc_infos:
        # find advisor_id from the original doc
        doc_obj = next(d for d in docs if d.id == di["document_id"])
        advisor_docs[doc_obj.advisor_id].append(di)

    advisor_breakdown = []
    for advisor_id, adocs in advisor_docs.items():
        advisor = advisors.get(advisor_id) if advisor_id else None
        adoc_scores = [d["score"] for d in adocs]
        adoc_statuses = Counter(d["status"] for d in adocs)
        advisor_breakdown.append({
            "advisor_id": advisor_id,
            "advisor_name": advisor.advisor_name if advisor else "Okänd rådgivare",
            "document_count": len(adocs),
            "average_score": round(sum(adoc_scores) / len(adoc_scores)) if adoc_scores else 0,
            "green": adoc_statuses.get("green", 0),
            "yellow": adoc_statuses.get("yellow", 0),
            "red": adoc_statuses.get("red", 0),
            "documents": adocs,
        })
    advisor_breakdown.sort(key=lambda x: x["average_score"])

    # Document type coverage
    type_docs: dict[str, list[dict]] = defaultdict(list)
    for di in doc_infos:
        dtype = di.get("document_type") or "unknown"
        type_docs[dtype].append(di)

    document_type_coverage = {
        dtype: {
            "count": len(tdocs),
            "avg_score": round(sum(d["score"] for d in tdocs) / len(tdocs)) if tdocs else 0,
        }
        for dtype, tdocs in type_docs.items()
    }

    return {
        "generated_at": now.isoformat(),
        "generated_by": username,
        "total_documents": total_documents,
        "reviewed_documents": reviewed_documents,
        "average_score": average_score,
        "status_distribution": status_distribution,
        "compliance_rate": compliance_rate,
        "critical_items": critical_items,
        "most_failed_rules": most_failed_rules,
        "advisor_breakdown": advisor_breakdown,
        "document_type_coverage": document_type_coverage,
    }


def _extract_summary_stats(report_data: dict) -> dict:
    """Extract top-level stats for the list view."""
    return {
        "total_documents": report_data["total_documents"],
        "average_score": report_data["average_score"],
        "status_distribution": report_data["status_distribution"],
        "compliance_rate": report_data["compliance_rate"],
    }
