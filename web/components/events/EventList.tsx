import Link from "next/link";
import { CalendarX } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Event } from "@/types";
import { EventCard } from "./EventCard";

interface EventListProps {
  events: Event[];
  className?: string;
  emptyMessage?: string;
  showViewAll?: boolean;
  bento?: boolean;
}

export function EventList({ events, className, emptyMessage = "No events found.", showViewAll = false, bento = false }: EventListProps) {
  if (events.length === 0) {
    return (
      <div className={cn("py-xl text-center", className)} role="status" aria-live="polite">
        <div className="w-16 h-16 mx-auto mb-md rounded-2xl bg-surface-container-high flex items-center justify-center">
          <CalendarX className="w-8 h-8 text-on-surface-variant" aria-hidden="true" />
        </div>
        <p className="text-on-surface-variant text-body-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-md", className)}>
      {showViewAll && (
        <div className="flex justify-between items-end">
          <div />
          <Link href="/#event-grid" className="text-primary font-bold hover:underline text-body-md">
            View All
          </Link>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
        {events.map((event, i) => (
          <EventCard key={event.id} event={event} size={bento && i === 0 ? "lg" : "default"} />
        ))}
      </div>
    </div>
  );
}
