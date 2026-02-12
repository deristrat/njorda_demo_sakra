# Njorda Advisor – Compliance & Communication Copilot (Demo)

## What is this?

A **demo** (not production software) of an AI-powered tool to help Swedish financial advisors stay compliant and manage client documentation. Built for Säkra as a proof-of-concept.

The core idea: advisors upload/drop documents, and the system scans them to determine what they are, whether they're complete, and whether they comply with relevant policies.

## Business Context

Swedish financial advisors face increasing compliance/documentation demands with the same or fewer staff. This tool addresses three areas:

1. **AI-baserad rådgivningsgranskning (Compliance Copilot)** – Continuously analyze advisory documentation against internal policies, regulations, and best practices. Flag deviations, risk-classify, and provide individual feedback.
2. **AI-stöd för kundkommunikation (Advisor Communication Copilot)** – Help advisors draft compliant, policy-aligned client responses with relevant context (portfolio exposure, market data, risk profile).
3. **Rådgivnings-QA & utbildning** – Aggregate compliance insights for team/company-level reporting, training, and management oversight.

The Swedish regulatory framework (MiFID II, IDD, GDPR, etc.) governs what constitutes compliant advisory documentation. Key areas include suitability assessments, risk profiling, cost transparency, and proper documentation of advice given.

## Tech Stack

- **Frontend**: React 19 + TypeScript, Vite, Tailwind CSS v4, shadcn/ui, ECharts
- **Backend**: FastAPI (Python), Uvicorn
- **Package management**: UV (Python), npm (frontend)
- **Ports**: Frontend 21000, Backend 21001
- **Dev runner**: `invoke dev` (or `invoke frontend` / `invoke backend` separately)

## Project Structure

```
backend/src/          # FastAPI app
  main.py             # App entry, CORS, routers
  routers/            # API endpoints (health, dashboard, clients, charts)
  data/mock.py        # Static mock data
frontend/src/
  pages/              # Route pages (Login, Dashboard, Clients, Settings)
  components/
    ui/               # shadcn/ui components (auto-generated, don't edit directly)
    layout/           # AppLayout, Sidebar, Header
    charts/           # ECharts wrappers
    dashboard/        # KPI cards, grids
    clients/          # Client table
  data/               # Frontend mock data
  types/              # TypeScript interfaces
```

## Development

- Conda env: `njorda_demo_sakra`
- Frontend and backend servers typically already running with hot reload
- `invoke install` to set up dependencies
- `invoke dev` to start both services
- UI is in Swedish

## Design System

- Primary: Teal (#03A48D)
- Background: Warm off-white (#FCF8F3)
- Fonts: At Hauss (body), Ballinger Mono Medium (data/headings)
- 10-color chart palette via custom ECharts theme
