'use client'

import { useQuery } from '@tanstack/react-query'
import { getNavCounts } from '@/lib/actions/dashboard'

export const dashboardKeys = {
  navCounts: ['dashboard', 'navCounts'] as const,
}

export interface NavCounts {
  pendingReview: number
  openReports: number
}

export function useNavCounts(initial: NavCounts) {
  return useQuery<NavCounts>({
    queryKey: dashboardKeys.navCounts,
    queryFn: () => getNavCounts(),
    initialData: initial,
    staleTime: 30_000,
    refetchInterval: 120_000,
  })
}
