import { getAnnouncements } from '@/lib/actions/cms'
import { AnnouncementsClient } from '@/components/cms/AnnouncementsClient'
import { logError } from '@/lib/logger'

export default async function AnnouncementsPage() {
  let announcements: Awaited<ReturnType<typeof getAnnouncements>> = []
  try {
    announcements = await getAnnouncements()
  } catch (err) {
    logError('admin/cms/announcements', err)
  }
  return <AnnouncementsClient announcements={announcements} />
}
