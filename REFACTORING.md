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
- [x] Add **knip** for dead-code / unused-dep detection (`npm run knip`, configured in `admin-app/knip.jsonc` — design-system primitives + reserved form deps documented). Cleaned this pass:
  - Deleted: `validations/auth.ts`, `publishEvent`, `rejectEvent`, `markAllRead`, `getAdminNotificationPrefs`.
  - Re-purposed: `mapModerationLog` now used by `dashboard.ts` (was inlined twice).
  - Made private: `iso`, `actionReport`, `IMAGE_FILTERS` (module-internal helpers that didn't need `export`).
  - Reserved (C): `react-hook-form` + `@hookform/resolvers` + `zod` for the Phase 2.4 EventForm split.
- [x] Run `npx convex ai-files install` in `web/`; run `npx convex codegen`; verify `admin-app/convex/_generated` stubs match web's real codegen (admin currently type-checks against web's `_generated`).
  - `convex ai-files install` already run (guidelines live in `web/convex/_generated/ai/`); web's `_generated` is present, current, and **intentionally git-tracked** (admin type-checks against it in CI without a dev server).
  - Finding: `admin-app/convex/_generated` was a **vestigial empty stub** (`fullApi: ApiFromModules<{}>`, `Doc = any`) imported by zero files — leftover from when admin-app was its own Convex project. Deleted it; admin-app has no Convex deployment, it is a pure consumer of web's codegen (sharpens ADR-0002).

### 1.2 Dead code — remove what's already known
- [x] `company-design-system`: removed from `admin-app/next.config.ts` (`transpilePackages`) and `admin-app/eslint.config.mjs`; stale `package-lock.json` entry + broken `node_modules` symlink cleaned via `npm install`. No source imports remain.
- [x] 27 byte-identical `loading.tsx` stubs → one shared skeleton component. **Resolved in the baseline:** every route's `loading.tsx` is already a thin wrapper around the shared `src/components/skeletons.tsx` primitives (`ListSkeleton`/`DetailSkeleton`/`FormSkeleton`/`HeaderSkeleton`/`CardGridSkeleton`). These wrappers are intentional (Next.js requires a `loading.tsx` per route for streaming).
- [x] Dead props / duplicates:
  - `(app)/settings/page.tsx` passed `profile={null}`; `SettingsClient` shadowed it and self-fetched `api.profiles.getMe`. Prop removed from the page and the component; `AdminProfile` type now annotates the client-mapped profile.
  - `/auth/forgot-password` + `/auth/reset-password` hardcoded "not yet available" stubs. **Deferred (C — conserve):** deliberate placeholders tied to the unimplemented SMTP/password-reset feature, not accidental dead code.
- [x] Backend:
  - `hosts.getStats` now calls `requireAdmin` (was unguarded while `hosts.list`/`getById` require admin).
  - Legacy `events.categoryIds` array: **deferred to Phase 6** — the field is only *written* via the `events.create/update` join-table path (the `categoryIds` arg is the API contract, not the array field), but removing the schema field touches mappers, migrations, and the admin form contract, so it ships with the Phase 6 data-layer cleanup.
- [ ] Duplicated `fadeUp` framer-motion const in `HostDetailClient` / `OrganizerDetailClient` / `UserDetailClient` (→ Phase 2.4 motion consolidation).

### 1.3 Debt register
- [x] Classify every finding **D** (delete) / **I** (improve) / **C** (conserve-as-is) with owner + effort in a `docs/tech-debt.md` register.

**Exit criteria:** zero known dead code; published debt register; real `any` count on record.

---

## Phase 2 — Architecture & Modularization (high-leverage)

### 2.1 Decouple admin-app from the web app's codegen
Root cause of ~90% of the `any` casts: `admin-app` imports `../../../web/convex/_generated/api` from 17 action files + 2 client components, so admin type-checks against web's codegen and overrides types everywhere.

