import { getUsers } from '@/lib/actions/users'
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

  return (
    <UsersClient
      initialUsers={users}
      initialCount={count}
      initialFilters={{ status, search, page }}
    />
  )
}
