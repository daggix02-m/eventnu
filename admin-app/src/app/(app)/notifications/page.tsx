import { getNotifications } from '@/lib/actions/notifications'
import { NotificationsClient } from '@/components/notifications/NotificationsClient'

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const search = typeof params.search === 'string' ? params.search : ''
  const type = typeof params.type === 'string' ? params.type : 'all'
  const read = typeof params.read === 'string' ? params.read === 'true' : undefined

  let initial: Awaited<ReturnType<typeof getNotifications>> = {
    items: [],
    nextCursor: null,
    isDone: true,
  }
  try {
    initial = await getNotifications({
      search: search || undefined,
      type: type !== 'all' ? type : undefined,
      read,
    })
  } catch (err) {
    console.error('Failed to load notifications:', err)
  }

  return (
    <NotificationsClient
      initial={initial}
      initialFilters={{ search, type, read: read !== undefined ? String(read) : 'all' }}
    />
  )
}
