'use client'

import Link from 'next/link'
import { ArrowLeft, Loader2, Save, Send } from 'lucide-react'
import { Button } from '@/components/ui'

interface EventFormHeaderProps {
  mode: 'create' | 'edit'
  title: string
  loading: boolean
  onCancel: () => void
  onCreateDraft: () => void
  onPublish: () => void
  onSave: () => void
}

export function EventFormHeader({
  mode,
  title,
  loading,
  onCancel,
  onCreateDraft,
  onPublish,
  onSave,
}: EventFormHeaderProps) {
  return (
    <div className="sticky top-16 z-20 -mx-6 -mt-6 lg:-mx-8 lg:-mt-8 px-6 lg:px-8 py-4 bg-background/95 backdrop-blur-md border-b border-outline-variant">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {mode === 'create' ? (
              <Link
                href="/events"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Back to events"
              >
                <ArrowLeft size={18} />
              </Link>
            ) : (
              <button
                type="button"
                onClick={onCancel}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Back to view mode"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <h1 className="font-headline text-2xl font-semibold text-foreground tracking-tight">
              {mode === 'create' ? 'Create Event' : 'Edit Event'}
            </h1>
          </div>
          <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-widest">
            {mode === 'create'
              ? 'Fol. 03 · events · draft by default'
              : `Fol. 03 · ${title || 'untitled'}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {mode === 'create' ? (
            <>
              <Button
                variant="outline"
                onClick={onCreateDraft}
                disabled={loading}
                className="gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save as Draft
              </Button>
              <Button onClick={onPublish} disabled={loading} className="gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Publish
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onCancel} disabled={loading} className="gap-2">
                Cancel
              </Button>
              <Button onClick={onSave} disabled={loading} className="gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
