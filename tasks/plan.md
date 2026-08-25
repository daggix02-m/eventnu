# Implementation Plan: Event Nu — Scale to 1,000,000 Concurrent Users

## Overview

Event Nu is Addis Ababa's city guide (Next.js 16 consumer site + admin dashboard, backed
entirely by a shared Convex deployment in `packages/convex`). This plan scales the system
from ~10K to 1M concurrent users while keeping it read-heavy-optimized, ensuring **zero
data loss** for photos/profile data, adding **real-time** event feeds (live lists **and**
per-user fan-out), making **interactive actions** (save/like/follow/reserve) feel instant,
and achieving a **sub-200ms perceived page load**.

The guiding architectural decision (see `docs/decisions/ADR-0005-scale-architecture.md`):
**keep Convex as the source of truth and realtime engine**, and push caching, CDN, and
durability to the edge — no backend rewrite.

## Verified repo facts

- Monorepo (npm workspaces): `web` (consumer), `admin-app` (admin), `packages/convex` (Convex).
- Convex schema: `packages/convex/convex/schema.ts` (~25 tables).
- Consumer reads: `web/lib/api/events.ts` via `ConvexHttpClient` + React `cache()` + `force-cache` fetch.
- N+1 fan-out lives in `packages/convex/convex/events/enrichment.ts` (`enrichPublicEvents`).
- Interactive actions: `web/components/social/EventSocialActions.tsx` — currently awaits
  the round-trip with a spinner; **no optimistic updates** anywhere in the codebase.
- Realtime: only native Convex reactive queries in interactive components; no feed/fan-out layer.
- Storage: Convex file storage; no multi-region/PITR/CDN strategy.
- Commands (root workspace): `npm run test`, `npm run lint`, `npm run typecheck`.

## Architecture Decisions

- **Keep Convex as source of truth** — reuse its transactions, auth, reactive queries, and
  file storage. Do not rewrite the backend.
- **Edge-first read path** — public feeds served from CDN/ISR/Redis cache so cache-misses
  reach Convex; write/action mutations bypass the cache and go direct over the user's
  WebSocket for lowest latency.
- **Materialized read model** — a `publicEventCards` table eliminates the N+1 fan-out in
  `enrichPublicEvents`, making public list reads a single indexed scan and highly cacheable.
- **Dedicated realtime fan-out tier** — Redis Pub/Sub + an edge WebSocket gateway for
  per-user timeline fan-out at 1M connections; Convex stays the source of truth.
- **Optimistic UI for toggles** — like/save/follow update the UI instantly (no spinner) and
  reconcile in the background; reservation keeps an explicit pending state.
- **Zero-loss durability** — multi-region object storage (CRR + versioning) for media plus
  continuous PITR backup/export for the database, proven by a restore drill.

## Task List Target

The project has **no external tracker** designated in repo rules (no root `AGENTS.md` /
`CLAUDE.md`, no tracker config). Tasks are recorded in the default checklist file
`tasks/todo.md`. This plan is the ordered index.

## Task List

### Phase 0: Foundations
- [ ] Task 0.1: Create `tasks/plan.md` + `tasks/todo.md`; record baseline benchmark.
- [ ] Task 0.2: Capture baseline metrics (feed TTFB, DB-reads-per-list-request, button
      tap→UI latency) into `tasks/benchmark.md`.

### Checkpoint: Foundations
- [ ] Plan accepted; baseline metrics recorded.

### Phase 1: Read-Path Optimization (highest leverage)
- [ ] Task 1.1: Schema — add `publicEventCards` table + indexes `(status, startDate)` and
      `(status, isFeatured, startDate)`.
- [ ] Task 1.2: Backfill builder — internal mutation deriving `publicEventCards` from
      events/categories/images/organizers on publish/update; run backfill via `@convex-dev/migrations`.
- [ ] Task 1.3: Rewrite `getPublished` / `getFeatured` / `getByCategory` / `getSimilar` to
      read the materialized view (kill the N+1 fan-out).
- [ ] Task 1.4: Cache public reads — Redis (Upstash) hot-JSON cache + Next ISR revalidate
      on publish/update; writes stay uncached.

### Checkpoint: Read Path
- [ ] Feed TTFB drops; DB reads per list request fall ~5×.
- [ ] `npm run test`, `npm run typecheck` green.

