import { getUsers } from '@/lib/actions/users'
import { getCurrentAdminProfile } from '@/lib/actions/session'
import { UsersClient } from '@/components/users/UsersClient'

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const status = typeof params.status === 'string' ? params.status : 'all'
  const search = typeof params.search === 'string' ? params.search : ''

  let initial: Awaited<ReturnType<typeof getUsers>> = { items: [], nextCursor: null, isDone: true }
  try {
    initial = await getUsers({ status, search })
  } catch (err) {
    console.error('Failed to load users:', err)
  }

  let currentAdmin = null
  try {
    currentAdmin = await getCurrentAdminProfile()
  } catch (err) {
    console.error('Failed to load admin profile:', err)
  }

  return (
    <UsersClient
      initial={initial}
      initialFilters={{ status, search }}
      currentAdminId={currentAdmin?.authUserId ?? null}
    />
  )
}
