import { getOrganizerById } from '@/lib/actions/organizers'
import { OrganizerDetailClient } from '@/components/organizers/OrganizerDetailClient'
import { logError } from '@/lib/logger'

export default async function OrganizerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let organizer: Awaited<ReturnType<typeof getOrganizerById>>['organizer'] = null
  let eventCount = 0
  try {
    ;({ organizer, eventCount } = await getOrganizerById(id))
  } catch (err) {
    logError('admin/organizers/[id]', err)
  }

  if (!organizer) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Organizer not found.</p>
      </div>
    )
  }

  return <OrganizerDetailClient organizer={organizer} eventCount={eventCount} />
}
