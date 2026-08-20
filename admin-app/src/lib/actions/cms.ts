'use server'

import { fetchQuery, fetchMutation } from '@/lib/actions/authedFetch'
import type { Doc, Id } from '@eventnu/convex/_generated/dataModel'
import { api } from '@eventnu/convex/_generated/api'
import { revalidatePath } from 'next/cache'
import { mapAnnouncement, mapContactSubmission, mapPage } from '../mappers'
import type { MappedUser } from '../mappers'
import { getAllUsers } from './users'

export async function getPages() {
  const pages = await fetchQuery(api.cms.pages.getPages)
  return pages.map(mapPage)
}

export async function getPageById(id: string) {
  const page = await fetchQuery(api.cms.pages.getPageById, { pageId: id as Id<'pages'> })
  return page ? mapPage(page) : null
}

export async function createPage(data: {
  slug: string
  title: string
  subtitle?: string | null
  body?: string
  body_html?: string
  hero_image_url?: string | null
  is_published?: boolean
  sort_order?: number
}) {
  await fetchMutation(api.cms.pages.createPage, {
    slug: data.slug,
    title: data.title,
    subtitle: data.subtitle ?? undefined,
    body: { html: data.body_html || data.body || '' },
    bodyHtml: data.body_html || data.body || undefined,
    heroImageUrl: data.hero_image_url ?? undefined,
    isPublished: data.is_published ?? false,
    sortOrder: data.sort_order ?? 0,
  })
  revalidatePath('/cms/pages')
  revalidatePath('/cms')
}

export async function updatePage(
  id: string,
  data: {
    slug?: string
    title?: string
    subtitle?: string | null
    body?: string
    body_html?: string
    hero_image_url?: string | null
    is_published?: boolean
    sort_order?: number
  },
) {
  await fetchMutation(api.cms.pages.updatePage, {
    pageId: id as Id<'pages'>,
    slug: data.slug,
    title: data.title,
    subtitle: data.subtitle ?? undefined,
    body: data.body || data.body_html ? { html: data.body_html || data.body || '' } : undefined,
    bodyHtml: data.body_html || data.body || undefined,
    heroImageUrl: data.hero_image_url ?? undefined,
    isPublished: data.is_published,
    sortOrder: data.sort_order,
  })
  revalidatePath('/cms/pages')
  revalidatePath('/cms')
}

export async function deletePage(id: string) {
  await fetchMutation(api.cms.pages.deletePage, { pageId: id as Id<'pages'> })
  revalidatePath('/cms/pages')
  revalidatePath('/cms')
}

export async function getAnnouncements() {
  const announcements = await fetchQuery(api.cms.announcements.getAnnouncements)
  const users = await getAllUsers({ status: 'all' })
  const byId = new Map(
    users.filter((u: MappedUser) => u.profileId).map((u: MappedUser) => [u.profileId, u]),
  )
  return announcements.map((a: Doc<'announcements'>) => {
    const mapped = mapAnnouncement(a)
    const target = mapped.target_user_id ? (byId.get(mapped.target_user_id) ?? null) : null
    return {
      ...mapped,
      target_user_name: target ? target.full_name || target.username : null,
    }
  })
}

export async function createAnnouncement(data: {
  title: string
  message?: string | null
  link_url?: string | null
  link_text?: string | null
  is_active?: boolean
  starts_at?: string | null
  ends_at?: string | null
  target_user_id?: string | null
}) {
  await fetchMutation(api.cms.announcements.createAnnouncement, {
    title: data.title,
    message: data.message ?? undefined,
    linkUrl: data.link_url ?? undefined,
    linkText: data.link_text ?? undefined,
    isActive: data.is_active ?? false,
    startsAt: data.starts_at ? new Date(data.starts_at).getTime() : undefined,
    endsAt: data.ends_at ? new Date(data.ends_at).getTime() : undefined,
    targetUserId: data.target_user_id ? (data.target_user_id as Id<'profiles'>) : undefined,
  })
  revalidatePath('/cms/announcements')
  revalidatePath('/cms')
  revalidatePath('/')
}

export async function updateAnnouncement(
  id: string,
  data: {
    title?: string
    message?: string | null
    link_url?: string | null
    link_text?: string | null
    is_active?: boolean
    starts_at?: string | null
    ends_at?: string | null
    target_user_id?: string | null
  },
) {
  await fetchMutation(api.cms.announcements.updateAnnouncement, {
    announcementId: id as Id<'announcements'>,
    title: data.title,
    message: data.message ?? undefined,
    linkUrl: data.link_url ?? undefined,
    linkText: data.link_text ?? undefined,
    isActive: data.is_active,
    startsAt: data.starts_at ? new Date(data.starts_at).getTime() : undefined,
    endsAt: data.ends_at ? new Date(data.ends_at).getTime() : undefined,
    targetUserId: data.target_user_id ? (data.target_user_id as Id<'profiles'>) : undefined,
  })
  revalidatePath('/cms/announcements')
  revalidatePath('/cms')
  revalidatePath('/')
}

export async function deleteAnnouncement(id: string) {
  await fetchMutation(api.cms.announcements.deleteAnnouncement, {
    announcementId: id as Id<'announcements'>,
  })
  revalidatePath('/cms/announcements')
  revalidatePath('/cms')
  revalidatePath('/')
}

export async function getContactSubmissions() {
  const submissions = await fetchQuery(api.cms.contact.getContactSubmissions)
  return submissions.map(mapContactSubmission)
}

export async function markContactResolved(id: string, resolved: boolean) {
  await fetchMutation(api.cms.contact.markContactResolved, {
    submissionId: id as Id<'contactSubmissions'>,
    resolved,
  })
  revalidatePath('/cms/contact')
  revalidatePath('/cms')
}
