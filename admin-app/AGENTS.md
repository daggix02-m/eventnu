<!-- convex-ai-start -->

This project consumes a [Convex](https://convex.dev) backend shared with the web
app (ADR-0002). Admin-app has **no Convex deployment of its own** — it imports the
backend's generated API and type-checks against it.

When working on Convex code or the generated API, **always read
`packages/convex/convex/_generated/ai/guidelines.md` first** for important guidelines
on how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->

## Convex rules (enforced by code review)

The backend lives in `packages/convex/`. These rules apply when you touch it or
anything that consumes it (server actions, `src/lib/api/*`, generated types).

- **Cross-app import**: import the generated API and types from
  `@eventnu/convex/_generated/*` (`api`, `internal`, `dataModel`, `server`) — never
  hand-write function paths or `any` in place of generated types.
- **Codegen**: `_generated/**` is git-tracked. Regenerate with
  `npm -w @eventnu/convex run codegen` and commit the diff. Do not edit generated files.
- **Validators on every arg**: all Convex query/mutation/action args are validated
  (`v.string()`, `v.id(...)`, `.partial()`, …). No unvalidated `args`.
- **No unbounded arrays**: never store unbounded lists as a document array field
  (1 MB doc limit, full-document rewrites). Use a separate table with a foreign key.
- **Compound index naming**: `by_<field1>_and_<field2>`; index fields are queried in
  the order defined (see `packages/convex/convex/schema.ts`).
- **Pagination, not `.take(1000)`**: list queries use `.paginate()` +
  `paginationResultValidator`. No `.take(N)` + JS offset, no `.collect()`.
- **`helpers.requireAdmin`, not hand-rolled checks**: admin gating goes through
  `convex/helpers.ts`; never copy a `user.isAdmin` check inline.
- **Shared primitives**: `patchDefined`, slugify, moderation-log/notification inserts,
  image batch insert live in `convex/helpers.ts` / `convex/constants.ts` — extract,
  don't duplicate.
- **Admin-app data fetching**: list pages read through `src/lib/api/*` TanStack Query
  hooks seeded with server `initialData`; mutations `invalidateQueries`. Do not add
  `convex/react` `useQuery` in admin-app (only `@convex-dev/auth/react` for auth).
- **HTTP endpoints & webhooks**: `convex/http.ts` only; treat `req.json()` as
  `unknown` and validate before use.

Read `docs/CONVENTIONS.md` for the full repo conventions and `REFACTORING.md` for
the roadmap. Both apps type-check against the same git-tracked `_generated`.

## Admin-app conventions

- **Data fetching**: list pages read through `src/lib/api/*` TanStack Query hooks
  seeded with server `initialData` (`staleTime: 30_000`); mutations are server actions
  in `src/lib/actions/*` that `invalidateQueries` + `revalidatePath`. Never add
  `convex/react` `useQuery` (auth via `@convex-dev/auth/react` only).
- **Pure logic lives in `src/lib/` top-level modules** (`errors`, `format`, `mappers`,
  `pagination`, `motion`, `utils`) — no React, no server imports. Keep them covered by
  the Vitest statement gate (85% stmts / 80% branches).
- **Errors** go through `src/lib/errors.ts` `getErrorMessage`; no `console.log`/
  `console.error` in production paths, no silent `catch → null` swallows.
- **Design system**: `src/components/ui` is the single primitive layer; feature
  components live in `src/components/<domain>/`; shared list primitives (DataTable,
  StatusBadge, Pagination, ConfirmDialog) in `src/components/list/`. No ad-hoc hex
  values — use the `@theme` tokens in `src/app/globals.css` (see `docs/DESIGN.md`).
- **Server/client boundary**: files using hooks, event handlers, or browser APIs get
  `'use client'`; pass serializable props across the boundary, never Convex documents
  (use `lib/mappers.ts` on the server first).
