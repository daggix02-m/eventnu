# Audit Remediation Plan — Event Nu

**Date:** 2026-08-15
**Scope:** All 12 P1 findings + P2/nit list from the codebase audit.
**Implementer:** opencode session
**Commits:** one per finding. **Gates:** `npm test`, `npm run typecheck`, `npm run lint` (plus `npm -w @eventnu/convex run codegen` when schema/`_generated` changes) after every slice.

**How to track:** tick the checkbox under each finding when its commit lands and passes its gates.

---

## Phase 1 — Security

### S1. Escape HTML in email templates
- [x] `packages/convex/convex/email.ts` — add `escapeHtml()`; wrap `reservation.name`, `reservation.message`, `event.title`, `venueName`, `location`
- [x] `packages/convex/convex/auth.ts` — defensively escape `token`/`url` in verification email
- [x] New tests in `packages/convex/convex/helpers.test.ts` (escapeHtml + "script tag stays inert")
- [x] Gates: `npm test` (20/20) / typecheck / prettier

### S2. JSON-LD `</script>` breakout
- [x] `web/app/events/[slug]/page.tsx` — `JSON.stringify(jsonLd).replace(/</g, '\\u003c')`
- [x] Gates: web typecheck / prettier (line clean; file has pre-existing format drift)

### S3. CSP `unsafe-inline` removal
- [x] `web/proxy.ts` (wrapped Convex auth proxy) — per-request nonce
- [x] `web/next.config.ts` — removed static CSP (nonce CSP now set in proxy); other security headers stay
- [x] Nonce applied automatically by Next.js 16 to all inline scripts via `x-nonce`/request CSP header (no manual layout wiring needed)
- [x] `npm run build` clean; runtime verified: 37/37 scripts nonce'd, fresh nonce per request, `'unsafe-inline'` gone from script-src
- [x] Gates: typecheck / build / runtime curl checks
- [x] No fallback needed — nonce approach worked on first pass (report-only fallback not required)

## Phase 2 — Performance

### P1. Drop redundant storage URL re-resolution
- [x] `packages/convex/convex/events/enrichment.ts` — `resolveImageUrls` uses persisted `img.url`, only `getUrl` when url is empty
- [x] New tests in `enrichment.test.ts` (persisted url used, no `getUrl` call, fallback path, null-safety)
- [x] Gates: `npm test` (24/24) / typecheck

### P2. Batch enrichment in `getPublished` (+ featured/similar/category)
- [x] `packages/convex/convex/events/enrichment.ts` — new `enrichPublicEvents` batching link/image lookups + deduping cross-event category reads
- [x] `packages/convex/convex/events/read.ts` — `getPublished`/`getFeatured`/`getSimilar`/`getByCategory` use batch path
- [x] `packages/convex/convex/bookmarks.ts` — `listByUser` uses batch path
- [x] Extend `enrichment.test.ts` for batch path (shared category fetched once, empty batch, per-event resolution)
- [x] Fallback applied: `q.in` unsupported in Convex 1.42.3 (verified in `filter_builder.d.ts`); `or`-of-equalities scans the table (no query planner unions index ranges per Convex docs) — so kept parallel indexed per-event queries + deduped category `ctx.db.get` across the batch
- [x] Gates: `npm test` (27/27) / typecheck

