'use server'

import { fetchQuery } from 'convex/nextjs'
import { api } from '../../../../web/convex/_generated/api'

export async function getCurrentAdminProfile() {
  try {
    const profile = await fetchQuery(api.profiles.getMe)
    return profile as { role: string; suspended: boolean } | null
  } catch {
    return null
  }
}
