"""PDF reading utility using PyMuPDF."""

from __future__ import annotations

import base64
from dataclasses import dataclass, field
from pathlib import Path

import fitz  # pymupdf


@dataclass
class PDFContent:
    """Parsed content from a PDF file."""

    filename: str
    page_count: int
    pages_text: list[str] = field(default_factory=list)
    full_text: str = ""
    base64_bytes: str = ""  # base64-encoded raw PDF bytes


def read_pdf(source: Path | bytes, *, filename: str = "document.pdf") -> PDFContent:
    """Read a PDF and return its text content and raw bytes.

    Args:
        source: Path to a PDF file, or raw PDF bytes.
        filename: Display name (used when source is bytes).

    Returns:
        PDFContent with per-page text, joined text, and base64 bytes.
    """
    if isinstance(source, (Path, str)):
        path = Path(source)
        if not path.exists():
            raise FileNotFoundError(f"PDF not found: {path}")
        raw_bytes = path.read_bytes()
        filename = path.name
    else:
        raw_bytes = source

    b64 = base64.standard_b64encode(raw_bytes).decode("ascii")

    doc = fitz.open(stream=raw_bytes, filetype="pdf")
    pages_text = []
    for page in doc:
        pages_text.append(page.get_text())
    doc.close()

    return PDFContent(
        filename=filename,
        page_count=len(pages_text),
        pages_text=pages_text,
        full_text="\n\n".join(pages_text),
        base64_bytes=b64,
    )
