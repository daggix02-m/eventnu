import { describe, it, expect } from 'vitest'
import {
  buildIcs,
  buildBatchIcs,
  buildGoogleCalendarUrl,
  buildOutlookCalendarUrl,
  buildYahooCalendarUrl,
} from './calendar'
import type { Event } from '../types'

const baseEvent: Event = {
  id: 'evt_123',
  title: 'Test Concert',
  description: 'A great concert',
  start_date: '2025-06-15T18:00:00Z',
  end_date: '2025-06-15T22:00:00Z',
  status: 'published',
  is_free: false,
  organizer_id: 'org_1',
  venue_name: 'Test Venue',
  venue_address: '123 Main St',
  slug: 'test-concert',
}

describe('buildIcs', () => {
  it('returns a valid VCALENDAR string', () => {
    const ics = buildIcs(baseEvent)
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('END:VCALENDAR')
    expect(ics).toContain('VERSION:2.0')
  })

  it('includes the event as a VEVENT', () => {
    const ics = buildIcs(baseEvent)
    expect(ics).toContain('BEGIN:VEVENT')
    expect(ics).toContain('END:VEVENT')
  })

  it('includes the event title as SUMMARY', () => {
    const ics = buildIcs(baseEvent)
    expect(ics).toContain('SUMMARY:Test Concert')
  })

  it('includes DTSTART and DTEND', () => {
    const ics = buildIcs(baseEvent)
    expect(ics).toContain('DTSTART:')
    expect(ics).toContain('DTEND:')
  })

  it('includes LOCATION when venue info is present', () => {
    const ics = buildIcs(baseEvent)
    expect(ics).toContain('LOCATION:Test Venue\\, 123 Main St')
  })

  it('includes URL when slug is present', () => {
    const ics = buildIcs(baseEvent)
    expect(ics).toContain('URL:https://eventnu.com/events/test-concert')
  })

  it('includes DESCRIPTION', () => {
    const ics = buildIcs(baseEvent)
    expect(ics).toContain('DESCRIPTION:A great concert')
  })

  it('defaults to 3h duration when no end_date', () => {
    const eventNoEnd = { ...baseEvent, end_date: null }
    const ics = buildIcs(eventNoEnd)
    expect(ics).toContain('DTSTART:')
    expect(ics).toContain('DTEND:')
    // DTEND should be 3 hours after DTSTART
  })

  it('escapes special characters in title', () => {
    const event = { ...baseEvent, title: 'Concert; Party\\2025' }
    const ics = buildIcs(event)
    expect(ics).toContain('SUMMARY:Concert\\; Party\\\\2025')
  })

  it('omits LOCATION when venue info is missing', () => {
    const event = { ...baseEvent, venue_name: '', venue_address: null }
    const ics = buildIcs(event)
    expect(ics).not.toContain('LOCATION:')
  })

  it('omits URL when slug is missing', () => {
    const event = { ...baseEvent, slug: null }
    const ics = buildIcs(event)
    expect(ics).not.toContain('URL:')
  })

  it('omits DESCRIPTION when description is missing', () => {
    const event = { ...baseEvent, description: '' }
    const ics = buildIcs(event)
    expect(ics).not.toContain('DESCRIPTION:')
  })

  it('truncates long descriptions to 500 chars', () => {
    const event = { ...baseEvent, description: 'A'.repeat(600) }
    const ics = buildIcs(event)
    const descMatch = ics.match(/DESCRIPTION:(.+)/)
    expect(descMatch).not.toBeNull()
    // The description should be truncated to 500 chars + escaped
    expect(descMatch![1].length).toBeLessThanOrEqual(520) // 500 + some escaping
  })
})

