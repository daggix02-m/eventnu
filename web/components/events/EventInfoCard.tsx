'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Calendar,
  Banknote,
  MapPin,
  ExternalLink,
  MessageSquarePlus,
  Ticket,
  Copy,
  Check,
  Navigation,
  Share2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SITE } from '@/lib/site'
import { EventSocialActions } from '@/components/social/EventSocialActions'
import { formatPrice, formatEventDate, isEventPast } from '@/lib/utils'
import type { Event } from '@/types'

interface EventInfoCardProps {
  event: Event
}

function escapeIcs(value: string): string {
  return value.replace(/[\n;,\\]/g, (m) => `\\${m}`)
}

function toIcsDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function buildIcs(event: Event): string {
  const dtStart = toIcsDate(event.start_date)
  const dtEnd = event.end_date ? toIcsDate(event.end_date) : dtStart
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EventNu//Events//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${event.id}@eventnu`,
    `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    event.venue_name ? `LOCATION:${escapeIcs(event.venue_name)}` : null,
    event.description ? `DESCRIPTION:${escapeIcs(event.description.slice(0, 200))}` : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter((l): l is string => l !== null)
  return lines.join('\r\n')
}

const OSM_EMBED_URL = 'https://www.openstreetmap.org/export/embed.html'
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

interface GeocodeResult {
  lat: string
  lon: string
  boundingbox: [string, string, string, string]
}

async function geocodeMapQuery(query: string): Promise<GeocodeResult | null> {
  const cacheKey = `map-geocode:${query}`
  try {
    const cached = sessionStorage.getItem(cacheKey)
    if (cached) return JSON.parse(cached) as GeocodeResult
  } catch {
    // storage unavailable — ignore
  }
  const params = new URLSearchParams({
    format: 'json',
    limit: '1',
    q: query,
    'accept-language': 'en',
    email: SITE.email,
  })
  try {
    const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`)
    if (!res.ok) return null
    const results = (await res.json()) as GeocodeResult[]
    const first = results[0]
    if (!first) return null
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(first))
    } catch {
      // ignore
    }
    return first
  } catch {
    return null
  }
}

const MIN_BBOX_SPAN = 0.005

function osmEmbedUrl(result: GeocodeResult): string {
  const [south, north, west, east] = result.boundingbox.map(Number)
  const centerLat = (south + north) / 2
  const centerLng = (west + east) / 2
  const latSpan = Math.max(north - south, MIN_BBOX_SPAN)
  const lngSpan = Math.max(east - west, MIN_BBOX_SPAN)
  const padLat = latSpan / 2
  const padLng = lngSpan / 2
  return `${OSM_EMBED_URL}?bbox=${centerLng - padLng},${centerLat - padLat},${centerLng + padLng},${centerLat + padLat}&layer=mapnik&marker=${result.lat},${result.lon}`
}

