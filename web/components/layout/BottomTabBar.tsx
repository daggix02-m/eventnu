'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, CalendarDays, Bookmark, User, Camera, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConvexAuth } from '@convex-dev/auth/react'
import { useAuthRedirect } from '@/components/auth/AuthRedirectContext'
import { useTabShell } from '@/components/layout/TabShell'
import { StoryCameraOverlay } from '@/components/stories/camera/StoryCameraOverlay'

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
  const { navigate } = useTabShell()
  return (
    <Link
      key={tab.key}
      href={tab.href}
      prefetch={false}
      onClick={(e) => {
        if (tab.requiresAuth && !isAuthenticated) {
          e.preventDefault()
          openAuth(tab.href)
          return
        }
        // Route tab presses through the instant shell (skeleton + transition).
        e.preventDefault()
        navigate(tab.href)
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
 * the pill bar. It launches the in-app story camera overlay immediately
 * (auth-gated) instead of navigating — browsing stories lives on the profile
 * hub, the home rail, and /stories. The gradient ring matches the story-avatar
 * treatment on the home rail so the Stories surface reads as one family.
 */
function CameraButton({
  pathname,
  isAuthenticated,
  openAuth,
  onLaunch,
}: {
  pathname: string
  isAuthenticated: boolean
  openAuth: (redirectTo?: string) => void
  onLaunch: () => void
}) {
  return (
    <button
      type="button"
      aria-label="Create a story"
      onClick={() => {
        if (!isAuthenticated) {
          openAuth('/stories')
          return
        }
        onLaunch()
      }}
      className={cn(
        'group relative -mt-3 flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full',
        'bg-gradient-to-tr from-primary via-secondary to-tertiary p-[3px]',
        'shadow-[0_6px_20px_rgba(160,120,255,0.45)] ring-1 ring-white/20 transition-all duration-200',
        'active:scale-90',
      )}
    >
      <span className="flex h-full w-full items-center justify-center rounded-full bg-background">
        <Camera
          className="h-6 w-6 text-primary/80 transition-all duration-200 group-hover:text-primary"
          aria-hidden="true"
        />
      </span>
      <span className="sr-only">Stories</span>
    </button>
  )
}

function TabBarContent() {
  const pathname = usePathname()
  const { isAuthenticated } = useConvexAuth()
  const { openAuth } = useAuthRedirect()
  const [cameraOpen, setCameraOpen] = useState(false)

  return (
    <>
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

        <CameraButton
          pathname={pathname}
          isAuthenticated={isAuthenticated}
          openAuth={openAuth}
          onLaunch={() => setCameraOpen(true)}
        />

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

      {cameraOpen && <StoryCameraOverlay open onClose={() => setCameraOpen(false)} />}
    </>
  )
}

export function BottomTabBar() {
  const pathname = usePathname()
  if (pathname.startsWith('/auth')) return null

  return (
    <div className="fixed bottom-[calc(var(--keyboard-inset,0px)_+_env(safe-area-inset-bottom))] inset-x-0 z-60 md:hidden flex justify-center px-4 pointer-events-none">
      <Suspense fallback={null}>
        <TabBarContent />
      </Suspense>
    </div>
  )
}
