'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { shouldShowBackButton } from '@/lib/navigation'

interface BackButtonProps {
  /**
   * The current browser history length. On a cold start / deep link this is 1
   * (nothing in-app to pop); after in-app navigation it is greater.
   * Defaults to `window.history.length`; only overridable for tests.
   */
  historyLength?: number
}

/**
 * Visible back control for iOS standalone PWAs where there is no browser
 * chrome and edge-swipe-back is unreliable. Pops the browser history so the
 * user returns to the exact previous page (restoring scroll/context) rather
 * than jumping to the home page.
 */
export function BackButton({ historyLength }: BackButtonProps) {
  const pathname = usePathname()
  const router = useRouter()
  // Hydration safety: the event detail page is force-static + ISR, so the baked
  // HTML was rendered with a fresh history (length 1). Reading
  // `window.history.length` in the initializer would render a button on the
  // client that the server never emitted (React #418) whenever the browser
  // history already has entries. Initialize to the stable server value and read
  // the real length only after mount.
  const [length, setLength] = useState(() => historyLength ?? 1)

  useEffect(() => {
    if (historyLength === undefined) setLength(window.history.length)
  }, [historyLength])

  if (!shouldShowBackButton({ pathname, historyLength: length })) return null

  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Back"
      className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 min-h-11 backdrop-blur-md border border-white/10 text-white/90 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
    >
      <ChevronLeft className="w-4 h-4" aria-hidden="true" />
      <span>Back</span>
    </button>
  )
}
