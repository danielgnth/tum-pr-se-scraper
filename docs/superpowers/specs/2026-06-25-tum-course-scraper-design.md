# TUM Practical & Seminar Course Scraper — Design Spec

**Date:** 2026-06-25  
**Status:** Approved

---

## Purpose

A local tool for exploring TUM practical and seminar courses during the matching window (WS 2026/27). Scrapes course data from the TUMonline REST API and the CIT leftover-spots page, stores it in Postgres, exposes it via a typed Hono API, and surfaces it through a React UI and an MCP server for use with Claude Code.

---

## Repository Structure

Bun workspaces monorepo:

```
tum-pr-se-scraper/
├── packages/
│   ├── server/    # Hono API + Crawlee scraper + Drizzle schema + Postgres
│   ├── web/       # Vite + React + react-router + Tailwind + shadcn
│   └── mcp/       # MCP server (consumes Hono typed client)
├── docker-compose.yml   # Postgres instance
├── package.json         # workspace root
└── bunfig.toml
```

**Runtime:** Bun throughout. `bun install` at root installs all workspaces.

---

## Architecture & Data Flow

```
TUMonline REST API ─┐
                    ├─→ server (Crawlee scraper) ─→ Postgres (Docker)
CIT HTML page      ─┘             ↑
                             Hono API (typed RPC via AppType export)
                            ↙                    ↘
              web (React UI)              mcp (Claude Code)
```

- The scraper lives inside `packages/server` and is triggered via `POST /api/scrape` or `bun run scrape`
- Both `web` and `mcp` import `AppType` from `server` and use Hono's `hc<AppType>()` typed client — no codegen, full type safety at runtime over HTTP
- The MCP server does **not** connect directly to Postgres; it talks to the Hono API only

---

## Data Sources

### TUMonline REST API

Base URL pattern:
```
https://campus.tum.de/tumonline/ee/rest/slc.tm.cp/student/courses
  ?$filter=courseNormKey-eq=LVEAB;filterTerm-like={COURSE_NUMBER};orgId-eq=1;termId-eq=206
  &$orderBy=title=ascnf
  &$skip={offset}
  &$top=200
```

Course numbers to scrape: `IN0012`, `IN0014`, `IN2106`, `IN2107`, `IN2128`, `IN2129`, `IN2130`, `IN2131`, `IN2396`, `IN2397`

Term ID `206` = WS 2026/27. `$top=200` minimises request count. Pagination via `$skip` only needed if a single course number returns >200 results (unlikely but handled).

### CIT Leftover Spots Page

URL: `https://www.cit.tum.de/cit/studium/studierende/pruefungsangelegenheiten-module/informatik/praktika-seminare/`

Scraped with Crawlee's `CheerioCrawler`. Extracts course names/numbers that appear in the leftover section. Matched back to courses by course number to set `has_leftover_spots = true`.

---

## Database Schema (Postgres + Drizzle ORM)

Schema defined in `packages/server/src/db/schema.ts`.

### `scrape_runs`

| column | type | notes |
|---|---|---|
| `id` | `serial` PK | |
| `started_at` | `timestamp` | |
| `finished_at` | `timestamp` | nullable |
| `status` | `text` | `running` / `success` / `error` |
| `courses_upserted` | `integer` | nullable |
| `error_message` | `text` | nullable |

### `courses`

| column | type | notes |
|---|---|---|
| `id` | `serial` PK | surrogate key |
| `tumonline_id` | `text` | TUMonline's own course ID |
| `scrape_run_id` | `integer` FK | → `scrape_runs.id` |
| `course_number` | `text` | e.g. `IN2396` |
| `title` | `text` | |
| `type` | `text` | normalized to one of: `Praktikum` / `Master-Praktikum` / `Seminar` / `Master-Seminar` (TUMonline may return raw codes or German strings that must be mapped at scrape time) |
| `term_id` | `text` | e.g. `206` |
| `ects` | `integer` | nullable |
| `language` | `text` | nullable |
| `description` | `text` | nullable |
| `prerequisites` | `text` | nullable |
| `max_participants` | `integer` | nullable |
| `instructors` | `jsonb` | string array |
| `tumonline_url` | `text` | |
| `has_leftover_spots` | `boolean` | default `false` |

Unique constraint on `(tumonline_id, scrape_run_id)` — safe to re-run scrapes.

Queries always default to the latest `scrape_run` with `status = 'success'` unless `?runId=` is provided.

---

## Scraper Design (`packages/server`)

**Library:** Crawlee (runs on Bun as of Bun v1.3.9)

**Flow:**

