# Event Nu Admin

Next.js 16 admin dashboard for the Event Nu platform — the posting and management
surface used by the internal content team. It is one workspace in the EventNu
monorepo; see `docs/ARCHITECTURE.md` for how it couples to the `web` consumer app and
the shared Convex backend.

## Prerequisites

- Node 22+, npm (repo is a single npm workspaces install).
- A Convex account + the shared backend deployment (see below).

### The cross-app Convex backend

Admin-app has **no Convex deployment of its own**. It is a pure consumer of the shared
backend package `@eventnu/convex` (ADR-0002), which lives at `packages/convex/` and is
also consumed by the `web` app. Both apps type-check against the same git-tracked
`@eventnu/convex/_generated/*`.

- Always import Convex code from `@eventnu/convex/_generated/*` — never hand-write
  function paths or `any` in place of generated types.
- `_generated/**` is git-tracked and committed. Regenerate after backend changes with
  `npm run convex:codegen` and commit the diff. Do not edit generated files.

## Setup

```bash
# 1. Install everything (workspaces: admin-app, web, packages/*)
npm install

# 2. Create .env.local with the keys below (see Environment variables)
# 3. Backend must be reachable for full functionality; run Convex in a terminal
npm run convex:dev           # runs `convex dev` in packages/convex
```

## Environment variables

`.env.local` (dev) / `.env.production` (build). There is no committed `.env.example` —
the key set is small and stable:

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | yes | Convex client URL; read by `ConvexAuthClientProvider` for the auth provider. |
| `CONVEX_DEPLOYMENT` | yes (CI typegen) | Deployment name for the Convex CLI (`codegen`/`deploy`); points admin at the shared backend deployment. |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | build | The `*.convex.site` site/action URL; referenced by the CSP (`connect-src`, `img-src`). |
| `NEXT_PUBLIC_ADMIN_URL` | build | Public origin of this admin app; used by CI builds for cross-app links. |

The `web` app additionally uses `NEXT_PUBLIC_SITE_URL` (consumer-site origin) — not
required here.

## Scripts

Run from `admin-app/` or as a workspace (`npm -w admin-app run <script>`).

| Script | What it does |
|---|---|
| `npm run dev` | `next dev` (Turbopack) |
| `npm run build` | `next build` |
| `npm run start` | `next start` (production server) |
| `npm run lint` | ESLint (`no-explicit-any` and `no-unused-vars` are errors) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run knip` | dead-code / unused-dep detection |
| `npm test` | Vitest (logic + component tests) |
| `npm run test:coverage` | Vitest with the v8 coverage gate (statements ≥85%, branches ≥80%) |

Repo-level conveniences: `npm run lint`, `npm run typecheck`, `npm run format:check`,
`npm test` run the same gates across every workspace.

## Conventions

Read `admin-app/AGENTS.md` (Convex rules) and `docs/CONVENTIONS.md` (repo-wide
conventions: code style, server/client boundary, data fetching). `REFACTORING.md` is
the roadmap + status tracker.

### Data fetching

Admin list pages read through TanStack Query hooks in `src/lib/api/*`, seeded with
server `initialData`; mutations live in `src/lib/actions/*` and call
`invalidateQueries` + keep `revalidatePath` for the SSR seed. Do **not** add
`convex/react` `useQuery` in admin-app — only `@convex-dev/auth/react` for auth.

## Testing

Vitest + Testing Library + jsdom. Pure logic (`src/lib/*.ts`) is unit-tested; shared
primitives (data table, dialogs, badges) have component tests. The coverage gate is a
pure-logic statement gate (85% statements / 80% branches over `src/lib/*.ts`), not a
global threshold.
