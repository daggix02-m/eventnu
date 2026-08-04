import type { Metadata } from "next";
import { getActiveAnnouncements } from "@/lib/api/events";
import { AnnouncementBanner } from "@/components/events/AnnouncementBanner";
import { OrganizersClient } from "./OrganizersClient";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "For Organizers | Event Nu — Launch Your Event in Addis",
  description:
    "The ultimate event ticketing, discovery, and door management platform in Addis Ababa. Sell tickets, accept Telebirr/CBE Birr, and grow your audience.",
};

export default async function OrganizersPage() {
  const announcements = await getActiveAnnouncements();

  return (
    <>
      <AnnouncementBanner announcements={announcements} />
      <OrganizersClient contactUrl="/contact" />
    </>
  );
}
