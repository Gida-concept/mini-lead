# Lead Generation Engine -- Phased Build Plan

**Build order: Frontend first, then Backend, then Integration.**

All file paths are relative to the project root `leadgen-engine/`.

---

## Phase 1: Frontend Scaffolding (UI Complete with Mock Data)

Build the entire UI surface so it is navigable and visually complete. All data hooks return mock responses initially; real API wiring happens in Phase 3.

### Step 1.1 -- Project Setup

| File | What it contains |
|---|---|
| `package.json` | Root workspace config (npm workspaces: `["client", "server"]`) |
| `.gitignore` | Ignore `node_modules`, `.next`, `*.db`, `exports/`, `.env`, `.env.local` |
| `.env.example` | Template with `PORT`, `DATABASE_PATH`, `APIFY_TOKEN`, `NEXT_PUBLIC_API_URL` |
| `client/package.json` | Next.js 15, React 19, Tailwind CSS 4, shadcn/ui, SWR, Axios, Zod |
| `client/next.config.js` | Minimal config, no special rewrites yet |
| `client/tailwind.config.ts` | Tailwind v4 config with shadcn/ui theme tokens |
| `client/tsconfig.json` | Path aliases (`@/` -> `src/`) |
| `client/postcss.config.mjs` | PostCSS with Tailwind + autoprefixer |
| `client/components.json` | shadcn/ui config (`style: "default", tailwind.baseColor: "slate"`) |

**Dependency:** None (foundation).

---

### Step 1.2 -- Types Layer

| File | What it contains |
|---|---|
| `client/src/types/lead.ts` | `Lead` interface matching the DB schema (id, source, business_type, location, business_name, page_url, email, phone, address, rating, review_count, social_handle, description, raw_data, status, created_at, updated_at). Also `LeadStatus` union type (`"new" | "contacted" | "qualified" | "rejected"`) and `LeadSource` union type. |
| `client/src/types/search.ts` | `SearchRecord` interface (id, source, query_params, results_count, run_status, apify_run_id, created_at). `ScrapeInput` interface (businessType, location, maxResults). `ScrapeResponse` interface. |
| `client/src/types/api.ts` | Wrappers: `ApiResponse<T>` with `success`, `data`, `meta`. `ApiError` with `code`, `message`, `details`. `PaginatedMeta` with `page`, `limit`, `total`, `totalPages`. |

**Dependency:** None (pure interfaces).

---

### Step 1.3 -- Library / Utilities

| File | What it contains |
|---|---|
| `client/src/lib/constants.ts` | `LEAD_SOURCES` array, `LEAD_STATUSES` array, `STATUS_COLORS` map, `DEFAULTS` object (maxResults=50, limit=25). Source-specific labels and icons. |
| `client/src/lib/utils.ts` | `cn()` helper from `clsx`+`tailwind-merge`. Formatters: `formatDate`, `formatRating`, `truncateUrl`. Validators: `isValidEmail`, `isValidPhone`. |
| `client/src/lib/api.ts` | Axios instance with `baseURL: process.env.NEXT_PUBLIC_API_URL`. **Stub all methods initially** -- each method (`getLeads`, `getLead`, `createLead`, `updateLead`, `deleteLead`, `bulkStatus`, `bulkDelete`, `scrapeSource`, `exportCsv`, `exportJson`, `getExports`, `getStatsOverview`, `getStatsRecent`, `getSearches`, `getSearch`) returns a resolved promise with typed mock data matching the shapes from API-REFERENCE.md. The stub data populates every UI state immediately. |

**Dependency:** Step 1.2 (types).

---

### Step 1.4 -- shadcn/ui Components

Run `npx shadcn@latest init` then add each component individually.

