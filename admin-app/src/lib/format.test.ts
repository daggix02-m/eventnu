import { describe, expect, it } from 'vitest'
import { formatDate, formatDateTime, toDateTimeLocal } from './format'

describe('formatDate', () => {
  it('formats a valid Date as "MMM d, yyyy"', () => {
    expect(formatDate(new Date(2026, 7, 11))).toBe('Aug 11, 2026')
  })

  it('accepts an ISO string', () => {
    expect(formatDate('2026-08-11T12:00:00.000Z')).toBe('Aug 11, 2026')
  })

  it('accepts a numeric timestamp', () => {
    expect(formatDate(new Date(2026, 7, 11).getTime())).toBe('Aug 11, 2026')
  })

  it('returns an em dash for null, undefined, and invalid values', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate(undefined)).toBe('—')
    expect(formatDate('not-a-date')).toBe('—')
  })
})

describe('formatDateTime', () => {
  it('formats a valid Date as "MMM d, yyyy · HH:mm"', () => {
    expect(formatDateTime(new Date(2026, 7, 11, 14, 5))).toBe('Aug 11, 2026 · 14:05')
  })

  it('returns an em dash for null and invalid values', () => {
    expect(formatDateTime(null)).toBe('—')
    expect(formatDateTime('not-a-date')).toBe('—')
  })
})

describe('toDateTimeLocal', () => {
  it('formats a timestamp for a datetime-local input', () => {
    expect(toDateTimeLocal(new Date(2026, 7, 11, 9, 30).getTime())).toBe('2026-08-11T09:30')
  })

  it('pads single-digit month/day/hour/minute', () => {
    expect(toDateTimeLocal(new Date(2026, 0, 5, 3, 7).getTime())).toBe('2026-01-05T03:07')
  })

  it('returns an empty string for falsy timestamps', () => {
    expect(toDateTimeLocal(null)).toBe('')
    expect(toDateTimeLocal(0)).toBe('')
  })
})
