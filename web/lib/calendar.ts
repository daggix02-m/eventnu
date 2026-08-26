import type { DiscoverEvent } from '@/types'

function escapeIcs(value: string): string {
  return value.replace(/[\n;,\\]/g, (m) => `\\${m}`)
}

function toIcsDate(iso: string): string {
  const date = new Date(iso)
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

/**
 * Generate an RFC-5545 .ics string for a single event
 */
export function buildIcs(event: DiscoverEvent): string {
  const dtStart = toIcsDate(event.start_date)
  const dtEnd = event.end_date
    ? toIcsDate(event.end_date)
    : toIcsDate(new Date(new Date(event.start_date).getTime() + 3 * 60 * 60 * 1000).toISOString()) // Default 3h duration

  const location = [event.venue_name, event.venue_address].filter(Boolean).join(', ')

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EventNu//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id || event.slug || Date.now()}@eventnu.com`,
    `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    location ? `LOCATION:${escapeIcs(location)}` : null,
    event.description ? `DESCRIPTION:${escapeIcs(event.description.slice(0, 500))}` : null,
    event.slug ? `URL:https://eventnu.com/events/${event.slug}` : null,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter((l): l is string => l !== null)

  return lines.join('\r\n')
}

/**
 * Generate a single .ics calendar containing multiple events (e.g. Weekend Itinerary)
 */
export function buildBatchIcs(
  events: DiscoverEvent[],
  calendarName = 'My EventNu Itinerary',
): string {
  const eventBlocks = events.map((event) => {
    const dtStart = toIcsDate(event.start_date)
    const dtEnd = event.end_date
      ? toIcsDate(event.end_date)
      : toIcsDate(new Date(new Date(event.start_date).getTime() + 3 * 60 * 60 * 1000).toISOString())
    const location = [event.venue_name, event.venue_address].filter(Boolean).join(', ')

    const lines = [
      'BEGIN:VEVENT',
      `UID:${event.id || event.slug || Math.random()}@eventnu.com`,
      `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${escapeIcs(event.title)}`,
      location ? `LOCATION:${escapeIcs(location)}` : null,
      event.description ? `DESCRIPTION:${escapeIcs(event.description.slice(0, 300))}` : null,
      event.slug ? `URL:https://eventnu.com/events/${event.slug}` : null,
      'STATUS:CONFIRMED',
      'END:VEVENT',
    ].filter((l): l is string => l !== null)

    return lines.join('\r\n')
  })

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EventNu//Itinerary//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcs(calendarName)}`,
    ...eventBlocks,
    'END:VCALENDAR',
  ].join('\r\n')
}

/**
 * Trigger client-side download of a .ics file
 */
export function downloadIcsFile(filename: string, icsContent: string): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Generate a direct Google Calendar web event creation URL
 */
export function buildGoogleCalendarUrl(event: DiscoverEvent): string {
  const dtStart = toIcsDate(event.start_date)
  const dtEnd = event.end_date
    ? toIcsDate(event.end_date)
    : toIcsDate(new Date(new Date(event.start_date).getTime() + 3 * 60 * 60 * 1000).toISOString())

  const location = [event.venue_name, event.venue_address].filter(Boolean).join(', ')
  const details = [
    event.description || '',
    event.slug ? `\n\nMore info on EventNu: https://eventnu.com/events/${event.slug}` : '',
  ]
    .join('')
    .trim()

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${dtStart}/${dtEnd}`,
    details: details,
    location: location,
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/**
 * Generate an Outlook.live.com web calendar event URL
 */
export function buildOutlookCalendarUrl(event: DiscoverEvent): string {
  const start = new Date(event.start_date).toISOString()
  const end = event.end_date
    ? new Date(event.end_date).toISOString()
    : new Date(new Date(event.start_date).getTime() + 3 * 60 * 60 * 1000).toISOString()
  const location = [event.venue_name, event.venue_address].filter(Boolean).join(', ')

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: start,
    enddt: end,
    body: event.description || '',
    location: location,
  })

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
}

/**
 * Generate Yahoo Calendar web link
 */
export function buildYahooCalendarUrl(event: DiscoverEvent): string {
  const dtStart = toIcsDate(event.start_date)
  const dtEnd = event.end_date
    ? toIcsDate(event.end_date)
    : toIcsDate(new Date(new Date(event.start_date).getTime() + 3 * 60 * 60 * 1000).toISOString())
  const location = [event.venue_name, event.venue_address].filter(Boolean).join(', ')

  const params = new URLSearchParams({
    v: '60',
    title: event.title,
    st: dtStart,
    et: dtEnd,
    desc: event.description || '',
    in_loc: location,
  })

  return `https://calendar.yahoo.com/?${params.toString()}`
}
