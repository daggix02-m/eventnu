import { v } from 'convex/values'
import { query } from './_generated/server'
import { requireAdmin, sumLikeShards } from './helpers'
import { STATS_SCAN_CAP } from './constants'

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    const [events, profiles, organizerProfiles, reports, moderationLogs] = await Promise.all([
      ctx.db.query('events').take(STATS_SCAN_CAP),
      ctx.db.query('profiles').take(STATS_SCAN_CAP),
      ctx.db.query('organizerProfiles').take(STATS_SCAN_CAP),
      ctx.db.query('reports').take(STATS_SCAN_CAP),
      ctx.db.query('moderationLogs').take(STATS_SCAN_CAP),
    ])

    return {
      totalEvents: events.length,
      totalUsers: profiles.length,
      totalOrganizers: organizerProfiles.length,
      totalReports: reports.length,
      totalModerationLogs: moderationLogs.length,
    }
  },
})

export const getWeekly = query({
  args: { weeks: v.optional(v.number()), now: v.number() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const weeks = args.weeks ?? 12
    const now = args.now
    const weekMs = 7 * 24 * 60 * 60 * 1000

    const [events, profiles] = await Promise.all([
      ctx.db.query('events').take(STATS_SCAN_CAP),
      ctx.db.query('profiles').take(STATS_SCAN_CAP),
    ])

    const eventsPerWeek: { week: string; count: number }[] = []
    const usersPerWeek: { week: string; count: number }[] = []

    for (let i = weeks - 1; i >= 0; i--) {
      const start = now - (i + 1) * weekMs
      const end = now - i * weekMs
      const weekLabel = new Date(start).toISOString().slice(0, 7)

      eventsPerWeek.push({
        week: weekLabel,
        count: events.filter((e) => e._creationTime >= start && e._creationTime < end).length,
      })

      usersPerWeek.push({
        week: weekLabel,
        count: profiles.filter((p) => p._creationTime >= start && p._creationTime < end).length,
      })
    }

    return { eventsPerWeek, usersPerWeek }
  },
})

export const getTopEvents = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const limit = args.limit ?? 10
    const events = await ctx.db
      .query('events')
      .withIndex('by_status', (q) => q.eq('status', 'published'))
      .take(200)
    // Rank by the sharded like-count (canonical), not the stale legacy field.
    const counts = await Promise.all(events.map((e) => sumLikeShards(ctx, e._id)))
    return events
      .map((e, i) => ({ e, likeCount: counts[i] }))
      .sort((a, b) => b.likeCount - a.likeCount)
      .slice(0, limit)
      .map(({ e }) => e)
  },
})
