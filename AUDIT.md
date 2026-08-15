# Technical Audit & Gap Analysis — EventNu

**Date:** 2026-08-03
**Scope:** `web/` (public discovery site), `admin-app/` (admin dashboard), and the shared Convex backend `web/convex/`
**Stack:** Next.js 16.2, React 19.2.4, Tailwind 4, Convex `^1.42.3` (`@convex-dev/auth ^0.0.94`), deployment `dev:shocking-parakeet-484`

Both apps are Next.js App Router projects consuming a **single shared Convex backend** (`web/convex`). `admin-app` imports the shared backend via cross-package imports of `../../../web/convex/_generated/api` (enabled by `turbopack.root` in `admin-app/next.config.ts:5-7`).

---

## 1. Executive Summary

Three critical findings dominate the audit:

1. **Admin role is enforced nowhere.** `role: "admin"` is written but never checked — any authenticated user can perform every moderation, CMS, and destructive action.
2. **`admin.createAdminUser` is a public, unauthenticated action** that mints admin accounts — full privilege escalation for anyone with the deployment URL.
3. **Sensitive reads are unauthenticated and client-trusted identity fields abound** — PII (emails, phone numbers, support tickets) is exposed via queries callable from any browser client.

On top of these, pagination is fake across both apps (page 2+ shows identical data), the Convex data layer performs unbounded table scans, and the platform's core revenue loop (reservations → payments → ticketing) is unimplemented despite being partially modeled and aggressively marketed.

---

## 2. Security

### 2.1 CRITICAL — Admin role is enforced nowhere (backend)

`role: "admin"` is defined (`web/convex/schema.ts:10`) and written (`web/convex/admin.ts:34`), but a grep for `role ===` across all of `web/convex/` returns exactly **one** match — a stats counter (`web/convex/profiles.ts:47`). Every "admin" mutation guards only with `getUserIdentity()` (i.e., "any logged-in user"):

| Function | File:Line |
|---|---|
| `events.create / update / deleteEvent / updateStatus / feature / unfeature` | `events.ts:246, 360, 404, 417, 433, 446` |
| `profiles.updateProfile / suspend / unsuspend` | `profiles.ts:60, 74, 83` |
| `reports.dismiss / actionReport / warnUserFromReport / suspendUserFromReport / hideEventFromReport / deleteCommentFromReport` | `reports.ts:52, 61, 70, 85, 94, 103` |
| `categories.create / update / remove / reorder` | `categories.ts:58, 82, 96, 108` |
| `cms.createPage / updatePage / deletePage / createAnnouncement / updateAnnouncement / deleteAnnouncement / markContactResolved` | `cms.ts:51, 79, 93, 128, 154, 168, 200` |
| `hosts.create / update / updateStatus / remove` | `hosts.ts:56, 91, 105, 114` |
| `organizers.create / update / verify / unverify` | `organizers.ts:60, 89, 109, 124` |
| `notifications.send / sendBatch / markAllRead` | `notifications.ts:35, 57, 75` |
| `features.update` | `features.ts:39` |
| `instagram.setSyncEnabled / setAutoPublish / disconnect / publishToInstagram` | `instagram.ts:191, 202, 213, 289` |

**Implication:** any authenticated user of the deployment can take every moderation, CMS, and destructive action.

### 2.2 CRITICAL — Public admin-provisioning action

`admin.createAdminUser` (`web/convex/admin.ts:6-23`) is an exported **action with no auth check** that calls `createAccount` and mints a `role: "admin"` profile. Anyone with the Convex deployment URL can self-provision an admin account. It must become internal/script-only or be gated behind an existing-admin check. **FIXED (2026-08-03):** `createAdminUser` is bootstrap-only — errors out if an admin profile already exists, so it can no longer mint additional admins after initial provisioning.

### 2.3 CRITICAL — Unauthenticated sensitive reads (PII / internal data)

Queries with no identity check, callable from any browser client:

