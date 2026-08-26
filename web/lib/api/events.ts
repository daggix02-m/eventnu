import 'server-only'

import { cache } from 'react'
import type { FunctionReturnType } from 'convex/server'
import { api } from '@eventnu/convex/_generated/api'
import type { Id } from '@eventnu/convex/_generated/dataModel'
import type { Event, Category, Page } from '@/types'
import { mapEvent } from '@/lib/api/map-event'
import { createPublicClient } from '@/lib/api/public-client'
import { logError } from '@/lib/logger'

type RawCategory = FunctionReturnType<typeof api.categories.getRoot>[number]
type RawCategoryWithCount = FunctionReturnType<typeof api.categories.getWithEventCounts>[number]
type RawPage = FunctionReturnType<typeof api.cms.pages.getPublishedPages>[number]

export const getPublishedEvents = cache(async (): Promise<Event[]> => {
  try {
    const events = await createPublicClient().query(api.events.read.getPublished, {})
    return (events ?? []).map(mapEvent)
  } catch (err) {
    logError('events/getPublishedEvents', err)
    return []
  }
})

export const getFeaturedEvents = cache(async (limit = 5): Promise<Event[]> => {
  try {
    const events = await createPublicClient().query(api.events.read.getFeatured, {
      startDate: Date.now(),
      limit,
    })
    return (events ?? []).map(mapEvent)
  } catch (err) {
    logError('events/getFeaturedEvents', err)
    return []
  }
})

export const getPublishedEventCount = cache(async (): Promise<number> => {
  try {
    const count = await createPublicClient().query(api.events.read.getPublishedCount, {})
    return typeof count === 'number' ? count : 0
  } catch (err) {
    logError('events/getPublishedEventCount', err)
    return 0
  }
})

export const getEventBySlug = cache(async (slug: string): Promise<Event | null> => {
  try {
    const event = await createPublicClient().query(api.events.read.getBySlug, { slug })
    return event ? mapEvent(event) : null
  } catch (err) {
    logError('events/getEventBySlug', err)
    return null
  }
})

export const getSimilarEvents = cache(async (event: Event, limit = 3): Promise<Event[]> => {
  try {
    const events = await createPublicClient().query(api.events.read.getSimilar, {
      eventId: event.id as Id<'events'>,
      limit,
    })
    return (events ?? []).map(mapEvent)
  } catch (err) {
    logError('events/getSimilarEvents', err)
    return []
  }
})

export const getCategories = cache(async (): Promise<Category[]> => {
  try {
    const categories = await createPublicClient().query(api.categories.getRoot, {})
    return (categories ?? []).map((raw: RawCategory) => ({
      id: raw._id,
      slug: raw.slug,
      name: raw.name,
      description: raw.description,
      icon: raw.icon,
      parent_id: raw.parentId,
      sort_order: raw.sortOrder,
    }))
  } catch (err) {
    logError('events/getCategories', err)
    return []
  }
})

export const getCategoryBySlug = cache(async (slug: string): Promise<Category | null> => {
  try {
    const category = await createPublicClient().query(api.categories.getBySlug, { slug })
    if (!category) return null
    return {
      id: category._id,
      slug: category.slug,
      name: category.name,
      description: category.description,
      icon: category.icon,
      parent_id: category.parentId,
      sort_order: category.sortOrder,
    }
  } catch (err) {
    logError('events/getCategoryBySlug', err)
    return null
  }
})

export interface CategoryWithCount extends Category {
  eventCount: number
}

export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  try {
    const categories = await createPublicClient().query(api.categories.getWithEventCounts, {})
    return (categories ?? []).map((raw: RawCategoryWithCount) => ({
      id: raw._id,
      slug: raw.slug,
      name: raw.name,
      description: raw.description,
      icon: raw.icon,
      parent_id: raw.parentId,
      sort_order: raw.sortOrder,
      eventCount: raw.eventCount ?? 0,
    }))
  } catch (err) {
    logError('events/getCategoriesWithCounts', err)
    return []
  }
}

export async function getEventsByCategory(categoryId: string): Promise<Event[]> {
  try {
    const events = await createPublicClient().query(api.events.read.getByCategory, {
      categoryId: categoryId as Id<'categories'>,
    })
    return (events ?? []).map(mapEvent)
  } catch (err) {
    logError('events/getEventsByCategory', err)
    return []
  }
}

export const getPublishedPages = cache(async (): Promise<Page[]> => {
  try {
    const pages = await createPublicClient().query(api.cms.pages.getPublishedPages, {})
    return (pages ?? []).map((raw: RawPage) => ({
      id: raw._id,
      slug: raw.slug,
      title: raw.title,
      subtitle: raw.subtitle,
      body: raw.body,
      body_html: raw.bodyHtml,
      hero_image_url: raw.heroImageUrl,
      is_published: raw.isPublished,
      sort_order: raw.sortOrder,
      created_at: raw._creationTime ? new Date(raw._creationTime).toISOString() : undefined,
    }))
  } catch (err) {
    logError('events/getPublishedPages', err)
    return []
  }
})

export const getPageBySlug = cache(async (slug: string): Promise<Page | null> => {
  try {
    const raw = await createPublicClient().query(api.cms.pages.getPageBySlug, { slug })
    if (!raw) return null
    return {
      id: raw._id,
      slug: raw.slug,
      title: raw.title,
      subtitle: raw.subtitle,
      body: raw.body,
      body_html: raw.bodyHtml,
      hero_image_url: raw.heroImageUrl,
      is_published: raw.isPublished,
      sort_order: raw.sortOrder,
      created_at: raw._creationTime ? new Date(raw._creationTime).toISOString() : undefined,
    }
  } catch (err) {
    logError('events/getPageBySlug', err)
    return null
  }
})
