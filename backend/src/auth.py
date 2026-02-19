"""Minimal auth: in-memory token store + FastAPI dependencies."""

from __future__ import annotations

import uuid

from fastapi import HTTPException, Request

# token → username
_tokens: dict[str, str] = {}


def create_token(username: str) -> str:
    token = uuid.uuid4().hex
    _tokens[token] = username
    return token


def revoke_token(token: str) -> None:
    _tokens.pop(token, None)


def _extract_token(request: Request) -> str | None:
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]
    return None


def get_current_user(request: Request) -> str:
    """FastAPI dependency — raises 401 if no valid token."""
    token = _extract_token(request)
    if not token or token not in _tokens:
        raise HTTPException(401, "Inte autentiserad")
    return _tokens[token]


def get_current_user_optional(request: Request) -> str | None:
    """FastAPI dependency — returns None instead of 401."""
    token = _extract_token(request)
    if not token or token not in _tokens:
        return None
    return _tokens[token]