- `profiles.list` returns all user emails (`.take(200)`, `profiles.ts:24-38`); `profiles.getById`, `getUserWithCounts` leak `email` / `authUserId` / `role`
- `cms.getContactSubmissions` (`cms.ts:174`) — contact-form names/emails; `cms.getPages` returns unpublished pages + raw `bodyHtml`
- `events.list` streams drafts + `adminNote` (`.take(1000)`); `events.getById` returns any event regardless of `status`; `events.getPendingReview` (`events.ts:191`) — **FIXED (2026-08-04):** `events.getById` (`events.ts:214`) now calls `requireAdmin` first; `events.list`/`getPendingReview` were already gated. (Draft+`adminNote` streaming via `events.list` was already resolved when `list` became admin-only.) Only the admin-app calls `getById` (`admin-app/src/lib/actions/events.ts:85`).
- `reports.getTargetPreview` (`reports.ts:30`) — full target documents; `moderation.*` full logs; `analytics.*` platform-wide metrics; `reservations.getByEvent` names/emails; `support.list/getById` tickets by arbitrary `adminId`; `notifications.list` any user's inbox; `hosts.list/getById` `contactEmail` + `contactPhone` — **FIXED (2026-08-04):** `hosts.list` (`hosts.ts:10`) and `hosts.getById` (`hosts.ts:26`) now `requireAdmin` (PII `contactEmail`/`contactPhone` no longer reachable from any browser client; admin-app is the only caller). All other §2.3 functions were already gated.

### 2.4 CRITICAL — Client-trusted identity fields

Mutations accept `userId`, `followerId`, `profileId`, `organizerId`, `adminId` from the client and never cross-check against `getUserIdentity()`:

- `comments.create/remove` (`comments.ts:25-48`) — post/delete as anyone
- `likes.toggle` (`likes.ts:26`), `follows.toggle` (`follows.ts:25`)
- `profiles.updateProfile / suspend / unsuspend` (`profiles.ts:52-87`)
- `notifications.markAllRead`, `support.create` (forges `adminId`), `moderation.logModerationAction` (no auth at all)

Identity lookup also uses `identity.subject` with an `as any` cast (`profiles.ts:11`, `events.ts:311`) instead of `tokenIdentifier` — fragile per Convex guidelines (`web/convex/_generated/ai/guidelines.md:212`). **FIXED (2026-08-04):** `web/convex/helpers.ts:11` now resolves the stable user id via `getAuthUserId` from `@convex-dev/auth/server`. Note: `identity.subject` for this provider is `userId|sessionId` (per-session) and `tokenIdentifier = iss|sub` embeds the session id, so it is **not** a stable per-user key here — `getAuthUserId` (which returns `subject.split("|")[0]`, the `users`-table id matching `profiles.authUserId`) is the canonical identifier. No backfill was needed.

### 2.5 HIGH — Open redirect + unauthenticated Instagram connect

`web/convex/http.ts:92-131` accepts any `state` value starting with `https://` and 302-redirects there — open redirect. `instagram.completeConnect` (`instagram.ts:220`) has no auth and never validates `state`, so anyone can hijack the single shared Instagram connection. (Webhook POST auth is correctly implemented — HMAC constant-time compare at `http.ts:12-41`.) **FIXED (2026-08-04):** new admin-gated `instagram.startConnect` mutation mints a CSRF `state` (random UUID, 10-min TTL, one-time consume) persisted in a new `instagramConnectStates` table bound to `adminId`; `completeConnect` validates + consumes it before exchanging the code and stamps `adminId` on the connection; `http.ts` redirects only to `env.ADMIN_APP_URL` (strict `http(s)` origin parse, fixed `/settings` path) — no client-supplied redirect target, so the open redirect is gone.

### 2.6 HIGH — Admin-app role gate is authentication-only

`admin-app/src/proxy.ts` (`convexAuthNextjsMiddleware`) allows any authenticated user into `(app)/`; no role check. Every page passes `adminId={null as any}` (17 call sites) and server actions discard it. The support module is non-functional as a result (`support.ts` action returns `[]` always). **FIXED (2026-08-03/04):** `proxy.ts` remains middleware, and the real role gate now lives in `admin-app/src/app/(app)/layout.tsx` — `getCurrentAdminProfile()` (a session action backed by `requireAdmin`) → `notFound()` for non-admin/suspended; support module reworked; `adminId` no longer client-supplied.

### 2.7 MEDIUM — Frontend gaps

