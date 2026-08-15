'use client'

import { useQuery } from '@tanstack/react-query'
import { getUsers, getAdminStats } from '@/lib/actions/users'
import { useCursorPaginatedList } from './use-paginated-list'
import type { CursorPage } from './use-paginated-list'
import type { MappedUser } from '@/lib/mappers'

export const usersKeys = ['users'] as const
const userStatsKeys = ['users', 'stats'] as const

export interface UserListFilters {
  status?: string
  search?: string
}

export function useUsers(
  filters: UserListFilters,
  initial: CursorPage<MappedUser>,
  initialFilters: UserListFilters,
) {
  return useCursorPaginatedList<MappedUser, UserListFilters>({
    queryKey: usersKeys,
    filters,
    initialFilters,
    initial,
    queryFn: (cursor) => getUsers({ status: filters.status, search: filters.search, cursor }),
  })
}

export interface AdminStats {
  total: number
  active: number
  suspended: number
  noProfile: number
}

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: userStatsKeys,
    queryFn: () => getAdminStats(),
    staleTime: 30_000,
  })
}
