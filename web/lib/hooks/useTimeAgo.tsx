'use client'

import { type ReactNode, useEffect, useState } from 'react'

/**
 * Compute a "time ago" label. Uses a stable server-safe fallback (M/D format)
 * and only computes the relative string on the client to avoid hydration
 * mismatches from Date.now() and toLocaleDateString timezone differences.
 */
function computeTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const d = new Date(timestamp)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

/** Stable server-safe fallback: M/D format (no timezone, no locale). */
function serverSafeDateLabel(timestamp: number): string {
  const d = new Date(timestamp)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

/**
 * Client-only "time ago" label. Returns a stable placeholder on the server
 * (avoiding Date.now() and toLocaleDateString hydration mismatches) and
 * updates to the real relative time after hydration.
 */
export function useTimeAgo(timestamp: number): string {
  const [label, setLabel] = useState(() => serverSafeDateLabel(timestamp))
  useEffect(() => {
    setLabel(computeTimeAgo(timestamp))
    const id = window.setInterval(() => setLabel(computeTimeAgo(timestamp)), 60_000)
    return () => window.clearInterval(id)
  }, [timestamp])
  return label
}

/**
 * Drop-in component for rendering "time ago" inside loops (where hooks
 * can't be called directly). Uses useTimeAgo internally.
 */
export function TimeAgoLabel({
  timestamp,
  className,
}: {
  timestamp: number
  className?: string
}): ReactNode {
  const label = useTimeAgo(timestamp)
  return (
    <span className={className} suppressHydrationWarning>
      {label}
    </span>
  )
}
