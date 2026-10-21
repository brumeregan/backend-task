# syntax=docker/dockerfile:1
# Build from the repo root: docker build -f applications/b2b-web/Dockerfile .

FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY applications/b2b-backend/package.json applications/b2b-backend/
COPY applications/b2b-web/package.json applications/b2b-web/
COPY libraries/b2b-app-schemas/package.json libraries/b2b-app-schemas/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter . --filter "@qred/b2b-web..."

COPY libraries/b2b-app-schemas libraries/b2b-app-schemas
COPY applications/b2b-web applications/b2b-web
# Inlined into the browser bundle at build time, so it must be reachable from the browser.
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
RUN pnpm --filter "@qred/b2b-web..." build

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
WORKDIR /app
# Standalone output mirrors the monorepo layout (outputFileTracingRoot is the repo root).
COPY --from=build --chown=node:node /repo/applications/b2b-web/.next/standalone ./
COPY --from=build --chown=node:node /repo/applications/b2b-web/.next/static ./applications/b2b-web/.next/static
USER node
EXPOSE 3001
CMD ["node", "applications/b2b-web/server.js"]
