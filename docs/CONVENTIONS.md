# Conventions — EventNu

Coding, structure, and workflow conventions for the EventNu monorepo. Applies to
`admin-app/`, `web/`, and `packages/convex/`. See `REFACTORING.md` for the roadmap,
`AUDIT.md` for the technical/security audit, `PRODUCT.md` for product truth,
`ARCHITECTURE.md` for the module map, `DESIGN.md` for the admin-app design spec,
`CONTRIBUTING.md` for PR/commit workflow, and `docs/decisions/` for ADRs.

## Repo layout

| Path | Package | Role |
|---|---|---|
| `admin-app/` | `admin-app` | Next.js 16 admin dashboard (internal content team) |
| `web/` | `web` | Next.js 16 consumer site (Addis city guide) |
| `packages/convex/` | `@eventnu/convex` | Shared Convex backend, consumed by both apps (ADR-0002) |

Root `package.json` declares the workspaces and the repo-wide `format` / `format:check`
(Prettier) scripts. Root also hoists `@types/react` / `@types/react-dom` and pins the
Vercel Linux-only native deps (`@tailwindcss/oxide-linux-x64-gnu`,
`lightningcss-linux-x64-gnu`) in `web/optionalDependencies`.

## Quality gates

Every package and change must pass all of:

1. `lint` — ESLint (`eslint .`)
2. `typecheck` — `tsc --noEmit`
3. `knip` — dead-code / unused-dep detection
4. `format:check` — Prettier (`--check` from repo root)
5. `test` — Vitest (`admin-app` logic + components, `packages/convex` helpers)
6. `build` — `next build` (both apps)

Run from the package directory (`npm run <gate>`) or workspace (`npm -w <pkg> run <gate>`).
All six must be green before merge; CI enforces them on every PR.

### Tests

- Vitest + Testing Library + jsdom (`admin-app`), plain Vitest (`packages/convex`).
- Pure logic (`admin-app/src/lib/*.ts`) is unit-tested, including mappers, date
  formatting, error messages, pagination, and utils.
- Coverage gate in `admin-app` covers the pure-logic layer only: ≥85% statements,
  ≥80% branches (`npm run test:coverage`). Not a global threshold — presentational
  components are exercised via integration tests instead.
- Server/Convex auth flows are deferred until Convex's in-memory test runner is wired
  (`packages/convex`, see `REFACTORING.md` Phase 4.2).

### knip

- Configs: `admin-app/knip.jsonc`, `web/knip.jsonc`, `packages/convex/knip.jsonc`.
- `components/ui/**` (admin-app `src/components/ui`, web `components/ui`) is a **public
  design-system API** and is intentionally ignored — its primitives are exported for
  consumers, so their "unused exports" are expected. Dependencies consumed exclusively by
  ignored files are listed under `ignoreDependencies` with a comment (e.g.
  `@radix-ui/react-separator` in web).
- Export only what other files import. Module-internal helpers stay un-exported
  (`FILTER_STYLES`, `ScrollTrigger`, in-file-only components).

## Code style

Formatted by Prettier (root `.prettierrc`): no semicolons, single quotes, `printWidth: 100`,
trailing commas on multiline. Do not hand-format; run `npm run format`.

- TypeScript strict; prefer explicit types over `as any`. Removing `any` at API boundaries
  is a standing goal (0 `any` in `admin-app/src/lib` and `src/app`).
- No `console.log` in production paths; errors flow through the error helpers
  (`admin-app/src/lib/errors.ts` `getErrorMessage`).
- Component files: kebab-case filenames, one component per file, function declarations
  (no `export default` for components). Lucide icons for icons.
- Tailwind v4 `@theme` tokens in each app's `globals.css`; no ad-hoc hex values in JSX.

## Server / client boundary

- Convex queries/mutations are server code; server actions live in `lib/actions/`.
- Server-only logic that touches Convex or secrets must not be imported into client
  components. `web/lib/api/` modules that run server-side are guarded with the
  `server-only` package.
- Files using hooks, event handlers, or browser APIs get `'use client'`.
- Keep the boundary explicit: pass serializable props across it, never Convex documents.

## Data fetching

- **Consumer web app** uses `convex/react` hooks (`useQuery`, `useMutation`) plus
  `@convex-dev/auth/react` for auth; server-only API modules are guarded with
  `server-only`.
