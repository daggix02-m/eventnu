'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CalendarDays, Bookmark, User, Camera, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConvexAuth } from '@convex-dev/auth/react'
import { useAuthRedirect } from '@/components/auth/AuthRedirectContext'

interface TabDef {
  key: string
  label: string
  href: string
  icon: LucideIcon
  requiresAuth?: boolean
}

const LEFT_TABS: TabDef[] = [
  { key: 'home', label: 'Home', href: '/', icon: Home },
  { key: 'schedule', label: 'Schedule', href: '/schedule', icon: CalendarDays },
]

const RIGHT_TABS: TabDef[] = [
  { key: 'saved', label: 'Saved', href: '/saved', icon: Bookmark, requiresAuth: true },
  { key: 'profile', label: 'Profile', href: '/profile', icon: User, requiresAuth: true },
]

function isTabActive(tab: TabDef, pathname: string): boolean {
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
      return pathname === '/saved'
    case 'profile':
      return pathname === '/profile'
    default:
      return false
  }
}

function TabLink({
  tab,
  pathname,
  isAuthenticated,
  openAuth,
}: {
  tab: TabDef
  pathname: string
  isAuthenticated: boolean
  openAuth: (redirectTo?: string) => void
}) {
  const isActive = isTabActive(tab, pathname)
  const Icon = tab.icon
  return (
    <Link
      key={tab.key}
      href={tab.href}
      onClick={(e) => {
        if (tab.requiresAuth && !isAuthenticated) {
          e.preventDefault()
          openAuth(tab.href)
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
        {isActive && <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-primary z-10" />}
      </div>
    </Link>
  )
}

/**
 * Snapchat-style center action: a raised gradient-ring camera that pops out of
 * the pill bar. The gradient ring matches the story-avatar treatment on the
 * home rail so the Stories surface reads as one family.
 */
function CameraButton({ pathname }: { pathname: string }) {
  const isActive = pathname === '/stories'
  return (
    <Link
      href="/stories"
      aria-label="Create a story"
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'group relative -mt-3 flex h-14 w-14 shrink-0 items-center justify-center rounded-full',
        'bg-gradient-to-tr from-primary via-secondary to-tertiary p-[3px]',
        'shadow-[0_6px_20px_rgba(160,120,255,0.45)] ring-1 ring-white/20 transition-all duration-200',
        'active:scale-90',
        isActive && 'shadow-[0_6px_24px_rgba(160,120,255,0.75)] ring-2 ring-white/60',
      )}
    >
      <span className="flex h-full w-full items-center justify-center rounded-full bg-background">
        <Camera
          className={cn(
            'h-6 w-6 transition-all duration-200',
            isActive ? 'text-primary scale-105' : 'text-primary/80 group-hover:text-primary',
          )}
          aria-hidden="true"
        />
      </span>
    </Link>
  )
}

function TabBarContent() {
  const pathname = usePathname()
  const { isAuthenticated } = useConvexAuth()
  const { openAuth } = useAuthRedirect()

  return (
    <nav
      aria-label="Primary Mobile Navigation"
      className="pointer-events-auto flex items-center justify-around w-full max-w-[22rem] bg-surface-container-low/70 backdrop-blur-2xl backdrop-saturate-150 border border-white/[0.12] rounded-full shadow-[0_16px_40px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.2)] px-2 pt-2 pb-1.5 transition-all duration-300"
    >
      {LEFT_TABS.map((tab) => (
        <TabLink
          key={tab.key}
          tab={tab}
          pathname={pathname}
          isAuthenticated={isAuthenticated}
          openAuth={openAuth}
        />
      ))}

      <CameraButton pathname={pathname} />

      {RIGHT_TABS.map((tab) => (
        <TabLink
          key={tab.key}
          tab={tab}
          pathname={pathname}
          isAuthenticated={isAuthenticated}
          openAuth={openAuth}
        />
      ))}
    </nav>
  )
}

export function BottomTabBar() {
  const pathname = usePathname()
  if (pathname.startsWith('/auth')) return null

  return (
    <div className="fixed bottom-[max(0.85rem,env(safe-area-inset-bottom))] inset-x-0 z-60 md:hidden flex justify-center px-4 pointer-events-none">
      <Suspense fallback={null}>
        <TabBarContent />
      </Suspense>
    </div>
  )
}
