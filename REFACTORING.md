# Refactoring Roadmap & Status Tracker — EventNu Admin

**Status:** In progress
**Started:** 2026-08-08
**Scope:** `admin-app/` (Next.js 16 admin dashboard) + the shared Convex backend `web/convex/` that both apps consume.
**Companion docs:** `AUDIT.md` (technical/security audit), `PRODUCT.md` (product context), `docs/decisions/` (ADR log).

Each phase below is a checkbox tracker. A phase is *done* only when its **Exit criteria** are met.

---

## Guiding Principles

- **Operate mode** (impeccable): scanability, consistency, and real-usage speed outrank expression. "Speed is the product" (`PRODUCT.md`) — a routine posting task must never get slower.
- **Content truth is preserved**: statuses, ownership, categories, media, pricing, and action types survive any restructure.
- **Convex rules override assumptions**: `web/convex/_generated/ai/guidelines.md` governs index naming, pagination, validators. Read it before touching `web/convex/`.

---

## Phase 0 — Baseline & Governance

The working tree is large and uncommitted (103 modified / 24 deleted / 48 untracked on a 5-commit `main`), and contains the uncommitted `AUDIT.md` security fixes. Never refactor on top of uncommitted security work.

- [ ] **DONE** Commit the current working tree as a baseline checkpoint.
- [ ] **DONE** Create `docs/decisions/` ADR log; record ADR-0001 (phased refactor kickoff) and ADR-0002 (shared-Convex workspace direction).
- [ ] Adopt incremental-PR workflow: every phase lands as small, reviewable PRs.
- [ ] Standardize commit conventions (conventional commits, lowercase, no `Initial commit`-style messages).

**Exit criteria:** green baseline commit; ADR log seeded; PR/commit conventions documented in `docs/CONTRIBUTING.md` (Phase 5).

---

## Phase 1 — Assessment & Technical Debt Audit

Much is already known from `AUDIT.md` and exploration. Formalize it into a living register.

### 1.1 Make the tooling surface the truth
- [x] Run `npm run lint` in `admin-app` and `web`; flip `@typescript-eslint/no-explicit-any` to `error` once, capture the real failure count. Known baseline: 165 occurrences (`: any` = 94, `as any` = 71). Top files: `admin-app/src/lib/actions/events.ts` (19), `admin-app/src/lib/mappers.ts` (17), `admin-app/src/components/EventDetailClient.tsx` (12), `admin-app/src/components/ReportsClient.tsx` (11).
- [x] Add `tsc --noEmit` typecheck scripts to both apps (none existed). Both apps now pass `typecheck` and lint (0 errors). `admin-app/eslint.config.mjs` ignore pattern fixed (`convex/_generated/` was `src/convex/_generated/`).
- [ ] Add **knip** for dead-code / unused-dep detection. Known targets it should catch:
  - `react-hook-form` + `@hookform/resolvers` installed but imported nowhere.
  - `admin-app/src/lib/validations/auth.ts` unused (sign-in page validates inline).
  - `mappers.mapModerationLog` unused (dashboard inlines the logic twice).
- [ ] Run `npx convex ai-files install` in `web/`; run `npx convex codegen`; verify `admin-app/convex/_generated` stubs match web's real codegen (admin currently type-checks against web's `_generated`).

### 1.2 Dead code — remove what's already known
- [x] `company-design-system`: removed from `admin-app/next.config.ts` (`transpilePackages`) and `admin-app/eslint.config.mjs`; stale `package-lock.json` entry + broken `node_modules` symlink cleaned via `npm install`. No source imports remain.
- [ ] 27 byte-identical `loading.tsx` stubs → one shared skeleton component.
- [ ] Dead props / duplicates:
  - `(app)/settings/page.tsx` passes `profile={null}`; `SettingsClient` shadows it and self-fetches `api.profiles.getMe`. Remove the dead server prop.
  - `/auth/forgot-password` + `/auth/reset-password` hardcoded "not yet available" stubs.
- [ ] Backend:
  - Legacy `events.categoryIds` array (superseded by `eventCategories` join table; `web/convex/migrations.ts` still reads it).
  - `hosts.getStats` unguarded while sibling `hosts.list`/`getById` require admin — likely a bug.
