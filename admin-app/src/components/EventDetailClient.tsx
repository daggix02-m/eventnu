'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
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
  Image,
  Info,
  Users,
} from 'lucide-react'
import { Button } from 'company-design-system'
import { Badge } from 'company-design-system'
import { Card } from 'company-design-system'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  updateEvent,
  updateEventStatus,
  featureEvent,
  unfeatureEvent,
  deleteEvent,
} from '@/lib/actions/events'
import { ImagePicker, PickedImage } from '@/components/media/ImagePicker'
import { PostPreview } from '@/components/media/PostPreview'
import { PublishToInstagramDialog } from '@/components/instagram/PublishToInstagramDialog'
import { Instagram } from 'lucide-react'
import Link from 'next/link'

interface Category {
  id: string
  name: string
  slug: string
  parent_id?: string | null
  icon?: string | null
}

interface EventCategory {
  category_id: string
  is_primary: boolean
  name?: string
  slug?: string
  icon?: string | null
}

interface Host {
  id: string
  name: string
  slug: string
}

interface Organizer {
  profile_id: string
  organizer_name: string
  organizer_handle?: string | null
}

const statusBadgeStyles: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  pending_review: 'bg-warning/10 text-warning border-warning/20',
  published: 'bg-success/10 text-success border-success/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  cancelled: 'bg-muted text-muted-foreground',
  archived: 'bg-muted text-muted-foreground',
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