- [x] **Decision (ADR-0002, accepted): Option A** — npm workspaces + shared package. The backend now lives at `packages/convex` (workspace `@eventnu/convex`):
  - Root `package.json` declares `"workspaces": ["admin-app", "web", "packages/*"]`; per-app `package-lock.json` files replaced by the root lockfile.
  - `web/convex/**` moved (git mv) to `packages/convex/convex/**`; `packages/convex/package.json` (+ `exports` mapping `@eventnu/convex/_generated/*`), `tsconfig.json`, own `typecheck`/`codegen`/`dev`/`deploy` scripts.
  - `@eventnu/convex/_generated/*` stays **git-tracked** (CI type-checks without a Convex server); `npx convex codegen` in the package regenerates byte-identically and confirmed it talks to the same deployment via `packages/convex/.env.local` (copied from `web/.env.local`).
  - Imports updated: 16 admin files + 3 web consumer files (`ReservationForm`, `lib/actions/contact.ts`, `lib/api/events.ts`) → `@eventnu/convex/_generated/api`.
  - Configs: eslint ignores now `packages/convex/**`; `web/AGENTS.md`/`CLAUDE.md` guidelines path → `packages/convex/convex/_generated/ai/guidelines.md`.
  - Convex CLI workflow: `npm -w @eventnu/convex run dev|deploy|codegen` (root convenience scripts `convex:dev`/`convex:deploy`/`convex:codegen`).
  - Verified: admin + web + convex package all `typecheck` clean; admin lint 0, web lint 0 errors (4 pre-existing consumer warnings); knip clean; **both `next build`s succeed**.
- [x] Re-enable `@typescript-eslint/no-explicit-any` progressively (file-by-file, API boundary first); target **0 `any`** in `src/lib` and `src/app`. **Resolved 2026-08-11:** `no-explicit-any` is `error` in both app configs and there are **0 `any`** casts repo-wide (web, admin-app, `@eventnu/convex`). Web/convex mappers now use `FunctionReturnType<typeof api.*>` and `Id<'…'>` casts.

### 2.2 One data-fetching pattern
- [x] TanStack Query is configured but used *only* in `EventsClient`. Adopt it as **the** client data layer for all list pages. Kill the three parallel systems:
  - server-actions + `revalidatePath` + `router.refresh()` (default on most list pages)
  - TanStack Query (EventsClient only)
  - direct `convex/react` `useQuery` (`Sidebar` badges, `SettingsClient` getMe/adminSettings)
  **DONE 2026-08-11:** all list pages (`Events`, `Categories`, `Support`, CMS `Pages`/`Announcements`/`ContactSubmissions`) read through TanStack hooks (`src/lib/api/*`) seeded with server `initialData`; mutations `invalidateQueries` + keep `revalidatePath` for the SSR seed. `router.refresh()` removed from list/form clients (`PageFormClient`, `EventForm` keep `push` only). `convex/react` `useQuery` eliminated: `Sidebar` badges server-seeded via `getNavCounts` (layout) + `useNavCounts` (refetchInterval 120s); `SettingsClient` profile via `getCurrentAdminProfile` prop; `NotificationsSection` via `getAdminNotificationPrefs` prop. Only `@convex-dev/auth/react` (auth) remains on `convex/react`.
- [x] Create `src/lib/api/` typed query-hook modules per resource (mirror of `lib/actions/*`). **DONE 2026-08-11:** `categories.ts`, `support.ts`, `cms.ts`, `events.ts`, `dashboard.ts` with per-resource `*Keys` consts + `useQuery({ initialData, staleTime: 30_000 })`; events keeps `keepPreviousData` + filter-aware `initialData`.
- [x] Centralize error handling through `lib/errors.ts` `getErrorMessage`; remove per-action `try/catch → console.error` boilerplate and silent `catch → null` swallows (`getInstagramStatus`, `SettingsClient`). **DONE 2026-08-11:** stripped all `try/catch → console.error → throw` wrappers in `lib/actions/*`; `getInstagramStatus`/`getCurrentAdminProfile` no longer swallow (`null` → throw). Callers updated to handle: `(app)/layout.tsx` + `settings/page.tsx` guard the profile/status fetches, `ReportsClient.handleSelectReport` try/catch→null, `PublishToInstagramDialog` adds `.catch`. Intentional degradation kept: detail-page count lookups (`buildDetail`, `getOrganizerById`) still fall back to zero counts on secondary-query failure.

