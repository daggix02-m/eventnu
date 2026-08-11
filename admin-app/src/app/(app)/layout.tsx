import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { IdleTimeout } from '@/components/layout/IdleTimeout'
import { AccountRestrictedScreen } from '@/components/layout/AccountRestrictedScreen'
import { getCurrentAdminProfile } from '@/lib/actions/session'
import { getNavCounts } from '@/lib/actions/dashboard'

export const dynamic = 'force-dynamic'

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  let profile: Awaited<ReturnType<typeof getCurrentAdminProfile>> = null
  try {
    profile = await getCurrentAdminProfile()
  } catch (err) {
    console.error('Failed to load admin profile:', err)
  }
  if (!profile) redirect('/auth/sign-in')
  if (profile.suspended) return <AccountRestrictedScreen reason="suspended" />
  if (profile.role !== 'admin') return <AccountRestrictedScreen reason="not-admin" />

  let navCounts = { pendingReview: 0, openReports: 0 }
  try {
    navCounts = await getNavCounts()
  } catch (err) {
    console.error('Failed to load nav counts:', err)
  }

  return (
    <AppShell navCounts={navCounts}>
      <IdleTimeout />
      {children}
    </AppShell>
  )
}
