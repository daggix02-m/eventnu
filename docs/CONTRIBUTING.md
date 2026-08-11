# Contributing — EventNu

How to make changes that get reviewed and merged cleanly. Applies to `admin-app/`,
`web/`, and `packages/convex/`.

## Working model

- **Small, reviewable PRs.** The refactor is executed as incremental phases
  (see `REFACTORING.md`); land changes at phase/item boundaries, never a giant dump.
- One logical change per commit; commit at phase/item boundaries, never mixed.
- Open a PR to `main` per logical change. Keep the PR description to: what, why, and
  how you verified it.

## Before you start

1. `npm install` at the repo root (workspaces install everything).
2. Read `docs/CONVENTIONS.md` for code style and the server/client boundary, and
   `admin-app/AGENTS.md` for the Convex rules if you touch Convex or anything that
   consumes it.
3. If you change the Convex backend or its consumers, run `npm run convex:codegen`
   afterwards and commit the `_generated/**` diff (CI fails on drift).

## Quality gates

Every PR must be green on all five gates before merge. CI runs them on every PR
(`.github/workflows/ci.yml`); pre-commit runs lint + format on staged files.

```bash
npm run lint          # ESLint — no-explicit-any and no-unused-vars are errors
npm run typecheck     # tsc --noEmit across all three workspaces
npm run format:check  # Prettier --check from repo root
npm test              # vitest in admin-app + packages/convex
npm -w admin-app run build && npm -w web run build   # next build
```

Knip (`npm run knip` in each workspace) must stay clean for dead-code / unused deps.

## Commit conventions

Conventional commits, lowercase. Scope = `web`, `admin-app`, `convex`, or repo-wide
(omitted).

```
feat(admin-app): add bulk status change to events list
fix(convex): gate hosts.getStats behind requireAdmin
refactor(web): use shared slugify from helpers
chore: bump prettier to 3.9
docs: add architecture map
test(admin-app): cover mappers with null-default cases
```

- No `Initial commit`-style messages; the subject line is imperative and under ~72 chars.
- Keep generated files in their own commit if mixed with source changes
  (`chore(convex): regenerate _generated`).

## PR review checklist

For the author, before opening the PR:

- [ ] All five quality gates green locally (same commands CI runs).
- [ ] No `any` casts added (they are a lint error); Convex types imported from
      `@eventnu/convex/_generated/*`.
- [ ] Convex: validators on every arg, `helpers.requireAdmin` for admin gating,
      `.paginate()` not `.take(1000)`, no unbounded arrays, compound index naming.
- [ ] Content truth preserved (`docs/CONVENTIONS.md` § Content truth): statuses,
      ownership, categories, media, pricing, action types.
- [ ] No new `console.log`/`console.error` in production paths — errors go through
      `getErrorMessage` (`admin-app/src/lib/errors.ts`).
- [ ] Admin list pages: TanStack Query via `src/lib/api/*` seeded with `initialData`;
      mutations `invalidateQueries`. No `convex/react` `useQuery`.
- [ ] UI changes: focus-visible rings, keyboard nav, contrast, reduced-motion respected;
      no ad-hoc hex values (use Tailwind `@theme` tokens).
- [ ] Logic in `src/lib/*.ts` is covered by the Vitest unit gate
      (85% statements / 80% branches); run `npm -w admin-app run test:coverage` if unsure.
- [ ] New components are kebab-case, one component per file, function declaration exports.

## Review

- Reviewers check the checklist above plus correctness and scope; use GitHub review
  tools (suggestions, comments on lines).
- Address review feedback in follow-up commits; re-request review when resolved.
- Prefer squashing on merge to keep `main` linear and readable.

## Release

- `REFACTORING.md` is the status tracker: update phase checkboxes and
  `docs/tech-debt.md` when a convention or debt item changes.
- Tag milestone commits after Phase 7 verification (see `REFACTORING.md`).