- **Stored XSS:** ~~`web/app/info/[slug]/page.tsx:51` renders CMS `page.body_html` via `dangerouslySetInnerHTML` with no sanitizer~~ **FIXED (2026-08-03):** sanitized via `isomorphic-dompurify` (`web/lib/sanitize.ts`).
- **No CSP / HSTS / Permissions-Policy** — **FIXED (2026-08-03):** CSP added to `web/next.config.ts` and `admin-app/next.config.ts` (script-src unsafe-inline/-eval in dev; img/connect-src allow convex + Google hosts; object-src 'none'). **FIXED (2026-08-04):** `Strict-Transport-Security` (max-age=31536000; includeSubDomains) and `Permissions-Policy` (camera/microphone/geolocation off) added to both apps' `headers()`.
- **No rate limiting anywhere** — **FIXED (2026-08-03/04):** `@convex-dev/rate-limiter` applied to likes/follows/comments/contact/reservations/reports + upload URL minting (`web/convex/rateLimiter.ts`).
- `events.generateUploadUrl` (`events.ts:184`) mints storage upload URLs unauthenticated — **FIXED (2026-08-03):** now requires a signed-in profile and is rate-limited.
- **No `middleware.ts`** in `web`; no sitemap despite `robots.txt:4` advertising one — **FIXED (2026-08-03):** `app/sitemap.ts` added (static + events + categories + CMS pages); web has no auth-needing middleware so none added.
- `NEXT_PUBLIC_SITE_URL` referenced (`web/app/layout.tsx:29`) but never declared — **FIXED (2026-08-04):** `metadataBase` now falls back to `https://eventnu.et` when the env var is unset.
- Env-name mismatch: `instagram.ts:17-20` reads `env.CONVEX_SITE_URL` but web env declares `NEXT_PUBLIC_CONVEX_SITE_URL` → OAuth `redirect_uri` silently breaks. **RESOLVED (2026-08-03):** `CONVEX_SITE_URL` is a built-in Convex env var in actions — reading it server-side is correct; the client-side `NEXT_PUBLIC_CONVEX_SITE_URL` is unrelated.

### 2.8 Positive findings

- All functions use Convex `v` validators.
- Webhook HMAC is constant-time; IG tokens AES-GCM encrypted server-side (`instagram.ts:65-88`).
- Admin-app sets `X-Frame-Options: DENY`; no secrets found in client components; all `target="_blank"` links carry `rel="noopener noreferrer"`.

---

## 3. Performance

### 3.1 CRITICAL — Fake pagination (both apps)

- `events.list` (`web/convex/events.ts:161-211`): accepts `paginationOpts` but never calls `.paginate()` — uses an offset slice over `.take(1000)`. **Page 2+ was identical to page 1 (fixed earlier);** `continueCursor` is still a dummy `""`. `admin-app/src/components/EventsClient.tsx:363-390` renders a pager. **Decision (2026-08-04):** keep offset pagination — `numItems` now clamped to `[1, 50]`, `page` ≥ 1; `.take(1000)` cap remains accepted.
- `getUsers` (`admin-app/src/lib/actions/users.ts:8-26`), `getHosts`, `getOrganizers`, `getReports` all skip pagination too.

### 3.2 HIGH — Unbounded scans / over-fetch

- `events.list` / `events.getStats`: `.take(1000)` full scans per call; `analytics.getStats` reads ~4,000 docs; `analytics.getWeekly` reads 2 × 2000.
- Homepage renders **up to 100 full event docs** (`events.ts:39`) with images/categories embedded; `getSimilar` does `.take(50)` to return 3; `getByCategory` `.take(200)`.
- `likes.countByEvent` rescans `.take(500)` instead of reading denormalized `events.likeCount`; counts cap at 500 (wrong past 500).
- `reservations.create` scans `.take(500)` for a limit check with a **TOCTOU race** (oversell possible). **RESOLVED (2026-08-04):** no code change needed — Convex mutations run under serializable isolation with automatic retry on write-write conflicts, so a concurrent read-check-increment on the same `events` doc cannot oversell; the retried mutation re-reads the incremented count and throws "Reservation limit reached".
- `hosts.followerCount` / `organizerProfiles.followerCount` set to 0 and **never updated by `follows.toggle`** (`follows.ts:25-50`) — permanently stale counters. **FIXED (2026-08-04):** `follows.toggle` now increments on follow / floor-0 decrements on unfollow for `followType` `"host"` (→ `hosts`) and `"organizer"` (→ `organizerProfiles`) in `web/convex/follows.ts:29-41`.

### 3.3 HIGH — N+1 / heavy fan-out in admin

