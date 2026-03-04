# Stage 1: install + build
FROM oven/bun:1 AS build
WORKDIR /app

# Copy manifests first for layer caching
COPY package.json bun.lock ./
COPY packages/shared/package.json packages/shared/
COPY packages/client/package.json packages/client/
COPY packages/server/package.json packages/server/

RUN bun install --frozen-lockfile

# Copy source and build
COPY . .
RUN bun run build

# Stage 2: production runtime
FROM oven/bun:1
WORKDIR /app

# Copy built server artifact
COPY --from=build /app/packages/server/dist ./dist

# Copy built client assets (served as static files in production)
COPY --from=build /app/packages/client/dist ./client-dist

# Copy node_modules (includes all runtime deps: hono, socket.io, @anthropic-ai/sdk, etc.)
COPY --from=build /app/node_modules ./node_modules

# Copy shared package (workspace dep referenced at runtime)
COPY --from=build /app/packages/shared ./packages/shared

# Copy package.json so bun can resolve the workspace
COPY --from=build /app/package.json ./package.json

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["bun", "run", "dist/index.js"]
