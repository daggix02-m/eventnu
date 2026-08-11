'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getErrorMessage } from '@/lib/errors'
import { toast } from 'sonner'
import { createEvent, updateEvent } from '@/lib/actions/events'
import { EventFormHeader } from './event-form/EventFormHeader'
import { EventMediaSection } from './event-form/EventMediaSection'
import { EventDetailsSection } from './event-form/EventDetailsSection'
import { EventScheduleSection } from './event-form/EventScheduleSection'
import { EventVenueSection } from './event-form/EventVenueSection'
import { EventCategorySection } from './event-form/EventCategorySection'
import { EventMoreOptions } from './event-form/EventMoreOptions'
import {
  emptyValues,
  type Category,
  type EventFormValues,
  type FeaturedSection,
  type Host,
  type Organizer,
  type UpdateField,
} from './event-form/types'

export function EventForm({
  mode,
  eventId,
  categories,
  hosts,
  organizers,
  featuredSections = [],
  initial,
  onCancel,
  onSaved,
}: {
  mode: 'create' | 'edit'
  eventId?: string
  categories: Category[]
  hosts: Host[]
  organizers: Organizer[]
  featuredSections?: FeaturedSection[]
  initial?: Partial<EventFormValues>
  onCancel?: () => void
  onSaved?: () => void
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<EventFormValues>({
    ...emptyValues(),
    ...(initial ?? {}),
    subcategoryIds: initial?.subcategoryIds ?? [],
    images: initial?.images ?? [],
  })

  const updateField: UpdateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

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
      images: form.images.map((img) => ({
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
    } catch (err) {
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
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update event'))
    } finally {
      setLoading(false)
    }
  }

  const toggleSubcategory = (id: string) => {
    setForm((prev) => ({
      ...prev,
      subcategoryIds: prev.subcategoryIds.includes(id)
        ? prev.subcategoryIds.filter((cid) => cid !== id)
        : [...prev.subcategoryIds, id],
    }))
  }

  return (
    <div className="space-y-6">
      <EventFormHeader
        mode={mode}
        title={form.title}
        loading={loading}
        onCancel={onCancel ?? (() => {})}
        onCreateDraft={() => handleCreate('draft')}
        onPublish={() => handleCreate('published')}
        onSave={handleSave}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form area */}
        <div className="lg:col-span-2 space-y-6">
          <EventMediaSection form={form} update={updateField} />
          <EventDetailsSection form={form} update={updateField} />
          <EventScheduleSection form={form} update={updateField} />
          <EventVenueSection form={form} update={updateField} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <EventCategorySection
            form={form}
            update={updateField}
            categories={categories}
            onToggleSubcategory={toggleSubcategory}
          />
          <EventMoreOptions
            form={form}
            update={updateField}
            hosts={hosts}
            organizers={organizers}
            featuredSections={featuredSections}
          />
        </div>
      </div>
    </div>
  )
}
