'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Bell, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from './sidebar-context'

export function TopHeader() {
  const { collapsed } = useSidebar()
  const router = useRouter()

  return (
    <header className={cn(
      'w-full h-16 fixed top-0 right-0 z-30 bg-surface-container-lowest dark:bg-surface-container-low border-b border-outline-variant dark:border-outline flex justify-between items-center pl-16 lg:pl-6 pr-6 transition-[width] duration-300',
      collapsed ? 'lg:w-[calc(100%-76px)]' : 'lg:w-[calc(100%-260px)]'
    )}>
      {/* Brand */}
      <Link href="/" className="flex items-center gap-3 group">
        <Image
          src="/logo.png"
          alt="Event Nu"
          width={40}
          height={34}
          priority
          style={{ height: '34px', width: 'auto' }}
          className="rounded-md transition-opacity group-hover:opacity-80"
        />
        <span className="hidden sm:block">
          <span className="block font-headline text-base font-semibold text-foreground leading-tight">Event Nu</span>
          <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Admin</span>
        </span>
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <button
            onClick={() => router.push('/notifications')}
            className="relative p-2 text-muted-foreground hover:text-primary hover:bg-surface-container-high transition-colors rounded-md"
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full ring-2 ring-surface-container-lowest" />
          </button>
          <button
            onClick={() => router.push('/support')}
            className="p-2 text-muted-foreground hover:text-primary hover:bg-surface-container-high transition-colors rounded-md"
            aria-label="Support"
          >
            <HelpCircle size={18} />
          </button>
        </div>
        <div className="h-8 w-px bg-outline-variant" />
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-foreground leading-none">Admin</p>
            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Super Admin</p>
          </div>
          <div className="w-10 h-10 rounded-md bg-surface-container-high flex items-center justify-center text-primary font-headline font-bold text-sm border border-primary/40">
            A
          </div>
        </div>
      </div>
    </header>
  )
}
