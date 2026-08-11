import { getEvents } from '@/lib/actions/events'
import { EventsClient } from '@/components/EventsClient'

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
  const page = typeof params.page === 'string' ? parseInt(params.page) : 1

  let events: Awaited<ReturnType<typeof getEvents>>['events'] = []
  let count = 0
  try {
    ;({ events, count } = await getEvents({
      status,
      source,
      featured,
      frequency,
      search,
      page,
      perPage: 20,
    }))
  } catch (err) {
    console.error('Failed to load events:', err)
  }

  return (
    <EventsClient
      initialEvents={events}
      initialCount={count}
      initialFilters={{ status, source, featured, frequency, search, page }}
    />
  )
}
