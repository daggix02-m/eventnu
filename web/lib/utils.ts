import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validate that a URL uses only safe schemes (http/https) or is a relative path.
 * Prevents javascript:, data:, ftp: XSS via href attributes.
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    // Not an absolute URL — allow relative paths starting with /, but reject
    // protocol-relative URLs (//host) which resolve to the attacker's origin.
    return url.startsWith('/') && !url.startsWith('//')
  }
}

export function formatPrice(priceDisplay?: string | null, isFree = false): string {
  if (isFree) return 'Free'
  if (!priceDisplay || priceDisplay.trim() === '') return 'See details'
  return priceDisplay
}

export function formatEventDate(dateString: string, timeZone?: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...(timeZone ? { timeZone } : {}),
  })
}

export function formatEventDateShort(dateString: string): string {
  const date = new Date(dateString)
  return date
    .toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    .toUpperCase()
}

export function isEventPast(startDate: string): boolean {
  return new Date(startDate) < new Date()
}

/**
 * Whether it is safe to request `behavior: 'smooth'` programmatic scrolling.
 *
 * WebKit (iOS Safari) is unreliable at smooth `scrollIntoView`/`scrollBy`
 * into nested scroll containers — especially right after a state update or
 * when combined with `scroll-snap-type` — and it frequently drops the scroll
 * entirely, which reads as a "blocked" page. Coarse-pointer devices (touch)
 * should fall back to `'auto'` so the scroll always happens.
 *
 * Callers should use the returned boolean:
 *   el.scrollIntoView({ behavior: canSmoothScroll() ? 'smooth' : 'auto', ... })
 */
export function canSmoothScroll(): boolean {
  if (typeof window === 'undefined') return false
  if (!('scrollBehavior' in document.documentElement.style)) return false
  if (window.matchMedia('(pointer: coarse)').matches) return false
  return true
}
