import { getContactSubmissions } from '@/lib/actions/cms'
import { ContactSubmissionsClient } from '@/components/cms/ContactSubmissionsClient'
import { logError } from '@/lib/logger'

export default async function ContactSubmissionsPage() {
  let submissions: Awaited<ReturnType<typeof getContactSubmissions>> = []
  try {
    submissions = await getContactSubmissions()
  } catch (err) {
    logError('admin/cms/contact', err)
  }
  return <ContactSubmissionsClient submissions={submissions} />
}
