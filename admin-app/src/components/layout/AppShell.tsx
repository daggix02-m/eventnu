'use client'

import { cn } from '@/lib/utils'
import { SidebarProvider, useSidebar } from './sidebar-context'
import { Sidebar } from './Sidebar'
import { TopHeader } from './TopHeader'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Shell>{children}</Shell>
    </SidebarProvider>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar()

  return (
    <>
      <Sidebar />
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
