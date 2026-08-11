'use client'

import { Card, Input, Textarea } from '@/components/ui'
import { Field, SectionHeader } from './fields'
import type { EventFormValues, UpdateField } from './types'

interface EventDetailsSectionProps {
  form: EventFormValues
  update: UpdateField
}

export function EventDetailsSection({ form, update }: EventDetailsSectionProps) {
  return (
    <Card className="p-6">
      <SectionHeader index="02" title="Details & Description" />
      <div className="space-y-4">
        <Field label="Title" required>
          <Input
            placeholder="Enter event title"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
          />
        </Field>
        <Field label="Description">
          <Textarea
            rows={4}
            placeholder="Describe the event..."
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
          />
        </Field>
      </div>
    </Card>
  )
}