- `getNotifications` (`admin-app/src/lib/actions/notifications.ts:13-18`) loops up to 200 profiles issuing a `notifications.list` query **per user**. **FIXED (2026-08-03):** single `notifications.listAll` call (deduped, 300-bound) with the profile embedded server-side.
- `(app)/layout.tsx:10` fires `getDashboardStats()` on **every route change** → ~4,500 Convex doc reads per navigation. **FIXED (2026-08-03):** layout now calls only `getCurrentAdminProfile()`; dashboard stats moved out of the per-navigation path.
- Per-row enrichment N+1 in `events.list`, `reports.list`, `moderation.getRecent`.

### 3.4 MEDIUM — Frontend rendering

- **Three.js pixel shader (`PixelBlast`)** — **FIXED (2026-08-03):** `SiteBackground` moved out of the root layout into the homepage (`app/page.tsx`), so it renders on `/` only.
- `TopNav.tsx:23-27` — **FIXED (2026-08-03):** scroll listener is now rAF-throttled and `passive`.
- `FeaturedCarousel.tsx` mounts all slides' `<Image fill>` simultaneously with two `setInterval`s + global keydown. **PARTIAL (2026-08-04):** global keydown scoped to the carousel element (focus-only); hidden-dots a11y bug fixed. Auto-advance intervals remain (they pause on reduced-motion / user pause).
- `OrganizersHero/Testimonials` auto-rotate — **FIXED (2026-08-03):** now respect `prefers-reduced-motion` via new `web/lib/usePrefersReducedMotion.ts` (FeaturedCarousel already checked). `StatBand`/`AnimatedCounter` are gsap-driven, not re-audited this pass.
- `EventGallery.tsx:30-37`, `EventPhotoGrid.tsx:39-48` attach global `window` keydown handlers. **FIXED (2026-08-04):** `EventGallery` keydown scoped to the gallery element (and disabled when ≤1 image); `EventPhotoGrid` already scoped to the open lightbox.
- Per-keystroke server round-trips on admin search (`EventsClient.tsx:90-94`) — no debounce. **FIXED (2026-08-03/11):** TanStack Query + 400ms debounce in `EventsClient`; all list pages now read through `src/lib/api/*` hooks (Phase 2.2).
- `web/app/about/AboutContent.tsx` and `CategoryBentoCard.tsx` are `"use client"` with zero interactivity (needless client runtime).
- `CategoryBentoCard` uses CSS `backgroundImage` instead of `next/image` (no caching/LCP hints).

### 3.5 Index coverage gaps (`web/convex/schema.ts`)

- `events.categoryIds` is an unbounded array → category filters can't use an index (`events.ts:96-108`); needs an `eventCategories` join table.
- Missing compound indexes: `["userId","eventId"]` (likes toggle), `["userId","read"]` (unread count), `["followerId","followingId"]` (follows), `["organizerId","status"]` / `["hostId","status"]` (listings), `["targetType","targetId"]` (moderation), `["verified"]` (organizers), `["userId"]` on comments.
- Dead/unused indexes: `by_start_date`, `by_ig_user`, `by_parent`, `hosts.by_slug/by_status`, `notifications.by_read`, `reports.by_target`, `featuredSections.by_slug`.
- `moderation.getByTarget` (`moderation.ts:58-75`) uses index `by_admin` with **no predicate** → arbitrary 100-row window, wrong results.
- `Date.now()` in queries (`events.ts:205`, `analytics.ts:31`, `cms.ts:102`) breaks query-cache reuse; `cms.getActiveAnnouncements` never actually filters on `startsAt`/`endsAt`.

### 3.6 Dead weight

- **RESOLVED (2026-08-03):** removed `framer-motion`, `date-fns` (web) and `zustand` (admin-app) deps; deleted `web/components/event-discovery/*`, `web/types/event-discovery.ts`, `BrandHero.tsx`, `getEventDiscoveryPage` (convex `events.ts` + `lib/api/events.ts`), `admin-app/src/store/guestStore.ts`, and both unused `EventCard.tsx` components (admin-app + `company-design-system` barrel). Note: `three`/`postprocessing` are **not** dead — used by `PixelBlast.jsx` (the site background).

---

## 4. Functionality & Integrations

### 4.1 Working integrations

