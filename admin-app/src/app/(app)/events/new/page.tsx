import { getCategories } from '@/lib/actions/categories'
import { getAllHosts } from '@/lib/actions/hosts'
import { getAllOrganizers } from '@/lib/actions/organizers'
import { getFeaturedSections } from '@/lib/actions/settings'
import { EventForm } from '@/components/events/EventForm'

export default async function CreateEventPage() {
  let allCategories: Awaited<ReturnType<typeof getCategories>> = []
  let hostsList: Awaited<ReturnType<typeof getAllHosts>> = []
  let organizersList: Awaited<ReturnType<typeof getAllOrganizers>> = []
  let featuredSections: Awaited<ReturnType<typeof getFeaturedSections>> = []
  try {
    ;[allCategories, hostsList, organizersList, featuredSections] = await Promise.all([
      getCategories(),
      getAllHosts({ status: 'active' }),
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
      hosts={hostsList ?? []}
      organizers={organizersList ?? []}
      featuredSections={featuredSections}
    />
  )
}
