# ADR-0003: Backend stays on TypeScript/Convex

**Status:** Accepted
**Date:** 2026-08-14
**Deciders:** Engineering

## Context

The `backend` column in `REFACTORING.md` suggested investigating Go for
operations-heavy tasks (reservation counting, moderation reports, analytics).
Convex's reactive model, TypeScript type safety, and the `@convex-dev`
ecosystem provide:

- One language across fullstack (next/shared libs)
- Declarative indexes and live queries
- Built-in rate limiting, storage, scheduling

## Decision

Keep the backend in TypeScript/Convex. No Go runtime or micro-service
will be introduced.

## Rationale

1. **Type safety**: Convex's `tsc` catches most bugs before deploy.
2. **Reactive queries**: Live updates without manual websockets.
3. **Ecosystem**: `@convex-dev/auth`, `@convex-dev/rate-limiter`, etc.
4. **Operational simplicity**: Single deployment pipeline.

## Consequences

- All moderation, analytics, and counting logic stays in Convex.
- Future performance work uses denormalized counters and staged indexes.