- **Instagram** (fully built, `web/convex/instagram.ts`, 714 lines): OAuth connect, AES-GCM encrypted long-lived tokens, publish single/carousel, webhook media processing, token-expiry cron, admin sync UI + `PublishToInstagramDialog`.
- **Media upload** to Convex storage (max 10 images, enforced both sides).
- **CMS** (pages, announcements, contact inbox), **reports/moderation workflow**, **notifications** (targeted + broadcast) — all backend-complete.

### 4.2 Broken / stubbed features

- **Bulk Publish / Bulk Reject** buttons have no `onClick` (`EventsClient.tsx:194-195`) — dead UI. **FIXED (2026-08-03):** wired — `handleBulkAction` → `events.bulkUpdateStatus` over selected ids.
- **Support module non-functional** (`adminId` null → `[]`). **FIXED (2026-08-03):** reworked — admin identity derived server-side.
- **Password change / reset**: "not yet available" stubs (`admin-app/src/lib/actions/users.ts:82`, auth pages).
- **`actionReport` drops its `action`/`note` args** (`admin-app/src/lib/actions/reports.ts:39-42`) → moderation history records nothing. **FIXED (2026-08-04):** `reports.actionReport` now accepts `action`/`note`, writes a `moderationLogs` row (adminId from `requireAdmin`), and the admin action forwards them.
- **Bookmark button** on `web/components/events/FeaturedCarousel.tsx:170-176` has no handler. **FIXED (2026-08-04):** removed — no bookmark feature exists (dead UI).
- **Organizer card** — **FIXED (2026-08-03):** `events.getBySlug` embeds the organizer profile via `enrichEvent` (`organizerId` → `profiles`); `mapEvent` maps it to the `Profile` shape. Card renders on the detail page whenever an event has `organizerId` set.
- **`/discover` redirect drops filters** — `web/app/page.tsx` ignores `searchParams`. **FIXED (2026-08-04):** `/discover` still preserves the query string, and the homepage now honors `?q=&category=&date=` to seed the discover filters.
- Hardcoded 2026 sample data + fabricated testimonials in `web/components/organizers/*` marketing sections.
- **No login/signup UI** on the public site despite full `@convex-dev/auth` stack installed.

### 4.3 Missing integrations (biggest functional gaps)

1. **Payments / ticketing** — **PARTIAL (2026-08-03):** `ReservationForm` UI (name/email/message → `reservations.create`) now renders for `action_type === "reservation"` events on the detail page. Real payment providers (Telebirr/CBE Birr/Chapa) still absent.
2. **Email / transactional notifications** — `notifications.ts` writes to Convex only; no SES/SMTP/resend; no ticket confirmations or reminders.
3. **Calendar export** — **DONE (2026-08-03):** "Add to Calendar" downloads an `.ics` from the event info card (`EventInfoCard`).
4. **Maps / geocoding** — **DONE (2026-08-03):** `EventInfoCard` embeds Google Maps (`maps.google.com/maps?q=…&output=embed` from lat/lng or address) + "Open in Maps" link; CSP `frame-src` updated.
5. **Analytics tooling** — no GA/Plausible/Vercel analytics on the public site.
6. **Search** — client-side only, no debounce, no URL state.
7. **SEO plumbing** — **PARTIAL (2026-08-03):** `app/sitemap.ts` (static + events + categories + CMS pages) and JSON-LD `Event` schema on event detail pages added. `metadataBase` still falls back to `localhost` unless `NEXT_PUBLIC_SITE_URL` is set in production env.
8. **QR check-in / door scanning**, push notifications, payouts — marketed (`CheckinShowcase`, `HowItWorks`, `FAQSection`) but unimplemented.
9. **Admin** — no role management UI, no CSV export, no true bulk ops, incomplete audit trail (only `events.create` writes a moderation log), no payout/reservation-management screens.

### 4.4 Accessibility (web)

