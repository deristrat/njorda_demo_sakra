"""Authentication endpoints: login, logout, me, impersonation."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from src.audit import record_audit_event
from src.auth import (
    TokenInfo,
    create_token,
    get_current_user,
    get_token_row,
    revoke_token,
    _extract_token,
)
from src.database import get_db
from src.models.advisor import Advisor
from src.models.user import User

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _resolve_advisor_id(name: str | None, db: Session) -> int | None:
    """Match user name to Advisor.advisor_name, return advisor_id or None."""
    if not name:
        return None
    advisor = db.execute(
        select(Advisor).where(Advisor.advisor_name == name)
    ).scalar_one_or_none()
    return advisor.id if advisor else None


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    username: str
    role: str
    name: str | None
    user_id: int
    advisor_id: int | None


class MeResponse(BaseModel):
    username: str
    role: str
    name: str | None
    user_id: int
    advisor_id: int | None
    is_impersonating: bool
    impersonating_as: dict | None  # {username, name, role} or None


class UserListItem(BaseModel):
    id: int
    username: str
    name: str | None
    role: str


class ImpersonateRequest(BaseModel):
    user_id: int


# ---------------------------------------------------------------------------
# Login / Logout / Me
# ---------------------------------------------------------------------------


@router.post("/login")
def login(body: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    user = db.execute(
        select(User).where(User.username == body.username)
    ).scalar_one_or_none()

    if not user or not user.verify_password(body.password):
        raise HTTPException(401, "Felaktigt användarnamn eller lösenord")

    advisor_id = _resolve_advisor_id(user.name, db)

    info = TokenInfo(
        user_id=user.id,
        username=user.username,
        name=user.name or user.username,
        role=user.role,
        advisor_id=advisor_id,
    )
    token = create_token(db, info)

    record_audit_event(
        db,
        event_type="user.login",
        actor=user.username,
        summary=f"{user.name or user.username} loggade in",
        target_type="user",
        target_id=str(user.id),
    )
    db.commit()

    return LoginResponse(
        token=token,
        username=user.username,
        role=user.role,
        name=user.name,
        user_id=user.id,
        advisor_id=advisor_id,
    )


@router.post("/logout")
def logout(request: Request, db: Session = Depends(get_db)) -> dict:
    token = _extract_token(request)
    if token:
        revoke_token(db, token)
        db.commit()
    return {"ok": True}


@router.get("/me")
def me(user: TokenInfo = Depends(get_current_user)) -> MeResponse:
    impersonating_as = None
    if user.is_impersonating:
        impersonating_as = {
            "username": user.imp_username,
            "name": user.imp_name,
            "role": user.imp_role,
        }
    return MeResponse(
        username=user.username,
        role=user.role,
        name=user.name,
        user_id=user.user_id,
        advisor_id=user.advisor_id,
        is_impersonating=user.is_impersonating,
        impersonating_as=impersonating_as,
    )


# ---------------------------------------------------------------------------
# User list & Impersonation (njorda_admin only)
# ---------------------------------------------------------------------------


@router.get("/users")
def list_users(
    user: TokenInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[UserListItem]:
    if user.role != "njorda_admin":
        raise HTTPException(403, "Åtkomst nekad")

    users = db.execute(select(User).order_by(User.id)).scalars().all()
    return [
        UserListItem(id=u.id, username=u.username, name=u.name, role=u.role)
        for u in users
    ]


@router.post("/impersonate")
def impersonate(
    body: ImpersonateRequest,
    request: Request,
    user: TokenInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MeResponse:
    if user.role != "njorda_admin":
        raise HTTPException(403, "Åtkomst nekad")

    target = db.execute(
        select(User).where(User.id == body.user_id)
    ).scalar_one_or_none()
    if not target:
        raise HTTPException(404, "Användare hittades inte")

    target_advisor_id = _resolve_advisor_id(target.name, db)

    # Update the DB row with impersonation state
    token_str = _extract_token(request)
    if token_str:
        row = get_token_row(db, token_str)
        if row:
            row.imp_user_id = target.id
            row.imp_username = target.username
            row.imp_name = target.name or target.username
            row.imp_role = target.role
            row.imp_advisor_id = target_advisor_id
            db.commit()

    return MeResponse(
        username=user.username,
        role=user.role,
        name=user.name,
        user_id=user.user_id,
        advisor_id=user.advisor_id,
        is_impersonating=True,
        impersonating_as={
            "username": target.username,
            "name": target.name or target.username,
            "role": target.role,
        },
    )


@router.post("/stop-impersonation")
def stop_impersonation(
    request: Request,
    user: TokenInfo = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MeResponse:
    token_str = _extract_token(request)
    if token_str:
        row = get_token_row(db, token_str)
        if row:
            row.imp_user_id = None
            row.imp_username = None
            row.imp_name = None
            row.imp_role = None
            row.imp_advisor_id = None
            db.commit()

    return MeResponse(
        username=user.username,
        role=user.role,
        name=user.name,
        user_id=user.user_id,
        advisor_id=user.advisor_id,
        is_impersonating=False,
        impersonating_as=None,
    )
