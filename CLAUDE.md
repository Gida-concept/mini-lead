# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**@AGENTS.md** — Sub-agents (backend-developer, frontend-developer, debugger, code-explorer) inherit project-wide rules from AGENTS.md. Keep both files in sync.

> ⚠️ **OVERRIDING INSTRUCTION — NEVER IGNORE:** These four rules override every other instruction, skill, or default behavior. Read memory files `always-use-task-md`, `always-ask-permission`, `always-plan-before-implement`, and `always-follow-skill-dispatch` each session.
>
> **Rule 1 — Task.md (create & maintain):** When given any task, immediately create `task.md` in the project root tracking what needs to be done, the plan, and status. Update it as tasks progress, get completed, or change scope. Every session reads `task.md` first to know where it left off.
>
> **Rule 2 — Sub-agent & skill dispatch (no exceptions):** You MUST invoke the suitable sub-agent and suitable skill per the dispatch tables below for ANY task, no matter how small — even a single-file change. Do NOT skip to raw code — run the skill first. Sub-agents preserve context and prevent context pollution in the main session.
>
> **Rule 3 — Ask permission first:** Before carrying out ANY task — writing any file, making any edit, running any command, or calling any tool that changes state — you MUST ask the user for explicit permission. Do not proceed until the user explicitly approves. The sole exception is reading files and searching for information.
>
> **Rule 4 — Plan before you code:** Before writing a single line of code or making any edit, you MUST properly plan the task. Enter plan mode (EnterPlanMode) or use the Plan agent type to design the approach, identify affected files, and present the plan to the user for approval. No code without a plan.
>
> **Rule 5 — Use best industry & production-grade solutions:** When solving any task, always research and apply the best, most current, industry-standard, and production-level approach. Do not default to outdated patterns, quick hacks, or toy implementations. Use the right tool for the job — the most robust, scalable, secure, and idiomatic solution available for the platform and language in use.

## Skill Dispatch — Invoke the Correct Skill for Each Task

When given a task or writing a plan, invoke the most specific installed skill. Do not skip to raw code — run the skill first via `Skill` tool or `/name` slash command.

### Feature Development & Planning

| Task | Skill(s) to invoke |
|---|---|
| Implementing a new feature (multi-file, cross-layer) | `feature-dev` |
| Writing an implementation plan / architecture design | `Plan` agent type (via Agent tool or EnterPlanMode) |
| Building frontend UI components / pages | `frontend-design` or `ckm-ui-styling` |
| Building an MCP server, app, or MCPB | `mcp-server-dev` |
| Reviewing code, a PR, or a diff for bugs | `code-review` (diff) or `review` (PR) or `code-review-skill` |
| Simplifying / refactoring code (reuse, efficiency) | `simplify` |
| Security audit or review | `security-review` |
| Verifying a change works (run app, screenshot) | `verify` |
| Running the app to test / launch | `run` |

### Design & Brand

| Task | Skill(s) |
|---|---|
| Brand voice, visual identity, messaging | `ckm-brand` |
| UI design system (tokens, components, slides) | `ckm-design-system` |
| Banner/social media/print design (22+ styles) | `ckm-banner-design` or `ckm-design` |
| Logo / corporate identity program | `ckm-design` |
| HTML slides with Chart.js | `ckm-slides` |
| Logo generation (55 styles, Gemini AI) | `ckm-design` |
| Icon design (15 styles, SVG) | `ckm-design` |
| Social media photos (HTML→screenshot, multi-platform) | `ckm-design` |

### Story, Epic & Task Management (hex-line)

