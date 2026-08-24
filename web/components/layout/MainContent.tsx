'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

export function MainContent({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isAuth = pathname.startsWith('/auth')

  return (
    <main
      id="main-content"
      className={isAuth ? 'overflow-x-clip' : 'min-h-dvh pb-24 md:pb-0 overflow-x-clip'}
      tabIndex={-1}
    >
      {children}
    </main>
  )
}
