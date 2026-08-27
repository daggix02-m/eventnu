'use client'

import { useCallback, useEffect, useState } from 'react'

const DRAFT_KEY = 'eventnu_story_draft'

export interface StoryDraft {
  /** Blob URL of the captured media (will be revoked on clear) */
  mediaPreviewUrl: string
  /** Serialized file data (name, type) for recreation */
  mediaFileName: string
  mediaFileType: string
  /** Base64-encoded media data for persistence across sessions */
  mediaDataBase64: string
  mode: 'photo' | 'video'
  caption: string
  eventId: string
  filter: string | null
  transforms: {
    rotate: number
    flipH: boolean
    flipV: boolean
  } | null
  savedAt: number
}

interface UseDraftManagerReturn {
  /** Whether a draft exists */
  hasDraft: boolean
  /** When the draft was saved (for "Resume draft?" prompt) */
  draftSavedAt: number | null
  /** Save the current story state as a draft */
  saveDraft: (draft: Omit<StoryDraft, 'savedAt'>) => void
  /** Load the saved draft (returns null if expired or invalid) */
  loadDraft: () => StoryDraft | null
  /** Clear the saved draft */
  clearDraft: () => void
}

const DRAFT_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Manages story draft persistence in localStorage.
 * Drafts expire after 24 hours. Media data is stored as base64 to survive
 * page reloads (blob URLs are ephemeral).
 */
export function useDraftManager(): UseDraftManagerReturn {
  const [hasDraft, setHasDraft] = useState(false)
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null)

  // Check for existing draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) return
      const draft: StoryDraft = JSON.parse(raw)
      if (Date.now() - draft.savedAt > DRAFT_EXPIRY_MS) {
        localStorage.removeItem(DRAFT_KEY)
        return
      }
      setHasDraft(true)
      setDraftSavedAt(draft.savedAt)
    } catch {
      localStorage.removeItem(DRAFT_KEY)
    }
  }, [])

  const saveDraft = useCallback((data: Omit<StoryDraft, 'savedAt'>) => {
    try {
      const draft: StoryDraft = { ...data, savedAt: Date.now() }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
      setHasDraft(true)
      setDraftSavedAt(draft.savedAt)
    } catch {
      // Storage quota exceeded or unavailable — silently fail
    }
  }, [])

  const loadDraft = useCallback((): StoryDraft | null => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) return null
      const draft: StoryDraft = JSON.parse(raw)
      if (Date.now() - draft.savedAt > DRAFT_EXPIRY_MS) {
        localStorage.removeItem(DRAFT_KEY)
        setHasDraft(false)
        setDraftSavedAt(null)
        return null
      }
      return draft
    } catch {
      return null
    }
  }, [])

  const clearDraft = useCallback(() => {
    try {
      // Revoke any blob URLs before clearing
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        const draft: StoryDraft = JSON.parse(raw)
        if (draft.mediaPreviewUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(draft.mediaPreviewUrl)
        }
      }
      localStorage.removeItem(DRAFT_KEY)
    } catch {
      // ignore
    }
    setHasDraft(false)
    setDraftSavedAt(null)
  }, [])

  return { hasDraft, draftSavedAt, saveDraft, loadDraft, clearDraft }
}

/**
 * Convert a File to base64 data URL for localStorage persistence.
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Convert a base64 data URL back to a File.
 */
export function base64ToFile(dataUrl: string, fileName: string, mimeType: string): File {
  const parts = dataUrl.split(',')
  const byteString = atob(parts[1] ?? '')
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }
  return new File([ab], fileName, { type: mimeType })
}
