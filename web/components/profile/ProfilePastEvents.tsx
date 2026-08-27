'use client'

import { useMemo, useState, Component, type ReactNode } from 'react'
import Image from 'next/image'
import { usePaginatedQuery, useQuery, useMutation } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import type { FunctionReturnType } from 'convex/server'
import type { Id } from '@eventnu/convex/_generated/dataModel'
import { useConvexAuth } from '@convex-dev/auth/react'
import Link from 'next/link'
import { CalendarDays, Folder, Trash2, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type PastStory = FunctionReturnType<typeof api.stories.listPast>['page'][number]
type StoryCategory = FunctionReturnType<typeof api.storyCategories.list>[number]

function monthLabel(dateKey: string): string {
  const [y, m] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function dayLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

/** Catches errors thrown by usePaginatedQuery and renders a graceful fallback. */
class PastEventsErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

function ErrorFallback() {
  return (
    <div className="w-full rounded-2xl border border-outline-variant bg-surface-container-low p-6 text-center">
      <p className="font-display text-headline-sm text-on-surface">Something went wrong</p>
      <p className="mt-xs font-body-md text-on-surface-variant">
        We couldn&apos;t load your past events. Please try again later.
      </p>
    </div>
  )
}

/**
 * Owner-only "Past Events" archive. Expired stories are private to the owner
 * and grouped by capture day (calendar style), filterable by the user's custom
 * categories. Reading is hard-gated server-side to the authenticated owner.
 */
export function ProfilePastEvents() {
  const { isAuthenticated } = useConvexAuth()
  const [selected, setSelected] = useState<string>('all')
  const [openStory, setOpenStory] = useState<PastStory | null>(null)

  const categories = useQuery(api.storyCategories.list, isAuthenticated ? {} : 'skip')
  const { results, status, loadMore } = usePaginatedQuery(
    api.stories.listPast,
    isAuthenticated
      ? selected === 'uncategorized'
        ? { uncategorized: true }
        : selected === 'all'
          ? {}
          : { categoryId: selected as Id<'storyCategories'> }
      : 'skip',
    { initialNumItems: 30 },
  )

  const grouped = useMemo(() => {
    const map = new Map<string, PastStory[]>()
    for (const story of results as PastStory[]) {
      const key = story.dateKey
      const list = map.get(key) ?? []
      list.push(story)
      map.set(key, list)
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1))
  }, [results])

  if (!isAuthenticated) return null

  return (
    <div className="space-y-md">
      <div className="flex flex-wrap items-center gap-2" aria-label="Archive categories">
        <button
          type="button"
          onClick={() => setSelected('all')}
          aria-pressed={selected === 'all'}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-colors',
            selected === 'all'
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-outline-variant text-on-surface-variant hover:border-primary/50',
          )}
        >
          <CalendarDays className="h-3.5 w-3.5" /> All
        </button>
        <button
          type="button"
          onClick={() => setSelected('uncategorized')}
          aria-pressed={selected === 'uncategorized'}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-colors',
            selected === 'uncategorized'
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-outline-variant text-on-surface-variant hover:border-primary/50',
          )}
        >
          Uncategorized
        </button>
        {(categories ?? []).map((category: StoryCategory) => (
          <button
            key={category._id}
            type="button"
            onClick={() => setSelected(category._id)}
            aria-pressed={selected === category._id}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-colors',
              selected === category._id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-outline-variant text-on-surface-variant hover:border-primary/50',
            )}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: category.color ?? '#d0bcff' }}
            />
            {category.name}
          </button>
        ))}
      </div>

      {status === 'LoadingFirstPage' ? (
        <div className="grid grid-cols-3 gap-2" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[9/14] w-full rounded-xl" />
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <div className="w-full rounded-2xl border border-outline-variant bg-surface-container-low p-6 text-center">
          <p className="font-display text-headline-sm text-on-surface">
            Nothing in your archive yet
          </p>
          <p className="mt-xs font-body-md text-on-surface-variant">
            When a story you post passes its 24 hours, it lands here — private to you.
          </p>
        </div>
      ) : (
        <div className="space-y-lg">
          {grouped.map(([dateKey, stories]) => (
            <section key={dateKey} aria-label={dayLabel(dateKey)}>
              <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                {monthLabel(dateKey)} · {dayLabel(dateKey)}
              </h3>
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {stories.map((story) => {
                  const category = (categories ?? []).find((c) => c._id === story.categoryId)
                  return (
                    <button
                      key={story.id}
                      type="button"
                      onClick={() => setOpenStory(story)}
                      aria-label={`View past story from ${dayLabel(dateKey)}`}
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
                      {category && (
                        <span
                          className="absolute left-1.5 top-1.5 h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: category.color ?? '#d0bcff' }}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
          {status === 'CanLoadMore' && (
            <div className="text-center">
              <Button variant="outline" onClick={() => loadMore(30)}>
                Load more
              </Button>
            </div>
          )}
        </div>
      )}

      {openStory && (
        <ArchiveStoryViewer
          story={openStory}
          onClose={() => setOpenStory(null)}
          categories={categories ?? []}
        />
      )}
    </div>
  )
}

/** Wrapped export that catches usePaginatedQuery errors gracefully. */
export function ProfilePastEventsContainer() {
  return (
    <PastEventsErrorBoundary fallback={<ErrorFallback />}>
      <ProfilePastEvents />
    </PastEventsErrorBoundary>
  )
}

function ArchiveStoryViewer({
  story,
  onClose,
  categories,
}: {
  story: PastStory
  onClose: () => void
  categories: StoryCategory[]
}) {
  const remove = useMutation(api.stories.remove)
  const setCategory = useMutation(api.stories.setCategory)
  const [removing, setRemoving] = useState(false)

  const handleDelete = async () => {
    setRemoving(true)
    try {
      await remove({ storyId: story.id as Id<'stories'> })
      onClose()
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Archived story"
      className="fixed inset-0 z-80 flex flex-col bg-black"
    >
      <div className="relative z-20 flex items-center px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close archive viewer"
          className="flex h-11 w-11 items-center justify-center rounded-full text-white hover:bg-white/10"
        >
          <X className="h-6 w-6" aria-hidden="true" />
        </button>
        <p className="mx-auto text-body-sm font-medium text-white">Past story</p>
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={removing}
          aria-label="Delete this past story"
          className="flex h-11 w-11 items-center justify-center rounded-full text-white/80 hover:bg-white/10"
        >
          <Trash2 className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="relative z-0 flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        {story.kind === 'photo' ? (
          <Image src={story.mediaUrl} alt="" fill sizes="100vw" className="object-cover" />
        ) : (
          <video src={story.mediaUrl} controls playsInline className="h-full w-full object-cover" />
        )}
      </div>

      <div className="relative z-20 space-y-2 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        {story.caption && (
          <p className="whitespace-pre-wrap break-words font-body-md text-white/90">
            {story.caption}
          </p>
        )}
        <p className="text-label-sm text-white/60">
          {new Date(story.createdAt).toLocaleString(undefined, {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
        <label className="block text-label-sm text-white/70" htmlFor="archive-category">
          Category
        </label>
        <select
          id="archive-category"
          value={story.categoryId ?? ''}
          onChange={(e) => {
            const value = e.target.value
            void setCategory({
              storyId: story.id as Id<'stories'>,
              categoryId: value ? (value as Id<'storyCategories'>) : undefined,
            })
          }}
          className="w-full rounded-xl border border-white/20 bg-black/40 px-md py-3 font-body-md text-white focus:border-primary focus:outline-none"
        >
          <option value="">Uncategorized</option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>
        {categories.length === 0 && (
          <p className="inline-flex items-center gap-1.5 text-label-sm text-white/60">
            <Folder className="h-3.5 w-3.5" aria-hidden="true" />
            Create categories on your{' '}
            <Link
              href="/profile/settings"
              className="underline underline-offset-2 hover:text-white/80"
            >
              settings page
            </Link>{' '}
            to organize your archive.
          </p>
        )}
      </div>
    </div>
  )
}
