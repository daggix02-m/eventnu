import { getEventById } from '@/lib/actions/events'
import { getCategories } from '@/lib/actions/categories'
import { getHosts } from '@/lib/actions/hosts'
import { getOrganizers } from '@/lib/actions/organizers'
import { getModerationLogsByTarget } from '@/lib/actions/dashboard'
import { EventDetailClient } from '@/components/EventDetailClient'
import { notFound } from 'next/navigation'

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { event, categories, images } = await getEventById(id)
  if (!event) notFound()

  const [allCategories, { hosts }, { organizers }, moderationLogs] = await Promise.all([
    getCategories(),
    getHosts({ status: 'active', perPage: 200 }),
    getOrganizers({ perPage: 200 }),
    getModerationLogsByTarget('event', id),
  ])

  return (
    <EventDetailClient
      event={event}
      eventCategories={categories}
      allCategories={allCategories}
      hosts={hosts ?? []}
      organizers={organizers ?? []}
      moderationLogs={moderationLogs}
      initialImages={images ?? []}
    />
  )
}
