"use client";

import { useState, useMemo } from "react";
import { Container } from "@/components/layout/Container";
import { EventList } from "@/components/events/EventList";
import { PulseEqualizer } from "@/components/events/PulseEqualizer";
import { SearchBar, CategoryPills, DateFilter } from "@/components/events/SearchBar";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import type { Event, Category } from "@/types";

interface DiscoverPageClientProps {
  events: Event[];
  categories: Category[];
  initialSearch?: string;
  initialCategory?: string;
  initialDate?: string;
}

function matchesDateFilter(eventDate: Date, filter: string): boolean {
  const now = new Date();
  const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  switch (filter) {
    case "upcoming":
      return eventDate >= now;
    case "past":
      return eventDate < now;
    case "today":
      return eventDay.getTime() === today.getTime();
    case "tomorrow":
      return eventDay.getTime() === tomorrow.getTime();
    case "weekend": {
      const day = eventDate.getDay();
      return day === 0 || day === 6;
    }
    case "week": {
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + 7);
      return eventDate >= today && eventDate < endOfWeek;
    }
    case "month": {
      return (
        eventDate.getMonth() === today.getMonth() &&
        eventDate.getFullYear() === today.getFullYear()
      );
    }
    default:
      return true;
  }
}

export function DiscoverPageClient({
  events,
  categories,
  initialSearch = "",
  initialCategory,
  initialDate = "all",
}: DiscoverPageClientProps) {
  const [search, setSearch] = useState(initialSearch);
  const [activeCategory, setActiveCategory] = useState<string | undefined>(initialCategory);
  const [dateFilter, setDateFilter] = useState(initialDate);

  const headingRef = useScrollReveal({ y: 20, duration: 0.6 });
  const filtersRef = useScrollReveal({ y: 16, duration: 0.5, delay: 0.1 });
  const gridRef = useScrollReveal({ y: 16, duration: 0.5, delay: 0.15 });

  const filteredEvents = useMemo(() => {
    const term = search.toLowerCase().trim();
    return events.filter((event) => {
      const matchesSearch =
        !term ||
        event.title.toLowerCase().includes(term) ||
        event.venue_name?.toLowerCase().includes(term) ||
        event.venue_address?.toLowerCase().includes(term) ||
        event.description?.toLowerCase().includes(term);

      const primaryCategory = event.event_categories?.find((ec) => ec.is_primary)?.categories ?? event.event_categories?.[0]?.categories;
      const matchesCategory = !activeCategory || primaryCategory?.slug === activeCategory;

      const matchesDate = matchesDateFilter(new Date(event.start_date), dateFilter);

      return matchesSearch && matchesCategory && matchesDate;
    });
  }, [events, search, activeCategory, dateFilter]);

  return (
    <>
      <Container className="py-xl space-y-xl" id="event-grid">
        <div ref={headingRef} className="flex items-center justify-between">
          <div className="flex items-center gap-md">
            <h2 className="font-display text-display-lg-mobile md:text-display-lg text-on-surface">
              Discover <span className="text-primary">events</span>
            </h2>
            <PulseEqualizer className="hidden sm:flex" barCount={5} />
          </div>
          <p className="hidden md:block text-on-surface-variant font-mono text-label-sm">
            {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div ref={filtersRef} className="flex flex-col md:flex-row gap-md">
          <div className="md:w-1/3">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search events..."
            />
          </div>
          <div className="md:w-2/3 flex flex-col gap-sm">
            <CategoryPills
              categories={categories}
              activeSlug={activeCategory}
              onSelect={setActiveCategory}
            />
            <DateFilter value={dateFilter} onChange={setDateFilter} />
          </div>
        </div>

        <div ref={gridRef} className="space-y-md">
          <div className="md:hidden">
            <p className="text-on-surface-variant font-mono text-label-sm">
              {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""} found
            </p>
          </div>
          <EventList
            events={filteredEvents}
            bento
            emptyMessage="No events match your search. Try adjusting your filters."
          />
        </div>
      </Container>
    </>
  );
}
