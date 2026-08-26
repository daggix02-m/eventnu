'use client'

import { useState } from 'react'
import { usePaginatedQuery } from 'convex/react'
import dynamic from 'next/dynamic'
import { api } from '@eventnu/convex/_generated/api'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useIdleDefer } from '@/lib/hooks/useIdleDefer'
import type { StoryItem } from '@/components/stories/StoryViewer'

// StoryViewer pulls in moderation UI (ReportDialog) and its own Convex hooks;
// load it only when the user actually opens a story so it stays out of the
// home-page bundle.
const StoryViewer = dynamic(
  () => import('@/components/stories/StoryViewer').then((m) => m.StoryViewer),
  { ssr: false },
)

export function StoriesRail() {
  const [now] = useState(() => Date.now())
  // Defer the stories fetch (40 items) until the browser is idle so it never
  // competes with the initial page's LCP resources.
  const started = useIdleDefer(1500)
  const { results, status } = usePaginatedQuery(
    api.stories.listActive,
    started ? { now } : 'skip',
    { initialNumItems: 40 },
  )
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const stories = results as StoryItem[]
  const groups = groupByAuthor(stories)
  const authors = [...groups.entries()]

  if (status === 'LoadingFirstPage') {
    return (
      <div className="flex gap-md overflow-x-auto px-4 md:px-gutter py-sm" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[4.5rem] w-[4.5rem] shrink-0 rounded-full" />
        ))}
      </div>
    )
  }

  if (authors.length === 0) return null

  const flatIndexFor = (authorId: string) => stories.findIndex((s) => s.userId === authorId)

  return (
    <section aria-label="Community stories" className="py-md">
      <div className="mx-auto w-full max-w-container-max px-4 md:px-gutter">
        <div className="flex gap-md overflow-x-auto scrollbar-none py-sm">
          <Link
            href="/stories"
            className="flex shrink-0 flex-col items-center gap-xs"
            aria-label="Create or browse stories"
          >
            <span className="flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full border-2 border-dashed border-primary/50 bg-surface-container-low text-primary transition-colors hover:border-primary">
              <Plus className="h-6 w-6" aria-hidden="true" />
            </span>
            <span className="max-w-[5rem] truncate text-label-sm text-on-surface-variant">
              Create
            </span>
          </Link>
          {authors.map(([authorId, authorStories]) => {
            const latest = authorStories[0]
            const initials = (latest.author?.fullName ?? 'A')
              .split(' ')
              .map((part) => part[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()
            return (
              <button
                key={authorId}
                type="button"
                onClick={() => setOpenIndex(flatIndexFor(authorId))}
                className="flex shrink-0 flex-col items-center gap-xs"
                aria-label={`View ${latest.author?.fullName ?? 'Anonymous'}'s stories`}
              >
                <span className="rounded-full bg-gradient-to-tr from-primary via-secondary to-tertiary p-[3px]">
                  <Avatar className="h-16 w-16 border-4 border-background">
                    {latest.author?.avatarUrl ? (
                      <AvatarImage src={latest.author.avatarUrl} alt={latest.author.fullName} />
                    ) : null}
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </span>
                <span className="max-w-[5rem] truncate text-label-sm text-on-surface-variant">
                  {latest.author?.fullName ?? 'Anonymous'}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {openIndex !== null && (
        <StoryViewer
          stories={stories}
          initialIndex={openIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </section>
  )
}

function groupByAuthor(stories: StoryItem[]): Map<string, StoryItem[]> {
  const groups = new Map<string, StoryItem[]>()
  for (const story of stories) {
    const list = groups.get(story.userId) ?? []
    list.push(story)
    groups.set(story.userId, list)
  }
  return groups
}
