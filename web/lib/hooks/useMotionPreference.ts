import { useEffect, useState } from 'react'

/**
 * Motion intensity derived from the user's `prefers-reduced-motion` setting.
 *
 * - `'full'`  — the user has no reduced-motion preference; run the full
 *   animation language (marquee drift, carousel cadence, shader, reveals).
 * - `'subtle'` — the user prefers reduced motion (e.g. iOS Reduce Motion).
 *   Motion still runs, but slower and gentler: no continuous full-screen
 *   shader, no spatial parallax, slower auto-scroll. The contract from
 *   `prefers-reduced-motion` is "fewer and gentler animations", not
 *   "disable all motion" — meaningful feedback and state changes stay legible.
 */
export type MotionPreference = 'full' | 'subtle'

export function useMotionPreference(): MotionPreference {
  const [pref, setPref] = useState<MotionPreference>('full')

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPref(mq.matches ? 'subtle' : 'full')
    const onChange = (e: MediaQueryListEvent) => setPref(e.matches ? 'subtle' : 'full')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return pref
}

/**
 * Boolean convenience wrapper. `true` when the user prefers reduced motion.
 * Prefer `useMotionPreference` in components that need to differentiate
 * between full and subtle behaviour rather than a hard on/off switch.
 */
export function usePrefersReducedMotion(): boolean {
  return useMotionPreference() === 'subtle'
}
