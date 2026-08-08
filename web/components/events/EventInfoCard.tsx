"use client";

import { useCallback } from "react";
import { Calendar, Banknote, MapPin, ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatPrice, formatEventDate, isEventPast } from "@/lib/utils";
import type { Event } from "@/types";

interface EventInfoCardProps {
  event: Event;
}

function escapeIcs(value: string): string {
  return value.replace(/[\n;,\\]/g, (m) => `\\${m}`);
}

function toIcsDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function buildIcs(event: Event): string {
  const dtStart = toIcsDate(event.start_date);
  const dtEnd = event.end_date ? toIcsDate(event.end_date) : dtStart;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EventNu//Events//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event.id}@eventnu`,
    `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    event.venue_name ? `LOCATION:${escapeIcs(event.venue_name)}` : null,
    event.description ? `DESCRIPTION:${escapeIcs(event.description.slice(0, 200))}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((l): l is string => l !== null);
  return lines.join("\r\n");
}

export function EventInfoCard({ event }: EventInfoCardProps) {
  const externalLabel =
    event.external_link_label?.trim() || (event.is_free ? "More Info" : "Get Tickets");
  const ended = isEventPast(event.start_date);

  const mapQuery =
    event.venue_lat && event.venue_lng
      ? `${event.venue_lat},${event.venue_lng}`
      : event.venue_address?.trim() || event.venue_name;
  const mapEmbedUrl = mapQuery
    ? `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed`
    : null;
  const mapExternalUrl =
    event.venue_map_link ||
    (mapQuery ? `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}` : null);

  const handleAddToCalendar = useCallback(() => {
    const blob = new Blob([buildIcs(event)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.slug || event.id}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }, [event]);

  return (
    <div className="p-lg bg-surface-container-high border border-outline-variant rounded-xl space-y-lg sticky top-24">
      <div className="space-y-md">
        <div className="flex items-start gap-md">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-mono text-label-sm text-on-surface-variant uppercase">Date & Time</p>
            <p className="font-body-md text-on-surface">{formatEventDate(event.start_date)}</p>
            {ended && (
              <span className="inline-block mt-xs bg-error text-on-error px-sm py-0.5 rounded font-label-sm text-label-sm">
                ENDED
              </span>
            )}
          </div>
        </div>

        <div className="flex items-start gap-md">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Banknote className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="font-mono text-label-sm text-on-surface-variant uppercase">Price</p>
            <p className="font-display text-headline-md text-secondary">
              {formatPrice(event.price_display, event.is_free)}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-md">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="font-mono text-label-sm text-on-surface-variant uppercase">Venue</p>
            <p className="font-body-md text-on-surface">{event.venue_name}</p>
          </div>
        </div>
      </div>

      <div className="space-y-sm">
        <p className="font-mono text-label-sm text-on-surface-variant uppercase">Venue Location</p>
        {mapEmbedUrl ? (
          <iframe
            src={mapEmbedUrl}
            title={`Map for ${event.venue_name}`}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-48 rounded-xl border-0"
          />
        ) : (
          <div className="h-48 rounded-xl bg-surface-container-highest flex items-center justify-center">
            <MapPin className="w-12 h-12 text-primary/50" aria-hidden="true" />
          </div>
        )}
        {event.venue_address && (
          <p className="font-body-md text-on-surface">{event.venue_address}</p>
        )}
        {mapExternalUrl && (
          <a
            href={mapExternalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-xs text-label-sm text-primary hover:text-primary/80 transition-colors"
          >
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
            Open in Maps
          </a>
        )}
      </div>

      {!ended && event.external_link && (
        <Button asChild className="w-full">
          <a href={event.external_link} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4" />
            {externalLabel}
          </a>
        </Button>
      )}
      {!ended && (
        <Button variant="outline" className="w-full" onClick={handleAddToCalendar}>
          <Download className="w-4 h-4" />
          Add to Calendar
        </Button>
      )}
    </div>
  );
}
