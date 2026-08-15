import { SettingsClient } from '@/components/settings/SettingsClient'
import {
  getFeaturedSections,
  getAdminStats,
  getAdminNotificationPrefs,
} from '@/lib/actions/settings'
import { getInstagramStatus } from '@/lib/actions/instagram'
import { getCurrentAdminProfile } from '@/lib/actions/session'
import type { Doc } from '@eventnu/convex/_generated/dataModel'
import type { NotificationPrefs } from '@/components/settings/types'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams

  let profile: Doc<'profiles'> | null = null
  let featuredSections: Awaited<ReturnType<typeof getFeaturedSections>> = []
  let adminStats: Awaited<ReturnType<typeof getAdminStats>> = {
    totalEvents: 0,
    totalUsers: 0,
    totalHosts: 0,
    totalOrganizers: 0,
    openReports: 0,
    moderationCount: 0,
  }
  let instagramStatus: Awaited<ReturnType<typeof getInstagramStatus>> = null
  let notificationPrefs: NotificationPrefs = {
    emailReports: true,
    emailEvents: true,
    emailUsers: true,
    pushEnabled: false,
  }
  try {
    ;[profile, featuredSections, adminStats, instagramStatus] = await Promise.all([
      getCurrentAdminProfile(),
      getFeaturedSections(),
      getAdminStats(),
      getInstagramStatus(),
    ])
    if (profile) {
      notificationPrefs = await getAdminNotificationPrefs()
    }
  } catch (err) {
    console.error('Failed to load settings:', err)
  }

  const flag = params.instagram
  const notice = flag === 'connected' ? 'Instagram connected successfully' : null
  const errorNotice =
    flag === 'error'
      ? typeof params.reason === 'string'
        ? params.reason
        : 'Instagram connection failed'
      : null

  return (
    <SettingsClient
      profile={profile}
      featuredSections={featuredSections}
      adminStats={adminStats}
      notificationPrefs={notificationPrefs}
      instagramStatus={instagramStatus}
      instagramNotice={notice}
      instagramErrorNotice={errorNotice}
    />
  )
}
