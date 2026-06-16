FROM node:22-alpine AS build
WORKDIR /app

# Copy all package manifests for npm workspaces
COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install all workspace dependencies (hoisted to root node_modules)
RUN npm ci

# Copy source code
COPY . .

# Build both client (static export) and server (TypeScript)
RUN npm run build

# ─── Production image ─────────────────────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app

# Server compiled output
COPY --from=build /app/server/dist ./server/dist

# Client static export (Next.js output: 'export')
COPY --from=build /app/client/out ./client/out

# Root node_modules (hoisted workspace deps — enough for server to run)
COPY --from=build /app/node_modules ./node_modules

# Copy server package.json so Node detects "type": "module"
COPY server/package.json ./server/package.json

EXPOSE 3001

# Run from server/ dir so Node uses server/package.json (type: module)
CMD cd /app/server && node dist/server.js
