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

# Package manifests (for process info, not strictly required)
COPY package.json ./package.json

EXPOSE 3001

CMD ["node", "server/dist/server.js"]
