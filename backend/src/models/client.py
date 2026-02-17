from datetime import datetime

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[int] = mapped_column(primary_key=True)
    person_number: Mapped[str] = mapped_column(
        String(20), unique=True, index=True
    )
    person_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    documents: Mapped[list["Document"]] = relationship(back_populates="client")


def link_document_to_client(
    doc: "Document", extraction_result, db
) -> "Client | None":
    """Link a document to a client based on extracted person_number.

    If extraction has client.person_number, look up or create Client,
    then set doc.client_id. Updates client contact fields from latest
    extraction ("latest wins"). Returns the Client or None.
    """
    client_data = getattr(extraction_result, "client", None)
    if client_data is None:
        return None

    person_number = getattr(client_data, "person_number", None)
    if not person_number:
        return None

    from src.models.document import Document  # noqa: F811
    from sqlalchemy import select

    client = db.execute(
        select(Client).where(Client.person_number == person_number)
    ).scalar_one_or_none()

    if client is None:
        client = Client(person_number=person_number)
        db.add(client)
        db.flush()

    # Update contact fields from latest extraction ("latest wins")
    if getattr(client_data, "person_name", None):
        client.person_name = client_data.person_name
    if getattr(client_data, "address", None):
        client.address = client_data.address
    if getattr(client_data, "email", None):
        client.email = client_data.email
    if getattr(client_data, "phone", None):
        client.phone = client_data.phone

    doc.client_id = client.id
    return client
