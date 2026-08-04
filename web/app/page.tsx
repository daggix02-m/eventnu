import type { Metadata } from "next";
import { DiscoverPageClient } from "@/components/events/DiscoverPageClient";
import { FeaturedCarousel } from "@/components/events/FeaturedCarousel";
import { getPublishedEvents, getFeaturedEvents, getCategories, getActiveAnnouncements } from "@/lib/api/events";
import { AnnouncementBanner } from "@/components/events/AnnouncementBanner";
import { SiteBackground } from "@/components/layout/SiteBackground";

export const revalidate = 60;

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
  const [events, featured, categories, announcements] = await Promise.all([
    getPublishedEvents(),
    getFeaturedEvents(5),
    getCategories(),
    getActiveAnnouncements(),
  ]);

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
