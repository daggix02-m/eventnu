import { SupportClient } from '@/components/SupportClient'
import { getSupportTickets } from '@/lib/actions/support'

export default async function SupportPage() {
  let initialTickets: Awaited<ReturnType<typeof getSupportTickets>> = []
  try {
    initialTickets = await getSupportTickets()
  } catch (err) {
    console.error('Failed to load support tickets:', err)
  }
  return <SupportClient initialTickets={initialTickets} />
}
