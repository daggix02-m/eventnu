import { getHostById } from '@/lib/actions/hosts'
import { HostDetailClient } from '@/components/HostDetailClient'

export default async function HostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let host: Awaited<ReturnType<typeof getHostById>>['host'] = null
  let eventCount = 0
  try {
    ;({ host, eventCount } = await getHostById(id))
  } catch (err) {
    console.error('Failed to load host:', err)
  }

  if (!host) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Host not found.</p>
      </div>
    )
  }

  return (
    <HostDetailClient
      host={host}
      eventCount={eventCount}
    />
  )
}
