'use client'

import { useEffect } from 'react'

const KEYBOARD_INSET_VAR = '--keyboard-inset'

/**
 * Tracks the software keyboard and writes the overlap height (in px) to the
 * `--keyboard-inset` CSS variable on `:root`.
 *
 * The virtual keyboard is not part of the layout viewport, so fixed chrome at
 * the bottom of the screen ends up hidden behind it. Because the layout
 * viewport is not resized (see the removal of `interactive-widget=resizes-content`),
 * the overlap equals `window.innerHeight` minus the visual viewport height.
 * On iOS Safari the visual viewport also pans up to keep the focused input
 * visible (`offsetTop`), which we subtract so the inset stays accurate.
 *
 * Consumers reference the variable in `calc()` (e.g. the bottom tab bar's
 * `bottom` offset). One tracker instance is mounted in the root layout.
 */
export function useKeyboardInset() {
  useEffect(() => {
    const root = document.documentElement
    const visualViewport = window.visualViewport
    if (!visualViewport) return

    const update = () => {
      const inset = Math.max(
        0,
        window.innerHeight - visualViewport.height - visualViewport.offsetTop,
      )
      root.style.setProperty(KEYBOARD_INSET_VAR, `${inset}px`)
    }

    update()
    visualViewport.addEventListener('resize', update)
    visualViewport.addEventListener('scroll', update)

    return () => {
      visualViewport.removeEventListener('resize', update)
      visualViewport.removeEventListener('scroll', update)
      root.style.removeProperty(KEYBOARD_INSET_VAR)
    }
  }, [])
}
