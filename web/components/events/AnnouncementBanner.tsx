'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Megaphone, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion'
import type { Announcement } from '@/types'

interface AnnouncementBannerProps {
  announcements: Announcement[]
}

const STORAGE_KEY = 'eventnu-dismissed-announcements'
const ROTATE_MS = 6000

function readDismissed(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function AnnouncementBanner({ announcements }: AnnouncementBannerProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [dismissed, setDismissed] = useState<string[]>([])
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  const visible = announcements.filter((a) => !dismissed.includes(a.id))
  const current = visible.length > 0 ? visible[index % visible.length] : null

  useEffect(() => {
    const stored = readDismissed()
    if (stored.length > 0) setDismissed(stored)
  }, [])

  useEffect(() => {
    if (visible.length === 0) return
    if (index >= visible.length) setIndex(0)
  }, [index, visible.length])

  useEffect(() => {
    if (visible.length <= 1 || paused || prefersReducedMotion) return
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % visible.length)
    }, ROTATE_MS)
    return () => clearInterval(timer)
  }, [visible.length, paused, prefersReducedMotion])

  if (!current) return null

  const dismiss = (id: string) => {
    setDismissed((prev) => {
      const next = [...prev, id]
      try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        /* storage unavailable — ignore */
      }
      return next
    })
  }

  return (
    <div
      role="region"
      aria-label="Announcements"
      className="relative w-full border-b border-outline-variant/60 bg-secondary/10"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="mx-auto flex max-w-container-max items-center gap-sm px-gutter py-3">
        <Megaphone className="h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
        <div
          key={current.id}
          aria-live="polite"
          aria-atomic="true"
          className="announcement-in flex min-w-0 flex-1 items-center gap-sm text-body-md"
        >
          <strong className="shrink-0 text-secondary">{current.title}</strong>
          {current.message && (
            <span className="truncate text-on-surface-variant">{current.message}</span>
          )}
          {current.link_url && (
            <Link
              href={current.link_url}
              className="shrink-0 font-bold text-primary hover:underline"
            >
              {current.link_text || 'Learn more'}
            </Link>
          )}
        </div>
        {visible.length > 1 && (
          <span
            className="shrink-0 font-mono text-label-sm tabular-nums text-on-surface-variant"
            aria-hidden="true"
          >
            {(index % visible.length) + 1}/{visible.length}
          </span>
        )}
        <button
          type="button"
          onClick={() => dismiss(current.id)}
          aria-label="Dismiss announcement"
          className={cn(
            'shrink-0 rounded-full p-1 text-on-surface-variant transition-colors',
            'hover:bg-surface-container-high hover:text-on-surface',
          )}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
