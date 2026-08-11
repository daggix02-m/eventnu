'use server'

import { fetchQuery, fetchMutation } from '@/lib/actions/authedFetch'
import type { Id } from '@eventnu/convex/_generated/dataModel'
import { api } from '@eventnu/convex/_generated/api'
import { revalidatePath } from 'next/cache'
import { mapAdminUser, mapProfile } from '../mappers'

export async function getUsers(params: {
  status?: string
  search?: string
  page?: number
  perPage?: number
}) {
  try {
    const status =
      params.status === 'active' || params.status === 'suspended' || params.status === 'no_profile'
        ? params.status
        : 'all'
    const users = await fetchQuery(api.profiles.listUsers, {
      search: params.search,
      status,
    })
    return { users: users.map(mapAdminUser), count: users.length }
  } catch (err) {
    console.error('Failed to load users:', err)
    throw err
  }
}

export async function suspendUser(userId: string) {
  await fetchMutation(api.profiles.setUserSuspended, {
    userId: userId as Id<'users'>,
    suspended: true,
  })
  revalidatePath('/users')
}

export async function unsuspendUser(userId: string) {
  await fetchMutation(api.profiles.setUserSuspended, {
    userId: userId as Id<'users'>,
    suspended: false,
  })
  revalidatePath('/users')
}

export async function banUser(userId: string) {
  await fetchMutation(api.profiles.setUserSuspended, {
    userId: userId as Id<'users'>,
    suspended: true,
  })
  revalidatePath('/users')
}

export async function promoteUser(userId: string) {
  await fetchMutation(api.profiles.setRole, {
    userId: userId as Id<'users'>,
    role: 'admin',
  })
  revalidatePath('/users')
}

export async function demoteUser(userId: string) {
  await fetchMutation(api.profiles.setRole, {
    userId: userId as Id<'users'>,
    role: 'user',
  })
  revalidatePath('/users')
}

export async function updateProfile(
  userId: string,
  updates: {
    full_name?: string
    email?: string
    avatar_url?: string
  },
) {
  await fetchMutation(api.profiles.updateProfile, {
    profileId: userId as Id<'profiles'>,
    fullName: updates.full_name,
    email: updates.email,
    avatarUrl: updates.avatar_url,
  })
  revalidatePath('/settings')
}

const EMPTY_STATS = { eventCount: 0, likeCount: 0, followCount: 0, commentCount: 0 }

async function buildDetail(
  row: NonNullable<Awaited<ReturnType<typeof fetchQuery<typeof api.profiles.getUserByAuthId>>>>,
) {
  let stats = EMPTY_STATS
  if (row.profileId) {
    try {
      const withCounts = await fetchQuery(api.profiles.getUserWithCounts, {
        profileId: row.profileId as Id<'profiles'>,
      })
      stats = {
        eventCount: withCounts?.eventCount ?? 0,
        likeCount: withCounts?.likeCount ?? 0,
        followCount: withCounts?.followCount ?? 0,
        commentCount: withCounts?.commentCount ?? 0,
      }
    } catch (err) {
      console.error('Failed to load user counts:', err)
    }
  }
  return { profile: mapAdminUser(row), role: row.role, stats }
}

export async function getUserById(userId: string) {
  try {
    let row: Awaited<ReturnType<typeof fetchQuery<typeof api.profiles.getUserByAuthId>>> = null
    try {
      row = await fetchQuery(api.profiles.getUserByAuthId, {
        userId: userId as Id<'users'>,
      })
    } catch {
      row = null
    }
    if (row) return await buildDetail(row)

    const profile = await fetchQuery(api.profiles.getById, {
      profileId: userId as Id<'profiles'>,
    })
    if (!profile) return { profile: null, role: null, stats: null }

    if (profile.authUserId) {
      const row = await fetchQuery(api.profiles.getUserByAuthId, {
        userId: profile.authUserId,
      })
      if (row) return await buildDetail(row)
    }

    return {
      profile: {
        ...mapProfile(profile),
        authUserId: profile.authUserId ?? '',
        profileId: profile._id,
        role: profile.role,
        has_profile: true,
      },
      role: profile.role,
      stats: EMPTY_STATS,
    }
  } catch (err) {
    console.error('Failed to load user details:', err)
    throw err
  }
}
