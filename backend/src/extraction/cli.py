"""CLI runner for PDF extraction with multi-model comparison.

Usage:
    python -m src.extraction.cli                    # All models, all PDFs
    python -m src.extraction.cli --pdf 1            # All models, PDF #1
    python -m src.extraction.cli --model claude-sonnet  # Single model
"""

from __future__ import annotations

import argparse
import asyncio
import sys
import time
from dataclasses import dataclass
from pathlib import Path

from .base import BaseExtractor
from .models import ExtractionResult

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent  # backend/
TEST_PDF_DIR = BACKEND_DIR / "test_pdfs"

TEST_PDFS = {
    "1": "1_perfect_advice.pdf",
    "2": "2_missing_fields.pdf",
    "3": "3_pension_transfer.pdf",
    "4": "4_minimal_bad.pdf",
}

# (display_name, provider, model_id)
MODELS = [
    ("claude-opus", "anthropic", "claude-opus-4-6"),
    ("claude-sonnet", "anthropic", "claude-sonnet-4-20250514"),
    ("gemini-2.5-pro", "gemini", "gemini-2.5-pro"),
    ("gemini-3-pro", "gemini", "gemini-3-pro-preview"),
    ("gemini-3-flash", "gemini", "gemini-3-flash-preview"),
]

MODEL_NAMES = [m[0] for m in MODELS]

# ANSI colors
GREEN = "\033[32m"
RED = "\033[31m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"
CYAN = "\033[36m"
YELLOW = "\033[33m"


def load_env():
    """Load .env file from backend dir (simple key=value parser)."""
    import os

    env_file = BACKEND_DIR / ".env"
    if not env_file.exists():
        return
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" in line:
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip("'\"")
            if key and key not in os.environ:
                os.environ[key] = value


def make_extractor(display_name: str, provider: str, model_id: str) -> BaseExtractor:
    if provider == "anthropic":
        from .llm_extractor import AnthropicExtractor
        return AnthropicExtractor(model=model_id, display_name=display_name)
    elif provider == "gemini":
        from .gemini_extractor import GeminiExtractor
        return GeminiExtractor(model=model_id, display_name=display_name)
    else:
        raise ValueError(f"Unknown provider: {provider}")


def resolve_pdfs(pdf_arg: str | None) -> list[Path]:
    if pdf_arg is None:
        paths = sorted(TEST_PDF_DIR.glob("*.pdf"))
        if not paths:
            print(f"No PDFs found in {TEST_PDF_DIR}", file=sys.stderr)
            sys.exit(1)
        return paths

    if pdf_arg in TEST_PDFS:
        return [TEST_PDF_DIR / TEST_PDFS[pdf_arg]]

    p = Path(pdf_arg)
    if p.exists():
        return [p]

    print(f"PDF not found: {pdf_arg}", file=sys.stderr)
    sys.exit(1)


@dataclass
class RunResult:
    model_name: str
    result: ExtractionResult | None
    error: str | None
    elapsed: float


def _get_field(result: ExtractionResult, field_name: str) -> str:
    """Extract a comparable string value for a field name."""
    if field_name == "document_type":
        v = result.document_type
        return v.value if v else "-"
    elif field_name == "document_date":
        return str(result.document_date) if result.document_date else "-"
    elif field_name == "client_name":
        return result.client.person_name if result.client and result.client.person_name else "-"
    elif field_name == "client_pnr":
        return result.client.person_number if result.client and result.client.person_number else "-"
    elif field_name == "advisor_name":
        return result.advisor.advisor_name if result.advisor and result.advisor.advisor_name else "-"
    elif field_name == "advisor_firm":
        return result.advisor.firm_name if result.advisor and result.advisor.firm_name else "-"
    elif field_name == "risk_profile":
        v = result.suitability.risk_profile if result.suitability else None
        return v.value if v else "-"
    elif field_name == "experience":
        v = result.suitability.experience_level if result.suitability else None
        return v.value if v else "-"
    elif field_name == "horizon":
        return result.suitability.investment_horizon if result.suitability and result.suitability.investment_horizon else "-"
    elif field_name == "objective":
        v = result.suitability.investment_objective if result.suitability and result.suitability.investment_objective else "-"
        return v[:40] if len(v) > 40 else v
    elif field_name == "num_recs":
        return str(len(result.recommendations)) if result.recommendations else "0"
    elif field_name == "pension_from":
        return result.pension_provider_from or "-"
    elif field_name == "pension_to":
        return result.pension_provider_to or "-"
    elif field_name == "transfer_amt":
        return f"{result.transfer_amount:,.0f}" if result.transfer_amount else "-"
    return "-"


COMPARE_FIELDS = [
    ("document_type", "doc_type"),
    ("document_date", "doc_date"),
    ("client_name", "client"),
    ("client_pnr", "personnummer"),
    ("advisor_name", "advisor"),
    ("advisor_firm", "firm"),
    ("risk_profile", "risk"),
    ("experience", "experience"),
    ("horizon", "horizon"),
    ("objective", "objective"),
    ("num_recs", "# recs"),
    ("pension_from", "pension_from"),
    ("pension_to", "pension_to"),
    ("transfer_amt", "transfer_amt"),
]


