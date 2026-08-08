# ADR-0002: Decouple admin-app from the web app's Convex codegen

**Status:** Proposed (to be confirmed when Phase 2.1 executes)
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

**Pending.** Recommended: **Option A**, executed after Phase 1 assessment and before the
type-hygiene work in Phase 2, protected by the CI added in Phase 3.

## Consequences

- Option A enables target "0 `any` in `src/lib` and `src/app`".
- Either option must keep the `turbopack.root`-based cross-app imports working for
  non-Convex shared code until fully resolved.
