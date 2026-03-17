# Njorda Advisor – Compliance & Communication Copilot (Demo)

AI-powered tool helping Swedish financial advisors stay compliant and manage client documentation. Built as a proof-of-concept for Säkra.

## Prerequisites

- [Docker](https://www.docker.com/) (for PostgreSQL)
- [uv](https://docs.astral.sh/uv/) (Python package manager)
- [Node.js](https://nodejs.org/) (v18+)
- [Invoke](https://www.pyinvoke.org/) (`uv tool install invoke`)

## Setup

```bash
# 1. Install dependencies
invoke install

# 2. Create backend/.env
cat > backend/.env <<'EOF'
ANTHROPIC_API_KEY=your-key-here
GOOGLE_API_KEY=your-key-here
EOF

# 3. Start the database
invoke db

# 4. Run migrations and seed demo data
invoke migrate
invoke seed

# 5. Start dev servers (frontend + backend)
invoke dev
```

The app will be available at:
- **Frontend:** http://localhost:21000
- **Backend API:** http://localhost:21001
- **Database:** localhost:21002

## Available Tasks

| Command | Description |
|---|---|
| `invoke install` | Install Python + Node dependencies |
| `invoke dev` | Start frontend and backend together |
| `invoke frontend` | Start frontend only |
| `invoke backend` | Start backend only |
| `invoke db` | Start PostgreSQL in Docker |
| `invoke db-stop` | Stop the database |
| `invoke db-reset` | Destroy DB volume and re-create from scratch |
| `invoke migrate` | Apply pending Alembic migrations |
| `invoke migration -m "msg"` | Create a new Alembic migration |
| `invoke seed` | Seed database with demo data |
| `invoke build` | Production build of frontend |
| `invoke lint` | Run linters |
| `invoke pre-commit` | Run all checks (lint, typecheck, build) |

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, ECharts
- **Backend:** FastAPI, SQLAlchemy, Alembic, PostgreSQL
- **AI:** Anthropic Claude, Google Gemini