### 2.3 Backend modularization (`web/convex`)
- [x] Split `events.ts` (592 lines, 20 exports) → `events/enrichment|read|write|moderation`. New `api.events.read|write|moderation.*` namespaces; shared image/category resolution + `enrichEvent` in `enrichment.ts` (consumed by `bookmarks.ts`). Per-module sizes: read 180, write 250, moderation 55, enrichment 70.
- [x] Split `instagram.ts` (770 lines) → `instagram/crypto|shared|connect|publish|import`. New `api.instagram.connect.*`, `api.instagram.publish.*`, `internal.instagram.connect|publish|import.*` namespaces; env+crypto helpers in `crypto.ts`, graph client in `shared.ts`. Per-module sizes: connect 300, publish 155, import 150, crypto/shared ~75 each.
- [x] Extract duplicated primitives into a shared module (`convex/helpers.ts` + `convex/constants.ts`):
  - `patchDefined` filter-undefined patch (repeated 8× across categories/cms/events/features/hosts/organizers/profiles)
  - slugify (3 implementations: `events.ts`, `instagram.ts` ×2)
  - event-image batch insert + storage cleanup (events.ts + instagram.ts `createImportedEvent`)
  - notification insert (notifications.ts ×2, instagram.ts `notifyAdmin`, reports.ts `warnUserFromReport`)
  - moderation-log insert + admin-name enrichment (moderation.ts ×3, reports.ts `actionReport`)
- [x] Break `instagram.ts → events.ts` import tangle (`MAX_EVENT_IMAGES`) into a shared constants module.
- [x] Split `cms.ts` (pages / announcements / contact, 210 lines) → `cms/pages.ts` (95), `cms/announcements.ts` (78), `cms/contact.ts` (55). New `api.cms.pages.*`, `api.cms.announcements.*`, `api.cms.contact.*` namespaces.
- [x] Standardize compound index names to `by_field1_and_field2` (`schema.ts` currently uses `by_organizer_status`, `by_user_event`, `by_user_read`, `by_event`, `by_category`, …).
- [x] Gate `hosts.getStats` with `requireAdmin` (done in Phase 1.2; tracked in tech-debt register).

### 2.4 Admin-app component decomposition
- [x] Extract shared data-table primitives from the six copy-pasted list clients: `DataTable`, `FilterBar`, `StatusBadge` maps, `Pagination`, `EmptyState`, `ConfirmDialog`, toast-on-error. Adopted by `HostsClient`, `UsersClient`, `OrganizersClient` (Phase 2.2) and `EventsClient`/`CategoriesClient` (2.4). Intentional exceptions documented in the tracker: `NotificationsClient` (card feed) and `ReportsClient` (master-detail with sticky headers).
- [x] Split the giants:
  - `EventForm.tsx` (873 → 187) → sectioned field groups in `event-form/` (`fields.tsx`, `EventFormHeader`, `EventMediaSection`, `EventDetailsSection`, `EventScheduleSection`, `EventVenueSection`, `EventCategorySection`, `EventMoreOptions`, shared `types.ts`)
  - `CategoriesClient.tsx` (806 → 295) → `CategoryIcon`, `CategoryList`, `CategoryGrid`, `CategoryDialog`, `CategoriesEmptyState`
  - `SettingsClient.tsx` (733 → 118) → `SettingsCard` wrapper + `ProfileSection`, `SecuritySection`, `FeaturedSectionsSection`, `DangerZoneSection`, `NotificationsSection`, `AdminStatsSection`, `AccountInfoSection`, shared `types.ts`; orchestrator keeps the `getMe` query + no-profile fallback
- [x] Consolidate motion: one `motion.ts` (kills duplicated `fadeUp`).
- [x] Unify date formatting through one `lib/format.ts` (kill mixed `date-fns format` vs `toLocaleDateString` vs `toDateTimeLocal`). Also routed all static `toast.error('Failed to X')` through `lib/errors.ts` `getErrorMessage`. Deliberately left chart labels and the dashboard activity-log format (`MMM d, HH:mm`) on their own formats.
- [x] **Single design system:** declare `src/components/ui` the only system; run the impeccable `extract` pass to tokenize remaining inline styles (`cms/PageFormClient` raw `<textarea>` classes). Replaced all 8 remaining raw `<textarea>` elements (PageFormClient, HostDetailClient, UserDetailClient, NotificationsClient, EventDetailClient, PublishToInstagramDialog, ReportsClient, SupportClient) with the shared `Textarea` primitive, carrying per-field size overrides via `className`.

