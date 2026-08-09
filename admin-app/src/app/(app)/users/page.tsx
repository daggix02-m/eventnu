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

  const { users, count } = await getUsers({ status, search, page, perPage: 20 })
  const currentAdmin = await getCurrentAdminProfile()

  return (
    <UsersClient
      initialUsers={users}
      initialCount={count}
      initialFilters={{ status, search, page }}
      currentAdminId={currentAdmin?._id ?? null}
    />
  )
}
