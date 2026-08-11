import { getUsers } from '@/lib/actions/users'
import { getCurrentAdminProfile } from '@/lib/actions/session'
import { UsersClient } from '@/components/UsersClient'

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const status = typeof params.status === 'string' ? params.status : 'all'
  const search = typeof params.search === 'string' ? params.search : ''
  const page = typeof params.page === 'string' ? parseInt(params.page) : 1

  let users: Awaited<ReturnType<typeof getUsers>>['users'] = []
  let count = 0
  try {
    ;({ users, count } = await getUsers({ status, search, page, perPage: 20 }))
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
      initialUsers={users}
      initialCount={count}
      initialFilters={{ status, search, page }}
      currentAdminId={currentAdmin?.authUserId ?? null}
    />
  )
}
