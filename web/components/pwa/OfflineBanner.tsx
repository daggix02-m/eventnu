'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

/**
 * Slim in-flow banner shown while the device is offline.
 *
 * The service worker serves cached pages offline, but cached event dates can
 * look "live" — this banner tells the user the content may be stale. It sits in
 * normal document flow above the TopNav so it pushes the page down instead of
 * covering the sticky header.
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(
    typeof navigator === 'undefined' ? false : !navigator.onLine,
  )

  useEffect(() => {
    const markOffline = () => setOffline(true)
    const markOnline = () => setOffline(false)
    window.addEventListener('offline', markOffline)
    window.addEventListener('online', markOnline)
    return () => {
      window.removeEventListener('offline', markOffline)
      window.removeEventListener('online', markOnline)
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
