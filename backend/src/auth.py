"""Auth: DB-backed token store with role & impersonation support."""

from __future__ import annotations

import uuid
from dataclasses import dataclass

from fastapi import Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from src.database import get_db
from src.models.session_token import SessionToken


@dataclass
class TokenInfo:
    user_id: int
    username: str
    name: str
    role: str  # "advisor" | "compliance" | "njorda_admin"
    advisor_id: int | None = None
    # Impersonation fields
    imp_user_id: int | None = None
    imp_username: str | None = None
    imp_name: str | None = None
    imp_role: str | None = None
    imp_advisor_id: int | None = None

    @property
    def is_impersonating(self) -> bool:
        return self.imp_user_id is not None

    @property
    def effective_role(self) -> str:
        return self.imp_role if self.is_impersonating else self.role

    @property
    def effective_advisor_id(self) -> int | None:
        return self.imp_advisor_id if self.is_impersonating else self.advisor_id

    @property
    def effective_user_id(self) -> int:
        return self.imp_user_id if self.is_impersonating else self.user_id

    @property
    def effective_username(self) -> str:
        return self.imp_username if self.is_impersonating else self.username

    @property
    def effective_name(self) -> str:
        return self.imp_name if self.is_impersonating else self.name


def _row_to_token_info(row: SessionToken) -> TokenInfo:
    return TokenInfo(
        user_id=row.user_id,
        username=row.username,
        name=row.name,
        role=row.role,
        advisor_id=row.advisor_id,
        imp_user_id=row.imp_user_id,
        imp_username=row.imp_username,
        imp_name=row.imp_name,
        imp_role=row.imp_role,
        imp_advisor_id=row.imp_advisor_id,
    )


def create_token(db: Session, info: TokenInfo) -> str:
    token = uuid.uuid4().hex
    row = SessionToken(
        token=token,
        user_id=info.user_id,
        username=info.username,
        name=info.name,
        role=info.role,
        advisor_id=info.advisor_id,
    )
    db.add(row)
    db.flush()
    return token


def get_token_info(db: Session, token: str) -> TokenInfo | None:
    row = db.execute(
        select(SessionToken).where(SessionToken.token == token)
    ).scalar_one_or_none()
    if not row:
        return None
    return _row_to_token_info(row)


def get_token_row(db: Session, token: str) -> SessionToken | None:
    return db.execute(
        select(SessionToken).where(SessionToken.token == token)
    ).scalar_one_or_none()


def revoke_token(db: Session, token: str) -> None:
    row = db.execute(
        select(SessionToken).where(SessionToken.token == token)
    ).scalar_one_or_none()
    if row:
        db.delete(row)
        db.flush()


def _extract_token(request: Request) -> str | None:
    # 1. Authorization header (API calls)
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]
    # 2. Query parameter (browser navigation: iframes, window.open, etc.)
    token = request.query_params.get("token")
    if token:
        return token
    return None


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> TokenInfo:
    """FastAPI dependency — raises 401 if no valid token. Returns real user info."""
    token = _extract_token(request)
    if not token:
        raise HTTPException(401, "Inte autentiserad")
    info = get_token_info(db, token)
    if not info:
        raise HTTPException(401, "Inte autentiserad")
    return info


def get_effective_user(
    request: Request,
    db: Session = Depends(get_db),
) -> TokenInfo:
    """FastAPI dependency — returns effective (impersonated) user context.
    Same object as get_current_user, but callers should use .effective_* properties."""
    return get_current_user(request, db)


def get_current_user_optional(
    request: Request,
    db: Session = Depends(get_db),
) -> TokenInfo | None:
    """FastAPI dependency — returns None instead of 401."""
    token = _extract_token(request)
    if not token:
        return None
    return get_token_info(db, token)
