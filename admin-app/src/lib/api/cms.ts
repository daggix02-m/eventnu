'use client'

import { useQuery } from '@tanstack/react-query'
import { getPages, getAnnouncements, getContactSubmissions } from '@/lib/actions/cms'

export const pagesKeys = ['cms', 'pages'] as const
export const announcementsKeys = ['cms', 'announcements'] as const
export const contactSubmissionsKeys = ['cms', 'contact'] as const

type Page = Awaited<ReturnType<typeof getPages>>[number]
type Announcement = Awaited<ReturnType<typeof getAnnouncements>>[number]
type ContactSubmission = Awaited<ReturnType<typeof getContactSubmissions>>[number]

export function usePages(initial: Page[]) {
  return useQuery<Page[]>({
    queryKey: pagesKeys,
    queryFn: () => getPages(),
    initialData: initial,
    staleTime: 30_000,
  })
}

export function useAnnouncements(initial: Announcement[]) {
  return useQuery<Announcement[]>({
    queryKey: announcementsKeys,
    queryFn: () => getAnnouncements(),
    initialData: initial,
    staleTime: 30_000,
  })
}

export function useContactSubmissions(initial: ContactSubmission[]) {
  return useQuery<ContactSubmission[]>({
    queryKey: contactSubmissionsKeys,
    queryFn: () => getContactSubmissions(),
    initialData: initial,
    staleTime: 30_000,
  })
}
