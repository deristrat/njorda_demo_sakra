"""Anthropic chat provider with agentic tool loop."""

from __future__ import annotations

from typing import AsyncIterator

import anthropic

from src.ai.base import ChatEvent
from src.ai.tools import TOOL_LABELS, execute_tool
from src.auth import TokenInfo
from sqlalchemy.orm import Session

MODEL = "claude-sonnet-4-6"
MAX_TOOL_ROUNDS = 10


async def stream_response(
    messages: list[dict],
    system: str,
    tools: list[dict],
    db: Session,
    user: TokenInfo,
) -> AsyncIterator[ChatEvent]:
    """Run the agentic loop: stream text, execute tools, repeat until done."""
    client = anthropic.AsyncAnthropic()
    rounds = 0

    while rounds < MAX_TOOL_ROUNDS:
        rounds += 1

        async with client.messages.stream(
            model=MODEL,
            max_tokens=4096,
            system=system,
            messages=messages,
            tools=tools,
        ) as stream:
            async for event in stream:
                if event.type == "content_block_start":
                    if event.content_block.type == "tool_use":
                        yield ChatEvent(
                            type="tool_start",
                            tool_name=event.content_block.name,
                            tool_id=event.content_block.id,
                            data=TOOL_LABELS.get(event.content_block.name, event.content_block.name),
                        )
                elif event.type == "content_block_delta":
                    if event.delta.type == "text_delta":
                        yield ChatEvent(type="text_delta", data=event.delta.text)

            response = await stream.get_final_message()

        # Build content_blocks from the response
        content_blocks = []
        for block in response.content:
            if block.type == "text":
                content_blocks.append({"type": "text", "text": block.text})
            elif block.type == "tool_use":
                content_blocks.append({
                    "type": "tool_use",
                    "id": block.id,
                    "name": block.name,
                    "input": block.input,
                })

        messages.append({"role": "assistant", "content": content_blocks})

        if response.stop_reason != "tool_use":
            break

        # Execute tool calls
        tool_results = []
        for block in response.content:
            if block.type == "tool_use":
                result = execute_tool(block.name, block.input, db, user)
                yield ChatEvent(
                    type="tool_result",
                    tool_name=block.name,
                    tool_id=block.id,
                    data=TOOL_LABELS.get(block.name, block.name),
                )
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": result,
                })

        messages.append({"role": "user", "content": tool_results})

    yield ChatEvent(type="done")
