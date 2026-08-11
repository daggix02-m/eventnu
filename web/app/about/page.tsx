import type { Metadata } from "next";
import { AboutContent } from "./AboutContent";
import { getCategories, getPublishedEvents } from "@/lib/api/events";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About | Event Nu",
  description: "Learn more about Event Nu, your discovery platform for events in Addis Ababa.",
};

export default async function AboutPage() {
  const [events, categories] = await Promise.all([
    getPublishedEvents(),
    getCategories(),
  ]);

  return (
    <AboutContent
      eventCount={events.length}
      categoryCount={categories.length}
    />
  );
}
