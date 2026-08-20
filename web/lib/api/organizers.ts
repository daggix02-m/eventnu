import 'server-only'
import { cache } from 'react'
import type { FunctionReturnType } from 'convex/server'
import { api } from '@eventnu/convex/_generated/api'
import { createPublicClient } from '@/lib/api/public-client'
import { logError } from '@/lib/logger'

export type PublicOrganizerProfile = NonNullable<
  FunctionReturnType<typeof api.organizers.getByHandle>
>

export const getOrganizerByHandle = cache(
  async (handle: string): Promise<PublicOrganizerProfile | null> => {
    try {
      return await createPublicClient().query(api.organizers.getByHandle, { handle })
    } catch (err) {
      logError('organizers/getByHandle', err)
      return null
    }
  },
)
