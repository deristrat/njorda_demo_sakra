# Njorda Advisor Demo — Frontend Guide

Reference for extending or building new frontend work in this repo. All decisions below were validated during initial implementation.

---

## Tech Stack

| Layer | Tool | Version notes |
|-------|------|---------------|
| Framework | React + TypeScript | Vite bundler |
| Styling | Tailwind CSS v4 | CSS-first config (no `tailwind.config.js`) |
| Components | shadcn/ui (New York style) | Installed to `src/components/ui/` |
| Charts | ECharts via `echarts-for-react` | Custom Njorda theme registered globally |
| Tables | `@tanstack/react-table` | Headless — styled with shadcn Table |
| Routing | `react-router` | Nested layout routes |
| Icons | `lucide-react` | Consistent stroke-width |
| Toasts | `sonner` | Via shadcn Toaster wrapper |

---

## Project Structure

```
frontend/src/
├── components/
│   ├── ui/              # shadcn/ui generated — DO NOT hand-edit
│   ├── layout/          # AppLayout, AppSidebar, AppHeader, NjordaLogo
│   ├── charts/          # EChartWrapper, PieChart, MultiLineChart, BarChart
│   ├── dashboard/       # KPICard, KPIGrid, ToastDemo
│   ├── clients/         # ClientsTable, columns
│   └── settings/        # ComponentShowcase, FontPicker
├── pages/               # One file per route
├── data/                # Static mock data (no API dependency)
├── hooks/               # use-font (font picker state)
├── lib/                 # utils.ts, echarts-theme.ts
└── types/               # TypeScript interfaces
```

---

## Theming Architecture

All brand tokens live in `src/index.css` as CSS custom properties on `:root`. Tailwind v4's `@theme inline` block bridges these into utility classes at runtime.

### Why `@theme inline`?

The `inline` keyword means Tailwind utilities reference CSS vars at runtime rather than baking in values at build time. This is critical for the font picker — changing `--font-primary` via JS instantly updates all `font-sans` usage without React re-renders.

### Key CSS Variables

```css
--font-primary    /* Body font: At Hauss → Inter fallback */
--font-brand      /* KPI values, headings, sidebar: Ballinger Mono */
--background      /* Warm off-white: #FCF8F3 */
--primary         /* Teal: #03A48D — used for buttons, active states */
--destructive     /* Orange/red: #FC4832 — errors, danger */
--border          /* Warm border: #F7EDE2 */
--card            /* White: #FFFFFF */
```

### Mapping shadcn Tokens to Njorda Colors

The brand guide calls `#FC4832` (orange) "Primary" and `#03A48D` (teal) "Secondary". However, the brand guide's **Buttons section** specifies teal as the primary button color. In a component library, `--primary` drives button styling, so:

| shadcn token | Njorda color | Reason |
|---|---|---|
| `--primary` | `#03A48D` (teal) | Primary buttons = teal per brand guide button spec |
| `--destructive` | `#FC4832` (orange) | Error/danger states |
| `--background` | `#FCF8F3` | Warm off-white page bg |
| `--card` | `#FFFFFF` | White card surfaces |
| `--border` | `#F7EDE2` | Warm borders |

This is a deliberate departure from the brand guide's color naming. See the brand guide's "Implementation Notes" section for rationale.

---

## Font Usage

### At Hauss (Primary body font)
- Weights: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)
- Files in `public/fonts/AtHauss-*.woff2`
- Fallback: Inter (loaded via Google Fonts `@import`), then Arial

### Ballinger Mono Medium (Brand/display font)
- Used for: KPI values, page titles in header, sidebar brand name
- File: `public/fonts/BallingerMono-Medium.woff2`
- **Caution**: Ballinger Mono is very wide (monospaced). Use sparingly for large numbers. The font picker in Settings allows switching to alternatives for testing.
- Applied via `font-brand` Tailwind utility class

### Font Picker
Both `--font-primary` and `--font-brand` can be changed live from Settings > Typografi. This is useful for testing alternatives to Ballinger Mono, which can feel too wide in data-dense layouts.

---

## Component Patterns

### KPI Cards
- Layout: ALL CAPS label (top-left), icon (top-right), value (middle), trend arrow+% (bottom)
- Compact padding: `px-4 py-2.5`
- Value uses `font-brand` (Ballinger Mono by default)
- Trend: green (#03A48D) for positive, red (#FC4832) for negative
- Grid: 1 col → 2 col (sm) → 3 col (lg) → 6 col (2xl)

### Charts (ECharts)
- Always use `theme="njorda"` via `EChartWrapper`
- SVG renderer for crisp rendering
- Tooltip: white bg, warm border, rounded, subtle shadow
- Chart palette: 10 colors from `--chart-1` through `--chart-10`
- The theme is registered as a side-effect import in `main.tsx`

### Tables
- White background (`bg-card`) on the table container
- Warm hover state (`hover:bg-secondary/50`), not alternating row colors
- Search input also gets `bg-card` to match
- Sortable headers with arrow indicators

### Cards
- Use shadcn `Card` — gets white bg, warm border, rounded corners automatically
- Avoid extra shadows — the warm background provides enough contrast

### Sidebar
- shadcn `Sidebar` with `collapsible="icon"`
- Brand name "Njorda" (capital N) at top using `font-brand`
- Active nav item uses teal highlight
- User avatar + logout at bottom

---

## Adding New Pages

1. Create `src/pages/NewPage.tsx`
2. Set `document.title` in a `useEffect`
3. Use `<AppHeader title="..." />` at the top
4. Add route in `src/App.tsx` inside the `<Route element={<AppLayout />}>` group
5. Add nav item in `src/components/layout/AppSidebar.tsx` → `navItems` array

---

## Adding shadcn Components

```bash
npx shadcn@latest add <component-name>
```

Components install to `src/components/ui/`. After install, check that imports resolve correctly (they should use `@/lib/utils`). The `components.json` config handles path mapping.

**Note**: Some generated components may have lint issues (e.g. `react-refresh/only-export-components`). These are suppressed for the `ui/` directory in `eslint.config.js`.

---

## Dev Environment

| Service | Port | Command |
|---------|------|---------|
| Frontend | 21000 | `invoke frontend` or `cd frontend && npm run dev` |
| Backend | 21001 | `invoke backend` or `cd backend && uv run uvicorn src.main:app --reload --port 21001` |
| Both | — | `invoke dev` (runs both in parallel) |

Backend uses UV for dependency management. Frontend data is all local mock — no API calls needed for the demo to function.

---

## Fonts Sourced From

Font files are copied from the main Njorda repo:
- **At Hauss**: `../njorda/services/app/public/fonts/AtHauss/`
- **Ballinger Mono**: `../njorda/services/b2b/_lib/assets/fonts/Ballinger/BallingerMonoMedium/BallingerMono-Medium-mod.woff2`

Note: The Ballinger source file is named `BallingerMono-Medium-mod.woff2` (with `-mod` suffix). It was renamed to `BallingerMono-Medium.woff2` in this project.
