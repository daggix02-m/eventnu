'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui'
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination'

interface PaginationProps {
  page: number
  totalPages: number
  count: number
  perPage?: number
  onPageChange: (page: number) => void
}

export function Pagination({
  page,
  totalPages,
  count,
  perPage = DEFAULT_PAGE_SIZE,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const start = (page - 1) * perPage + 1
  const end = Math.min(page * perPage, count)

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-outline-variant">
      <p className="font-mono text-sm text-muted-foreground tabular-nums">
        Showing {start}–{end} of {count}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </Button>
        <span className="font-mono text-sm text-muted-foreground tabular-nums">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  )
}
