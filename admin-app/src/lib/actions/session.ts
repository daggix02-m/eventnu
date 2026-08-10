'use server'

import { fetchQuery } from '@/lib/actions/authedFetch'
import { api } from '@eventnu/convex/_generated/api'
import type { Doc } from '@eventnu/convex/_generated/dataModel'

export async function getCurrentAdminProfile(): Promise<Doc<'profiles'> | null> {
  try {
    return await fetchQuery(api.profiles.getMe)
  } catch (err) {
    console.error('Failed to load admin profile:', err)
    return null
  }
}
