"""Tests for the field resolver utility."""

from datetime import date

from src.compliance.field_resolver import resolve_field_path
from src.extraction.models import (
    AdvisorInfo,
    ClientInfo,
    DocumentType,
    ExtractionResult,
    ExperienceLevel,
    InvestmentRecommendation,
    RiskProfile,
    SuitabilityAssessment,
)


def _full_extraction() -> ExtractionResult:
    """A fully-populated ExtractionResult for testing."""
    return ExtractionResult(
        source_filename="test.pdf",
        document_type=DocumentType.INVESTMENT_ADVICE,
        document_date=date(2024, 1, 15),
        page_count=5,
        client=ClientInfo(
            person_name="Anna Svensson",
            person_number="19850101-1234",
        ),
        advisor=AdvisorInfo(
            advisor_name="Erik Johansson",
            firm_name="Säkra AB",
            license_number="INS-12345",
        ),
        suitability=SuitabilityAssessment(
            risk_profile=RiskProfile.MEDIUM,
            investment_horizon="10 år",
            experience_level=ExperienceLevel.MODERATE,
            financial_situation="Stabil ekonomi, inga skulder",
            investment_objective="Pension",
            loss_tolerance="Kan tolerera 20% förlust",
        ),
        recommendations=[
            InvestmentRecommendation(
                product_name="Fond A",
                isin="SE0000000001",
                amount=100000,
                percentage=60,
                motivation="Passar riskprofilen",
            ),
            InvestmentRecommendation(
                product_name="Fond B",
                isin=None,
                amount=50000,
                percentage=40,
                motivation=None,
            ),
        ],
        pension_provider_from="Gamla Liv",
        pension_provider_to="Nya Banken",
        transfer_amount=500000.0,
    )


def _empty_extraction() -> ExtractionResult:
    """A minimal ExtractionResult with nothing filled in."""
    return ExtractionResult(source_filename="empty.pdf")


class TestResolveFieldPath:
    def test_top_level_field(self):
        data = _full_extraction()
        assert resolve_field_path(data, "document_date") is not None

    def test_nested_field(self):
        data = _full_extraction()
        assert resolve_field_path(data, "advisor.advisor_name") == "Erik Johansson"

    def test_deep_nested_field(self):
        data = _full_extraction()
        assert (
            resolve_field_path(data, "suitability.risk_profile") == RiskProfile.MEDIUM
        )

    def test_missing_top_level(self):
        data = _empty_extraction()
        assert resolve_field_path(data, "document_date") is None

    def test_missing_nested_parent(self):
        data = _empty_extraction()
        assert resolve_field_path(data, "advisor.advisor_name") is None

    def test_missing_nested_child(self):
        data = _full_extraction()
        # advisor exists but license_number is set
        assert data.advisor is not None
        data.advisor.license_number = None
        assert resolve_field_path(data, "advisor.license_number") is None

    def test_object_exists(self):
        data = _full_extraction()
        result = resolve_field_path(data, "suitability")
        assert result is not None
        assert isinstance(result, SuitabilityAssessment)

    def test_object_missing(self):
        data = _empty_extraction()
        assert resolve_field_path(data, "suitability") is None

    def test_list_field(self):
        data = _full_extraction()
        result = resolve_field_path(data, "recommendations")
        assert isinstance(result, list)
        assert len(result) == 2

    def test_nonexistent_path(self):
        data = _full_extraction()
        assert resolve_field_path(data, "nonexistent.field") is None

    def test_numeric_field(self):
        data = _full_extraction()
        assert resolve_field_path(data, "transfer_amount") == 500000.0

    def test_enum_field(self):
        data = _full_extraction()
        result = resolve_field_path(data, "suitability.experience_level")
        assert result == ExperienceLevel.MODERATE
