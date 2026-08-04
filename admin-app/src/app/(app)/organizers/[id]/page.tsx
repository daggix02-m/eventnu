import { getOrganizerById } from '@/lib/actions/organizers'
import { OrganizerDetailClient } from '@/components/OrganizerDetailClient'

export default async function OrganizerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { organizer, eventCount } = await getOrganizerById(id)

  if (!organizer) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Organizer not found.</p>
      </div>
    )
  }

  return (
    <OrganizerDetailClient
      organizer={organizer}
      eventCount={eventCount}
    />
  )
}
