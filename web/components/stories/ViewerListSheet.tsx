'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useQuery } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import type { Id } from '@eventnu/convex/_generated/dataModel'
import { X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

function timeAgo(timestamp: number) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export function ViewerListSheet({
  storyId,
  show,
  onClose,
}: {
  storyId: string | null
  show: boolean
  onClose: () => void
}) {
  const viewers = useQuery(
    api.stories.listViews,
    show && storyId ? { storyId: storyId as Id<'stories'> } : 'skip',
  )

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[85] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          {/* Sheet */}
          <motion.div
            role="dialog"
            aria-label="Story viewers"
            className="fixed inset-x-0 bottom-0 z-[90] max-h-[70vh] overflow-hidden rounded-t-3xl bg-surface-container-low"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pb-2 pt-3">
              <div className="h-1 w-10 rounded-full bg-white/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3">
              <h3 className="text-label-lg font-semibold text-on-surface">
                Viewed by {viewers === undefined ? '…' : viewers.length}
              </h3>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close viewer list"
                className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Viewer list */}
            <div className="max-h-[55vh] overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              {viewers === undefined && (
                <div className="flex justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              )}
              {viewers?.length === 0 && (
                <p className="py-8 text-center text-on-surface-variant">No views yet</p>
              )}
              {viewers?.map((v) => (
                <div key={v.viewerId} className="flex items-center gap-3 py-3">
                  <Avatar className="h-10 w-10">
                    {v.avatarUrl ? <AvatarImage src={v.avatarUrl} alt={v.fullName} /> : null}
                    <AvatarFallback>
                      {v.fullName
                        .split(' ')
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body-md font-medium text-on-surface">
                      {v.fullName}
                    </p>
                    <p className="text-label-sm text-on-surface-variant">{timeAgo(v.viewedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
