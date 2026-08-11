'use client'

import { useQuery } from '@tanstack/react-query'
import { getSupportTickets } from '@/lib/actions/support'

export const supportKeys = ['support'] as const

type SupportTicket = Awaited<ReturnType<typeof getSupportTickets>>[number]

export function useSupportTickets(initial: SupportTicket[]) {
  return useQuery<SupportTicket[]>({
    queryKey: supportKeys,
    queryFn: () => getSupportTickets(),
    initialData: initial,
    staleTime: 30_000,
  })
}