| File | What it contains |
|---|---|
| `client/src/components/ui/button.tsx` | shadcn Button with variants (default, destructive, outline, secondary, ghost, link) |
| `client/src/components/ui/input.tsx` | shadcn Input |
| `client/src/components/ui/select.tsx` | shadcn Select (Trigger, Content, Item, Value) |
| `client/src/components/ui/table.tsx` | shadcn Table (Table, Header, Body, Row, Cell, Head) |
| `client/src/components/ui/badge.tsx` | shadcn Badge with variants |
| `client/src/components/ui/card.tsx` | shadcn Card (Card, Header, Title, Description, Content, Footer) |
| `client/src/components/ui/dialog.tsx` | shadcn Dialog for lead detail modal |
| `client/src/components/ui/dropdown-menu.tsx` | shadcn DropdownMenu for bulk actions |
| `client/src/components/ui/toast.tsx` | shadcn Toast + useToast |
| `client/src/components/ui/toaster.tsx` | shadcn Toaster component |
| `client/src/components/ui/skeleton.tsx` | shadcn Skeleton for loading states |
| `client/src/components/ui/tabs.tsx` | shadcn Tabs (used if needed on dashboard) |
| `client/src/components/ui/checkbox.tsx` | shadcn Checkbox for row selection |

**Dependency:** Step 1.1 (tailwind config, tsconfig paths).

---

### Step 1.5 -- Custom UI Components

Build these in order from leaf to composite (no circular deps).

| Order | File | What it contains |
|---|---|---|
| 1 | `client/src/components/ui/LoadingState.tsx` | `LoadingState` component: full-page skeleton (`Skeleton` rows), inline spinner, overlay loader. Accepts `variant` prop. |
| 2 | `client/src/components/ui/EmptyState.tsx` | `EmptyState` component: illustration placeholder, "No leads found" message, conditional CTA button. Handles no-results, no-searches, no-exports variants. |
| 3 | `client/src/components/ui/StatusBadge.tsx` | `StatusBadge` component: color-coded badge (`STATUS_COLORS` map). Green=new, blue=contacted, purple=qualified, gray=rejected. |
| 4 | `client/src/components/ui/SectionHeader.tsx` | `SectionHeader` component: source icon + title + lead count. One per source page. |
| 5 | `client/src/components/ui/QueryPreview.tsx` | `QueryPreview` component: collapsible card showing the exact search query that will be sent to Apify for the current source. |
| 6 | `client/src/components/ui/FilterBar.tsx` | `FilterBar` component: status filter pills ("All", "New", "Contacted", "Qualified", "Rejected"), optional source filter (hidden on section pages, visible on dashboard), text search input `q`. Emits `onFilterChange`. |
| 7 | `client/src/components/ui/SearchForm.tsx` | `SearchForm` component: businessType text input with datalist, location text input with datalist, maxResults number input (50 default, 200 max), Search button with loading spinner. Shows `QueryPreview` below inputs. States: idle, loading, success, error (toast + retry button). Emits `onSubmit(ScrapeInput)`. |
| 8 | `client/src/components/ui/Pagination.tsx` | `Pagination` component: page buttons, prev/next, "Page X of Y", items-per-page selector (25/50/100). Emits `onPageChange`, `onLimitChange`. |
| 9 | `client/src/components/ui/LeadTable.tsx` | `LeadTable` component: sortable column headers (business_name, location, rating, created_at), row selection checkboxes, status badge per row, inline copy-URL/email/phone buttons, inline status dropdown, inline delete button (with confirmation). Uses shadcn `Table`. Integrates `Pagination`, `StatusBadge`, `FilterBar`. States: loading (skeleton rows), empty (`EmptyState`), populated, error. Handles all table-level states. |
| 10 | `client/src/components/ui/LeadCard.tsx` | `LeadCard` component: mobile card view alternative to `LeadTable`. Shows business_name, location, status badge, email, phone, rating. Same actions as table (copy, status, delete). |
| 11 | `client/src/components/ui/LeadDetailModal.tsx` | `LeadDetailModal` component: shadcn `Dialog` showing full lead details. Tabs or sections for info, contact, raw data. Inline editing of status. |
| 12 | `client/src/components/ui/BulkActionsBar.tsx` | `BulkActionsBar` component: appears when rows selected. Shows count ("N selected"), bulk status dropdown, bulk delete button (with confirmation dialog). Emits `onBulkStatus`, `onBulkDelete`. |
| 13 | `client/src/components/ui/ExportButton.tsx` | `ExportButton` component: dropdown with "Export CSV" and "Export JSON" options. Accepts current filters. Shows loading state during export. Emits `onExport(format)`. |
| 14 | `client/src/components/ui/StatsCards.tsx` | `StatsCards` component: grid of stat cards (total leads, by source breakdown, by status breakdown, with-email count). Uses shadcn `Card`. States: loading (skeleton cards), populated, error. |
| 15 | `client/src/components/ui/RecentSearches.tsx` | `RecentSearches` component: list of recent search runs with status indicator (running/completed/failed), source label, result count, timestamp. Empty state when none. |

