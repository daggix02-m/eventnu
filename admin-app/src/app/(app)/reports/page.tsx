import { getReports } from '@/lib/actions/reports'
import { ReportsClient } from '@/components/ReportsClient'

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const status = typeof params.status === 'string' ? params.status : 'all'
  const targetType = typeof params.targetType === 'string' ? params.targetType : 'all'
  const page = typeof params.page === 'string' ? parseInt(params.page) : 1

  const { reports, count } = await getReports({ status, targetType, page, perPage: 20 })

  return (
    <ReportsClient
      initialReports={reports}
      initialCount={count}
      initialFilters={{ status, targetType, page }}
    />
  )
}
