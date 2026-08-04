import { getCategories } from '@/lib/actions/categories'
import { getHosts } from '@/lib/actions/hosts'
import { CreateEventClient } from '@/components/CreateEventClient'

export default async function CreateEventPage() {
  const [categories, { hosts }] = await Promise.all([
    getCategories(),
    getHosts({ status: 'active', perPage: 200 }),
    { organizers: [] },
  ])

  return (
    <CreateEventClient
      categories={categories}
      hosts={hosts ?? []}
      organizers={[]}
    />
  )
}
