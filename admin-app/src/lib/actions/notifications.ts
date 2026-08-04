'use server'

import { fetchQuery, fetchMutation } from 'convex/nextjs'
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
  } catch {
    return { notifications: [], count: 0 }
  }
}

export async function sendNotification(params: {
  userId?: string | null
  type: string
  title: string
  body: string
  data?: Record<string, any>
}) {
  try {
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
  } catch {}
  revalidatePath('/notifications')
}

export async function markAllRead(userId: string) {
  try {
    await fetchMutation(api.notifications.markAllRead, { userId: userId as any })
  } catch {}
  revalidatePath('/notifications')
}
