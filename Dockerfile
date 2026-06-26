FROM oven/bun:1 AS base
WORKDIR /app

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
RUN cd packages/web && bun run build

# Production image
FROM oven/bun:1-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV STATIC_DIR=packages/web/dist/client

COPY --from=deps /app/node_modules ./node_modules
COPY packages/server ./packages/server
COPY --from=builder /app/packages/web/dist ./packages/web/dist

EXPOSE 3000

# Run migrations then start the server
CMD ["sh", "-c", "cd packages/server && bunx drizzle-kit migrate && cd /app && bun packages/server/src/index.ts"]
