# Technical Debt Register — EventNu Admin

Living register for the phased refactor (see `REFACTORING.md` for the roadmap and
`AUDIT.md` for the security/performance audit). Classification:

- **D** = delete/remove (dead code)
- **I** = improve/refactor
- **C** = conserve as-is (deliberate; add a note why)
- **[x]** = resolved

---

## Tooling & quality gates

| Status | Class | Item | Where | Note |
|---|---|---|---|---|
| [x] | D | `company-design-system` wired refs (transpilePackages, eslint ignore, lockfile entry, symlink) | `admin-app/` | Removed 2026-08-08 |
| [x] | D | Stale `convex/_generated` eslint-disable warnings | `admin-app/eslint.config.mjs` | Ignore pattern fixed to `convex/_generated/` |
| [x] | D | Missing `typecheck` scripts | `admin-app`, `web` | Added `tsc --noEmit`; both pass |
| [x] | I | knip dead-code gate | `admin-app` | Installed + configured (`knip.jsonc`), script `npm run knip` |
| [ ] | I | Prettier + format scripts | repo | Phase 3 |
| [ ] | I | husky + lint-staged pre-commit | repo | Phase 3 |
| [ ] | I | CI (lint → typecheck → test → build) | repo | Phase 3 |

## Dead code (admin-app)

| Status | Class | Item | Where | Note |
|---|---|---|---|---|
| [x] | D | `profile` prop (always `null`, shadowed) | `settings/page.tsx`, `SettingsClient.tsx` | Client self-fetches `api.profiles.getMe` |
| [x] | D | `publishEvent` / `rejectEvent` server actions | `lib/actions/dashboard.ts` | Unused; UI uses `updateEventStatus` |
| [x] | D | `markAllRead` server action | `lib/actions/notifications.ts` | Unused |
| [x] | D | `getAdminNotificationPrefs` server action | `lib/actions/settings.ts` | Unused; client reads `api.adminSettings.getByAdmin` directly |
| [x] | D | `validations/auth.ts` | `src/lib/validations/` | Unused (sign-in validates inline); dir removed |
| [x] | D | `mapModerationLog` orphaned | `lib/mappers.ts` | Now used by `dashboard.ts` (was inlined twice) |
| [x] | D | Unnecessary `export` on module-internal helpers | `mappers.ts` (`iso`), `reports.ts` (`actionReport`), `ImagePicker.tsx` (`IMAGE_FILTERS`) | Made module-private |
| [x] | D | Latent bug: `instagram.createImportedEvent` computed slug, never inserted | `web/convex/instagram.ts` | Slug now written; events reachable via `/events/[slug]` |
| [x] | I | `hosts.getStats` unguarded | `web/convex/hosts.ts` | Now `requireAdmin`, matching `list`/`getById` |
| [ ] | C | `/auth/forgot-password`, `/auth/reset-password` stubs | `admin-app/src/app/auth/` | Deliberate placeholders for unimplemented SMTP/password reset, not accidental dead code |
| [x] | D | 27 `loading.tsx` stubs | `admin-app/src/app/(app)/**/` | **Resolved in baseline** — each is a thin wrapper around `src/components/skeletons.tsx`; required per route by Next.js streaming |
| [x] | D | `fadeUp` framer-motion const ×3 | `HostDetailClient`, `OrganizerDetailClient`, `UserDetailClient` | Consolidated into `src/lib/motion.ts` (Phase 2.4) |
| [x] | I | List clients on the shared stack | `Hosts/Users/Organizers/Notifications/Reports/Events` | Hosts, Users, Organizers, Notifications, Reports migrated to `useXList` hooks + `components/list` primitives + `lib/format`; Events kept its own TanStack query (refit deferred) |
| [ ] | D | Legacy `events.categoryIds` array field | `web/convex/schema.ts`, `migrations.ts`, `mappers.ts` | Deferred to Phase 6 — spans admin form contract + migrations |

## Design system

| Status | Class | Item | Where | Note |
|---|---|---|---|---|
| [ ] | C | Unused primitive exports (`Sheet`, `Tabs`, `Toggle`, `Separator`, `CardFooter`, `Avatar*`, `ButtonProps`, …) | `src/components/ui/*` | Public API of the consolidated single design system; knip ignores `src/components/ui/**` |
| [ ] | I | Split `EventForm.tsx` (793) / `CategoriesClient.tsx` (751) / `SettingsClient.tsx` (733) | `admin-app/src/components/` | Phase 2.4 |

## Dependencies

| Status | Class | Item | Note |
|---|---|---|---|
| [ ] | C | `react-hook-form`, `@hookform/resolvers`, `zod` | Installed, currently unused; **reserved** for the Phase 2.4 EventForm split. If EventForm is NOT rebuilt on them by end of Phase 2, remove. knip ignores them |
| [ ] | I | Unused-dep scan for `web/` | Out of scope (consumer app); revisit if scope widens |

## Known performance debt (→ Phase 6)

| Class | Item | Where |
|---|---|---|
| I | Fake pagination: `events.list` offset-over-`.take(1000)`, dummy `continueCursor` | `web/convex/events.ts` |
| I | Fetch-all-then-slice list actions | `lib/actions/{users,hosts,organizers,reports,notifications}.ts` |
| I | Unbounded scans (`.take(1000)` counts, `email.ts` `.collect()`) | `web/convex/` |
| I | Missing indexes (`hosts`, `categories.parentId`) | `web/convex/schema.ts` |
| I | Three parallel client data systems | list pages, `Sidebar`, `SettingsClient` → TanStack Query |
