"""Tests for the compliance engine.

These tests use mock ComplianceRule objects (not DB) to test the engine logic
in isolation. The engine.check_document needs a db Session only for threshold
lookup, so we mock that.
"""

from unittest.mock import MagicMock

from datetime import date

from src.compliance.engine import check_document
from src.extraction.models import (
    AdvisorInfo,
    ClientInfo,
    DocumentType,
    ExtractionResult,
    InvestmentRecommendation,
    RiskProfile,
    ExperienceLevel,
    SuitabilityAssessment,
)
from src.models.compliance import ComplianceRule


def _make_rule(**kwargs) -> ComplianceRule:
    """Create a mock ComplianceRule with sensible defaults."""
    defaults = {
        "id": 1,
        "rule_id": "TEST_001",
        "name": "Test rule",
        "category": "test",
        "tier": 1,
        "rule_type": "require_field",
        "rule_params": {"field_path": "advisor.advisor_name"},
        "document_types": ["all"],
        "default_severity": "error",
        "severity_override": None,
        "max_deduction": 10,
        "remediation": "Fix it",
        "parent_rule_id": None,
        "enabled": True,
        "sort_order": 0,
    }
    defaults.update(kwargs)
    rule = MagicMock(spec=ComplianceRule)
    for k, v in defaults.items():
        setattr(rule, k, v)
    return rule


def _full_extraction() -> ExtractionResult:
    return ExtractionResult(
        source_filename="test.pdf",
        document_type=DocumentType.INVESTMENT_ADVICE,
        document_date=date(2024, 1, 15),
        client=ClientInfo(person_number=None, person_name="Anna"),
        advisor=AdvisorInfo(advisor_name="Erik", firm_name="Säkra"),
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
                motivation="Bra",
            ),
        ],
    )


def _empty_extraction() -> ExtractionResult:
    return ExtractionResult(source_filename="empty.pdf")


def _mock_db():
    """Create a mock DB session that returns default thresholds."""
    db = MagicMock()
    db.get.return_value = None  # No settings in DB -> use defaults
    return db


class TestCheckDocument:
    def test_all_pass_gives_green(self):
        rules = [
            _make_rule(
                rule_id="R1", rule_params={"field_path": "advisor.advisor_name"}
            ),
            _make_rule(
                rule_id="R2",
                rule_params={"field_path": "client.person_name"},
                max_deduction=5,
            ),
        ]
        report = check_document(_full_extraction(), rules, _mock_db())
        assert report.status == "green"
        assert report.score == 100
        assert report.summary.passed == 2
        assert report.summary.failed == 0

    def test_one_failure_deducts_points(self):
        rules = [
            _make_rule(
                rule_id="R1",
                rule_params={"field_path": "advisor.advisor_name"},
                max_deduction=12,
            ),
        ]
        report = check_document(_empty_extraction(), rules, _mock_db())
        assert report.score == 88
        assert report.status == "green"  # 88 >= 85
        assert report.summary.failed == 1
        assert report.summary.errors == 1

    def test_multiple_failures_drops_to_yellow(self):
        rules = [
            _make_rule(
                rule_id="R1",
                rule_params={"field_path": "advisor.advisor_name"},
                max_deduction=12,
            ),
            _make_rule(
                rule_id="R2",
                rule_params={"field_path": "advisor.firm_name"},
                max_deduction=10,
            ),
        ]
        report = check_document(_empty_extraction(), rules, _mock_db())
        assert report.score == 78  # 100 - 12 - 10
        assert report.status == "yellow"

    def test_heavy_failures_drops_to_red(self):
        rules = [
            _make_rule(
                rule_id=f"R{i}",
                rule_params={"field_path": "advisor.advisor_name"},
                max_deduction=20,
            )
            for i in range(4)
        ]
        report = check_document(_empty_extraction(), rules, _mock_db())
        assert report.score == max(0, 100 - 80)
        assert report.score == 20
        assert report.status == "red"

    def test_score_floors_at_zero(self):
        rules = [
            _make_rule(
                rule_id=f"R{i}",
                rule_params={"field_path": "advisor.advisor_name"},
                max_deduction=50,
            )
            for i in range(5)
        ]
        report = check_document(_empty_extraction(), rules, _mock_db())
        assert report.score == 0

    def test_warning_severity(self):
        rules = [
            _make_rule(
                rule_id="R1",
                rule_params={"field_path": "advisor.advisor_name"},
                default_severity="warning",
                max_deduction=3,
            ),
        ]
        report = check_document(_empty_extraction(), rules, _mock_db())
        assert report.summary.warnings == 1
        assert report.summary.errors == 0

    def test_severity_override(self):
        rules = [
            _make_rule(
                rule_id="R1",
                rule_params={"field_path": "advisor.advisor_name"},
                default_severity="error",
                severity_override="warning",
                max_deduction=10,
            ),
        ]
        report = check_document(_empty_extraction(), rules, _mock_db())
        assert report.outcomes[0].severity == "warning"
        assert report.summary.warnings == 1