**Dependency:** Step 1.4 (shadcn components), Step 1.3 (constants, utils).

---

### Step 1.6 -- Hooks

| Order | File | What it contains |
|---|---|---|
| 1 | `client/src/hooks/useToast.ts` | Re-export from shadcn/ui toast hooks. |
| 2 | `client/src/hooks/useLeads.ts` | `useLeads(filters)` hook: returns `{ leads, meta, isLoading, isError, mutate }`. Calls `api.getLeads()` from Step 1.3 stubs. `useLead(id)` and `useUpdateLead()` mutation hook. `useDeleteLead()`, `useBulkStatus()`, `useBulkDelete()`. |
| 3 | `client/src/hooks/useScrape.ts` | `useScrape()` mutation hook: calls `api.scrapeSource(source, input)`. Returns `{ trigger, isRunning, result, error }`. Tracks poll status if returned searchId is running. |
| 4 | `client/src/hooks/useExport.ts` | `useExport()` hook: calls `api.exportCsv(filters)` or `api.exportJson(filters)`. Triggers browser download. Returns `{ exportData, isLoading, error }`. |
| 5 | `client/src/hooks/useStats.ts` | `useStats()` hook: fetches overview + recent stats. Returns `{ stats, recent, isLoading, isError }`. |
| 6 | `client/src/hooks/useSearches.ts` | `useSearches()` hook: fetches search history. Returns `{ searches, meta, isLoading, isError }`. |

**Dependency:** Step 1.3 (api.ts), Step 1.2 (types).

---

### Step 1.7 -- Pages & Layout

| Order | File | What it contains |
|---|---|---|
| 1 | `client/src/app/globals.css` | Tailwind directives, shadcn CSS variables, any custom base styles. |
| 2 | `client/src/app/layout.tsx` | Root layout: HTML shell, `Toaster` component, navigation sidebar or top nav with links to all four source sections + dashboard. Nav shows source names as `/facebook`, `/instagram`, `/google-web`, `/google-maps`. |
| 3 | `client/src/app/page.tsx` | Dashboard page: `StatsCards` at top, `RecentSearches` below, quick `SearchForm` for each source (or a combined search). Gets data from `useStats()` and `useSearches()`. Handles loading (skeleton), error (retry toast), empty (no searches yet message). |
| 4 | `client/src/app/facebook/page.tsx` | Facebook leads section page: `SectionHeader`, `SearchForm` (source=facebook), `FilterBar`, `LeadTable`/`LeadCard` (responsive), `BulkActionsBar`, `ExportButton`. Uses `useLeads({ source: "facebook" })` and `useScrape()`. |
| 5 | `client/src/app/instagram/page.tsx` | Same structure as facebook but source=instagram. |
| 6 | `client/src/app/google-web/page.tsx` | Same structure but source=google_web. |
| 7 | `client/src/app/google-maps/page.tsx` | Same structure but source=google_maps. |

**Dependency:** Steps 1.2-1.6 (everything below).

---

## Phase 2: Backend (Express + SQLite + Apify)

Build the server independent of the frontend. Testable via curl/Postman.

### Step 2.1 -- Server Setup

| File | What it contains |
|---|---|
| `server/package.json` | Express 5, better-sqlite3, Apify client, fast-csv, Zod, cors, morgan, tsx (dev runner). Scripts: `dev`, `build`, `start`. |
| `server/tsconfig.json` | Strict TypeScript, `outDir: dist`, `rootDir: src`, ES module interop. |
| `server/.env` | `PORT=3001`, `NODE_ENV=development`, `DATABASE_PATH=./database/leads.db`, `APIFY_TOKEN=`, `WEBHOOK_SECRET=` |

