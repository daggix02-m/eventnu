'use server'

import { fetchQuery } from '@/lib/actions/authedFetch'
import type { Doc } from '@eventnu/convex/_generated/dataModel'
import { api } from '@eventnu/convex/_generated/api'
import { mapModerationLog } from '../mappers'

export async function getNavCounts() {
  return fetchQuery(api.dashboard.getNavCounts)
}

export async function getDashboardStats() {
  const eventStats = await fetchQuery(api.events.read.getStats, { now: Date.now() })
  const analytics = await fetchQuery(api.analytics.getStats)
  return {
    totalPublished: eventStats.totalPublished,
    upcomingCount: eventStats.upcoming,
    pendingReview: eventStats.pending,
    totalUsers: analytics.totalUsers,
    openReports: analytics.totalReports,
  }
}

export async function getPendingReviewEvents() {
  const events = await fetchQuery(api.events.read.getPendingReview)
  return events.map((e: Doc<'events'>) => ({
    id: e._id,
    title: e.title,
    poster_url: e.posterUrl,
    status: e.status,
    organizer_id: e.ownerId,
    created_at: e._creationTime,
  }))
}

export async function getRecentModerationLogs() {
  const logs = await fetchQuery(api.moderation.getRecent, { limit: 10 })
  return logs.map((log: Doc<'moderationLogs'> & { adminName: string }) => mapModerationLog(log))
}

export async function getModerationLogsByTarget(targetType: string, targetId: string) {
  const logs = await fetchQuery(api.moderation.getByTarget, { targetType, targetId })
  return logs.map((log: Doc<'moderationLogs'> & { adminName: string }) => mapModerationLog(log))
}
