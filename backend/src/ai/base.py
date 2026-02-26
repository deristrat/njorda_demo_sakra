"""Abstract base for chat providers — swap implementations without touching the router."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import AsyncIterator, Literal, Protocol

EventType = Literal["text_delta", "tool_start", "tool_result", "done", "error"]


@dataclass
class ChatEvent:
    type: EventType
    data: str = ""
    tool_name: str | None = None
    tool_id: str | None = None


class BaseChatProvider(Protocol):
    async def stream_response(
        self,
        messages: list[dict],
        system: str,
        tools: list[dict],
        *,
        tool_executor: object,
    ) -> AsyncIterator[ChatEvent]: ...
