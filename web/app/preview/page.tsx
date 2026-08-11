import { AnnouncementBanner } from '@/components/events/AnnouncementBanner'
import { FeaturedCarousel } from '@/components/events/FeaturedCarousel'
import { getActiveAnnouncements } from '@/lib/api/announcements'
import { getPublishedEvents } from '@/lib/api/events'

export const dynamic = 'force-dynamic'

export default async function PreviewPage() {
  const [events, announcements] = await Promise.all([
    getPublishedEvents(),
    getActiveAnnouncements(),
  ])
  const recent = [...events].sort((a, b) => b.start_date.localeCompare(a.start_date)).slice(0, 3)
  return (
    <div>
      <AnnouncementBanner announcements={announcements} />
      <FeaturedCarousel events={recent} />
    </div>
  )
}