### Phase 2: Durability (Zero Data Loss)
- [ ] Task 2.1: Media — enable R2/S3 multi-region CRR + versioning for all uploads; point
      Convex file storage at it.
- [ ] Task 2.2: DB — enable Convex production backups + continuous PITR export to cold
      storage (cross-account copy).
- [ ] Task 2.3: Restore drill — snapshot → preview → assert data back (per the `convex-backup`
      capability).

### Checkpoint: Durability
- [ ] RPO ≤ 5 min, RTO ≤ 15 min; restore drill green; targets recorded in ADR-0005.

### Phase 3: Real-Time (live lists + fan-out)
- [ ] Task 3.1: Schema — add `eventFeed` (append-only, per-user) for durable delivery + backfill.
- [ ] Task 3.2: Producer — internal mutation on publish/update writes `eventFeed` and
      publishes to Redis Streams channel `feed:{userId}`.
- [ ] Task 3.3: WebSocket gateway — edge-deployed, Redis Pub/Sub fan-out across nodes,
      reconnect backfill from `eventFeed`.
- [ ] Task 3.4: Live public lists — wire `useQuery` on the materialized view for
      home/discover/schedule.

### Checkpoint: Real-Time
- [ ] Publish → follower timeline < 200 ms; reconnect loses no events; tests green.

### Phase 4: Optimistic Interactive Actions
- [ ] Task 4.1: Shared `useOptimisticToggle` helper (optimistic cache mutation + rollback).
- [ ] Task 4.2: Apply to Like / Bookmark / Follow — no spinner, tap→UI ≤ 50 ms,
      reconcile ≤ 200 ms p95.
- [ ] Task 4.3: Optimistic patch of bulk list state (`hasLikedBulk` / `hasBookmarkedBulk`)
      to avoid re-fetch flicker.
- [ ] Task 4.4: Reservation — keep explicit "submitting…" state; success only on server confirm.
- [ ] Task 4.5: Hot like-count writes — optional Convex sharded-counter (or Redis) to avoid
      single-doc contention at 1M.

### Checkpoint: Interactive Actions
- [ ] tap→visual ≤ 50 ms; reconcile ≤ 200 ms p95; rollback-on-failure tests green.
- [ ] Note: Phases 4 & 5 can run in parallel (coordinate via the `useOptimisticToggle` contract).

### Phase 5: Frontend <200 ms Load
- [ ] Task 5.1: Image CDN pipeline — AVIF/WebP, `srcset`/`sizes`, preconnect,
      `fetchpriority=high` for hero + first 2 cards, `loading=lazy` below.
- [ ] Task 5.2: Streaming shells + skeleton loading (RSC streaming; above-fold skeleton).
- [ ] Task 5.3: Background animations — static preview frame first; GSAP/three code-split +
      async hydrate after paint; keep `prefers-reduced-motion`.
- [ ] Task 5.4: JS budget + Lighthouse CI gate (LCP ≤ 200 ms); Web Vitals instrumentation.

### Checkpoint: Frontend
- [ ] Above-fold LCP ≤ 200 ms in CI and real-user monitoring.

### Phase 6: Rollout & Observability
- [ ] Task 6.1: Edge rate limiting (Upstash Ratelimit) in middleware for anonymous/abusive traffic.
- [ ] Task 6.2: Observability — Convex Insights, Vercel Analytics, fan-out lag +
      read-amplification metrics.
- [ ] Task 6.3: Staged rollout (canary → general) + documented rollback plan.

### Checkpoint: Complete
- [ ] All acceptance criteria met; definition-of-done review; ADR-0005 finalized.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| N+1 fan-out still leaks into reads | High | `publicEventCards` materialized view removes per-event fan-out |
| Fan-out latency at 1M sockets | High | Redis Pub/Sub + horizontally scaled WebSocket gateway + reconnect backfill |
| 3D/GSAP background blocks paint | High | static preview frame + async hydrate after paint; reduced-motion kept |
| Hot like-count write contention | High | sharded counter / edge rate-limiting |
| Cache invalidation staleness | Med | invalidate on publish/update + bounded TTL fallback |
| Restore drill fails | High | proven in Phase 2 before relying on durability |

## Open Questions

- Provider/budget for the streaming/CDN layers (recommendation: Vercel + Upstash + Cloudflare/R2).
- `eventFeed` retention depth for reconnect backfill before pruning.
- Whether fan-out includes **updates** to followed/liked events, or only new publishes.
