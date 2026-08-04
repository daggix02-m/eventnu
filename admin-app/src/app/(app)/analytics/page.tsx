import { getAnalytics } from '@/lib/actions/analytics'
import { AnalyticsClient } from '@/components/AnalyticsClient'

export default async function AnalyticsPage() {
  const data = await getAnalytics()

  return <AnalyticsClient data={data} />
}
