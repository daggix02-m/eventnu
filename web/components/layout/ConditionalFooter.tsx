'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

export function ConditionalFooter({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  if (pathname.startsWith('/auth')) return null
  return children
}
