'use client'

import { useState } from 'react'
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
  // Read history length after mount to avoid an SSR/hydration mismatch; on a
  // cold start the browser history is fresh (length 1) so nothing renders.
  const [length] = useState(
    () => historyLength ?? (typeof window === 'undefined' ? 1 : window.history.length),
  )

  if (!shouldShowBackButton({ pathname, historyLength: length })) return null

  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Back"
      className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1.5 backdrop-blur-md border border-white/10 text-white/90 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
    >
      <ChevronLeft className="w-4 h-4" aria-hidden="true" />
      <span>Back</span>
    </button>
  )
}
