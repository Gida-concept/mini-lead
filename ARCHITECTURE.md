# Lead Generation Engine — Architecture

## Overview

A personal lead generation tool built with **Next.js 15** (frontend), **Express** (backend), and **SQLite** (database). No authentication. Scrapes business leads from Facebook, Instagram, Google Web Search, and Google Maps using Apify actors, with CSV/JSON export capabilities.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS 4, shadcn/ui |
| Backend | Express.js 5, Node.js 22 |
| Database | SQLite 3 (better-sqlite3) |
| Scraping | Apify Client (Google Search Scraper, Google Maps Email Extractor) |
| Export | fast-csv |
| Validation | Zod |
| HTTP Client | Axios |

---

## Complete File Structure

```
leadgen-engine/
│
├── README.md
├── package.json                          # Root workspace config (npm workspaces or pnpm)
├── .gitignore
├── .env.example
│
├── client/                               # Next.js 15 Frontend
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── postcss.config.mjs
│   ├── components.json                   # shadcn/ui config
│   │
│   ├── public/
│   │   └── favicon.ico
│   │
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx                # Root layout with providers
│   │   │   ├── page.tsx                  # Dashboard (stats + quick search)
│   │   │   ├── globals.css
│   │   │   │
│   │   │   ├── facebook/
│   │   │   │   └── page.tsx              # Facebook Leads Section
│   │   │   │
│   │   │   ├── instagram/
│   │   │   │   └── page.tsx              # Instagram Leads Section
│   │   │   │
│   │   │   ├── google-web/
│   │   │   │   └── page.tsx              # Google Web Leads Section
│   │   │   │
│   │   │   └── google-maps/
│   │   │       └── page.tsx              # Google Maps Leads Section
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                       # shadcn/ui components (auto-generated)
│   │   │   │   ├── button.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   ├── toast.tsx
│   │   │   │   ├── toaster.tsx
│   │   │   │   ├── skeleton.tsx
│   │   │   │   ├── tabs.tsx
│   │   │   │   └── checkbox.tsx
│   │   │   │
│   │   │   ├── SearchForm.tsx            # Reusable search form (businessType, location, maxResults)
│   │   │   ├── LeadTable.tsx             # Sortable, filterable data table
│   │   │   ├── LeadCard.tsx              # Mobile card view for leads
│   │   │   ├── StatusBadge.tsx           # Color-coded status pills
│   │   │   ├── ExportButton.tsx          # CSV/JSON export trigger
│   │   │   ├── StatsCards.tsx            # Dashboard stat widgets
│   │   │   ├── RecentSearches.tsx        # Search history list
│   │   │   ├── LoadingState.tsx          # Skeleton loaders
│   │   │   ├── EmptyState.tsx            # No results illustration
│   │   │   ├── LeadDetailModal.tsx       # View lead details
│   │   │   ├── BulkActionsBar.tsx        # Bulk select actions
│   │   │   ├── QueryPreview.tsx          # Shows exact Apify query being sent
│   │   │   ├── Pagination.tsx            # Table pagination
│   │   │   ├── FilterBar.tsx             # Source + status filters
│   │   │   └── SectionHeader.tsx         # Page header with source icon + title
│   │   │
│   │   ├── hooks/
│   │   │   ├── useLeads.ts               # SWR hook for fetching leads
│   │   │   ├── useScrape.ts              # Mutation hook for triggering scrapes
│   │   │   ├── useExport.ts              # Export download handler
│   │   │   ├── useStats.ts               # Dashboard stats hook
│   │   │   ├── useSearches.ts            # Search history hook
│   │   │   └── useToast.ts               # Toast notifications
│   │   │
│   │   ├── lib/
│   │   │   ├── api.ts                    # Axios instance + API methods
│   │   │   ├── utils.ts                  # cn() helper, formatters, validators
│   │   │   └── constants.ts              # Source enums, status enums, defaults
│   │   │
│   │   └── types/
│   │       ├── lead.ts                   # Lead interface
│   │       ├── search.ts                 # Search/Scrape types
│   │       └── api.ts                    # API response types
│   │
│   └── .env.local                        # NEXT_PUBLIC_API_URL=http://localhost:3001
│
├── server/                               # Express Backend
│   ├── package.json
│   ├── tsconfig.json
│   │
│   ├── database/
│   │   ├── leads.db                      # SQLite database file (gitignored)
│   │   ├── schema.sql                    # Full schema definition
│   │   └── migrations/
│   │       ├── 001_initial.sql
│   │       └── 002_add_exports_table.sql
│   │
│   ├── exports/                          # Generated CSV/JSON files (gitignored)
│   │
│   ├── src/
│   │   ├── app.ts                        # Express app setup
│   │   ├── server.ts                     # Entry point, starts HTTP server
│   │   │
│   │   ├── config/
│   │   │   ├── database.ts               # SQLite connection, migration runner
│   │   │   ├── apify.ts                  # Apify client initialization
│   │   │   └── env.ts                    # Environment variable validation (Zod)
│   │   │
│   │   ├── routes/
│   │   │   ├── index.ts                  # Route aggregator
│   │   │   ├── leads.ts                  # GET /api/leads, POST /api/leads, PATCH, DELETE
│   │   │   ├── scrape.ts                 # POST /api/scrape/:source
│   │   │   ├── export.ts                 # GET /api/export/csv, GET /api/export/json
│   │   │   ├── stats.ts                  # GET /api/stats/overview, GET /api/stats/recent
│   │   │   └── searches.ts               # GET /api/searches
│   │   │
│   │   ├── services/
│   │   │   ├── apifyService.ts           # Apify actor runner, polling, result fetcher
│   │   │   ├── leadService.ts            # Lead CRUD, deduplication, bulk ops
│   │   │   ├── queryBuilder.ts           # Search query generators per source
│   │   │   ├── csvExporter.ts            # CSV stream generation
│   │   │   ├── jsonExporter.ts           # JSON export generation
│   │   │   ├── searchService.ts          # Search history tracking
│   │   │   └── statsService.ts           # Dashboard statistics aggregation
│   │   │
│   │   ├── models/
│   │   │   ├── Lead.ts                   # Lead repository (SQL queries)
│   │   │   ├── Search.ts                 # Search record repository
│   │   │   └── Export.ts                 # Export record repository
│   │   │
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts           # Global error handler
│   │   │   ├── validate.ts               # Zod request validation middleware
│   │   │   ├── logger.ts                 # Request logging (morgan)
│   │   │   └── cors.ts                   # CORS configuration
│   │   │
│   │   ├── types/
│   │   │   ├── lead.ts                   # Lead TypeScript interfaces
│   │   │   ├── scrape.ts                 # Scrape input/output types
│   │   │   ├── export.ts                 # Export types
│   │   │   └── api.ts                    # API response wrappers
│   │   │
│   │   └── utils/
│   │       ├── formatters.ts             # Phone/email formatters
│   │       ├── parsers.ts                # Apify response parsers per source
│   │       ├── deduplicator.ts           # URL-based deduplication logic
│   │       └── validators.ts             # Custom validation helpers
│   │
│   └── .env                              # PORT=3001, DATABASE_PATH, APIFY_TOKEN
│
└── .github/
    └── workflows/
        └── ci.yml                        # Lint + type-check on push
```

