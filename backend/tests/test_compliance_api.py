"""Tests for compliance API validation logic.

Tests the validation functions directly — no DB, no TestClient needed.
"""

from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from src.routers.compliance import (
    _validate_rule_params,
    _validate_parent_rule_id,
    VALID_DOCUMENT_TYPES,
)


# ---------------------------------------------------------------------------
# _validate_rule_params
# ---------------------------------------------------------------------------


class TestValidateRuleParams:
    """Tests for rule_params validation by rule_type."""

    # -- require_field --

    def test_require_field_valid(self):
        _validate_rule_params("require_field", {"field_path": "client.name"})

    def test_require_field_missing_field_path(self):
        with pytest.raises(HTTPException) as exc:
            _validate_rule_params("require_field", {})
        assert exc.value.status_code == 422

    def test_require_field_empty_field_path(self):
        with pytest.raises(HTTPException) as exc:
            _validate_rule_params("require_field", {"field_path": "  "})
        assert exc.value.status_code == 422

    # -- require_any_items --

    def test_require_any_items_valid(self):
        _validate_rule_params("require_any_items", {"field_path": "recommendations"})

    def test_require_any_items_missing_field_path(self):
        with pytest.raises(HTTPException) as exc:
            _validate_rule_params("require_any_items", {})
        assert exc.value.status_code == 422

    # -- require_field_on_items --

    def test_require_field_on_items_valid(self):
        _validate_rule_params(
            "require_field_on_items",
            {"list_path": "recommendations", "item_field": "motivation"},
        )

    def test_require_field_on_items_missing_list_path(self):
        with pytest.raises(HTTPException) as exc:
            _validate_rule_params(
                "require_field_on_items",
                {"item_field": "motivation"},
            )
        assert exc.value.status_code == 422

    def test_require_field_on_items_missing_item_field(self):
        with pytest.raises(HTTPException) as exc:
            _validate_rule_params(
                "require_field_on_items",
                {"list_path": "recommendations"},
            )
        assert exc.value.status_code == 422

    # -- ai_evaluate --

    def test_ai_evaluate_valid(self):
        _validate_rule_params(
            "ai_evaluate",
            {"prompt": "Check quality", "context_fields": ["client", "advisor"]},
        )

    def test_ai_evaluate_empty_prompt(self):
        with pytest.raises(HTTPException) as exc:
            _validate_rule_params(
                "ai_evaluate",
                {"prompt": "", "context_fields": ["client"]},
            )
        assert exc.value.status_code == 422

    def test_ai_evaluate_invalid_context_fields(self):
        with pytest.raises(HTTPException) as exc:
            _validate_rule_params(
                "ai_evaluate",
                {"prompt": "Check", "context_fields": ["bogus_field"]},
            )
        assert exc.value.status_code == 422

    def test_ai_evaluate_context_fields_not_a_list(self):
        with pytest.raises(HTTPException) as exc:
            _validate_rule_params(
                "ai_evaluate",
                {"prompt": "Check", "context_fields": "client"},
            )
        assert exc.value.status_code == 422

    # -- custom --

    def test_custom_valid(self):
        _validate_rule_params("custom", {"function_name": "check_transfer"})

    def test_custom_missing_function_name(self):
        with pytest.raises(HTTPException) as exc:
            _validate_rule_params("custom", {})
        assert exc.value.status_code == 422


# ---------------------------------------------------------------------------
# _validate_parent_rule_id
# ---------------------------------------------------------------------------


class TestValidateParentRuleId:
    """Tests for parent rule validation (existence + cycle detection)."""

    def _mock_db_with_rules(self, rules_dict: dict[str, str | None]):
        """Create a mock db where rules_dict maps rule_id → parent_rule_id.

        The function calls db.execute(...).scalar_one_or_none() repeatedly,
        each time querying for a different rule_id. We use the compiled SQL
        params to figure out which rule_id is being queried.
        """
        rule_objs = {}
        for rid, parent in rules_dict.items():
            r = MagicMock()
            r.rule_id = rid
            r.parent_rule_id = parent
            rule_objs[rid] = r

        def fake_execute(stmt):
            result = MagicMock()
            # Extract the bound parameter value from the compiled statement
            compiled = stmt.compile(compile_kwargs={"literal_binds": True})
            stmt_str = str(compiled)
            for rid, obj in rule_objs.items():
                # The compiled SQL will contain the literal string 'B' etc.
                if f"'{rid}'" in stmt_str:
                    result.scalar_one_or_none.return_value = obj
                    return result
            result.scalar_one_or_none.return_value = None
            return result

        db = MagicMock()
        db.execute.side_effect = fake_execute
        return db

    def test_valid_parent(self):
        db = self._mock_db_with_rules({"A": None, "B": None})
        # Should not raise
        _validate_parent_rule_id("A", "B", db)

    def test_parent_not_found(self):
        db = self._mock_db_with_rules({"A": None})
        with pytest.raises(HTTPException) as exc:
            _validate_parent_rule_id("A", "NONEXISTENT", db)
        assert exc.value.status_code == 422

    def test_circular_reference(self):
        # A→B→A would be circular
        db = self._mock_db_with_rules({"A": "B", "B": "A"})
        with pytest.raises(HTTPException) as exc:
            _validate_parent_rule_id("A", "B", db)
        assert exc.value.status_code == 422


# ---------------------------------------------------------------------------
# Document type validation
# ---------------------------------------------------------------------------


class TestDocumentTypeValidation:
    """Tests for document_types values."""

    def test_valid_types_are_subset(self):
        valid_subset = {"all", "investment_advice", "pension_transfer"}
        assert valid_subset <= VALID_DOCUMENT_TYPES

    def test_invalid_type_detected(self):
        assert "nonexistent_type" not in VALID_DOCUMENT_TYPES

    def test_expected_types_present(self):
        expected = {"all", "investment_advice", "pension_transfer",
                    "suitability_assessment", "insurance_advice"}
        assert expected == VALID_DOCUMENT_TYPES
