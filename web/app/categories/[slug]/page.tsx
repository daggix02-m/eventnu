import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { EventList } from "@/components/events/EventList";
import { getCategoryBySlug, getEventsByCategory } from "@/lib/api/events";

export const revalidate = 60;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  return {
    title: category ? `${category.name} Events | Event Nu` : "Category | Event Nu",
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const events = await getEventsByCategory(category.id);

  return (
    <Container className="py-xl space-y-xl">
      <div className="space-y-sm">
        <h1 className="font-display text-display-lg-mobile md:text-display-lg">
          {category.name} Events
        </h1>
        {category.description && (
          <p className="text-on-surface-variant text-body-lg">{category.description}</p>
        )}
      </div>
      <EventList
        events={events}
        emptyMessage="No upcoming events in this category. Check back soon."
      />
    </Container>
  );
}
