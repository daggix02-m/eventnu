'use client'

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getNotifications } from '@/lib/actions/notifications'
import type { PageData } from './use-paginated-list'
import type { MappedNotification } from '@/lib/mappers'

export const notificationsKeys = ['notifications'] as const

export interface NotificationListFilters {
  page?: number
}

export function useNotifications(
  filters: NotificationListFilters,
  initial: { notifications: MappedNotification[]; count: number },
) {
  const page = filters.page ?? 1

  return useQuery<PageData<MappedNotification>>({
    queryKey: [...notificationsKeys, filters],
    queryFn: async () => {
      const { notifications, count } = await getNotifications({ page, perPage: 20 })
      return { items: notifications, total: count, all: notifications }
    },
    initialData: initial ? { items: initial.notifications, total: initial.count, all: initial.notifications } : undefined,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}
