import { getReports, ReportTargetType } from '@/lib/actions/reports'
import { ReportsClient } from '@/components/reports/ReportsClient'

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const status = typeof params.status === 'string' ? params.status : 'all'
  const targetType = (
    typeof params.targetType === 'string' ? params.targetType : 'all'
  ) as ReportTargetType | 'all'

  let initial: Awaited<ReturnType<typeof getReports>> = {
    items: [],
    nextCursor: null,
    isDone: true,
  }
  try {
    initial = await getReports({ status, targetType })
  } catch (err) {
    console.error('Failed to load reports:', err)
  }

  return <ReportsClient initial={initial} initialFilters={{ status, targetType }} />
}
