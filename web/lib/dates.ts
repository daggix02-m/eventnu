/**
 * Convert a Date to a local `YYYY-MM-DD` string.
 */
export function toDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Local `YYYY-MM-DD` string for today.
 */
export function getTodayString(): string {
  return toDateString(new Date())
}

/**
 * The next Friday (Addis nightlife start). If today is Friday before 23:00,
 * returns today; otherwise the upcoming Friday. Late Friday night rolls to Saturday.
 */
export function nextFriday(): Date {
  const today = new Date()
  const currentDay = today.getDay()
  let daysUntilFriday = (5 - currentDay + 7) % 7
  if (daysUntilFriday === 0 && today.getHours() >= 23) {
    daysUntilFriday = 1 // Saturday
  }
  const friday = new Date(today)
  friday.setDate(today.getDate() + daysUntilFriday)
  return friday
}

const timeFormatterCache = new Map<string, Intl.DateTimeFormat>()

function timeFormatter(timeZone?: string): Intl.DateTimeFormat {
  const key = timeZone ?? 'local'
  let fmt = timeFormatterCache.get(key)
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      ...(timeZone ? { timeZone } : {}),
    })
    timeFormatterCache.set(key, fmt)
  }
  return fmt
}

/**
 * Format an instant's clock time in the event's timezone (falls back to local).
 */
export function formatEventTime(isoString: string, timeZone?: string): string {
  return timeFormatter(timeZone).format(new Date(isoString))
}

/**
 * Hour-of-day (0-23) of an instant in the event's timezone (falls back to local).
 * Used for time-of-day schedule filters so bucketing is event-time, not viewer-time.
 */
export function getHourInTimeZone(isoString: string, timeZone?: string): number {
  const fmt = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: false,
    ...(timeZone ? { timeZone } : {}),
  })
  return Number(fmt.format(new Date(isoString)))
}
