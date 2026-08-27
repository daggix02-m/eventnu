'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { useAppShellScroll } from '@/lib/hooks/useAppShellScroll'

export function MainContent({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  const pathname = usePathname()
  const scrollRef = useAppShellScroll()
  const isAuth = pathname.startsWith('/auth')

  return (
    <main
      ref={scrollRef}
      id="main-content"
      className={
        isAuth
          ? 'flex-1 min-h-0 overflow-y-auto overscroll-contain overflow-x-clip'
          : 'flex-1 min-h-0 overflow-y-auto overscroll-contain pb-tabbar-safe md:pb-0 overflow-x-clip'
      }
      tabIndex={-1}
    >
      {children}
      {footer}
    </main>
  )
}
