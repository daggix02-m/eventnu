"use client";

import { useRef } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { Container } from "@/components/layout/Container";
import { CategoryBentoCard } from "./CategoryBentoCard";
import { InterestScroller } from "./InterestScroller";
import type { Category } from "@/types";

const BENTO_ITEMS = [
  { name: "Nightlife", slug: "nightlife" },
  { name: "Music", slug: "music" },
  { name: "Tech & Innovation", slug: "tech-innovation" },
  { name: "Arts & Culture", slug: "arts-culture" },
  { name: "Food & Drink", slug: "food-drink" },
];

interface CategoriesClientProps {
  categories: Category[];
}

export function CategoriesClient({ categories }: CategoriesClientProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const bentoGridRef = useRef<HTMLDivElement>(null);
  const scrollerSectionRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    if (headerRef.current) {
      const h1 = headerRef.current.querySelector("h1");
      const p = headerRef.current.querySelector("p");
      if (h1) gsap.set(h1, { opacity: 0, y: 20 });
      if (p) gsap.set(p, { opacity: 0, y: 16 });

      if (h1) tl.to(h1, { opacity: 1, y: 0, duration: 0.5 });
      if (p) tl.to(p, { opacity: 1, y: 0, duration: 0.5 }, "-=0.3");
    }

    if (bentoGridRef.current) {
      const cards = bentoGridRef.current.children;
      gsap.set(cards, { opacity: 0, y: 24 });
      tl.to(cards, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 }, "-=0.2");
    }

    if (scrollerSectionRef.current) {
      const h2 = scrollerSectionRef.current.querySelector("h2");
      const viewAll = scrollerSectionRef.current.querySelector("a");
      const pills = scrollerSectionRef.current.querySelectorAll("a[href*='/categories/']");
      if (h2) gsap.set(h2, { opacity: 0, y: 12 });
      if (viewAll) gsap.set(viewAll, { opacity: 0 });
      gsap.set(pills, { opacity: 0, y: 12 });

      if (h2) tl.to(h2, { opacity: 1, y: 0, duration: 0.4 }, "-=0.1");
      if (viewAll) tl.to(viewAll, { opacity: 1, duration: 0.3 }, "-=0.2");
      tl.to(pills, { opacity: 1, y: 0, duration: 0.35, stagger: 0.04 }, "-=0.2");
    }
  }, { scope: sectionRef });

  return (
    <main
      ref={sectionRef}
      className="max-w-container-max mx-auto px-gutter py-xl"
    >
      <div ref={headerRef} className="mb-xl">
        <h1 className="font-display text-display-lg-mobile md:text-display-lg text-on-surface mb-xs">
          Pick Your Vibe
        </h1>
        <p className="text-on-surface-variant text-body-lg max-w-2xl">
          From the neon pulse of nightlife to the curated silence of art
          galleries, find where you belong in the city tonight.
        </p>
      </div>

      <div
        ref={bentoGridRef}
        className="grid grid-cols-1 md:grid-cols-12 gap-md auto-rows-[280px]"
      >
        {BENTO_ITEMS.map((item) => (
          <CategoryBentoCard
            key={item.slug}
            name={item.name}
            slug={item.slug}
          />
        ))}
      </div>

      <div ref={scrollerSectionRef} className="mt-xl">
        <div className="flex items-center justify-between mb-md">
          <h2 className="font-display text-headline-md text-on-surface">
            Browse by Interest
          </h2>
          <Link
            href="/categories"
            className="text-primary font-body-md text-body-md hover:underline"
          >
            View All
          </Link>
        </div>
        <InterestScroller categories={categories} />
      </div>
    </main>
  );
}
