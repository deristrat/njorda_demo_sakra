"""Auth: in-memory token store with role & impersonation support."""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field

from fastapi import HTTPException, Request


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


# token → TokenInfo
_tokens: dict[str, TokenInfo] = {}


def create_token(info: TokenInfo) -> str:
    token = uuid.uuid4().hex
    _tokens[token] = info
    return token


def get_token_info(token: str) -> TokenInfo | None:
    return _tokens.get(token)


def revoke_token(token: str) -> None:
    _tokens.pop(token, None)


def _extract_token(request: Request) -> str | None:
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]
    return None


def get_current_user(request: Request) -> TokenInfo:
    """FastAPI dependency — raises 401 if no valid token. Returns real user info."""
    token = _extract_token(request)
    if not token or token not in _tokens:
        raise HTTPException(401, "Inte autentiserad")
    return _tokens[token]


def get_effective_user(request: Request) -> TokenInfo:
    """FastAPI dependency — returns effective (impersonated) user context.
    Same object as get_current_user, but callers should use .effective_* properties."""
    return get_current_user(request)


def get_current_user_optional(request: Request) -> TokenInfo | None:
    """FastAPI dependency — returns None instead of 401."""
    token = _extract_token(request)
    if not token or token not in _tokens:
        return None
    return _tokens[token]
