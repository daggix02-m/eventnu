'use server'

import { fetchQuery, fetchMutation, fetchAction } from '@/lib/actions/authedFetch'
import { api } from '@eventnu/convex/_generated/api'
import { revalidatePath } from 'next/cache'

export async function getInstagramStatus() {
  try {
    const result = await fetchQuery(api.instagram.getConnectionStatus)
    return result
  } catch {
    return null
  }
}

export async function startInstagramConnect() {
  return await fetchMutation(api.instagram.startConnect)
}

export async function setInstagramSync(enabled: boolean) {
  await fetchMutation(api.instagram.setSyncEnabled, { enabled })
  revalidatePath('/settings')
}

export async function setInstagramAutoPublish(enabled: boolean) {
  await fetchMutation(api.instagram.setAutoPublish, { enabled })
  revalidatePath('/settings')
}

export async function disconnectInstagram() {
  await fetchMutation(api.instagram.disconnect)
  revalidatePath('/settings')
}

export async function publishEventToInstagram(eventId: string, caption: string) {
  return await fetchAction(api.instagram.publishToInstagram, {
    eventId: eventId as any,
    caption,
  })
}
