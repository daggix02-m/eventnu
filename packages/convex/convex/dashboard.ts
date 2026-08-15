import { query } from './_generated/server'
import { requireAdmin } from './helpers'
import { STATS_SCAN_CAP } from './constants'

export const getNavCounts = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    const [pendingEvents, openReports] = await Promise.all([
      ctx.db
        .query('events')
        .withIndex('by_status', (q) => q.eq('status', 'pending_review'))
        .take(STATS_SCAN_CAP),
      ctx.db
        .query('reports')
        .withIndex('by_status', (q) => q.eq('status', 'pending'))
        .take(STATS_SCAN_CAP),
    ])
    return {
      pendingReview: pendingEvents.length,
      openReports: openReports.length,
    }
  },
})