| Task | Skill(s) |
|---|---|
| Discovering growth opportunities | `ln-201-opportunity-discoverer` |
| Creating/replanning Epics (3-7) | `ln-210-epic-coordinator` |
| Creating/replanning Stories (5-10 per Epic) | `ln-220-story-coordinator`, `ln-221-story-creator`, `ln-222-story-replanner` |
| RICE-prioritizing Stories | `ln-230-story-prioritizer` |
| Breaking down Stories into tasks | `ln-300-task-coordinator`, `ln-301-task-creator`, `ln-302-task-replanner` |
| Validating Stories/plans/tasks (research + evidence) | `ln-310-multi-agent-validator` |
| Executing Story tasks in order | `ln-400-story-executor` |
| Executing an implementation task | `ln-401-task-executor` |
| Reviewing a completed task | `ln-402-task-reviewer` |
| Reworking a rejected task | `ln-403-task-rework` |
| Executing test tasks | `ln-404-test-executor` |
| Running Story quality gate (4-level verdict) | `ln-500-story-quality-gate` or `ln-510-quality-coordinator` |
| Checking code quality (DRY/KISS/YAGNI) | `ln-511-code-quality-checker` |
| Auto-fixing low-risk tech debt | `ln-512-tech-debt-cleaner` |
| Running regression tests | `ln-513-regression-checker` |
| Analyzing application logs | `ln-514-test-log-analyzer` |
| Planning test coverage | `ln-520-test-planner`, `ln-521-test-researcher`, `ln-522-manual-tester`, `ln-523-auto-test-planner` |

### Documentation

| Task | Skill(s) |
|---|---|
| Bootstrapping full project docs from scratch | `ln-100-documents-pipeline` |
| Creating core project docs (requirements, architecture, tech stack) | `ln-110-project-docs-coordinator`, `ln-111-root-docs-creator`, `ln-112-project-core-creator` |
| Creating backend docs (API spec, DB schema) | `ln-113-backend-docs-creator` |
| Creating frontend design docs (WCAG 2.1) | `ln-114-frontend-docs-creator` |
| Creating DevOps docs (infrastructure, runbook) | `ln-115-devops-docs-creator` |
| Creating Architecture Decision Records (ADRs) | `adr` or `ln-120-reference-docs-creator` |
| Creating task/kanban docs | `ln-130-tasks-docs-creator` |
| Creating test strategy docs | `ln-140-test-docs-creator` |
| Extracting skills from docs / creating slash commands | `ln-160-docs-skill-extractor`, `ln-161-skill-creator` |
| Reviewing skill quality | `ln-162-skill-reviewer` |
| Maintaining CHANGELOG | `changelog` |
| Creating/updating CLAUDE.md | `init` |

### Auditing (Codebase, Docs, Tests, Architecture, Performance)

| Task | Skill(s) |
|---|---|
| Auditing project documentation | `ln-610-docs-auditor` |
| Checking docs structure (hierarchy, links, SSOT) | `ln-611-docs-structure-auditor` |
| Checking docs semantic content / coverage | `ln-612-semantic-content-auditor` |
| Auditing code comments / docstrings | `ln-613-code-comments-auditor` |
| Fact-checking .md files against codebase | `ln-614-docs-fact-checker` |
| Full codebase audit (security, build, duplication, hotspots, dependencies, dead code, diagnosability, concurrency, lifecycle) | `ln-620-codebase-auditor` |
| Security boundary audit (secrets, injection, XSS) | `ln-621-security-boundary-auditor` |
| Build/delivery gate audit | `ln-622-build-delivery-gate-auditor` |
| Duplication / over-abstraction audit | `ln-623-duplication-overabstraction-auditor` |
| Code maintainability hotspot audit | `ln-624-code-maintainability-hotspot-auditor` |
| Dependency / reuse audit | `ln-625-dependency-reuse-auditor` |
| Dead code pruning audit | `ln-626-dead-code-pruning-auditor` |
| Diagnosability audit (logs, metrics, traces) | `ln-627-diagnosability-auditor` |
| Concurrency correctness audit | `ln-628-concurrency-correctness-auditor` |
| Runtime lifecycle / config audit | `ln-629-runtime-lifecycle-config-auditor` |
| Test surface audit | `ln-630-test-auditor` (and sub-auditors: `ln-631` through `ln-638`) |
| Architectural pattern audit | `ln-640-pattern-evolution-auditor` (and sub-auditors: `ln-641` through `ln-647`) |
| Persistence / performance audit | `ln-650-persistence-performance-auditor` (and sub-auditors: `ln-651` through `ln-654`) |
| Code quality audit (quick) | `code-review` |
| Secret scanning | `ln-761-secret-scanner` |
| GitHub issues/PRs triage | `ln-911-github-triager` |

