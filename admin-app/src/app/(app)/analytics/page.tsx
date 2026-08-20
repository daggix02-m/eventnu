import { getAnalytics } from '@/lib/actions/analytics'
import { AnalyticsClient } from '@/components/analytics/AnalyticsClient'
import { logError } from '@/lib/logger'

export default async function AnalyticsPage() {
  let data: Awaited<ReturnType<typeof getAnalytics>> = {
    eventsPerWeek: [],
    usersPerWeek: [],
    totalEvents: 0,
    totalUsers: 0,
    totalOrganizers: 0,
    topEvents: [],
  }
  try {
    data = await getAnalytics()
  } catch (err) {
    logError('admin/analytics', err)
  }

  return <AnalyticsClient data={data} />
}
