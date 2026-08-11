'use client'

import Link from 'next/link'
import type { Category } from '@/types'
import { getCategoryIcon } from '@/lib/category-icons'
import { cn } from '@/lib/utils'

const INTEREST_PRESETS: Category[] = [
  { id: 'fallback-music', slug: 'music', name: 'Music' },
  { id: 'fallback-arts', slug: 'arts-culture', name: 'Arts & Culture' },
  { id: 'fallback-nightlife', slug: 'nightlife', name: 'Nightlife' },
  { id: 'fallback-food', slug: 'food-drink', name: 'Food & Drink' },
  { id: 'fallback-sports', slug: 'sports-fitness', name: 'Sports & Fitness' },
  { id: 'fallback-tech', slug: 'tech-innovation', name: 'Tech & Innovation' },
]

interface InterestScrollerProps {
  categories: Category[]
}

export function InterestScroller({ categories }: InterestScrollerProps) {
  const interests = categories.length > 0 ? categories : INTEREST_PRESETS

  return (
    <div className="overflow-x-auto scrollbar-hide -mx-gutter px-gutter pb-4">
      <div className="flex gap-sm min-w-max">
        {interests.map((item) => {
          const Icon = getCategoryIcon(item.icon, item.slug)

          return (
            <Link
              key={item.id}
              href={`/categories/${item.slug}`}
              className={cn(
                'flex-shrink-0 px-6 py-3 rounded-xl',
                'bg-surface-container-high border border-outline-variant',
                'hover:border-primary transition-all duration-200',
                'flex items-center gap-sm',
                'cursor-pointer',
              )}
            >
              <Icon className="w-5 h-5 text-primary" />
              <span className="font-body-md text-body-md text-on-surface">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
