# TUM PR/SE Scraper

> **Note:** Course listings and dates are only valid for the Winter Semester 2026.

A personal tool for browsing and tracking TUM practical and seminar courses. It scrapes course listings from TUMonline, stores them in a database, and serves a web UI for filtering, favoriting, and managing your applications.

## What it does

- **Scrapes** practical and seminar courses from TUMonline (including course details, instructors, preliminary meeting dates, and leftover-spot availability)
- **Web UI** for browsing courses with full-text search, type/platform filters, and sort by title or preliminary meeting date
- **Favorites and dismissal** — star courses you're interested in, hide ones you're not
- **Manual ranking** — drag and drop your favorites into priority order
- **Notes** — attach a personal note to any course
- **External applications** — mark courses that require an application outside TUM Matching (cycles: pending → done → unset)
- **Matching timeline** — visual overview of upcoming preliminary meeting dates for your favorites
- **Backup/restore** — save your favorites, notes, and rankings to the server or export/import them as a JSON file
- **Markdown export** — export your favorited courses with full details as a Markdown file

## Running with Docker Compose

```bash
docker compose up
```

This pulls the pre-built image from GHCR and starts a Postgres database alongside the app. The app runs migrations automatically on startup.

The UI is available at [http://localhost:3000](http://localhost:3000).

To build the image locally instead of pulling it:

```bash
docker compose up --build
```

### Environment variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://tum:tum@localhost:5432/courses` | Postgres connection string |
| `PORT` | `3000` | Port the server listens on |
| `TUMONLINE_TERM_ID` | `207` | TUMonline term ID to scrape (207 = WS 2026/27) |
| `TIMELINE_BROWSE_START` | `2026-06-22` | Start of the browse phase |
| `TIMELINE_MEETINGS_START` | `2026-06-25` | Start of the preliminary meetings phase |
| `TIMELINE_MEETINGS_END` | `2026-07-09` | End of the preliminary meetings phase |
| `TIMELINE_MATCHING_START` | `2026-07-10` | Start of the TUM Matching phase |
| `TIMELINE_MATCHING_END` | `2026-07-15` | End of the TUM Matching phase |
| `TIMELINE_RESULTS_DATE` | `2026-07-27` | Date when Matching results are published |
