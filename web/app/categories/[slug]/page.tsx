import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { EventList } from '@/components/events/EventList'
import { getCategoryBySlug, getEventsByCategory, getCategoriesWithCounts } from '@/lib/api/events'
import { getCategoryIcon } from '@/lib/category-icons'

export const revalidate = 300
export const dynamic = 'force-static'

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) return { title: 'Category | Event Nu' }
  return {
    title: `${category.name} Events | Event Nu`,
    description:
      category.description ??
      `Discover ${category.name} events in Addis Ababa — concerts, experiences, and more.`,
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const [category, categories] = await Promise.all([
    getCategoryBySlug(slug),
    getCategoriesWithCounts(),
  ])

  if (!category) {
    notFound()
  }

  const events = await getEventsByCategory(category.id)
  const subCategories = categories.filter((c) => c.parent_id === category.id)
  const Icon = getCategoryIcon(category.icon, category.slug)

  return (
    <Container className="py-xl space-y-xl">
      <div className="space-y-md">
        <Link
          href="/categories"
          className="inline-flex items-center gap-xs text-body-md text-on-surface-variant hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          All categories
        </Link>

        <div className="flex items-center gap-md">
          <span className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <Icon className="w-6 h-6 text-primary" aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-display text-display-lg-mobile md:text-display-lg">
              {category.name} Events
            </h1>
            <p className="font-mono text-label-sm text-on-surface-variant uppercase tracking-wider">
              {events.length} event{events.length !== 1 ? 's' : ''} listed
            </p>
          </div>
        </div>

        {category.description && (
          <p className="text-on-surface-variant text-body-lg">{category.description}</p>
        )}
      </div>

      {subCategories.length > 0 && (
        <nav className="flex flex-wrap gap-xs" aria-label="Subcategories">
          {subCategories.map((sub) => (
            <Link
              key={sub.id}
              href={`/categories/${sub.slug}`}
              className="px-md py-2 rounded-full border border-outline-variant bg-surface-container/40 text-body-md text-on-surface-variant hover:text-primary hover:border-primary transition-colors"
            >
              {sub.name}
            </Link>
          ))}
        </nav>
      )}

      <EventList
        events={events}
        emptyMessage="No events listed in this category yet. Check back soon."
      />
    </Container>
  )
}
