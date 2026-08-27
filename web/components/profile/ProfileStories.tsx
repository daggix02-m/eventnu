'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useQuery } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import { Camera, Compass } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StoryCameraOverlay } from '@/components/stories/camera/StoryCameraOverlay'
import { StoryViewer, type StoryItem } from '@/components/stories/StoryViewer'

export function ProfileStories() {
  const [now] = useState(() => Date.now())
  const me = useQuery(api.profiles.getMe)
  const stories = useQuery(api.stories.listByUser, me ? { profileId: me._id, now } : 'skip')
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)

  if (stories === undefined) {
    return (
      <div className="grid grid-cols-3 gap-2" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[9/14] w-full rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-md">
      <div className="flex flex-wrap items-center gap-sm">
        <Button onClick={() => setCameraOpen(true)}>
          <Camera className="h-4 w-4" aria-hidden="true" />
          Create a story
        </Button>
        <Button asChild variant="outline">
          <Link href="/stories">
            <Compass className="h-4 w-4" aria-hidden="true" />
            Browse community stories
          </Link>
        </Button>
      </div>

      {stories.length === 0 ? (
        <div className="w-full rounded-2xl border border-outline-variant bg-surface-container-low p-6 text-center">
          <p className="font-display text-headline-sm text-on-surface">No active stories</p>
          <p className="mt-xs font-body-md text-on-surface-variant">
            Stories you post stay live for 24 hours, then move to your Past Events archive
            automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {stories.map((story, i) => (
            <button
              key={story.id}
              type="button"
              onClick={() => setOpenIndex(i)}
              aria-label={`View your story from ${new Date(story.createdAt).toLocaleDateString()}`}
              className="relative aspect-[9/14] overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low"
            >
              <Image
                src={story.thumbnailUrl ?? story.mediaUrl}
                alt=""
                fill
                sizes="33vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <span className="absolute bottom-1.5 left-2 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
                {new Date(story.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </button>
          ))}
        </div>
      )}

      {openIndex !== null && (
        <StoryViewer
          stories={stories as StoryItem[]}
          initialIndex={openIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
      <StoryCameraOverlay
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onPublished={() => setOpenIndex(null)}
      />
    </div>
  )
}
