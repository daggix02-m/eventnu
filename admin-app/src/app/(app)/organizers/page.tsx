import { getOrganizers } from '@/lib/actions/organizers'
import { OrganizersClient } from '@/components/OrganizersClient'

export default async function OrganizersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const verified = typeof params.verified === 'string' ? params.verified === 'true' : undefined
  const search = typeof params.search === 'string' ? params.search : ''
  const page = typeof params.page === 'string' ? parseInt(params.page) : 1

  let organizers: Awaited<ReturnType<typeof getOrganizers>>['organizers'] = []
  let count = 0
  try {
    ;({ organizers, count } = await getOrganizers({ verified, search, page, perPage: 20 }))
  } catch (err) {
    console.error('Failed to load organizers:', err)
  }

  return (
    <OrganizersClient
      initialOrganizers={organizers}
      initialCount={count}
      initialFilters={{ verified: verified !== undefined ? String(verified) : 'all', search, page }}
    />
  )
}
