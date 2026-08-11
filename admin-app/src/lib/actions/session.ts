'use server'

import { fetchQuery } from '@/lib/actions/authedFetch'
import { api } from '@eventnu/convex/_generated/api'
import type { Doc } from '@eventnu/convex/_generated/dataModel'

export async function getCurrentAdminProfile(): Promise<Doc<'profiles'> | null> {
  return fetchQuery(api.profiles.getMe)
}
