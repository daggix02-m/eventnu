'use client'

import { Card, Input, Select } from '@/components/ui'
import { Field, SectionHeader } from './fields'
import { timezoneOptions, type EventFormValues, type UpdateField } from './types'

interface EventScheduleSectionProps {
  form: EventFormValues
  update: UpdateField
}

export function EventScheduleSection({ form, update }: EventScheduleSectionProps) {
  return (
    <Card className="p-6">
      <SectionHeader index="03" title="Schedule" />
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Start Date & Time" required>
            <Input
              type="datetime-local"
              value={form.start_date}
              onChange={(e) => update('start_date', e.target.value)}
            />
          </Field>
          <Field label="End Date & Time">
            <Input
              type="datetime-local"
              value={form.end_date}
              onChange={(e) => update('end_date', e.target.value)}
            />
          </Field>
        </div>
        <Field label="Timezone">
          <Select value={form.timezone} onChange={(e) => update('timezone', e.target.value)}>
            {timezoneOptions.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </Card>
  )
}
