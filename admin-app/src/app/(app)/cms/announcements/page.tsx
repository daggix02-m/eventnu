import { getAnnouncements } from '@/lib/actions/cms'
import { AnnouncementsClient } from '@/components/cms/AnnouncementsClient'

export default async function AnnouncementsPage() {
  let announcements: Awaited<ReturnType<typeof getAnnouncements>> = []
  try {
    announcements = await getAnnouncements()
  } catch (err) {
    console.error('Failed to load announcements:', err)
  }
  return <AnnouncementsClient announcements={announcements} />
}
