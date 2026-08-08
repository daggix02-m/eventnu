# ADR-0002: Decouple admin-app from the web app's Convex codegen

**Status:** Accepted (executed 2026-08-08)
**Date:** 2026-08-08

## Context

`admin-app` imports the shared backend via a relative path into the sibling app:
`../../../web/convex/_generated/api` (17 server-action files + 2 client components,
enabled by `turbopack.root` in `admin-app/next.config.ts`). Consequences:

- Admin type-checks against the **web app's** codegen; `npx convex codegen` in `web/` is a
  prerequisite for the admin build.
- The mismatch is papered over with 165 `any` casts (root cause of most type debt).
- `admin-app/convex/_generated` contains only decorative stubs.

## Options

### Option A — Lift Convex into a shared package (recommended)

Move `web/convex` to a repo-root shared location (e.g., npm workspaces with a
`packages/convex` package, or a root-level `convex/` directory) consumed by both apps.
Single codegen, single source of truth, no cross-package relative imports.

- Pros: removes the root cause of the `any` casts; one canonical API surface; both apps
  generated from the same schema.
- Cons: larger structural change; touches `web/` build config, both `tsconfig.json`s,
  `next.config.ts` `turbopack.root`, and the Convex deployment workflow.

### Option B — Keep the import, type the boundary once

Keep `admin-app` → `web/convex/_generated/api` but export a single typed wrapper module
(e.g., `admin-app/src/lib/convex.ts`) that all actions/clients import, and eliminate
`as any` at the boundary.

- Pros: small, low-risk, fast.
- Cons: leaves the fragile cross-package dependency in place; codegen coupling persists.

## Decision

**Accepted — Option A.** The backend lives at `packages/convex` (npm workspace
`@eventnu/convex`), deployed from there; both apps import `@eventnu/convex/_generated/api`.
Executed 2026-08-08.

## Consequences

- Option A enables target "0 `any` in `src/lib` and `src/app`".
- Convex CLI runs from `packages/convex` (`npm -w @eventnu/convex run dev|deploy|codegen`);
  its `.env.local` must hold the deployment env (copied from `web/.env.local` on setup).
- `@eventnu/convex/_generated/*` stays **git-tracked** so both apps type-check in CI without
  a Convex server; `npx convex codegen` in the package regenerates it byte-identically.
- The `turbopack.root`-based cross-app import is no longer needed for Convex; the shared
  backend is a proper workspace dependency.
