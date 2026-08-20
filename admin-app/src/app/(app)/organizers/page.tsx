import { getOrganizers } from '@/lib/actions/organizers'
import { OrganizersClient } from '@/components/organizers/OrganizersClient'
import { logError } from '@/lib/logger'

export default async function OrganizersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const verified = typeof params.verified === 'string' ? params.verified === 'true' : undefined
  const search = typeof params.search === 'string' ? params.search : ''

  let initial: Awaited<ReturnType<typeof getOrganizers>> = {
    items: [],
    nextCursor: null,
    isDone: true,
  }
  try {
    initial = await getOrganizers({ verified, search })
  } catch (err) {
    logError('admin/organizers', err)
  }

  return (
    <OrganizersClient
      initial={initial}
      initialFilters={{ verified: verified !== undefined ? String(verified) : 'all', search }}
    />
  )
}
