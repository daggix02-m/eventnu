"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Calendar, MapPin, Pause, Play, Images, Instagram } from "lucide-react";
import { cn, formatEventDate, isEventPast } from "@/lib/utils";
import { filterStyle, sortedImages } from "@/lib/media";
import { Button } from "@/components/ui/Button";
import type { Event } from "@/types";

interface FeaturedCarouselProps {
  events: Event[];
}

const SLIDE_BASE_MS = 6000;
const IMAGE_STEP_MS = 3000;
const SWIPE_THRESHOLD = 60;

function getPrimaryCategory(event: Event) {
  return (
    event.event_categories?.find((ec) => ec.is_primary)?.categories ??
    event.event_categories?.[0]?.categories
  );
}

export function FeaturedCarousel({ events }: FeaturedCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [img, setImg] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const swipeRef = useRef<{ startX: number; startY: number; active: boolean }>({
    startX: 0,
    startY: 0,
    active: false,
  });

  const paused = isPaused || hovered;

  const slideTicks = useCallback(
    (index: number) => {
      const count = Math.max(1, sortedImages(events[index]?.images).length);
      return Math.max(2, count) * (IMAGE_STEP_MS / 1000);
    },
    [events]
  );

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % events.length);
    setImg(0);
  }, [events.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + events.length) % events.length);
    setImg(0);
  }, [events.length]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (events.length <= 1 || paused || prefersReducedMotion) return;
    const activeImages = sortedImages(events[current]?.images);
    const imageCount = Math.max(1, activeImages.length);
    const rotateEvery = Math.round(IMAGE_STEP_MS / 1000);
    const advanceEvery = Math.max(2, imageCount) * rotateEvery;

    let tick = 0;
    const timer = setInterval(() => {
      tick += 1;
      if (imageCount > 1 && tick % rotateEvery === 0) {
        setImg((i) => (i + 1) % imageCount);
      }
      if (tick % advanceEvery === 0) {
        setCurrent((prev) => (prev + 1) % events.length);
        setImg(0);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [events, current, paused, prefersReducedMotion]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === " ") {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };
    el.addEventListener("keydown", handleKeyDown);
    return () => el.removeEventListener("keydown", handleKeyDown);
  }, [next, prev]);

  const handlePointerDown = (e: React.PointerEvent) => {
    swipeRef.current = { startX: e.clientX, startY: e.clientY, active: true };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!swipeRef.current.active) return;
    swipeRef.current.active = false;
    const dx = e.clientX - swipeRef.current.startX;
    const dy = e.clientY - swipeRef.current.startY;
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next();
      else prev();
    }
  };

  const cancelSwipe = () => {
    swipeRef.current.active = false;
  };

  if (events.length === 0) return null;

  const currentEvent = events[current];
  const category = currentEvent ? getPrimaryCategory(currentEvent) : undefined;
  const externalLabel = currentEvent?.external_link_label?.trim() || "RSVP Now";
  const currentImages = sortedImages(currentEvent?.images);
  const currentImageCount = currentImages.length > 1 ? currentImages.length : 1;
  const currentSlideTicks = slideTicks(current);

  return (
    <section
      ref={sectionRef}
      className="relative h-[614px] md:h-[768px] w-full overflow-hidden touch-pan-y select-none"
      aria-roledescription="carousel"
      aria-label="Featured events"
      tabIndex={0}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={cancelSwipe}
    >
      {events.map((event, index) => {
        const images = sortedImages(event.images);
        const posters: { url: string; filter: string | null }[] =
          images.length > 0
            ? images.map((im) => ({ url: im.url, filter: im.filter ?? null }))
            : event.poster_url
              ? [{ url: event.poster_url, filter: null }]
              : [];
        const activeMedia = index === current ? Math.min(img, posters.length - 1) : 0;
        return (
          <div
            key={event.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`Slide ${index + 1} of ${events.length}`}
            aria-hidden={index !== current}
            className={cn(
              "absolute inset-0 transition-opacity duration-700 ease-in-out",
              index === current ? "opacity-100 z-10" : "opacity-0 z-0"
            )}
          >
            {posters.map((m, i) => (
              <Image
                key={`${event.id}-${i}`}
                src={m.url}
                alt={event.title}
                fill
                priority={index === 0}
                draggable={false}
                className={cn(
                  "object-cover transition-opacity duration-1000",
                  i === activeMedia ? "opacity-100" : "opacity-0"
                )}
                style={{ filter: filterStyle(m.filter) }}
                sizes="100vw"
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          </div>
        );
      })}

      <div className="absolute bottom-0 left-0 w-full p-gutter pb-xl z-20">
        <div className="max-w-container-max mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-md">
            <div className="space-y-sm max-w-[48rem]">
              <div className="flex items-center gap-sm">
                {category && (
                  <span className="inline-block px-sm py-1 bg-secondary-container text-on-secondary-container font-label-sm text-label-sm rounded-full tracking-wider">
                    {category.name.toUpperCase()}
                  </span>
                )}
                {currentEvent && isEventPast(currentEvent.start_date) && (
                  <span className="inline-block px-sm py-1 bg-error text-on-error font-label-sm text-label-sm rounded-full">
                    ENDED
                  </span>
                )}
              </div>
              <h1 className="font-display text-display-lg-mobile md:text-display-lg leading-tight text-on-surface">
                {currentEvent?.title}
              </h1>
              <div className="flex flex-wrap items-center gap-md text-on-surface-variant">
                <div className="flex items-center gap-xs">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span className="font-body-md">
                    {currentEvent && formatEventDate(currentEvent.start_date)}
                  </span>
                </div>
                <div className="flex items-center gap-xs">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span className="font-body-md">
                    {currentEvent?.venue_name}, {currentEvent?.venue_address}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-sm w-full md:w-auto">
              {currentEvent?.slug && (
                <Button asChild className="flex-1 md:flex-none">
                  <Link href={`/events/${currentEvent.slug}`}>{externalLabel}</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-gutter right-gutter z-20 flex items-center gap-sm">
        {currentEvent && currentEvent.insta_permalink && (
          <a
            href={currentEvent.insta_permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-xs px-sm py-1 rounded-full bg-black/50 backdrop-blur-md text-white font-label-sm text-label-sm hover:bg-[#E1306C]/80 transition-colors"
          >
            <Instagram className="w-3.5 h-3.5" />
            Instagram
          </a>
        )}
        <span className="flex items-center gap-xs px-sm py-1 rounded-full bg-black/50 backdrop-blur-md text-white font-label-sm text-label-sm">
          <Images className="w-3.5 h-3.5" />
          {currentImageCount}
        </span>
      </div>

      {events.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-gutter top-1/2 -translate-y-1/2 z-20 p-sm rounded-full bg-background/60 backdrop-blur-md border border-outline-variant text-on-surface hover:text-primary hover:bg-background transition-colors"
            aria-label="Previous featured event"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-gutter top-1/2 -translate-y-1/2 z-20 p-sm rounded-full bg-background/60 backdrop-blur-md border border-outline-variant text-on-surface hover:text-primary hover:bg-background transition-colors"
            aria-label="Next featured event"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          <div className="absolute bottom-md left-1/2 -translate-x-1/2 z-20 flex items-center gap-md">
            <button
              type="button"
              onClick={() => setIsPaused((p) => !p)}
              className="p-xs rounded-full bg-background/60 backdrop-blur-md border border-outline-variant text-on-surface hover:text-primary hover:bg-background transition-colors"
              aria-label={isPaused ? "Play slideshow" : "Pause slideshow"}
              aria-pressed={isPaused}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
            <div
              className="flex items-center gap-sm"
              role="group"
              aria-label="Featured event navigation"
            >
              {events.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    setCurrent(index);
                    setImg(0);
                  }}
                  aria-label={`Go to slide ${index + 1}`}
                  aria-current={index === current}
                  className={cn(
                    "group h-1.5 flex-1 overflow-hidden rounded-full transition-colors",
                    index === current
                      ? "bg-on-surface-variant/40"
                      : "bg-on-surface-variant/20 hover:bg-on-surface-variant/40"
                  )}
                  style={{ minWidth: 28, maxWidth: 40 }}
                >
                  {index === current && (
                    <span
                      key={`${current}-${index}`}
                      className="carousel-progress-fill block h-full w-full bg-primary"
                      style={{
                        animationDuration: `${currentSlideTicks}s`,
                        animationPlayState: paused ? "paused" : "running",
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {currentEvent?.title}, {currentEvent && formatEventDate(currentEvent.start_date)}
      </div>
    </section>
  );
}