**Exit criteria:** both apps typecheck with `no-explicit-any` on; all list pages share one table + query stack; backend modules <400 lines; no cross-module tangle.

---

## Phase 3 — Coding Standards, Linting & Formatting

- [x] **Prettier** at repo root (both apps); `format` + `format:check` scripts.
- [x] **ESLint** (`admin-app/eslint.config.mjs`): `no-explicit-any` → error, `no-unused-vars` → error. `jsx-a11y` ships with `eslint-config-next/core-web-vitals`; `eslint-plugin-tailwindcss` deferred (Tailwind v4 support is noisy — revisit before adding).
- [x] **TypeScript**: `typecheck` scripts (`tsc --noEmit`) across all three workspaces; root `npm run typecheck`.
- [x] **Pre-commit**: husky + lint-staged (lint + format on staged files, per-workspace ESLint via `--config`).
- [x] **CI** (GitHub Actions): `lint → typecheck → format → test → build` on every PR; conditional `convex typegen` freshness check + build gated on repo secrets.
- [ ] **Convex-specific rules** into `admin-app/AGENTS.md`: compound-index naming, no unbounded arrays, validators on all args, `.paginate()` not `.take(1000)`, `helpers.requireAdmin` not hand-rolled checks.

**Exit criteria:** `lint` + `typecheck` + `format:check` green on both apps; enforced in CI and pre-commit.

---

## Phase 4 — Test Coverage (first pass: logic + key flows)

**Stack:** Vitest + `@testing-library/react` + `jsdom` + `user-event`.

- [ ] **1. Pure logic:** `lib/mappers.ts`, `lib/validations/*`, `lib/errors.ts`, `lib/format.ts`, `lib/utils.ts`; extracted slugify / `patchDefined` / status + date maps.
  - [x] `lib/format.ts`, `lib/errors.ts`, `lib/utils.ts`, `lib/pagination.ts`, `lib/mappers.ts` (incl. `usernameFromEmail`, `mapReportTargetPreview` discrimination, `map*` defaults).
  - [ ] `lib/validations/*` still uncovered.
- [ ] **2. Convex helpers:** `helpers.ts` auth resolution (fake identity), `patchDefined`, moderation-log insert.
  - [x] `patchDefined`, `slugify`, `uniqueSlug` (via vitest in `packages/convex`).
  - [ ] Auth resolution + moderation-log insert deferred — need Convex's in-memory test runner (`convex/_generated/test`), revisit after Phase 6 pagination.
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
| 8 | Legacy `events.categoryIds` array (join table exists; array left on schema) | `web/convex/schema.ts`, `migrations.ts` | 1.2, 6 |
| 9 | Six copy-pasted list clients; `fadeUp` ×3; mixed date formatting | `admin-app/src/components/` | 2.4 |
| 10 | No formatter, no tests, no CI, no hooks | repo-wide | 3, 4 |
| 11 | `react-hook-form` + `@hookform/resolvers` installed, unused | `admin-app/package.json` | 1.1, 6 |
| 12 | `hosts.getStats` unguarded (needs `requireAdmin`) | `web/convex/hosts.ts` | 1.2/2.3 |
| 13 | `mappers.mapModerationLog` unused; dashboard inlines it twice | `admin-app/src/lib/mappers.ts`, `lib/actions/dashboard.ts` | 1.1, 2.2 |
| 14 | 27 identical `loading.tsx` stubs | `admin-app/src/app/(app)/**/loading.tsx` | 1.2 |
| 15 | `SettingsClient` double profile fetch | `(app)/layout.tsx` + `(app)/settings/page.tsx` both call `getCurrentAdminProfile()` (layout for the role gate, page for display) | 1.2, 2.2 |
| 16 | `forgot/reset-password` hardcoded placeholders | `admin-app/src/app/auth/` | 1.2 |
