import subprocess
from pathlib import Path

from invoke import Context, task

ROOT = Path(__file__).parent
FRONTEND_DIR = str(ROOT / "frontend")
BACKEND_DIR = str(ROOT / "backend")

FRONTEND_PORT = 21000
BACKEND_PORT = 21001


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
