"""Rule type implementations and registry.

Each rule type is a generic function that can be parameterized via rule_params
stored in the database. A small set of rule types covers all compliance rules.
"""

from __future__ import annotations

from typing import Any, Callable

from src.compliance.field_resolver import resolve_field_path
from src.compliance.models import Finding
from src.extraction.models import ExtractionResult

# ---------------------------------------------------------------------------
# Rule type registry
# ---------------------------------------------------------------------------

_RULE_TYPE_REGISTRY: dict[str, Callable] = {}


def rule_type(name: str):
    """Decorator to register a rule type implementation."""

    def decorator(fn: Callable) -> Callable:
        _RULE_TYPE_REGISTRY[name] = fn
        return fn

    return decorator


def get_rule_type(name: str) -> Callable:
    """Look up a registered rule type by name."""
    if name not in _RULE_TYPE_REGISTRY:
        raise ValueError(f"Unknown rule type: {name}")
    return _RULE_TYPE_REGISTRY[name]


def list_rule_types() -> list[str]:
    return list(_RULE_TYPE_REGISTRY.keys())


# ---------------------------------------------------------------------------
# Rule type implementations
# ---------------------------------------------------------------------------


@rule_type("require_field")
def check_require_field(
    data: ExtractionResult, params: dict[str, Any], rule_name: str
) -> list[Finding]:
    """Check that a field exists and is non-empty."""
    value = resolve_field_path(data, params["field_path"])
    if value is None or value == "":
        return [Finding(message=rule_name)]
    return []


@rule_type("require_any_items")
def check_require_any_items(
    data: ExtractionResult, params: dict[str, Any], rule_name: str
) -> list[Finding]:
    """Check that a list field contains at least one item."""
    items = resolve_field_path(data, params["field_path"])
    if not items:
        return [Finding(message=rule_name)]
    return []


@rule_type("require_field_on_items")
def check_require_field_on_items(
    data: ExtractionResult, params: dict[str, Any], rule_name: str
) -> list[Finding]:
    """Check that every item in a list has a specific field populated."""
    items = resolve_field_path(data, params["list_path"]) or []
    findings = []
    for i, item in enumerate(items):
        val = (
            getattr(item, params["item_field"], None)
            if hasattr(item, params["item_field"])
            else None
        )
        if val is None or val == "":
            label = getattr(item, "product_name", None) or f"#{i + 1}"
            findings.append(
                Finding(
                    message=f"{rule_name}: {label}",
                    context={"index": i, "item_field": params["item_field"]},
                )
            )
    return findings


@rule_type("ai_evaluate")
def check_ai_evaluate(
    data: ExtractionResult, params: dict[str, Any], rule_name: str
) -> list[Finding]:
    """Placeholder for LLM-based evaluation. Returns empty (pass) for now.

    Tier 2 rules will be implemented in a later step with actual LLM calls.
    """
    # TODO: Implement LLM evaluation in step 10
    return []


@rule_type("custom")
def check_custom(
    data: ExtractionResult, params: dict[str, Any], rule_name: str
) -> list[Finding]:
    """Escape hatch for custom Python functions.

    Looks up function_name in a custom function registry.
    """
    # No custom functions registered yet
    function_name = params.get("function_name", "")
    raise NotImplementedError(f"Custom rule function not found: {function_name}")
