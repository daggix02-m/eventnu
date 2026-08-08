'use server'

import { fetchQuery, fetchMutation } from '@/lib/actions/authedFetch'
import { api } from '../../../../web/convex/_generated/api'
import { revalidatePath } from 'next/cache'
import { mapSupportTicket } from '../mappers'

export async function createSupportTicket(data: {
  subject: string
  message: string
  priority: string
}) {
  const result = await fetchMutation(api.support.create, {
    subject: data.subject,
    message: data.message,
    priority: data.priority,
  })
  revalidatePath('/support')
  return result
}

export async function getSupportTickets() {
  try {
    const tickets = await fetchQuery(api.support.list)
    return tickets.map(mapSupportTicket)
  } catch (err) {
    console.error('Failed to load support tickets:', err)
    throw err
  }
}

export async function closeSupportTicket(ticketId: string) {
  await fetchMutation(api.support.close, { ticketId: ticketId as any })
  revalidatePath('/support')
}
