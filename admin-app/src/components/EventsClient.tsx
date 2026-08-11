'use client'

import { useState, useEffect } from 'react'
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { getErrorMessage } from '@/lib/errors'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Star,
  MoreHorizontal,
  Calendar,
  CheckCircle,
  XCircle,
  Archive,
  RotateCcw,
  Trash2,
  Eye,
  Edit,
  Instagram,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { Badge } from '@/components/ui'
import { Select } from '@/components/ui'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { PageHeader } from '@/components/Page'
import { toast } from 'sonner'
import {
  getEvents,
  updateEventStatus,
  bulkUpdateEventStatus,
  featureEvent,
  unfeatureEvent,
  deleteEvent,
} from '@/lib/actions/events'
import type { MappedEvent } from '@/lib/mappers'
import Link from 'next/link'

const statusOptions = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'published', label: 'Published' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'archived', label: 'Archived' },
]

const sourceOptions = [
  { value: 'all', label: 'All' },
  { value: 'admin', label: 'Admin Posted' },
  { value: 'organizer', label: 'Organizer' },
  { value: 'host', label: 'Host' },
  { value: 'standalone', label: 'Standalone' },
  { value: 'instagram', label: 'Instagram' },
]

const frequencyOptions = [
  { value: 'all', label: 'All' },
  { value: 'one_time', label: 'One-Time' },
  { value: 'series', label: 'Series' },
  { value: 'recurring', label: 'Recurring' },
  { value: 'seasonal', label: 'Seasonal' },
]

const statusVariantMap: Record<
  string,
  'outline' | 'warning' | 'success' | 'destructive' | 'secondary'
> = {
  draft: 'outline',
  pending_review: 'warning',
  published: 'success',
  rejected: 'destructive',
  cancelled: 'secondary',
  archived: 'secondary',
}

interface EventListFilters {
  search?: string
  status?: string
  source?: string
  frequency?: string
  featured?: boolean
  page?: number
}

