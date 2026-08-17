import { v } from 'convex/values'
import { query, mutation, internalMutation } from './_generated/server'
import type { QueryCtx, MutationCtx } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'
import { insertModerationLog, requireAdmin } from './helpers'
import { paginationOptsValidator } from 'convex/server'
import { VERIFICATION_THRESHOLDS } from './constants'

export type VerificationKind = 'user' | 'organizer'

export type EngagementMetrics = {
  publishedEvents: number
  engagementGiven: number
  followerCount: number
  experiencePosts: number
  reservationCount: number
}

/**
 * Pure eligibility rule. Returns true when a profile's engagement metrics meet
 * the silent verification threshold for its kind. No side effects.
 */
export function computeEligibility(kind: VerificationKind, m: EngagementMetrics): boolean {
  if (kind === 'organizer') {
    const t = VERIFICATION_THRESHOLDS.organizer
    return (
      m.publishedEvents >= t.minPublishedEvents &&
      (m.followerCount >= t.minFollowerCount ||
        m.reservationCount >= t.minReservationCount ||
        m.engagementGiven >= t.minEngagementGiven)
    )
  }
  const t = VERIFICATION_THRESHOLDS.user
  return (
    m.engagementGiven >= t.minEngagementGiven &&
    (m.experiencePosts >= t.minExperiencePosts || m.followerCount >= t.minFollowerCount)
  )
}

async function getCounter(
  ctx: QueryCtx | MutationCtx,
  profileId: Id<'profiles'>,
): Promise<Doc<'engagementCounters'> | null> {
  return await ctx.db
    .query('engagementCounters')
    .withIndex('by_profile', (q) => q.eq('profileId', profileId))
    .first()
}

/**
 * Compute a profile's engagement metrics from its incrementally-maintained
 * counters (and, for organizers, their published events and follower count).
 * Pure with respect to the eligibility decision; only reads the database.
 */
export async function computeProfileMetrics(
  ctx: QueryCtx | MutationCtx,
  profile: Doc<'profiles'>,
): Promise<{ kind: VerificationKind; metrics: EngagementMetrics }> {
  const counter = await getCounter(ctx, profile._id)
  const engagementGiven =
    (counter?.likes ?? 0) +
    (counter?.comments ?? 0) +
    (counter?.bookmarks ?? 0) +
    (counter?.shares ?? 0)
  const experiencePosts = counter?.posts ?? 0

  if (profile.role !== 'organizer') {
    return {
      kind: 'user',
      metrics: {
        publishedEvents: 0,
        engagementGiven,
        followerCount: profile.followerCount ?? 0,
        experiencePosts,
        reservationCount: 0,
      },
    }
  }

  const org = await ctx.db
    .query('organizerProfiles')
    .withIndex('by_profile', (q) => q.eq('profileId', profile._id))
    .first()
  const events = org
    ? await ctx.db
        .query('events')
        .withIndex('by_owner_and_status', (q) => q.eq('ownerId', org._id).eq('status', 'published'))
        .take(500)
    : []
  const publishedEvents = events.length
  const reservationCount = events.reduce((sum, e) => sum + (e.reservationCount ?? 0), 0)

  return {
    kind: 'organizer',
    metrics: {
      publishedEvents,
      engagementGiven,
      followerCount: org?.followerCount ?? 0,
      experiencePosts,
      reservationCount,
    },
  }
}

/**
 * Cron entry point: recompute the silent eligibility snapshot for every profile.
 * Writes only `verificationScores` — never a notification or email. The admin's
 * `grant` is the only (surprise) transition a user ever observes.
 */
export const evaluateEligibility = internalMutation({
  args: {},
  handler: async (ctx) => {
    let evaluated = 0
    let cursor: string | null = null
    for (let i = 0; i < 20; i++) {
      const page = await ctx.db.query('profiles').paginate({ cursor, numItems: 500 })
      for (const profile of page.page) {
        const { kind, metrics } = await computeProfileMetrics(ctx, profile)
        const eligible = computeEligibility(kind, metrics)
        const existing = await ctx.db
          .query('verificationScores')
          .withIndex('by_profile', (q) => q.eq('profileId', profile._id))
          .first()
        const fields = { kind, ...metrics, eligible, evaluatedAt: Date.now() }
        if (existing) {
          await ctx.db.patch('verificationScores', existing._id, fields)
        } else {
          await ctx.db.insert('verificationScores', { profileId: profile._id, ...fields })
        }
        evaluated++
      }
      if (page.isDone || page.continueCursor === null) break
      cursor = page.continueCursor
    }
    return { evaluated }
  },
})

export const grant = mutation({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx)
    const target = await ctx.db.get('profiles', args.profileId)
    if (!target) throw new Error('Profile not found')
    await ctx.db.patch('profiles', args.profileId, {
      verified: true,
      verifiedAt: Date.now(),
      verifiedBy: admin._id,
    })
    await insertModerationLog(ctx, {
      adminId: admin._id,
      action: 'grant_verification',
      targetType: 'profile',
      targetId: args.profileId,
    })
  },
})

export const revoke = mutation({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx)
    await ctx.db.patch('profiles', args.profileId, { verified: false })
    await insertModerationLog(ctx, {
      adminId: admin._id,
      action: 'revoke_verification',
      targetType: 'profile',
      targetId: args.profileId,
    })
  },
})

export const listEligible = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const page = await ctx.db
      .query('verificationScores')
      .withIndex('by_eligible', (q) => q.eq('eligible', true))
      .order('desc')
      .paginate(args.paginationOpts)
    const profiles = await Promise.all(page.page.map((s) => ctx.db.get('profiles', s.profileId)))
    return {
      ...page,
      page: page.page.map((s, i) => {
        const p = profiles[i]
        return {
          ...s,
          profile: p
            ? {
                fullName: p.fullName ?? null,
                email: p.email ?? null,
                avatarUrl: p.avatarUrl ?? null,
              }
            : null,
        }
      }),
    }
  },
})

export const listVerified = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    return await ctx.db
      .query('profiles')
      .withIndex('by_verified', (q) => q.eq('verified', true))
      .order('desc')
      .paginate(args.paginationOpts)
  },
})