- [x] Lint-drift cleanup in shared Convex: `instagram.ts` `createImportedEvent` computed a `slug` but never inserted it (latent bug — IG-imported events were unreachable via `/events/[slug]`); now wired into the insert. Removed unused `Doc` import in `follows.ts`; `auth.config.ts` default export made lint-clean.
- [ ] Duplicated `fadeUp` framer-motion const in `HostDetailClient` / `OrganizerDetailClient` / `UserDetailClient`.

### 1.3 Debt register
- [ ] Classify every finding **D** (delete) / **I** (improve) / **C** (conserve-as-is) with owner + effort in a `docs/tech-debt.md` register.

**Exit criteria:** zero known dead code; published debt register; real `any` count on record.

---

## Phase 2 — Architecture & Modularization (high-leverage)

### 2.1 Decouple admin-app from the web app's codegen
Root cause of ~90% of the `any` casts: `admin-app` imports `../../../web/convex/_generated/api` from 17 action files + 2 client components, so admin type-checks against web's codegen and overrides types everywhere.

- [ ] **Decision (ADR-0002):** lift `web/convex` into a shared location consumed by both apps (npm workspaces at repo root, single codegen, single source of truth) **OR** keep the cross-package import but type the boundary once in `admin-app/src/lib/convex.ts` and stop overriding with `as any`.
- [ ] Re-enable `@typescript-eslint/no-explicit-any` progressively (file-by-file, API boundary first); target **0 `any`** in `src/lib` and `src/app`.

### 2.2 One data-fetching pattern
- [ ] TanStack Query is configured but used *only* in `EventsClient`. Adopt it as **the** client data layer for all list pages. Kill the three parallel systems:
  - server-actions + `revalidatePath` + `router.refresh()` (default on most list pages)
  - TanStack Query (EventsClient only)
  - direct `convex/react` `useQuery` (`Sidebar` badges, `SettingsClient` getMe/adminSettings)
- [ ] Create `src/lib/api/` typed query-hook modules per resource (mirror of `lib/actions/*`).
- [ ] Centralize error handling through `lib/errors.ts` `getErrorMessage`; remove per-action `try/catch → console.error` boilerplate and silent `catch → null` swallows (`getInstagramStatus`, `SettingsClient`).

### 2.3 Backend modularization (`web/convex`)
- [ ] Split `events.ts` (635 lines, 20 exports) → `events/read|write|moderation|enrichment`.
- [ ] Split `instagram.ts` (786 lines) → `instagram/connect|import|publish|crypto`.
- [ ] Extract duplicated primitives into a shared module:
  - `patchDefined` filter-undefined patch (repeated 8× across categories/cms/events/features/hosts/organizers/profiles)
  - slugify (3 implementations: `events.ts`, `instagram.ts` ×2)
  - event-image batch insert + storage cleanup (events.ts + instagram.ts `createImportedEvent`)
  - notification insert (notifications.ts ×2, instagram.ts `notifyAdmin`, reports.ts `warnUserFromReport`)
  - moderation-log insert + admin-name enrichment (moderation.ts ×3, reports.ts `actionReport`)
- [ ] Break `instagram.ts → events.ts` import tangle (`MAX_EVENT_IMAGES`) into a shared constants module.
- [ ] Split `cms.ts` (pages / announcements / contact, 210 lines) into 2–3 files.
- [ ] Standardize compound index names to `by_field1_and_field2` (`schema.ts` currently uses `by_organizer_status`, `by_user_event`, `by_user_read`, `by_event`, `by_category`, …).
- [ ] Gate `hosts.getStats` with `requireAdmin` (move from 1.2 to here if deferred).

### 2.4 Admin-app component decomposition
- [ ] Extract shared data-table primitives from the six copy-pasted list clients (`EventsClient`, `HostsClient`, `UsersClient`, `OrganizersClient`, `NotificationsClient`, `ReportsClient`, `CategoriesClient`): `DataTable`, `FilterBar`, `StatusBadge` maps, `Pagination`, `EmptyState`, `ConfirmDialog`, toast-on-error.
- [ ] Split the giants:
  - `EventForm.tsx` (793) → sectioned field groups
  - `CategoriesClient.tsx` (751) → dialog/table/panel components
  - `SettingsClient.tsx` (733) → tabs extracted into their own components
