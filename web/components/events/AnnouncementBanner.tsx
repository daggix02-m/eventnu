import Link from "next/link";
import { Megaphone, X } from "lucide-react";
import type { Announcement } from "@/types";

interface AnnouncementBannerProps {
  announcements: Announcement[];
}

export function AnnouncementBanner({ announcements }: AnnouncementBannerProps) {
  if (announcements.length === 0) return null;

  const announcement = announcements[0];

  return (
    <div className="w-full bg-secondary-container text-on-secondary-container py-3 px-gutter">
      <div className="max-w-container-max mx-auto flex items-center justify-center gap-sm text-center">
        <Megaphone className="w-4 h-4 flex-shrink-0" />
        <span className="font-body-md">
          <strong>{announcement.title}</strong>
          {announcement.message && <span className="ml-sm opacity-90">{announcement.message}</span>}
        </span>
        {announcement.link_url && (
          <Link
            href={announcement.link_url}
            className="ml-sm underline font-bold hover:no-underline"
          >
            {announcement.link_text || "Learn more"}
          </Link>
        )}
      </div>
    </div>
  );
}
