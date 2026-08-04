import { SupportClient } from '@/components/SupportClient'
import { getSupportTickets } from '@/lib/actions/support'

export default async function SupportPage() {
  const initialTickets = await getSupportTickets()
  return <SupportClient initialTickets={initialTickets} />
}
