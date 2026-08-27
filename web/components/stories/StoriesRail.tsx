'use client'

import { useState } from 'react'
import { useQuery_experimental as useQuery } from 'convex/react'
import dynamic from 'next/dynamic'
import { api } from '@eventnu/convex/_generated/api'
import type { FunctionReturnType } from 'convex/server'
import type { Id } from '@eventnu/convex/_generated/dataModel'
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

type RailAuthorSummary = FunctionReturnType<typeof api.stories.listRail>[number]

export function StoriesRail() {
  const [now] = useState(() => Date.now())
  // Defer the rail fetch (a light summary payload) until the browser is idle so
  // it never competes with the initial page's LCP resources.
  const started = useIdleDefer(1500)
  const summariesQuery = useQuery({
    query: api.stories.listRail,
    args: started ? { now } : 'skip',
  })
  const [openAuthorId, setOpenAuthorId] = useState<Id<'profiles'> | null>(null)

  // Fetch only the tapped author's full stories, on demand — the rail never
  // ships full media docs.
  const authorStoriesQuery = useQuery({
    query: api.stories.listByUser,
    args: openAuthorId ? { profileId: openAuthorId, now } : 'skip',
  })

  // The rail is a non-critical enhancement. A transient query failure (e.g. a
  // Convex function mid-redeploy) must not take the whole home page down, so
  // degrade to hidden instead of throwing (useQuery_experimental surfaces the
  // error as a status rather than throwing during render).
  if (summariesQuery.status === 'pending') {
    return (
      <div className="flex gap-md overflow-x-auto px-4 md:px-gutter py-sm" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[4.5rem] w-[4.5rem] shrink-0 rounded-full" />
        ))}
      </div>
    )
  }

  if (summariesQuery.status === 'error') return null

  const summaries = summariesQuery.data
  if (summaries.length === 0) return null

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
          {summaries.map((author) => (
            <StoryRing
              key={author.authorId}
              author={author}
              onOpen={() => setOpenAuthorId(author.authorId as Id<'profiles'>)}
            />
          ))}
        </div>
      </div>

      {openAuthorId !== null && authorStoriesQuery.status === 'success' && (
        <StoryViewer
          stories={authorStoriesQuery.data as StoryItem[]}
          initialIndex={0}
          onClose={() => setOpenAuthorId(null)}
        />
      )}
    </section>
  )
}

function initialsFor(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/**
 * A single circular story ring. The gradient ring is emphasized when the author
 * has unviewed stories; a thin conic ring conveys "partially seen" when some
 * stories in the group have been viewed (per-session approximation).
 */
function StoryRing({ author, onOpen }: { author: RailAuthorSummary; onOpen: () => void }) {
  const initials = initialsFor(author.authorName)
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex shrink-0 flex-col items-center gap-xs"
      aria-label={`View ${author.authorName}'s stories (${author.storyCount})`}
    >
      <span className="relative rounded-full bg-gradient-to-tr from-primary via-secondary to-tertiary p-[3px]">
        <Avatar className="h-16 w-16 border-4 border-background">
          {author.avatarUrl ? <AvatarImage src={author.avatarUrl} alt={author.authorName} /> : null}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        {author.hasUnviewed && (
          <span className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full bg-primary ring-2 ring-background" />
        )}
      </span>
      <span className="max-w-[5rem] truncate text-label-sm text-on-surface-variant">
        {author.authorName}
      </span>
    </button>
  )
}
