import { getEventById } from '@/lib/actions/events'
import { getCategories } from '@/lib/actions/categories'
import { getAllOrganizers } from '@/lib/actions/organizers'
import { getFeaturedSections } from '@/lib/actions/settings'
import { getModerationLogsByTarget } from '@/lib/actions/dashboard'
import { EventDetailClient } from '@/components/events/EventDetailClient'
import { notFound } from 'next/navigation'
import { logError } from '@/lib/logger'

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let event: Awaited<ReturnType<typeof getEventById>>['event'] = null
  let categories: Awaited<ReturnType<typeof getEventById>>['categories'] = []
  let images: Awaited<ReturnType<typeof getEventById>>['images'] = []
  try {
    ;({ event, categories, images } = await getEventById(id))
  } catch (err) {
    logError('admin/events/[id]', err)
  }

  if (!event) notFound()

  let allCategories: Awaited<ReturnType<typeof getCategories>> = []
  let organizersList: Awaited<ReturnType<typeof getAllOrganizers>> = []
  let featuredSections: Awaited<ReturnType<typeof getFeaturedSections>> = []
  let moderationLogs: Awaited<ReturnType<typeof getModerationLogsByTarget>> = []
  try {
    ;[allCategories, organizersList, featuredSections, moderationLogs] = await Promise.all([
      getCategories(),
      getAllOrganizers(),
      getFeaturedSections(),
      getModerationLogsByTarget('event', id),
    ])
  } catch (err) {
    logError('admin/events/[id]:deps', err)
  }

  return (
    <EventDetailClient
      event={event}
      eventCategories={categories}
      allCategories={allCategories}
      organizers={organizersList ?? []}
      featuredSections={featuredSections}
      moderationLogs={moderationLogs}
      initialImages={images ?? []}
    />
  )
}
