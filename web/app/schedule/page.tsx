import type { Metadata } from 'next'
import { getPublishedEvents, getCategories } from '@/lib/api/events'
import { ScheduleClient } from '@/components/schedule/ScheduleClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Event Schedule & Calendar — Event Nu',
  description:
    'Explore upcoming events and live experiences in Addis Ababa by date. Add events directly to Google Calendar, Apple iCal, and Outlook in one tap.',
}

interface SchedulePageProps {
  searchParams: Promise<{
    date?: string
    category?: string
  }>
}

export default async function SchedulePage({ searchParams }: SchedulePageProps) {
  const params = await searchParams
  const [events, categories] = await Promise.all([
    getPublishedEvents(),
    getCategories(),
  ])

  return (
    <>
      <ScheduleClient
        events={events}
        categories={categories}
        initialDate={typeof params.date === 'string' ? params.date : undefined}
        initialCategory={typeof params.category === 'string' ? params.category : undefined}
      />
    </>
  )
}
