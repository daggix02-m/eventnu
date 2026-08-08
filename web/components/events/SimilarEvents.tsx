import { EventList } from "./EventList";
import { isEventPast } from "@/lib/utils";
import type { Event } from "@/types";

interface SimilarEventsProps {
  events: Event[];
}

export function SimilarEvents({ events }: SimilarEventsProps) {
  const upcoming = events.filter((e) => !isEventPast(e.start_date));
  if (upcoming.length === 0) return null;

  return (
    <section className="px-gutter py-xl bg-surface-container-lowest">
      <div className="max-w-container-max mx-auto space-y-lg">
        <div className="flex justify-between items-end">
          <h2 className="font-display text-headline-md md:text-display-lg-mobile">Similar Experiences</h2>
        </div>
        <EventList events={upcoming} />
      </div>
    </section>
  );
}