class TestHierarchy:
    def test_children_skipped_when_parent_fails(self):
        parent = _make_rule(
            rule_id="PARENT",
            rule_params={"field_path": "suitability"},
            max_deduction=15,
        )
        child1 = _make_rule(
            rule_id="CHILD1",
            rule_params={"field_path": "suitability.risk_profile"},
            parent_rule_id="PARENT",
            max_deduction=10,
        )
        child2 = _make_rule(
            rule_id="CHILD2",
            rule_params={"field_path": "suitability.financial_situation"},
            parent_rule_id="PARENT",
            max_deduction=10,
        )

        # Empty extraction -> parent fails -> children skipped
        report = check_document(
            _empty_extraction(), [parent, child1, child2], _mock_db()
        )
        assert report.outcomes[0].status == "failed"
        assert report.outcomes[1].status == "skipped"
        assert report.outcomes[2].status == "skipped"
        # Only parent deducts
        assert report.score == 85  # 100 - 15
        assert report.summary.skipped == 2

    def test_children_run_when_parent_passes(self):
        parent = _make_rule(
            rule_id="PARENT",
            rule_params={"field_path": "suitability"},
            max_deduction=15,
        )
        child1 = _make_rule(
            rule_id="CHILD1",
            rule_params={"field_path": "suitability.risk_profile"},
            parent_rule_id="PARENT",
            max_deduction=10,
        )
        child2 = _make_rule(
            rule_id="CHILD2",
            rule_params={"field_path": "suitability.financial_situation"},
            parent_rule_id="PARENT",
            max_deduction=10,
        )

        # Full extraction -> parent passes -> children run and pass
        report = check_document(
            _full_extraction(), [parent, child1, child2], _mock_db()
        )
        assert report.outcomes[0].status == "passed"
        assert report.outcomes[1].status == "passed"
        assert report.outcomes[2].status == "passed"
        assert report.score == 100

    def test_child_fails_while_parent_passes(self):
        parent = _make_rule(
            rule_id="PARENT",
            rule_params={"field_path": "suitability"},
            max_deduction=15,
        )
        child = _make_rule(
            rule_id="CHILD",
            # This field doesn't exist on SuitabilityAssessment
            rule_params={"field_path": "suitability.sustainability_preference"},
            parent_rule_id="PARENT",
            max_deduction=5,
        )

        report = check_document(_full_extraction(), [parent, child], _mock_db())
        assert report.outcomes[0].status == "passed"
        assert report.outcomes[1].status == "failed"
        assert report.score == 95  # Only child deducts


class TestMultipleFindings:
    def test_require_field_on_items_multiple_findings(self):
        rules = [
            _make_rule(
                rule_id="R1",
                rule_type="require_field_on_items",
                rule_params={
                    "list_path": "recommendations",
                    "item_field": "motivation",
                },
                max_deduction=4,
                default_severity="warning",
            ),
        ]

        data = _full_extraction()
        data.recommendations = [
            InvestmentRecommendation(
                product_name="A",
                isin=None,
                amount=None,
                percentage=None,
                motivation="Good",
            ),
            InvestmentRecommendation(
                product_name="B",
                isin=None,
                amount=None,
                percentage=None,
                motivation=None,
            ),
            InvestmentRecommendation(
                product_name="C",
                isin=None,
                amount=None,
                percentage=None,
                motivation=None,
            ),
        ]

        report = check_document(data, rules, _mock_db())
        assert report.outcomes[0].status == "failed"
        assert len(report.outcomes[0].findings) == 2
        # Deduction is per-rule, not per-finding
        assert report.score == 96  # 100 - 4


class TestSeedDataIntegration:
    """Test that seed rules produce sensible results against mock data."""

    def test_full_document_scores_high(self):
        """A well-documented investment advice should score near 100."""
        from src.compliance.seed import DEFAULT_RULES

        doc_type = "investment_advice"
        rules = []
        for i, rd in enumerate(DEFAULT_RULES):
            if not rd.get("enabled", True):
                continue
            doc_types = rd.get("document_types", [])
            if "all" not in doc_types and doc_type not in doc_types:
                continue
            rules.append(_make_rule(**{**rd, "id": i}))

        data = _full_extraction()
        report = check_document(data, rules, _mock_db())

        # Should pass most rules
        assert report.score >= 85
        assert report.status == "green"

    def test_empty_document_scores_low(self):
        """An empty document should fail many rules and score low."""
        from src.compliance.seed import DEFAULT_RULES

        doc_type = "investment_advice"
        rules = []
        for i, rd in enumerate(DEFAULT_RULES):
            if not rd.get("enabled", True):
                continue
            doc_types = rd.get("document_types", [])
            if "all" not in doc_types and doc_type not in doc_types:
                continue
            rules.append(_make_rule(**{**rd, "id": i}))

        data = ExtractionResult(
            source_filename="empty.pdf",
            document_type=DocumentType.INVESTMENT_ADVICE,
        )
        report = check_document(data, rules, _mock_db())

        # Should fail multiple rules
        assert report.score < 50
        assert report.status == "red"
        assert report.summary.errors > 0
