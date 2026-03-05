"""SQLAlchemy model for company-wide compliance report runs."""

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base


class ComplianceReportRun(Base):
    __tablename__ = "compliance_report_runs"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(20))  # generating, completed, failed
    generated_by: Mapped[str] = mapped_column(String(255))
    report_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    summary_stats: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
