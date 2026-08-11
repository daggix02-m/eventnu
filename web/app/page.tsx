import type { Metadata } from "next";
import { DiscoverPageClient } from "@/components/events/DiscoverPageClient";
import { FeaturedCarousel } from "@/components/events/FeaturedCarousel";
import { getPublishedEvents, getFeaturedEvents, getCategories } from "@/lib/api/events";
import { getActiveAnnouncements } from "@/lib/api/announcements";
import { AnnouncementBanner } from "@/components/events/AnnouncementBanner";
import { SiteBackground } from "@/components/layout/SiteBackground";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Event Nu — Discover Live Experiences in Addis",
  description:
    "Discover concerts, arts, nightlife, and cultural experiences across Addis Ababa. All events in one place.",
};

interface PageProps {
  searchParams: Promise<{ q?: string; category?: string; date?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [events, featured, categories, announcements] = await Promise.allSettled([
    getPublishedEvents(),
    getFeaturedEvents(5),
    getCategories(),
    getActiveAnnouncements(),
  ]).then(
    (results): [
      Awaited<ReturnType<typeof getPublishedEvents>>,
      Awaited<ReturnType<typeof getFeaturedEvents>>,
      Awaited<ReturnType<typeof getCategories>>,
      Awaited<ReturnType<typeof getActiveAnnouncements>>
    ] =>
      results.map((r) => (r.status === "fulfilled" ? r.value : [])) as never
  );

  return (
    <>
      <SiteBackground />
      <AnnouncementBanner announcements={announcements} />
      {featured.length > 0 && <FeaturedCarousel events={featured} />}
      <DiscoverPageClient
        events={events}
        categories={categories}
        initialSearch={typeof params.q === "string" ? params.q : ""}
        initialCategory={typeof params.category === "string" ? params.category : undefined}
        initialDate={typeof params.date === "string" ? params.date : "all"}
      />
    </>
  );
}