export function EventsClient({
  initialEvents,
  initialCount,
  initialFilters,
}: {
  initialEvents: MappedEvent[]
  initialCount: number
  initialFilters: EventListFilters
}) {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState(initialFilters)
  const [searchInput, setSearchInput] = useState(initialFilters.search || '')
  const [loading, setLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  useEffect(() => {
    setFilters(initialFilters)
    setSearchInput(initialFilters.search || '')
  }, [initialFilters])

  useEffect(() => {
    if (searchInput === (filters.search || '')) return
    const t = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput || undefined, page: 1 }))
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput, filters.search])

  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.search) params.set('search', filters.search)
    if (filters.status && filters.status !== 'all') params.set('status', filters.status)
    if (filters.source && filters.source !== 'all') params.set('source', filters.source)
    if (filters.frequency && filters.frequency !== 'all') params.set('frequency', filters.frequency)
    if (filters.featured === true) params.set('featured', 'true')
    if (filters.featured === false) params.set('featured', 'false')
    if (filters.page && filters.page > 1) params.set('page', String(filters.page))
    window.history.replaceState(null, '', `/events${params.size ? `?${params.toString()}` : ''}`)
  }, [filters])

  useEffect(() => {
    if (!actionMenuOpen) return
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.action-menu-container')) {
        setActionMenuOpen(null)
      }
    }
    document.addEventListener('click', handleOutsideClick)
    return () => document.removeEventListener('click', handleOutsideClick)
  }, [actionMenuOpen])

  const updateFilter = (key: string, value: string | boolean | number | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value, ...(key === 'page' ? {} : { page: 1 }) }))
  }

  const matchesInitial = JSON.stringify(filters) === JSON.stringify(initialFilters)

  const { data, isFetching } = useQuery({
    queryKey: ['events', filters],
    queryFn: () =>
      getEvents({
        status: filters.status !== 'all' ? filters.status : undefined,
        source: filters.source !== 'all' ? filters.source : undefined,
        featured: filters.featured,
        frequency: filters.frequency !== 'all' ? filters.frequency : undefined,
        search: filters.search || undefined,
        page: filters.page ?? 1,
        perPage: 20,
      }),
    initialData: matchesInitial ? { events: initialEvents, count: initialCount } : undefined,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

  const events = data?.events ?? []
  const count = data?.count ?? 0

  const refreshEvents = () => queryClient.invalidateQueries({ queryKey: ['events'] })

  const handleStatusAction = async (eventId: string, status: string) => {
    try {
      setLoading(true)
      await updateEventStatus(eventId, status)
      toast.success(`Event ${status.replace('_', ' ')} successfully`)
      await refreshEvents()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Action failed'))
    } finally {
      setLoading(false)
    }
  }

  const handleFeatureToggle = async (eventId: string, isFeatured: boolean) => {
    try {
      setLoading(true)
      if (isFeatured) {
        await unfeatureEvent(eventId)
        toast.success('Event unfeatured successfully')
      } else {
        await featureEvent(eventId, 'editors_choice', null)
        toast.success('Event featured successfully')
      }
      await refreshEvents()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Action failed'))
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    setDeleteTarget(null)
    try {
      setLoading(true)
      await deleteEvent(eventId)
      toast.success('Event deleted successfully')
      await refreshEvents()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete event'))
    } finally {
      setLoading(false)
    }
  }

  const handleBulkAction = async (status: string) => {
    if (selectedIds.length === 0) return
    try {
      setLoading(true)
      await bulkUpdateEventStatus(selectedIds, status)
      toast.success(`${selectedIds.length} events ${status.replace('_', ' ')}`)
      setSelectedIds([])
      await refreshEvents()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Bulk action failed'))
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(count / 20)

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Events"
          description="Manage all events across the platform."
          folio={`Fol. 02 · ${count} entries`}
          actions={
            <Link href="/events/new">
              <Button className="gap-2">
                <Plus size={16} />
                Create Event
              </Button>
            </Link>
          }
        />

        {/* Filters */}
        <div className="bg-card rounded-2xl border border-outline-variant p-4 shadow-sm space-y-4">
          <div className="flex flex-wrap gap-3">
            {/* Search */}
            <div className="flex items-center bg-surface-container-high rounded-md border border-outline-variant px-3 py-2 flex-1 min-w-[200px] focus-within:border-ring focus-within:ring-1 focus-within:ring-ring">
              <Search size={16} className="text-muted-foreground mr-2" />
              <input
                type="text"
                placeholder="Search events…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-muted-foreground outline-none"
              />
            </div>

            <Select
              value={filters.status || 'all'}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="w-auto min-w-[150px]"
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>

            <Select
              value={filters.source || 'all'}
              onChange={(e) => updateFilter('source', e.target.value)}
              className="w-auto min-w-[150px]"
            >
              {sourceOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>

            <Select
              value={filters.frequency || 'all'}
              onChange={(e) => updateFilter('frequency', e.target.value)}
              className="w-auto min-w-[140px]"
            >
              {frequencyOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>

            <Select
              value={
                filters.featured === true ? 'true' : filters.featured === false ? 'false' : 'all'
              }
              onChange={(e) =>
                updateFilter(
                  'featured',
                  e.target.value === 'true' ? true : e.target.value === 'false' ? false : undefined,
                )
              }
              className="w-auto min-w-[140px]"
            >
              <option value="all">All Featured</option>
              <option value="true">Featured Only</option>
              <option value="false">Not Featured</option>
            </Select>
          </div>

          {/* Bulk actions bar */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3 pt-3 border-t border-outline-variant">
              <span className="font-mono text-sm font-semibold text-foreground">
                {selectedIds.length} selected
              </span>
              <Button size="sm" variant="outline" onClick={() => setSelectedIds([])}>
                Deselect
              </Button>
              <Button size="sm" disabled={loading} onClick={() => handleBulkAction('published')}>
                Bulk Publish
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive border-destructive"
                disabled={loading}
                onClick={() => handleBulkAction('rejected')}
              >
                Bulk Reject
              </Button>
            </div>
          )}
        </div>

        {/* Table */}
        <div
          className={cn(
            'bg-card rounded-2xl border border-outline-variant overflow-hidden shadow-sm transition-opacity',
            (isFetching || loading) && 'opacity-60',
          )}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low border-b border-outline-variant">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      className="rounded border-outline-variant accent-primary"
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds(events.map((e) => e.id))
                        else setSelectedIds([])
                      }}
                      checked={selectedIds.length === events.length && events.length > 0}
                    />
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Featured
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Engagement
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {events.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-12 text-center text-sm text-muted-foreground"
                    >
                      No events found matching your filters.
                    </td>
                  </tr>
                ) : (
                  events.map((event) => (
                    <tr
                      key={event.id}
                      className="hover:bg-surface-container-low transition-colors group"
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          className="rounded border-outline-variant accent-primary"
                          checked={selectedIds.includes(event.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedIds((prev) => [...prev, event.id])
                            else setSelectedIds((prev) => prev.filter((id) => id !== event.id))
                          }}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-md bg-surface-container-high flex items-center justify-center overflow-hidden flex-shrink-0">
                            {event.poster_url ? (
                              <img
                                src={event.poster_url}
                                alt=""
                                width={40}
                                height={40}
                                loading="lazy"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Calendar size={16} className="text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/events/${event.id}`}
                              className="font-semibold text-sm text-foreground truncate hover:text-primary transition-colors block"
                            >
                              {event.title}
                            </Link>
                            <p className="font-mono text-[11px] text-muted-foreground">
                              {event.id.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-mono text-xs text-muted-foreground tabular-nums">
                          {event.start_date ? new Date(event.start_date).toLocaleDateString() : '—'}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        {event.source === 'instagram' ? (
                          <Badge
                            variant="outline"
                            className="text-xs flex w-fit items-center gap-1 bg-[#E1306C]/10 text-[#E1306C] border-[#E1306C]/20"
                          >
                            <Instagram size={11} />
                            Instagram
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            {event.is_standalone
                              ? 'Standalone'
                              : event.host_id
                                ? 'Host'
                                : event.organizer_id
                                  ? 'Organizer'
                                  : 'Unknown'}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          variant={statusVariantMap[event.status] || 'outline'}
                          className="text-xs capitalize"
                        >
                          {event.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        {event.is_featured ? (
                          <div className="flex items-center gap-1 text-primary">
                            <Star size={14} fill="currentColor" />
                            <span className="text-xs font-medium">
                              {event.featured_section || 'Featured'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        <span className="font-mono text-xs tabular-nums">
                          {event.like_count ?? 0}
                        </span>
                        <span className="text-xs"> likes</span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="relative flex items-center justify-end gap-1 action-menu-container">
                          <Link
                            href={`/events/${event.id}`}
                            className="p-2 rounded-md hover:bg-surface-container-high transition-colors text-muted-foreground hover:text-foreground"
                            aria-label="Edit event"
                          >
                            <Edit size={16} />
                          </Link>
                          <button
                            onClick={() =>
                              setActionMenuOpen(actionMenuOpen === event.id ? null : event.id)
                            }
                            className="p-2 rounded-md hover:bg-surface-container-high transition-colors"
                            aria-label="More actions"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          {actionMenuOpen === event.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-card rounded-md border border-outline-variant shadow-lg z-50 py-1">
                              {event.status === 'pending_review' && (
                                <>
                                  <button
                                    onClick={() => {
                                      handleStatusAction(event.id, 'published')
                                      setActionMenuOpen(null)
                                    }}
                                    className="w-full px-4 py-2 text-sm text-left hover:bg-surface-container-low flex items-center gap-2"
                                  >
                                    <CheckCircle size={14} className="text-success" /> Publish
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleStatusAction(event.id, 'rejected')
                                      setActionMenuOpen(null)
                                    }}
                                    className="w-full px-4 py-2 text-sm text-left hover:bg-surface-container-low flex items-center gap-2"
                                  >
                                    <XCircle size={14} className="text-destructive" /> Reject
                                  </button>
                                </>
                              )}
                              {event.status === 'published' && (
                                <button
                                  onClick={() => {
                                    handleStatusAction(event.id, 'archived')
                                    setActionMenuOpen(null)
                                  }}
                                  className="w-full px-4 py-2 text-sm text-left hover:bg-surface-container-low flex items-center gap-2"
                                >
                                  <Archive size={14} /> Archive
                                </button>
                              )}
                              {(event.status === 'archived' ||
                                event.status === 'rejected' ||
                                event.status === 'cancelled') && (
                                <button
                                  onClick={() => {
                                    handleStatusAction(event.id, 'draft')
                                    setActionMenuOpen(null)
                                  }}
                                  className="w-full px-4 py-2 text-sm text-left hover:bg-surface-container-low flex items-center gap-2"
                                >
                                  <RotateCcw size={14} /> Restore to Draft
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  handleStatusAction(event.id, 'cancelled')
                                  setActionMenuOpen(null)
                                }}
                                className="w-full px-4 py-2 text-sm text-left hover:bg-surface-container-low flex items-center gap-2"
                              >
                                <XCircle size={14} className="text-destructive" /> Cancel
                              </button>
                              <div className="border-t border-outline-variant my-1" />
                              {event.is_featured ? (
                                <button
                                  onClick={() => {
                                    handleFeatureToggle(event.id, true)
                                    setActionMenuOpen(null)
                                  }}
                                  className="w-full px-4 py-2 text-sm text-left hover:bg-surface-container-low flex items-center gap-2"
                                >
                                  <Star size={14} /> Unfeature
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    handleFeatureToggle(event.id, false)
                                    setActionMenuOpen(null)
                                  }}
                                  className="w-full px-4 py-2 text-sm text-left hover:bg-surface-container-low flex items-center gap-2"
                                >
                                  <Star size={14} className="text-primary" /> Feature
                                </button>
                              )}
                              <div className="border-t border-outline-variant my-1" />
                              <Link
                                href={`/events/${event.id}`}
                                onClick={() => setActionMenuOpen(null)}
                                className="w-full px-4 py-2 text-sm text-left hover:bg-surface-container-low flex items-center gap-2"
                              >
                                <Eye size={14} /> View
                              </Link>
                              <button
                                onClick={() => {
                                  setDeleteTarget(event.id)
                                  setActionMenuOpen(null)
                                }}
                                className="w-full px-4 py-2 text-sm text-left hover:bg-destructive/10 text-destructive flex items-center gap-2"
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-outline-variant">
              <p className="font-mono text-sm text-muted-foreground tabular-nums">
                {((filters.page || 1) - 1) * 20 + 1}–{Math.min((filters.page || 1) * 20, count)} of{' '}
                {count}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(filters.page ?? 1) <= 1}
                  onClick={() => updateFilter('page', (filters.page || 1) - 1)}
                >
                  <ChevronLeft size={14} />
                </Button>
                <span className="font-mono text-sm text-muted-foreground tabular-nums">
                  {filters.page || 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(filters.page ?? 1) >= totalPages}
                  onClick={() => updateFilter('page', (filters.page || 1) + 1)}
                >
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Delete event?"
        description="Are you sure you want to delete this event? This cannot be undone."
        confirmLabel="Delete"
        destructive
        loading={loading}
        onConfirm={() => deleteTarget && handleDeleteEvent(deleteTarget)}
      />
    </>
  )
}
