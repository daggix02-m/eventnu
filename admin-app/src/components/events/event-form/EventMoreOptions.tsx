'use client'

import { useState } from 'react'
import { Card, Input, Select, Textarea } from '@/components/ui'
import { cn } from '@/lib/utils'
import { ChevronDown, LinkIcon, Star, StickyNote } from 'lucide-react'
import { Field, SubSectionHeader } from './fields'
import {
  actionTypeOptions,
  featuredSectionFallback,
  frequencyOptions,
  statusOptions,
  type EventFormValues,
  type FeaturedSection,
  type Host,
  type Organizer,
  type UpdateField,
} from './types'

interface EventMoreOptionsProps {
  form: EventFormValues
  update: UpdateField
  hosts: Host[]
  organizers: Organizer[]
  featuredSections?: FeaturedSection[]
}

export function EventMoreOptions({
  form,
  update,
  hosts,
  organizers,
  featuredSections = [],
}: EventMoreOptionsProps) {
  const [open, setOpen] = useState(false)

  const featuredSectionOptions =
    featuredSections.length > 0
      ? featuredSections.map((s) => ({ value: s.slug, label: s.label }))
      : featuredSectionFallback

  return (
    <Card className="p-0 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="event-more-options"
        className="w-full flex items-center justify-between gap-3 p-6 text-left hover:bg-surface-container-low transition-colors"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <StickyNote size={14} className="text-muted-foreground" />
            <span className="font-headline text-base font-semibold text-foreground">
              More options
            </span>
          </div>
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
            Pricing · Ownership · Publish · Video
          </p>
        </div>
        <ChevronDown
          size={16}
          className={cn(
            'text-muted-foreground transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div id="event-more-options" className="space-y-6 p-6 pt-0 border-t border-outline-variant">
          {/* Pricing & Access */}
          <div>
            <SubSectionHeader index="06" title="Pricing & Access" />
            <div className="space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_free}
                  onChange={(e) => update('is_free', e.target.checked)}
                  className="h-4 w-4 rounded border-outline-variant accent-primary"
                />
                <span className="text-sm font-medium">Free Event</span>
              </label>
              {!form.is_free && (
                <Field label="Price Display">
                  <Input
                    placeholder="e.g. ETB 500, Free for students"
                    value={form.price_display}
                    onChange={(e) => update('price_display', e.target.value)}
                  />
                </Field>
              )}
              <Field label="Action Type">
                <Select
                  value={form.action_type}
                  onChange={(e) => update('action_type', e.target.value)}
                >
                  {actionTypeOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
              {form.action_type === 'external_link' && (
                <>
                  <Field label="External Link">
                    <Input
                      placeholder="https://..."
                      value={form.external_link}
                      onChange={(e) => update('external_link', e.target.value)}
                    />
                  </Field>
                  <Field label="Link Label">
                    <Input
                      placeholder="Get Tickets"
                      value={form.external_link_label}
                      onChange={(e) => update('external_link_label', e.target.value)}
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
                    onChange={(e) => update('contact_email', e.target.value)}
                  />
                </Field>
              )}
              {form.action_type === 'reservation' && (
                <Field label="Reservation Limit">
                  <Input
                    type="number"
                    placeholder="Max reservations"
                    value={form.reservation_limit}
                    onChange={(e) => update('reservation_limit', e.target.value)}
                  />
                </Field>
              )}
            </div>
          </div>

          {/* Ownership */}
          <div>
            <SubSectionHeader index="07" title="Ownership" />
            <div className="space-y-4">
              <div className="flex gap-2">
                {(['standalone', 'host', 'organizer'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => update('ownershipType', type)}
                    aria-pressed={form.ownershipType === type}
                    className={cn(
                      'flex-1 px-3 py-2 rounded-md text-xs font-medium border transition-colors capitalize',
                      form.ownershipType === type
                        ? 'bg-primary/10 text-primary border-primary/40'
                        : 'bg-surface-container-high border-outline-variant text-muted-foreground hover:border-primary/50',
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
              {form.ownershipType === 'host' && (
                <Field label="Select Host">
                  <Select value={form.host_id} onChange={(e) => update('host_id', e.target.value)}>
                    <option value="">Select a host</option>
                    {hosts.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              {form.ownershipType === 'organizer' && (
                <Field label="Select Organizer">
                  <Select
                    value={form.organizer_id}
                    onChange={(e) => update('organizer_id', e.target.value)}
                  >
                    <option value="">Select an organizer</option>
                    {organizers.map((o) => (
                      <option key={o.profile_id} value={o.profile_id}>
                        {o.organizer_name}
                      </option>
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
            <SubSectionHeader index="08" title="Publish Settings" />
            <div className="space-y-4">
              <Field label="Status">
                <Select value={form.status} onChange={(e) => update('status', e.target.value)}>
                  {statusOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Frequency Type">
                <Select
                  value={form.frequency_type}
                  onChange={(e) => update('frequency_type', e.target.value)}
                >
                  {frequencyOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <label className="flex items-center gap-2 cursor-pointer pt-2 border-t border-outline-variant">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) => update('is_featured', e.target.checked)}
                  className="h-4 w-4 rounded border-outline-variant accent-primary"
                />
                <Star
                  size={14}
                  className={form.is_featured ? 'text-primary' : 'text-muted-foreground'}
                />
                <span className="text-sm font-medium">Featured</span>
              </label>
              {form.is_featured && (
                <Field label="Featured Section">
                  <Select
                    value={form.featured_section}
                    onChange={(e) => update('featured_section', e.target.value)}
                  >
                    {featuredSectionOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
            </div>
          </div>

          {/* Teaser video */}
          <div>
            <SubSectionHeader index="09" title="Teaser Video" />
            <div className="space-y-4">
              <Field label="Teaser Video URL">
                <Input
                  placeholder="https://youtube.com/watch?v=..."
                  value={form.teaser_video_url}
                  onChange={(e) => update('teaser_video_url', e.target.value)}
                />
              </Field>
              <Field label="Video Aspect Ratio">
                <Select
                  value={form.video_aspect_ratio}
                  onChange={(e) => update('video_aspect_ratio', e.target.value)}
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
            <SubSectionHeader index="10" title="Public URL Slug" />
            <Field label="Slug">
              <div className="relative">
                <LinkIcon
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  className="pl-9"
                  placeholder="addis-jazz-night-2024"
                  value={form.slug}
                  onChange={(e) => update('slug', e.target.value)}
                />
              </div>
            </Field>
          </div>

          {/* Admin notes */}
          <div>
            <SubSectionHeader index="11" title="Admin Notes" />
            <Field label="Internal Notes (not public)">
              <Textarea
                rows={3}
                placeholder="Internal admin notes..."
                value={form.admin_note}
                onChange={(e) => update('admin_note', e.target.value)}
              />
            </Field>
          </div>
        </div>
      )}
    </Card>
  )
}
