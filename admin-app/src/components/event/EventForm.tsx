'use client'

import { useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { getErrorMessage } from '@/lib/errors'
import {
  ArrowLeft,
  Save,
  Send,
  Star,
  StickyNote,
  ChevronDown,
  Loader2,
  LinkIcon,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { Card } from '@/components/ui'
import { Input } from '@/components/ui'
import { Select } from '@/components/ui'
import { Textarea } from '@/components/ui'
import { toast } from 'sonner'
import { createEvent, updateEvent } from '@/lib/actions/events'
import { ImagePicker, PickedImage } from '@/components/media/ImagePicker'
import { PostPreview } from '@/components/media/PostPreview'

export interface Category {
  id: string
  name: string
  slug: string
  parent_id?: string | null
  icon?: string | null
  sort_order?: number
}

export interface Host {
  id: string
  name: string
  slug: string
}

export interface Organizer {
  profile_id: string
  organizer_name: string
  organizer_handle?: string | null
}

export interface EventFormValues {
  title: string
  slug: string
  description: string
  categoryId: string
  subcategoryIds: string[]
  start_date: string
  end_date: string
  timezone: string
  venue_name: string
  venue_address: string
  venue_map_link: string
  is_free: boolean
  price_display: string
  action_type: string
  external_link: string
  external_link_label: string
  contact_email: string
  reservation_limit: string
  ownershipType: 'host' | 'organizer' | 'standalone'
  host_id: string
  organizer_id: string
  status: string
  frequency_type: string
  is_featured: boolean
  featured_section: string
  admin_note: string
  teaser_video_url: string
  video_aspect_ratio: string
  poster_url: string
  image_aspect_ratio: string
  images: PickedImage[]
}

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

const featuredSectionOptions = [
  { value: 'editors_choice', label: "Editor's Choice" },
  { value: 'trending', label: 'Trending' },
  { value: 'popular', label: 'Popular' },
  { value: 'new_and_noteworthy', label: 'New & Noteworthy' },
]

const timezoneOptions = [
  { value: 'Africa/Addis_Ababa', label: 'Africa/Addis_Ababa (EAT)' },
  { value: 'Africa/Nairobi', label: 'Africa/Nairobi (EAT)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'America/New_York (EST)' },
  { value: 'Europe/London', label: 'Europe/London (GMT)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
]

function SectionHeader({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-baseline gap-2 border-b border-outline-variant pb-3 mb-5">
      <span className="font-mono text-[10px] tracking-widest text-primary">{index}</span>
      <h3 className="font-headline text-base font-semibold text-foreground">{title}</h3>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function emptyValues(): EventFormValues {
  return {
    title: '',
    slug: '',
    description: '',
    categoryId: '',
    subcategoryIds: [],
    start_date: '',
    end_date: '',
    timezone: 'Africa/Addis_Ababa',
    venue_name: '',
    venue_address: '',
    venue_map_link: '',
    is_free: false,
    price_display: '',
    action_type: 'open_entry',
    external_link: '',
    external_link_label: '',
    contact_email: '',
    reservation_limit: '',
    ownershipType: 'standalone',
    host_id: '',
    organizer_id: '',
    status: 'draft',
    frequency_type: 'one_time',
    is_featured: false,
    featured_section: 'editors_choice',
    admin_note: '',
    teaser_video_url: '',
    video_aspect_ratio: '',
    poster_url: '',
    image_aspect_ratio: 'original',
    images: [],
  }
}

export function EventForm({
  mode,
  eventId,
  categories,
  hosts,
  organizers,
  initial,
  onCancel,
  onSaved,
}: {
  mode: 'create' | 'edit'
  eventId?: string
  categories: Category[]
  hosts: Host[]
  organizers: Organizer[]
  initial?: Partial<EventFormValues>
  onCancel?: () => void
  onSaved?: () => void
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [form, setForm] = useState<EventFormValues>({
    ...emptyValues(),
    ...(initial ?? {}),
    subcategoryIds: initial?.subcategoryIds ?? [],
    images: initial?.images ?? [],
  })

  const updateField = (field: keyof EventFormValues, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const parentCategories = categories.filter(c => !c.parent_id)
  const subCategories = categories.filter(c => c.parent_id)

  const validate = () => {
    if (!form.title.trim() || !form.start_date) {
      toast.error('Title and start date are required')
      return false
    }
    return true
  }

  const buildPayload = () => {
    const categoryIds = [form.categoryId, ...form.subcategoryIds].filter(Boolean)
    return {
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
      admin_note: form.admin_note || null,
      timezone: form.timezone,
      source: 'admin',
      categoryIds,
    }
  }

  const handleCreate = async (status: 'draft' | 'published') => {
    if (!validate()) return
    try {
      setLoading(true)
      await createEvent({ ...buildPayload(), status })
      toast.success(status === 'published' ? 'Event published!' : 'Event saved as draft')
      router.push('/events')
      router.refresh()
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to create event'))
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!validate()) return
    if (!eventId) return
    try {
      setLoading(true)
      await updateEvent(eventId, { ...buildPayload(), status: form.status })
      toast.success('Event updated successfully')
      onSaved?.()
      router.refresh()
    } catch (err: any) {
      toast.error(getErrorMessage(err, 'Failed to update event'))
    } finally {
      setLoading(false)
    }
  }

  const toggleSubcategory = (id: string) => {
    const current = form.subcategoryIds.includes(id)
      ? form.subcategoryIds.filter(cid => cid !== id)
      : [...form.subcategoryIds, id]
    updateField('subcategoryIds', current)
  }

  return (
    <div className="space-y-6">
      {/* Header — sticky so actions stay reachable */}
      <div className="sticky top-16 z-20 -mx-6 -mt-6 lg:-mx-8 lg:-mt-8 px-6 lg:px-8 py-4 bg-background/95 backdrop-blur-md border-b border-outline-variant">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {mode === 'create' ? (
                <Link href="/events" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Back to events">
                  <ArrowLeft size={18} />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Back to view mode"
                >
                  <ArrowLeft size={18} />
                </button>
              )}
              <h1 className="font-headline text-2xl font-semibold text-foreground tracking-tight">
                {mode === 'create' ? 'Create Event' : 'Edit Event'}
              </h1>
            </div>
            <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
              {mode === 'create' ? 'Fol. 03 · events · draft by default' : `Fol. 03 · ${form.title || 'untitled'}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {mode === 'create' ? (
              <>
                <Button variant="outline" onClick={() => handleCreate('draft')} disabled={loading} className="gap-2">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save as Draft
                </Button>
                <Button onClick={() => handleCreate('published')} disabled={loading} className="gap-2">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Publish
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={onCancel} disabled={loading} className="gap-2">
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={loading} className="gap-2">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Media & Cover */}
          <Card className="p-6">
            <SectionHeader index="01" title="Media & Cover" />
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

          {/* Details & Description */}
          <Card className="p-6">
            <SectionHeader index="02" title="Details & Description" />
            <div className="space-y-4">
              <Field label="Title" required>
                <Input
                  placeholder="Enter event title"
                  value={form.title}
                  onChange={e => updateField('title', e.target.value)}
                />
              </Field>
              <Field label="Description">
                <Textarea
                  rows={4}
                  placeholder="Describe the event..."
                  value={form.description}
                  onChange={e => updateField('description', e.target.value)}
                />
              </Field>
            </div>
          </Card>

          {/* Schedule */}
          <Card className="p-6">
            <SectionHeader index="03" title="Schedule" />
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Start Date & Time" required>
                  <Input
                    type="datetime-local"
                    value={form.start_date}
                    onChange={e => updateField('start_date', e.target.value)}
                  />
                </Field>
                <Field label="End Date & Time">
                  <Input
                    type="datetime-local"
                    value={form.end_date}
                    onChange={e => updateField('end_date', e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Timezone">
                <Select
                  value={form.timezone}
                  onChange={e => updateField('timezone', e.target.value)}
                >
                  {timezoneOptions.map(tz => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </Card>

          {/* Venue */}
          <Card className="p-6">
            <SectionHeader index="04" title="Venue" />
            <div className="space-y-4">
              <Field label="Venue Name">
                <Input
                  placeholder="Venue name"
                  value={form.venue_name}
                  onChange={e => updateField('venue_name', e.target.value)}
                />
              </Field>
              <Field label="Address">
                <Input
                  placeholder="Venue address"
                  value={form.venue_address}
                  onChange={e => updateField('venue_address', e.target.value)}
                />
              </Field>
              <Field label="Map Link">
                <Input
                  placeholder="Google Maps or venue URL"
                  value={form.venue_map_link}
                  onChange={e => updateField('venue_map_link', e.target.value)}
                />
              </Field>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Category */}
          <Card className="p-6">
            <SectionHeader index="05" title="Category" />
            <div className="space-y-4">
              <Field label="Primary Category" required>
                <Select
                  value={form.categoryId}
                  onChange={e => updateField('categoryId', e.target.value)}
                >
                  <option value="">Select category</option>
                  {parentCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Subcategories">
                {subCategories.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No subcategories available.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {subCategories.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleSubcategory(c.id)}
                        aria-pressed={form.subcategoryIds.includes(c.id)}
                        className={cn(
                          'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
                          form.subcategoryIds.includes(c.id)
                            ? 'bg-primary/10 text-primary border-primary/40'
                            : 'bg-surface-container-high border-outline-variant text-muted-foreground hover:border-primary/50'
                        )}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </Field>
            </div>
          </Card>

          {/* More options — collapsed by default, smart defaults pre-filled */}
          <Card className="p-0 overflow-hidden">
            <button
              type="button"
              onClick={() => setMoreOpen(!moreOpen)}
              aria-expanded={moreOpen}
              aria-controls="event-more-options"
              className="w-full flex items-center justify-between gap-3 p-6 text-left hover:bg-surface-container-low transition-colors"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <StickyNote size={14} className="text-muted-foreground" />
                  <span className="font-headline text-base font-semibold text-foreground">More options</span>
                </div>
                <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                  Pricing · Ownership · Publish · Video
                </p>
              </div>
              <ChevronDown
                size={16}
                className={cn('text-muted-foreground transition-transform duration-200', moreOpen && 'rotate-180')}
              />
            </button>

            {moreOpen && (
              <div id="event-more-options" className="space-y-6 p-6 pt-0 border-t border-outline-variant">
                {/* Pricing & Access */}
                <div>
                  <div className="flex items-baseline gap-2 pb-2 mb-3">
                    <span className="font-mono text-[10px] tracking-widest text-primary">06</span>
                    <h4 className="font-headline text-sm font-semibold text-foreground">Pricing & Access</h4>
                  </div>
                  <div className="space-y-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_free}
                        onChange={e => updateField('is_free', e.target.checked)}
                        className="h-4 w-4 rounded border-outline-variant accent-primary"
                      />
                      <span className="text-sm font-medium">Free Event</span>
                    </label>
                    {!form.is_free && (
                      <Field label="Price Display">
                        <Input
                          placeholder="e.g. ETB 500, Free for students"
                          value={form.price_display}
                          onChange={e => updateField('price_display', e.target.value)}
                        />
                      </Field>
                    )}
                    <Field label="Action Type">
                      <Select
                        value={form.action_type}
                        onChange={e => updateField('action_type', e.target.value)}
                      >
                        {actionTypeOptions.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </Select>
                    </Field>
                    {form.action_type === 'external_link' && (
                      <>
                        <Field label="External Link">
                          <Input
                            placeholder="https://..."
                            value={form.external_link}
                            onChange={e => updateField('external_link', e.target.value)}
                          />
                        </Field>
                        <Field label="Link Label">
                          <Input
                            placeholder="Get Tickets"
                            value={form.external_link_label}
                            onChange={e => updateField('external_link_label', e.target.value)}
                          />
                        </Field>
                      </>
                    )}
                    {form.action_type === 'contact' && (
                      <Field label="Contact Email">
                        <Input
                          type="email"
                          placeholder="contact@example.com"
                          value={form.contact_email}
                          onChange={e => updateField('contact_email', e.target.value)}
                        />
                      </Field>
                    )}
                    {form.action_type === 'reservation' && (
                      <Field label="Reservation Limit">
                        <Input
                          type="number"
                          placeholder="Max reservations"
                          value={form.reservation_limit}
                          onChange={e => updateField('reservation_limit', e.target.value)}
                        />
                      </Field>
                    )}
                  </div>
                </div>

                {/* Ownership */}
                <div>
                  <div className="flex items-baseline gap-2 pb-2 mb-3">
                    <span className="font-mono text-[10px] tracking-widest text-primary">07</span>
                    <h4 className="font-headline text-sm font-semibold text-foreground">Ownership</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      {(['standalone', 'host', 'organizer'] as const).map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => updateField('ownershipType', type)}
                          aria-pressed={form.ownershipType === type}
                          className={cn(
                            'flex-1 px-3 py-2 rounded-md text-xs font-medium border transition-colors capitalize',
                            form.ownershipType === type
                              ? 'bg-primary/10 text-primary border-primary/40'
                              : 'bg-surface-container-high border-outline-variant text-muted-foreground hover:border-primary/50'
                          )}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                    {form.ownershipType === 'host' && (
                      <Field label="Select Host">
                        <Select
                          value={form.host_id}
                          onChange={e => updateField('host_id', e.target.value)}
                        >
                          <option value="">Select a host</option>
                          {hosts.map(h => (
                            <option key={h.id} value={h.id}>{h.name}</option>
                          ))}
                        </Select>
                      </Field>
                    )}
                    {form.ownershipType === 'organizer' && (
                      <Field label="Select Organizer">
                        <Select
                          value={form.organizer_id}
                          onChange={e => updateField('organizer_id', e.target.value)}
                        >
                          <option value="">Select an organizer</option>
                          {organizers.map(o => (
                            <option key={o.profile_id} value={o.profile_id}>{o.organizer_name}</option>
                          ))}
                        </Select>
                      </Field>
                    )}
                    {form.ownershipType === 'standalone' && (
                      <p className="text-xs text-muted-foreground">
                        Created as a standalone event without a host or organizer.
                      </p>
                    )}
                  </div>
                </div>

                {/* Publish settings */}
                <div>
                  <div className="flex items-baseline gap-2 pb-2 mb-3">
                    <span className="font-mono text-[10px] tracking-widest text-primary">08</span>
                    <h4 className="font-headline text-sm font-semibold text-foreground">Publish Settings</h4>
                  </div>
                  <div className="space-y-4">
                    <Field label="Status">
                      <Select
                        value={form.status}
                        onChange={e => updateField('status', e.target.value)}
                      >
                        {statusOptions.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Frequency Type">
                      <Select
                        value={form.frequency_type}
                        onChange={e => updateField('frequency_type', e.target.value)}
                      >
                        {frequencyOptions.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </Select>
                    </Field>
                    <label className="flex items-center gap-2 cursor-pointer pt-2 border-t border-outline-variant">
                      <input
                        type="checkbox"
                        checked={form.is_featured}
                        onChange={e => updateField('is_featured', e.target.checked)}
                        className="h-4 w-4 rounded border-outline-variant accent-primary"
                      />
                      <Star size={14} className={form.is_featured ? 'text-primary' : 'text-muted-foreground'} />
                      <span className="text-sm font-medium">Featured</span>
                    </label>
                    {form.is_featured && (
                      <Field label="Featured Section">
                        <Select
                          value={form.featured_section}
                          onChange={e => updateField('featured_section', e.target.value)}
                        >
                          {featuredSectionOptions.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </Select>
                      </Field>
                    )}
                  </div>
                </div>

                {/* Teaser video */}
                <div>
                  <div className="flex items-baseline gap-2 pb-2 mb-3">
                    <span className="font-mono text-[10px] tracking-widest text-primary">09</span>
                    <h4 className="font-headline text-sm font-semibold text-foreground">Teaser Video</h4>
                  </div>
                  <div className="space-y-4">
                    <Field label="Teaser Video URL">
                      <Input
                        placeholder="https://youtube.com/watch?v=..."
                        value={form.teaser_video_url}
                        onChange={e => updateField('teaser_video_url', e.target.value)}
                      />
                    </Field>
                    <Field label="Video Aspect Ratio">
                      <Select
                        value={form.video_aspect_ratio}
                        onChange={e => updateField('video_aspect_ratio', e.target.value)}
                      >
                        <option value="">Default</option>
                        <option value="16:9">16:9 (Landscape)</option>
                        <option value="9:16">9:16 (Portrait)</option>
                        <option value="1:1">1:1 (Square)</option>
                        <option value="4:3">4:3</option>
                      </Select>
                    </Field>
                  </div>
                </div>

                {/* URL slug */}
                <div>
                  <div className="flex items-baseline gap-2 pb-2 mb-3">
                    <span className="font-mono text-[10px] tracking-widest text-primary">10</span>
                    <h4 className="font-headline text-sm font-semibold text-foreground">Public URL Slug</h4>
                  </div>
                  <Field label="Slug">
                    <div className="relative">
                      <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder="addis-jazz-night-2024"
                        value={form.slug}
                        onChange={e => updateField('slug', e.target.value)}
                      />
                    </div>
                  </Field>
                </div>

                {/* Admin notes */}
                <div>
                  <div className="flex items-baseline gap-2 pb-2 mb-3">
                    <span className="font-mono text-[10px] tracking-widest text-primary">11</span>
                    <h4 className="font-headline text-sm font-semibold text-foreground">Admin Notes</h4>
                  </div>
                  <Field label="Internal Notes (not public)">
                    <Textarea
                      rows={3}
                      placeholder="Internal admin notes..."
                      value={form.admin_note}
                      onChange={e => updateField('admin_note', e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
