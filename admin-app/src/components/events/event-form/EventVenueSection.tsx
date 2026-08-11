'use client'

import { Card, Input } from '@/components/ui'
import { Field, SectionHeader } from './fields'
import type { EventFormValues, UpdateField } from './types'

interface EventVenueSectionProps {
  form: EventFormValues
  update: UpdateField
}

export function EventVenueSection({ form, update }: EventVenueSectionProps) {
  return (
    <Card className="p-6">
      <SectionHeader index="04" title="Venue" />
      <div className="space-y-4">
        <Field label="Venue Name">
          <Input
            placeholder="Venue name"
            value={form.venue_name}
            onChange={(e) => update('venue_name', e.target.value)}
          />
        </Field>
        <Field label="Address">
          <Input
            placeholder="Venue address"
            value={form.venue_address}
            onChange={(e) => update('venue_address', e.target.value)}
          />
        </Field>
        <Field label="Map Link">
          <Input
            placeholder="Google Maps or venue URL"
            value={form.venue_map_link}
            onChange={(e) => update('venue_map_link', e.target.value)}
          />
        </Field>
      </div>
    </Card>
  )
}
