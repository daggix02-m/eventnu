'use server'

import { fetchQuery, fetchMutation } from '@/lib/actions/authedFetch'
import type { Id } from '@eventnu/convex/_generated/dataModel'
import { api } from '@eventnu/convex/_generated/api'
import { revalidatePath } from 'next/cache'
import { mapNotification } from '../mappers'

export async function getNotifications(params: {
  page?: number
  perPage?: number
  search?: string
  type?: string
  read?: boolean
}) {
  try {
    const all = await fetchQuery(api.notifications.listAll, {
      search: params.search,
      type: params.type,
      read: params.read,
    })
    const from = ((params.page ?? 1) - 1) * (params.perPage ?? 20)
    const to = from + (params.perPage ?? 20)
    const notifications = all.slice(from, to).map((n) => mapNotification(n, n.profile))
    return { notifications, count: all.length }
  } catch (err) {
    console.error('Failed to load notifications:', err)
    throw err
  }
}

export async function sendNotification(params: {
  userId?: string | null
  type: string
  title: string
  body: string
  data?: Record<string, unknown>
}) {
  if (params.userId) {
    await fetchMutation(api.notifications.send, {
      userId: params.userId as Id<'profiles'>,
      type: params.type,
      title: params.title,
      body: params.body,
      data: params.data,
    })
  } else {
    const users = await fetchQuery(api.profiles.listUsers, {})
    const userIds = users.filter((u) => u.profileId).map((u) => u.profileId as Id<'profiles'>)
    await fetchMutation(api.notifications.sendBatch, {
      userIds,
      type: params.type,
      title: params.title,
      body: params.body,
      data: params.data,
    })
  }
  revalidatePath('/notifications')
}
