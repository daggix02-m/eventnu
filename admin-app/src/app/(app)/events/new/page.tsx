import { getCategories } from '@/lib/actions/categories'
import { getHosts } from '@/lib/actions/hosts'
import { getOrganizers } from '@/lib/actions/organizers'
import { getFeaturedSections } from '@/lib/actions/settings'
import { EventForm } from '@/components/event/EventForm'

export default async function CreateEventPage() {
  let allCategories: Awaited<ReturnType<typeof getCategories>> = []
  let hostsList: Awaited<ReturnType<typeof getHosts>>['hosts'] = []
  let organizersList: Awaited<ReturnType<typeof getOrganizers>>['organizers'] = []
  let featuredSections: Awaited<ReturnType<typeof getFeaturedSections>> = []
  try {
    ;[allCategories, { hosts: hostsList }, { organizers: organizersList }, featuredSections] = await Promise.all([
      getCategories(),
      getHosts({ status: 'active', perPage: 200 }),
      getOrganizers({ perPage: 200 }),
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
