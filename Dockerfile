FROM oven/bun:1-alpine AS base
WORKDIR /app
RUN apk add --no-cache nodejs npm

# Install all workspace deps
FROM base AS deps
COPY package.json bun.lock bunfig.toml ./
COPY packages/server/package.json ./packages/server/package.json
COPY packages/web/package.json ./packages/web/package.json
COPY packages/mcp/package.json ./packages/mcp/package.json
RUN bun install --frozen-lockfile

# Build the web SPA
FROM deps AS builder
COPY packages/server ./packages/server
COPY packages/web ./packages/web
RUN bun run --cwd packages/web build

# Production image — same alpine base as deps so musl binaries are compatible
FROM oven/bun:1-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV STATIC_DIR=../web/build/client

COPY package.json bun.lock ./
COPY --from=deps /app/node_modules ./node_modules
COPY packages/server ./packages/server
COPY --from=builder /app/packages/web/build/client ./packages/web/build/client

EXPOSE 3000


CMD ["sh", "-c", "bun packages/server/src/db/migrate.ts && bun run --cwd packages/server start"]
