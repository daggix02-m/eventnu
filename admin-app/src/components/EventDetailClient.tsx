'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { getErrorMessage } from '@/lib/errors'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Tag,
  DollarSign,
  Globe,
  Video,
  Edit,
  CheckCircle,
  XCircle,
  Archive,
  RotateCcw,
  Trash2,
  Star,
  Eye,
  StickyNote,
  History,
  Save,
  Info,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { Badge } from '@/components/ui'
import { Card } from '@/components/ui'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'
import {
  updateEvent,
  updateEventStatus,
  featureEvent,
  unfeatureEvent,
  deleteEvent,
} from '@/lib/actions/events'
import { PickedImage } from '@/components/media/ImagePicker'
import { PublishToInstagramDialog } from '@/components/instagram/PublishToInstagramDialog'
import { Instagram } from 'lucide-react'
import {
  EventForm,
  Category,
  Host,
  Organizer,
  FeaturedSection,
  EventFormValues,
} from '@/components/event/EventForm'
import type { MappedEvent, MappedModerationLog } from '@/lib/mappers'
import Link from 'next/link'

interface EventCategory {
  category_id: string
  is_primary: boolean
  name?: string
  slug?: string
  icon?: string | null
}

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

const actionLabelMap: Record<string, string> = {
  create_event: 'Created',
  edit_event: 'Edited',
  publish_event: 'Published',
  reject_event: 'Rejected',
  archive_event: 'Archived',
  cancel_event: 'Cancelled',
  restore_event: 'Restored to Draft',
  feature_event: 'Featured',
  unfeature_event: 'Unfeatured',
  delete_event: 'Deleted',
}

function SectionHeader({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="flex items-baseline gap-2 border-b border-outline-variant pb-3 mb-5">
      <Icon size={14} className="text-primary self-center" />
      <h3 className="font-headline text-base font-semibold text-foreground">{title}</h3>
    </div>
  )
}

function FieldGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div>{children}</div>
    </div>
  )
}