**Dependency:** None.

---

### Step 2.2 -- Types + Config

| File | What it contains |
|---|---|
| `server/src/types/lead.ts` | Lead TS interface, LeadStatus, LeadSource enums. Matching the DB schema from ARCHITECTURE.md. |
| `server/src/types/scrape.ts` | ScrapeInput, ScrapeResult, ScrapeResponse types. |
| `server/src/types/export.ts` | ExportRecord interface, ExportFormat type. |
| `server/src/types/api.ts` | ApiResponse<T>, ApiError, PaginatedMeta types. Wraps all responses in `{ success, data?, meta?, error? }` envelope per API-REFERENCE.md. |
| `server/src/config/env.ts` | Zod schema validating all env vars (`PORT`, `DATABASE_PATH`, `APIFY_TOKEN`, etc.). Exports typed config object with `safeParse`. |
| `server/src/config/database.ts` | Initializes better-sqlite3 connection. Runs migration files on startup. Exports `db` instance. |
| `server/src/config/apify.ts` | Initializes Apify client with `APIFY_TOKEN` from env. Exports `apifyClient`. |

**Dependency:** Step 2.1.

---

### Step 2.3 -- Database Schema + Migrations

| File | What it contains |
|---|---|
| `server/database/schema.sql` | Full DDL for `leads`, `searches`, `exports` tables matching ARCHITECTURE.md. Includes indexes on `source`, `status`, `page_url`, `created_at`. |
| `server/database/migrations/001_initial.sql` | CREATE TABLE leads + CREATE TABLE searches. |
| `server/database/migrations/002_add_exports_table.sql` | CREATE TABLE exports. |

**Dependency:** Step 2.2 (database config reads these).

---

### Step 2.4 -- Middleware

| File | What it contains |
|---|---|
| `server/src/middleware/logger.ts` | Morgan middleware for request logging. |
| `server/src/middleware/cors.ts` | CORS configuration allowing `http://localhost:3000` (Next.js dev server). |
| `server/src/middleware/validate.ts` | Zod-based request validation middleware. Factory function: `validate(schema)` validates `req.body` against a Zod schema. Returns 400 with VALIDATION_ERROR code on failure. |
| `server/src/middleware/errorHandler.ts` | Global error handler. Catches all errors, maps known error codes to HTTP statuses (VALIDATION_ERROR->400, NOT_FOUND->404, APIFY_ERROR->502, RATE_LIMITED->429, SCRAPE_TIMEOUT->504). Returns `{ success: false, error: {...} }`. Logs to console in dev. |

**Dependency:** Step 2.2 (types for envelope).

---

### Step 2.5 -- Models (Data Access Layer)

| File | What it contains |
|---|---|
| `server/src/models/Lead.ts` | LeadRepository class. Methods: `findAll(filters)` with pagination/sorting/filtering/ full-text search, `findById(id)`, `create(data)`, `update(id, data)`, `delete(id)`, `bulkStatus(ids, status)`, `bulkDelete(filters)`, `findByUrlAndSource(url, source)` for dedup check, `bulkInsert(leads[])` with dedup logic. All raw SQL via better-sqlite3 prepared statements. |
| `server/src/models/Search.ts` | SearchRepository. Methods: `create(search)`, `findById(id)`, `findAll(filters)`, `updateStatus(id, status)`. |
| `server/src/models/Export.ts` | ExportRepository. Methods: `create(export)`, `findAll()`. |

**Dependency:** Step 2.3 (database connection).

---

### Step 2.6 -- Services (Business Logic)

