"""Tests for rule type implementations."""

from src.compliance.rule_types import get_rule_type, list_rule_types
from src.extraction.models import (
    AdvisorInfo,
    DocumentType,
    ExtractionResult,
    InvestmentRecommendation,
    SuitabilityAssessment,
    RiskProfile,
    ExperienceLevel,
)


def _full_extraction() -> ExtractionResult:
    return ExtractionResult(
        source_filename="test.pdf",
        document_type=DocumentType.INVESTMENT_ADVICE,
        client=None,
        advisor=AdvisorInfo(advisor_name="Erik", firm_name="Säkra AB"),
        suitability=SuitabilityAssessment(
            risk_profile=RiskProfile.MEDIUM,
            experience_level=ExperienceLevel.MODERATE,
            financial_situation="Stabil",
            investment_objective="Pension",
            loss_tolerance="20%",
            investment_horizon="10 år",
        ),
        recommendations=[
            InvestmentRecommendation(
                product_name="Fond A",
                isin=None,
                amount=None,
                percentage=None,
                motivation="Bra val",
            ),
            InvestmentRecommendation(
                product_name="Fond B",
                isin=None,
                amount=None,
                percentage=None,
                motivation=None,
            ),
            InvestmentRecommendation(
                product_name=None,
                isin=None,
                amount=None,
                percentage=None,
                motivation=None,
            ),
        ],
    )


def _empty_extraction() -> ExtractionResult:
    return ExtractionResult(source_filename="empty.pdf")


class TestRuleTypeRegistry:
    def test_all_types_registered(self):
        types = list_rule_types()
        assert "require_field" in types
        assert "require_any_items" in types
        assert "require_field_on_items" in types
        assert "ai_evaluate" in types
        assert "custom" in types

    def test_get_unknown_type_raises(self):
        import pytest

        with pytest.raises(ValueError, match="Unknown rule type"):
            get_rule_type("nonexistent")


class TestRequireField:
    def test_field_present(self):
        fn = get_rule_type("require_field")
        result = fn(
            _full_extraction(),
            {"field_path": "advisor.advisor_name"},
            "Test rule",
        )
        assert result == []

    def test_field_missing(self):
        fn = get_rule_type("require_field")
        result = fn(
            _empty_extraction(),
            {"field_path": "advisor.advisor_name"},
            "Rådgivarens namn saknas",
        )
        assert len(result) == 1
        assert result[0].message == "Rådgivarens namn saknas"

    def test_object_present(self):
        fn = get_rule_type("require_field")
        result = fn(_full_extraction(), {"field_path": "suitability"}, "Test")
        assert result == []

    def test_object_missing(self):
        fn = get_rule_type("require_field")
        result = fn(_empty_extraction(), {"field_path": "suitability"}, "Test")
        assert len(result) == 1

    def test_enum_field_present(self):
        fn = get_rule_type("require_field")
        result = fn(
            _full_extraction(),
            {"field_path": "suitability.risk_profile"},
            "Test",
        )
        assert result == []


class TestRequireAnyItems:
    def test_items_present(self):
        fn = get_rule_type("require_any_items")
        result = fn(_full_extraction(), {"field_path": "recommendations"}, "Test")
        assert result == []

    def test_items_missing(self):
        fn = get_rule_type("require_any_items")
        result = fn(_empty_extraction(), {"field_path": "recommendations"}, "Test")
        assert len(result) == 1

    def test_empty_list(self):
        fn = get_rule_type("require_any_items")
        data = _full_extraction()
        data.recommendations = []
        result = fn(data, {"field_path": "recommendations"}, "Test")
        assert len(result) == 1


class TestRequireFieldOnItems:
    def test_all_items_have_field(self):
        fn = get_rule_type("require_field_on_items")
        data = _full_extraction()
        # Give all items motivation
        assert data.recommendations is not None
        for rec in data.recommendations:
            rec.motivation = "Some motivation"
        result = fn(
            data,
            {"list_path": "recommendations", "item_field": "motivation"},
            "Motivation saknas",
        )
        assert result == []

    def test_some_items_missing_field(self):
        fn = get_rule_type("require_field_on_items")
        data = _full_extraction()
        # Fond B and #3 have no motivation
        result = fn(
            data,
            {"list_path": "recommendations", "item_field": "motivation"},
            "Motivation saknas",
        )
        assert len(result) == 2
        # Check context
        assert result[0].context["index"] == 1
        assert "Fond B" in result[0].message
        assert result[1].context["index"] == 2

    def test_no_items(self):
        fn = get_rule_type("require_field_on_items")
        data = _empty_extraction()
        result = fn(
            data,
            {"list_path": "recommendations", "item_field": "motivation"},
            "Test",
        )
        assert result == []  # No items = nothing to check


class TestAiEvaluate:
    def test_placeholder_returns_pass(self):
        """AI evaluate is a placeholder that always passes for now."""
        fn = get_rule_type("ai_evaluate")
        result = fn(
            _full_extraction(),
            {"prompt": "test prompt", "context_fields": []},
            "Test",
        )
        assert result == []
