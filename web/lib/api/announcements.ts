import 'server-only'
import { fetchQuery } from 'convex/nextjs'
import type { FunctionReturnType } from 'convex/server'
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server'
import { api } from '@eventnu/convex/_generated/api'
import type { Announcement } from '@/types'

type RawAnnouncement = FunctionReturnType<
  typeof api.cms.announcements.getActiveAnnouncements
>[number]

export async function getActiveAnnouncements(): Promise<Announcement[]> {
  try {
    const token = await convexAuthNextjsToken()
    const announcements = await fetchQuery(
      api.cms.announcements.getActiveAnnouncements,
      { now: Date.now() },
      token ? { token } : undefined,
    )
    return (announcements ?? []).map((raw: RawAnnouncement) => ({
      id: raw._id,
      title: raw.title,
      message: raw.message,
      link_url: raw.linkUrl,
      link_text: raw.linkText,
      is_active: raw.isActive,
      starts_at: raw.startsAt ? new Date(raw.startsAt).toISOString() : null,
      ends_at: raw.endsAt ? new Date(raw.endsAt).toISOString() : null,
      created_at: raw._creationTime ? new Date(raw._creationTime).toISOString() : undefined,
    }))
  } catch (err) {
    console.error('Failed to fetch active announcements:', err)
    return []
  }
}
