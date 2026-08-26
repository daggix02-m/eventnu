# ADR-0006: Community Stories — ephemeral media with post-then-report moderation

**Status:** Accepted
**Date:** 2026-08-26
**Deciders:** Product/engineering lead

## Context

Event Nu is adding a Snapchat-style photo/video sharing experience — **Stories** — so the
community can share what it's like at events across Addis Ababa. Stories are full-screen
vertical media that disappear after 24 hours. Requirements gathered with the product owner:

- **Public community model**: any signed-in user can post a story to a public feed (homepage
  rail + dedicated `/stories` page). No follower-gated private stories.
- **Post-then-report moderation**: stories publish instantly and are moderated reactively
  through the existing report pipeline (no pre-publish approval queue). Reports reuse the
  existing `reports` table with a new `story` target type.
- **No interactivity**: stories are view-only. No likes, comments, or reactions. View counts
  are tracked privately and visible only to the author (for creator insight), never public.
- **Ephemeral**: media auto-expires after 24 hours and is cleaned up automatically.

## Decision

1. **Two new Convex tables** (`packages/convex/convex/schema.ts`):
   - `stories`: one row per story with `userId`, `kind` (`photo` | `video`), Convex storage
     IDs/URLs, `mediaType`, optional `caption` and `eventId`, `expiresAt`, soft-delete flag,
     and a `moderationStatus` (`approved` | `rejected`).
   - `storyViews`: one row per (story, viewer) for creator-private view counts.
2. **Server-side media validation**: `stories.publish` resolves the uploaded file's metadata
   from the Convex `_storage` system table and rejects content-type mismatches (a photo story
   must be an `image/*` file; a video story must be a `video/*` file). Client-claimed MIME
   types are not trusted.
3. **Materialized expiry**: `expiresAt = now + 24h` is written at publish; the public feed
   query filters `expiresAt >= now` (passed as an argument, not read from the wall clock per
   Convex guidelines), and an hourly cron (`internal.stories.expireStories`) deletes expired
   rows **and their storage files** so the table stays bounded.
4. **No public interactivity**: there is no like/comment/reaction table or mutation for
   stories. `storyViews` are inserted best-effort by the viewer and only queried for the
   author's own stories.
5. **Post-then-report moderation**: new stories start `approved`. A `story` target type was
   added to `reports.submit` / `getTargetPreview` / `actionReport`; the admin can act via a
   new `hideStoryFromReport` mutation (flips `moderationStatus` to `rejected`, hiding it from
   the feed). The admin-app reports queue renders a story media preview and a "Hide Story"
   action.
6. **Rate limits**: `storyPublish` (5/hour) and `storyView` (token bucket) via the existing
   rate-limiter component.

Rejected alternatives:

- **Pre-approval moderation queue**: safest for public content, but contradicts the
  "post-then-report" product decision and adds an admin review bottleneck for a fast-moving
  ephemeral feed.
- **Private/follower-gated stories**: richer privacy model but not what the product owner
  chose; the `profiles.privateProfile` flag from the settings work can gate a user's posts in
  a future iteration without schema changes.
- **Store expiry as a queried wall-clock comparison only**: rejected because Convex queries
  don't re-run on time passing and benefit from a materialized `expiresAt` column.

## Consequences

- Stories are always visible within a 24-hour window and require no admin action to appear.
- Storage stays bounded: expiry cron deletes media, so orphaned files don't accumulate.
- Moderation happens after the fact via reports; a malicious story can be visible briefly
  until reported and hidden — the accepted trade-off of the product decision.
- View counts are private to authors; no public engagement numbers are surfaced.
- The `reports` target-type union gained `story`; existing event/organizer report flows are
  unchanged.