| File | What it contains |
|---|---|
| `server/src/services/queryBuilder.ts` | `buildFacebookQuery(businessType, location)`, `buildInstagramQuery(...)`, `buildGoogleWebQuery(...)` from ReadMe.md. Each returns the appropriate Google dork string. |
| `server/src/services/apifyService.ts` | `startScrape(source, input)` -- builds actor input per source (google-search-scraper or google-maps-email-extractor), starts run via Apify client, records search in DB with status `running`, returns `{ searchId }`. `pollAndFetch(searchId, source)` -- polls every 5s (5 min timeout GSC, 10 min Maps), fetches dataset on completion, transforms results, calls leadService to insert. Error handling: 3 retries with exponential backoff, timeout -> mark search failed, malformed -> log+skip. |
| `server/src/services/leadService.ts` | `createFromScrape(leadsArray, source)` -- bulk insert with dedup via Lead model. `findAll(filters)` -- delegates to Lead model. `updateStatus(id, status)`, `getStats()` -- aggregates for dashboard. |
| `server/src/services/searchService.ts` | Thin wrapper around Search model. `recordSearch()`, `getHistory()`, `getSearch()`, `markCompleted()`, `markFailed()`. |
| `server/src/services/statsService.ts` | `getOverview()` -- counts by source, by status, with-email/phone/both. `getRecent()` -- last 24h / last 7d aggregates + recent searches list. |
| `server/src/services/csvExporter.ts` | `generateCsv(filters)` -- queries leads via leadService, streams CSV via fast-csv to `exports/` directory, records in exports table. Filename: `leads-{source}-{YYYYMMDD-HHMMSS}.csv`. Columns from ReadMe.md section 8. |
| `server/src/services/jsonExporter.ts` | `generateJson(filters)` -- same query as CSV but writes pretty-printed JSON array. Filename: `leads-{source}-{YYYYMMDD-HHMMSS}.json`. |

**Dependency:** Step 2.5 (models).

---

### Step 2.7 -- Utils

| File | What it contains |
|---|---|
| `server/src/utils/formatters.ts` | Phone number formatter, email display formatter, date formatter. |
| `server/src/utils/parsers.ts` | Per-source Apify response parsers: `parseGoogleSearchResults(results, source)`, `parseMapsResults(results)`. Maps Apify output fields to DB column names per ReadMe.md section 4.2 mapping table. |
| `server/src/utils/deduplicator.ts` | `deduplicate(leads[], source)` -- groups by `page_url`, checks DB for existing records via Lead model, merges new data into existing records (keeps existing values non-null). |
| `server/src/utils/validators.ts` | Custom Zod schemas: `scrapeInputSchema`, `leadCreateSchema`, `leadUpdateSchema`, `bulkStatusSchema`, `bulkDeleteSchema`. |

**Dependency:** Step 2.2 (types), Step 2.5 (model for dedup check).

---

### Step 2.8 -- Routes

| File | What it contains |
|---|---|
| `server/src/routes/leads.ts` | Express Router. `GET /` -> leadService.findAll (with query params for filters/pagination/sort). `POST /` -> validate(leadCreateSchema) -> leadService.create. `GET /:id` -> leadService.findById or 404. `PATCH /:id` -> validate(leadUpdateSchema) -> leadService.update. `DELETE /:id` -> leadService.delete. `POST /bulk-status` -> validate(bulkStatusSchema) -> leadService.bulkStatus. `DELETE /bulk-delete` -> validate(bulkDeleteSchema) -> leadService.bulkDelete. |
| `server/src/routes/scrape.ts` | Express Router. `POST /:source` -> validate(scrapeInputSchema) -> assert source is valid -> startScrape -> searchService.recordSearch -> return 202 with searchId. Only `facebook`, `instagram`, `google-web`, `google-maps` accepted. |
| `server/src/routes/export.ts` | Express Router. `GET /csv` -> csvExporter.generateCsv pipe to response. `GET /json` -> jsonExporter.generateJson. `GET /exports` -> Export model findAll. |
| `server/src/routes/stats.ts` | Express Router. `GET /overview` -> statsService.getOverview. `GET /recent` -> statsService.getRecent. |
| `server/src/routes/searches.ts` | Express Router. `GET /` -> searchService.getHistory (paginated). `GET /:id` -> searchService.getSearch or 404. |
| `server/src/routes/index.ts` | Aggregates all route modules and mounts them: `/api/leads`, `/api/scrape`, `/api/export`, `/api/stats`, `/api/searches`. |

