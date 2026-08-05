'use server'

import { fetchQuery, fetchMutation } from '@/lib/actions/authedFetch'
import { api } from '../../../../web/convex/_generated/api'
import { revalidatePath } from 'next/cache'
import { mapAnnouncement, mapContactSubmission, mapPage } from '../mappers'

export async function getPages() {
  try {
    const pages = await fetchQuery(api.cms.getPages)
    return pages.map(mapPage)
  } catch {
    return []
  }
}

export async function getPageById(id: string) {
  try {
    const page = await fetchQuery(api.cms.getPageById, { pageId: id as any })
    return page ? mapPage(page) : null
  } catch {
    return null
  }
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
  await fetchMutation(api.cms.createPage, {
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
  }
) {
  await fetchMutation(api.cms.updatePage, {
    pageId: id as any,
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
  await fetchMutation(api.cms.deletePage, { pageId: id as any })
  revalidatePath('/cms/pages')
  revalidatePath('/cms')
}

export async function getAnnouncements() {
  try {
    const announcements = await fetchQuery(api.cms.getAnnouncements)
    return announcements.map(mapAnnouncement)
  } catch {
    return []
  }
}

export async function createAnnouncement(data: {
  title: string
  message?: string | null
  link_url?: string | null
  link_text?: string | null
  is_active?: boolean
  starts_at?: string | null
  ends_at?: string | null
}) {
  await fetchMutation(api.cms.createAnnouncement, {
    title: data.title,
    message: data.message ?? undefined,
    linkUrl: data.link_url ?? undefined,
    linkText: data.link_text ?? undefined,
    isActive: data.is_active ?? false,
    startsAt: data.starts_at ? new Date(data.starts_at).getTime() : undefined,
    endsAt: data.ends_at ? new Date(data.ends_at).getTime() : undefined,
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
  }
) {
  await fetchMutation(api.cms.updateAnnouncement, {
    announcementId: id as any,
    title: data.title,
    message: data.message ?? undefined,
    linkUrl: data.link_url ?? undefined,
    linkText: data.link_text ?? undefined,
    isActive: data.is_active,
    startsAt: data.starts_at ? new Date(data.starts_at).getTime() : undefined,
    endsAt: data.ends_at ? new Date(data.ends_at).getTime() : undefined,
  })
  revalidatePath('/cms/announcements')
  revalidatePath('/cms')
  revalidatePath('/')
}

export async function deleteAnnouncement(id: string) {
  await fetchMutation(api.cms.deleteAnnouncement, { announcementId: id as any })
  revalidatePath('/cms/announcements')
  revalidatePath('/cms')
  revalidatePath('/')
}

export async function getContactSubmissions() {
  try {
    const submissions = await fetchQuery(api.cms.getContactSubmissions)
    return submissions.map(mapContactSubmission)
  } catch {
    return []
  }
}

export async function markContactResolved(id: string, resolved: boolean) {
  await fetchMutation(api.cms.markContactResolved, { submissionId: id as any })
  revalidatePath('/cms/contact')
  revalidatePath('/cms')
}
