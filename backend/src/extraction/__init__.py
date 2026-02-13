"""PDF document extraction pipeline."""

from .base import BaseExtractor, ExtractionError, parse_extraction_data
from .gemini_extractor import GeminiExtractor
from .llm_extractor import AnthropicExtractor
from .models import (
    AdvisorInfo,
    ClientInfo,
    DocumentType,
    ExtractionResult,
    InvestmentRecommendation,
    SuitabilityAssessment,
)
from .pdf_reader import PDFContent, read_pdf

__all__ = [
    "AnthropicExtractor",
    "AdvisorInfo",
    "BaseExtractor",
    "ClientInfo",
    "DocumentType",
    "ExtractionError",
    "ExtractionResult",
    "GeminiExtractor",
    "InvestmentRecommendation",
    "PDFContent",
    "SuitabilityAssessment",
    "parse_extraction_data",
    "read_pdf",
]
