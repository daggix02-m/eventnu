'use client'

import { useRouter } from 'next/navigation'
import { useAuthActions } from '@convex-dev/auth/react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'

export function AccountRestrictedScreen({ reason }: { reason: 'suspended' | 'not-admin' }) {
  const { signOut } = useAuthActions()
  const router = useRouter()
  const suspended = reason === 'suspended'

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/sign-in')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-low p-4">
      <Card className="w-full max-w-md border-0 shadow-xl rounded-2xl overflow-hidden bg-card">
        <CardHeader className="space-y-2 text-center pb-2">
          <CardTitle className="font-headline text-xl font-semibold tracking-tight text-foreground">
            {suspended ? 'Account suspended' : 'Access restricted'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            {suspended
              ? 'Your admin account has been suspended. If you believe this is a mistake, contact another administrator.'
              : 'Your account does not have admin access to this dashboard.'}
          </p>
          <Button className="w-full h-11" onClick={handleSignOut}>
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