### Project Setup & Infrastructure

| Task | Skill(s) |
|---|---|
| Full DevOps setup (Docker, CI/CD, env) | `ln-730-devops-setup` |
| Dockerfile / docker-compose generation | `ln-731-docker-generator` or `docker-best-practices` |
| GitHub Actions CI workflow | `ln-732-cicd-generator` or `github-actions` |
| Environment variable configuration | `ln-733-env-configurator` |
| Quality tooling setup (linters, pre-commit, test infra) | `ln-740-quality-setup` |
| Linter configuration (ESLint, Prettier, Ruff, etc.) | `ln-741-linter-configurator` |
| Pre-commit hooks (Husky, commitlint, etc.) | `ln-742-precommit-setup` |
| Test infrastructure (Vitest, xUnit, pytest) | `ln-743-test-infrastructure` |
| Security scanning setup | `ln-760-security-setup` |
| Cross-cutting concerns (logging, error handling, CORS, health checks, API docs) | `ln-770-crosscutting-setup` |
| Structured JSON logging | `ln-771-logging-configurator` |
| Global error handling middleware | `ln-772-error-handler-setup` |
| CORS policy configuration | `ln-773-cors-configurator` |
| Health check endpoints (K8s probes) | `ln-774-healthcheck-setup` |
| Swagger/OpenAPI docs | `ln-775-api-docs-generator` |
| Bootstrap verification (build + test + container) | `ln-780-bootstrap-verifier` |

### Codebase Restructuring & Generation

| Task | Skill(s) |
|---|---|
| Scaffolding/restructuring to Clean Architecture | `ln-720-structure-migrator` |
| Frontend restructure to component architecture | `ln-721-frontend-restructure` |
| .NET Clean Architecture backend generation | `ln-722-backend-generator` |
| Seed data generation | `ln-723-seed-data-generator` |
| Removing platform-specific artifacts (Replit, etc.) | `ln-724-artifact-cleaner` |

### Performance & Optimization

| Task | Skill(s) |
|---|---|
| Profiling runtime performance (CPU, memory, I/O) | `ln-811-performance-profiler` |
| Competitive benchmark research | `ln-812-optimization-researcher` |
| Validating optimization plans | `ln-813-optimization-plan-validator` |
| Executing optimizations | `ln-814-optimization-executor` |
| Upgrading npm/yarn/pnpm dependencies | `ln-821-npm-upgrader` |
| Upgrading .NET NuGet packages | `ln-822-nuget-upgrader` |
| Upgrading Python pip/poetry/pipenv dependencies | `ln-823-pip-upgrader` |
| Replacing custom code with OSS packages | `ln-831-oss-replacer` |
| Bundle optimization (tree-shaking, code-splitting) | `ln-832-bundle-optimizer` |
| MCP benchmark comparison | `ln-840-benchmark-compare` |

### Research & Analysis

| Task | Skill(s) |
|---|---|
| Deep multi-source web research (fact-checked, cited) | `deep-research` |
| Session analysis (errors, inefficiencies) | `ln-002-session-analyzer` |
| Code knowledge graph (dependencies, references, architecture) | `ln-021-codegraph` |
| Research graph indexing / querying | `ln-022-researchgraph` |

### Configuration & Environment

