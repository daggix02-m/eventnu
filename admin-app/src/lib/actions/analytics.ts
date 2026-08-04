'use server'

import { fetchQuery } from 'convex/nextjs'
import { api } from '../../../../web/convex/_generated/api'
import { mapTopEvent } from '../mappers'

export async function getAnalytics() {
  try {
    const [stats, weekly, topEvents] = await Promise.all([
      fetchQuery(api.analytics.getStats),
      fetchQuery(api.analytics.getWeekly, { weeks: 12, now: Date.now() }),
      fetchQuery(api.analytics.getTopEvents, { limit: 10 }),
    ])

    return {
      eventsPerWeek: (weekly.eventsPerWeek ?? []).map((w: any) => ({
        week_start: w.week ? `${w.week}-01` : '',
        event_count: w.count ?? 0,
      })),
      usersPerWeek: (weekly.usersPerWeek ?? []).map((w: any) => ({
        week_start: w.week ? `${w.week}-01` : '',
        user_count: w.count ?? 0,
      })),
      totalEvents: stats.totalEvents,
      totalUsers: stats.totalUsers,
      totalHosts: stats.totalHosts,
      totalOrganizers: stats.totalOrganizers,
      topEvents: (topEvents ?? []).map(mapTopEvent),
    }
  } catch {
    return {
      eventsPerWeek: [],
      usersPerWeek: [],
      totalEvents: 0,
      totalUsers: 0,
      totalHosts: 0,
      totalOrganizers: 0,
      topEvents: [],
    }
  }
}
