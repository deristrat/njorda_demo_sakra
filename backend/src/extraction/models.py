"""Pydantic models for PDF extraction results."""

from __future__ import annotations

from datetime import date
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class DocumentType(str, Enum):
    INVESTMENT_ADVICE = "investment_advice"
    PENSION_TRANSFER = "pension_transfer"
    INSURANCE_ADVICE = "insurance_advice"
    SUITABILITY_ASSESSMENT = "suitability_assessment"
    UNKNOWN = "unknown"


class RiskProfile(str, Enum):
    VERY_LOW = "very_low"
    LOW = "low"
    MEDIUM = "medium"
    MEDIUM_HIGH = "medium_high"
    HIGH = "high"
    VERY_HIGH = "very_high"


class ExperienceLevel(str, Enum):
    NONE = "none"
    LIMITED = "limited"
    MODERATE = "moderate"
    EXTENSIVE = "extensive"


class ClientInfo(BaseModel):
    person_number: str | None = Field(None, description="Swedish personnummer (YYYYMMDD-XXXX)")
    person_name: str | None = None
    address: str | None = None
    email: str | None = None
    phone: str | None = None


class AdvisorInfo(BaseModel):
    advisor_name: str | None = None
    firm_name: str | None = None
    license_number: str | None = None


class SuitabilityAssessment(BaseModel):
    risk_profile: RiskProfile | None = None
    investment_horizon: str | None = Field(None, description="e.g. '5-10 years', 'long-term'")
    experience_level: ExperienceLevel | None = None
    financial_situation: str | None = Field(None, description="Summary of client's financial situation")
    investment_objective: str | None = Field(None, description="e.g. 'growth', 'income', 'preservation'")
    loss_tolerance: str | None = Field(None, description="How much loss the client can tolerate")


class InvestmentRecommendation(BaseModel):
    product_name: str | None = None
    isin: str | None = Field(None, description="ISIN code if available")
    amount: float | None = Field(None, description="Amount in SEK")
    percentage: float | None = Field(None, description="Portfolio allocation percentage")
    motivation: str | None = Field(None, description="Why this product was recommended")


class ExtractionResult(BaseModel):
    """Top-level result from extracting a financial advisory PDF."""

    source_filename: str
    extractor_name: str = "unknown"

    # Document metadata
    document_type: DocumentType | None = None
    document_date: date | None = None
    page_count: int | None = None

    # Extracted entities
    client: ClientInfo | None = None
    advisor: AdvisorInfo | None = None
    suitability: SuitabilityAssessment | None = None
    recommendations: list[InvestmentRecommendation] | None = None

    # Pension transfer specifics
    pension_provider_from: str | None = None
    pension_provider_to: str | None = None
    transfer_amount: float | None = None

    # Escape hatches
    raw_data: dict[str, Any] = Field(default_factory=dict)
    confidence_notes: list[str] = Field(default_factory=list)
