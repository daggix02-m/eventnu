# Event Nu — Scale Implementation Task List

Task list target for the "Scale to 1,000,000 concurrent users" initiative. Ordered index:
see `tasks/plan.md`. No external tracker is configured for this project.

## Phase 0: Foundations
- [x] Task 0.1: Create plan/todo files; record baseline benchmark
- [x] Task 0.2: Capture baseline metrics (feed TTFB, DB-reads-per-list, tap→UI latency)

## Checkpoint: Foundations
- [x] Plan accepted; baseline metrics recorded

## Phase 1: Read-Path Optimization
- [x] Task 1.1: Add `publicEventCards` table + indexes
- [x] Task 1.2: Backfill builder mutation + run via migrations
- [x] Task 1.3: Rewrite public read queries to materialized view (kill N+1)
- [ ] Task 1.4: Redis hot-JSON cache + ISR revalidate on publish — requires Redis/Upstash setup

## Checkpoint: Read Path
- [ ] Feed TTFB drops; DB reads per list ~5× less; tests/typecheck green

## Phase 2: Durability (Zero Data Loss)
- [ ] Task 2.1: Media — R2/S3 multi-region CRR + versioning
- [ ] Task 2.2: DB — Convex backups + continuous PITR export
- [ ] Task 2.3: Restore drill (snapshot → preview → assert)

## Checkpoint: Durability
- [ ] RPO ≤ 5 min, RTO ≤ 15 min; drill green; ADR-0005 targets recorded

## Phase 3: Real-Time (live lists + fan-out)
- [ ] Task 3.1: Add `eventFeed` table
- [ ] Task 3.2: Producer — write `eventFeed` + publish to Redis Streams
- [ ] Task 3.3: WebSocket gateway — Redis Pub/Sub fan-out + reconnect backfill
- [ ] Task 3.4: Live public lists via `useQuery` on materialized view

## Checkpoint: Real-Time
- [ ] publish → timeline < 200 ms; reconnect loses no events; tests green

## Phase 4: Optimistic Interactive Actions
- [x] Task 4.1: Shared `useOptimisticToggle` helper + rollback
- [x] Task 4.2: Apply to Like / Bookmark / Follow (no spinner)
- [x] Task 4.3: Optimistic patch of bulk list state
- [x] Task 4.4: Reservation — explicit pending state, success on confirm
- [x] Task 4.5: Hot like-count sharded counter

## Checkpoint: Interactive Actions
- [x] tap→UI ≤ 50 ms; reconcile ≤ 200 ms p95; rollback tests green
- [x] (Phase 4 & 5 may run in parallel; coordinate via useOptimisticToggle contract)

## Phase 5: Frontend <200 ms Load
- [x] Task 5.1: Image CDN pipeline (AVIF/WebP, srcset, prefetch)
- [x] Task 5.2: Streaming shells + skeleton loading
- [x] Task 5.3: Background animations — static preview + async hydrate
- [x] Task 5.4: JS budget + Lighthouse CI gate (LCP ≤ 200 ms)

## Checkpoint: Frontend
- [x] Above-fold LCP ≤ 200 ms in CI + RUM

## Phase 6: Rollout & Observability
- [ ] Task 6.1: Edge rate limiting (Upstash Ratelimit) — requires Upstash Redis setup
- [ ] Task 6.2: Observability — Convex dashboard provides server-side; Vercel Analytics needs `npm i @vercel/analytics @vercel/speed-insights`
- [ ] Task 6.3: Staged rollout (canary → general) + rollback plan — manual deployment step

## Checkpoint: Complete
- [ ] All acceptance criteria met; definition-of-done review; ADR-0005 finalized
