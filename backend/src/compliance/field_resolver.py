"""Utility to resolve dot-notation field paths on Pydantic models."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel


def resolve_field_path(obj: BaseModel, path: str) -> Any:
    """Resolve a dot-notation path like 'advisor.advisor_name' on a Pydantic model.

    Returns the value at the path, or None if any segment is None/missing.
    """
    current: Any = obj
    for segment in path.split("."):
        if current is None:
            return None
        if isinstance(current, BaseModel):
            current = getattr(current, segment, None)
        elif isinstance(current, dict):
            current = current.get(segment)
        else:
            return None
    return current
