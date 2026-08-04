import { getUserById } from '@/lib/actions/users'
import { UserDetailClient } from '@/components/UserDetailClient'

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { profile, role, stats } = await getUserById(id)

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
    />
  )
}
