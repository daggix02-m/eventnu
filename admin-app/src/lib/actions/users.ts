'use server'

import { fetchQuery, fetchMutation } from '@/lib/actions/authedFetch'
import { api } from '../../../../web/convex/_generated/api'
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
      filtered = filtered.filter((u: any) => u.suspended)
    } else if (params.status === 'active') {
      filtered = filtered.filter((u: any) => !u.suspended)
    }
    return { users: filtered, count: filtered.length }
  } catch (err) {
    console.error('Failed to load users:', err)
    throw err
  }
}

export async function suspendUser(userId: string) {
  await fetchMutation(api.profiles.suspend, { profileId: userId as any })
  revalidatePath('/users')
}

export async function unsuspendUser(userId: string) {
  await fetchMutation(api.profiles.unsuspend, { profileId: userId as any })
  revalidatePath('/users')
}

export async function banUser(userId: string) {
  await fetchMutation(api.profiles.suspend, { profileId: userId as any })
  revalidatePath('/users')
}

export async function updateProfile(userId: string, updates: {
  full_name?: string
  email?: string
  avatar_url?: string
}) {
  await fetchMutation(api.profiles.updateProfile, {
    profileId: userId as any,
    fullName: updates.full_name,
    email: updates.email,
    avatarUrl: updates.avatar_url,
  })
  revalidatePath('/settings')
}

export async function getUserById(userId: string) {
  try {
    const profile = await fetchQuery(api.profiles.getById, { profileId: userId as any })
    if (!profile) return { profile: null, role: null, stats: null }

    let userWithCounts: any = null
    try {
      userWithCounts = await fetchQuery(api.profiles.getUserWithCounts, { profileId: userId as any })
    } catch (err) {
      console.error('Failed to load user counts:', err)
    }

    return {
      profile: mapProfile(profile),
      role: (profile as any).role || null,
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
