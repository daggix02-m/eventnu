'use client'

import { createContext, useCallback, useContext, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { rememberAuthRedirect } from '@/lib/auth'

interface AuthRedirectContextValue {
  openAuth: (redirectTo?: string) => void
}

const AuthRedirectContext = createContext<AuthRedirectContextValue | null>(null)

export function AuthRedirectProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const openAuth = useCallback(
    (redirectTo?: string) => {
      if (pathname === '/auth') return
      rememberAuthRedirect(redirectTo ?? pathname, redirectTo ? '' : window.location.search)
      router.push('/auth?mode=signin')
    },
    [pathname, router],
  )

  const value = useMemo(() => ({ openAuth }), [openAuth])

  return <AuthRedirectContext.Provider value={value}>{children}</AuthRedirectContext.Provider>
}

export function useAuthRedirect(): AuthRedirectContextValue {
  const ctx = useContext(AuthRedirectContext)
  if (!ctx) throw new Error('useAuthRedirect must be used within AuthRedirectProvider')
  return ctx
}
