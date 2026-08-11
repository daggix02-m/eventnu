import { fetchQuery } from "convex/nextjs";
import { api } from "@eventnu/convex/_generated/api";
import type { Event, Category, Page } from "@/types";

export function mapEvent(raw: any): Event {
  return {
    id: raw._id,
    title: raw.title,
    slug: raw.slug,
    subtitle: raw.subtitle,
    description: raw.description,
    poster_url: raw.posterUrl,
    image_aspect_ratio: raw.imageAspectRatio,
    images: (raw.images ?? []).map((img: any) => ({
      id: img._id,
      url: img.url,
      storage_id: img.storageId,
      filter: img.filter,
      sort_order: img.sortOrder,
    })),
    insta_permalink: raw.instaPermalink,
    teaser_video_url: raw.teaserVideoUrl,
    video_aspect_ratio: raw.videoAspectRatio,
    external_link: raw.externalLink,
    external_link_label: raw.externalLinkLabel,
    price_display: raw.priceDisplay,
    is_free: raw.isFree,
    action_type: raw.actionType,
    status: raw.status,
    source: raw.source,
    is_featured: raw.isFeatured,
    organizer_id: raw.organizerId,
    venue_name: raw.venueName,
    venue_address: raw.venueAddress,
    venue_map_link: raw.venueMapLink,
    venue_lat: raw.venueLat,
    venue_lng: raw.venueLng,
    like_count: raw.likeCount,
    reservation_enabled: raw.reservationEnabled,
    reservation_limit: raw.reservationLimit,
    timezone: raw.timezone,
    start_date: new Date(raw.startDate).toISOString(),
    end_date: raw.endDate ? new Date(raw.endDate).toISOString() : null,
    created_at: new Date(raw._creationTime).toISOString(),
    event_categories: (raw.categories ?? []).map((cat: any) => ({
      category_id: cat._id,
      event_id: raw._id,
      is_primary: true,
      categories: {
        id: cat._id,
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        parent_id: cat.parentId,
        sort_order: cat.sortOrder,
      },
    })),
    organizer: raw.organizer
      ? {
          id: raw.organizer._id,
          email: raw.organizer.email ?? null,
          full_name: raw.organizer.fullName ?? null,
          avatar_url: raw.organizer.avatarUrl ?? null,
          created_at: raw.organizer._creationTime
            ? new Date(raw.organizer._creationTime).toISOString()
            : undefined,
        }
      : null,
  };
}

export async function getPublishedEvents(): Promise<Event[]> {
  try {
    const events = await fetchQuery(api.events.getPublished);
    return (events ?? []).map(mapEvent);
  } catch (err) {
    console.error("Failed to fetch published events:", err);
    return [];
  }
}

export async function getFeaturedEvents(limit = 5): Promise<Event[]> {
  try {
    const events = await fetchQuery(api.events.getFeatured, {
      startDate: Date.now(),
      limit,
    });
    return (events ?? []).map(mapEvent);
  } catch (err) {
    console.error("Failed to fetch featured events:", err);
    return [];
  }
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  try {
    const event = await fetchQuery(api.events.getBySlug, { slug });
    return event ? mapEvent(event) : null;
  } catch (err) {
    console.error("Failed to fetch event by slug:", err);
    return null;
  }
}

export async function getSimilarEvents(event: Event, limit = 3): Promise<Event[]> {
  try {
    const events = await fetchQuery(api.events.getSimilar, {
      eventId: event.id as any,
      limit,
    });
    return (events ?? []).map(mapEvent);
  } catch (err) {
    console.error("Failed to fetch similar events:", err);
    return [];
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const categories = await fetchQuery(api.categories.getRoot);
    return (categories ?? []).map((raw: any) => ({
      id: raw._id,
      slug: raw.slug,
      name: raw.name,
      description: raw.description,
      icon: raw.icon,
      parent_id: raw.parentId,
      sort_order: raw.sortOrder,
    }));
  } catch (err) {
    console.error("Failed to fetch categories:", err);
    return [];
  }
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const category = await fetchQuery(api.categories.getBySlug, { slug });
    if (!category) return null;
    return {
      id: category._id,
      slug: category.slug,
      name: category.name,
      description: category.description,
      icon: category.icon,
      parent_id: category.parentId,
      sort_order: category.sortOrder,
    };
  } catch (err) {
    console.error("Failed to fetch category by slug:", err);
    return null;
  }
}

export interface CategoryWithCount extends Category {
  eventCount: number;
}

export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  try {
    const categories = await fetchQuery(api.categories.getWithEventCounts);
    return (categories ?? []).map((raw: any) => ({
      id: raw._id,
      slug: raw.slug,
      name: raw.name,
      description: raw.description,
      icon: raw.icon,
      parent_id: raw.parentId,
      sort_order: raw.sortOrder,
      eventCount: raw.eventCount ?? 0,
    }));
  } catch (err) {
    console.error("Failed to fetch categories with counts:", err);
    return [];
  }
}

export async function getEventsByCategory(categoryId: string): Promise<Event[]> {
  try {
    const events = await fetchQuery(api.events.getByCategory, {
      categoryId: categoryId as any,
    });
    return (events ?? []).map(mapEvent);
  } catch (err) {
    console.error("Failed to fetch events by category:", err);
    return [];
  }
}

export async function getPublishedPages(): Promise<Page[]> {
  try {
    const pages = await fetchQuery(api.cms.getPublishedPages);
    return (pages ?? []).map((raw: any) => ({
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
    }));
  } catch (err) {
    console.error("Failed to fetch published pages:", err);
    return [];
  }
}

export async function getPageBySlug(slug: string): Promise<Page | null> {
  try {
    const raw = await fetchQuery(api.cms.getPageBySlug, { slug });
    if (!raw) return null;
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
    };
  } catch (err) {
    console.error("Failed to fetch page by slug:", err);
    return null;
  }
}
