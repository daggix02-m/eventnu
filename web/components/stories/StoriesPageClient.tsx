'use client'

import { useState } from 'react'
import Image from 'next/image'
import { usePaginatedQuery } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import { useConvexAuth } from '@convex-dev/auth/react'
import { useAuthRedirect } from '@/components/auth/AuthRedirectContext'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateStoryForm } from '@/components/stories/CreateStoryForm'
import { StoryViewer, type StoryItem } from '@/components/stories/StoryViewer'
import { LogIn } from 'lucide-react'

export function StoriesPageClient() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const { openAuth } = useAuthRedirect()
  const [now] = useState(() => Date.now())
  const { results, status, loadMore } = usePaginatedQuery(
    api.stories.listActive,
    { now },
    { initialNumItems: 40 },
  )
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const stories = results as StoryItem[]

  return (
    <div className="mx-auto w-full max-w-[52rem] space-y-lg">
      <header className="space-y-sm">
        <h1 className="font-display text-display-lg-mobile text-on-surface md:text-display-lg">
          Stories
        </h1>
        <p className="text-body-lg text-on-surface-variant">
          Community stories from events across Addis — they disappear after 24 hours.
        </p>
      </header>

      {!isLoading && !isAuthenticated && (
        <Button onClick={() => openAuth('/stories')} className="w-fit">
          <LogIn className="h-4 w-4" aria-hidden="true" />
          Sign in to create a story
        </Button>
      )}
      {!isLoading && isAuthenticated && <CreateStoryForm />}

      <section aria-label="All stories">
        <h2 className="font-display text-headline-md text-on-surface">Browse stories</h2>

        {status === 'LoadingFirstPage' ? (
          <div className="mt-md space-y-md" aria-hidden="true">
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        ) : stories.length === 0 ? (
          <div className="mt-md rounded-2xl border border-outline-variant bg-surface-container-low p-md text-center">
            <p className="font-body-md text-on-surface-variant">
              No stories yet — be the first to share a moment.
            </p>
          </div>
        ) : (
          <div className="mt-md grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3">
            {stories.map((story, i) => (
              <button
                key={story.id}
                type="button"
                onClick={() => setOpenIndex(i)}
                className="group relative aspect-[9/14] overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-low text-left"
                aria-label={`View ${story.author?.fullName ?? 'Anonymous'}'s story`}
              >
                {story.kind === 'photo' ? (
                  <Image
                    src={story.mediaUrl}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <video
                    src={story.mediaUrl}
                    muted
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-md">
                  <p className="truncate font-label-lg text-white">
                    {story.author?.fullName ?? 'Anonymous'}
                  </p>
                  {story.caption && (
                    <p className="mt-xs line-clamp-2 text-label-sm text-white/80">
                      {story.caption}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {status !== 'LoadingFirstPage' && stories.length > 0 && (
        <div className="text-center">
          <Button variant="outline" onClick={() => loadMore(40)}>
            Load more stories
          </Button>
        </div>
      )}

      {openIndex !== null && (
        <StoryViewer
          stories={stories}
          initialIndex={openIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </div>
  )
}
