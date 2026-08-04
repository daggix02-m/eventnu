import { getAnnouncements } from '@/lib/actions/cms'
import { AnnouncementsClient } from '@/components/cms/AnnouncementsClient'

export default async function AnnouncementsPage() {
  const announcements = await getAnnouncements()
  return <AnnouncementsClient announcements={announcements} />
}
