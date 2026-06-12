Lead Generation Engine — Production Blueprint

1\. Architecture Overview

plain

┌─────────────────────────────────────────────────────────────────────────────┐

│                              CLIENT (Next.js 15)                            │

│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │

│  │  Facebook    │  │  Instagram   │  │  Google Web  │  │  Google Maps     │ │

│  │  Leads       │  │  Leads       │  │  Leads       │  │  Leads           │ │

│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘ │

│         └─────────────────┴─────────────────┴───────────────────┘           │

│                              Dashboard / Export                               │

└─────────────────────────────────────────────────────────────────────────────┘

&#x20;                                     │

&#x20;                                     ▼ HTTP/REST

┌─────────────────────────────────────────────────────────────────────────────┐

│                            SERVER (Express + SQLite)                          │

│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │

│  │  Apify Proxy │  │  Lead Service│  │  CSV Export  │  │  SQLite DB       │ │

│  │  (GSC Actor) │  │  (CRUD/Filter│  │  Generator   │  │  (3 tables)      │ │

│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────────┘ │

│  ┌──────────────────────────────────────────────────────────────────────────┐ │

│  │  Google Maps Email Extractor Actor (leadsbrary/google-maps-email-extractor)│ │

│  └──────────────────────────────────────────────────────────────────────────┘ │

└─────────────────────────────────────────────────────────────────────────────┘

2\. Database Schema (SQLite)

Table: leads

Table

Column	Type	Constraints	Notes

id	INTEGER	PRIMARY KEY, AUTOINCREMENT	

source	TEXT	NOT NULL	facebook, instagram, google\_web, google\_maps

business\_type	TEXT	NOT NULL	e.g., "restaurant"

location	TEXT	NOT NULL	e.g., "lagos, nigeria"

business\_name	TEXT		

page\_url	TEXT		Profile/website URL

email	TEXT		Extracted or null

phone	TEXT		Extracted or null

address	TEXT		Physical address

rating	REAL		Google Maps rating

review\_count	INTEGER		Number of reviews

social\_handle	TEXT		@handle for FB/IG

description	TEXT		Bio/snippet

raw\_data	TEXT		Full JSON from API

status	TEXT	DEFAULT 'new'	new, contacted, qualified, rejected

created\_at	DATETIME	DEFAULT CURRENT\_TIMESTAMP	

updated\_at	DATETIME	DEFAULT CURRENT\_TIMESTAMP	

Table: searches (Audit trail for runs)

Table

Column	Type	Constraints

id	INTEGER	PRIMARY KEY

source	TEXT	NOT NULL

query\_params	TEXT	JSON of search inputs

results\_count	INTEGER	

run\_status	TEXT	running, completed, failed

apify\_run\_id	TEXT	

created\_at	DATETIME	DEFAULT CURRENT\_TIMESTAMP

Table: exports

Table

Column	Type	Constraints

id	INTEGER	PRIMARY KEY

filename	TEXT	

filter\_source	TEXT	Which section exported

record\_count	INTEGER	

created\_at	DATETIME	DEFAULT CURRENT\_TIMESTAMP

3\. API Design (Express Routes)

Lead Management

plain

GET    /api/leads                    → List all leads (with filters)

GET    /api/leads?source=facebook\&location=lagos\&status=new

POST   /api/leads                    → Manual add (or bulk insert from scraper)

GET    /api/leads/:id                → Single lead detail

PATCH  /api/leads/:id                → Update status/notes

DELETE /api/leads/:id                → Remove lead

POST   /api/leads/bulk-status        → Bulk update status

DELETE /api/leads/bulk-delete        → Bulk delete by filter

Scraping / Search Execution

plain

POST   /api/scrape/facebook          → Trigger Facebook scrape

POST   /api/scrape/instagram         → Trigger Instagram scrape

POST   /api/scrape/google-web        → Trigger Google Web scrape

POST   /api/scrape/google-maps       → Trigger Google Maps scrape



Body for all:

{

&#x20; "businessType": "restaurant",

&#x20; "location": "lagos, nigeria",

&#x20; "maxResults": 100              // Optional, cap for safety

}

Export

plain

GET    /api/export/csv?source=facebook\&status=new  → Download CSV

GET    /api/export/json?source=...                 → Download JSON

GET    /api/exports                                → List past exports

Stats / Dashboard

plain

GET    /api/stats/overview           → Counts by source, status

GET    /api/stats/recent             → Last 24h activity

GET    /api/searches                 → Search history

4\. Apify Integration Layer

4.1 Google Search Console Actor (for Facebook, Instagram, Google Web)

Actor: apify/google-search-scraper (or apify/google-search-console-scraper)

Configuration per source:

JavaScript

// Facebook Query Builder

function buildFacebookQuery(businessType, location) {

&#x20; return `site:facebook.com/pages OR site:facebook.com/pg "${businessType}" "${location}" -"group" -"marketplace" -"events"`;

}



// Instagram Query Builder

function buildInstagramQuery(businessType, location) {

&#x20; return `site:instagram.com "${businessType}" "${location}" "📍" OR "link in bio" OR "DM" -"explore" -"tags"`;

}



// Google Web Query Builder

function buildGoogleWebQuery(businessType, location) {

&#x20; return `"${businessType}" "${location}" "menu" OR "reservation" OR "order" -site:facebook.com -site:instagram.com -site:tripadvisor.com -site:eatdrinklagos.com -site:booking.com -site:yellowpages.com.ng -site:ng.linkedin.com`;

}

Actor Input Payload:

JavaScript

{

&#x20; "queries": \[builtQuery],           // Array of queries

&#x20; "resultsPerPage": 10,

&#x20; "maxPagesPerQuery": 5,             // 50 results per query

&#x20; "languageCode": "en",

&#x20; "countryCode": "ng",               // Nigeria

&#x20; "mobileResults": false,

&#x20; "includeUnfilteredResults": false,

&#x20; "saveHtml": false,

&#x20; "saveHtmlToKeyValueStore": false,

&#x20; "includeAds": false,

&#x20; "parallelQueries": 1

}

Result Parsing:

Extract title, url, description from organic results

For Facebook: Parse page name from title, extract /pages/ or /pg/ path

For Instagram: Extract handle from URL (instagram.com/handle)

For Google Web: Extract domain, attempt to find contact page patterns

4.2 Google Maps Email Extractor

Actor: leadsbrary/google-maps-email-extractor

Actor Input Payload:

JavaScript

{

&#x20; "searchStringsArray": \["restaurant in lagos nigeria"],

&#x20; "countryCode": "ng",

&#x20; "language": "en",

&#x20; "maxCrawledPlaces": 100,

&#x20; "maxImages": 0,

&#x20; "includeWebResults": false,

&#x20; "scrapeContacts": true,            // Emails, phones, socials

&#x20; "scrapeReviews": false,

&#x20; "scrapeTablePrices": false,

&#x20; "scrapeMenus": false,

&#x20; "scrapePlaceDetailPage": true,

&#x20; "scrapeDirectionsPage": false

}

Result Mapping to DB:

JavaScript

{

&#x20; business\_name: place.title,

&#x20; page\_url: place.website || place.url,

&#x20; email: place.emails?.\[0] || null,

&#x20; phone: place.phone || null,

&#x20; address: place.address,

&#x20; rating: place.totalScore,

&#x20; review\_count: place.reviewsCount,

&#x20; description: place.description || place.subTitle,

&#x20; raw\_data: JSON.stringify(place)

}

5\. Backend Services (Express)

5.1 Project Structure

plain

server/

├── src/

│   ├── config/

│   │   ├── database.js          # SQLite connection + migrations

│   │   └── apify.js             # Apify client config

│   ├── routes/

│   │   ├── leads.js

│   │   ├── scrape.js

│   │   ├── export.js

│   │   └── stats.js

│   ├── services/

│   │   ├── apifyService.js      # Apify actor runner \& webhook handler

│   │   ├── leadService.js       # DB operations

│   │   ├── queryBuilder.js      # Search query generators

│   │   └── csvExporter.js       # CSV generation

│   ├── models/

│   │   └── Lead.js              # Data mapper / repository pattern

│   ├── middleware/

│   │   ├── errorHandler.js

│   │   └── validate.js          # Request validation

│   └── app.js

├── database/

│   └── leads.db                 # SQLite file (gitignored)

├── exports/                     # Generated CSVs (gitignored)

├── package.json

└── .env

5.2 Core Service Logic

Apify Service (services/apifyService.js)

Responsibilities:

Build actor input from search parameters

Start actor run via Apify API

Poll for completion (or use webhooks if deployed)

Transform and store results

Polling Strategy:

JavaScript

// After starting run, poll every 5s for status

// Timeout: 5 minutes for GSC, 10 minutes for Maps

// On completion: fetch dataset, parse, bulk insert to SQLite

Error Handling:

Apify timeout → mark search as failed, partial results if any

Rate limit → exponential backoff retry (3 attempts)

Malformed data → log, skip record, continue

Lead Service (services/leadService.js)

Key Methods:

createFromScrape(leadsArray, source) — Bulk insert with deduplication

findAll(filters) — Paginated, filterable list

deduplicate(url, source) — Check existing by page\_url + source

updateStatus(id, status) — Pipeline management

getStats() — Dashboard aggregates

Deduplication Rule:

sql

\-- Before insert, check:

SELECT id FROM leads WHERE page\_url = ? AND source = ?

\-- If exists: UPDATE updated\_at, merge new fields if null

\-- If not: INSERT

6\. Frontend (Next.js 15 + Tailwind)

6.1 Page Structure

plain

app/

├── page.tsx                      # Dashboard (stats + quick search)

├── layout.tsx                    # Root layout, providers

├── globals.css

├── facebook/

│   └── page.tsx                  # Facebook Leads Section

├── instagram/

│   └── page.tsx                  # Instagram Leads Section

├── google-web/

│   └── page.tsx                  # Google Web Leads Section

├── google-maps/

│   └── page.tsx                  # Google Maps Leads Section

├── components/

│   ├── SearchForm.tsx            # Reusable: businessType, location, maxResults

│   ├── LeadTable.tsx             # Sortable, filterable table

│   ├── LeadCard.tsx              # Card view for mobile

│   ├── StatusBadge.tsx           # Color-coded status pills

│   ├── ExportButton.tsx          # CSV/JSON export trigger

│   ├── StatsCards.tsx            # Dashboard stat widgets

│   ├── RecentSearches.tsx        # Search history list

│   └── LoadingState.tsx          # Skeleton loaders

├── hooks/

│   ├── useLeads.ts               # SWR/fetch for lead data

│   ├── useScrape.ts              # Mutation hook for scraping

│   └── useExport.ts              # Export handler

└── lib/

&#x20;   ├── api.ts                    # Axios/fetch client

&#x20;   └── utils.ts                  # Formatters, validators

6.2 Section-Specific UI (All 4 Sections)

Each section page (/facebook, /instagram, /google-web, /google-maps) shares this layout:

plain

┌────────────────────────────────────────────────────────────┐

│  \[Business Type Input]  \[Location Input]  \[Max Results]     │

│  \[🔍 Search Button]                                       │

├────────────────────────────────────────────────────────────┤

│  Filters: \[All] \[New] \[Contacted] \[Qualified] \[Rejected]   │

├────────────────────────────────────────────────────────────┤

│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐ │

│  │ Business │ Location │ URL      │ Email    │ Phone    │ │

│  │ Type     │          │          │          │          │ │

│  ├──────────┼──────────┼──────────┼──────────┼──────────┤ │

│  │ restaurant│ lagos   │ fb.com/x │ -        │ -        │ │

│  │ ...      │ ...      │ ...      │ ...      │ ...      │ │

│  └──────────┴──────────┴──────────┴──────────┴──────────┘ │

│  \[Export CSV] \[Export JSON] \[Bulk Delete] \[Bulk Status ▼]  │

└────────────────────────────────────────────────────────────┘

6.3 Search Form Component

Fields:

businessType: Text input with datalist (common types: restaurant, hotel, clinic, gym, etc.)

location: Text input with datalist (city, country format)

maxResults: Number input, default 50, max 200

Source-specific hints below inputs showing the exact query that will be sent

States:

Idle → Ready to search

Loading → Polling Apify (show progress: "Checking actor status...")

Success → Results loaded, table populated

Error → Toast notification, allow retry

6.4 Lead Table Features

Sorting: Click column headers (name, location, rating, date)

Filtering: Source-specific filters + global text search

Selection: Checkbox per row + header checkbox for bulk actions

Inline Actions:

Copy URL/Email/Phone buttons

Status dropdown per row

Delete button (with confirmation)

Pagination: 25/50/100 per page

7\. Data Flow: Scraping to Export

plain

User fills form → Frontend POST /api/scrape/:source

&#x20;                        ↓

&#x20;             Express receives request

&#x20;                        ↓

&#x20;             Query Builder generates search query

&#x20;                        ↓

&#x20;             Apify Service starts actor run

&#x20;                        ↓

&#x20;             \[Async] Poll until complete (or webhook)

&#x20;                        ↓

&#x20;             Fetch dataset from Apify

&#x20;                        ↓

&#x20;             Transform \& deduplicate records

&#x20;                        ↓

&#x20;             Bulk INSERT into SQLite

&#x20;                        ↓

&#x20;             WebSocket/SSE notify frontend (optional)

&#x20;                        ↓

&#x20;             Frontend refreshes lead list

&#x20;                        ↓

&#x20;             User filters → clicks Export CSV

&#x20;                        ↓

&#x20;             Backend streams CSV from SQLite query

&#x20;                        ↓

&#x20;             Browser downloads file

8\. Export System

CSV Export (services/csvExporter.js)

Columns (standardized across all sources):

csv

id,business\_type,location,business\_name,page\_url,email,phone,address,rating,review\_count,social\_handle,description,source,status,created\_at

Features:

Filter-aware: Only exports current filtered view

Streaming: Use fast-csv to stream from SQLite cursor (memory efficient for 10k+ rows)

Filename: leads-{source}-{YYYYMMDD-HHMMSS}.csv

Stored in /exports/ with record in exports table

JSON Export

Same filters, pretty-printed JSON array

Filename: leads-{source}-{timestamp}.json

9\. Environment Configuration

env

\# Server

PORT=3001

NODE\_ENV=development

DATABASE\_PATH=./database/leads.db



\# Apify

APIFY\_TOKEN=your\_apify\_api\_token\_here



\# Optional: For webhook mode (if deployed)

WEBHOOK\_SECRET=random\_string\_for\_verification



