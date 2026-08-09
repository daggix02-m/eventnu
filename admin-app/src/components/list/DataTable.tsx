'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface DataTableColumn<T> {
  key: string
  header: string
  /** Applied to the <th>. */
  headerClassName?: string
  /** Applied to each <td> for this column. */
  className?: string
  render: (row: T) => ReactNode
}

interface DataTableSelection {
  selectedIds: string[]
  onToggleAll: (checked: boolean) => void
  onToggle: (id: string, checked: boolean) => void
  allSelected: boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: DataTableColumn<T>[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  selectedRowKey?: string | null
  selection?: DataTableSelection
  empty: ReactNode
  footer?: ReactNode
  loading?: boolean
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  onRowClick,
  selectedRowKey,
  selection,
  empty,
  footer,
  loading,
}: DataTableProps<T>) {
  const colSpan = columns.length + (selection ? 1 : 0)

  return (
    <div
      className={cn(
        'bg-card rounded-2xl border border-outline-variant overflow-hidden shadow-sm transition-opacity',
        loading && 'opacity-60',
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-surface-container-low border-b border-outline-variant">
            <tr>
              {selection && (
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    className="rounded border-outline-variant accent-primary"
                    checked={selection.allSelected}
                    onChange={(e) => selection.onToggleAll(e.target.checked)}
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider',
                    column.headerClassName,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {data.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-4 py-12">
                  {empty}
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const key = rowKey(row)
                return (
                  <tr
                    key={key}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      'hover:bg-surface-container-low transition-colors',
                      onRowClick && 'cursor-pointer',
                      selectedRowKey === key && 'bg-surface-container-high',
                    )}
                  >
                    {selection && (
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          className="rounded border-outline-variant accent-primary"
                          checked={selection.selectedIds.includes(key)}
                          onChange={(e) => selection.onToggle(key, e.target.checked)}
                          aria-label="Select row"
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td key={column.key} className={cn('px-4 py-4', column.className)}>
                        {column.render(row)}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  )
}
