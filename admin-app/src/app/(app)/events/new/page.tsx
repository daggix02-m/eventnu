import { getCategories } from '@/lib/actions/categories'
import { getHosts } from '@/lib/actions/hosts'
import { getOrganizers } from '@/lib/actions/organizers'
import { EventForm } from '@/components/event/EventForm'

export default async function CreateEventPage() {
  const [categories, { hosts }, { organizers }] = await Promise.all([
    getCategories(),
    getHosts({ status: 'active', perPage: 200 }),
    getOrganizers({ perPage: 200 }),
  ])

  return (
    <EventForm
      mode="create"
      categories={categories}
      hosts={hosts ?? []}
      organizers={organizers ?? []}
    />
  )
}
