import { getEvents } from '@/lib/actions/events'
import { EventsClient } from '@/components/events/EventsClient'

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const status = typeof params.status === 'string' ? params.status : 'all'
  const source = typeof params.source === 'string' ? params.source : 'all'
  const featured =
    params.featured === 'true' ? true : params.featured === 'false' ? false : undefined
  const frequency = typeof params.frequency === 'string' ? params.frequency : 'all'
  const search = typeof params.search === 'string' ? params.search : ''

  let initial: Awaited<ReturnType<typeof getEvents>> = { items: [], nextCursor: null, isDone: true }
  try {
    initial = await getEvents({ status, source, featured, frequency, search })
  } catch (err) {
    console.error('Failed to load events:', err)
  }

  return (
    <EventsClient
      initial={initial}
      initialFilters={{ status, source, featured, frequency, search }}
    />
  )
}
