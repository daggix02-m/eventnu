import 'server-only'
import { fetchQuery } from 'convex/nextjs'
import { api } from '@eventnu/convex/_generated/api'

export type PublicOrganizerProfile = NonNullable<
  Awaited<ReturnType<typeof fetchQuery<typeof api.organizers.getByHandle>>>
>

export async function getOrganizerByHandle(handle: string): Promise<PublicOrganizerProfile | null> {
  try {
    return await fetchQuery(api.organizers.getByHandle, { handle })
  } catch (err) {
    console.error('Failed to fetch organizer:', err)
    return null
  }
}
