'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'
import { OFFLINE_REPROBE_MS, probeConnectivity } from '@/lib/offline'

/**
 * Slim in-flow banner shown while the device is offline.
 *
 * The service worker serves cached pages offline, but cached event dates can
 * look "live" — this banner tells the user the content may be stale. It sits in
 * normal document flow above the TopNav so it pushes the page down instead of
 * covering the sticky header.
 *
 * We do NOT trust `navigator.onLine` on its own: iOS Safari / standalone PWAs
 * often report `false` at launch or on resume even with a live connection, and
 * the `online` event frequently never fires to clear it. The banner therefore
 * confirms with a real connectivity probe (`/api/health`, a path the service
 * worker ignores, so cached content can't fake a connection) before showing,
 * and re-probes periodically while the browser believes it is offline so a
 * missed `online` event self-heals.
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    let cancelled = false

    const check = async () => {
      const online = await probeConnectivity()
      if (cancelled) return
      setOffline(!online)
    }

    const handleOnline = () => setOffline(false)
    const handleOffline = () => void check()
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !navigator.onLine) {
        void check()
      }
    }

    // If the browser already reports offline, confirm before showing the banner.
    if (!navigator.onLine) void check()

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    document.addEventListener('visibilitychange', handleVisibility)

    // Re-probe while the browser believes it's offline so a missed `online`
    // event can't leave the banner stuck.
    const interval = window.setInterval(() => {
      if (!navigator.onLine) void check()
    }, OFFLINE_REPROBE_MS)

    return () => {
      cancelled = true
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.clearInterval(interval)
    }
  }, [])

  if (!offline) return null

  return (
    <div role="status" className="pt-[env(safe-area-inset-top)] bg-secondary/15">
      <p className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-on-surface">
        <WifiOff className="h-3.5 w-3.5 text-secondary shrink-0" aria-hidden="true" />
        You&apos;re offline — showing saved content
      </p>
    </div>
  )
}