- [ ] Consolidate motion: one `motionPresets.ts` (kills duplicated `fadeUp`).
- [ ] Unify date formatting through one `lib/format.ts` (kill mixed `date-fns format` vs `toLocaleDateString` vs `toDateTimeLocal`).
- [ ] **Single design system:** declare `src/components/ui` the only system; run the impeccable `extract` pass to tokenize remaining inline styles (`cms/PageFormClient` raw `<textarea>` classes).

**Exit criteria:** both apps typecheck with `no-explicit-any` on; all list pages share one table + query stack; backend modules <400 lines; no cross-module tangle.

---

## Phase 3 — Coding Standards, Linting & Formatting

- [ ] **Prettier** at repo root (both apps); `format` + `format:check` scripts.
- [ ] **ESLint** (`admin-app/eslint.config.mjs`): `no-explicit-any` → error, `no-unused-vars` → error, add `eslint-plugin-tailwindcss` and `jsx-a11y`. Align `web/eslint.config.mjs` (it already bans named `max-w-*` classes via a custom rule).
- [ ] **TypeScript**: `typecheck` scripts (`tsc --noEmit`); consider `noUncheckedIndexedAccess` for new table code.
- [ ] **Pre-commit**: husky + lint-staged (lint + format on staged files).
- [ ] **CI** (GitHub Actions): `lint → typecheck → test → build` on every PR; `convex typegen` freshness check.
- [ ] **Convex-specific rules** into `admin-app/AGENTS.md`: compound-index naming, no unbounded arrays, validators on all args, `.paginate()` not `.take(1000)`, `helpers.requireAdmin` not hand-rolled checks.

**Exit criteria:** `lint` + `typecheck` + `format:check` green on both apps; enforced in CI and pre-commit.

---

## Phase 4 — Test Coverage (first pass: logic + key flows)

**Stack:** Vitest + `@testing-library/react` + `jsdom` + `user-event`.

- [ ] **1. Pure logic:** `lib/mappers.ts`, `lib/validations/*`, `lib/errors.ts`, `lib/format.ts`, `lib/utils.ts`; extracted slugify / `patchDefined` / status + date maps.
- [ ] **2. Convex helpers:** `helpers.ts` auth resolution (fake identity), `patchDefined`, moderation-log insert.
- [ ] **3. Component tests** for the shared primitives from Phase 2.4 (DataTable sorting/filtering/empty state, StatusBadge, ConfirmDialog, Pagination). Enforce the a11y contract here (labels, focus, keyboard nav, `aria-sort`).
- [ ] **4. Key flows:** `EventForm` validation + submit, `EventsClient` query + bulk-action wiring (mock `api`), `ImagePicker` upload/limit behavior.
- [ ] Coverage gate on **new code** (e.g., 80% statements), not a global threshold.

**Exit criteria:** `npm test` green; CI runs it; the six list pages + both form flows covered. Backend integration tests are explicitly deferred to a later cycle.

---

## Phase 5 — Documentation

- [ ] `admin-app/README.md`: env vars (incl. `NEXT_PUBLIC_WEB_URL`, `CONVEX_SITE_URL`), the cross-app Convex import + codegen prerequisite, scripts.
- [ ] Root `docs/ARCHITECTURE.md`: module map + the admin ↔ web ↔ Convex coupling diagram.
- [ ] `docs/CONVENTIONS.md`: code style, server/client boundary, TanStack Query pattern, naming, and the **content-truth list** from `PRODUCT.md`.
- [ ] `docs/CONTRIBUTING.md`: PR/commit conventions (from Phase 0), review checklist.
- [ ] `admin-app/AGENTS.md`: Convex boilerplate + app conventions (mirror `web/AGENTS.md`).
- [ ] Keep `AUDIT.md` current; add `DESIGN.md` for the admin app (impeccable `init`/`document` pass — tokens currently live only in `globals.css`).

**Exit criteria:** a new dev can boot, find, and modify each layer in <30 minutes without asking.

---

## Phase 6 — Performance Hardening (from AUDIT §3)

