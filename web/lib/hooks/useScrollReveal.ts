'use client'

import { useEffect, useRef } from 'react'

interface UseScrollRevealOptions {
  /** Y offset to animate from (px). Default 16. */
  y?: number
  /** Transition duration (seconds). Default 0.5. */
  duration?: number
  /** Delay before animation starts (seconds). Default 0. */
  delay?: number
  /**
   * ScrollTrigger-style start position (e.g. 'top 88%').
   * Approximated via IntersectionObserver rootMargin.
   * Kept for API compat — no caller currently passes this.
   */
  start?: string
}

/**
 * Scroll-driven reveal hook using IntersectionObserver + CSS transitions.
 * Drops the GSAP/ScrollTrigger dependency from the homepage bundle.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>({
  y = 16,
  duration = 0.5,
  delay = 0,
}: UseScrollRevealOptions = {}) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let observer: IntersectionObserver | null = null
    let fallbackTimer = 0

    const reveal = () => {
      el.style.opacity = '1'
      el.style.transform = 'translateY(0)'
      observer?.disconnect()
      window.clearTimeout(fallbackTimer)
    }

    el.style.opacity = '0'
    el.style.transform = `translateY(${y}px)`
    el.style.transition = `opacity ${duration}s ease, transform ${duration}s ease`
    if (delay > 0) el.style.transitionDelay = `${delay}s`

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            reveal()
            return
          }
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    )
    observer.observe(el)

    // Fallback: if the observer entry never arrives (throttled observers on
    // iOS during initial load, or an element already in view when attached),
    // force the reveal so content can never stay invisible ("blocked").
    fallbackTimer = window.setTimeout(reveal, 1500)

    return () => {
      observer?.disconnect()
      window.clearTimeout(fallbackTimer)
    }
  }, [y, duration, delay])

  return ref
}
