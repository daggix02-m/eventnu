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

export function formatEventDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
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
