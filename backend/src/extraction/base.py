"""Abstract base class for PDF extractors and shared utilities."""

from __future__ import annotations

from abc import ABC, abstractmethod

from .models import (
    AdvisorInfo,
    ClientInfo,
    ExtractionResult,
    InvestmentRecommendation,
    SuitabilityAssessment,
)


class ExtractionError(Exception):
    """Raised when extraction fails."""


class BaseExtractor(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        """Identifier for this extractor (e.g. 'anthropic', 'gemini')."""

    @abstractmethod
    async def extract(self, pdf_data: bytes, filename: str = "document.pdf") -> ExtractionResult:
        """Extract structured data from PDF bytes.

        Args:
            pdf_data: Raw PDF file bytes.
            filename: Original filename for reference.

        Returns:
            ExtractionResult with populated fields.

        Raises:
            ExtractionError: If extraction fails.
        """


def parse_extraction_data(
    data: dict, filename: str, page_count: int, extractor_name: str
) -> ExtractionResult:
    """Parse a raw extraction dict into an ExtractionResult.

    Shared by all extractors that produce the same JSON schema output.
    """
    client_data = data.get("client")
    advisor_data = data.get("advisor")
    suitability_data = data.get("suitability")
    recs_data = data.get("recommendations")

    return ExtractionResult(
        source_filename=filename,
        extractor_name=extractor_name,
        document_type=data.get("document_type"),
        document_date=data.get("document_date"),
        page_count=page_count,
        client=ClientInfo(**client_data) if client_data else None,
        advisor=AdvisorInfo(**advisor_data) if advisor_data else None,
        suitability=SuitabilityAssessment(**suitability_data)
        if suitability_data
        else None,
        recommendations=[InvestmentRecommendation(**r) for r in recs_data]
        if recs_data
        else None,
        pension_provider_from=data.get("pension_provider_from"),
        pension_provider_to=data.get("pension_provider_to"),
        transfer_amount=data.get("transfer_amount"),
        raw_data=data.get("raw_data") or {},
        confidence_notes=data.get("confidence_notes") or [],
    )
