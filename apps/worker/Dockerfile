# syntax=docker/dockerfile:1

FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/worker/package.json apps/worker/

FROM base AS builder
RUN pnpm install --frozen-lockfile
COPY packages/shared/ packages/shared/
COPY apps/worker/ apps/worker/
RUN pnpm --filter @gallery/shared build && pnpm --filter @gallery/worker build

FROM base AS runner
ENV NODE_ENV=production
# sharp 0.33 ships prebuilt libvips binaries — no apt packages needed
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/apps/worker/dist apps/worker/dist
RUN groupadd -r worker && useradd -r -g worker worker
USER worker
WORKDIR /app/apps/worker
CMD ["node", "dist/index.js"]
