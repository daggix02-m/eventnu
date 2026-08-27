'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

// Restore before paint on the client; `useLayoutEffect` is a no-op on the
// server and would warn during SSR, so fall back to `useEffect` there.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

// Per-pathname scroll positions for back/forward restoration. Next.js restores
// window scroll by default, but with the app-shell lock the document never
// scrolls — <main> does — so we track and restore its scrollTop ourselves.
const scrollPositions = new Map<string, number>()

/**
 * Returns a ref for the app shell's vertical scroll container (`<main>`).
 *
 * With the app-shell lock (`html`/`body` pinned, `main` scrolling) the
 * document itself cannot scroll, so window-based scroll restoration in
 * Next.js is a no-op. This hook saves each route's scrollTop as the user
 * scrolls and restores it (or resets to 0 for fresh routes) on navigation.
 */
export function useAppShellScroll() {
  const ref = useRef<HTMLElement | null>(null)
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)

  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  useEffect(() => {
    const main = ref.current
    if (!main) return

    const onScroll = () => {
      scrollPositions.set(pathnameRef.current, main.scrollTop)
    }
    main.addEventListener('scroll', onScroll, { passive: true })
    return () => main.removeEventListener('scroll', onScroll)
  }, [])

  // Set before paint so the restored position never flashes.
  useIsomorphicLayoutEffect(() => {
    const main = ref.current
    if (!main) return
    main.scrollTop = scrollPositions.get(pathname) ?? 0
  }, [pathname])

  return ref
}
