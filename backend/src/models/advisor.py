from datetime import datetime

from sqlalchemy import DateTime, String, func, select
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base


class Advisor(Base):
    __tablename__ = "advisors"

    id: Mapped[int] = mapped_column(primary_key=True)
    advisor_name: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    firm_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    license_number: Mapped[str | None] = mapped_column(String(100), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    documents: Mapped[list["Document"]] = relationship(back_populates="advisor")


def link_document_to_advisor(
    doc: "Document", extraction_result, db
) -> "Advisor | None":
    """Link a document to an advisor based on extracted advisor_name.

    If extraction has advisor.advisor_name, look up or create Advisor,
    then set doc.advisor_id. Updates firm_name/license_number from latest
    extraction ("latest wins"). Returns the Advisor or None.
    """
    advisor_data = getattr(extraction_result, "advisor", None)
    if advisor_data is None:
        return None

    advisor_name = getattr(advisor_data, "advisor_name", None)
    if not advisor_name:
        return None

    advisor = db.execute(
        select(Advisor).where(Advisor.advisor_name == advisor_name)
    ).scalar_one_or_none()

    if advisor is None:
        advisor = Advisor(advisor_name=advisor_name)
        db.add(advisor)
        db.flush()

    # Update fields from latest extraction ("latest wins")
    if getattr(advisor_data, "firm_name", None):
        advisor.firm_name = advisor_data.firm_name
    if getattr(advisor_data, "license_number", None):
        advisor.license_number = advisor_data.license_number

    doc.advisor_id = advisor.id
    return advisor
