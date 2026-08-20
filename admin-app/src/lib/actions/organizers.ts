'use server'

import { fetchQuery, fetchMutation } from '@/lib/actions/authedFetch'
import type { Doc, Id } from '@eventnu/convex/_generated/dataModel'
import { api } from '@eventnu/convex/_generated/api'
import { revalidatePath } from 'next/cache'
import { mapOrganizer } from '../mappers'
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination'

export async function getOrganizers(params: {
  verified?: boolean
  search?: string
  cursor?: string | null
}) {
  const result = await fetchQuery(api.organizers.list, {
    paginationOpts: { numItems: DEFAULT_PAGE_SIZE, cursor: params.cursor ?? null },
    search: params.search,
    verified: params.verified,
  })
  const rows = result.page ?? []
  const profileIds = [
    ...new Set(
      rows
        .map((o: Doc<'organizerProfiles'>) => o.profileId)
        .filter((id): id is Id<'profiles'> => id !== undefined),
    ),
  ]
  const profiles = await Promise.all(
    profileIds.map((profileId) =>
      fetchQuery(api.profiles.getById, { profileId: profileId as Id<'profiles'> }),
    ),
  )
  const profileById = new Map(
    profiles.filter((p): p is Doc<'profiles'> => p !== null).map((p) => [p._id, p]),
  )
  const items = rows.map((o: Doc<'organizerProfiles'>) =>
    mapOrganizer(o, o.profileId ? profileById.get(o.profileId) : null),
  )
  return {
    items,
    nextCursor: (result.continueCursor ?? null) as string | null,
    isDone: result.isDone,
  }
}

export async function getAllOrganizers() {
  // Bounded picklist for the event-form select: a single recent page instead
  // of paging through up to 1,000 rows on every event create/edit load.
  const page = await getOrganizers({ cursor: null })
  return page.items
}

export async function verifyOrganizer(profileId: string) {
  await fetchMutation(api.organizers.verify, { profileId: profileId as Id<'profiles'> })
  revalidatePath('/organizers')
}

export async function unverifyOrganizer(profileId: string) {
  await fetchMutation(api.organizers.unverify, { profileId: profileId as Id<'profiles'> })
  revalidatePath('/organizers')
}

export async function approveOrganizerApplication(profileId: string) {
  await fetchMutation(api.organizers.approveApplication, { profileId: profileId as Id<'profiles'> })
  revalidatePath('/organizers')
}

export async function rejectOrganizerApplication(profileId: string, reason?: string) {
  await fetchMutation(api.organizers.rejectApplication, {
    profileId: profileId as Id<'profiles'>,
    reason,
  })
  revalidatePath('/organizers')
}

export async function setOrganizerManagementMode(
  profileId: string,
  managementMode: 'admin_managed' | 'organizer_managed',
) {
  await fetchMutation(api.organizers.setManagementMode, {
    profileId: profileId as Id<'profiles'>,
    managementMode,
  })
  revalidatePath('/organizers')
}

export async function suspendOrganizer(profileId: string) {
  await fetchMutation(api.profiles.suspend, { profileId: profileId as Id<'profiles'> })
  revalidatePath('/organizers')
}

export async function unsuspendOrganizer(profileId: string) {
  await fetchMutation(api.profiles.unsuspend, { profileId: profileId as Id<'profiles'> })
  revalidatePath('/organizers')
}

export async function getOrganizerById(profileId: string) {
  const organizer = await fetchQuery(api.organizers.getById, {
    profileId: profileId as Id<'profiles'>,
  })
  if (!organizer) return { organizer: null, eventCount: 0 }

  let profile: Doc<'profiles'> | null = null
  let eventCount = 0
  try {
    const withCounts = await fetchQuery(api.profiles.getUserWithCounts, {
      profileId: profileId as Id<'profiles'>,
    })
    if (withCounts) {
      profile = withCounts
      eventCount = withCounts.eventCount ?? 0
    }
  } catch (err) {
    console.error('Failed to load organizer counts:', err)
  }

  return { organizer: mapOrganizer(organizer, profile), eventCount }
}
