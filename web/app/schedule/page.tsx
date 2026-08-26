import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getPublishedEvents, getCategories } from '@/lib/api/events'
import { ScheduleClient } from '@/components/schedule/ScheduleClient'
import { toDiscoverEvent } from '@/lib/discover'

export const revalidate = 300
export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Event Schedule & Calendar — Event Nu',
  description:
    'Explore upcoming events and live experiences in Addis Ababa by date. Add events directly to Google Calendar, Apple iCal, and Outlook in one tap.',
}

async function ScheduleSection() {
  const [events, categories] = await Promise.all([getPublishedEvents(), getCategories()])
  return <ScheduleClient events={events.map(toDiscoverEvent)} categories={categories} />
}

export default function SchedulePage() {
  return (
    <Suspense fallback={null}>
      <ScheduleSection />
    </Suspense>
  )
}
