'use client'

import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'

/**
 * Registers the service worker and surfaces an "update available" prompt.
 *
 * sw.js calls `skipWaiting()` + `clients.claim()`, so a new deploy activates
 * immediately — but the already-open page keeps running the old JS/CSS until a
 * reload. This component listens for `updatefound` and shows a small pill that
 * lets the user reload on their own terms instead of getting yanked mid-use.
 */
export function ServiceWorkerRegister() {
  const [updateReady, setUpdateReady] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    const onLoad = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (!newWorker) return
            newWorker.addEventListener('statechange', () => {
              // "installed" with an existing controller = a newer version is
              // ready; the very first install has no controller and needs no prompt.
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateReady(true)
              }
            })
          })
        })
        .catch((error) => {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[PWA] ServiceWorker registration failed:', error)
          }
        })
    }

    window.addEventListener('load', onLoad)
    return () => window.removeEventListener('load', onLoad)
  }, [])

  if (!updateReady) return null

  return (
    <div className="fixed bottom-[calc(9rem_+_env(safe-area-inset-bottom))] md:bottom-6 right-4 left-4 md:left-auto md:max-w-[24rem] z-70 flex justify-center pointer-events-none animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="pointer-events-auto flex items-center justify-between gap-3 w-full bg-surface-container-high/95 backdrop-blur-xl border border-outline-variant/80 rounded-2xl p-3.5 shadow-2xl text-on-surface">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
            <RefreshCw className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">New version available</p>
            <p className="text-xs text-on-surface-variant truncate">
              Reload to get the latest updates
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="shrink-0 bg-primary text-on-primary hover:bg-primary/90 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all active:scale-95 cursor-pointer shadow-md"
        >
          Reload
        </button>
      </div>
    </div>
  )
}
