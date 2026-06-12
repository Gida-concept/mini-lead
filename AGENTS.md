# AGENTS.md — Lead Generation Engine Sub-Agent Instructions

This file applies to **all sub-agents** (backend-developer, frontend-developer, debugger, code-explorer). Every sub-agent MUST follow these rules in addition to its domain-specific system prompt.

## Project Context

A personal lead generation tool — **no authentication**. Scrapes business leads from Facebook, Instagram, Google Web Search, and Google Maps using Apify actors. Stack: Next.js 15 / React 19 / Tailwind CSS 4 / shadcn/ui frontend, Express.js 5 / SQLite (better-sqlite3) backend.

**Status: Specification/blueprint only** — no implementation code yet. The three design docs (`ReadMe.md`, `ARCHITECTURE.md`, `API-REFERENCE.md`) are the source of truth for all behavior.

## Mandatory Protocol for All Agents

1. **Read the design docs first** — `ReadMe.md` for the full blueprint, `ARCHITECTURE.md` for file tree and DB schema, `API-REFERENCE.md` for endpoint contracts. These define all behavior before any code is written.
2. **Trace import chains** — Find every file that imports from or is imported by the target before modifying.
3. **Check all layers** — Backend (routes/services/models), types (shared interfaces), frontend (hooks/components) must stay consistent.
4. **Match existing patterns** — Read 2-3 analogous files before creating a new one. Replicate naming and style exactly.
5. **Leave the tree shippable** — No dangling imports, no missing exports, no broken references.

## Backend Conventions

- **Layer pattern**: `routes/` → `services/` → `models/` (repository with raw SQL). Routes handle HTTP, services handle business logic, models own SQL queries.
- **All DB queries** go in `models/*.ts` files (the only files that write SQL).
- **SQLite**: Use `better-sqlite3` (synchronous). No connection pooling needed. Migrations run at startup.
- **Deduplication**: When inserting from scrapes, check `page_url + source` uniqueness. If exists, merge new fields where null. If not, INSERT.
- **Response envelope**: `{ success: boolean, data: object|null, error: { code, message }|null, meta: { page, limit, total }|null }`
- **Pagination**: List endpoints use `page` (default 1) and `limit` (default 25, max 100).
- **Validation**: All endpoints use Zod schemas via `validate` middleware.
- **Scrape endpoints**: POST to `/api/scrape/:source` with `{ businessType, location, maxResults }`. Return `202 Accepted` with `searchId` for polling. Polling loop: 5s intervals, 5-min timeout for Google Search Scraper, 10-min for Maps.
- **Error codes**: `VALIDATION_ERROR` (400), `NOT_FOUND` (404), `APIFY_ERROR` (502), `RATE_LIMITED` (429), `INTERNAL_ERROR` (500), `EXPORT_EMPTY` (400), `SCRAPE_TIMEOUT` (504).
- **New endpoints require**: Route file in `routes/`, service method in `services/`, schema in `types/`, validation in `middleware/validate.ts`.

## Frontend Conventions

- **Route groups**: `/` = Dashboard, `/facebook`, `/instagram`, `/google-web`, `/google-maps` = per-source pages.
- **State management**: SWR or plain fetch hooks for server state. No client-side state store needed (no auth, no multi-step forms).
- **Components pattern**: Reusable `SearchForm.tsx` renders above a `LeadTable.tsx` with `FilterBar` and `ExportButton` below. Each page shares the same layout.
- **Search form fields**: `businessType` (text with datalist), `location` (text with datalist), `maxResults` (number, default 50, max 200).
- **Lead table features**: Sorting by column headers, checkbox selection, inline actions (copy URL/email/phone), status dropdown, delete with confirmation, pagination (25/50/100 per page).
- **Export**: `ExportButton` triggers CSV or JSON download filtered by current view.
- **File conventions**: Components in `src/components/`, hooks in `src/hooks/`, lib in `src/lib/`, types in `src/types/`.

## Communication

- Report what you find concisely — return actionable results.
- If you detect a pattern violation or bug beyond your task scope, flag it but don't fix it unless asked.
- When in doubt about which layer owns a change, ask before proceeding.
