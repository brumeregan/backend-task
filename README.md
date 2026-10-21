# case study

Backend (Node.js + TypeScript) for the B2B mobile card view. The screen shows a company switcher,
the invoice due, the remaining spend against the set limit, card activation and freezing, and the
latest transactions. The repo also contains the shared API contract and a minimal Next.js page
that uses it.


## Run with Docker

Requires Docker with Compose v2.

```bash
docker compose up --build
```
- Starts PostgreSQL, runs the migrations and the seed (a one-off `migrate` container), then the
  API on http://localhost:3000 and the page on http://localhost:3001.
- The data lives in the `pgdata` volume and survives restarts. Seeding is skipped once data exists.

One-off database tasks run in the backend image (`migrate`, `migrate:down`, `seed`, `reset`):
```bash
docker compose run --rm migrate node dist/cli.js reset
```

Stop everything and delete the database:
```bash
docker compose down -v
```

Images can also be built on their own; the build context is the repo root:
`docker build -f applications/b2b-backend/Dockerfile .` (same for `b2b-web`).

## Run it on the host

Requires Node 22+, pnpm 9 and a PostgreSQL. The quickest way is the compose one
(`POSTGRES_PORT` changes the host port, default 5432):

```bash
docker compose up -d postgres
```

```bash
pnpm install
```

```bash
pnpm build
```

Copy [applications/b2b-backend/.env.example](applications/b2b-backend/.env.example) to
`applications/b2b-backend/.env` (the defaults match the compose database), then create and seed the
schema:

```bash
pnpm db:migrate && pnpm db:seed
```
`pnpm db:reset` drops all tables and recreates and re-seeds them.

```bash
pnpm dev:backend
```
- The API runs on http://localhost:3000. `GET /health` is liveness; `GET /ready` also checks
  the database.
- Every API call, including the isolation and error cases, is in [api.http](api.http)
  (VS Code REST Client). The mock tokens are already in the file.

```bash
pnpm dev:web
```
The page runs on http://localhost:3001. Use **Signed in as** to switch between Anna, Erik and Sara.

### Seeded users
Their bearer tokens are hardcoded mock JWTs in
[mock-auth.ts](libraries/b2b-app-schemas/src/mock-auth.ts) (also pasted into `api.http`). They work while
`JWT_SECRET` is not set.

| User | Companies | What to show |
|---|---|---|
| Anna | Company AB, Nordic Trade AB | company switcher; her card is **inactive** (activate it) |
| Erik | Company AB | an active card and a frozen card (freeze/unfreeze) |
| Sara | Nordic Trade AB | isolation: every Company AB resource returns 404 for her |
