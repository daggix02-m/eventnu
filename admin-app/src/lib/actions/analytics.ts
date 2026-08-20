'use server'

import { fetchQuery } from '@/lib/actions/authedFetch'
import { api } from '@eventnu/convex/_generated/api'
import { mapTopEvent } from '../mappers'

export async function getAnalytics() {
  const [stats, weekly, topEvents] = await Promise.all([
    fetchQuery(api.analytics.getStats),
    fetchQuery(api.analytics.getWeekly, { weeks: 12, now: Date.now() }),
    fetchQuery(api.analytics.getTopEvents, { limit: 10 }),
  ])

  return {
    eventsPerWeek: (weekly.eventsPerWeek ?? []).map((w: { week: string; count: number }) => ({
      week_start: w.week ? `${w.week}-01` : '',
      event_count: w.count ?? 0,
    })),
    usersPerWeek: (weekly.usersPerWeek ?? []).map((w: { week: string; count: number }) => ({
      week_start: w.week ? `${w.week}-01` : '',
      user_count: w.count ?? 0,
    })),
    totalEvents: stats.totalEvents,
    totalUsers: stats.totalUsers,
    totalOrganizers: stats.totalOrganizers,
    topEvents: (topEvents ?? []).map(mapTopEvent),
  }
}
