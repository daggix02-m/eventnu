'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap'
import { CategoryBentoCard } from './CategoryBentoCard'
import { InterestScroller } from './InterestScroller'
import type { CategoryWithCount } from '@/lib/api/events'

const BENTO_SPANS = [
  'md:col-span-8 md:row-span-2',
  'md:col-span-4 md:row-span-2',
  'md:col-span-4',
  'md:col-span-4',
  'md:col-span-4',
  'md:col-span-8',
]

const CATEGORY_POSTERS: Record<string, string> = {
  nightlife: '/images/events/july-20-26/night-shift.png',
  music: '/images/events/june-22-28/hiphop.png',
  'arts-culture': '/images/events/july-6-12/free-form.png',
  'food-drink': '/images/events/july-13-19/feta-socity.png',
  'sports-fitness': '/images/events/july-01-05/adventure.png',
  'tech-innovation': '/images/events/july-01-05/solo-exibition.png',
}

interface CategoriesClientProps {
  categories: CategoryWithCount[]
}

export function CategoriesClient({ categories }: CategoriesClientProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const bentoGridRef = useRef<HTMLDivElement>(null)
  const scrollerSectionRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      if (headerRef.current) {
        const h1 = headerRef.current.querySelector('h1')
        const p = headerRef.current.querySelector('p')
        if (h1) gsap.set(h1, { opacity: 0, y: 20 })
        if (p) gsap.set(p, { opacity: 0, y: 16 })

        if (h1) tl.to(h1, { opacity: 1, y: 0, duration: 0.5 })
        if (p) tl.to(p, { opacity: 1, y: 0, duration: 0.5 }, '-=0.3')
      }

      if (bentoGridRef.current) {
        const cards = bentoGridRef.current.children
        gsap.set(cards, { opacity: 0, y: 24 })
        tl.to(cards, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 }, '-=0.2')
      }

      if (scrollerSectionRef.current) {
        const h2 = scrollerSectionRef.current.querySelector('h2')
        const pills = scrollerSectionRef.current.querySelectorAll("a[href*='/categories/']")
        if (h2) gsap.set(h2, { opacity: 0, y: 12 })
        gsap.set(pills, { opacity: 0, y: 12 })

        if (h2) tl.to(h2, { opacity: 1, y: 0, duration: 0.4 }, '-=0.1')
        tl.to(pills, { opacity: 1, y: 0, duration: 0.35, stagger: 0.04 }, '-=0.2')
      }
    },
    { scope: sectionRef },
  )

  const sortedCategories = [...categories]
    .filter((category) => !category.parent_id)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  return (
    <main ref={sectionRef} className="max-w-container-max mx-auto px-gutter py-xl">
      <div ref={headerRef} className="mb-xl">
        <h1 className="font-display text-display-lg-mobile md:text-display-lg text-on-surface mb-xs">
          Pick Your Vibe
        </h1>
        <p className="text-on-surface-variant text-body-lg max-w-[42rem]">
          From the neon pulse of nightlife to the curated silence of art galleries, find where you
          belong in the city tonight.
        </p>
      </div>

      <div ref={bentoGridRef} className="grid grid-cols-1 md:grid-cols-12 gap-md auto-rows-[280px]">
        {sortedCategories.map((category, i) => (
          <CategoryBentoCard
            key={category.id}
            name={category.name}
            slug={category.slug}
            description={category.description}
            icon={category.icon}
            eventCount={category.eventCount}
            imageUrl={CATEGORY_POSTERS[category.slug]}
            span={BENTO_SPANS[i % BENTO_SPANS.length]}
          />
        ))}
      </div>

      <div ref={scrollerSectionRef} className="mt-xl">
        <h2 className="font-display text-headline-md text-on-surface mb-md">Browse by Interest</h2>
        <InterestScroller categories={sortedCategories} />
      </div>
    </main>
  )
}
