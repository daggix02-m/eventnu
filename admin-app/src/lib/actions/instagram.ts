'use server'

import { fetchQuery, fetchMutation, fetchAction } from '@/lib/actions/authedFetch'
import type { Id } from '@eventnu/convex/_generated/dataModel'
import { api } from '@eventnu/convex/_generated/api'
import { revalidatePath } from 'next/cache'

export async function getInstagramStatus() {
  return fetchQuery(api.instagram.connect.getConnectionStatus)
}

export async function startInstagramConnect() {
  return await fetchMutation(api.instagram.connect.startConnect)
}

export async function setInstagramSync(enabled: boolean) {
  await fetchMutation(api.instagram.connect.setSyncEnabled, { enabled })
  revalidatePath('/settings')
}

export async function setInstagramAutoPublish(enabled: boolean) {
  await fetchMutation(api.instagram.connect.setAutoPublish, { enabled })
  revalidatePath('/settings')
}

export async function disconnectInstagram() {
  await fetchMutation(api.instagram.connect.disconnect)
  revalidatePath('/settings')
}

export async function publishEventToInstagram(eventId: string, caption: string) {
  return await fetchAction(api.instagram.publish.publishToInstagram, {
    eventId: eventId as Id<'events'>,
    caption,
  })
}
