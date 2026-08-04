import { getNotifications } from '@/lib/actions/notifications'
import { NotificationsClient } from '@/components/NotificationsClient'

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const page = typeof params.page === 'string' ? parseInt(params.page) : 1

  const { notifications, count } = await getNotifications({ page, perPage: 20 })

  return (
    <NotificationsClient
      initialNotifications={notifications}
      initialCount={count}
      initialPage={page}
    />
  )
}
