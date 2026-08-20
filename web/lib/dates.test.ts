import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  toDateString,
  getTodayString,
  nextFriday,
  formatEventTime,
  getHourInTimeZone,
} from './dates'

describe('toDateString', () => {
  it('converts a Date to YYYY-MM-DD format', () => {
    expect(toDateString(new Date(2025, 0, 15))).toBe('2025-01-15')
  })

  it('pads single-digit months', () => {
    expect(toDateString(new Date(2025, 2, 5))).toBe('2025-03-05')
  })

  it('pads single-digit days', () => {
    expect(toDateString(new Date(2025, 0, 5))).toBe('2025-01-05')
  })

  it('handles December 31', () => {
    expect(toDateString(new Date(2025, 11, 31))).toBe('2025-12-31')
  })
})

describe('getTodayString', () => {
  it('returns today in YYYY-MM-DD format', () => {
    const result = getTodayString()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('matches toDateString of today', () => {
    expect(getTodayString()).toBe(toDateString(new Date()))
  })
})

describe('nextFriday', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns a Date object', () => {
    const friday = nextFriday()
    expect(friday).toBeInstanceOf(Date)
  })

  it('returns a Friday when called on a non-Friday', () => {
    // Mock to a Monday (day 1)
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 0, 6, 12, 0, 0)) // Monday Jan 6, 2025
    const friday = nextFriday()
    expect(friday.getDay()).toBe(5)
  })

  it('returns today when called on Friday before 23:00', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 0, 3, 20, 0, 0)) // Friday Jan 3, 2025, 8 PM
    const friday = nextFriday()
    expect(friday.getDate()).toBe(3)
  })

  it('returns Saturday when called on Friday after 23:00', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 0, 3, 23, 30, 0)) // Friday Jan 3, 2025, 11:30 PM
    const friday = nextFriday()
    expect(friday.getDay()).toBe(6) // Saturday
  })
})

describe('formatEventTime', () => {
  it('formats an ISO string to time', () => {
    const result = formatEventTime('2025-06-15T18:30:00Z')
    expect(result).toMatch(/\d{1,2}:\d{2}/)
  })

  it('includes AM or PM', () => {
    const result = formatEventTime('2025-06-15T18:30:00Z')
    expect(result).toMatch(/AM|PM/)
  })

  it('can format in a specific timezone', () => {
    const result = formatEventTime('2025-06-15T18:30:00Z', 'America/New_York')
    expect(result).toMatch(/\d{1,2}:\d{2}/)
    expect(result).toMatch(/AM|PM/)
  })
})

describe('getHourInTimeZone', () => {
  it('returns a number between 0 and 23', () => {
    const hour = getHourInTimeZone('2025-06-15T18:30:00Z')
    expect(hour).toBeGreaterThanOrEqual(0)
    expect(hour).toBeLessThanOrEqual(23)
  })

  it('returns hour in local timezone by default', () => {
    const hour = getHourInTimeZone('2025-06-15T18:30:00Z')
    expect(typeof hour).toBe('number')
  })

  it('returns hour in a specific timezone', () => {
    // UTC 18:30 -> New York 14:30 EDT (UTC-4)
    const hour = getHourInTimeZone('2025-06-15T18:30:00Z', 'America/New_York')
    expect(hour).toBe(14)
  })
})
