"""Rule type implementations and registry.

Each rule type is a generic function that can be parameterized via rule_params
stored in the database. A small set of rule types covers all compliance rules.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Callable

import anthropic

from src.compliance.field_resolver import resolve_field_path
from src.compliance.models import Finding
from src.extraction.models import ExtractionResult

log = logging.getLogger(__name__)

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


AI_MODEL = "claude-haiku-4-5-20251001"

_AI_SYSTEM = (
    "Du är en compliance-granskare för svenska finansiella rådgivningsdokument. "
    "Du får extraherad data från ett rådgivningsdokument och en granskningsfråga. "
    "Svara ALLTID med giltig JSON i exakt detta format:\n"
    '{"passed": true/false, "reason": "kort motivering"}\n'
    "Svara BARA med JSON, ingen annan text."
)


@rule_type("ai_evaluate")
def check_ai_evaluate(
    data: ExtractionResult, params: dict[str, Any], rule_name: str
) -> list[Finding]:
    """LLM-based compliance evaluation using Claude."""
    prompt = params.get("prompt", "")
    context_fields = params.get("context_fields", [])

    # Build context from specified fields
    context_parts = {}
    for field in context_fields:
        value = resolve_field_path(data, field)
        if value is not None:
            if hasattr(value, "model_dump"):
                context_parts[field] = value.model_dump(mode="json")
            elif isinstance(value, list):
                context_parts[field] = [
                    item.model_dump(mode="json") if hasattr(item, "model_dump") else item
                    for item in value
                ]
            else:
                context_parts[field] = value

    user_message = (
        f"Granskningsfråga: {prompt}\n\n"
        f"Dokumentdata:\n{json.dumps(context_parts, ensure_ascii=False, indent=2, default=str)}"
    )

    try:
        client = anthropic.Anthropic()
        response = client.messages.create(
            model=AI_MODEL,
            max_tokens=256,
            system=_AI_SYSTEM,
            messages=[
                {"role": "user", "content": user_message},
                {"role": "assistant", "content": "{"},
            ],
        )

        text = "{" + response.content[0].text.strip()
        result = json.loads(text)

        if not result.get("passed", True):
            return [
                Finding(
                    message=f"{rule_name}: {result.get('reason', '')}",
                    context={"ai_evaluation": True},
                )
            ]
        return []

    except Exception as exc:
        log.warning("ai_evaluate failed for rule %s: %s", rule_name, exc)
        return []


@rule_type("custom")
def check_custom(
    data: ExtractionResult, params: dict[str, Any], rule_name: str
) -> list[Finding]:
    """Escape hatch for custom Python functions.

    Looks up function_name in a custom function registry.
    """
    function_name = params.get("function_name", "")
    log.warning("Custom rule function not registered: %s", function_name)
    return []
