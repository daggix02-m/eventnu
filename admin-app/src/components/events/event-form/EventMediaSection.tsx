'use client'

import { Card } from '@/components/ui'
import { SectionHeader } from './fields'
import { ImagePicker } from '@/components/media/ImagePicker'
import { PostPreview } from '@/components/media/PostPreview'
import type { EventFormValues, UpdateField } from './types'

interface EventMediaSectionProps {
  form: EventFormValues
  update: UpdateField
}

export function EventMediaSection({ form, update }: EventMediaSectionProps) {
  return (
    <Card className="p-6">
      <SectionHeader index="01" title="Media & Cover" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <ImagePicker
            images={form.images}
            onChange={(images) => update('images', images)}
            aspectRatio={form.image_aspect_ratio}
            onAspectRatioChange={(r) => update('image_aspect_ratio', r)}
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
  )
}
