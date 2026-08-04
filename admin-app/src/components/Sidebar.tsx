'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  CalendarDays,
  Building2,
  Users,
  UserCog,
  Flag,
  Tags,
  BarChart3,
  Bell,
  Settings,
  HelpCircle,
  Plus,
  LogOut,
  Menu,
  X,
  FileText,
} from 'lucide-react'
import { useState } from 'react'
import { useAuthActions } from '@convex-dev/auth/react'
import { useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '../../../web/convex/_generated/api'

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Events', href: '/events', icon: CalendarDays, badge: 'pendingReview' },
  { label: 'Hosts', href: '/hosts', icon: Building2 },
  { label: 'Organizers', href: '/organizers', icon: UserCog },
  { label: 'Users', href: '/users', icon: Users },
  { label: 'Reports', href: '/reports', icon: Flag, badge: 'openReports' },
  { label: 'Categories', href: '/categories', icon: Tags },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'CMS', href: '/cms', icon: FileText },
]

const bottomNavItems = [
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Support', href: '/support', icon: HelpCircle },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useAuthActions()
  const [mobileOpen, setMobileOpen] = useState(false)
  const navCounts = useQuery(api.dashboard.getNavCounts)

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/sign-in')
    router.refresh()
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card rounded-lg shadow-md border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        aria-expanded={mobileOpen}
        aria-controls="sidebar-navigation"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col h-screen fixed left-0 top-0 z-40 bg-surface dark:bg-surface-container w-[260px] border-r border-outline-variant dark:border-outline shadow-sm transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-surface-container-high rounded-lg flex items-center justify-center text-muted-foreground">
            <CalendarDays size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary leading-tight">Event Nu Admin</h1>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Enterprise Suite</p>
          </div>
        </div>

        {/* Main Nav */}
        <nav id="sidebar-navigation" aria-label="Main" className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium text-sm',
                isActive(item.href)
                  ? 'bg-secondary-fixed text-on-secondary-fixed-variant border-l-4 border-secondary font-bold'
                  : 'text-muted-foreground hover:bg-surface-container-high dark:hover:bg-surface-container-highest'
              )}
            >
              <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-muted-foreground">
                <item.icon size={16} />
              </div>
              <span className="flex-1">{item.label}</span>
              {/* Badges */}
              {item.badge === 'pendingReview' && navCounts && navCounts.pendingReview > 0 && (
                <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{navCounts.pendingReview}</span>
              )}
              {item.badge === 'openReports' && navCounts && navCounts.openReports > 0 && (
                <span className="bg-destructive text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{navCounts.openReports}</span>
              )}
            </Link>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t border-outline-variant">
          <Link
            href="/events/new"
            className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity mb-4"
          >
            <Plus size={18} />
            Create Event
          </Link>
          <div className="space-y-1">
            {bottomNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm',
                  isActive(item.href)
                    ? 'bg-surface-container-high text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-surface-container-high'
                )}
              >
                <div className="w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center text-muted-foreground">
                  <item.icon size={14} />
                </div>
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm text-muted-foreground hover:bg-surface-container-high hover:text-destructive"
            >
                <div className="w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center text-muted-foreground">
                  <LogOut size={14} />
                </div>
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 z-30 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  )
}
