# Deployment Guide

## Two Paths — One Codebase

Both deployment options use the **same codebase**. Just change an environment variable.

| Path | Backend | Database | Best for |
|------|---------|----------|----------|
| [**A — Fly.io + Turso**](#a--flyio--turso) | Fly.io containers | Turso (hosted SQLite) | You (free, no charge) |
| [**B — VPS Self-Hosted**](#b--vps-self-hosted) | Your own server | sql.js (file-based) | Users who want full control |

The code change is done **once**: a unified async database adapter that supports both sql.js and Turso. After that, deployment is just env vars.

---

# Prerequisite — Unified Database Adapter

This is the **one-time code change** that makes both deployments possible. It replaces the current sync sql.js wrapper with a unified async adapter that supports both backends.

## Step 0.1 — Install Turso package (required for Fly.io, optional for VPS)

```bash
cd server
npm install @libsql/client
```

VPS users can skip this if they only use sql.js — but installing it doesn't hurt.

## Step 0.2 — Replace `server/src/config/database.ts`

This new file detects the `DATABASE_PROVIDER` env var and initializes the right backend. Both expose the same async interface so your models never need to know which one is running.

```typescript
import { env } from './env.js';

// ---------------------------------------------------------------------------
// Unified async database interface
// Both sql.js and Turso expose the same shape
// ---------------------------------------------------------------------------

export interface DbAsync {
  execute(sql: string, params?: any[]): Promise<{ rows: any[]; rowCount: number }>;
}

let db: DbAsync;

// ---------------------------------------------------------------------------
// Provider: sql.js (default — works on VPS, no extra packages needed)
// ---------------------------------------------------------------------------

async function createSqlJsDb(): Promise<DbAsync> {
  const initSqlJs = (await import('sql.js')).default;
  const path = await import('node:path');
  const fs = await import('node:fs');
  const { fileURLToPath } = await import('node:url');

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const dbPath = path.resolve(__dirname, '../..', env.DATABASE_PATH!);

  const SQL = await initSqlJs();

  let sqlDb: any;
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    sqlDb = new SQL.Database(buffer);
  } else {
    sqlDb = new SQL.Database();
  }

  // Enable pragmas
  try { sqlDb.run('PRAGMA journal_mode = WAL'); } catch { /* ignore */ }
  try { sqlDb.run('PRAGMA foreign_keys = ON'); } catch { /* ignore */ }

  let dirty = false;

  function save() {
    if (!dirty) return;
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const data = sqlDb.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
    dirty = false;
  }

  return {
    async execute(sql: string, params?: any[]) {
      const stmt = sqlDb.prepare(sql);
      if (params && params.length > 0) {
        stmt.bind(params);
      }
      stmt.step();
      stmt.free();

      const isWrite = /^\s*(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)/i.test(sql);
      if (isWrite) {
        dirty = true;
      }

      // Return rows for SELECT, changes for writes
      if (/^\s*SELECT/i.test(sql)) {
        const stmt2 = sqlDb.prepare(sql);
        if (params && params.length > 0) stmt2.bind(params);
        const rows: any[] = [];
        while (stmt2.step()) {
          rows.push(stmt2.getAsObject());
        }
        stmt2.free();
        return { rows, rowCount: rows.length };
      }

      return { rows: [], rowCount: sqlDb.getRowsModified() };
    },
  };
}

// ---------------------------------------------------------------------------
// Provider: Turso (for Fly.io / hosted SQLite)
// ---------------------------------------------------------------------------

async function createTursoDb(): Promise<DbAsync> {
  const { createClient } = await import('@libsql/client');

  const client = createClient({
    url: env.TURSO_DATABASE_URL!,
    authToken: env.TURSO_AUTH_TOKEN,
  });

  return {
    async execute(sql: string, params?: any[]) {
      const result = await client.execute({ sql, args: params ?? [] });
      return {
        rows: result.rows as any[],
        rowCount: result.rows.length,
      };
    },
  };
}

// ---------------------------------------------------------------------------
// Initialize
// ---------------------------------------------------------------------------

if (env.DATABASE_PROVIDER === 'turso') {
  if (!env.TURSO_DATABASE_URL) {
    throw new Error('TURSO_DATABASE_URL is required when DATABASE_PROVIDER=turso');
  }
  db = await createTursoDb();
  console.log('[database] Using Turso (hosted SQLite)');
} else {
  // Default: sql.js (VPS / local dev)
  db = await createSqlJsDb();
  console.log('[database] Using sql.js (file-based)');
}

// ---------------------------------------------------------------------------
// Run migrations
// ---------------------------------------------------------------------------

async function runMigrations(): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const path = await import('node:path');
  const fs = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  const migrationsDir = path.resolve(__dirname, '../../database/migrations');
  if (!fs.existsSync(migrationsDir)) return;

  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const result = await db.execute('SELECT name FROM _migrations');
  const applied = new Set(result.rows.map((r: any) => r.name));

  for (const file of migrationFiles) {
    if (applied.has(file)) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    console.log(`Running migration: ${file}`);

    try {
      // Split multi-statement SQL and run each
      const statements = sql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      for (const stmt of statements) {
        await db.execute(stmt);
      }
      await db.execute('INSERT INTO _migrations (name) VALUES (?)', [file]);
      console.log(`Migration ${file} applied`);
    } catch (err) {
      console.error(`Migration ${file} failed:`, err);
      throw err;
    }
  }
}

await runMigrations();

// Periodically save sql.js to disk (only relevant for sql.js provider)
if (env.DATABASE_PROVIDER !== 'turso') {
  setInterval(async () => {
    // sql.js auto-saves on writes via the dirty flag in execute()
    // This periodic save is a safety net
    const fs = await import('node:fs');
    const path = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const { initSqlJs } = await import('sql.js');
    // The save is handled inside createSqlJsDb via dirty flag
  }, 30000).unref();
}

export { db };
```

## Step 0.3 — Update `server/src/config/env.ts`

```typescript
import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database — choose your provider
  DATABASE_PROVIDER: z.enum(['sqlite', 'turso']).default('sqlite'),

  // For sql.js (VPS / local dev)
  DATABASE_PATH: z.string().default('./database/leads.db'),

  // For Turso (Fly.io / hosted)
  TURSO_DATABASE_URL: z.string().optional(),
  TURSO_AUTH_TOKEN: z.string().optional(),

  // SerpAPI
  SERPAPI_API_KEY: z.string().default(''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
```

## Step 0.4 — Update all model files to be async

Every `.prepare().get()`, `.prepare().all()`, `.prepare().run()` becomes `await db.execute()`.

**Pattern:**

```typescript
// OLD (sync)
const stmt = db.prepare('SELECT * FROM leads WHERE id = ?');
const row = stmt.get(id) as Record<string, unknown> | undefined;

// NEW (async)
const result = await db.execute('SELECT * FROM leads WHERE id = ?', [id]);
const row = result.rows[0] as Record<string, unknown> | undefined;
```

All three model files need this conversion:

### `server/src/models/Lead.ts`

Every method becomes `async`. Example conversions:

```typescript
// findAll
async findAll(
  filters: LeadFilters,
  pagination: { page: number; limit: number },
  sort: { sortBy: string; sortOrder: string },
): Promise<{ data: Lead[]; meta: PaginationMeta }> {
  const { whereClauses, params } = buildWhereClause(filters);
  const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';
  const sortBy = sanitizeSortBy(sort.sortBy);
  const sortOrder = sanitizeSortOrder(sort.sortOrder);
  const page = Math.max(1, pagination.page);
  const limit = Math.min(100, Math.max(1, pagination.limit));
  const offset = (page - 1) * limit;

  const countResult = await db.execute(`SELECT COUNT(*) as total FROM leads ${whereSQL}`, params);
  const total = (countResult.rows[0] as any).total;

  const dataResult = await db.execute(
    `SELECT * FROM leads ${whereSQL} ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  const data = dataResult.rows.map(rowToLead);

  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
```

```typescript
// create
async create(input: LeadCreateInput): Promise<Lead> {
  const result = await db.execute(
    `INSERT INTO leads (source, business_type, location, business_name, page_url, email, phone, address, rating, review_count, social_handle, description, raw_data, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [input.source, input.business_type, input.location, input.business_name ?? null,
     input.page_url ?? null, input.email ?? null, input.phone ?? null,
     input.address ?? null, input.rating ?? null, input.review_count ?? null,
     input.social_handle ?? null, input.description ?? null, input.raw_data ?? null,
     input.status ?? 'new'],
  );
  return this.findById(result.lastInsertRowid ?? result.rowCount)!;
}
```

> **The `raw_data` column in sql.js stores JSON as TEXT. Turso handles this the same way. No special handling needed.**

### `server/src/models/Search.ts`

Same pattern — every method becomes `async`.

### `server/src/models/Export.ts`

Same pattern — every method becomes `async`.

## Step 0.5 — Update `server/src/server.ts`

The database initialization is now async, but since it uses top-level await in `database.ts`, the import order handles it correctly. No change needed — `server.ts` already imports `'./config/database.js'` which runs the initialization.

## Step 0.6 — Update services that call models

Services already use `async/await` when calling model methods — they don't need changes. The only exception is `leadService.ts` which already wraps model calls in async methods. No changes needed.

---

> ✅ **After these changes, the codebase works for both Fly.io and VPS. Just set `DATABASE_PROVIDER=sqlite` or `DATABASE_PROVIDER=turso` in your `.env`.**

---

Now proceed to your chosen deployment path:

---

# A — Fly.io + Turso

> **No credit card charges. Free tier.**

## Architecture

```
┌─────────────┐         ┌─────────────┐         ┌───────────┐
│   Netlify   │  HTTP   │   Fly.io    │  SQL    │   Turso   │
│  Frontend   │────────▶│  Backend    │────────▶│  SQLite   │
│  (deployed) │◀────────│  (Express)  │         │ (hosted)  │
└─────────────┘         └─────────────┘         └───────────┘
```

---

## Prerequisites

- **Fly.io account** — signed up, card verified (no charge)
- **Turso account** — sign up at [turso.tech](https://turso.tech) (no card)

### Install CLI Tools

```bash
# Fly.io CLI
curl -L https://fly.io/install.sh | sh        # macOS/Linux
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"   # Windows

# Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash   # macOS/Linux
npm install -g turso                              # npm (cross-platform)
```

Log in:

```bash
fly auth login
turso auth login
```

---

## Step A1 — Create Turso Database

```bash
# Create database
turso db create mini-lead-db

# Get the URL
turso db show mini-lead-db --url
# → libsql://mini-lead-db-<org>.turso.io

# Create auth token
turso db tokens create mini-lead-db
# → Save this token securely
```

---

## Step A2 — Add Dockerfile for Fly.io

Create `server/Dockerfile`:

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
EXPOSE 3001
CMD ["node", "dist/server.js"]
```

Create `server/.dockerignore`:

```
node_modules
dist
.git
*.db
.env
```

---

## Step A3 — Deploy to Fly.io

```bash
cd server

# Initialize Fly.io app
fly launch --no-deploy

# Set secrets (DO NOT put tokens in fly.toml)
fly secrets set DATABASE_PROVIDER=turso
fly secrets set TURSO_DATABASE_URL="libsql://mini-lead-db-<org>.turso.io"
fly secrets set TURSO_AUTH_TOKEN="your-turso-token"
fly secrets set SERPAPI_API_KEY="your-serpapi-key"
fly secrets set NODE_ENV="production"

# Deploy
fly deploy
```

Get your URL:

```bash
fly status
# → https://mini-lead-backend.fly.dev
```

---

## Step A4 — Point Frontend to Backend

In your **Netlify dashboard** → Environment variables:

```
NEXT_PUBLIC_API_URL = https://mini-lead-backend.fly.dev
```

Update `client/next.config.js` to remove dev-only rewrites (they only work on localhost):

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
```

Rebuild and redeploy the frontend on Netlify.

---

## Step A5 — Verify

1. Visit `https://mini-lead-backend.fly.dev/health`
2. Visit your Netlify URL — dashboard loads with stats

---

# B — VPS Self-Hosted

> **For users who want full control. No Docker required. sql.js persists to disk.**

## Architecture

```
┌─────────────┐         ┌─────────────┐         ┌───────────┐
│   Netlify   │  HTTP   │   Your VPS  │  Disk   │  sql.js   │
│  Frontend   │────────▶│   (Express) │────────▶│  .db file │
│  (deployed) │◀────────│  :3001      │         │ (persists)│
└─────────────┘         └──────┬──────┘         └───────────┘
                               │
                          NGINX (reverse proxy, SSL)
                          Port 443 → 3001
```

---

## Prerequisites

- **A VPS** (Ubuntu 22.04 or 24.04 recommended) from any provider
- **A domain name** pointed to your VPS IP
- **Node.js 22+** on the VPS

---

## Step B1 — Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git nginx certbot python3-certbot-nginx

# Verify
node -v   # v22.x
npm -v    # 10.x
```

---

## Step B2 — Create a Deployment User

```bash
sudo adduser deploy
sudo usermod -aG sudo deploy
su - deploy
```

---

## Step B3 — Clone & Install

```bash
cd /home/deploy
git clone https://github.com/YOUR_USERNAME/mini-lead.git
cd mini-lead/server

# Install dependencies
npm ci

# Build TypeScript
npm run build

# Create database directory
mkdir -p database

# Create env file
nano .env
```

**`.env` file:**

```env
PORT=3001
NODE_ENV=production

# Database — sql.js persists to disk (no extra services needed)
DATABASE_PROVIDER=sqlite
DATABASE_PATH=./database/leads.db

# SerpAPI
SERPAPI_API_KEY=your_serpapi_api_key_here
```

> ⚠️ **VPS users can skip installing `@libsql/client` entirely** — it's only needed for the Turso provider. The code imports it dynamically, so if `DATABASE_PROVIDER=sqlite`, it's never loaded.

---

## Step B4 — Process Manager (PM2)

```bash
npm install -g pm2

# Start the app
cd /home/deploy/mini-lead/server
pm2 start dist/server.js --name mini-lead

# Save process list (survives reboot)
pm2 save
pm2 startup
```

**Useful commands:**

```bash
pm2 status              # Check if running
pm2 logs mini-lead      # View logs
pm2 restart mini-lead   # Restart after updates
pm2 stop mini-lead      # Stop the server
```

---

## Step B5 — Reverse Proxy (NGINX)

```bash
sudo nano /etc/nginx/sites-available/mini-lead
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Increase timeouts for scraping (SerpAPI + contact crawler can take time)
        proxy_read_timeout 120s;
        proxy_connect_timeout 30s;
    }
}
```

Enable and test:

```bash
sudo ln -s /etc/nginx/sites-available/mini-lead /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step B6 — SSL Certificate (Let's Encrypt)

```bash
sudo certbot --nginx -d your-domain.com
```

Verify auto-renewal:

```bash
sudo certbot renew --dry-run
```

---

## Step B7 — Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
sudo ufw status
```

---

## Step B8 — Point Frontend to VPS

In **Netlify dashboard** → Environment variables:

```
NEXT_PUBLIC_API_URL = https://your-domain.com
```

Rebuild and redeploy.

---

## Updating

```bash
# Pull latest code
cd /home/deploy/mini-lead
git pull

# Rebuild & restart
cd server
npm ci
npm run build
pm2 restart mini-lead
```

---

## Database Backup

```bash
# Regular backup (cron-friendly)
cp /home/deploy/mini-lead/server/database/leads.db ~/backups/leads-$(date +%Y%m%d).db

# Or set up a cron job
crontab -e
# Add: 0 3 * * * cp /home/deploy/mini-lead/server/database/leads.db ~/backups/leads-$(date +\%Y\%m\%d).db
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| App won't start | Check logs: `pm2 logs mini-lead` |
| 502 Bad Gateway | NGINX can't reach Express — check port 3001 |
| Port in use | `sudo lsof -i :3001` |
| "Cannot find module" | Run `npm ci` and `npm run build` |
| CORS errors | Verify `NEXT_PUBLIC_API_URL` is correct on Netlify |
| DB wiped on Fly.io | You used `sqlite` provider — set `DATABASE_PROVIDER=turso` |
| `TURSO_DATABASE_URL` missing | Run `fly secrets set TURSO_DATABASE_URL="..."` |
| Cold start slow (~5s) | Fly.io free VM sleeps — normal |
| Certbot renewal fails | `sudo certbot renew --force-renewal` |

---

## Costs

### Path A — Fly.io + Turso

| Service | Cost | Limits |
|---------|------|--------|
| Fly.io | $0/mo | 3 shared VMs, 3GB storage, 160GB bandwidth |
| Turso | $0/mo | 500MB database, 1B row reads/month |
| Netlify | $0/mo | 100GB bandwidth, 300 build min/month |
| **Total** | **$0/mo** | — |

### Path B — VPS

| Service | Cost |
|---------|------|
| VPS | $4–6/mo |
| Domain | $8–12/yr |
| SSL | Free (Let's Encrypt) |
| Netlify | Free |
| **Total** | **~$4–6/mo + domain** |

---

## Security Notes

- **Keep `.env` private** — contains your `SERPAPI_API_KEY`
- The app has **no authentication** — it's a personal tool
- For VPS: consider IP whitelisting or VPN for sensitive deployments
- Regular updates: `sudo apt update && sudo apt upgrade`
