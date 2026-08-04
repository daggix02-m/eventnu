"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const BENTO_CONFIG: Record<
  string,
  {
    imageUrl: string;
    colSpan: string;
    rowSpan: string;
    label?: string;
    tags?: string[];
    subItems?: { name: string; detail: string }[];
    cta?: string;
  }
> = {
  nightlife: {
    imageUrl: "/images/events/july-20-26/night-shift.png",
    colSpan: "md:col-span-8",
    rowSpan: "md:row-span-2",
    label: "Trending Now",
    tags: ["Rooftop Bars", "Techno Clubs", "Jazz Lounges", "Late Night Dining"],
  },
  music: {
    imageUrl: "/images/events/june-22-28/hiphop.png",
    colSpan: "md:col-span-4",
    rowSpan: "md:row-span-1",
    tags: ["Outdoor", "Acoustic"],
  },
  "tech-innovation": {
    imageUrl: "/images/events/july-01-05/solo-exibition.png",
    colSpan: "md:col-span-4",
    rowSpan: "md:row-span-1",
    tags: ["Startup Meet", "Web3"],
  },
  "arts-culture": {
    imageUrl: "/images/events/july-6-12/free-form.png",
    colSpan: "md:col-span-4",
    rowSpan: "md:row-span-2",
    subItems: [
      { name: "Gallery Openings", detail: "12 Events this week" },
      { name: "Theater & Dance", detail: "New Season" },
    ],
  },
  "food-drink": {
    imageUrl: "/images/events/july-13-19/feta-socity.png",
    colSpan: "md:col-span-8",
    rowSpan: "md:row-span-1",
    cta: "Explore Hubs",
  },
};

interface CategoryBentoCardProps {
  name: string;
  slug: string;
  size?: "hero" | "standard";
}

export function CategoryBentoCard({ name, slug }: CategoryBentoCardProps) {
  const config = BENTO_CONFIG[slug];

  if (!config) return null;

  return (
    <Link
      href={`/categories/${slug}`}
      className={cn(
        "relative overflow-hidden rounded-xl group bento-hover cursor-pointer border border-outline-variant",
        config.colSpan,
        config.rowSpan
      )}
    >
      <div
        className="absolute inset-0 bg-cover bg-center category-bg transition-slow"
        style={{ backgroundImage: `url('${config.imageUrl}')` }}
      />
      <div className="absolute inset-0 category-gradient" />

      <div
        className={cn(
          "absolute inset-0 flex flex-col justify-end",
          slug === "nightlife" || slug === "community" ? "p-lg" : "p-md"
        )}
      >
        {config.label && (
          <span className="font-mono text-label-sm text-primary mb-2 uppercase tracking-widest">
            {config.label}
          </span>
        )}

        <h3
          className={cn(
            "font-display text-white mb-xs",
            slug === "nightlife"
              ? "text-display-lg-mobile md:text-display-lg mb-sm"
              : slug === "arts-culture" || slug === "food-drink"
                ? "text-display-lg-mobile"
                : "text-headline-md"
          )}
        >
          {name}
        </h3>

        {slug === "nightlife" && config.tags && (
          <div className="flex flex-wrap gap-xs">
            {config.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 glass-card rounded-full font-mono text-label-sm text-on-surface hover:bg-primary hover:text-on-primary transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {(slug === "music" || slug === "tech-innovation") && (
          <>
            <p className="font-body-md text-body-md text-on-surface-variant mb-sm">
              {slug === "music"
                ? "Live Music & Festivals"
                : "Workshops & Networking"}
            </p>
            {config.tags && (
              <div className="flex flex-wrap gap-xs">
                {config.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 border border-outline-variant rounded-full font-mono text-[10px] text-on-surface"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </>
        )}

        {slug === "arts-culture" && config.subItems && (
          <div className="space-y-sm">
            {config.subItems.map((item) => (
              <div
                key={item.name}
                className="p-sm glass-card rounded-lg border-primary/20 hover:border-primary/50 transition-colors"
              >
                <span className="font-body-md text-body-md block text-white">
                  {item.name}
                </span>
                <span className="font-mono text-label-sm text-primary">
                  {item.detail}
                </span>
              </div>
            ))}
          </div>
        )}

        {slug === "food-drink" && (
          <>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              Social hubs, meetups, and local impact events.
            </p>
            {config.cta && (
              <button className="mt-sm bg-primary text-on-primary px-6 py-3 rounded-full font-bold active:scale-95 transition-transform hidden sm:block">
                {config.cta}
              </button>
            )}
          </>
        )}
      </div>
    </Link>
  );
}
