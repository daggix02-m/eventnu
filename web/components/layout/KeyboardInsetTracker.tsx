'use client'

import { useKeyboardInset } from '@/lib/hooks/useKeyboardInset'

/**
 * Mounted once from the root layout. Tracks the software keyboard and exposes
 * the overlap as the `--keyboard-inset` CSS variable so bottom-fixed chrome
 * (tab bar, floating dock, install prompt) stays above the keyboard.
 */
export function KeyboardInsetTracker() {
  useKeyboardInset()
  return null
}
