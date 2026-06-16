# Deployment Guide

One codebase, two deployment paths. Both serve the **same architecture**: a single process that serves both the Next.js frontend (static export) and the Express API on the same port.

| Path | Host | Database | Best for |
|------|------|----------|----------|
| [**A — Fly.io + Turso**](#a--flyio--turso) | Fly.io | Turso (hosted SQLite) | You (free tier) |
| [**B — VPS Self-Hosted**](#b--vps-self-hosted) | Your own server | sql.js (file-based) | Full control |

## Architecture

```
User ──▶ mini-lead.fly.dev (or your domain)
              │
         Express (port 8080)
          ├── Serves / (static Next.js export)
          └── Serves /api/* (REST API)
                    │
               SQLite
          (Turso or sql.js)
```

---

# A — Fly.io + Turso

> **Free tier. No credit card charges.**

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

## Step A2 — Deploy to Fly.io

```bash
# From the project root (where Dockerfile lives)
fly launch --no-deploy

# Set secrets (DO NOT put tokens in fly.toml)
fly secrets set NODE_ENV=production
fly secrets set DATABASE_PROVIDER=turso
fly secrets set TURSO_DATABASE_URL="libsql://mini-lead-db-<org>.turso.io"
fly secrets set TURSO_AUTH_TOKEN="your-turso-token"
fly secrets set SERPAPI_API_KEY="your-serpapi-key"

# Deploy
fly deploy
```

Your app is live at `https://mini-lead.fly.dev`.

---

## Step A3 — Useful Commands

```bash
fly logs -a mini-lead       # View live logs
fly status                  # Check app status
fly secrets list            # List all secrets
fly deploy                  # Redeploy after code changes
```

---

# B — VPS Self-Hosted

> **For users who want full control. No Docker required. sql.js persists to disk.**

## Prerequisites

- **A VPS** (Ubuntu 22.04 or 24.04 recommended)
- **A domain name** pointed to your VPS IP (optional)
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

## Step B2 — Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/mini-lead.git
cd mini-lead

# Install all workspace dependencies
npm ci

# Build both client (static export) and server (TypeScript)
npm run build

# Create database directory
mkdir -p server/database
```

---

## Step B3 — Environment

Create `server/.env`:

```env
PORT=8080
NODE_ENV=production

# Database — sql.js persists to disk (no extra services needed)
DATABASE_PROVIDER=sqlite
DATABASE_PATH=./database/leads.db

# SerpAPI
SERPAPI_API_KEY=your_serpapi_api_key_here
```

---

## Step B4 — Process Manager (PM2)

```bash
npm install -g pm2

# Start the app (cd to server/ so Node detects "type": "module")
cd server
pm2 start dist/server.js --name mini-lead
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
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
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

## Updating

```bash
cd mini-lead
git pull
npm ci
npm run build
rm -rf client/out/ server/dist/  # clean build artifacts (optional)
pm2 restart mini-lead
```

---

## Database Backup (VPS only)

```bash
# Single backup
cp server/database/leads.db ~/backups/leads-$(date +%Y%m%d).db

# Automatic daily backup (cron)
crontab -e
# Add: 0 3 * * * cp /path/to/mini-lead/server/database/leads.db ~/backups/leads-$(date +\%Y\%m\%d).db
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| 502 Bad Gateway | Fly.io: check `fly logs`. VPS: is Express running on port 8080? |
| "no such table" | Migrations failed. Check that `server/database/migrations/` exists in your deployment |
| Empty dashboard | Run a scrape first — `POST /api/scrape/google_maps` |
| CORS errors | Only happens in dev with separate origins. In production everything is same-origin |
| Turso connection fails | Verify `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` secrets |
| App won't start | `cd server && node dist/server.js` to see the exact error |
| Port in use | `sudo lsof -i :8080` to find what's using it |

---

## Costs

### Fly.io + Turso

| Service | Cost | Limits |
|---------|------|--------|
| Fly.io | $0/mo | 3 shared VMs, 3GB storage, 160GB bandwidth |
| Turso | $0/mo | 500MB database, 1B row reads/month |
| **Total** | **$0/mo** | |

### VPS

| Service | Cost |
|---------|------|
| VPS | $4–6/mo |
| Domain | $8–12/yr |
| SSL | Free (Let's Encrypt) |
| **Total** | **~$4–6/mo + domain** |

---

## Security Notes

- **Keep `.env` private** — contains your `SERPAPI_API_KEY`
- The app has **no authentication** — it's a personal tool
- For VPS: consider IP whitelisting or VPN for sensitive deployments
