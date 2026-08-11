'use client'

import { cn } from '@/lib/utils'
import { SidebarProvider, useSidebar } from './sidebar-context'
import { Sidebar } from './Sidebar'
import { TopHeader } from './TopHeader'
import type { NavCounts } from '@/lib/api/dashboard'

export function AppShell({
  children,
  navCounts,
}: {
  children: React.ReactNode
  navCounts: NavCounts
}) {
  return (
    <SidebarProvider>
      <Shell navCounts={navCounts}>{children}</Shell>
    </SidebarProvider>
  )
}

function Shell({ children, navCounts }: { children: React.ReactNode; navCounts: NavCounts }) {
  const { collapsed } = useSidebar()

  return (
    <>
      <Sidebar navCounts={navCounts} />
      <div
        className={cn(
          'flex flex-col min-h-screen transition-[margin-left] duration-300',
          collapsed ? 'lg:ml-[76px]' : 'lg:ml-[260px]',
        )}
      >
        <TopHeader />
        <main className="mt-16 flex-1 p-6 lg:p-8 ruled-page">{children}</main>
      </div>
    </>
  )
}
