import type { Metadata } from 'next'
import { AboutContent } from './AboutContent'
import { getCategories, getPublishedEventCount } from '@/lib/api/events'

export const revalidate = 300
export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'About | Event Nu',
  description: 'Learn more about Event Nu, your discovery platform for events in Addis Ababa.',
}

export default async function AboutPage() {
  const [eventCount, categories] = await Promise.all([getPublishedEventCount(), getCategories()])

  return <AboutContent eventCount={eventCount} categoryCount={categories.length} />
}
