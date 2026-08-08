'use server'

import { fetchQuery, fetchMutation } from '@/lib/actions/authedFetch'
import { api } from '../../../../web/convex/_generated/api'
import { revalidatePath } from 'next/cache'
import { mapNotification } from '../mappers'

export async function getNotifications(params: {
  page?: number
  perPage?: number
}) {
  try {
    const all = await fetchQuery(api.notifications.listAll, {})
    const from = ((params.page ?? 1) - 1) * (params.perPage ?? 20)
    const to = from + (params.perPage ?? 20)
    const notifications = all
      .slice(from, to)
      .map((n: any) => mapNotification(n, n.profile))
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
  data?: Record<string, any>
}) {
  if (params.userId) {
    await fetchMutation(api.notifications.send, {
      userId: params.userId as any,
      type: params.type,
      title: params.title,
      body: params.body,
      data: params.data,
    })
  } else {
    const profiles = await fetchQuery(api.profiles.list, {})
    await fetchMutation(api.notifications.sendBatch, {
      userIds: profiles.map((p: any) => p._id),
      type: params.type,
      title: params.title,
      body: params.body,
      data: params.data,
    })
  }
  revalidatePath('/notifications')
}

export async function markAllRead(userId: string) {
  await fetchMutation(api.notifications.markAllRead, { userId: userId as any })
  revalidatePath('/notifications')
}
