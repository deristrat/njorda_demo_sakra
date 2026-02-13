"""Google Gemini-based PDF extractor."""

from __future__ import annotations

import json
import os
from pathlib import Path

from google import genai
from google.genai import types

from .base import BaseExtractor, ExtractionError, parse_extraction_data
from .pdf_reader import read_pdf
from .prompt import GEMINI_SYSTEM_PROMPT, GEMINI_USER_PROMPT

DEFAULT_MODEL = "gemini-2.5-pro"


class GeminiExtractor(BaseExtractor):
    def __init__(
        self,
        api_key: str | None = None,
        model: str = DEFAULT_MODEL,
        display_name: str | None = None,
    ):
        key = api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        if not key:
            raise ExtractionError(
                "No API key provided. Set GEMINI_API_KEY or GOOGLE_API_KEY env var."
            )
        self._client = genai.Client(api_key=key)
        self._model = model
        self._display_name = display_name or model

    @property
    def name(self) -> str:
        return self._display_name

    async def extract(self, pdf_path: Path) -> ExtractionResult:
        pdf = read_pdf(pdf_path)
        pdf_bytes = pdf_path.read_bytes()

        response = await self._client.aio.models.generate_content(
            model=self._model,
            contents=[
                types.Part.from_bytes(data=pdf_bytes, mime_type="application/pdf"),
                GEMINI_USER_PROMPT,
            ],
            config=types.GenerateContentConfig(
                system_instruction=GEMINI_SYSTEM_PROMPT,
                response_mime_type="application/json",
            ),
        )

        data = self._parse_json(response.text)
        return parse_extraction_data(data, pdf.filename, pdf.page_count, self.name)

    @staticmethod
    def _parse_json(text: str) -> dict:
        """Parse JSON response, handling model quirks (lists, extra data)."""
        # Try direct parse first
        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            # Some models return multiple JSON objects concatenated;
            # use a streaming decoder to grab the first one.
            decoder = json.JSONDecoder()
            try:
                data, _ = decoder.raw_decode(text.strip())
            except json.JSONDecodeError as e:
                raise ExtractionError(
                    f"Failed to parse Gemini JSON: {e}\nRaw: {text[:500]}"
                ) from e

        # If the model wrapped the result in a list, unwrap it
        if isinstance(data, list):
            if not data:
                raise ExtractionError("Gemini returned empty list")
            data = data[0]

        if not isinstance(data, dict):
            raise ExtractionError(
                f"Expected dict, got {type(data).__name__}: {str(data)[:300]}"
            )
        return data
