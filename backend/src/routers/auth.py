"""Authentication endpoints: login, logout, me."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from src.auth import create_token, get_current_user, revoke_token, _extract_token
from src.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    username: str


class MeResponse(BaseModel):
    username: str


@router.post("/login")
def login(body: LoginRequest) -> LoginResponse:
    if body.username != settings.admin_username or body.password != settings.admin_password:
        raise HTTPException(401, "Felaktigt användarnamn eller lösenord")
    token = create_token(body.username)
    return LoginResponse(token=token, username=body.username)


@router.post("/logout")
def logout(request: Request) -> dict:
    token = _extract_token(request)
    if token:
        revoke_token(token)
    return {"ok": True}


@router.get("/me")
def me(username: str = Depends(get_current_user)) -> MeResponse:
    return MeResponse(username=username)
