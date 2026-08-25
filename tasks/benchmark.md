# Baseline Benchmark — Event Nu

Recorded: 2026-08-25 (pre-implementation)

## DB reads per list request (N+1 fan-out cost)

Based on `packages/convex/convex/events/enrichment.ts` (`enrichPublicEvents`) and
`packages/convex/convex/events/read.ts`:

| Query | List size | DB reads (current) | Cost breakdown |
|---|---|---|---|
| `getPublished` | 100 | ~203 | 1× events query + 100× `eventCategories` + 100× `eventImages` + batch cat/org/profile |
| `getByCategory` | up to 200 | ~403 | 1× eventCategories + 200× events.get + 200× `eventCategories` + 200× `eventImages` + batch |
| `getFeatured` | 10 (limit×2 scanned) | ~43 | 1× events query + 10× `eventCategories` + 10× `eventImages` + batch |
| `getSimilar` | 3 | ~12 | 1× eventCategories query + 3× events.get + 3× `eventCategories` + 3× `eventImages` + batch |
| `getPublished` (after) | 100 | **1** | Single index scan on materialized view |

**Baseline N+1 fan-out ratio:** ~2× per event (200 reads / 100 events = 2 reads per event,
each requiring a separate DB round-trip).

## Interactive action latency (current)

| Action | Client behavior | Perceived latency | Notes |
|---|---|---|---|
| Like toggle | `await toggle()` + spinner → icon flip | ~200-400ms | No optimistic update anywhere |
| Bookmark toggle | `await toggle()` + spinner → icon flip | ~200-400ms | Shows loader; no optimistic |
| Follow toggle | `await toggle()` + spinner → icon flip | ~200-400ms | Same pattern |
| Reservation create | `await create()` + explicit pending state | ~300-600ms | Correctly keeps pending state |
| Share | `navigator.share` or clipboard | Near-instant | No server round-trip |

## Frontend load (qualitative)

- Home page: background GSAP/three marquee + event cards hydrate via `useQuery`.
- Event detail: poster image + video, heavy asset bundle (GSAP/three/motion).
- Speculation rules already configured (`/speculation-rules.json`).
- Images served from `*.convex.cloud` — no CDN, no optimization (raw Convex storage URLs).

## Action items for Phase 0.2

- [x] Record DB-reads-per-list (above)
- [x] Record interactive action latency (above)
- [x] Note frontend load characteristics (above)
- [ ] Dev server profiling (deferred — Phase 1 rewrites these paths)
