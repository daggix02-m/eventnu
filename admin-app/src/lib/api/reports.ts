'use client'

import { useQuery } from '@tanstack/react-query'
import { getReports, getReportsStats } from '@/lib/actions/reports'
import { useCursorPaginatedList } from './use-paginated-list'
import type { CursorPage } from './use-paginated-list'
import type { MappedReport } from '@/lib/mappers'

export const reportsKeys = ['reports'] as const
export const reportStatsKeys = ['reports', 'stats'] as const

export interface ReportListFilters {
  status?: string
  targetType?: string
}

export function useReports(
  filters: ReportListFilters,
  initial: CursorPage<MappedReport>,
  initialFilters: ReportListFilters,
) {
  return useCursorPaginatedList<MappedReport, ReportListFilters>({
    queryKey: reportsKeys,
    filters,
    initialFilters,
    initial,
    queryFn: (cursor) =>
      getReports({
        status: filters.status !== 'all' ? filters.status : undefined,
        targetType: filters.targetType !== 'all' ? filters.targetType : undefined,
        cursor,
      }),
  })
}

export interface ReportStats {
  total: number
  pending: number
  actioned: number
  dismissed: number
}

export function useReportsStats() {
  return useQuery<ReportStats>({
    queryKey: reportStatsKeys,
    queryFn: () => getReportsStats(),
    staleTime: 30_000,
  })
}
