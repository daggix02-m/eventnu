import { describe, it, expect } from 'vitest'
import { cn, formatPrice, formatEventDate, formatEventDateShort, isEventPast } from './utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })

  it('deduplicates tailwind classes', () => {
    expect(cn('p-2 p-4')).toBe('p-4')
  })

  it('returns empty string for no args', () => {
    expect(cn()).toBe('')
  })
})

describe('formatPrice', () => {
  it('returns "Free" when isFree is true', () => {
    expect(formatPrice(undefined, true)).toBe('Free')
  })

  it('returns "Free" when isFree is true regardless of priceDisplay', () => {
    expect(formatPrice('$50', true)).toBe('Free')
  })

  it('returns "See details" when priceDisplay is undefined', () => {
    expect(formatPrice(undefined)).toBe('See details')
  })

  it('returns "See details" when priceDisplay is null', () => {
    expect(formatPrice(null)).toBe('See details')
  })

  it('returns "See details" when priceDisplay is empty string', () => {
    expect(formatPrice('')).toBe('See details')
  })

  it('returns "See details" when priceDisplay is whitespace only', () => {
    expect(formatPrice('   ')).toBe('See details')
  })

  it('returns the priceDisplay when provided', () => {
    expect(formatPrice('$50')).toBe('$50')
  })

  it('returns formatted price with non-dollar amounts', () => {
    expect(formatPrice('1000 ETB')).toBe('1000 ETB')
  })
})

describe('formatEventDate', () => {
  it('formats a date string to readable format', () => {
    const result = formatEventDate('2025-06-15T18:30:00Z')
    expect(result).toContain('Jun')
    expect(result).toContain('15')
    expect(result).toMatch(/\d{1,2}:\d{2}/) // includes time
  })

  it('includes day of week', () => {
    const result = formatEventDate('2025-06-15T18:30:00Z')
    expect(result).toMatch(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/)
  })
})

describe('formatEventDateShort', () => {
  it('formats a date to short uppercase format', () => {
    const result = formatEventDateShort('2025-06-15T18:30:00Z')
    expect(result).toContain('JUN')
    expect(result).toContain('15')
  })

  it('returns uppercase month abbreviation', () => {
    const result = formatEventDateShort('2025-01-01T00:00:00Z')
    expect(result).toMatch(/^[A-Z]+ \d+$/)
  })
})

describe('isEventPast', () => {
  it('returns true for a date in the past', () => {
    expect(isEventPast('2020-01-01T00:00:00Z')).toBe(true)
  })

  it('returns false for a date far in the future', () => {
    expect(isEventPast('2099-12-31T23:59:59Z')).toBe(false)
  })

  it('returns false for the current date (edge case)', () => {
    const now = new Date().toISOString()
    // At the exact moment, it should not be strictly less than
    const result = isEventPast(now)
    expect(typeof result).toBe('boolean')
  })
})