export function EventInfoCard({ event }: EventInfoCardProps) {
  const externalLabel =
    event.external_link_label?.trim() || (event.is_free ? 'More Info' : 'Get Tickets')
  const ended = isEventPast(event.start_date)
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [downloadedIcs, setDownloadedIcs] = useState(false)

  const mapQuery =
    event.venue_lat && event.venue_lng
      ? `${event.venue_lat},${event.venue_lng}`
      : event.venue_address?.trim() || event.venue_name
  const [mapEmbedUrl, setMapEmbedUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!mapQuery) return

    async function resolveMap() {
      const result = await geocodeMapQuery(mapQuery)
      if (!cancelled && result) {
        setMapEmbedUrl(osmEmbedUrl(result))
      }
    }
    void resolveMap()

    return () => {
      cancelled = true
    }
  }, [mapQuery])

  const mapExternalUrl =
    event.venue_map_link ||
    (mapQuery ? `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}` : null)

  const handleAddToCalendar = useCallback(() => {
    const blob = new Blob([buildIcs(event)], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${event.slug || event.id}.ics`
    a.click()
    URL.revokeObjectURL(url)
    setDownloadedIcs(true)
    setTimeout(() => setDownloadedIcs(false), 2500)
  }, [event])

  const handleCopyAddress = useCallback(() => {
    const textToCopy = event.venue_address
      ? `${event.venue_name}, ${event.venue_address}`
      : event.venue_name
    void navigator.clipboard.writeText(textToCopy)
    setCopiedAddress(true)
    setTimeout(() => setCopiedAddress(false), 2000)
  }, [event.venue_name, event.venue_address])

  return (
    <aside aria-label="Event booking and venue details" className="space-y-6 sticky top-24">
      {/* Primary Ticket & CTA Card */}
      <div className="p-6 rounded-2xl bg-surface-container-high border border-outline-variant/60 shadow-xl shadow-black/30 space-y-6">
        {/* Price & Admission Header */}
        <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
          <div>
            <span className="font-mono text-xs text-on-surface-variant uppercase tracking-wider block">
              Admission
            </span>
            <span className="font-display text-2xl sm:text-3xl font-extrabold text-secondary">
              {formatPrice(event.price_display, event.is_free)}
            </span>
          </div>

          <span
            className={`px-3 py-1 rounded-full font-mono text-xs font-bold uppercase tracking-wider ${
              ended
                ? 'bg-error/20 text-error border border-error/30'
                : 'bg-primary/20 text-primary border border-primary/30'
            }`}
          >
            {ended ? 'Ended' : event.is_free ? 'Free Event' : 'Tickets Available'}
          </span>
        </div>

        {/* Primary CTA Buttons */}
        <div className="space-y-2.5">
          {!ended && event.external_link && (
            <Button asChild size="lg" className="w-full font-bold gap-2 text-base rounded-xl">
              <a href={event.external_link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                <span>{externalLabel}</span>
              </a>
            </Button>
          )}

          {!ended && event.action_type === 'reservation' && (
            <Button asChild size="lg" className="w-full font-bold gap-2 text-base rounded-xl">
              <a href="#reserve">
                <Ticket className="w-4 h-4" />
                <span>Reserve a Spot</span>
              </a>
            </Button>
          )}


        </div>

        {/* Social / Bookmark Row + Compact Calendar Export */}
        <div className="pt-2 border-t border-outline-variant/30 flex items-center justify-between">
          <EventSocialActions
            eventId={event.id}
            title={event.title}
            className="flex-1"
          />
          {!ended && (
            <button
              type="button"
              onClick={handleAddToCalendar}
              title={downloadedIcs ? 'Added to calendar!' : 'Add to Calendar (.ics)'}
              aria-label={downloadedIcs ? 'Added to calendar!' : 'Add to Calendar (.ics)'}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-semibold transition-all duration-200 border shrink-0 ml-2 active:scale-95 ${
                downloadedIcs
                  ? 'border-emerald-500/40 bg-emerald-500/10'
                  : 'border-outline-variant/50 bg-surface-container hover:border-primary/40 hover:text-primary'
              }`}
            >
              {downloadedIcs ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Saved!</span>
                </>
              ) : (
                <>
                  <Calendar className="w-3.5 h-3.5 text-on-surface-variant" />
                  <span className="text-on-surface-variant">+ Calendar</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Venue & Location Map Card */}
      <div className="p-6 rounded-2xl bg-surface-container-high border border-outline-variant/60 shadow-xl shadow-black/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <h3 className="font-display text-base font-bold text-on-surface uppercase tracking-wider">
              Location & Map
            </h3>
          </div>
          {mapExternalUrl && (
            <a
              href={mapExternalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Directions</span>
            </a>
          )}
        </div>

        {/* Map View */}
        <div className="relative rounded-xl overflow-hidden border border-outline-variant/50 bg-surface-container-highest">
          {mapEmbedUrl ? (
            <iframe
              src={mapEmbedUrl}
              title={`Map for ${event.venue_name}`}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-44 border-0"
            />
          ) : (
            <div className="w-full h-44 flex flex-col items-center justify-center gap-2 text-on-surface-variant">
              <MapPin className="w-8 h-8 text-primary/60" aria-hidden="true" />
              <span className="font-mono text-xs">Map Preview</span>
            </div>
          )}
        </div>

        {/* Venue Info & Copy Address */}
        <div className="space-y-1.5 pt-1">
          <p className="font-display font-bold text-sm text-on-surface">
            {event.venue_name}
          </p>
          {event.venue_address && (
            <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
              {event.venue_address}
            </p>
          )}

          <button
            type="button"
            onClick={handleCopyAddress}
            className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors pt-1 cursor-pointer font-mono"
          >
            {copiedAddress ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Address copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Address</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Share Experience Link */}
      {!ended && (
        <Button
          asChild
          variant="ghost"
          className="w-full py-5 rounded-2xl border border-dashed border-outline-variant/60 hover:bg-surface-container-high/60 text-on-surface-variant hover:text-on-surface"
        >
          <a href={`/experiences?event=${encodeURIComponent(event.slug || '')}`}>
            <MessageSquarePlus className="w-4 h-4 text-primary mr-2" />
            <span>Attended? Share your experience</span>
          </a>
        </Button>
      )}
    </aside>
  )
}
