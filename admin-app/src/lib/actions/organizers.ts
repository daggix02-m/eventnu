'use server'

import { fetchQuery, fetchMutation } from '@/lib/actions/authedFetch'
import type { Doc, Id } from '@eventnu/convex/_generated/dataModel'
import { api } from '@eventnu/convex/_generated/api'
import { revalidatePath } from 'next/cache'
import { mapOrganizer } from '../mappers'

export async function getOrganizers(params: {
  status?: string
  verified?: boolean
  search?: string
  page?: number
  perPage?: number
}) {
  try {
    const organizers = await fetchQuery(api.organizers.list, {
      search: params.search,
    })
    const profiles = await fetchQuery(api.profiles.list, {})
    const profileById = new Map(profiles.map((p) => [p._id, p]))
    let filtered = organizers.map((o) => mapOrganizer(o, profileById.get(o.profileId)))
    if (params.verified !== undefined) {
      filtered = filtered.filter((o) => o.verified === params.verified)
    }
    return { organizers: filtered, count: filtered.length }
  } catch (err) {
    console.error('Failed to load organizers:', err)
    throw err
  }
}

export async function verifyOrganizer(profileId: string) {
  await fetchMutation(api.organizers.verify, { profileId: profileId as Id<'profiles'> })
  revalidatePath('/organizers')
}

export async function unverifyOrganizer(profileId: string) {
  await fetchMutation(api.organizers.unverify, { profileId: profileId as Id<'profiles'> })
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
  try {
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
  } catch (err) {
    console.error('Failed to load organizer details:', err)
    throw err
  }
}