---

## Database Schema

### `leads`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT |
| `source` | TEXT | NOT NULL — `facebook`, `instagram`, `google_web`, `google_maps` |
| `business_type` | TEXT | NOT NULL |
| `location` | TEXT | NOT NULL |
| `business_name` | TEXT | |
| `page_url` | TEXT | |
| `email` | TEXT | |
| `phone` | TEXT | |
| `address` | TEXT | |
| `rating` | REAL | |
| `review_count` | INTEGER | |
| `social_handle` | TEXT | |
| `description` | TEXT | |
| `raw_data` | TEXT | JSON blob |
| `status` | TEXT | DEFAULT `'new'` — `new`, `contacted`, `qualified`, `rejected` |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP |

### `searches`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INTEGER | PRIMARY KEY |
| `source` | TEXT | NOT NULL |
| `query_params` | TEXT | JSON |
| `results_count` | INTEGER | |
| `run_status` | TEXT | `running`, `completed`, `failed` |
| `apify_run_id` | TEXT | |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP |

### `exports`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | INTEGER | PRIMARY KEY |
| `filename` | TEXT | |
| `filter_source` | TEXT | |
| `record_count` | INTEGER | |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP |

---

## API Endpoints

### Leads
- `GET /api/leads?source=&location=&status=&page=&limit=`
- `POST /api/leads` — Manual insert
- `GET /api/leads/:id`
- `PATCH /api/leads/:id` — Update status/fields
- `DELETE /api/leads/:id`
- `POST /api/leads/bulk-status` — Bulk status update
- `DELETE /api/leads/bulk-delete` — Bulk delete by filter

### Scraping
- `POST /api/scrape/facebook` — `{ businessType, location, maxResults }`
- `POST /api/scrape/instagram` — `{ businessType, location, maxResults }`
- `POST /api/scrape/google-web` — `{ businessType, location, maxResults }`
- `POST /api/scrape/google-maps` — `{ businessType, location, maxResults }`

### Export
- `GET /api/export/csv?source=&status=` — Download CSV
- `GET /api/export/json?source=&status=` — Download JSON
- `GET /api/exports` — List past exports

### Stats
- `GET /api/stats/overview` — Counts by source + status
- `GET /api/stats/recent` — Last 24h activity
- `GET /api/searches` — Search history

---

## Apify Actors

| Source | Actor | Purpose |
|--------|-------|---------|
| Facebook | `apify/google-search-scraper` | `site:facebook.com/pages` queries |
| Instagram | `apify/google-search-scraper` | `site:instagram.com` queries |
| Google Web | `apify/google-search-scraper` | Standalone website queries |
| Google Maps | `leadsbrary/google-maps-email-extractor` | Places with emails, phones, ratings |

---

## Environment Variables

### Server (`.env`)
```
PORT=3001
NODE_ENV=development
DATABASE_PATH=./database/leads.db
APIFY_TOKEN=your_apify_api_token
```

### Client (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```
