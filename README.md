# Lead Generation Engine 🚀

> **A personal tool for scraping business leads from Facebook, Instagram, Google Web Search, and Google Maps.**

Search for businesses by type and location across multiple platforms, collect contact info, manage lead statuses, and export data to CSV or JSON — all from a clean, responsive dashboard.

---

## ✨ Features

- **Multi-Source Scraping** — Collect leads from 4 sources:
  - Facebook Pages
  - Instagram Business Profiles
  - Google Web Search
  - Google Maps
- **Smart Search** — Enter any business type and location, get structured lead data
- **Lead Management** — Sort, filter, search, and bulk-update lead statuses (new → contacted → qualified → rejected)
- **Detailed Lead View** — Business name, email, phone, address, rating, social handles, and raw data
- **Bulk Actions** — Update status or delete multiple leads at once
- **Export** — Download leads as CSV or JSON with current filters applied
- **Dark Mode** — Toggle between light and dark themes
- **Responsive Design** — Fully functional on desktop, tablet, and mobile
- **Dashboard** — Overview stats and quick-search from any source

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS 4, shadcn/ui, Lucide React |
| **Backend** | Express.js 5, TypeScript |
| **Database** | SQLite (sql.js) |
| **Validation** | Zod |
| **Scraping** | Apify Actors (`google-search-scraper`, `google-maps-email-extractor`) |
| **Export** | fast-csv |

---

## 🏗 Architecture

```
┌─────────────┐       ┌─────────────┐       ┌───────────┐
│   Next.js   │──────▶│   Express   │──────▶│  SQLite   │
│  Frontend   │  API  │   Backend   │       │  (sql.js) │
│  :3000      │◀──────│  :3001      │◀──────│           │
└─────────────┘       └─────┬───────┘       └───────────┘
                            │
                     ┌──────▼───────┐
                     │  Apify       │
                     │  Actors      │
                     └──────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 22+
- **npm** 10+
- **Apify API Token** — [Get one free here](https://console.apify.com/signup) (required for scraping)

### Local Development

```bash
# Clone the repo
git clone https://github.com/your-username/mini-lead.git
cd mini-lead

# Install all dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your APIFY_TOKEN

# Start both frontend and backend
npm run dev
```

This starts:
- **Frontend** → `http://localhost:3000`
- **Backend** → `http://localhost:3001`

### Environment Variables

**Backend** (create `server/.env`):

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Backend server port |
| `DATABASE_PATH` | `./database/leads.db` | SQLite database file path |
| `APIFY_TOKEN` | — | Your Apify API token |
| `NODE_ENV` | `development` | Environment mode |

**Frontend** (create `client/.env.local`):

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Backend API base URL |

---

## 🗄 Database

The project uses **sql.js** (SQLite compiled to WebAssembly) for zero-config persistence.

- **`leads`** — All scraped business leads (17 columns)
- **`searches`** — Audit trail for scrape runs
- **`exports`** — Export history

Migrations run automatically on server startup.

> **⚠️ Production note:** sql.js saves to a file on disk. On ephemeral hosting (free Render, Heroku), data is lost on redeploy. Use **Render Persistent Disk** or switch to **Turso** (hosted SQLite) for production.

---

## 🌐 Deployment

### Frontend — Netlify

1. Push repo to GitHub
2. Go to [Netlify](https://app.netlify.com) → **Add new site** → **Import existing project**
3. Connect your GitHub repo and configure:
   - **Base directory:** `client`
   - **Build command:** `npm run build`
   - **Publish directory:** `client/.next`
4. Add env variable: `NEXT_PUBLIC_API_URL` = your Render backend URL
5. Deploy!

### Backend — Render

1. Create a [Render](https://render.com) account
2. **New +** → **Web Service** → Connect your GitHub repo
3. Configure:
   - **Root Directory:** `server`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. Add env variables: `NODE_ENV=production`, `DATABASE_PATH=./database/leads.db`, `APIFY_TOKEN=your-token`, `PORT=3001`
5. Deploy!

---

## 🧪 API Overview

Standard response envelope:

```json
{ "success": true, "data": {}, "error": null, "meta": { "page": 1, "limit": 25, "total": 42 } }
```

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/leads` | List leads (paginated, filterable) |
| `POST` | `/api/leads` | Create a lead |
| `GET` | `/api/leads/:id` | Get lead details |
| `PATCH` | `/api/leads/:id` | Update a lead |
| `DELETE` | `/api/leads/:id` | Delete a lead |
| `POST` | `/api/leads/bulk-status` | Bulk update status |
| `POST` | `/api/scrape/:source` | Start a scrape |
| `GET` | `/api/export/csv` | Export as CSV |
| `GET` | `/api/export/json` | Export as JSON |
| `GET` | `/api/stats/overview` | Dashboard stats |
| `GET` | `/api/searches` | Search history |

---

## 📁 Project Structure

```
mini-lead/
├── client/                    # Next.js frontend
│   ├── src/
│   │   ├── app/               # Pages
│   │   ├── components/        # UI components
│   │   ├── hooks/             # React hooks
│   │   ├── lib/               # API client, utils
│   │   └── types/             # TypeScript types
│   └── ...
├── server/                    # Express backend
│   ├── src/
│   │   ├── config/            # DB, env, Apify config
│   │   ├── models/            # SQL queries
│   │   ├── services/          # Business logic
│   │   ├── routes/            # API routes
│   │   └── middleware/        # Validation, errors
│   ├── database/migrations/   # SQL migrations
│   └── ...
├── package.json               # Workspace root
└── README.md
```

---

## 📄 License

MIT — free to use, modify, and distribute.
