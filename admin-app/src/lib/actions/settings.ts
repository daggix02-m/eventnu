'use server'

import { fetchQuery, fetchMutation } from 'convex/nextjs'
import { api } from '../../../../web/convex/_generated/api'
import { revalidatePath } from 'next/cache'
import { mapFeaturedSection } from '../mappers'

export async function getFeaturedSections() {
  try {
    const sections = await fetchQuery(api.features.list)
    return sections.map(mapFeaturedSection)
  } catch {
    return []
  }
}

export async function updateFeaturedSection(id: string, updates: {
  label?: string
  description?: string
  enabled?: boolean
  sort_order?: number
}) {
  try {
    await fetchMutation(api.features.update, {
      sectionId: id as any,
      label: updates.label,
      description: updates.description,
      enabled: updates.enabled,
      sortOrder: updates.sort_order,
    })
  } catch {}
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
  } catch {
    return { totalEvents: 0, totalUsers: 0, totalHosts: 0, totalOrganizers: 0, openReports: 0, moderationCount: 0 }
  }
}