1. Insert a `scrape_run` row with `status: 'running'`
2. Use Crawlee's `HttpCrawler` for TUMonline API requests — enqueue one initial request per course number, then dynamically enqueue subsequent pages if results are paginated
3. Use Crawlee's `CheerioCrawler` for the CIT HTML page — extract all course numbers/names with leftover spots into a Set
4. Crawlee handles rate limiting, retries, and request deduplication automatically
5. After all requests complete: merge leftover-spot data into course records, bulk-insert all courses with the `scrape_run_id`
6. Update `scrape_run` to `status: 'success'` with `courses_upserted` count
7. On any unhandled error: update `scrape_run` to `status: 'error'` with `error_message`

Invocable two ways:
- `bun run scrape` — CLI entry point in `packages/server`
- `POST /api/scrape` — HTTP trigger (for the UI refresh button)

---

## Server Package Structure (`packages/server`)

```
packages/server/
├── src/
│   ├── index.ts          # Hono app entry point, exports AppType
│   ├── routes/
│   │   ├── courses.ts    # GET /api/courses, GET /api/courses/:id
│   │   └── scrape.ts     # GET /api/scrape-runs, POST /api/scrape
│   ├── scraper/
│   │   ├── index.ts      # orchestrator: creates scrape_run, drives crawlers, inserts results
│   │   ├── tumonline.ts  # Crawlee HttpCrawler for TUMonline REST API
│   │   └── cit.ts        # Crawlee CheerioCrawler for CIT leftover-spots page
│   ├── db/
│   │   ├── client.ts     # Drizzle client + connection
│   │   ├── schema.ts     # Table definitions (scrape_runs, courses)
│   │   └── migrations/   # Drizzle migration files
│   └── lib/
│       └── typeMap.ts    # Maps raw TUMonline type codes → normalized type strings
├── drizzle.config.ts
└── package.json

```

---

## Hono API Routes (`packages/server`)

```
GET  /api/courses              # list courses from latest successful run
                               # query params: ?runId=, ?search=, ?type=, ?language=, ?leftoverOnly=true
GET  /api/courses/:id          # single course by surrogate id
GET  /api/scrape-runs          # list all scrape runs (for UI status banner)
POST /api/scrape               # trigger a scrape run (returns scrape_run id immediately)
```

`AppType` is exported from `packages/server/src/index.ts` for consumption by `web` and `mcp`.

---

## MCP Server (`packages/mcp`)

**Library:** `@modelcontextprotocol/sdk`

Uses `hc<AppType>()` to call the Hono API. Exposes three tools to Claude Code:

| tool | description |
|---|---|
| `list_courses` | Returns all courses from latest run. Supports filtering by `type`, `language`, `has_leftover_spots`, and free-text `search`. |
| `get_course` | Full detail for one course by `id` or `course_number`. |
| `list_scrape_runs` | Returns scrape history with timestamps and status. |

---

## Web UI (`packages/web`)

**Stack:** Vite + React + react-router + Tailwind CSS v4 + shadcn/ui

### Routes

| route | view |
|---|---|
| `/` | Course list |
| `/courses/:id` | Course detail |

### Course List View (`/`)

- **Search bar** — filters by title, instructor, course number (client-side)
- **Sort by** — title (A→Z), ECTS (high→low), type
- **Type filter chips** — multi-select: `Praktikum` / `Master-Praktikum` / `Seminar` / `Master-Seminar`
- **Leftover spots toggle** — show only courses with available spots
- **Course cards** — title, course number, type badge, ECTS, language, instructors, leftover badge
- **Status banner** (persistent footer) — "Last scraped X ago · N courses · Refresh" — Refresh calls `POST /api/scrape`, then polls `GET /api/scrape-runs` until the run completes

### Course Detail View (`/courses/:id`)

- Full description, prerequisites, max participants, TUMonline external link
- Back button via `useNavigate(-1)`

---

## Local Development

```bash
# Start Postgres
docker compose up -d

# Install all workspaces
bun install

# Run DB migrations
bun run --cwd packages/server migrate

# Run initial scrape
bun run --cwd packages/server scrape

# Start Hono server
bun run --cwd packages/server dev

# Start web dev server
bun run --cwd packages/web dev

# Start MCP server
bun run --cwd packages/mcp dev
```

---

## Tooling

**Linting & Formatting:** Biome — single tool replacing ESLint + Prettier. Config at repo root (`biome.json`), applies to all packages.

**Git Hooks:** Husky + lint-staged — on every commit, lint-staged runs `biome check --apply` on staged files only. Configured in root `package.json`.

```json
// package.json (root)
{
  "lint-staged": {
    "**/*.{ts,tsx,json}": ["biome check --apply --no-errors-on-unmatched"]
  }
}
```

Husky installs via `bun run prepare` (postinstall hook).

---

## Out of Scope

- Authentication / multi-user support
- Deployment (this is a local personal tool)
- Automatic cron scheduling (manual `bun run scrape` or UI refresh button is sufficient for the 3-week matching window)
- Built-in AI chat UI (Claude Code + MCP is the AI interface)