export function EventDetailClient({
  event,
  eventCategories,
  allCategories,
  hosts,
  organizers,
  featuredSections = [],
  moderationLogs,
  initialImages,
}: {
  event: MappedEvent
  eventCategories: EventCategory[]
  allCategories: Category[]
  hosts: Host[]
  organizers: Organizer[]
  featuredSections?: FeaturedSection[]
  moderationLogs: MappedModerationLog[]
  initialImages?: PickedImage[]
}) {
  const router = useRouter()
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [adminNote, setAdminNote] = useState(event.admin_note || '')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const initialForm = useMemo<Partial<EventFormValues>>(
    () => ({
      title: event.title || '',
      slug: event.slug || '',
      description: event.description || '',
      categoryId: eventCategories.find((c) => c.is_primary)?.category_id || '',
      subcategoryIds: eventCategories.filter((c) => !c.is_primary).map((c) => c.category_id),
      start_date: event.start_date ? event.start_date.slice(0, 16) : '',
      end_date: event.end_date ? event.end_date.slice(0, 16) : '',
      timezone: event.timezone || 'Africa/Addis_Ababa',
      venue_name: event.venue_name || '',
      venue_address: event.venue_address || '',
      venue_map_link: event.venue_map_link || '',
      is_free: event.is_free ?? false,
      price_display: event.price_display || '',
      action_type: event.action_type || 'open_entry',
      external_link: event.external_link || '',
      external_link_label: event.external_link_label || '',
      contact_email: event.contact_email || '',
      reservation_limit: event.reservation_limit?.toString() || '',
      ownershipType: event.is_standalone
        ? 'standalone'
        : event.host_id
          ? 'host'
          : event.organizer_id
            ? 'organizer'
            : 'standalone',
      host_id: event.host_id || '',
      organizer_id: event.organizer_id || '',
      status: event.status || 'draft',
      frequency_type: event.frequency_type || 'one_time',
      is_featured: event.is_featured ?? false,
      featured_section: event.featured_section || 'editors_choice',
      teaser_video_url: event.teaser_video_url || '',
      video_aspect_ratio: event.video_aspect_ratio || '',
      poster_url: event.poster_url || '',
      image_aspect_ratio: event.image_aspect_ratio || 'original',
      admin_note: event.admin_note || '',
      images: (initialImages ?? []).map((img) => ({
        url: img.url,
        storageId: img.storageId,
        filter: img.filter || 'original',
      })),
    }),
    [event, eventCategories, initialImages],
  )

  const handleStatusAction = async (status: string) => {
    try {
      setLoading(true)
      await updateEventStatus(event.id, status)
      toast.success(`Event ${status.replace('_', ' ')} successfully`)
      router.refresh()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Action failed'))
    } finally {
      setLoading(false)
    }
  }

  const handleFeatureToggle = async () => {
    try {
      setLoading(true)
      if (event.is_featured) {
        await unfeatureEvent(event.id)
        toast.success('Event unfeatured')
      } else {
        await featureEvent(event.id, 'editors_choice', null)
        toast.success('Event featured')
      }
      router.refresh()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Action failed'))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setShowDeleteDialog(false)
    try {
      setLoading(true)
      await deleteEvent(event.id)
      toast.success('Event deleted')
      router.push('/events')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete event'))
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNote = async () => {
    try {
      setLoading(true)
      await updateEvent(event.id, { admin_note: adminNote })
      toast.success('Note saved')
      router.refresh()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save note'))
    } finally {
      setLoading(false)
    }
  }

  const sourceType = event.is_standalone
    ? 'standalone'
    : event.host_id
      ? 'host'
      : event.organizer_id
        ? 'organizer'
        : 'unknown'

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/events"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft size={18} />
              </Link>
              <h1 className="font-headline text-2xl font-semibold text-foreground tracking-tight">
                {event.title}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant={statusVariantMap[event.status] || 'outline'} className="capitalize">
                {event.status?.replace('_', ' ')}
              </Badge>
              {event.is_featured && (
                <Badge variant="default" className="flex items-center gap-1">
                  <Star size={11} fill="currentColor" />
                  {event.featured_section || 'Featured'}
                </Badge>
              )}
              <Badge variant="outline" className="capitalize">
                {sourceType}
              </Badge>
              {event.source === 'instagram' && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Instagram size={11} />
                  Instagram
                </Badge>
              )}
              <Badge variant="outline" className="capitalize">
                {event.frequency_type?.replace('_', ' ')}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {!editMode && (
              <PublishToInstagramDialog
                eventId={event.id}
                title={initialForm.title ?? ''}
                description={initialForm.description ?? ''}
                venueName={initialForm.venue_name ?? ''}
                imageCount={initialForm.images?.length ?? 0}
                instaPermalink={event.insta_permalink}
              />
            )}
            <Button variant="outline" onClick={() => setEditMode(!editMode)} className="gap-2">
              {editMode ? <Eye size={16} /> : <Edit size={16} />}
              {editMode ? 'View Mode' : 'Edit'}
            </Button>
            {!editMode && event.status !== 'published' && (
              <Button
                onClick={() => handleStatusAction('published')}
                disabled={loading}
                className="gap-2"
              >
                <CheckCircle size={16} /> Publish
              </Button>
            )}
            {!editMode && event.status !== 'cancelled' && (
              <Button
                variant="outline"
                onClick={() => handleStatusAction('cancelled')}
                disabled={loading}
                className="gap-2 text-destructive border-destructive"
              >
                <XCircle size={16} /> Cancel
              </Button>
            )}
            {!editMode && (
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
                disabled={loading}
                className="gap-2 text-destructive border-destructive"
                aria-label="Delete event"
              >
                <Trash2 size={16} />
              </Button>
            )}
          </div>
        </div>

        {editMode ? (
          /* Edit Mode — shared EventForm */
          <EventForm
            mode="edit"
            eventId={event.id}
            categories={allCategories}
            hosts={hosts}
            organizers={organizers}
            featuredSections={featuredSections}
            initial={initialForm}
            onCancel={() => setEditMode(false)}
            onSaved={() => setEditMode(false)}
          />
        ) : (
          /* View Mode */
          <div className="space-y-6">
            {/* Media Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {event.poster_url && (
                <Card className="overflow-hidden">
                  <div className="aspect-video bg-surface-container-high">
                    <img
                      src={event.poster_url}
                      alt=""
                      width={640}
                      height={360}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="px-4 py-2 font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
                    Poster
                  </div>
                </Card>
              )}
              {event.teaser_video_url && (
                <Card className="overflow-hidden">
                  <div className="aspect-video bg-surface-container-high flex items-center justify-center">
                    <Video size={48} className="text-muted-foreground" />
                  </div>
                  <div className="px-4 py-2 font-mono text-[11px] text-muted-foreground truncate">
                    {event.teaser_video_url}
                  </div>
                </Card>
              )}
            </div>

            {/* Categories */}
            {eventCategories.length > 0 && (
              <Card className="p-6">
                <SectionHeader icon={Tag} title="Categories" />
                <div className="flex flex-wrap gap-2">
                  {eventCategories.map((ec) => (
                    <Badge key={ec.category_id} variant={ec.is_primary ? 'default' : 'outline'}>
                      {ec.name || ec.category_id}
                      {ec.is_primary && ' (Primary)'}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <SectionHeader icon={Info} title="Details" />
                <div className="space-y-3">
                  <FieldGroup label="Title">
                    <p className="text-sm font-medium text-foreground">{event.title}</p>
                  </FieldGroup>
                  <FieldGroup label="Description">
                    <p className="text-sm text-muted-foreground">{event.description || '—'}</p>
                  </FieldGroup>
                  <FieldGroup label="Status">
                    <Badge
                      variant={statusVariantMap[event.status] || 'outline'}
                      className="capitalize"
                    >
                      {event.status?.replace('_', ' ')}
                    </Badge>
                  </FieldGroup>
                </div>
              </Card>

              <Card className="p-6">
                <SectionHeader icon={Calendar} title="Date & Time" />
                <div className="space-y-3">
                  <FieldGroup label="Start">
                    <p className="text-sm text-foreground">
                      {event.start_date ? new Date(event.start_date).toLocaleString() : '—'}
                    </p>
                  </FieldGroup>
                  <FieldGroup label="End">
                    <p className="text-sm text-foreground">
                      {event.end_date ? new Date(event.end_date).toLocaleString() : '—'}
                    </p>
                  </FieldGroup>
                  <FieldGroup label="Timezone">
                    <p className="font-mono text-sm text-muted-foreground">
                      {event.timezone || '—'}
                    </p>
                  </FieldGroup>
                  <FieldGroup label="Frequency">
                    <Badge variant="outline" className="capitalize">
                      {event.frequency_type?.replace('_', ' ')}
                    </Badge>
                  </FieldGroup>
                </div>
              </Card>

              <Card className="p-6">
                <SectionHeader icon={MapPin} title="Location" />
                <div className="space-y-3">
                  <FieldGroup label="Venue">
                    <p className="text-sm text-foreground">{event.venue_name || '—'}</p>
                  </FieldGroup>
                  <FieldGroup label="Address">
                    <p className="text-sm text-muted-foreground">{event.venue_address || '—'}</p>
                  </FieldGroup>
                  {event.venue_map_link && (
                    <FieldGroup label="Map Link">
                      <a
                        href={event.venue_map_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Open Map
                      </a>
                    </FieldGroup>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <SectionHeader icon={DollarSign} title="Pricing & Access" />
                <div className="space-y-3">
                  <FieldGroup label="Price">
                    <p className="text-sm text-foreground">
                      {event.is_free ? 'Free' : event.price_display || '—'}
                    </p>
                  </FieldGroup>
                  <FieldGroup label="Action Type">
                    <Badge variant="outline" className="capitalize">
                      {event.action_type?.replace('_', ' ')}
                    </Badge>
                  </FieldGroup>
                  {event.action_type === 'external_link' && (
                    <FieldGroup label="External Link">
                      <a
                        href={event.external_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline truncate block"
                      >
                        {event.external_link}
                      </a>
                    </FieldGroup>
                  )}
                  {event.action_type === 'contact' && (
                    <FieldGroup label="Contact Email">
                      <p className="text-sm text-foreground">{event.contact_email || '—'}</p>
                    </FieldGroup>
                  )}
                  {event.action_type === 'reservation' && (
                    <FieldGroup label="Reservation Limit">
                      <p className="text-sm text-foreground">
                        {event.reservation_limit || 'Unlimited'}
                      </p>
                    </FieldGroup>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <SectionHeader icon={Globe} title="Ownership" />
                <div className="space-y-3">
                  <FieldGroup label="Source">
                    <Badge variant="outline" className="capitalize">
                      {sourceType}
                    </Badge>
                  </FieldGroup>
                  {event.host_id && hosts.find((h) => h.id === event.host_id) && (
                    <FieldGroup label="Host">
                      <p className="text-sm text-foreground">
                        {hosts.find((h) => h.id === event.host_id)?.name}
                      </p>
                    </FieldGroup>
                  )}
                  {event.organizer_id &&
                    organizers.find((o) => o.profile_id === event.organizer_id) && (
                      <FieldGroup label="Organizer">
                        <p className="text-sm text-foreground">
                          {
                            organizers.find((o) => o.profile_id === event.organizer_id)
                              ?.organizer_name
                          }
                        </p>
                      </FieldGroup>
                    )}
                  {event.is_standalone && (
                    <p className="text-xs text-muted-foreground">
                      Standalone event (no host or organizer)
                    </p>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <SectionHeader icon={Globe} title="Metadata" />
                <div className="space-y-3">
                  <FieldGroup label="Event ID">
                    <p className="font-mono text-xs text-muted-foreground">{event.id}</p>
                  </FieldGroup>
                  <FieldGroup label="Created">
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.created_at).toLocaleString()}
                    </p>
                  </FieldGroup>
                  <FieldGroup label="Updated">
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.updated_at).toLocaleString()}
                    </p>
                  </FieldGroup>
                  <FieldGroup label="Likes">
                    <p className="text-sm text-foreground">{event.like_count ?? 0}</p>
                  </FieldGroup>
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="p-6">
              <SectionHeader icon={Globe} title="Quick Actions" />
              <div className="flex flex-wrap gap-2">
                {event.status !== 'published' && (
                  <Button
                    size="sm"
                    onClick={() => handleStatusAction('published')}
                    disabled={loading}
                    className="gap-1.5"
                  >
                    <CheckCircle size={14} /> Publish
                  </Button>
                )}
                {event.status !== 'rejected' && event.status !== 'published' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusAction('rejected')}
                    disabled={loading}
                    className="gap-1.5 text-destructive border-destructive"
                  >
                    <XCircle size={14} /> Reject
                  </Button>
                )}
                {event.status !== 'archived' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusAction('archived')}
                    disabled={loading}
                    className="gap-1.5"
                  >
                    <Archive size={14} /> Archive
                  </Button>
                )}
                {event.status !== 'cancelled' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusAction('cancelled')}
                    disabled={loading}
                    className="gap-1.5 text-destructive border-destructive"
                  >
                    <XCircle size={14} /> Cancel
                  </Button>
                )}
                {(event.status === 'archived' ||
                  event.status === 'rejected' ||
                  event.status === 'cancelled') && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusAction('draft')}
                    disabled={loading}
                    className="gap-1.5"
                  >
                    <RotateCcw size={14} /> Restore to Draft
                  </Button>
                )}
                <div className="w-px h-8 bg-outline-variant mx-1" />
                {event.is_featured ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleFeatureToggle}
                    disabled={loading}
                    className="gap-1.5"
                  >
                    <Star size={14} /> Unfeature
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleFeatureToggle}
                    disabled={loading}
                    className="gap-1.5 text-primary"
                  >
                    <Star size={14} /> Feature
                  </Button>
                )}
                <div className="w-px h-8 bg-outline-variant mx-1" />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={loading}
                  className="gap-1.5 text-destructive border-destructive"
                >
                  <Trash2 size={14} /> Delete
                </Button>
              </div>
            </Card>

            {/* Admin Notes */}
            <Card className="p-6">
              <SectionHeader icon={StickyNote} title="Admin Notes" />
              <div className="space-y-3">
                <textarea
                  rows={3}
                  placeholder="Internal admin notes..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 resize-none"
                />
                <div className="flex justify-end">
                  <Button size="sm" onClick={handleSaveNote} disabled={loading} className="gap-1.5">
                    <Save size={14} /> Save Note
                  </Button>
                </div>
              </div>
            </Card>

            {/* Moderation History */}
            <Card className="p-6">
              <SectionHeader icon={History} title="Moderation History" />
              {moderationLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No moderation actions recorded.</p>
              ) : (
                <div className="space-y-3">
                  {moderationLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-high"
                    >
                      <div className="p-1.5 rounded-lg bg-surface-container-low">
                        <History size={14} className="text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {actionLabelMap[log.action] || log.action}
                          </span>
                          {log.note && (
                            <span className="text-xs text-muted-foreground">— {log.note}</span>
                          )}
                        </div>
                        <p className="font-mono text-xs text-muted-foreground mt-0.5">
                          {(Array.isArray(log.profiles)
                            ? log.profiles[0]?.full_name
                            : log.profiles?.full_name) || 'System'}{' '}
                          · {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          if (!open) setShowDeleteDialog(false)
        }}
        title="Delete event?"
        description="Are you sure you want to delete this event? This cannot be undone."
        confirmLabel="Delete"
        destructive
        loading={loading}
        onConfirm={handleDelete}
      />
    </>
  )
}
