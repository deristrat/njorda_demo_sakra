import subprocess
from pathlib import Path

from invoke import Context, task

ROOT = Path(__file__).parent
FRONTEND_DIR = str(ROOT / "frontend")
BACKEND_DIR = str(ROOT / "backend")

FRONTEND_PORT = 21000
BACKEND_PORT = 21001
DB_PORT = 21002


# ── Database ────────────────────────────────────────────────────────


@task
def db(c: Context):
    """Start PostgreSQL database in Docker (port 21002)."""
    c.run("docker compose up db -d", pty=True)


@task
def db_stop(c: Context):
    """Stop the PostgreSQL database."""
    c.run("docker compose stop db", pty=True)


@task
def db_reset(c: Context):
    """Stop DB, destroy volume, and restart fresh."""
    c.run("docker compose down -v", pty=True)
    c.run("docker compose up db -d", pty=True)
    print("Waiting for DB to be ready...")
    c.run("sleep 3")
    with c.cd(BACKEND_DIR):
        c.run("uv run alembic upgrade head", pty=True)
        c.run("uv run python -m src.seed", pty=True)


@task
def migrate(c: Context):
    """Apply all pending Alembic migrations."""
    with c.cd(BACKEND_DIR):
        c.run("uv run alembic upgrade head", pty=True)


@task(help={"message": "Migration message (required)"})
def migration(c: Context, message: str):
    """Create a new Alembic migration.

    Example: inv migration -m "add documents table"
    """
    with c.cd(BACKEND_DIR):
        c.run(f'uv run alembic revision --autogenerate -m "{message}"', pty=True)


@task
def seed(c: Context):
    """Seed database with demo user."""
    with c.cd(BACKEND_DIR):
        c.run("uv run python -m src.seed", pty=True)


# ── Setup ───────────────────────────────────────────────────────────


@task
def install(c: Context):
    """Install all dependencies (Python + Node)."""
    print("==> Installing Python dependencies...")
    with c.cd(BACKEND_DIR):
        c.run("uv sync --all-extras", pty=True)

    print("\n==> Installing Node dependencies...")
    with c.cd(FRONTEND_DIR):
        c.run("npm install", pty=True)


@task
def frontend(c: Context):
    """Start frontend dev server (port 21000)."""
    with c.cd(FRONTEND_DIR):
        c.run("npm run dev", pty=True)


@task
def backend(c: Context):
    """Start backend dev server (port 21001)."""
    with c.cd(BACKEND_DIR):
        c.run(f"uv run uvicorn src.main:app --reload --port {BACKEND_PORT}", pty=True)


@task
def dev(c: Context):
    """Start both backend and frontend in parallel."""
    api_proc = subprocess.Popen(
        ["uv", "run", "uvicorn", "src.main:app", "--reload", "--port", str(BACKEND_PORT)],
        cwd=BACKEND_DIR,
    )
    ui_proc = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=FRONTEND_DIR,
    )
    try:
        api_proc.wait()
        ui_proc.wait()
    except KeyboardInterrupt:
        api_proc.terminate()
        ui_proc.terminate()


@task
def build(c: Context):
    """Build frontend for production."""
    with c.cd(FRONTEND_DIR):
        c.run("npm run build", pty=True)


@task
def lint(c: Context):
    """Run linting."""
    with c.cd(FRONTEND_DIR):
        c.run("npm run lint", warn=True, pty=True)


@task
def pre_commit(c: Context):
    """Run all checks before committing (lint, typecheck, build)."""
    print("==> Linting Python...")
    with c.cd(BACKEND_DIR):
        c.run("uv run ruff check .", pty=True)
        c.run("uv run ruff format --check .", pty=True)

    print("\n==> Linting TypeScript...")
    with c.cd(FRONTEND_DIR):
        c.run("npm run lint", pty=True)

    print("\n==> Type checking Python...")
    with c.cd(BACKEND_DIR):
        c.run("uv run pyright", pty=True)

    print("\n==> Type checking TypeScript...")
    with c.cd(FRONTEND_DIR):
        c.run("npx tsc --noEmit", pty=True)

    print("\n==> Building frontend...")
    with c.cd(FRONTEND_DIR):
        c.run("npm run build", pty=True)

    print("\n==> All checks passed!")


@task
def extract(c: Context, pdf=None, model=None):
    """Extract structured data from advisory PDFs.

    Examples:
        invoke extract                          # All models, all PDFs
        invoke extract --pdf 1                  # All models, PDF #1
        invoke extract --pdf 1 --model claude-sonnet
        invoke extract --model gemini-2.5-pro
    """
    cmd = "uv run python -m src.extraction.cli"
    if pdf:
        cmd += f" --pdf {pdf}"
    if model:
        cmd += f" --model {model}"
    with c.cd(BACKEND_DIR):
        c.run(cmd, pty=True)


@task(help={"concurrency": "Max concurrent API calls (default 10)", "limit": "Process first N PDFs only"})
def scan_new(c: Context, concurrency=10, limit=None):
    """Scan real-world test PDFs (test_pdfs/new/) with Gemini Flash.

    Examples:
        invoke scan-new                     # All PDFs, 10 concurrent
        invoke scan-new --limit 5           # First 5 only
        invoke scan-new --concurrency 5     # Slower, fewer API calls
    """
    cmd = "uv run python -m src.extraction.scan_new"
    cmd += f" --concurrency {concurrency}"
    if limit:
        cmd += f" --limit {limit}"
    with c.cd(BACKEND_DIR):
        c.run(cmd, pty=True)
