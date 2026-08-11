import { getHosts } from '@/lib/actions/hosts'
import { HostsClient } from '@/components/hosts/HostsClient'

export default async function HostsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const status = typeof params.status === 'string' ? params.status : 'all'
  const type = typeof params.type === 'string' ? params.type : 'all'
  const search = typeof params.search === 'string' ? params.search : ''

  let initial: Awaited<ReturnType<typeof getHosts>> = { items: [], nextCursor: null, isDone: true }
  try {
    initial = await getHosts({ status, type, search })
  } catch (err) {
    console.error('Failed to load hosts:', err)
  }

  return <HostsClient initial={initial} initialFilters={{ status, type, search }} />
}
