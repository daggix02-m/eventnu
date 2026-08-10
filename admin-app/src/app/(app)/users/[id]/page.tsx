import { getUserById } from '@/lib/actions/users'
import { getCurrentAdminProfile } from '@/lib/actions/session'
import { UserDetailClient } from '@/components/UserDetailClient'

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let profile: Awaited<ReturnType<typeof getUserById>>['profile'] = null
  let role: Awaited<ReturnType<typeof getUserById>>['role'] = null
  let stats: Awaited<ReturnType<typeof getUserById>>['stats'] = null
  try {
    ;({ profile, role, stats } = await getUserById(id))
  } catch (err) {
    console.error('Failed to load user:', err)
  }

  let currentAdmin = null
  try {
    currentAdmin = await getCurrentAdminProfile()
  } catch (err) {
    console.error('Failed to load admin profile:', err)
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
      role={role}
      stats={stats}
      currentAdminId={currentAdmin?._id ?? null}
    />
  )
}
