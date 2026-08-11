import { v } from 'convex/values'
import { QueryCtx, MutationCtx } from '../_generated/server'
import { Doc, Id } from '../_generated/dataModel'
import { MAX_EVENT_IMAGES } from '../constants'

export const eventImageValidator = v.object({
  url: v.string(),
  storageId: v.optional(v.string()),
  filter: v.optional(v.string()),
})

export async function getEventImages(ctx: QueryCtx | MutationCtx, eventId: Id<'events'>) {
  return await ctx.db
    .query('eventImages')
    .withIndex('by_eventId_and_sortOrder', (q) => q.eq('eventId', eventId))
    .take(MAX_EVENT_IMAGES)
}

export async function resolveImageUrls(
  ctx: QueryCtx | MutationCtx,
  images: Array<Doc<'eventImages'>>,
) {
  return Promise.all(
    images.map(async (img) => {
      if (img.storageId) {
        const url = await ctx.storage.getUrl(img.storageId as Id<'_storage'>)
        if (url) return { ...img, url }
      }
      return img
    }),
  )
}

export async function getEventCategoryLinks(ctx: QueryCtx | MutationCtx, eventId: Id<'events'>) {
  const rows = await ctx.db
    .query('eventCategories')
    .withIndex('by_eventId_and_categoryId', (q) => q.eq('eventId', eventId))
    .take(20)
  return rows.sort((a, b) =>
    a.isPrimary === b.isPrimary ? a._creationTime - b._creationTime : a.isPrimary ? -1 : 1,
  )
}

export async function enrichEvent(ctx: QueryCtx, event: Doc<'events'>, includeOrganizer = false) {
  const links = await getEventCategoryLinks(ctx, event._id)
  const categories = await Promise.all(
    links.map((link) => ctx.db.get('categories', link.categoryId)),
  )
  const images = await resolveImageUrls(ctx, await getEventImages(ctx, event._id))
  const organizer =
    includeOrganizer && event.organizerId ? await ctx.db.get('profiles', event.organizerId) : null
  return {
    ...event,
    categories: categories.filter((c): c is Doc<'categories'> => c !== null),
    images,
    organizer,
    posterUrl: images[0]?.url ?? event.posterUrl,
  }
}
