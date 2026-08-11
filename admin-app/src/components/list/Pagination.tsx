'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui'

interface PaginationProps {
  hasPrev: boolean
  hasNext: boolean
  onPrev: () => void
  onNext: () => void
  pageIndex?: number
  disabled?: boolean
}

export function Pagination({
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  pageIndex = 1,
  disabled = false,
}: PaginationProps) {
  if (pageIndex === 1 && !hasPrev && !hasNext) return null

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-outline-variant">
      <p className="font-mono text-sm text-muted-foreground tabular-nums">Page {pageIndex}</p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!hasPrev || disabled}
          onClick={onPrev}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </Button>
        <span className="font-mono text-sm text-muted-foreground tabular-nums">{pageIndex}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasNext || disabled}
          onClick={onNext}
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  )
}
