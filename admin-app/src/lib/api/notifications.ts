'use client'

import { getNotifications } from '@/lib/actions/notifications'
import { useCursorPaginatedList } from './use-paginated-list'
import type { CursorPage } from './use-paginated-list'
import type { MappedNotification } from '@/lib/mappers'

export const notificationsKeys = ['notifications'] as const

export interface NotificationListFilters {
  search?: string
  type?: string
  read?: string
}

export function useNotifications(
  filters: NotificationListFilters,
  initial: CursorPage<MappedNotification>,
  initialFilters: NotificationListFilters,
) {
  return useCursorPaginatedList<MappedNotification, NotificationListFilters>({
    queryKey: notificationsKeys,
    filters,
    initialFilters,
    initial,
    queryFn: (cursor) =>
      getNotifications({
        search: filters.search || undefined,
        type: filters.type !== 'all' ? filters.type : undefined,
        read: filters.read !== 'all' ? filters.read === 'true' : undefined,
        cursor,
      }),
  })
}
