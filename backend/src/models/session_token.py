from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base


class SessionToken(Base):
    __tablename__ = "session_tokens"

    id: Mapped[int] = mapped_column(primary_key=True)
    token: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    username: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20))
    advisor_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Impersonation fields
    imp_user_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    imp_username: Mapped[str | None] = mapped_column(String(255), nullable=True)
    imp_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    imp_role: Mapped[str | None] = mapped_column(String(20), nullable=True)
    imp_advisor_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