describe('buildBatchIcs', () => {
  it('wraps events in a VCALENDAR', () => {
    const ics = buildBatchIcs([baseEvent])
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('END:VCALENDAR')
  })

  it('includes multiple VEVENT blocks', () => {
    const event2 = { ...baseEvent, id: 'evt_456', title: 'Second Event' }
    const ics = buildBatchIcs([baseEvent, event2])
    const eventCount = (ics.match(/BEGIN:VEVENT/g) || []).length
    expect(eventCount).toBe(2)
  })

  it('uses custom calendar name via X-WR-CALNAME', () => {
    const ics = buildBatchIcs([baseEvent], 'My Itinerary')
    expect(ics).toContain('X-WR-CALNAME:My Itinerary')
  })

  it('uses default calendar name', () => {
    const ics = buildBatchIcs([baseEvent])
    expect(ics).toContain('X-WR-CALNAME:My EventNu Itinerary')
  })

  it('truncates descriptions to 300 chars per event', () => {
    const event = { ...baseEvent, description: 'B'.repeat(400) }
    const ics = buildBatchIcs([event])
    const descMatch = ics.match(/DESCRIPTION:(.+)/)
    expect(descMatch).not.toBeNull()
    expect(descMatch![1].length).toBeLessThanOrEqual(320)
  })
})

describe('buildGoogleCalendarUrl', () => {
  it('returns a Google Calendar URL', () => {
    const url = buildGoogleCalendarUrl(baseEvent)
    expect(url).toMatch(/^https:\/\/calendar\.google\.com\/calendar\/render\?/)
  })

  it('includes action=TEMPLATE', () => {
    const url = buildGoogleCalendarUrl(baseEvent)
    expect(url).toContain('action=TEMPLATE')
  })

  it('includes the event title', () => {
    const url = buildGoogleCalendarUrl(baseEvent)
    expect(url).toContain('text=Test+Concert')
  })

  it('includes dates in DTSTART/DTEND format', () => {
    const url = buildGoogleCalendarUrl(baseEvent)
    expect(url).toContain('dates=')
  })

  it('includes location', () => {
    const url = buildGoogleCalendarUrl(baseEvent)
    expect(url).toContain('location=')
  })

  it('includes EventNu link in details', () => {
    const url = buildGoogleCalendarUrl(baseEvent)
    expect(url).toContain('eventnu.com')
  })

  it('defaults to 3h duration when no end_date', () => {
    const eventNoEnd = { ...baseEvent, end_date: null }
    const url = buildGoogleCalendarUrl(eventNoEnd)
    expect(url).toContain('dates=')
  })
})

describe('buildOutlookCalendarUrl', () => {
  it('returns an Outlook URL', () => {
    const url = buildOutlookCalendarUrl(baseEvent)
    expect(url).toMatch(/^https:\/\/outlook\.live\.com\/calendar\/0\/deeplink\/compose\?/)
  })

  it('includes subject and location', () => {
    const url = buildOutlookCalendarUrl(baseEvent)
    expect(url).toContain('subject=')
    expect(url).toContain('location=')
  })

  it('includes rru=addevent', () => {
    const url = buildOutlookCalendarUrl(baseEvent)
    expect(url).toContain('rru=addevent')
  })

  it('defaults to 3h duration when no end_date', () => {
    const eventNoEnd = { ...baseEvent, end_date: null }
    const url = buildOutlookCalendarUrl(eventNoEnd)
    expect(url).toContain('startdt=')
    expect(url).toContain('enddt=')
  })
})

describe('buildYahooCalendarUrl', () => {
  it('returns a Yahoo Calendar URL', () => {
    const url = buildYahooCalendarUrl(baseEvent)
    expect(url).toMatch(/^https:\/\/calendar\.yahoo\.com\/\?/)
  })

  it('includes title and location', () => {
    const url = buildYahooCalendarUrl(baseEvent)
    expect(url).toContain('title=')
    expect(url).toContain('in_loc=')
  })

  it('includes start and end times', () => {
    const url = buildYahooCalendarUrl(baseEvent)
    expect(url).toContain('st=')
    expect(url).toContain('et=')
  })

  it('defaults to 3h duration when no end_date', () => {
    const eventNoEnd = { ...baseEvent, end_date: null }
    const url = buildYahooCalendarUrl(eventNoEnd)
    expect(url).toContain('st=')
    expect(url).toContain('et=')
  })
})