- [ ] Real cursor pagination in `events.list` — `.paginate()` + `paginationResultValidator`; retire the offset-over-`.take(1000)` + dummy `continueCursor`.
- [ ] Admin list queries: replace fetch-all-then-JS-filter/slice (`getUsers`, `getHosts`, `getOrganizers`, `getReports`, `getNotifications`) with server-side pagination; `sendNotification` batch no longer pulls all profiles.
- [ ] Remove unbounded scans: `email.ts` `.collect()`, `events.getStats` / `analytics.getStats` `.take(1000)`-style counts.
- [ ] Drop `events.categoryIds` entirely (join table exists).
- [ ] Add missing indexes: `hosts` (slug/status), `categories.parentId`.
- [ ] Extend the EventsClient 400ms debounce pattern to all list search inputs; consistent TanStack Query `staleTime`.
- [ ] Bundle: `@next/bundle-analyzer`; delete `react-hook-form`/`@hookform/resolvers` **or** adopt them for the EventForm split — don't leave them idle.

**Exit criteria:** dashboard + `(app)` nav path stop re-fetching full collections; `events.list` cursor pagination covered by tests; bundle diff report ≤ previous.

---

## Phase 7 — Final Verification & Rollout

- [ ] Re-run the full `AUDIT.md` checklist (§2 Security, §3 Performance, §4 Functionality) against the refactored code.
- [ ] All gates green in CI: `lint · typecheck · format:check · test · build` for both apps.
- [ ] **Speed commitment check** (PRODUCT.md): time create → save → publish an event before vs after. No regression.
- [ ] Smoke-test admin flows: events (create/edit/status/bulk/feature), hosts/organizers/users/reports, CMS, notifications, analytics, Instagram connect+publish, settings.
- [ ] Verify the a11y contract (ui-ux-pro-max §1–3): focus-visible, contrast, keyboard nav on all new table/dialog primitives; reduced-motion respected.
- [ ] Convex: verify query counts dropped on the Convex dashboard (nav path, list pages); no new index warnings from `convex dev`.
- [ ] Update `AUDIT.md` / this tracker; tag the milestone commit; release notes.

**Exit criteria:** zero open P0/P1 findings from the audit; all five quality gates enforced and documented.

---

## Known Findings Snapshot (from 2026-08 exploration)

| # | Finding | Where | Phase |
|---|---|---|---|
| 1 | `any` casts (165 total) caused by cross-app codegen mismatch | `admin-app/src`, esp. `lib/actions/events.ts`, `lib/mappers.ts` | 1.1, 2.1 |
| 2 | `company-design-system` deleted but still wired (transpilePackages, dep, eslint ignore, broken symlink) | `admin-app/next.config.ts`, `package.json`, `eslint.config.mjs` | 1.2 |
| 3 | Three parallel client data systems (server actions / TanStack / `convex/react`) | list pages, `Sidebar`, `SettingsClient` | 2.2 |
| 4 | Fake pagination + fetch-all-then-slice in admin list actions | `lib/actions/{users,hosts,organizers,reports,notifications}.ts` | 6 |
| 5 | `events.list` offset-over-`.take(1000)`, dummy `continueCursor` | `web/convex/events.ts` | 6 |
| 6 | `events.ts` (635) / `instagram.ts` (786) oversized, tangled | `web/convex/` | 2.3 |
| 7 | Duplicated helpers: `patchDefined` ×8, slugify ×3, image batch ×2, notification ×3, moderation-log ×2 | `web/convex/` | 2.3 |
| 8 | Legacy `events.categoryIds` array + compound index naming violations | `web/convex/schema.ts`, `migrations.ts` | 1.2, 2.3, 6 |
| 9 | Six copy-pasted list clients; `fadeUp` ×3; mixed date formatting | `admin-app/src/components/` | 2.4 |
| 10 | No formatter, no tests, no CI, no hooks | repo-wide | 3, 4 |
| 11 | `react-hook-form` + `@hookform/resolvers` installed, unused | `admin-app/package.json` | 1.1, 6 |
| 12 | `hosts.getStats` unguarded (needs `requireAdmin`) | `web/convex/hosts.ts` | 1.2/2.3 |
| 13 | `mappers.mapModerationLog` unused; dashboard inlines it twice | `admin-app/src/lib/mappers.ts`, `lib/actions/dashboard.ts` | 1.1, 2.2 |
| 14 | 27 identical `loading.tsx` stubs | `admin-app/src/app/(app)/**/loading.tsx` | 1.2 |
| 15 | `SettingsClient` dead `profile={null}` prop; double profile fetch | `(app)/settings/page.tsx`, `SettingsClient.tsx` | 1.2, 2.2 |
| 16 | `forgot/reset-password` hardcoded placeholders | `admin-app/src/app/auth/` | 1.2 |
