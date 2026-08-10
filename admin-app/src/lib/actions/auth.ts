'use server'

import { fetchAction } from '@/lib/actions/authedFetch'
import { api } from '@eventnu/convex/_generated/api'

export async function changePassword(currentPassword: string, newPassword: string) {
  return await fetchAction(api.verifyPassword.changePassword, {
    currentPassword,
    newPassword,
  })
}