def print_comparison(filename: str, page_count: int | None, runs: list[RunResult]):
    """Print speed + field-by-field comparison table."""
    successful = [r for r in runs if r.result is not None]
    failed = [r for r in runs if r.result is None]

    # Header
    print(f"\n{BOLD}{'=' * 100}")
    print(f"  {filename}" + (f"  ({page_count} pages)" if page_count else ""))
    print(f"{'=' * 100}{RESET}")

    # ── SPEED ──
    print(f"\n  {BOLD}SPEED{RESET}")

    all_times = [r.elapsed for r in runs]
    fastest = min(all_times) if all_times else 0
    max_time = max(all_times) if all_times else 1
    bar_max = 40

    for r in runs:
        bar_len = int(r.elapsed / max_time * bar_max) if max_time > 0 else 0
        bar = "█" * bar_len

        if r.result is None:
            print(f"    {r.model_name:<18} {RED}FAILED ({r.elapsed:.1f}s){RESET}")
        elif r.elapsed == fastest:
            print(f"    {GREEN}{r.model_name:<18} {r.elapsed:>5.1f}s  {bar}{RESET}")
        else:
            print(f"    {r.model_name:<18} {r.elapsed:>5.1f}s  {DIM}{bar}{RESET}")

    if len(successful) < 2:
        if failed:
            print(f"\n  {BOLD}ERRORS{RESET}")
            for r in failed:
                err_short = r.error[:120] if r.error else "unknown"
                print(f"    {RED}{r.model_name}: {err_short}{RESET}")
        print()
        return

    # ── FIELD-BY-FIELD TABLE ──
    col_w = 20
    label_w = 14
    names = [r.model_name for r in successful]

    # Header row
    print(f"\n  {BOLD}FIELD-BY-FIELD{RESET}")
    header = f"  {'':<{label_w}}"
    for name in names:
        header += f"  {BOLD}{name:<{col_w}}{RESET}"
    print(header)
    print(f"  {'─' * (label_w + (col_w + 2) * len(names) + 6)}")

    agree_count = 0
    total_count = 0

    for field_key, field_label in COMPARE_FIELDS:
        values = [_get_field(r.result, field_key) for r in successful]

        # Skip fields that are all empty
        if all(v == "-" for v in values):
            continue

        total_count += 1
        normalized = [v.strip().lower() for v in values]
        all_agree = len(set(normalized)) == 1

        if all_agree:
            agree_count += 1
            mark = f"{GREEN}  ✓{RESET}"
        else:
            mark = f"{RED}  ✗{RESET}"

        row = f"  {field_label:<{label_w}}"
        for v in values:
            display = v if len(v) <= col_w else v[: col_w - 1] + "…"
            if all_agree:
                row += f"  {display:<{col_w}}"
            else:
                # Highlight disagreeing values
                row += f"  {YELLOW}{display:<{col_w}}{RESET}"

        row += mark
        print(row)

    # ── SUMMARY ──
    if total_count > 0:
        pct = agree_count / total_count * 100
        color = GREEN if pct >= 90 else YELLOW if pct >= 70 else RED
        print(f"\n  {BOLD}AGREEMENT:{RESET} {color}{agree_count}/{total_count} fields ({pct:.0f}%){RESET}")

    if failed:
        print(f"\n  {BOLD}ERRORS{RESET}")
        for r in failed:
            err_short = r.error[:120] if r.error else "unknown"
            print(f"    {RED}{r.model_name}: {err_short}{RESET}")

    print()


async def run_single(extractor: BaseExtractor, pdf_path: Path) -> RunResult:
    """Run a single extractor on a single PDF, capturing timing and errors."""
    t0 = time.monotonic()
    try:
        result = await extractor.extract(pdf_path)
        elapsed = time.monotonic() - t0
        return RunResult(extractor.name, result, None, elapsed)
    except Exception as e:
        elapsed = time.monotonic() - t0
        return RunResult(extractor.name, None, str(e), elapsed)


async def run_pdf(extractors: list[BaseExtractor], path: Path) -> tuple[str, int | None, list[RunResult]]:
    """Run all extractors on one PDF. Returns (filename, page_count, runs)."""
    tasks = [run_single(ext, path) for ext in extractors]
    runs = await asyncio.gather(*tasks)

    page_count = None
    for r in runs:
        if r.result and r.result.page_count:
            page_count = r.result.page_count
            break

    return path.name, page_count, list(runs)


async def run(pdf_paths: list[Path], model_configs: list[tuple[str, str, str]]):
    extractors: list[BaseExtractor] = []
    for display_name, provider, model_id in model_configs:
        try:
            extractors.append(make_extractor(display_name, provider, model_id))
        except Exception as e:
            print(f"  {RED}Skipping {display_name}: {e}{RESET}", file=sys.stderr)

    if not extractors:
        print("No extractors available.", file=sys.stderr)
        sys.exit(1)

    n_total = len(extractors) * len(pdf_paths)
    print(f"\n{DIM}Running {len(extractors)} models × {len(pdf_paths)} PDFs = {n_total} extractions in parallel...{RESET}")

    # Fire ALL models × ALL PDFs in parallel
    pdf_tasks = [run_pdf(extractors, path) for path in pdf_paths]
    all_results = await asyncio.gather(*pdf_tasks)

    # Print results in order
    for filename, page_count, runs in all_results:
        print_comparison(filename, page_count, runs)


def main():
    parser = argparse.ArgumentParser(description="Extract data from advisory PDFs")
    parser.add_argument(
        "--pdf",
        default=None,
        help="PDF number (1-4) or path. Omit for all test PDFs.",
    )
    parser.add_argument(
        "--model",
        default=None,
        help=f"Model to use ({', '.join(MODEL_NAMES)}). Omit for all.",
    )
    args = parser.parse_args()

    load_env()
    pdf_paths = resolve_pdfs(args.pdf)

    if args.model:
        matched = [m for m in MODELS if m[0] == args.model]
        if not matched:
            print(f"Unknown model: {args.model}. Available: {', '.join(MODEL_NAMES)}", file=sys.stderr)
            sys.exit(1)
        model_configs = matched
    else:
        model_configs = MODELS

    asyncio.run(run(pdf_paths, model_configs))


if __name__ == "__main__":
    main()