- Unlabeled search input (`SearchBar.tsx:18-24`). **FIXED (2026-08-04):** `aria-label="Search events"` added.
- No `aria-pressed` on filter pills (`SearchBar.tsx:39-109`). **FIXED (2026-08-04):** `aria-pressed` added to category + date pills.
- Mobile drawer links focusable while `aria-hidden` and no focus trap/Escape (`TopNav.tsx:91`). **FIXED (2026-08-04):** drawer now uses `inert` when closed, `role="dialog"`/`aria-modal` when open, Escape-to-close + focus on the close button + body scroll lock.
- Buttons inside `aria-hidden` dots container (`FeaturedCarousel.tsx:228-241`). **FIXED (2026-08-04):** `aria-hidden` removed, `aria-current` added to the active dot.
- Global arrow-key hijacking on 3 components (carousel, gallery, photo grid). **FIXED (2026-08-04):** all keydown handlers scoped to their owning element/open dialog.
- Testimonial `<div onClick>` without keyboard support (`OrganizersTestimonials.tsx:88-123`) — **FIXED (2026-08-03):** `role="button"`, `tabIndex`, Enter/Space handler.
- Duplicate ENDED badge block (`EventHero.tsx:44-64`) — **FIXED (2026-08-03)**.
- Positives: `SkipLink` wired to `#main-content`; `EventPhotoGrid` has a proper focus-trapped lightbox with focus restore.

---

## 5. Recommended Remediation Roadmap

### P0 — Fix first (privilege escalation + data leaks)

1. Add a `requireAdmin(ctx)` helper (lookup profile by `tokenIdentifier`, check `role === "admin"`) and apply to every mutation/query in §2.1 and §2.3. Replace `identity.subject` with `tokenIdentifier`; enforce unique `profiles.authUserId`. **— DONE (2026-08-04):** `requireAdmin` applied across §2.1/§2.3 (re-verified 2026-08-04 via grep audit of all modules); identity lookup uses `getAuthUserId` (see §2.2 note — `tokenIdentifier` is per-session here). Uniqueness of `profiles.authUserId` is **accepted risk** — Convex has no unique constraint; the `by_auth_user` index is non-unique, but lookup is deterministic via `getAuthUserId` and profile creation is self-scoped, so a duplicate row would require a deliberate concurrent exploit, not a client error.
2. Delete or gate `admin.createAdminUser` behind existing-admin auth; move initial provisioning to a `convex dev` script / server-side bootstrap.
3. Stop trusting client IDs: derive identity server-side; add ownership checks in `comments`, `likes`, `follows`, `profiles.updateProfile`, `notifications.markAllRead`.
4. Auth-gate + field-project all sensitive reads (never return `email`, `adminNote`, `contactPhone`, or drafts to unauthenticated callers); make `events.getById`/`getPendingReview`, `cms.getPages` admin-only. **— DONE (2026-08-04):** final §2.3 stragglers gated — `events.getById` (`events.ts:214`) and `hosts.list`/`getById` (`hosts.ts:10,26`).
5. Close the open redirect (`http.ts:100` → exact-match allowlist + CSRF-safe `state`); require identity in `completeConnect`; constant-time token compare.

### P1 — Integrity + performance

6. Fix pagination: real `.paginate()` with prefixable indexes in `events.list` + all admin list queries.
7. Replace `events.categoryIds` with an `eventCategories` join table; add compound indexes from §3.5; fix `moderation.getByTarget` index and `getActiveAnnouncements` time filter; move `Date.now()` out of queries. **— DONE (2026-08-03):** join table + compound indexes in schema; moderation + announcements reworked.
8. Make `follows.toggle` maintain `followerCount`; read `likeCount` instead of rescans; fix reservation oversell atomically; cascade-clean orphans on `deleteEvent` (incl. `ctx.storage.delete`). **— DONE (2026-08-04):** followerCount maintained (`follows.ts`); `likes.countByEvent` reads `likeCount`; reservation limit safe under Convex serializable retry; `deleteEvent` cascades + cleans storage.
9. Add `@convex-dev/rate-limiter` to likes/follows/comments/contact/reservations/reports; gate `generateUploadUrl` behind auth. **— DONE (2026-08-03/04):** `web/convex/rateLimiter.ts` applied; upload URL gate in place.
10. Admin app: extend `proxy.ts` to verify admin role; kill the per-navigation stats fetch + per-user notification N+1; actually use TanStack Query; debounce search; wire bulk actions; forward real admin identity. **— DONE (2026-08-03/04):** role gate in `(app)/layout.tsx`; stats moved off the nav path; `listAll` single query; TanStack Query + 400ms debounce in `EventsClient`; bulk publish/reject wired; admin identity derived server-side.

### P2 — Product completeness

