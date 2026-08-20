'use client'

import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getErrorMessage } from '@/lib/errors'
import { formatDate } from '@/lib/format'
import {
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
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { PageHeader } from '@/components/layout/PageLayout'
import {
  DataTable,
  EmptyState,
  FilterSelect,
  Pagination,
  SearchInput,
  useListFilters,
} from '@/components/list'
import { toast } from 'sonner'
import {
  updateEventStatus,
  bulkUpdateEventStatus,
  featureEvent,
  unfeatureEvent,
  deleteEvent,
} from '@/lib/actions/events'
import { eventsKeys, useEvents } from '@/lib/api/events'
import type { EventsListFilters } from '@/lib/api/events'
import type { CursorPage } from '@/lib/api/use-paginated-list'
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

const featuredOptions = [
  { value: 'all', label: 'All Featured' },
  { value: 'true', label: 'Featured Only' },
  { value: 'false', label: 'Not Featured' },
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

export function EventsClient({
  initial,
  initialFilters,
}: {
  initial: CursorPage<MappedEvent>
  initialFilters: EventsListFilters
}) {
  const queryClient = useQueryClient()
  const { filters, update, searchInput, setSearchInput } = useListFilters<EventsListFilters>({
    basePath: '/events',
    initial: initialFilters,
    defaults: { search: '', status: 'all', source: 'all', frequency: 'all' },
  })
  const [loading, setLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

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

  const { data, isFetching, hasPrev, hasNext, next, prev, pageIndex } = useEvents({
    filters,
    initial,
    initialFilters,
  })

  const events = data?.items ?? []
  const count = events.length

  const refreshEvents = () => queryClient.invalidateQueries({ queryKey: eventsKeys })

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
            <SearchInput
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search events…"
              className="flex-1 min-w-[200px]"
            />

            <FilterSelect
              value={filters.status || 'all'}
              onChange={(v) => update('status', v)}
              options={statusOptions}
            />

            <FilterSelect
              value={filters.source || 'all'}
              onChange={(v) => update('source', v)}
              options={sourceOptions}
            />

            <FilterSelect
              value={filters.frequency || 'all'}
              onChange={(v) => update('frequency', v)}
              options={frequencyOptions}
            />

            <FilterSelect
              value={
                filters.featured === true ? 'true' : filters.featured === false ? 'false' : 'all'
              }
              onChange={(v) =>
                update('featured', v === 'true' ? true : v === 'false' ? false : undefined)
              }
              options={featuredOptions}
            />
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

        <DataTable<MappedEvent>
          data={events}
          rowKey={(event) => event.id}
          loading={isFetching || loading}
          selection={{
            selectedIds,
            onToggleAll: (checked) => setSelectedIds(checked ? events.map((e) => e.id) : []),
            onToggle: (id, checked) =>
              setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id))),
            allSelected: selectedIds.length === events.length && events.length > 0,
          }}
          empty={
            <EmptyState
              icon={Calendar}
              title="No events found."
              description="Try adjusting your filters."
            />
          }
          footer={
            <Pagination
              hasPrev={hasPrev}
              hasNext={hasNext}
              onPrev={prev}
              onNext={next}
              pageIndex={pageIndex}
              disabled={isFetching}
            />
          }
          columns={[
            {
              key: 'event',
              header: 'Event',
              render: (event) => (
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
              ),
            },
            {
              key: 'date',
              header: 'Date',
              render: (event) => (
                <p className="font-mono text-xs text-muted-foreground tabular-nums">
                  {event.start_date ? formatDate(event.start_date) : '—'}
                </p>
              ),
            },
            {
              key: 'source',
              header: 'Source',
              render: (event) =>
                event.source === 'instagram' ? (
                  <Badge
                    variant="outline"
                    className="text-xs flex w-fit items-center gap-1 bg-[#E1306C]/10 text-[#E1306C] border-[#E1306C]/20"
                  >
                    <Instagram size={11} />
                    Instagram
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    {event.is_standalone ? 'Standalone' : event.owner_id ? 'Organizer' : 'Unknown'}
                  </Badge>
                ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (event) => (
                <Badge
                  variant={statusVariantMap[event.status] || 'outline'}
                  className="text-xs capitalize"
                >
                  {event.status.replace('_', ' ')}
                </Badge>
              ),
            },
            {
              key: 'featured',
              header: 'Featured',
              render: (event) =>
                event.is_featured ? (
                  <div className="flex items-center gap-1 text-primary">
                    <Star size={14} fill="currentColor" />
                    <span className="text-xs font-medium">
                      {event.featured_section || 'Featured'}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                ),
            },
            {
              key: 'engagement',
              header: 'Engagement',
              render: (event) => (
                <span className="text-sm text-muted-foreground">
                  <span className="font-mono text-xs tabular-nums">{event.like_count ?? 0}</span>
                  <span className="text-xs"> likes</span>
                </span>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              headerClassName: 'text-right',
              className: 'text-right',
              render: (event) => (
                <div className="relative flex items-center justify-end gap-1 action-menu-container">
                  <Link
                    href={`/events/${event.id}`}
                    className="p-2 rounded-md hover:bg-surface-container-high transition-colors text-muted-foreground hover:text-foreground"
                    aria-label="Edit event"
                  >
                    <Edit size={16} />
                  </Link>
                  <button
                    onClick={() => setActionMenuOpen(actionMenuOpen === event.id ? null : event.id)}
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
              ),
            },
          ]}
        />
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
