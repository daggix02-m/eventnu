import { getContactSubmissions } from '@/lib/actions/cms'
import { ContactSubmissionsClient } from '@/components/cms/ContactSubmissionsClient'

export default async function ContactSubmissionsPage() {
  const submissions = await getContactSubmissions()
  return <ContactSubmissionsClient submissions={submissions} />
}
