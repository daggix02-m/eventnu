'use client'

import Link from 'next/link'
import Image from 'next/image'
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
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { useState } from 'react'
import { useAuthActions } from '@convex-dev/auth/react'
import { useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '@eventnu/convex/_generated/api'
import { useSidebar } from './sidebar-context'

const navGroups = [
  {
    label: 'Manage',
    items: [
      { label: 'Dashboard', href: '/', icon: LayoutDashboard },
      { label: 'Events', href: '/events', icon: CalendarDays, badge: 'pendingReview' },
      { label: 'Hosts', href: '/hosts', icon: Building2 },
      { label: 'Organizers', href: '/organizers', icon: UserCog },
      { label: 'Users', href: '/users', icon: Users },
      { label: 'Reports', href: '/reports', icon: Flag, badge: 'openReports' },
    ],
  },
  {
    label: 'Curate',
    items: [
      { label: 'Categories', href: '/categories', icon: Tags },
      { label: 'Analytics', href: '/analytics', icon: BarChart3 },
      { label: 'Notifications', href: '/notifications', icon: Bell },
      { label: 'CMS', href: '/cms', icon: FileText },
    ],
  },
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
  const { collapsed, toggleCollapsed } = useSidebar()
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card rounded-md shadow-md border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        aria-expanded={mobileOpen}
        aria-controls="sidebar-navigation"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar — the margin gloss of the manuscript */}
      <aside
        className={cn(
          'w-[260px] flex flex-col h-screen fixed left-0 top-0 z-40 bg-surface dark:bg-surface-container border-r border-outline-variant dark:border-outline transition-[width,transform] duration-300',
          collapsed && 'lg:w-[76px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Colophon */}
        <div className={cn(
          'px-4 pt-6 pb-5 flex items-center gap-3',
          collapsed && 'lg:px-0 lg:justify-center'
        )}>
          <Image
            src="/logo.png"
            alt="Event Nu"
            width={36}
            height={31}
            priority
            className="h-[31px] w-auto rounded-md"
          />
          <div className={cn('min-w-0', collapsed && 'lg:hidden')}>
            <h1 className="font-headline text-lg font-semibold text-foreground leading-tight truncate">Event Nu</h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Admin · Addissuite</p>
          </div>
        </div>

        {/* Main Nav */}
        <nav id="sidebar-navigation" aria-label="Main" className="flex-1 px-3 py-1 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-4">
              <p className={cn(
                'px-3 pt-4 pb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground',
                collapsed && 'lg:hidden'
              )}>
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm',
                      collapsed && 'lg:justify-center lg:px-0',
                      isActive(item.href)
                        ? 'bg-surface-container-high text-foreground font-semibold'
                        : 'text-muted-foreground hover:bg-surface-container hover:text-foreground'
                    )}
                  >
                    <div
                      className={cn(
                        'w-7 h-7 rounded-md flex items-center justify-center transition-colors',
                        isActive(item.href)
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground'
                      )}
                    >
                      <item.icon size={15} />
                    </div>
                    <span className={cn('flex-1 truncate', collapsed && 'lg:hidden')}>{item.label}</span>
                    {item.badge === 'pendingReview' && navCounts && navCounts.pendingReview > 0 && (
                      <span className={cn(
                        'font-mono text-[10px] font-semibold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-md',
                        collapsed && 'lg:hidden'
                      )}>
                        {navCounts.pendingReview}
                      </span>
                    )}
                    {item.badge === 'openReports' && navCounts && navCounts.openReports > 0 && (
                      <span className={cn(
                        'font-mono text-[10px] font-semibold bg-destructive/10 text-destructive border border-destructive/30 px-1.5 py-0.5 rounded-md',
                        collapsed && 'lg:hidden'
                      )}>
                        {navCounts.openReports}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="p-3 border-t border-outline-variant">
          <Link
            href="/events/new"
            title={collapsed ? 'Create Event' : undefined}
            className={cn(
              'w-full mb-3 bg-primary text-primary-foreground rounded-md px-4 py-2.5 font-semibold text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm',
              collapsed && 'lg:justify-center lg:px-0'
            )}
          >
            <Plus size={16} />
            <span className={cn(collapsed && 'lg:hidden')}>Create Event</span>
          </Link>
          <div className="space-y-0.5">
            {bottomNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm',
                  collapsed && 'lg:justify-center lg:px-0',
                  isActive(item.href)
                    ? 'bg-surface-container-high text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-surface-container hover:text-foreground'
                )}
              >
                <div className="w-7 h-7 rounded-md bg-surface-container-high flex items-center justify-center text-muted-foreground">
                  <item.icon size={14} />
                </div>
                <span className={cn(collapsed && 'lg:hidden')}>{item.label}</span>
              </Link>
            ))}
            <button
              onClick={handleSignOut}
              title={collapsed ? 'Sign Out' : undefined}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm text-muted-foreground hover:bg-surface-container hover:text-destructive',
                collapsed && 'lg:justify-center lg:px-0'
              )}
            >
              <div className="w-7 h-7 rounded-md bg-surface-container-high flex items-center justify-center text-muted-foreground">
                <LogOut size={14} />
              </div>
              <span className={cn(collapsed && 'lg:hidden')}>Sign Out</span>
            </button>
          </div>
          <button
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'hidden lg:flex w-full mt-2 items-center gap-3 px-3 py-2 pt-3 rounded-md transition-colors text-sm text-muted-foreground hover:bg-surface-container hover:text-foreground border-t border-outline-variant',
              collapsed && 'lg:justify-center lg:px-0'
            )}
          >
            {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
            <span className={cn(collapsed && 'lg:hidden')}>Collapse</span>
          </button>
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
