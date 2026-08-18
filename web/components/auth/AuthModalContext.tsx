'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { SignInDrawer } from '@/components/auth/SignInDrawer'

interface AuthModalContextValue {
  openAuth: () => void
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null)

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  const openAuth = useCallback(() => setOpen(true), [])

  const value = useMemo(() => ({ openAuth }), [openAuth])

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <SignInDrawer open={open} onOpenChange={setOpen} />
    </AuthModalContext.Provider>
  )
}

export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext)
  if (!ctx) throw new Error('useAuthModal must be used within AuthModalProvider')
  return ctx
}
