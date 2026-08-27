'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { SaveCategoryPrompt } from '@/components/saved/SaveCategoryPrompt'

interface PendingSave {
  eventId: string
  eventTitle: string
}

interface SavePromptContextValue {
  /** Call after a successful event save to trigger the categorize card. */
  promptForCategory: (eventId: string, eventTitle: string) => void
}

const SavePromptContext = createContext<SavePromptContextValue | null>(null)

export function SavePromptProvider({ children }: { children?: React.ReactNode }) {
  const [pending, setPending] = useState<PendingSave | null>(null)

  const promptForCategory = useCallback((eventId: string, eventTitle: string) => {
    setPending({ eventId, eventTitle })
  }, [])

  const value = useMemo(() => ({ promptForCategory }), [promptForCategory])

  return (
    <SavePromptContext.Provider value={value}>
      {children}
      <SaveCategoryPrompt
        pending={pending}
        onClose={() => setPending(null)}
        onAssigned={() => setPending(null)}
      />
    </SavePromptContext.Provider>
  )
}

export function useSavePrompt(): SavePromptContextValue {
  const ctx = useContext(SavePromptContext)
  if (!ctx) throw new Error('useSavePrompt must be used within SavePromptProvider')
  return ctx
}
