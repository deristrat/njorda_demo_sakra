"""Scan real-world test PDFs and produce an extraction summary.

Usage:
    python -m src.extraction.scan_new              # All PDFs in test_pdfs/new/
    python -m src.extraction.scan_new --limit 5    # First 5 only
    python -m src.extraction.scan_new --concurrency 5
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

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
NEW_PDF_DIR = BACKEND_DIR / "test_pdfs" / "new"

MODEL_CONFIG = ("gemini-3-flash", "gemini", "gemini-3-flash-preview")

# ANSI
GREEN = "\033[32m"
RED = "\033[31m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"
CYAN = "\033[36m"
YELLOW = "\033[33m"


def load_env():
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


def make_extractor() -> BaseExtractor:
    display_name, provider, model_id = MODEL_CONFIG
    from .gemini_extractor import GeminiExtractor

    return GeminiExtractor(model=model_id, display_name=display_name)


@dataclass
class ScanResult:
    filename: str
    result: ExtractionResult | None = None
    error: str | None = None
    elapsed: float = 0.0


def truncate(s: str | None, max_len: int = 35) -> str:
    if not s:
        return "-"
    s = s.replace("\n", " ").strip()
    return s[: max_len - 1] + "…" if len(s) > max_len else s


async def extract_one(
    extractor: BaseExtractor,
    pdf_path: Path,
    semaphore: asyncio.Semaphore,
    index: int,
    total: int,
) -> ScanResult:
    async with semaphore:
        name = pdf_path.name
        print(f"  {DIM}[{index}/{total}] Extracting {name}...{RESET}", flush=True)
        t0 = time.monotonic()
        try:
            result = await extractor.extract(pdf_path)
            elapsed = time.monotonic() - t0
            print(
                f"  {GREEN}[{index}/{total}] ✓ {name} ({elapsed:.1f}s){RESET}",
                flush=True,
            )
            return ScanResult(name, result=result, elapsed=elapsed)
        except Exception as e:
            elapsed = time.monotonic() - t0
            print(
                f"  {RED}[{index}/{total}] ✗ {name} ({elapsed:.1f}s): {e!s:.80}{RESET}",
                flush=True,
            )
            return ScanResult(name, error=str(e), elapsed=elapsed)


def print_summary(results: list[ScanResult]):
    successful = [r for r in results if r.result]
    failed = [r for r in results if r.error]

    # ── Summary table ──
    print(f"\n{BOLD}{'=' * 130}")
    print(
        f"  EXTRACTION SUMMARY — {len(successful)} succeeded, {len(failed)} failed, {len(results)} total"
    )
    print(f"{'=' * 130}{RESET}\n")

    # Column headers
    col_file = 45
    col_type = 22
    col_firm = 25
    col_date = 12
    col_notes = 3
    col_time = 6

    header = (
        f"  {BOLD}{'File':<{col_file}}"
        f"  {'Doc Type':<{col_type}}"
        f"  {'Firm / Advisor':<{col_firm}}"
        f"  {'Date':<{col_date}}"
        f"  {'♯N':<{col_notes}}"
        f"  {'Time':>{col_time}}{RESET}"
    )
    print(header)
    print(
        f"  {'─' * (col_file + col_type + col_firm + col_date + col_notes + col_time + 10)}"
    )

    # Group by document type
    type_counts: dict[str, int] = {}

    for r in sorted(results, key=lambda x: x.filename):
        if r.result:
            res = r.result
            doc_type = res.document_type.value if res.document_type else "?"
            type_counts[doc_type] = type_counts.get(doc_type, 0) + 1

            firm = "-"
            if res.advisor and res.advisor.firm_name:
                firm = res.advisor.firm_name
            elif res.advisor and res.advisor.advisor_name:
                firm = res.advisor.advisor_name

            doc_date = str(res.document_date) if res.document_date else "-"
            n_notes = len(res.confidence_notes) if res.confidence_notes else 0

            type_color = {
                "investment_advice": CYAN,
                "pension_transfer": YELLOW,
                "insurance_advice": GREEN,
                "suitability_assessment": "\033[35m",  # magenta
                "unknown": DIM,
            }.get(doc_type, "")

            print(
                f"  {truncate(r.filename, col_file):<{col_file}}"
                f"  {type_color}{doc_type:<{col_type}}{RESET}"
                f"  {truncate(firm, col_firm):<{col_firm}}"
                f"  {doc_date:<{col_date}}"
                f"  {n_notes:<{col_notes}}"
                f"  {r.elapsed:>{col_time - 1}.1f}s"
            )
        else:
            print(
                f"  {truncate(r.filename, col_file):<{col_file}}"
                f"  {RED}{'FAILED':<{col_type}}{RESET}"
                f"  {truncate(r.error, col_firm):<{col_firm}}"
                f"  {'-':<{col_date}}"
                f"  {'-':<{col_notes}}"
                f"  {r.elapsed:>{col_time - 1}.1f}s"
            )

    # ── Type distribution ──
    print(f"\n  {BOLD}DOCUMENT TYPE DISTRIBUTION{RESET}")
    for doc_type, count in sorted(type_counts.items(), key=lambda x: -x[1]):
        bar = "█" * count
        print(f"    {doc_type:<25} {count:>2}  {bar}")

    # ── Confidence notes summary ──
    docs_with_notes = [
        (r.filename, r.result.confidence_notes)
        for r in results
        if r.result and r.result.confidence_notes
    ]
    if docs_with_notes:
        print(f"\n  {BOLD}CONFIDENCE NOTES{RESET}")
        for fname, notes in docs_with_notes:
            print(f"    {DIM}{fname}{RESET}")
            for note in notes[:3]:
                print(f"      • {truncate(note, 100)}")
            if len(notes) > 3:
                print(f"      {DIM}... and {len(notes) - 3} more{RESET}")

    # ── Errors ──
    if failed:
        print(f"\n  {BOLD}ERRORS{RESET}")
        for r in failed:
            print(f"    {RED}{r.filename}: {truncate(r.error, 100)}{RESET}")

    # ── Totals ──
    total_time = sum(r.elapsed for r in results)
    wall_time = max(r.elapsed for r in results) if results else 0
    print(
        f"\n  {DIM}Total API time: {total_time:.1f}s  |  Wall time: ~{wall_time:.1f}s (parallelized){RESET}\n"
    )


async def run(pdf_dir: Path, concurrency: int, limit: int | None):
    pdfs = sorted(pdf_dir.glob("*.pdf"))
    if not pdfs:
        print(f"No PDFs found in {pdf_dir}", file=sys.stderr)
        sys.exit(1)

    if limit:
        pdfs = pdfs[:limit]

    print(
        f"\n{BOLD}Scanning {len(pdfs)} PDFs with {MODEL_CONFIG[0]} (concurrency={concurrency}){RESET}\n"
    )

    extractor = make_extractor()
    semaphore = asyncio.Semaphore(concurrency)

    tasks = [
        extract_one(extractor, pdf, semaphore, i + 1, len(pdfs))
        for i, pdf in enumerate(pdfs)
    ]
    results = await asyncio.gather(*tasks)

    print_summary(list(results))


def main():
    parser = argparse.ArgumentParser(description="Scan real-world test PDFs")
    parser.add_argument(
        "--dir",
        default=str(NEW_PDF_DIR),
        help=f"PDF directory (default: {NEW_PDF_DIR})",
    )
    parser.add_argument(
        "--concurrency",
        type=int,
        default=10,
        help="Max concurrent API calls (default: 10)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Process only first N PDFs",
    )
    args = parser.parse_args()

    load_env()
    asyncio.run(run(Path(args.dir), args.concurrency, args.limit))


if __name__ == "__main__":
    main()
