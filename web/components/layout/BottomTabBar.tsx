'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Compass, LayoutGrid, Bookmark, User, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConvexAuth } from '@convex-dev/auth/react'
import { useAuthModal } from '@/components/auth/AuthModalContext'

interface TabDef {
  key: string
  label: string
  href: string
  icon: LucideIcon
  requiresAuth?: boolean
}

const TABS: TabDef[] = [
  { key: 'home', label: 'Home', href: '/', icon: Compass },
  { key: 'categories', label: 'Categories', href: '/categories', icon: LayoutGrid },
  {
    key: 'saved',
    label: 'Saved',
    href: '/profile?tab=bookmarks',
    icon: Bookmark,
    requiresAuth: true,
  },
  { key: 'profile', label: 'Profile', href: '/profile', icon: User, requiresAuth: true },
]

function isTabActive(tab: TabDef, pathname: string, tabParam: string | null): boolean {
  switch (tab.key) {
    case 'home':
      return pathname === '/'
    case 'categories':
      return pathname === '/categories' || pathname.startsWith('/categories/')
    case 'saved':
      return pathname === '/profile' && tabParam === 'bookmarks'
    case 'profile':
      return pathname === '/profile' && tabParam !== 'bookmarks'
    default:
      return false
  }
}

function TabBarContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { isAuthenticated } = useConvexAuth()
  const { openAuth } = useAuthModal()
  const tabParam = searchParams.get('tab')

  return (
    <nav
      aria-label="Primary"
      className="flex items-stretch justify-around h-[var(--spacing-tabbar)] px-sm pb-safe bg-surface-container-low/85 backdrop-blur-md border-t border-outline-variant"
    >
      {TABS.map((tab) => {
        const isActive = isTabActive(tab, pathname, tabParam)
        const Icon = tab.icon
        return (
          <Link
            key={tab.key}
            href={tab.href}
            onClick={(e) => {
              if (tab.requiresAuth && !isAuthenticated) {
                e.preventDefault()
                openAuth()
              }
            }}
            aria-current={isActive ? 'page' : undefined}
            className="tap-feedback flex flex-1 items-center justify-center h-full"
          >
            <span
              className={cn(
                'flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-colors duration-200',
                isActive ? 'bg-primary/20 text-primary' : 'text-on-surface-variant',
              )}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span className={cn('font-label-sm text-label-sm', isActive && 'font-bold')}>
                {tab.label}
              </span>
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

export function BottomTabBar() {
  return (
    <div className="fixed bottom-0 inset-x-0 z-50 md:hidden">
      <Suspense fallback={null}>
        <TabBarContent />
      </Suspense>
    </div>
  )
}
