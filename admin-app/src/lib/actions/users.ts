'use server'

import { fetchQuery, fetchMutation } from '@/lib/actions/authedFetch'
import type { Doc, Id } from '@eventnu/convex/_generated/dataModel'
import { api } from '@eventnu/convex/_generated/api'
import { revalidatePath } from 'next/cache'
import { mapProfile } from '../mappers'

export async function getUsers(params: {
  status?: string
  search?: string
  page?: number
  perPage?: number
}) {
  try {
    const users = await fetchQuery(api.profiles.list, { search: params.search })
    let filtered = users.map(mapProfile)
    if (params.status === 'suspended') {
      filtered = filtered.filter((u) => u.suspended)
    } else if (params.status === 'active') {
      filtered = filtered.filter((u) => !u.suspended)
    }
    return { users: filtered, count: filtered.length }
  } catch (err) {
    console.error('Failed to load users:', err)
    throw err
  }
}

export async function suspendUser(userId: string) {
  await fetchMutation(api.profiles.suspend, { profileId: userId as Id<'profiles'> })
  revalidatePath('/users')
}

export async function unsuspendUser(userId: string) {
  await fetchMutation(api.profiles.unsuspend, { profileId: userId as Id<'profiles'> })
  revalidatePath('/users')
}

export async function banUser(userId: string) {
  await fetchMutation(api.profiles.suspend, { profileId: userId as Id<'profiles'> })
  revalidatePath('/users')
}

export async function updateProfile(userId: string, updates: {
  full_name?: string
  email?: string
  avatar_url?: string
}) {
  await fetchMutation(api.profiles.updateProfile, {
    profileId: userId as Id<'profiles'>,
    fullName: updates.full_name,
    email: updates.email,
    avatarUrl: updates.avatar_url,
  })
  revalidatePath('/settings')
}

export async function getUserById(userId: string) {
  try {
    const profile = await fetchQuery(api.profiles.getById, { profileId: userId as Id<'profiles'> })
    if (!profile) return { profile: null, role: null, stats: null }

    let userWithCounts:
      | (Doc<'profiles'> & {
          eventCount: number
          likeCount: number
          followCount: number
          commentCount: number
        })
      | null = null
    try {
      userWithCounts = await fetchQuery(api.profiles.getUserWithCounts, { profileId: userId as Id<'profiles'> })
    } catch (err) {
      console.error('Failed to load user counts:', err)
    }

    return {
      profile: mapProfile(profile),
      role: profile.role || null,
      stats: {
        eventCount: userWithCounts?.eventCount ?? 0,
        likeCount: userWithCounts?.likeCount ?? 0,
        followCount: userWithCounts?.followCount ?? 0,
        commentCount: userWithCounts?.commentCount ?? 0,
      },
    }
  } catch (err) {
    console.error('Failed to load user details:', err)
    throw err
  }
}
