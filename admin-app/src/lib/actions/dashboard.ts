'use server'

import { fetchQuery } from '@/lib/actions/authedFetch'
import { api } from '@eventnu/convex/_generated/api'
import { mapModerationLog } from '../mappers'

export async function getNavCounts() {
  return fetchQuery(api.dashboard.getNavCounts)
}

export async function getDashboardStats() {
  try {
    const eventStats = await fetchQuery(api.events.read.getStats, { now: Date.now() })
    const analytics = await fetchQuery(api.analytics.getStats)
    return {
      totalPublished: eventStats.totalPublished,
      upcomingCount: eventStats.upcoming,
      pendingReview: eventStats.pending,
      activeHosts: analytics.totalHosts,
      totalUsers: analytics.totalUsers,
      openReports: analytics.totalReports,
    }
  } catch (err) {
    console.error('Failed to load dashboard stats:', err)
    throw err
  }
}

export async function getPendingReviewEvents() {
  try {
    const events = await fetchQuery(api.events.read.getPendingReview)
    return events.map((e) => ({
      id: e._id,
      title: e.title,
      poster_url: e.posterUrl,
      status: e.status,
      organizer_id: e.organizerId,
      created_at: e._creationTime,
    }))
  } catch (err) {
    console.error('Failed to load pending review events:', err)
    throw err
  }
}

export async function getRecentModerationLogs() {
  try {
    const logs = await fetchQuery(api.moderation.getRecent, { limit: 10 })
    return logs.map((log) => mapModerationLog(log))
  } catch (err) {
    console.error('Failed to load moderation logs:', err)
    throw err
  }
}

export async function getModerationLogsByTarget(targetType: string, targetId: string) {
  try {
    const logs = await fetchQuery(api.moderation.getByTarget, { targetType, targetId })
    return logs.map((log) => mapModerationLog(log))
  } catch (err) {
    console.error('Failed to load moderation logs:', err)
    return []
  }
}
