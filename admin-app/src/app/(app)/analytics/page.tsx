import { getAnalytics } from '@/lib/actions/analytics'
import { AnalyticsClient } from '@/components/analytics/AnalyticsClient'

export default async function AnalyticsPage() {
  let data: Awaited<ReturnType<typeof getAnalytics>> = {
    eventsPerWeek: [],
    usersPerWeek: [],
    totalEvents: 0,
    totalUsers: 0,
    totalHosts: 0,
    totalOrganizers: 0,
    topEvents: [],
  }
  try {
    data = await getAnalytics()
  } catch (err) {
    console.error('Failed to load analytics:', err)
  }

  return <AnalyticsClient data={data} />
}