11. Sanitize CMS HTML (DOMPurify) before `dangerouslySetInnerHTML`; add CSP. **— DONE (2026-08-03)**
12. Restrict the Three.js background to the homepage; throttle `TopNav` scroll; respect reduced-motion everywhere. **— DONE (2026-08-03)**
13. Ship the missing revenue/user loops: reservations + payment UI, transactional email, calendar export, map embed, sitemap + JSON-LD, public auth UI. **— PARTIAL (2026-08-03):** calendar export, map embed, sitemap + JSON-LD, and reservation UI done. Remaining: real payment provider, transactional email (needs Resend key), public auth UI, QR check-in.
14. Delete dead code (`event-discovery/*`, `BrandHero`, `framer-motion`, `date-fns`, `guestStore`). **— DONE (2026-08-03)**

---

## 6. Appendix — Dead code & cleanup inventory

| Item | Location | Action |
|---|---|---|
| `components/event-discovery/*` (10 files + `types/event-discovery.ts`) | `web/components/event-discovery/` | **DONE (2026-08-03)** |
| `BrandHero.tsx` | `web/components/events/BrandHero.tsx` | **DONE (2026-08-03)** |
| `getEventDiscoveryPage` (frontend + backend) | `web/lib/api/events.ts:171`, `web/convex/events.ts:110` | **DONE (2026-08-03)** |
| `framer-motion` | `web/package.json:19` | **DONE (2026-08-03)** |
| `date-fns` | `web/package.json:18` | **DONE (2026-08-03)** |
| `OrganizerCard` (always `null`) | `web/components/events/OrganizerCard.tsx`, `web/lib/api/events.ts:59` | **DONE (2026-08-03)** — wired real data |
| Duplicate badge overlay | `web/components/events/EventHero.tsx:44-64` | **DONE (2026-08-03)** |
| `guestStore` | `admin-app/src/store/guestStore.ts` | **DONE (2026-08-03)** |
| `company-design-system` ships source TS | `admin-app/company-design-system/package.json:6` | Add build step or inline |

---

## 7. Updates — Completed items since initial audit (2026-08-03 → 2026-08-14)

### Security
- Internalized `email.ts` actions (`sendReservationConfirmation` / `sendAdminAlert`) and `getReservation`, `getEvent`, `getAdminEmails` queries (`internalAction` / `internalQuery`); `reservations.ts` schedules via `internal.email.*`.
- Deleted `verifyPassword` oracle (`packages/convex/convex/verifyPassword.ts`); removed sign-in pre-check in `auth/sign-in/page.tsx`; mapped `InvalidSecret` in `describeSignInError`; fixed static import for `changePassword`.
- Public event queries now return a filtered "public projection" (adminNote, email, etc. stripped). See `packages/convex/convex/events/enrichment.ts:enrichPublicEvent`.
- `getPageBySlug` enforces `isPublished` guard for unauthenticated cms page requests.
- Organizing user’s email and auth identifiers are **not exposed** in the public API.

### Performance & Bootstrap Hardening (A4)
- Added `eventShares` and `experiencePosts` to `ALL_TABLES` in `admin.ts:10-43` (32 total tables wiped cleanly).
- `getAdminInfo` and `instagram.connect.listAdmins` now use `withIndex('by_role')` instead of full table scans.
- `validateBootstrapKey` uses constant-time byte-by-byte comparison (`constantTimeEquals`) to prevent timing attacks.

### Identity Scoping (A5)
- `adminSettings.getByAdmin` and `adminSettings.upsert` derive `adminId` from the authenticated caller (`requireAdmin`). Client no longer passes identity as argument.
- `profiles.updateProfile` enforces non-admin email patch guard (`if (profile.role !== 'admin' && fields.email !== undefined)`).
- `reports.getTargetPreview` and `reports.list` validate `targetType` against literal unions (`'event' | 'host' | 'user' | 'comment'`).

### Validator Hardening (A6)
- `events.write.create/update`: `actionType` and `status` args now use union literals matching the schema, preventing invalid values.
- `comments.create`: `content` length validated (1-5000 chars).
- `reservations.create`: `name` (1-200), `email` (1-254), `message` (0-optional, trimmed) validated.
- `reservations.updateStatus`: `status` is now a union literal.
- `follows.toggle`: `followType` is now `'host' | 'organizer'` union with safe cross-table casts in `adjustFollowerCount`.
- `cms/contact.ts/submitContact`: input length validation added.

### Documentation (A7)
- ADR-0003 created: **Backend stays on TypeScript/Convex** (no Go decision documented in `docs/decisions/ADR-0003-no-go.md`).
