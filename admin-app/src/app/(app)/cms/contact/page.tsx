import { getContactSubmissions } from '@/lib/actions/cms'
import { ContactSubmissionsClient } from '@/components/cms/ContactSubmissionsClient'

export default async function ContactSubmissionsPage() {
  let submissions: Awaited<ReturnType<typeof getContactSubmissions>> = []
  try {
    submissions = await getContactSubmissions()
  } catch (err) {
    console.error('Failed to load contact submissions:', err)
  }
  return <ContactSubmissionsClient submissions={submissions} />
}
