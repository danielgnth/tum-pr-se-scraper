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


# Production image
FROM oven/bun:1-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV STATIC_DIR=packages/web/build/client

COPY --from=deps /app/node_modules ./node_modules
COPY packages/server ./packages/server
COPY --from=builder /app/packages/web/build/client ./packages/web/build/client

EXPOSE 3000

# Run migrations then start the server
CMD ["sh", "-c", "bun /app/packages/server/src/db/migrate.ts && bun /app/packages/server/src/index.ts"]
