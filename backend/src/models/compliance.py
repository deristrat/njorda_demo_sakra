"""SQLAlchemy models for compliance rules and findings."""

from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base


class ComplianceRule(Base):
    """A compliance rule definition. Source of truth — stored in DB, editable via UI."""

    __tablename__ = "compliance_rules"

    id: Mapped[int] = mapped_column(primary_key=True)
    rule_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(50))
    tier: Mapped[int] = mapped_column(Integer, default=1)
    rule_type: Mapped[str] = mapped_column(String(50))
    rule_params: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    document_types: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    default_severity: Mapped[str] = mapped_column(String(20), default="warning")
    severity_override: Mapped[str | None] = mapped_column(String(20), nullable=True)
    max_deduction: Mapped[int] = mapped_column(Integer, default=5)
    remediation: Mapped[str | None] = mapped_column(Text, nullable=True)
    parent_rule_id: Mapped[str | None] = mapped_column(
        String(50), ForeignKey("compliance_rules.rule_id"), nullable=True
    )
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class ComplianceFinding(Base):
    """Stored result of running one rule against one document."""

    __tablename__ = "compliance_findings"
    __table_args__ = (Index("ix_compliance_findings_document_id", "document_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    document_id: Mapped[int] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE")
    )
    rule_id: Mapped[str] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(10))  # passed, failed, skipped
    severity: Mapped[str] = mapped_column(String(20))
    tier: Mapped[int] = mapped_column(Integer, default=1)
    findings_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    checked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
