'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import type { FunctionReturnType } from 'convex/server'
import type { Id } from '@eventnu/convex/_generated/dataModel'
import { Bookmark, FolderPlus, Loader2, X } from 'lucide-react'
import { useConvexAuth } from '@convex-dev/auth/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PendingSave {
  eventId: string
  eventTitle: string
}

interface SaveCategoryPromptProps {
  pending: PendingSave | null
  onClose: () => void
  onAssigned: () => void
}

export function SaveCategoryPrompt({ pending, onClose, onAssigned }: SaveCategoryPromptProps) {
  const { isAuthenticated } = useConvexAuth()
  const folders = useQuery(api.bookmarks.listFolders, isAuthenticated ? {} : 'skip')
  const moveToFolder = useMutation(api.bookmarks.moveToFolder)
  const createFolder = useMutation(api.bookmarks.createFolder)

  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)

  const assign = async (folderId?: Id<'bookmarkFolders'>) => {
    if (!pending) return
    setBusy(true)
    try {
      await moveToFolder({ eventId: pending.eventId as Id<'events'>, folderId })
      onAssigned()
    } finally {
      setBusy(false)
    }
  }

  const createAndAssign = async () => {
    if (!pending || !newName.trim()) return
    setBusy(true)
    try {
      const folderId = await createFolder({ name: newName.trim() })
      await moveToFolder({ eventId: pending.eventId as Id<'events'>, folderId })
      setNewName('')
      onAssigned()
    } finally {
      setBusy(false)
    }
  }

  return (
    <AnimatePresence>
      {pending && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Organize saved event"
          className="fixed inset-0 z-80 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="document"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[26rem] rounded-t-3xl border border-outline-variant bg-surface-container-low p-md pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:rounded-3xl"
            initial={{ y: 80, scale: 0.95, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 40, scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            <div className="flex items-start justify-between gap-sm">
              <div>
                <h2 className="font-display text-headline-sm text-on-surface">Event saved</h2>
                <p className="mt-xs font-body-md text-on-surface-variant">
                  Saved <span className="font-semibold text-on-surface">{pending.eventTitle}</span>.
                  Organize it or keep it in your default list.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-md space-y-xs" role="list" aria-label="Saved event categories">
              {(folders ?? []).map(
                (folder: FunctionReturnType<typeof api.bookmarks.listFolders>[number]) => (
                  <button
                    key={folder._id}
                    type="button"
                    onClick={() => void assign(folder._id)}
                    disabled={busy}
                    className={cn(
                      'flex w-full items-center gap-sm rounded-xl border px-md py-3 text-left transition-colors',
                      folder.isDefault
                        ? 'border-primary/60 bg-primary/10 text-on-surface'
                        : 'border-outline-variant text-on-surface hover:border-primary/50 hover:bg-surface-container-high',
                    )}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-highest">
                      <Bookmark
                        className={cn(
                          'h-4 w-4',
                          folder.isDefault ? 'text-primary' : 'text-on-surface-variant',
                        )}
                        aria-hidden="true"
                      />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-body-sm font-semibold text-on-surface">
                      {folder.name}
                    </span>
                    {folder.kind === 'system' && (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
                        Default
                      </span>
                    )}
                  </button>
                ),
              )}
            </div>

            <div className="mt-md flex gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void createAndAssign()
                }}
                placeholder="New custom category…"
                aria-label="New custom category name"
                maxLength={60}
                className="min-w-0 flex-1 rounded-xl border border-outline-variant bg-surface-container px-md py-3 font-body-md text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => void createAndAssign()}
                disabled={busy || !newName.trim()}
                aria-label="Create category and save"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <FolderPlus className="h-4 w-4" aria-hidden="true" />
                )}
                Create
              </Button>
            </div>

            <div className="mt-md flex items-center justify-between">
              <Button type="button" variant="ghost" onClick={onClose}>
                Keep uncategorized
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
