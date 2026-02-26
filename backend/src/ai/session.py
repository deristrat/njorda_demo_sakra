"""In-memory chat session store with TTL cleanup."""

from __future__ import annotations

import time
import uuid

SESSION_TTL = 3600  # 1 hour

_sessions: dict[str, dict] = {}  # session_id → {"messages": [...], "last_access": float}


def create_session() -> str:
    sid = uuid.uuid4().hex
    _sessions[sid] = {"messages": [], "last_access": time.time()}
    _cleanup()
    return sid


def get_session(session_id: str) -> list[dict] | None:
    s = _sessions.get(session_id)
    if s is None:
        return None
    s["last_access"] = time.time()
    return s["messages"]


def delete_session(session_id: str) -> None:
    _sessions.pop(session_id, None)


def _cleanup() -> None:
    now = time.time()
    expired = [sid for sid, s in _sessions.items() if now - s["last_access"] > SESSION_TTL]
    for sid in expired:
        del _sessions[sid]
