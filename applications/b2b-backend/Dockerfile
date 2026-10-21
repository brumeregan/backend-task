# syntax=docker/dockerfile:1
# Build from the repo root: docker build -f applications/b2b-backend/Dockerfile .

FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /repo

FROM base AS build
# Manifests first so the dependency layer is cached until they change.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY applications/b2b-backend/package.json applications/b2b-backend/
COPY applications/b2b-web/package.json applications/b2b-web/
COPY libraries/b2b-app-schemas/package.json libraries/b2b-app-schemas/
# The root project (".") brings the shared toolchain (typescript for the schemas' d.ts build).
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter . --filter "@qred/b2b-backend..."

COPY libraries/b2b-app-schemas libraries/b2b-app-schemas
COPY applications/b2b-backend applications/b2b-backend
RUN pnpm --filter "@qred/b2b-backend..." build
# Self-contained folder: dist + production node_modules (with the built schemas package).
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm --filter @qred/b2b-backend deploy --prod /prod/backend

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /prod/backend .
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:' + (process.env.PORT || 3000) + '/ready').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"
# The same image runs DB tasks: node dist/cli.js migrate seed
CMD ["node", "dist/main.js"]
