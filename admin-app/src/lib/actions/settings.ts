'use server'

import { fetchQuery, fetchMutation } from '@/lib/actions/authedFetch'
import type { Id } from '@eventnu/convex/_generated/dataModel'
import { api } from '@eventnu/convex/_generated/api'
import { revalidatePath } from 'next/cache'
import { mapFeaturedSection } from '../mappers'

export async function getFeaturedSections() {
  const sections = await fetchQuery(api.features.list)
  return sections.map(mapFeaturedSection)
}

export async function updateFeaturedSection(
  id: string,
  updates: {
    label?: string
    description?: string
    enabled?: boolean
    sort_order?: number
  },
) {
  await fetchMutation(api.features.update, {
    sectionId: id as Id<'featuredSections'>,
    label: updates.label,
    description: updates.description,
    enabled: updates.enabled,
    sortOrder: updates.sort_order,
  })
  revalidatePath('/settings')
}

export async function getAdminStats() {
  const stats = await fetchQuery(api.analytics.getStats)
  return {
    totalEvents: stats.totalEvents,
    totalUsers: stats.totalUsers,
    totalHosts: stats.totalHosts,
    totalOrganizers: stats.totalOrganizers,
    openReports: stats.totalReports,
    moderationCount: stats.totalModerationLogs,
  }
}

export async function getAdminNotificationPrefs() {
  const prefs = await fetchQuery(api.adminSettings.getByAdmin)
  return {
    emailReports: prefs?.emailReports ?? true,
    emailEvents: prefs?.emailEvents ?? true,
    emailUsers: prefs?.emailUsers ?? true,
    pushEnabled: false,
  }
}

export async function updateAdminNotificationPrefs(prefs: {
  email_reports: boolean
  email_events: boolean
  email_users: boolean
}) {
  await fetchMutation(api.adminSettings.upsert, {
    emailReports: prefs.email_reports,
    emailEvents: prefs.email_events,
    emailUsers: prefs.email_users,
  })
  revalidatePath('/settings')
}
