import { getUserById } from '@/lib/actions/users'
import { getCurrentAdminProfile } from '@/lib/actions/session'
import { UserDetailClient } from '@/components/users/UserDetailClient'
import { logError } from '@/lib/logger'

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let profile: Awaited<ReturnType<typeof getUserById>>['profile'] = null
  let stats: Awaited<ReturnType<typeof getUserById>>['stats'] = null
  try {
    ;({ profile, stats } = await getUserById(id))
  } catch (err) {
    logError('admin/users/[id]', err)
  }

  let currentAdmin = null
  try {
    currentAdmin = await getCurrentAdminProfile()
  } catch (err) {
    logError('admin/users/[id]:profile', err)
  }

  if (!profile) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>User not found.</p>
      </div>
    )
  }

  return (
    <UserDetailClient
      profile={profile}
      stats={stats}
      currentAdminId={currentAdmin?.authUserId ?? null}
    />
  )
}