### P3. Kill full-table stat scans via counter docs
- [x] Scoped decision (user): **bound the scans only** — skip counter docs (they need wiring across ~8 mutation sites with drift risk; counters can't cleanly track the time-dependent `upcoming` stat). Note: these stats ARE consumed by `admin-app` (back-office), not `web`.
- [x] `constants.ts` — add `STATS_SCAN_CAP = 1000`
- [x] `events/read.ts` — `getStats` uses parallel indexed queries (`by_status`) + bounded `take`, no paginate loop
- [x] `reports.ts` — `getStats` uses parallel indexed `by_status` queries (pending/actioned/dismissed), total = sum
- [x] `analytics.ts` — `getStats`/`getWeekly` use shared `STATS_SCAN_CAP` (was 1000/500/2000)
- [x] `dashboard.ts` — `getNavCounts` uses shared `STATS_SCAN_CAP` (was 1000)
- [x] Gates: `npm test` (27/27) / typecheck
- [ ] New unit coverage for counter helper
- [ ] Gates: `npm test` / typecheck / lint

### P4. Scope three.js background to homepage
- [x] `web/app/layout.tsx` — removed `<SiteBackground/>`
- [x] `web/app/page.tsx` — renders `<SiteBackground/>` (home only)
- [x] `web/components/layout/SiteBackground.tsx` — `IntersectionObserver` gate (mounts `PixelBlast` only when near viewport) + reduced-motion gate; sentinel div always rendered so the observer attaches reliably
- [ ] Manual check other routes don't mount it
- [x] Gates: typecheck / eslint

## Phase 3 — Correctness

### C1. Move post-pagination filters into the query
- [x] `packages/convex/convex/events/read.ts` — `source`/`featured`/`frequency` as `.filter()` before `.paginate()`; `status` via `by_status` index; substring `search` kept as post-pagination JS filter (Convex filter builder has no `includes`; sibling list queries do the same)
- [x] `packages/convex/convex/reports.ts` — `targetType` as `.filter()` before `.paginate()`
- [x] Scoped decision (user): keep substring `search`, no `withSearchIndex` (avoids schema change/codegen; consistent with hosts/organizers/profiles)
- [x] New `events/read.test.ts` — 8 tests for `list` filter behavior (index usage, source/featured/frequency, combined filters, search, no-filter)
- [x] Gates: `npm test` (35/35) / typecheck

### C2. Thread primary category through `toPublicEvent`
- [x] `packages/convex/convex/events/enrichment.ts` — added `primaryCategoryId` to `PublicEvent` (first category, since `getEventCategoryLinks` sorts primary first)
- [x] `web/lib/api/events.ts` — `mapEvent` sets `is_primary` from `raw.primaryCategoryId` (was hardcoded `true` for every category)
- [x] Extended `enrichment.test.ts` (assert `primaryCategoryId`, empty-categories case) — 37/37
- [x] Gates: `npm test` (37/37) / typecheck (convex + web)

### C3. Reject reservations for ended/cancelled events
- [x] `packages/convex/convex/reservations.ts` — `create` guards: `status === 'published'` + `endDate > Date.now()` (before limit check)
- [x] New `reservations.test.ts` — 5 tests (non-published, cancelled, ended, limit-reached, happy path) via `_handler`
- [x] Gates: `npm test` (42/42) / typecheck

## Phase 4 — UI

### U1. Fix install-prompt/dock collision + iOS modal semantics
- [x] `web/components/pwa/InstallPrompt.tsx` — banner hidden on `/schedule` via `usePathname`
- [x] `web/components/pwa/InstallPrompt.tsx` — iOS guide wrapped in Radix `@/components/ui/dialog` (aria-modal, focus trap, ESC/overlay dismiss)
- [ ] Manual browser check `/schedule` with an active plan (chrome-devtools MCP not available in this env)
- [x] Gates: typecheck / lint

### U2. Token drift + detector-flagged AI-tells
- [x] `globals.css` — added `--color-amber-300/400/500` tokens; retired `premium-gradient`/`grid-pattern` utilities
- [x] `BottomTabBar.tsx` / `ItineraryFloatingDock.tsx` — `bg-[#121118]` → `bg-surface-container-low`
- [x] `EventHero.tsx` — `bg-[#100e14]` → `bg-surface-container-lowest`
- [x] `EventDetails.tsx` — `border-l-2` blockquote → `bg-primary-container/50` + `border-primary/20` token treatment
- [x] `DateRailScroller.tsx` / `MiniCalendarModal.tsx` / `EmptyScheduleState.tsx` / `CategoryEventShelf.tsx` — `text-amber-400` now resolves to `--color-amber-400` token (Tailwind v4 `@theme` override)
- [x] `CTASection.tsx` / `organizers/HeroSection.tsx` — gradient text → solid `text-primary`
- [ ] Re-run impeccable detector → 0 findings (detector not available in this env; grep confirms no `premium-gradient`/`grid-pattern`/arbitrary-hex surface leftovers)
- [x] Gates: typecheck / lint (2 pre-existing `max-w-*` guard errors in touched files, untouched by this change)

## Phase 5 — P2 / Nits

### N1. Remove duplicate manifest
- [x] Delete `web/public/manifest.json` (app/manifest.ts generates `/manifest.webmanifest`)
- [x] Verified `sw.js` + metadata reference `/manifest.webmanifest`
- [x] Gates: typecheck / lint

### N2. Consolidate duplicated date/weekend helpers
- [x] `web/lib/dates.ts` — new exports: `toDateString`, `getTodayString`, `nextFriday`
- [x] `DateRailScroller.tsx` — uses shared `toDateString`, `nextFriday`
- [x] `MiniCalendarModal.tsx` — uses shared `toDateString`
- [x] `ScheduleClient.tsx` — uses shared `getTodayString`, imports `nextFriday` (via dates.ts)
- [x] Gates: typecheck / lint

### N3. Memoize EventCard image sort
- [x] `web/components/events/EventCard.tsx` — added `'use client'` + `useMemo` for sorted images
- [x] Gates: typecheck / lint

### N4. Timezone-aware schedule filters
- [x] `web/lib/dates.ts` — new `formatEventTime`, `getHourInTimeZone` helpers using Intl with event timezone
- [x] `ScheduleClient.tsx` — time-of-day filter now uses `getHourInTimeZone(ev.start_date, ev.timezone)` (event-local hour, not viewer-local)
- [x] `ScheduleEventCard.tsx` — `formatTime` accepts `timeZone` param; `getEventStatus` accepts timezone (epoch comparison already instant-correct)
- [x] Gates: typecheck / lint (pre-existing unused-import warnings in schedule files are unrelated)

---

## Notes / verified non-issues

- admin-app `console.error` calls are server-component logging (repo convention targets client paths) — no change.
- `follows.ts` `take(10)+find` is bounded and correct (followType not in compound index) — no change.
- `auth.ts` code generation has modulo bias (`buf[i] % alphabet`) — minor, deferred.
- `getAdminInfo` bootstrap key as query arg — constant-time compare is solid; deferred.
