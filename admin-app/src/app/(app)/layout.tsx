import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { IdleTimeout } from '@/components/layout/IdleTimeout'
import { AccountRestrictedScreen } from '@/components/layout/AccountRestrictedScreen'
import { getCurrentAdminProfile } from '@/lib/actions/session'

export const dynamic = 'force-dynamic'

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const profile = await getCurrentAdminProfile()
  if (!profile) redirect('/auth/sign-in')
  if (profile.suspended) return <AccountRestrictedScreen reason="suspended" />
  if (profile.role !== 'admin') return <AccountRestrictedScreen reason="not-admin" />

  return (
    <AppShell>
      <IdleTimeout />
      {children}
    </AppShell>
  )
}
