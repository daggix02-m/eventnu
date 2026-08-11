'use client'

import { Card, Select } from '@/components/ui'
import { cn } from '@/lib/utils'
import { Field, SectionHeader } from './fields'
import type { Category, EventFormValues, UpdateField } from './types'

interface EventCategorySectionProps {
  form: EventFormValues
  update: UpdateField
  categories: Category[]
  onToggleSubcategory: (id: string) => void
}

export function EventCategorySection({
  form,
  update,
  categories,
  onToggleSubcategory,
}: EventCategorySectionProps) {
  const parentCategories = categories.filter((c) => !c.parent_id)
  const subCategories = categories.filter((c) => c.parent_id)

  return (
    <Card className="p-6">
      <SectionHeader index="05" title="Category" />
      <div className="space-y-4">
        <Field label="Primary Category" required>
          <Select value={form.categoryId} onChange={(e) => update('categoryId', e.target.value)}>
            <option value="">Select category</option>
            {parentCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Subcategories">
          {subCategories.length === 0 ? (
            <p className="text-xs text-muted-foreground">No subcategories available.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {subCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onToggleSubcategory(c.id)}
                  aria-pressed={form.subcategoryIds.includes(c.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
                    form.subcategoryIds.includes(c.id)
                      ? 'bg-primary/10 text-primary border-primary/40'
                      : 'bg-surface-container-high border-outline-variant text-muted-foreground hover:border-primary/50',
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
  )
}
