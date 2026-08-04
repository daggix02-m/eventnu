import { SettingsClient } from '@/components/SettingsClient'
import { getFeaturedSections, getAdminStats } from '@/lib/actions/settings'
import { getInstagramStatus } from '@/lib/actions/instagram'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const [featuredSections, adminStats, instagramStatus] = await Promise.all([
    getFeaturedSections(),
    getAdminStats(),
    getInstagramStatus(),
  ])

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
      profile={null}
      featuredSections={featuredSections}
      adminStats={adminStats}
      instagramStatus={instagramStatus}
      instagramNotice={notice}
      instagramErrorNotice={errorNotice}
    />
  )
}
