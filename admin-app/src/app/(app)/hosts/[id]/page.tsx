import { getHostById } from '@/lib/actions/hosts'
import { HostDetailClient } from '@/components/HostDetailClient'

export default async function HostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { host, eventCount } = await getHostById(id)

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
