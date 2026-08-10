import { getHosts } from '@/lib/actions/hosts'
import { HostsClient } from '@/components/HostsClient'

export default async function HostsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const status = typeof params.status === 'string' ? params.status : 'all'
  const type = typeof params.type === 'string' ? params.type : 'all'
  const search = typeof params.search === 'string' ? params.search : ''
  const page = typeof params.page === 'string' ? parseInt(params.page) : 1

  let hosts: Awaited<ReturnType<typeof getHosts>>['hosts'] = []
  let count = 0
  try {
    ;({ hosts, count } = await getHosts({ status, type, search, page, perPage: 20 }))
  } catch (err) {
    console.error('Failed to load hosts:', err)
  }

  return (
    <HostsClient
      initialHosts={hosts}
      initialCount={count}
      initialFilters={{ status, type, search, page }}
    />
  )
}
