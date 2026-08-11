import { SettingsClient } from '@/components/settings/SettingsClient'
import { getFeaturedSections, getAdminStats } from '@/lib/actions/settings'
import { getInstagramStatus } from '@/lib/actions/instagram'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams

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
  try {
    ;[featuredSections, adminStats, instagramStatus] = await Promise.all([
      getFeaturedSections(),
      getAdminStats(),
      getInstagramStatus(),
    ])
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
      featuredSections={featuredSections}
      adminStats={adminStats}
      instagramStatus={instagramStatus}
      instagramNotice={notice}
      instagramErrorNotice={errorNotice}
    />
  )
}
