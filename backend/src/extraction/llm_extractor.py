"""Anthropic Claude-based PDF extractor."""

from __future__ import annotations

import json
import os

import anthropic
from anthropic.types import ToolParam

from .base import BaseExtractor, ExtractionError, parse_extraction_data
from .models import ExtractionResult
from .pdf_reader import read_pdf
from .prompt import EXTRACTION_TOOL, SYSTEM_PROMPT

DEFAULT_MODEL = "claude-sonnet-4-20250514"


class AnthropicExtractor(BaseExtractor):
    def __init__(
        self,
        api_key: str | None = None,
        model: str = DEFAULT_MODEL,
        display_name: str | None = None,
    ):
        key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        if not key:
            raise ExtractionError(
                "No API key provided. Set ANTHROPIC_API_KEY env var or pass api_key."
            )
        self._client = anthropic.AsyncAnthropic(api_key=key)
        self._model = model
        self._display_name = display_name or "claude-sonnet"

    @property
    def name(self) -> str:
        return self._display_name

    async def extract(self, pdf_data: bytes, filename: str = "document.pdf") -> ExtractionResult:
        pdf = read_pdf(pdf_data, filename=filename)

        message = await self._client.messages.create(
            model=self._model,
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            tools=[ToolParam(**EXTRACTION_TOOL)],
            tool_choice={"type": "tool", "name": "extract_document_data"},
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "document",
                            "source": {
                                "type": "base64",
                                "media_type": "application/pdf",
                                "data": pdf.base64_bytes,
                            },
                        },
                        {
                            "type": "text",
                            "text": "Extract all structured data from this financial advisory document.",
                        },
                    ],
                }
            ],
        )

        # Find the tool_use block in the response
        tool_input = None
        for block in message.content:
            if block.type == "tool_use" and block.name == "extract_document_data":
                tool_input = block.input
                break

        if tool_input is None:
            raise ExtractionError(
                f"No tool_use block in response. Stop reason: {message.stop_reason}. "
                f"Content: {json.dumps([b.model_dump() for b in message.content], indent=2)}"
            )

        return parse_extraction_data(
            tool_input, pdf.filename, pdf.page_count, self.name
        )
