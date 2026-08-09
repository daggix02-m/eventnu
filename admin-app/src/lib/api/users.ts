'use client'

import { getUsers } from '@/lib/actions/users'
import { usePaginatedList } from './use-paginated-list'
import type { MappedProfile } from '@/lib/mappers'

export const usersKeys = ['users'] as const

export interface UserListFilters {
  status?: string
  search?: string
  page?: number
}

export function useUsers(
  filters: UserListFilters,
  initial: { users: MappedProfile[]; count: number },
  initialFilters: UserListFilters,
) {
  return usePaginatedList<MappedProfile, UserListFilters>({
    queryKey: usersKeys,
    filters,
    initialFilters,
    initial: initial
      ? { items: initial.users, total: initial.count, all: initial.users }
      : undefined,
    page: filters.page ?? 1,
    fetchAll: async () => {
      const { users } = await getUsers({ search: filters.search, status: filters.status })
      return users
    },
  })
}
