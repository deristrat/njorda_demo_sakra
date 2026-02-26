"""Chat endpoints — AI assistant with SSE streaming."""

from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.auth import TokenInfo, get_effective_user
from src.database import get_db
from src.ai.session import create_session, get_session, delete_session
from src.ai.prompt import SYSTEM_PROMPT
from src.ai.tools import TOOL_DEFINITIONS
from src.ai.anthropic_chat import stream_response

router = APIRouter(prefix="/api/chat", tags=["chat"])


def _sse(data: dict) -> str:
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"


class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None


@router.post("")
async def chat(
    body: ChatRequest,
    db: Session = Depends(get_db),
    user: TokenInfo = Depends(get_effective_user),
):
    """Send a message and receive a streamed AI response."""
    # Get or create session
    session_id = body.session_id
    messages = None
    if session_id:
        messages = get_session(session_id)

    if messages is None:
        session_id = create_session()
        messages = get_session(session_id)

    # Append user message
    messages.append({"role": "user", "content": body.message})

    async def event_stream():
        # Send session ID first
        yield _sse({"type": "session", "session_id": session_id})

        try:
            async for event in stream_response(
                messages=messages,
                system=SYSTEM_PROMPT,
                tools=TOOL_DEFINITIONS,
                db=db,
                user=user,
            ):
                yield _sse({
                    "type": event.type,
                    "data": event.data,
                    "tool_name": event.tool_name,
                    "tool_id": event.tool_id,
                })
        except Exception as e:
            yield _sse({"type": "error", "data": str(e)})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.delete("/{session_id}")
def clear_chat(
    session_id: str,
    user: TokenInfo = Depends(get_effective_user),
):
    """Clear a chat session."""
    delete_session(session_id)
    return {"ok": True}
