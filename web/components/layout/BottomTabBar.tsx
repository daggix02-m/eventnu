'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Home, CalendarDays, Bookmark, User, type LucideIcon } from 'lucide-react'
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
  { key: 'home', label: 'Home', href: '/', icon: Home },
  { key: 'schedule', label: 'Schedule', href: '/schedule', icon: CalendarDays },
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
    case 'schedule':
      return (
        pathname === '/schedule' ||
        pathname.startsWith('/schedule/') ||
        pathname === '/categories' ||
        pathname.startsWith('/categories/')
      )
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
      aria-label="Primary Mobile Navigation"
      className="pointer-events-auto flex items-center justify-around w-full max-w-[22rem] bg-surface-container-low/70 backdrop-blur-2xl backdrop-saturate-150 border border-white/[0.12] rounded-full shadow-[0_16px_40px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.2)] px-2 py-1.5 transition-all duration-300"
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
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
            className="relative flex flex-1 items-center justify-center py-1 text-center select-none group min-w-0 transition-transform duration-150 active:scale-90"
          >
            <div
              className={cn(
                'relative flex flex-col items-center justify-center w-12 h-11 rounded-full transition-all duration-200',
                isActive ? 'text-white' : 'text-white/45 hover:text-white/80 hover:bg-white/[0.05]',
              )}
            >
              {/* Active glassy pill background */}
              {isActive && (
                <div className="absolute inset-0 rounded-full bg-white/[0.12] border border-white/[0.18] animate-in fade-in zoom-in-95 duration-200" />
              )}
              <Icon
                className={cn(
                  'w-5.5 h-5.5 transition-all duration-200 z-10',
                  isActive ? 'stroke-[2.5] text-white scale-110' : 'stroke-[1.75]',
                )}
                aria-hidden="true"
              />
              {/* Active dot indicator */}
              {isActive && (
                <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-primary z-10" />
              )}
            </div>
          </Link>
        )
      })}
    </nav>
  )
}

export function BottomTabBar() {
  return (
    <div className="fixed bottom-[max(0.85rem,env(safe-area-inset-bottom))] inset-x-0 z-60 md:hidden flex justify-center px-4 pointer-events-none">
      <Suspense fallback={null}>
        <TabBarContent />
      </Suspense>
    </div>
  )
}
