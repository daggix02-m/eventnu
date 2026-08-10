import { getNotifications } from '@/lib/actions/notifications'
import { NotificationsClient } from '@/components/NotificationsClient'

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const page = typeof params.page === 'string' ? parseInt(params.page) : 1
  const search = typeof params.search === 'string' ? params.search : ''
  const type = typeof params.type === 'string' ? params.type : 'all'
  const read = typeof params.read === 'string' ? params.read === 'true' : undefined

  let notifications: Awaited<ReturnType<typeof getNotifications>>['notifications'] = []
  let count = 0
  try {
    ;({ notifications, count } = await getNotifications({
      page,
      perPage: 20,
      search: search || undefined,
      type: type !== 'all' ? type : undefined,
      read,
    }))
  } catch (err) {
    console.error('Failed to load notifications:', err)
  }

  return (
    <NotificationsClient
      initialNotifications={notifications}
      initialCount={count}
      initialPage={page}
      initialFilters={{ search, type, read: read !== undefined ? String(read) : 'all' }}
    />
  )
}
