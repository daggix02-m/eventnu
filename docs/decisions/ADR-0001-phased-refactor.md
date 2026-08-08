# ADR-0001: Phased refactor of the admin platform

**Status:** Accepted
**Date:** 2026-08-08
**Deciders:** Product/engineering lead

## Context

The `admin-app` dashboard and the shared Convex backend (`web/convex/`) carry significant
maintainability, typing, and performance debt (see `AUDIT.md` and `REFACTORING.md`):

- 165 `any` casts concentrated in the server-action layer.
- Six copy-pasted list clients; oversized components (`EventForm.tsx` 793 lines).
- Oversized backend modules (`events.ts` 635, `instagram.ts` 786) with duplicated helpers.
- No formatter, no tests, no CI, no pre-commit hooks.
- A large uncommitted working tree (103 modified / 24 deleted / 49 untracked) containing
  the uncommitted `AUDIT.md` security fixes — refactoring on top of it risks losing work.

## Decision

Proceed with the phased roadmap in `REFACTORING.md`:

1. **Phase 0** — commit a baseline checkpoint of the current working tree; seed an ADR log
   and PR/commit conventions; adopt incremental, reviewable PRs thereafter.
2. **Scope** — `admin-app` **plus** the shared Convex backend together (admin's type/API
   problems originate in the cross-app codegen coupling).
3. **Test depth (first pass)** — Vitest covering pure logic + the two critical flows
   (`EventForm`, `EventsClient`) + shared data-table primitives; Convex backend
   integration tests deferred to a later cycle.
4. **Principles** — "speed is the product" must never regress on the create→publish path;
   product content truth (statuses, ownership, categories, media, pricing) is preserved;
   Convex AI guidelines override training-data assumptions.

## Consequences

- Every phase lands as small PRs instead of one mega-diff, keeping reviews and rollback cheap.
- The baseline commit freezes the current (working) state so later phases are reversible.
- Test coverage grows behind the refactors, using the extracted helpers/primitives as seams.
- A rejected alternative was to scope refactoring to `admin-app` only; this was declined
  because the `any`-cast root cause (cross-app Convex codegen import) lives at the boundary,
  and backend pagination (AUDIT §3.1) cannot be fixed from the admin side alone.
