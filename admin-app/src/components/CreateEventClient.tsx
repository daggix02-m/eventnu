'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  Calendar,
  MapPin,
  Tag,
  DollarSign,
  Video,
  Save,
  Send,
  ArrowLeft,
  Image,
  Info,
  Users,
  Star,
  StickyNote,
} from 'lucide-react'
import { Button } from 'company-design-system'
import { Card } from 'company-design-system'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { createEvent } from '@/lib/actions/events'
import { ImagePicker, PickedImage } from '@/components/media/ImagePicker'
import { PostPreview } from '@/components/media/PostPreview'
import Link from 'next/link'

interface Category {
  id: string
  name: string
  slug: string
  parent_id?: string | null
  icon?: string | null
  sort_order?: number
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

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
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

export function CreateEventClient({
  categories,
  hosts,
  organizers,
}: {
  categories: Category[]
  hosts: Host[]
  organizers: Organizer[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    categoryId: '',
    subcategoryIds: [] as string[],
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
    ownershipType: 'standalone' as 'host' | 'organizer' | 'standalone',
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
    images: [] as PickedImage[],
  })

  const updateField = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const parentCategories = categories.filter(c => !c.parent_id)
  const subCategories = categories.filter(c => c.parent_id)

  const handleSubmit = async (status: string) => {
    if (!form.title || !form.start_date) {
      toast.error('Title and start date are required')
      return
    }

    try {
      setLoading(true)

      const categoryIds = [form.categoryId, ...form.subcategoryIds].filter(Boolean)

      await createEvent({
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
        status,
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
      })

      toast.success(status === 'published' ? 'Event published!' : 'Event saved as draft')
      router.push('/events')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
    <div className="flex items-center gap-2 mb-4">
      <div className="p-1.5 rounded-lg bg-surface-container-high">
        <Icon size={16} className="text-primary" />
      </div>
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">{title}</h3>
    </div>
  )

  const FieldGroup = ({ label, htmlFor, children, required }: { label: string; htmlFor?: string; children: React.ReactNode; required?: boolean }) => (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header — sticky on scroll so actions stay reachable */}
      <div className="sticky top-0 z-10 -mx-6 -mt-6 lg:-mx-8 lg:-mt-8 px-6 lg:px-8 py-4 bg-background/95 backdrop-blur-md border-b border-outline-variant">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/events" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Back to events">
                <ArrowLeft size={18} />
              </Link>
              <h1 className="text-3xl font-bold text-primary tracking-tight">Create Event</h1>
            </div>
            <p className="text-muted-foreground mt-1">Create and publish a new event as admin.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => handleSubmit('draft')}
              disabled={loading}
              className="gap-2"
            >
              <Save size={16} />
              Save as Draft
            </Button>
            <Button
              onClick={() => handleSubmit('published')}
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              <Send size={16} />
              Publish
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Media & Post Preview */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
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
          </motion.div>

          {/* Basic Info */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}>
            <Card className="bg-card rounded-2xl border border-outline-variant shadow-sm p-6">
              <SectionHeader icon={Info} title="Basic Information" />
              <div className="space-y-4">
                <FieldGroup label="Title" htmlFor="title" required>
                  <Input
                    id="title"
                    placeholder="Enter event title"
                    value={form.title}
                    onChange={e => updateField('title', e.target.value)}
                  />
                </FieldGroup>
                <FieldGroup label="Public URL Slug" htmlFor="slug">
                  <Input
                    id="slug"
                    placeholder="addis-jazz-night-2024"
                    value={form.slug}
                    onChange={e => updateField('slug', e.target.value)}
                  />
                </FieldGroup>
                <FieldGroup label="Description" htmlFor="description">
                  <textarea
                    id="description"
                    rows={4}
                    placeholder="Describe the event..."
                    value={form.description}
                    onChange={e => updateField('description', e.target.value)}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 resize-none"
                  />
                </FieldGroup>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FieldGroup label="Primary Category" required>
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
                  </FieldGroup>
                  <FieldGroup label="Subcategories">
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
                  </FieldGroup>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Date & Time */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}>
            <Card className="bg-card rounded-2xl border border-outline-variant shadow-sm p-6">
              <SectionHeader icon={Calendar} title="Date & Time" />
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FieldGroup label="Start Date & Time" required>
                    <input
                      type="datetime-local"
                      value={form.start_date}
                      onChange={e => updateField('start_date', e.target.value)}
                      className="bg-surface-container-high border-none rounded-lg px-3 py-2.5 text-sm focus:ring-0 outline-none w-full"
                    />
                  </FieldGroup>
                  <FieldGroup label="End Date & Time">
                    <input
                      type="datetime-local"
                      value={form.end_date}
                      onChange={e => updateField('end_date', e.target.value)}
                      className="bg-surface-container-high border-none rounded-lg px-3 py-2.5 text-sm focus:ring-0 outline-none w-full"
                    />
                  </FieldGroup>
                </div>
                <FieldGroup label="Timezone">
                  <select
                    value={form.timezone}
                    onChange={e => updateField('timezone', e.target.value)}
                    className="bg-surface-container-high border-none rounded-lg px-3 py-2.5 text-sm focus:ring-0 outline-none w-full"
                  >
                    {timezoneOptions.map(tz => (
                      <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
                  </select>
                </FieldGroup>
              </div>
            </Card>
          </motion.div>

          {/* Location */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}>
            <Card className="bg-card rounded-2xl border border-outline-variant shadow-sm p-6">
              <SectionHeader icon={MapPin} title="Location" />
              <div className="space-y-4">
                <FieldGroup label="Venue Name">
                  <Input
                    placeholder="Venue name"
                    value={form.venue_name}
                    onChange={e => updateField('venue_name', e.target.value)}
                  />
                </FieldGroup>
                <FieldGroup label="Address">
                  <Input
                    placeholder="Venue address"
                    value={form.venue_address}
                    onChange={e => updateField('venue_address', e.target.value)}
                  />
                </FieldGroup>
                <FieldGroup label="Map Link">
                  <Input
                    placeholder="Google Maps or venue URL"
                    value={form.venue_map_link}
                    onChange={e => updateField('venue_map_link', e.target.value)}
                  />
                </FieldGroup>
              </div>
            </Card>
          </motion.div>

          {/* Pricing */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}>
            <Card className="bg-card rounded-2xl border border-outline-variant shadow-sm p-6">
              <SectionHeader icon={DollarSign} title="Pricing & Access" />
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_free}
                      onChange={e => updateField('is_free', e.target.checked)}
                      className="rounded border-outline-variant"
                    />
                    <span className="text-sm font-medium">Free Event</span>
                  </label>
                </div>

                {!form.is_free && (
                  <FieldGroup label="Price Display">
                    <Input
                      placeholder="e.g. ETB 500, Free for students"
                      value={form.price_display}
                      onChange={e => updateField('price_display', e.target.value)}
                    />
                  </FieldGroup>
                )}

                <FieldGroup label="Action Type">
                  <select
                    value={form.action_type}
                    onChange={e => updateField('action_type', e.target.value)}
                    className="bg-surface-container-high border-none rounded-lg px-3 py-2.5 text-sm focus:ring-0 outline-none w-full"
                  >
                    {actionTypeOptions.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </FieldGroup>

                {form.action_type === 'external_link' && (
                  <>
                    <FieldGroup label="External Link">
                      <Input
                        placeholder="https://..."
                        value={form.external_link}
                        onChange={e => updateField('external_link', e.target.value)}
                      />
                    </FieldGroup>
                    <FieldGroup label="Link Label">
                      <Input
                        placeholder="Get Tickets"
                        value={form.external_link_label}
                        onChange={e => updateField('external_link_label', e.target.value)}
                      />
                    </FieldGroup>
                  </>
                )}

                {form.action_type === 'contact' && (
                  <FieldGroup label="Contact Email">
                    <Input
                      type="email"
                      placeholder="contact@example.com"
                      value={form.contact_email}
                      onChange={e => updateField('contact_email', e.target.value)}
                    />
                  </FieldGroup>
                )}

                {form.action_type === 'reservation' && (
                  <FieldGroup label="Reservation Limit">
                    <Input
                      type="number"
                      placeholder="Max reservations"
                      value={form.reservation_limit}
                      onChange={e => updateField('reservation_limit', e.target.value)}
                    />
                  </FieldGroup>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Video */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={5}>
            <Card className="bg-card rounded-2xl border border-outline-variant shadow-sm p-6">
              <SectionHeader icon={Video} title="Teaser Video" />
              <div className="space-y-4">
                <FieldGroup label="Teaser Video URL">
                  <Input
                    placeholder="https://youtube.com/watch?v=..."
                    value={form.teaser_video_url}
                    onChange={e => updateField('teaser_video_url', e.target.value)}
                  />
                </FieldGroup>
                <FieldGroup label="Video Aspect Ratio">
                  <select
                    value={form.video_aspect_ratio}
                    onChange={e => updateField('video_aspect_ratio', e.target.value)}
                    className="bg-surface-container-high border-none rounded-lg px-3 py-2.5 text-sm focus:ring-0 outline-none w-full"
                  >
                    <option value="">Default</option>
                    <option value="16:9">16:9 (Landscape)</option>
                    <option value="9:16">9:16 (Portrait)</option>
                    <option value="1:1">1:1 (Square)</option>
                    <option value="4:3">4:3</option>
                  </select>
                </FieldGroup>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ownership */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={6}>
            <Card className="bg-card rounded-2xl border border-outline-variant shadow-sm p-6">
              <SectionHeader icon={Users} title="Ownership" />
              <div className="space-y-4">
                <div className="flex gap-2">
                  {(['standalone', 'host', 'organizer'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => updateField('ownershipType', type)}
                      className={cn(
                        'flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors capitalize',
                        form.ownershipType === type
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-surface-container-high border-outline-variant text-muted-foreground hover:border-primary/50'
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {form.ownershipType === 'host' && (
                  <FieldGroup label="Select Host">
                    <select
                      value={form.host_id}
                      onChange={e => updateField('host_id', e.target.value)}
                      className="bg-surface-container-high border-none rounded-lg px-3 py-2.5 text-sm focus:ring-0 outline-none w-full"
                    >
                      <option value="">Select a host</option>
                      {hosts.map(h => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                  </FieldGroup>
                )}

                {form.ownershipType === 'organizer' && (
                  <FieldGroup label="Select Organizer">
                    <select
                      value={form.organizer_id}
                      onChange={e => updateField('organizer_id', e.target.value)}
                      className="bg-surface-container-high border-none rounded-lg px-3 py-2.5 text-sm focus:ring-0 outline-none w-full"
                    >
                      <option value="">Select an organizer</option>
                      {organizers.map(o => (
                        <option key={o.profile_id} value={o.profile_id}>{o.organizer_name}</option>
                      ))}
                    </select>
                  </FieldGroup>
                )}

                {form.ownershipType === 'standalone' && (
                  <p className="text-xs text-muted-foreground">
                    This event will be created as a standalone event without a host or organizer.
                  </p>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Status & Config */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={7}>
            <Card className="bg-card rounded-2xl border border-outline-variant shadow-sm p-6">
              <SectionHeader icon={Tag} title="Status & Config" />
              <div className="space-y-4">
                <FieldGroup label="Status">
                  <select
                    value={form.status}
                    onChange={e => updateField('status', e.target.value)}
                    className="bg-surface-container-high border-none rounded-lg px-3 py-2.5 text-sm focus:ring-0 outline-none w-full"
                  >
                    {statusOptions.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </FieldGroup>

                <FieldGroup label="Frequency Type">
                  <select
                    value={form.frequency_type}
                    onChange={e => updateField('frequency_type', e.target.value)}
                    className="bg-surface-container-high border-none rounded-lg px-3 py-2.5 text-sm focus:ring-0 outline-none w-full"
                  >
                    {frequencyOptions.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </FieldGroup>

                <div className="flex items-center gap-3 pt-2 border-t border-outline-variant">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_featured}
                      onChange={e => updateField('is_featured', e.target.checked)}
                      className="rounded border-outline-variant"
                    />
                    <Star size={14} className={form.is_featured ? 'text-primary' : 'text-muted-foreground'} />
                    <span className="text-sm font-medium">Featured</span>
                  </label>
                </div>

                {form.is_featured && (
                  <FieldGroup label="Featured Section">
                    <select
                      value={form.featured_section}
                      onChange={e => updateField('featured_section', e.target.value)}
                      className="bg-surface-container-high border-none rounded-lg px-3 py-2.5 text-sm focus:ring-0 outline-none w-full"
                    >
                      {featuredSectionOptions.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </FieldGroup>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Admin Notes */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={8}>
            <Card className="bg-card rounded-2xl border border-outline-variant shadow-sm p-6">
              <SectionHeader icon={StickyNote} title="Admin Notes" />
              <FieldGroup label="Internal Notes (not public)">
                <textarea
                  rows={3}
                  placeholder="Internal admin notes..."
                  value={form.admin_note}
                  onChange={e => updateField('admin_note', e.target.value)}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 resize-none"
                />
              </FieldGroup>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
