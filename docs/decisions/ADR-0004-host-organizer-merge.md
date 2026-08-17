# ADR-0004: Merge hosts into organizerProfiles

**Status:** Accepted (planning complete; migration staged)
**Date:** 2026-08-17

## Context

Event ownership is spread across three entities:

| Entity | Role | Account? | `events` references it via |
|---|---|---|---|
| `hosts` | venue/brand | no | `hostId` |
| `organizerProfiles` | business profile | linked via `profileId` | *(indirectly — `organizerId` points at `profiles`, then joins `organizerProfiles` by `profileId`)* |
| `profiles` | login account | yes | `organizerId` |

`events.organizerId` is typed `Id<'profiles'>` (an *account*), yet the business
identity (name/logo/handle) lives in `organizerProfiles`; `hosts` are account-less
venues that `organizerId` cannot reference at all. `follows.followingId` is also
overloaded (`hosts` | `organizerProfiles` | `profiles` ids, discriminated only by a
string `followType`). This is the root of the ownership-model tangling.

The consumer web site already resolves organizers through `organizerProfiles` and
never references `hosts`, so this migration is backend + admin-app only.

## Decision

1. **`organizerProfiles` becomes the single organizer/venue entity.** Events are owned
   by a new `events.ownerId → Id<'organizerProfiles'>`, replacing `organizerId` and
   `hostId`. `organizerProfiles.profileId` becomes optional (`null` for account-less
   venues); a new `kind: 'organizer' | 'venue'` discriminates them.
2. **Verification badge is dual-but-synced.** `organizerProfiles.verified` is the public
   badge for organizers and venues; `profiles.verified` remains for basic users. The
   admin `verification.grant` writes **both** in one mutation when the target is an
   organizer (no drift).
3. **Trimmed field mapping** from `hosts` (drop `hostType` and `contactPhone`):

   | `hosts` | → `organizerProfiles` |
   |---|---|
   | `name` | `organizerName` |
   | `description` | `bio` |
   | `logoUrl`, `website`, `contactEmail` | same |
   | `slug` | `handle` (existing public-URL field) |
   | `locationText` | `locationText` (new) |
   | `status` | `status` (new) |
   | `followerCount`, `verified` | same |
   | `hostType`, `contactPhone` | **dropped** |

4. **`follows`** collapses `followType` to `'user' | 'organizer'` (drop `'host'`).

## Migration (expand → migrate → switch → contract)

Each phase is independently deployable and reversible (rollback = redeploy prior code).

1. **Expand** — add nullable `kind`, `locationText`, `status`, `legacyHostId` (temp) to
   `organizerProfiles`; relax `profileId` to optional; add nullable
   `events.ownerId` + `by_owner` index. Nothing reads the new fields yet.
2. **Migrate** — backfill `hosts → organizerProfiles` (`kind='venue'`, `profileId=null`,
   `managementMode='admin_managed'`, `legacyHostId` = old id); backfill `events.ownerId`
   (organizer events via `by_profile`, host events via `legacyHostId`); remap
   `follows 'host' → 'organizer'`; dual-write `ownerId` on create/update. Batched via
   `ctx.scheduler.runAfter`, rehearsed on a snapshot-seeded preview.
3. **Switch** — point all read sites at `ownerId` (`enrichment`, `listByOrganizer`/
   `listMine`, `verification`, `getUserWithCounts`, `getByHandle`, admin `listByHost`,
   `adjustFollowerCount`, `reports`, `analytics`); public organizer resolution reads
   `organizerProfiles` directly; admin hosts UI folds into the organizers list with a
   `kind` filter; event form's `ownershipType` drops `host`.
4. **Contract** — drop `events.organizerId`/`hostId`, the `hosts` table, `hosts.ts`,
   admin hosts code, and `legacyHostId`. Separate deploy after zero reads remain.

## Consequences

- One ownership concept; event attribution, follows, and public organizer pages all
  resolve through `organizerProfiles`.
- Venues become first-class organizers (account-less, admin-managed, verifiable).
- Temporary `legacyHostId` is removed in the contract phase; it exists only to make the
  backfill re-runnable and reversible during rollout.
