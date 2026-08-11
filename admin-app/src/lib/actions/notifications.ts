'use server'

import { fetchQuery, fetchMutation } from '@/lib/actions/authedFetch'
import type { Id } from '@eventnu/convex/_generated/dataModel'
import { api } from '@eventnu/convex/_generated/api'
import { revalidatePath } from 'next/cache'
import { mapNotification } from '../mappers'
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination'

export async function getNotifications(params: {
  search?: string
  type?: string
  read?: boolean
  cursor?: string | null
}) {
  const result = await fetchQuery(api.notifications.listAll, {
    paginationOpts: { numItems: DEFAULT_PAGE_SIZE, cursor: params.cursor ?? null },
    search: params.search,
    type: params.type,
    read: params.read,
  })
  return {
    items: (result.page ?? []).map((n) => mapNotification(n, n.profile)),
    nextCursor: (result.continueCursor ?? null) as string | null,
    isDone: result.isDone,
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
    const userIds = await fetchQuery(api.profiles.listProfileIds)
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
