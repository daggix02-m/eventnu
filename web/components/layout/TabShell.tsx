'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Instant tab navigation.
 *
 * Bottom-tab presses are intercepted so the UI responds immediately instead of
 * waiting for the App Router to stream the next RSC payload:
 *  1. `pendingPath` is set the instant the tab is tapped → a lightweight
 *     skeleton fills <main> so the screen never blanks while the route loads.
 *  2. `router.prefetch` runs on idle for every tab so the payload is already
 *     in the client router cache on later visits.
 *  3. When the route lands (pathname matches), the skeleton fades out via a
 *     view transition (Safari 18+ / Chromium) or a plain cross-fade.
 *  4. Per-tab scroll position is preserved by `useAppShellScroll`.
 *  5. Convex query results stay cached by args, so revisiting a tab re-renders
 *     from the in-memory cache instantly with no loading flash.
 */
interface TabShellValue {
  /** Call from a tab press; target must be one of the tab routes. */
  navigate: (href: string) => void
}

const TabShellContext = createContext<TabShellValue | null>(null)

/** Routes treated as app tabs — prefetched on idle and given the instant overlay. */
export const TAB_ROUTES = ['/', '/schedule', '/saved', '/profile', '/stories']

function supportsViewTransition(): boolean {
  return typeof document !== 'undefined' && 'startViewTransition' in document
}

export function TabShellProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [pendingPath, setPendingPath] = useState<string | null>(null)
  const pendingTimerRef = useRef<number | null>(null)

  // Clear the pending overlay once the route actually lands.
  useEffect(() => {
    if (pendingPath === null) return
    if (pathname === pendingPath) {
      setPendingPath(null)
    }
  }, [pathname, pendingPath])

  // Idle-time prefetch of the tab routes so the first press is a cache hit.
  useEffect(() => {
    const targets = TAB_ROUTES.filter((route) => route !== pathname)
    const prefetchAll = () => {
      for (const route of targets) router.prefetch(route)
    }
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(prefetchAll, { timeout: 3000 })
      return () => window.cancelIdleCallback(id)
    }
    const timer = window.setTimeout(prefetchAll, 1500)
    return () => window.clearTimeout(timer)
  }, [router, pathname])

  const navigate = useCallback(
    (href: string) => {
      if (href === pathname) return
      setPendingPath(href)
      if (pendingTimerRef.current !== null) {
        window.clearTimeout(pendingTimerRef.current)
      }
      // Safety net: never let the skeleton hang if the route fails to land.
      pendingTimerRef.current = window.setTimeout(() => setPendingPath(null), 8000)

      if (supportsViewTransition()) {
        document.startViewTransition(() => {
          router.push(href)
        })
      } else {
        router.push(href)
      }
    },
    [pathname, router],
  )

  useEffect(
    () => () => {
      if (pendingTimerRef.current !== null) window.clearTimeout(pendingTimerRef.current)
    },
    [],
  )

  const value = useMemo(() => ({ navigate }), [navigate])

  return (
    <TabShellContext.Provider value={value}>
      {children}
      {pendingPath !== null && <TabLoadingOverlay />}
    </TabShellContext.Provider>
  )
}

/** Fills <main> with a skeleton so a tab switch never shows a blank screen. */
function TabLoadingOverlay() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-x-0 bottom-0 top-0 z-30 flex flex-col gap-lg overflow-y-auto bg-background px-4 pb-tabbar-safe pt-[max(1rem,env(safe-area-inset-top))] md:px-gutter [animation:tab-fade-in_0.15s_ease-out]"
    >
      <div className="mt-8 space-y-2">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-4 w-72 rounded-lg" />
      </div>
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
      </div>
    </div>
  )
}

export function useTabShell(): TabShellValue {
  const ctx = useContext(TabShellContext)
  if (!ctx) throw new Error('useTabShell must be used within TabShellProvider')
  return ctx
}
