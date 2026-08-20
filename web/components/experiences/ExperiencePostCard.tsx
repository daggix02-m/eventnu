'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import type { Id } from '@eventnu/convex/_generated/dataModel'
import { CalendarDays, Trash2 } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

type Post = {
  id: string
  userId: string
  author: { id: string; fullName: string; avatarUrl?: string } | null
  eventId?: string
  event: { id: string; title: string; slug?: string } | null
  content: string
  imageUrl?: string
  createdAt: number
}

function timeAgo(timestamp: number) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function ExperiencePostCard({
  post,
  canDelete = false,
}: {
  post: Post
  canDelete?: boolean
}) {
  const remove = useMutation(api.experiencePosts.remove)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initials = (post.author?.fullName ?? 'A')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const handleDelete = async () => {
    if (!confirm('Delete this experience post?')) return
    setDeleting(true)
    setError(null)
    try {
      await remove({ postId: post.id as Id<'experiencePosts'> })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post')
      setDeleting(false)
    }
  }

  return (
    <article className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low">
      <div className="flex items-start justify-between gap-sm p-md">
        <div className="flex items-center gap-sm">
          <Avatar className="h-10 w-10">
            {post.author?.avatarUrl ? (
              <AvatarImage src={post.author.avatarUrl} alt={post.author.fullName} />
            ) : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-label-lg text-on-surface">{post.author?.fullName ?? 'Anonymous'}</p>
            <p className="font-body-sm text-on-surface-variant">{timeAgo(post.createdAt)}</p>
          </div>
        </div>
        {canDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            aria-label="Delete this post"
            className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-error/10 hover:text-error disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {post.imageUrl && (
        <div className="relative aspect-video w-full">
          <Image
            src={post.imageUrl}
            alt=""
            fill
            sizes="(max-width: 672px) 100vw, 42rem"
            className="object-cover"
          />
        </div>
      )}

      <div className="space-y-sm p-md">
        <p className="whitespace-pre-wrap break-words font-body-md text-on-surface">
          {post.content}
        </p>

        {post.event && post.event.slug && (
          <Link
            href={`/events/${post.event.slug}`}
            className="inline-flex w-fit items-center gap-xs rounded-full bg-secondary-container px-sm py-1 font-label-md text-on-secondary-container transition-colors hover:bg-secondary-container/80"
          >
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            {post.event.title}
          </Link>
        )}

        {error && (
          <p role="alert" className="font-body-sm text-error">
            {error}
          </p>
        )}
      </div>
    </article>
  )
}