export function EventDetailClient({
  event,
  eventCategories,
  allCategories,
  hosts,
  organizers,
  moderationLogs,
  initialImages,
}: {
  event: any
  eventCategories: EventCategory[]
  allCategories: Category[]
  hosts: Host[]
  organizers: Organizer[]
  moderationLogs: any[]
  initialImages?: PickedImage[]
}) {
  const router = useRouter()
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [adminNote, setAdminNote] = useState(event.admin_note || '')

  const [form, setForm] = useState({
    title: event.title || '',
    slug: event.slug || '',
    description: event.description || '',
    categoryId: eventCategories.find((c: any) => c.is_primary)?.category_id || '',
    subcategoryIds: eventCategories.filter((c: any) => !c.is_primary).map((c: any) => c.category_id),
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
    ownershipType: event.is_standalone ? 'standalone' : event.host_id ? 'host' : 'organizer' as 'host' | 'organizer' | 'standalone',
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
    images: (initialImages ?? []).map((img) => ({
      url: img.url,
      storageId: img.storageId,
      filter: img.filter || 'original',
    })),
  })

  const updateField = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const parentCategories = allCategories.filter(c => !c.parent_id)
  const subCategories = allCategories.filter(c => c.parent_id)

  const handleSave = async () => {
    try {
      setLoading(true)
      const categoryIds = [form.categoryId, ...form.subcategoryIds].filter(Boolean)

      await updateEvent(event.id, {
        title: form.title,
        slug: form.slug || null,
        description: form.description,
        start_date: form.start_date,
        end_date: form.end_date || null,
        poster_url: (form.images[0]?.url ?? form.poster_url) || null,
        image_aspect_ratio: form.image_aspect_ratio || null,
        images: form.images.map(img => ({
          url: img.url,
          storageId: img.storageId,
          filter: img.filter,
        })),
        venue_name: form.venue_name,
        venue_address: form.venue_address,
        venue_map_link: form.venue_map_link || null,
        is_free: form.is_free,
        price_display: form.price_display || null,
        action_type: form.action_type,
        external_link: form.external_link || null,
        external_link_label: form.external_link_label || null,
        contact_email: form.contact_email || null,
        reservation_limit: form.reservation_limit ? parseInt(form.reservation_limit) : null,
        host_id: form.ownershipType === 'host' ? form.host_id : null,
        organizer_id: form.ownershipType === 'organizer' ? form.organizer_id : null,
        is_standalone: form.ownershipType === 'standalone',
        frequency_type: form.frequency_type,
        teaser_video_url: form.teaser_video_url || null,
        video_aspect_ratio: form.video_aspect_ratio || null,
        is_featured: form.is_featured,
        featured_section: form.is_featured ? form.featured_section : null,
        timezone: form.timezone,
        source: 'admin',
        categoryIds,
      })

      toast.success('Event updated successfully')
      setEditMode(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update event')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusAction = async (status: string) => {
    try {
      setLoading(true)
      await updateEventStatus(event.id, status)
      toast.success(`Event ${status.replace('_', ' ')} successfully`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Action failed')
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
    } catch (err: any) {
      toast.error(err.message || 'Action failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event? This cannot be undone.')) return
    try {
      setLoading(true)
      await deleteEvent(event.id)
      toast.success('Event deleted')
      router.push('/events')
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete event')
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
    } catch (err: any) {
      toast.error(err.message || 'Failed to save note')
    } finally {
      setLoading(false)
    }
  }

  const sourceType = event.is_standalone ? 'standalone' : event.host_id ? 'host' : event.organizer_id ? 'organizer' : 'unknown'

  const actionTypeOptions = [
    { value: 'open_entry', label: 'Open Entry' },
    { value: 'reservation', label: 'Reservation Required' },
    { value: 'external_link', label: 'External Link' },
    { value: 'contact', label: 'Contact for Info' },
  ]

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'pending_review', label: 'Pending Review' },
  ]

  const frequencyOptions = [
    { value: 'one_time', label: 'One-Time' },
    { value: 'series', label: 'Series' },
    { value: 'recurring', label: 'Recurring' },
    { value: 'seasonal', label: 'Seasonal' },
  ]

  const timezoneOptions = [
    { value: 'Africa/Addis_Ababa', label: 'Africa/Addis_Ababa (EAT)' },
    { value: 'Africa/Nairobi', label: 'Africa/Nairobi (EAT)' },
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'America/New_York (EST)' },
    { value: 'Europe/London', label: 'Europe/London (GMT)' },
    { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
  ]

  const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
    <div className="flex items-center gap-2 mb-4">
      <div className="p-1.5 rounded-lg bg-surface-container-high">
        <Icon size={16} className="text-primary" />
      </div>
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">{title}</h3>
    </div>
  )

  const FieldGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div>{children}</div>
    </div>
  )

  const FieldGroupEdit = ({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/events" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <h1 className="text-3xl font-bold text-primary tracking-tight">{event.title}</h1>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="outline" className={cn('capitalize', statusBadgeStyles[event.status])}>
              {event.status?.replace('_', ' ')}
            </Badge>
            {event.is_featured && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 flex items-center gap-1">
                <Star size={12} />
                {event.featured_section || 'Featured'}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs capitalize">
              {sourceType}
            </Badge>
            {event.source === 'instagram' && (
              <Badge variant="outline" className="text-xs flex items-center gap-1 bg-[#E1306C]/10 text-[#E1306C] border-[#E1306C]/20">
                <Instagram size={11} />
                Instagram
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">{event.frequency_type?.replace('_', ' ')}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editMode && (
            <PublishToInstagramDialog
              eventId={event.id}
              title={form.title}
              description={form.description}
              venueName={form.venue_name}
              imageCount={form.images.length}
              instaPermalink={event.insta_permalink}
            />
          )}
          <Button
            variant="outline"
            onClick={() => setEditMode(!editMode)}
            className="gap-2"
          >
            {editMode ? <Eye size={16} /> : <Edit size={16} />}
            {editMode ? 'View Mode' : 'Edit'}
          </Button>
          {event.status !== 'published' && (
            <Button onClick={() => handleStatusAction('published')} disabled={loading} className="gap-2 bg-success text-success-foreground hover:bg-success/90">
              <CheckCircle size={16} /> Publish
            </Button>
          )}
          {event.status !== 'cancelled' && (
            <Button variant="outline" onClick={() => handleStatusAction('cancelled')} disabled={loading} className="gap-2 text-destructive border-destructive">
              <XCircle size={16} /> Cancel
            </Button>
          )}
          <Button variant="outline" onClick={handleDelete} disabled={loading} className="gap-2 text-destructive border-destructive">
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      {editMode ? (
        /* Edit Mode */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Media & Post Preview */}
            <Card className="bg-card rounded-2xl border border-outline-variant shadow-sm p-6">
              <SectionHeader icon={Image} title="Media & Post Preview" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <ImagePicker
                    images={form.images}
                    onChange={images => updateField('images', images)}
                    aspectRatio={form.image_aspect_ratio}
                    onAspectRatioChange={r => updateField('image_aspect_ratio', r)}
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Live preview</p>
                  <PostPreview
                    images={form.images}
                    aspectRatio={form.image_aspect_ratio}
                    caption={form.description}
                    venueName={form.venue_name}
                    isFree={form.is_free}
                  />
                </div>
              </div>
            </Card>

            {/* Basic Info */}
            <Card className="bg-card rounded-2xl border border-outline-variant shadow-sm p-6">
              <SectionHeader icon={Info} title="Basic Information" />
              <div className="space-y-4">
                <FieldGroupEdit label="Title" htmlFor="title">
                  <Input id="title" value={form.title} onChange={e => updateField('title', e.target.value)} />
                </FieldGroupEdit>
                <FieldGroupEdit label="Public URL Slug" htmlFor="slug">
                  <Input id="slug" value={form.slug} onChange={e => updateField('slug', e.target.value)} />
                </FieldGroupEdit>
                <FieldGroupEdit label="Description" htmlFor="description">
                  <textarea
                    id="description"
                    rows={4}
                    value={form.description}
                    onChange={e => updateField('description', e.target.value)}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 resize-none"
                  />
                </FieldGroupEdit>
                <div className="grid grid-cols-2 gap-4">
                  <FieldGroupEdit label="Primary Category">
                    <select
                      value={form.categoryId}
                      onChange={e => updateField('categoryId', e.target.value)}
                      className="bg-surface-container-high border-none rounded-lg px-3 py-2.5 text-sm focus:ring-0 outline-none w-full"
                    >
                      <option value="">Select category</option>
                      {parentCategories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </FieldGroupEdit>
                  <FieldGroupEdit label="Subcategories">
                    <div className="flex flex-wrap gap-2">
                      {subCategories.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            const current = form.subcategoryIds.includes(c.id)
                              ? form.subcategoryIds.filter(id => id !== c.id)
                              : [...form.subcategoryIds, c.id]
                            updateField('subcategoryIds', current)
                          }}
                          className={cn(
                            'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                            form.subcategoryIds.includes(c.id)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-surface-container-high border-outline-variant text-muted-foreground hover:border-primary/50'
                          )}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </FieldGroupEdit>
                </div>
              </div>
            </Card>

            {/* Date & Time */}
            <Card className="bg-card rounded-2xl border border-outline-variant shadow-sm p-6">
              <SectionHeader icon={Calendar} title="Date & Time" />
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FieldGroupEdit label="Start Date & Time">
                    <input type="datetime-local" value={form.start_date} onChange={e => updateField('start_date', e.target.value)}
                      className="bg-surface-container-high border-none rounded-lg px-3 py-2.5 text-sm focus:ring-0 outline-none w-full" />
                  </FieldGroupEdit>
                  <FieldGroupEdit label="End Date & Time">
                    <input type="datetime-local" value={form.end_date} onChange={e => updateField('end_date', e.target.value)}
                      className="bg-surface-container-high border-none rounded-lg px-3 py-2.5 text-sm focus:ring-0 outline-none w-full" />
                  </FieldGroupEdit>
                </div>
                <FieldGroupEdit label="Timezone">
                  <select value={form.timezone} onChange={e => updateField('timezone', e.target.value)}
                    className="bg-surface-container-high border-none rounded-lg px-3 py-2.5 text-sm focus:ring-0 outline-none w-full">
                    {timezoneOptions.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                  </select>
                </FieldGroupEdit>
              </div>
            </Card>

            {/* Location */}
            <Card className="bg-card rounded-2xl border border-outline-variant shadow-sm p-6">
              <SectionHeader icon={MapPin} title="Location" />
              <div className="space-y-4">
                <FieldGroupEdit label="Venue Name">
                  <Input value={form.venue_name} onChange={e => updateField('venue_name', e.target.value)} />
                </FieldGroupEdit>
                <FieldGroupEdit label="Address">
                  <Input value={form.venue_address} onChange={e => updateField('venue_address', e.target.value)} />
                </FieldGroupEdit>
                <FieldGroupEdit label="Map Link">
                  <Input value={form.venue_map_link} onChange={e => updateField('venue_map_link', e.target.value)} />
                </FieldGroupEdit>
              </div>
            </Card>

            {/* Pricing */}
            <Card className="bg-card rounded-2xl border border-outline-variant shadow-sm p-6">
              <SectionHeader icon={DollarSign} title="Pricing & Access" />
              <div className="space-y-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_free} onChange={e => updateField('is_free', e.target.checked)} className="rounded border-outline-variant" />
                  <span className="text-sm font-medium">Free Event</span>
                </label>
                {!form.is_free && (
                  <FieldGroupEdit label="Price Display">
                    <Input value={form.price_display} onChange={e => updateField('price_display', e.target.value)} />
                  </FieldGroupEdit>
                )}
                <FieldGroupEdit label="Action Type">
                  <select value={form.action_type} onChange={e => updateField('action_type', e.target.value)}
                    className="bg-surface-container-high border-none rounded-lg px-3 py-2.5 text-sm focus:ring-0 outline-none w-full">
                    {actionTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </FieldGroupEdit>
                {form.action_type === 'external_link' && (
                  <>
                    <FieldGroupEdit label="External Link">
                      <Input value={form.external_link} onChange={e => updateField('external_link', e.target.value)} />
                    </FieldGroupEdit>
                    <FieldGroupEdit label="Link Label">
                      <Input value={form.external_link_label} onChange={e => updateField('external_link_label', e.target.value)} />
                    </FieldGroupEdit>
                  </>
                )}
                {form.action_type === 'contact' && (
                  <FieldGroupEdit label="Contact Email">
                    <Input type="email" value={form.contact_email} onChange={e => updateField('contact_email', e.target.value)} />
                  </FieldGroupEdit>
                )}
                {form.action_type === 'reservation' && (
                  <FieldGroupEdit label="Reservation Limit">
                    <Input type="number" value={form.reservation_limit} onChange={e => updateField('reservation_limit', e.target.value)} />
                  </FieldGroupEdit>
                )}
              </div>
            </Card>

            {/* Video */}
            <Card className="bg-card rounded-2xl border border-outline-variant shadow-sm p-6">
              <SectionHeader icon={Video} title="Teaser Video" />
              <div className="space-y-4">
                <FieldGroupEdit label="Teaser Video URL">
                  <Input value={form.teaser_video_url} onChange={e => updateField('teaser_video_url', e.target.value)} />
                </FieldGroupEdit>
                <FieldGroupEdit label="Video Aspect Ratio">
                  <select value={form.video_aspect_ratio} onChange={e => updateField('video_aspect_ratio', e.target.value)}
                    className="bg-surface-container-high border-none rounded-lg px-3 py-2.5 text-sm focus:ring-0 outline-none w-full">
                    <option value="">Default</option>
                    <option value="16:9">16:9</option>
                    <option value="9:16">9:16</option>
                    <option value="1:1">1:1</option>
                    <option value="4:3">4:3</option>
                  </select>
                </FieldGroupEdit>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-card rounded-2xl border border-outline-variant shadow-sm p-6">
              <SectionHeader icon={Users} title="Ownership" />
              <div className="space-y-4">
                <div className="flex gap-2">
                  {(['standalone', 'host', 'organizer'] as const).map(type => (
                    <button key={type} type="button" onClick={() => updateField('ownershipType', type)}
                      className={cn(
                        'flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors capitalize',
                        form.ownershipType === type
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-surface-container-high border-outline-variant text-muted-foreground hover:border-primary/50'
                      )}>
                      {type}
                    </button>
                  ))}
                </div>
                {form.ownershipType === 'host' && (
                  <FieldGroupEdit label="Host">
                    <select value={form.host_id} onChange={e => updateField('host_id', e.target.value)}
                      className="bg-surface-container-high border-none rounded-lg px-3 py-2.5 text-sm focus:ring-0 outline-none w-full">
                      <option value="">Select host</option>
                      {hosts.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                  </FieldGroupEdit>
                )}
                {form.ownershipType === 'organizer' && (
                  <FieldGroupEdit label="Organizer">
                    <select value={form.organizer_id} onChange={e => updateField('organizer_id', e.target.value)}
                      className="bg-surface-container-high border-none rounded-lg px-3 py-2.5 text-sm focus:ring-0 outline-none w-full">
                      <option value="">Select organizer</option>
                      {organizers.map(o => <option key={o.profile_id} value={o.profile_id}>{o.organizer_name}</option>)}
                    </select>
                  </FieldGroupEdit>
                )}
              </div>
            </Card>

            <Card className="bg-card rounded-2xl border border-outline-variant shadow-sm p-6">
              <SectionHeader icon={Tag} title="Status & Config" />
              <div className="space-y-4">
                <FieldGroupEdit label="Status">
                  <select value={form.status} onChange={e => updateField('status', e.target.value)}
                    className="bg-surface-container-high border-none rounded-lg px-3 py-2.5 text-sm focus:ring-0 outline-none w-full">
                    {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </FieldGroupEdit>
                <FieldGroupEdit label="Frequency">
                  <select value={form.frequency_type} onChange={e => updateField('frequency_type', e.target.value)}
                    className="bg-surface-container-high border-none rounded-lg px-3 py-2.5 text-sm focus:ring-0 outline-none w-full">
                    {frequencyOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </FieldGroupEdit>
                <label className="flex items-center gap-2 cursor-pointer pt-2 border-t border-outline-variant">
                  <input type="checkbox" checked={form.is_featured} onChange={e => updateField('is_featured', e.target.checked)} className="rounded border-outline-variant" />
                  <Star size={14} className={form.is_featured ? 'text-primary' : 'text-muted-foreground'} />
                  <span className="text-sm font-medium">Featured</span>
                </label>
                {form.is_featured && (
                  <FieldGroupEdit label="Featured Section">
                    <select value={form.featured_section} onChange={e => updateField('featured_section', e.target.value)}
                      className="bg-surface-container-high border-none rounded-lg px-3 py-2.5 text-sm focus:ring-0 outline-none w-full">
                      <option value="editors_choice">Editor&apos;s Choice</option>
                      <option value="trending">Trending</option>
                      <option value="popular">Popular</option>
                      <option value="new_and_noteworthy">New &amp; Noteworthy</option>
                    </select>
                  </FieldGroupEdit>
                )}
              </div>
            </Card>

            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={loading} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setEditMode(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* View Mode */
        <div className="space-y-6">
          {/* Media Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {event.poster_url && (
              <Card className="bg-card rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
                <div className="aspect-video bg-surface-container-high">
                  <img src={event.poster_url} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="p-3 text-xs text-muted-foreground">Poster</div>
              </Card>
            )}
            {event.teaser_video_url && (
              <Card className="bg-card rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
                <div className="aspect-video bg-surface-container-high flex items-center justify-center">
                  <Video size={48} className="text-muted-foreground" />
                </div>
                <div className="p-3 text-xs text-muted-foreground truncate">{event.teaser_video_url}</div>
              </Card>
            )}
          </div>

          {/* Categories */}
          {eventCategories.length > 0 && (
            <Card className="bg-card rounded-2xl border border-outline-variant shadow-sm p-6">
              <SectionHeader icon={Tag} title="Categories" />
              <div className="flex flex-wrap gap-2">
                {eventCategories.map((ec: any) => (
                  <Badge key={ec.category_id} variant="outline" className={cn(ec.is_primary && 'bg-primary/10 text-primary border-primary/20')}>
                    {ec.name || ec.category_id}
                    {ec.is_primary && ' (Primary)'}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card rounded-2xl border border-outline-variant shadow-sm p-6">
              <SectionHeader icon={Info} title="Details" />
              <div className="space-y-3">
                <FieldGroup label="Title"><p className="text-sm font-medium text-foreground">{event.title}</p></FieldGroup>
                <FieldGroup label="Description"><p className="text-sm text-muted-foreground">{event.description || '—'}</p></FieldGroup>
                <FieldGroup label="Status">
                  <Badge variant="outline" className={cn('capitalize', statusBadgeStyles[event.status])}>{event.status?.replace('_', ' ')}</Badge>
                </FieldGroup>
              </div>
            </Card>

            <Card className="bg-card rounded-2xl border border-outline-variant shadow-sm p-6">
              <SectionHeader icon={Calendar} title="Date & Time" />
              <div className="space-y-3">
                <FieldGroup label="Start">
                  <p className="text-sm text-foreground">{event.start_date ? new Date(event.start_date).toLocaleString() : '—'}</p>
                </FieldGroup>
                <FieldGroup label="End">
                  <p className="text-sm text-foreground">{event.end_date ? new Date(event.end_date).toLocaleString() : '—'}</p>
                </FieldGroup>
                <FieldGroup label="Timezone">
                  <p className="text-sm text-muted-foreground">{event.timezone || '—'}</p>
                </FieldGroup>
                <FieldGroup label="Frequency">
                  <Badge variant="outline" className="text-xs capitalize">{event.frequency_type?.replace('_', ' ')}</Badge>
                </FieldGroup>
              </div>
            </Card>

            <Card className="bg-card rounded-2xl border border-outline-variant shadow-sm p-6">
              <SectionHeader icon={MapPin} title="Location" />
              <div className="space-y-3">
                <FieldGroup label="Venue"><p className="text-sm text-foreground">{event.venue_name || '—'}</p></FieldGroup>
                <FieldGroup label="Address"><p className="text-sm text-muted-foreground">{event.venue_address || '—'}</p></FieldGroup>
                {event.venue_map_link && (
                  <FieldGroup label="Map Link">
                    <a href={event.venue_map_link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      Open Map
                    </a>
                  </FieldGroup>
                )}
              </div>
            </Card>

            <Card className="bg-card rounded-2xl border border-outline-variant shadow-sm p-6">
              <SectionHeader icon={DollarSign} title="Pricing & Access" />
              <div className="space-y-3">
                <FieldGroup label="Price">
                  <p className="text-sm text-foreground">{event.is_free ? 'Free' : event.price_display || '—'}</p>
                </FieldGroup>
                <FieldGroup label="Action Type"><Badge variant="outline" className="text-xs capitalize">{event.action_type?.replace('_', ' ')}</Badge></FieldGroup>
                {event.action_type === 'external_link' && (
                  <FieldGroup label="External Link">
                    <a href={event.external_link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate block">
                      {event.external_link}
                    </a>
                  </FieldGroup>
                )}
                {event.action_type === 'contact' && (
                  <FieldGroup label="Contact Email"><p className="text-sm text-foreground">{event.contact_email || '—'}</p></FieldGroup>
                )}
                {event.action_type === 'reservation' && (
                  <FieldGroup label="Reservation Limit"><p className="text-sm text-foreground">{event.reservation_limit || 'Unlimited'}</p></FieldGroup>
                )}
              </div>
            </Card>

            <Card className="bg-card rounded-2xl border border-outline-variant shadow-sm p-6">
              <SectionHeader icon={Users} title="Ownership" />
              <div className="space-y-3">
                <FieldGroup label="Source"><Badge variant="outline" className="text-xs capitalize">{sourceType}</Badge></FieldGroup>
                {event.host_id && hosts.find(h => h.id === event.host_id) && (
                  <FieldGroup label="Host"><p className="text-sm text-foreground">{hosts.find(h => h.id === event.host_id)?.name}</p></FieldGroup>
                )}
                {event.organizer_id && organizers.find(o => o.profile_id === event.organizer_id) && (
                  <FieldGroup label="Organizer"><p className="text-sm text-foreground">{organizers.find(o => o.profile_id === event.organizer_id)?.organizer_name}</p></FieldGroup>
                )}
                {event.is_standalone && <p className="text-xs text-muted-foreground">Standalone event (no host or organizer)</p>}
              </div>
            </Card>

            <Card className="bg-card rounded-2xl border border-outline-variant shadow-sm p-6">
              <SectionHeader icon={Globe} title="Metadata" />
              <div className="space-y-3">
                <FieldGroup label="Event ID"><p className="text-xs text-muted-foreground font-mono">{event.id}</p></FieldGroup>
                <FieldGroup label="Created"><p className="text-sm text-muted-foreground">{new Date(event.created_at).toLocaleString()}</p></FieldGroup>
                <FieldGroup label="Updated"><p className="text-sm text-muted-foreground">{new Date(event.updated_at).toLocaleString()}</p></FieldGroup>
                <FieldGroup label="Likes"><p className="text-sm text-foreground">{event.like_count ?? 0}</p></FieldGroup>
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="bg-card rounded-2xl border border-outline-variant shadow-sm p-6">
            <SectionHeader icon={Globe} title="Quick Actions" />
            <div className="flex flex-wrap gap-2">
              {event.status !== 'published' && (
                <Button size="sm" onClick={() => handleStatusAction('published')} disabled={loading} className="gap-1.5 bg-success text-success-foreground hover:bg-success/90">
                  <CheckCircle size={14} /> Publish
                </Button>
              )}
              {event.status !== 'rejected' && event.status !== 'published' && (
                <Button size="sm" variant="outline" onClick={() => handleStatusAction('rejected')} disabled={loading} className="gap-1.5 text-destructive border-destructive">
                  <XCircle size={14} /> Reject
                </Button>
              )}
              {event.status !== 'archived' && (
                <Button size="sm" variant="outline" onClick={() => handleStatusAction('archived')} disabled={loading} className="gap-1.5">
                  <Archive size={14} /> Archive
                </Button>
              )}
              {event.status !== 'cancelled' && (
                <Button size="sm" variant="outline" onClick={() => handleStatusAction('cancelled')} disabled={loading} className="gap-1.5 text-destructive border-destructive">
                  <XCircle size={14} /> Cancel
                </Button>
              )}
              {(event.status === 'archived' || event.status === 'rejected' || event.status === 'cancelled') && (
                <Button size="sm" variant="outline" onClick={() => handleStatusAction('draft')} disabled={loading} className="gap-1.5">
                  <RotateCcw size={14} /> Restore to Draft
                </Button>
              )}
              <div className="w-px h-8 bg-outline-variant mx-1" />
              {event.is_featured ? (
                <Button size="sm" variant="outline" onClick={handleFeatureToggle} disabled={loading} className="gap-1.5">
                  <Star size={14} /> Unfeature
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={handleFeatureToggle} disabled={loading} className="gap-1.5 text-primary">
                  <Star size={14} /> Feature
                </Button>
              )}
              <div className="w-px h-8 bg-outline-variant mx-1" />
              <Button size="sm" variant="outline" onClick={handleDelete} disabled={loading} className="gap-1.5 text-destructive border-destructive">
                <Trash2 size={14} /> Delete
              </Button>
            </div>
          </Card>

          {/* Admin Notes */}
          <Card className="bg-card rounded-2xl border border-outline-variant shadow-sm p-6">
            <SectionHeader icon={StickyNote} title="Admin Notes" />
            <div className="space-y-3">
              <textarea
                rows={3}
                placeholder="Internal admin notes..."
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 resize-none"
              />
              <div className="flex justify-end">
                <Button size="sm" onClick={handleSaveNote} disabled={loading} className="gap-1.5">
                  <SaveIcon size={14} /> Save Note
                </Button>
              </div>
            </div>
          </Card>

          {/* Moderation History */}
          <Card className="bg-card rounded-2xl border border-outline-variant shadow-sm p-6">
            <SectionHeader icon={History} title="Moderation History" />
            {moderationLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No moderation actions recorded.</p>
            ) : (
              <div className="space-y-3">
                {moderationLogs.map((log: any) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-high">
                    <div className="p-1.5 rounded-lg bg-surface-container-low">
                      <History size={14} className="text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{actionLabelMap[log.action] || log.action}</span>
                        {log.note && <span className="text-xs text-muted-foreground">— {log.note}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(Array.isArray(log.profiles) ? log.profiles[0]?.full_name : log.profiles?.full_name) || 'System'} · {new Date(log.created_at).toLocaleString()}
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
  )
}

function SaveIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  )
}