| Task | Skill(s) |
|---|---|
| Configuring permissions, hooks, env vars, settings.json | `update-config` |
| Installing/updating CLI agents (Codex, Claude Code) | `ln-011-agent-installer` |
| Installing MCP packages + configuring registration | `ln-012-mcp-configurator` |
| Syncing marketplace config between Claude and Codex | `ln-013-config-syncer` |
| Creating AGENTS.md / CLAUDE.md alignment | `ln-014-agent-instructions-manager` |
| Removing hex-line integration surfaces | `ln-015-hex-line-uninstaller` |
| Customizing keyboard shortcuts | `keybindings-help` |
| Setting up recurring tasks / polling | `loop` |
| Preparing git worktrees | `worktree` |

### Coding Guidelines & Best Practices

| Task | Skill(s) |
|---|---|
| Frontend (React/TypeScript) coding conventions | `frontend-coding-guidelines` |
| Docker reliable local deployments | `docker-best-practices` |
| GitHub Actions secure workflows | `github-actions` |
| Elixir/Phoenix best practices | `elixir-best-practices` |
| NestJS development guidelines | `nestjs-dev-guidelines` |
| UI/UX design best practices | `ui-ux-pro-max` |
| Code review best practices (React, Vue, Angular, Svelte, Rust, TS, Java, PHP, Python, Go, C#, Kotlin, Swift, NestJS, C/C++) | `code-review-skill` |

**IMPORTANT:** This skill dispatch table is authoritative. Always scan it before starting any task. If you don't find a match in the table, use common sense — but when you do find a match, you MUST use the listed skill.

## Sub-Agent Dispatch — Assign the Right Agent to Each Task

Global sub-agent files are installed at `~/.claude/agents/`. When a task requires specialized focus, delegate it to the appropriate sub-agent via the `Agent` tool with the matching `subagent_type`.

### Agent Types & When to Delegate

| Agent | When to use | How to invoke |
|---|---|---|
| **`backend-developer`** | Building/modifying Express routes, services, models (SQL queries), middleware, or config. Writing SQLite queries. Adding Zod validation. | `Agent(subagent_type: "backend-developer")` |
| **`frontend-developer`** | Building React components, pages, hooks, Tailwind styling, Next.js App Router pages. UI states (loading, empty, error, edge cases). | `Agent(subagent_type: "frontend-developer")` |
| **`debugger`** | Tracing runtime errors, failed requests, middleware chain issues, 500s, type errors, build failures, Apify actor failures. Root cause analysis. | `Agent(subagent_type: "debugger")` |
| **`code-explorer`** | Understanding unfamiliar code. Mapping module dependencies, tracing data flow, documenting undocumented subsystems. Use before refactoring. | `Agent(subagent_type: "code-explorer")` |

### Task-to-Agent Mapping

| Task | Primary Agent | Also involve |
|---|---|---|
| Backend API endpoint (new) | `backend-developer` | — |
| Backend API endpoint (debug) | `debugger` | `backend-developer` for fix |
| Frontend page/component | `frontend-developer` | — |
| Build failure / type error | `debugger` | — |
| Codebase discovery before refactor | `code-explorer` | — |
| Full-stack feature (API + UI) | `backend-developer` + `frontend-developer` | — |

### Agent Configuration

All sub-agents inherit from `AGENTS.md` at the project root for project-wide rules (patterns, conventions). The agent-specific `.md` files in `~/.claude/agents/` provide deep domain expertise on top. If you need to customize an agent for this project, copy its file to `.claude/agents/<name>.md` (project-local overrides global).

## Before Any Change — Mandatory Protocol

1. **Read the relevant doc files first** — `ReadMe.md` for the full blueprint, `ARCHITECTURE.md` for file tree and DB schema, `API-REFERENCE.md` for endpoint contracts
2. **Trace all import chains** — use Grep to find every file that imports from or is imported by the target
3. **Check all layers** — backend (routes/services/models), shared (types), frontend (hooks/components) must be consistent
4. **Match existing patterns** — read 2-3 analogous files before creating a new one, replicate naming/style exactly
5. **Leave the tree shippable** — no dangling imports, no missing exports, no broken references

## Project Status

**Phase 1 (Frontend) — Complete.** The Next.js 15 frontend is fully built and compiles with zero type errors. See `task.md` for current phase status.

Phase 2 (Backend) is in progress. The three design docs (`ReadMe.md`, `ARCHITECTURE.md`, `API-REFERENCE.md`) are still the source of truth for all behavior.

## Architecture Overview

A personal lead generation tool with **no authentication** — two-process architecture:

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS 4, shadcn/ui
- **Backend**: Express.js 5, Node.js 22, SQLite (better-sqlite3), Zod validation
- **Scraping**: Apify actors (`apify/google-search-scraper` for FB/IG/GSC; `leadsbrary/google-maps-email-extractor` for Maps)
- **Export**: fast-csv streaming, JSON download

### High-Level Data Flow

```
User fills form → POST /api/scrape/:source → Express → Apify actor starts
→ Poll until complete → Transform & deduplicate → Bulk INSERT into SQLite
→ Frontend refreshes → User filters → Export CSV/JSON
```

### Scraping Flow

1. Frontend sends `{ businessType, location, maxResults }` to `POST /api/scrape/:source`
2. `queryBuilder.ts` generates a source-specific search query (e.g. `site:facebook.com/pages "restaurant" "lagos, nigeria"`)
3. `apifyService.ts` starts the Apify actor run
4. Backend polls every 5s: 5-min timeout for Google Search Scraper, 10-min for Maps
5. On completion: fetch dataset, parse per-source, deduplicate by `page_url + source`, bulk insert to SQLite

### Deduplication Rule

Before insert, check `SELECT id FROM leads WHERE page_url = ? AND source = ?`. If exists: UPDATE `updated_at`, merge new fields where null. If not: INSERT.

### Lead Pipeline Statuses

`new` → `contacted` → `qualified` → `rejected`

## Key Design Documents

| File | What it covers |
|------|---------------|
| `ReadMe.md` | Full production blueprint: architecture diagram, DB schema, API routes, Apify configs, data flow, export system |
| `ARCHITECTURE.md` | Tech stack, complete file tree, DB schemas (3 tables), API endpoint list, Apify actor configs, env vars |
| `API-REFERENCE.md` | All endpoints with request/response examples in a standard `{ success, data, meta }` envelope |

## Database (SQLite)

Three tables:
- **`leads`** (17 cols) — `id`, `source`, `business_type`, `location`, `business_name`, `page_url`, `email`, `phone`, `address`, `rating`, `review_count`, `social_handle`, `description`, `raw_data`, `status`, `created_at`, `updated_at`
- **`searches`** — Audit trail for scrape runs (`source`, `query_params` JSON, `run_status`, `apify_run_id`, `results_count`)
- **`exports`** — Export history (`filename`, `filter_source`, `record_count`)

## Sources

- `facebook` — Uses `apify/google-search-scraper`, queries `site:facebook.com/pages`
- `instagram` — Uses `apify/google-search-scraper`, queries `site:instagram.com`
- `google_web` — Uses `apify/google-search-scraper`, excludes known site aggregators
- `google_maps` — Uses `leadsbrary/google-maps-email-extractor` (scrapes contacts, ratings, reviews)

## API Conventions

- **Base URL**: `http://localhost:3001/api`
- **Response envelope**: `{ success: boolean, data: object|null, error: { code, message }|null, meta: { page, limit, total }|null }`
- **Error codes**: `VALIDATION_ERROR` (400), `NOT_FOUND` (404), `APIFY_ERROR` (502), `RATE_LIMITED` (429), `INTERNAL_ERROR` (500), `EXPORT_EMPTY` (400), `SCRAPE_TIMEOUT` (504)
- **Pagination**: List endpoints use `page` (default 1) and `limit` (default 25, max 100)
- **Validation**: Zod schemas on all endpoints
- **Scrape endpoints return** `202 Accepted` with search ID for polling

## Common Tasks

### Development (once implemented)

```bash
# Backend
cd server && npm run dev        # Express on :3001
npm run build                   # TypeScript compile

# Frontend
cd client && npm run dev        # Next.js on :3000
```

### Environment

```bash
# server/.env
PORT=3001
NODE_ENV=development
DATABASE_PATH=./database/leads.db
APIFY_TOKEN=<your-apify-api-token>

# client/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Project Structure (as designed)

```
/
├── client/                          # Next.js 15 Frontend
│   ├── src/app/
│   │   ├── layout.tsx               # Root layout, providers
│   │   ├── page.tsx                 # Dashboard (stats + quick search)
│   │   ├── facebook/page.tsx        # Facebook Leads Section
│   │   ├── instagram/page.tsx       # Instagram Leads Section
│   │   ├── google-web/page.tsx      # Google Web Leads Section
│   │   └── google-maps/page.tsx     # Google Maps Leads Section
│   ├── src/components/
│   │   ├── ui/                      # shadcn/ui (button, input, table, badge, etc.)
│   │   ├── SearchForm.tsx           # businessType / location / maxResults
│   │   ├── LeadTable.tsx            # Sortable, filterable data table
│   │   ├── LeadCard.tsx             # Mobile card view
│   │   ├── StatusBadge.tsx          # Color-coded status pills
│   │   ├── ExportButton.tsx         # CSV/JSON export trigger
│   │   ├── StatsCards.tsx           # Dashboard stat widgets
│   │   ├── FilterBar.tsx            # Source + status filters
│   │   └── Pagination.tsx           # Table pagination
│   ├── src/hooks/
│   │   ├── useLeads.ts              # SWR/fetch for lead data
│   │   ├── useScrape.ts             # Mutation hook for scraping
│   │   ├── useExport.ts             # Export download handler
│   │   └── useStats.ts              # Dashboard stats hook
│   ├── src/lib/
│   │   ├── api.ts                   # Axios client
│   │   └── utils.ts                 # cn(), formatters, validators
│   └── src/types/
│       ├── lead.ts                  # Lead interface
│       └── api.ts                   # API response types
│
├── server/                          # Express Backend
│   ├── src/
│   │   ├── app.ts                   # Express app setup
│   │   ├── server.ts                # Entry point
│   │   ├── config/
│   │   │   ├── database.ts          # SQLite connection + migration runner
│   │   │   ├── apify.ts             # Apify client init
│   │   │   └── env.ts               # Zod-validated env vars
│   │   ├── routes/
│   │   │   ├── leads.ts             # CRUD leads
│   │   │   ├── scrape.ts            # POST /api/scrape/:source
│   │   │   ├── export.ts            # CSV/JSON download
│   │   │   ├── stats.ts             # Dashboard aggregates
│   │   │   └── searches.ts          # Search history
│   │   ├── services/
│   │   │   ├── apifyService.ts      # Actor runner, polling, result fetcher
│   │   │   ├── leadService.ts       # CRUD, deduplication, bulk ops
│   │   │   ├── queryBuilder.ts      # Search query generators per source
│   │   │   ├── csvExporter.ts       # CSV stream generation
│   │   │   └── statsService.ts      # Dashboard stats aggregation
│   │   ├── models/
│   │   │   ├── Lead.ts              # Lead repository (SQL queries)
│   │   │   ├── Search.ts            # Search record repository
│   │   │   └── Export.ts            # Export record repository
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts      # Global error handler
│   │   │   └── validate.ts          # Zod request validation
│   │   └── types/
│   │       ├── lead.ts              # Lead interfaces
│   │       └── api.ts               # API response wrappers
│   ├── database/
│   │   ├── schema.sql               # Full DDL
│   │   └── migrations/              # Sequential SQL migrations
│   └── exports/                     # Generated files (gitignored)
│
└── .github/workflows/ci.yml         # Lint + type-check on push
```
