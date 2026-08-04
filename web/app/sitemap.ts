import type { MetadataRoute } from "next";
import { getPublishedEvents, getCategories, getPublishedPages } from "@/lib/api/events";

export const revalidate = 60;

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [events, categories, pages] = await Promise.all([
    getPublishedEvents(),
    getCategories(),
    getPublishedPages(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    "/",
    "/about",
    "/categories",
    "/contact",
    "/discover",
    "/organizers",
  ].map((route) => ({ url: `${baseUrl}${route}`, changeFrequency: "weekly", priority: 0.8 }));

  const eventRoutes: MetadataRoute.Sitemap = events
    .filter((e) => e.slug)
    .map((e) => ({
      url: `${baseUrl}/events/${e.slug}`,
      lastModified: new Date(e.start_date),
      changeFrequency: "weekly",
      priority: 0.9,
    }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${baseUrl}/categories/${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const pageRoutes: MetadataRoute.Sitemap = pages
    .filter((p) => p.slug)
    .map((p) => ({
      url: `${baseUrl}/info/${p.slug}`,
      changeFrequency: "monthly",
      priority: 0.5,
    }));

  return [...staticRoutes, ...eventRoutes, ...categoryRoutes, ...pageRoutes];
}
