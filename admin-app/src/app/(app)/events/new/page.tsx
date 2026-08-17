import { getCategories } from '@/lib/actions/categories'
import { getAllOrganizers } from '@/lib/actions/organizers'
import { getFeaturedSections } from '@/lib/actions/settings'
import { EventForm } from '@/components/events/EventForm'

export default async function CreateEventPage() {
  let allCategories: Awaited<ReturnType<typeof getCategories>> = []
  let organizersList: Awaited<ReturnType<typeof getAllOrganizers>> = []
  let featuredSections: Awaited<ReturnType<typeof getFeaturedSections>> = []
  try {
    ;[allCategories, organizersList, featuredSections] = await Promise.all([
      getCategories(),
      getAllOrganizers(),
      getFeaturedSections(),
    ])
  } catch (err) {
    console.error('Failed to load event form data:', err)
  }

  return (
    <EventForm
      mode="create"
      categories={allCategories}
      organizers={organizersList ?? []}
      featuredSections={featuredSections}
    />
  )
}
