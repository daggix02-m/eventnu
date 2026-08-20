import { SupportClient } from '@/components/support/SupportClient'
import { getSupportTickets } from '@/lib/actions/support'
import { logError } from '@/lib/logger'

export default async function SupportPage() {
  let initialTickets: Awaited<ReturnType<typeof getSupportTickets>> = []
  try {
    initialTickets = await getSupportTickets()
  } catch (err) {
    logError('admin/support', err)
  }
  return <SupportClient initialTickets={initialTickets} />
}