- **Admin app** list pages read through TanStack Query hooks in
  `admin-app/src/lib/api/*` (one module per resource), seeded with server
  `initialData` and a consistent `staleTime: 30_000`. Mutations live in server actions
  (`admin-app/src/lib/actions/*`), call `invalidateQueries`, and keep `revalidatePath`
  for the SSR seed. Do **not** add `convex/react` `useQuery` in admin-app — only
  `@convex-dev/auth/react` for auth.
- List search inputs use a ~400ms debounce.

### Admin-app module naming (`admin-app/src/lib`)

- `actions/*` — server actions that call Convex (mutations + list reads).
- `api/*` — TanStack Query hook modules, one per resource, mirroring `actions/*`.
- Top level — pure, framework-free helpers (`errors.ts`, `format.ts`, `mappers.ts`,
  `pagination.ts`, `motion.ts`, `utils.ts`). These are unit-tested and covered by the
  statement gate.
- Errors flow through `errors.ts` `getErrorMessage`; never `console.log` in prod paths.

## Components

- Feature folders per domain: `components/events`, `components/categories`, etc.
- A domain folder may subdivide when it mixes concerns: `components/events/detail/`
  vs `components/events/cards/` (web), `components/events/event-form/` (admin-app).
  Avoid singular/plural pairs that blur meaning (`organizer-dashboard/` vs
  `organizers/` in web).
- Cross-cutting categories:
  - `components/ui` — the single design-system primitive layer (buttons, dialogs, inputs)
  - `components/providers` — context / provider wiring
  - `components/layout` — shell, nav, footer
  - `components/shared` (admin-app) — genuinely shared pieces only (skeletons, StatCard);
    page layout and domain-specific widgets live in their owning folders
- One design system only: `components/ui`. Do not introduce a second one.

## Convex backend (`packages/convex/convex`)

Read `packages/convex/convex/_generated/ai/guidelines.md` before touching Convex code —
it overrides training-data assumptions.

- New or changed functions and schema are only visible to running apps after they are
  **pushed to the deployment**. `npx convex codegen` regenerates local type bindings only —
  it does not deploy. Run `npm -w @eventnu/convex run dev` (`convex dev`, targets the
  `dev:` deployment in `.env.local`) and keep it running, or run a one-shot sync with a
  short timeout to push functions + schema.

- Validators on every query/mutation arg; `Doc` types from `_generated/dataModel`.
- Compound index names use `by_<field1>_and_<field2>` (`schema.ts`).
- Use `.paginate()` / `paginationResultValidator` for list queries; never `.take(1000)` +
  JS offset.
- Gate admin operations with `helpers.requireAdmin`; no hand-rolled checks.
- Shared primitives live in `convex/helpers.ts` (e.g. `patchDefined`, slugify,
  moderation-log insert, notification insert) — extract, don't copy.
- `_generated/**` is git-tracked and regenerated with `npx convex codegen`; both apps
  type-check against it in CI without a Convex server.
- Convex CLI runs from the package: `npm -w @eventnu/convex run dev|deploy|codegen`.

## Content truth

These must never regress in any refactor (from `PRODUCT.md`):

- **Event statuses**: `draft`, `published`, `pending_review`, `rejected`, `cancelled`, `archived`
- **Ownership**: host, organizer, or standalone; `organizer_id` preserved
- **Categories**: parent + subcategories; primary + multiple subcategory tags per event
- **Media**: multiple images (carousel, filters, aspect ratios), poster/cover, teaser video + aspect ratio
- **Pricing**: free toggle + free-text price display
- **Action types**: `open_entry`, `reservation` (with limit), `external_link` (URL + label), `contact` (email)
- **Featured sections**: `editors_choice`, `trending`, `popular`, `new_and_noteworthy`
- **Timezones**: default `Africa/Addis_Ababa`

## Accessibility & motion

- Focus-visible rings, contrast, and full keyboard nav on all interactive primitives.
- Respect reduced motion: `web/lib/hooks/usePrefersReducedMotion.ts`; animations must
  degrade gracefully when it is set.
- Icons carry `aria-hidden`; interactive controls have accessible names (`aria-label`,
  `aria-pressed`, etc.).

## Git & commits

- Conventional commits, lowercase: `feat(scope): …`, `fix(admin-app): …`,
  `refactor(web): …`, `chore: …`, `docs: …`. Scope = `web`, `admin-app`, `convex`, or repo-wide.
- One logical change per commit; commit at phase/item boundaries, never mixed.
- No secrets, no large binaries, no `node_modules`; `_generated/**` is intentionally tracked.

## Status

Work-in-progress conventions are tracked in `REFACTORING.md` (phase checkboxes) and
`docs/tech-debt.md` (living register). Update both when a convention changes.
