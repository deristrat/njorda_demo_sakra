from datetime import datetime

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from src.models.user import User
    from src.models.document import Document
    from src.models.client import Client

from src.database import Base


class Message(Base):
    __tablename__ = "messages"
    __table_args__ = (
        Index("ix_messages_recipient_user_id", "recipient_user_id"),
        Index("ix_messages_sender_user_id", "sender_user_id"),
        Index("ix_messages_created_at", "created_at"),
        Index("ix_messages_reply_to_message_id", "reply_to_message_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    sender_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    recipient_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    document_id: Mapped[int | None] = mapped_column(
        ForeignKey("documents.id"), nullable=True
    )
    client_id: Mapped[int | None] = mapped_column(
        ForeignKey("clients.id"), nullable=True
    )
    subject: Mapped[str] = mapped_column(String(500))
    body: Mapped[str] = mapped_column(Text)

    # Compliance snapshot at send time
    compliance_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    compliance_status: Mapped[str | None] = mapped_column(String(10), nullable=True)

    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    read_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    reply_to_message_id: Mapped[int | None] = mapped_column(
        ForeignKey("messages.id"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    sender: Mapped["User"] = relationship(foreign_keys=[sender_user_id])
    recipient: Mapped["User"] = relationship(foreign_keys=[recipient_user_id])
    document: Mapped["Document | None"] = relationship()
    client: Mapped["Client | None"] = relationship()
    replies: Mapped[list["Message"]] = relationship(
        back_populates="parent", foreign_keys=[reply_to_message_id]
    )
    parent: Mapped["Message | None"] = relationship(
        back_populates="replies", remote_side="Message.id", foreign_keys=[reply_to_message_id]
    )
