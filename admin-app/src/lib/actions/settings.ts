'use server'

import { fetchQuery, fetchMutation } from '@/lib/actions/authedFetch'
import { api } from '@eventnu/convex/_generated/api'
import { revalidatePath } from 'next/cache'
import { mapFeaturedSection } from '../mappers'

export async function getFeaturedSections() {
  try {
    const sections = await fetchQuery(api.features.list)
    return sections.map(mapFeaturedSection)
  } catch (err) {
    console.error('Failed to load featured sections:', err)
    throw err
  }
}

export async function updateFeaturedSection(id: string, updates: {
  label?: string
  description?: string
  enabled?: boolean
  sort_order?: number
}) {
  await fetchMutation(api.features.update, {
    sectionId: id as any,
    label: updates.label,
    description: updates.description,
    enabled: updates.enabled,
    sortOrder: updates.sort_order,
  })
  revalidatePath('/settings')
}

export async function getAdminStats() {
  try {
    const stats = await fetchQuery(api.analytics.getStats)
    return {
      totalEvents: stats.totalEvents,
      totalUsers: stats.totalUsers,
      totalHosts: stats.totalHosts,
      totalOrganizers: stats.totalOrganizers,
      openReports: stats.totalReports,
      moderationCount: stats.totalModerationLogs,
    }
  } catch (err) {
    console.error('Failed to load admin stats:', err)
    throw err
  }
}

export async function updateAdminNotificationPrefs(adminId: string, prefs: {
  email_reports: boolean
  email_events: boolean
  email_users: boolean
}) {
  await fetchMutation(api.adminSettings.upsert, {
    adminId: adminId as any,
    emailReports: prefs.email_reports,
    emailEvents: prefs.email_events,
    emailUsers: prefs.email_users,
  })
  revalidatePath('/settings')
}
