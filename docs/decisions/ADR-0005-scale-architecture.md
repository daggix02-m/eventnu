# ADR-0005: Scale architecture — keep Convex core, push caching/CDN/durability to the edge

**Status:** Proposed
**Date:** 2026-08-25
**Deciders:** Product/engineering lead

## Context

Event Nu must scale from ~10K to **1,000,000 concurrent users** on a read-heavy consumer
site while meeting hard requirements:

- **Read-heavy**: high read-to-write ratio needs advanced caching, read replicas, and CDNs.
- **Zero data loss** for photos and profile information.
- **Real-time** event feeds — live public lists **and** per-user fan-out timelines.
- **Instant interactive actions** — save/like/follow feel immediate (optimistic UI).
- **<200 ms perceived page load** including heavy images and background animations.

The current backend is a single Convex deployment (`packages/convex`) consumed by both
`web` (Next.js 16) and `admin-app`. Public reads go through `ConvexHttpClient` with
`force-cache` + React `cache()`; interactive actions await round-trips with spinners and
no optimistic updates; there is no feed/fan-out layer and no multi-region/PITR/CDN strategy.

The key question: rewrite the backend for scale, or keep Convex and optimize the edges?

## Decision

**Keep Convex as the source of truth and realtime engine.** Add the following around it,
without replacing it:

1. **Materialized read model** — a `publicEventCards` table derived from canonical tables on
   publish/update, so public list reads are a single indexed scan (eliminates the N+1
   fan-out in `events/enrichment.ts`).
2. **Edge-first read cache** — CDN (images/static) + Next ISR + Redis (Upstash) hot-JSON
   cache for public feeds. Write/action mutations bypass the cache and go direct over the
   user's WebSocket for lowest latency.
3. **Durability** — Convex production backups + continuous PITR export to cold storage
   (cross-account), and R2/S3 multi-region CRR + versioning for media. Proven by a restore
   drill (RPO ≤ 5 min, RTO ≤ 15 min, zero acknowledged-write loss).
4. **Realtime tier** — a dedicated edge WebSocket gateway + Redis Pub/Sub for per-user
   timeline fan-out at 1M connections, with an append-only `eventFeed` table for durable
   delivery and reconnect backfill. Convex stays the source of truth.
5. **Optimistic interactive actions** — a shared `useOptimisticToggle` helper applies
   optimistic cache updates (no spinner) for like/save/follow; reservation keeps an explicit
   pending state.
6. **Frontend performance** — image CDN pipeline, RSC streaming + skeletons, static preview
   frame + async hydrate for background animations, JS budget, and a Lighthouse CI gate
   (LCP ≤ 200 ms).

Rejected alternatives:

- **Full custom backend** (Postgres + Redis + WebSockets + object storage): maximum control
  but a full rewrite that discards Convex's transactional correctness, realtime sync, and
  operational simplicity. Declined — disproportionate cost and risk.
- **Migrate the read path fully off Convex** to self-managed read replicas/materialized
  feeds: more control over read scaling, but duplicates the write path and adds operational
  surface. Declined in favor of Convex read replicas + materialized view + edge caches.

## Consequences

- Convex remains the single source of truth; replicas and caches are read-only derivations,
  so no second-write-path integrity risk.
- `publicEventCards` and `eventFeed` are derived data (regenerable caches), not new sources
  of truth — safe to rebuild.
- Public read load on Convex drops by roughly 2–3 orders of magnitude via the edge caches.
- Fan-out at scale is absorbed by the horizontally scalable WebSocket/Redis tier rather than
  Convex's per-subscription sync.
- Durability targets (RPO/RTO) are measurable and proven by a restore drill before launch.
- Dependency on managed providers (Vercel, Upstash, Cloudflare/R2) increases; cost and
  vendor lock-in are the primary trade-offs.
