import { SettingsClient } from '@/components/settings/SettingsClient'
import {
  getFeaturedSections,
  getAdminStats,
  getAdminNotificationPrefs,
} from '@/lib/actions/settings'
import { getCurrentAdminProfile } from '@/lib/actions/session'
import type { Doc } from '@eventnu/convex/_generated/dataModel'
import type { NotificationPrefs } from '@/components/settings/types'
import { logError } from '@/lib/logger'

export default async function SettingsPage() {
  let profile: Doc<'profiles'> | null = null
  let featuredSections: Awaited<ReturnType<typeof getFeaturedSections>> = []
  let adminStats: Awaited<ReturnType<typeof getAdminStats>> = {
    totalEvents: 0,
    totalUsers: 0,
    totalOrganizers: 0,
    openReports: 0,
    moderationCount: 0,
  }
  let notificationPrefs: NotificationPrefs = {
    emailReports: true,
    emailEvents: true,
    emailUsers: true,
    pushEnabled: false,
  }
  try {
    ;[profile, featuredSections, adminStats] = await Promise.all([
      getCurrentAdminProfile(),
      getFeaturedSections(),
      getAdminStats(),
    ])
    if (profile) {
      notificationPrefs = await getAdminNotificationPrefs()
    }
  } catch (err) {
    logError('admin/settings', err)
  }

  return (
    <SettingsClient
      profile={profile}
      featuredSections={featuredSections}
      adminStats={adminStats}
      notificationPrefs={notificationPrefs}
    />
  )
}