**Dependency:** Steps 2.6-2.7 (services, validators).

---

### Step 2.9 -- App Entry Point

| File | What it contains |
|---|---|
| `server/src/app.ts` | Express app creation. Registers middleware: cors, morgan logger, JSON body parser. Mounts routes from routes/index at `/api`. Registers error handler last. |
| `server/src/server.ts` | Entry point: validates env, initializes database (runs migrations), imports app, calls `app.listen(PORT)`. Logs startup message. |

**Dependency:** Steps 2.8 (routes), 2.4 (middleware).

---

## Phase 3: Integration & Real Data Wiring

Wire the frontend to the live backend and close the loop.

### Step 3.1 -- Real API Client

| File | Change |
|---|---|
| `client/src/lib/api.ts` | Replace all stub methods with real Axios calls pointing to `http://localhost:3001/api`. Each method maps to the exact routes in API-REFERENCE.md. Use response envelope unwrapping (extract `.data` from `{ success, data, meta }`). Add error interceptor that throws typed `ApiError` objects. |

**Dependency:** Phase 2 complete (backend running).

---

### Step 3.2 -- Next.js Config for Proxy

| File | Change |
|---|---|
| `client/next.config.js` | Add `rewrites` to proxy `/api/*` requests to `http://localhost:3001/api` during dev. This avoids CORS issues during development. |

**Dependency:** Step 3.1.

---

### Step 3.3 -- Backend CORS Adjustment

| File | Change |
|---|---|
| `server/src/middleware/cors.ts` | If using rewrites in 3.2, CORS can be restricted to same-origin only. If not using rewrites, keep the permissive dev config. |

**Dependency:** Step 3.2.

---

### Step 3.4 -- End-to-End Verification

| File | Change |
|---|---|
| `client/src/hooks/useLeads.ts` | Verify real API integration -- remove any remaining mock data paths. Confirm error states propagate correctly (network error -> toast, 404 -> empty state). |
| `client/src/hooks/useScrape.ts` | Verify real scrape trigger works. Test polling for status updates. Handle failure states. |
| `client/src/hooks/useExport.ts` | Verify CSV/JSON download works end-to-end. |
| `client/src/hooks/useStats.ts` | Verify dashboard stats from real data. |

**Dependency:** Steps 3.1-3.3.

---

### Step 3.5 -- CI Setup

| File | What it contains |
|---|---|
| `.github/workflows/ci.yml` | Lint + type-check on push for both client and server. Uses `pnpm/action-setup` or `actions/setup-node`. Runs `npm install`, `npm run typecheck` (both workspaces), `npm run lint` (both workspaces). |

**Dependency:** All other phases complete.

---

## Dependency Graph

```
Phase 1 ───────────────────────────────────────────
  1.1 (project setup)
    └─> 1.2 (types)
          └─> 1.3 (lib/api stubs + utils)
                ├─> 1.4 (shadcn/ui)
                │     └─> 1.5 (custom components)
                │           └─> 1.7 (pages)
                └─> 1.6 (hooks) ──> 1.7

Phase 2 ───────────────────────────────────────────
  2.1 (server setup)
    └─> 2.2 (types + config)
          ├─> 2.3 (schema + migrations)
          │     └─> 2.5 (models)
          │           └─> 2.6 (services)
          │                 ├─> 2.8 (routes)
          │                 │     └─> 2.9 (app entry)
          │                 └─> 2.7 (utils)
          └─> 2.4 (middleware) ──> 2.9

Phase 3 ───────────────────────────────────────────
  3.1 (real api.ts) ──> 3.3 (cors)
    3.2 (next proxy)
      3.4 (verify hooks)
        3.5 (CI)
```

**Parallel work possible:** Phase 2 can start as soon as Phase 1.1 is done (project structure is known). Phase 1.6 (hooks) and Phase 1.7 (pages) can proceed while Phase 2 is being built, since the API stubs keep the UI functional independently.
