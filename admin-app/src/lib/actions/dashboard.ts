'use server'

import { fetchQuery, fetchMutation } from '@/lib/actions/authedFetch'
import { api } from '../../../../web/convex/_generated/api'
import { revalidatePath } from 'next/cache'

export async function getDashboardStats() {
  try {
    const eventStats = await fetchQuery(api.events.getStats, { now: Date.now() })
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
    const events = await fetchQuery(api.events.getPendingReview)
    return events.map((e: any) => ({
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
    return logs.map((log: any) => ({
      id: log._id,
      profiles: { full_name: log.adminName || 'Admin' },
      action: log.action,
      target_type: log.targetType,
      note: log.note,
      created_at: log._creationTime,
    }))
  } catch (err) {
    console.error('Failed to load moderation logs:', err)
    throw err
  }
}

export async function getModerationLogsByTarget(targetType: string, targetId: string) {
  try {
    const logs = await fetchQuery(api.moderation.getByTarget, { targetType, targetId })
    return logs.map((log: any) => ({
      id: log._id,
      profiles: { full_name: log.adminName || 'Admin' },
      action: log.action,
      target_type: log.targetType,
      note: log.note,
      created_at: log._creationTime,
    }))
  } catch (err) {
    console.error('Failed to load moderation logs:', err)
    return []
  }
}

export async function publishEvent(eventId: string, note?: string) {
  await fetchMutation(api.events.updateStatus, { eventId: eventId as any, status: 'published', note })
  revalidatePath('/events')
  revalidatePath('/')
}

export async function rejectEvent(eventId: string, note?: string) {
  await fetchMutation(api.events.updateStatus, { eventId: eventId as any, status: 'rejected', note })
  revalidatePath('/events')
  revalidatePath('/')
}
