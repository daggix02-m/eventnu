'use client'

import { getReports } from '@/lib/actions/reports'
import { usePaginatedList } from './use-paginated-list'
import type { MappedReport } from '@/lib/mappers'

export const reportsKeys = ['reports'] as const

export interface ReportListFilters {
  status?: string
  targetType?: string
  page?: number
}

export function useReports(
  filters: ReportListFilters,
  initial: { reports: MappedReport[]; count: number },
  initialFilters: ReportListFilters,
) {
  return usePaginatedList<MappedReport, ReportListFilters>({
    queryKey: reportsKeys,
    filters,
    initialFilters,
    initial: initial
      ? { items: initial.reports, total: initial.count, all: initial.reports }
      : undefined,
    page: filters.page ?? 1,
    fetchAll: async () => {
      const { reports } = await getReports({
        status: filters.status !== 'all' ? filters.status : undefined,
        targetType: filters.targetType !== 'all' ? filters.targetType : undefined,
      })
      return reports
    },
  })
}
