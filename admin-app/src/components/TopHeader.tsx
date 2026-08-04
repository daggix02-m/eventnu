'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Bell, HelpCircle, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'

export function TopHeader() {
  const { setTheme, resolvedTheme } = useTheme()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="h-16 fixed top-0 right-0 w-full lg:w-[calc(100%-260px)] z-30 bg-surface-container-lowest dark:bg-surface-container-low border-b border-outline-variant dark:border-outline flex justify-between items-center px-6">
      {/* Search */}
      <div className="flex items-center bg-surface-container-high rounded-full px-4 py-1.5 w-96 max-w-full ml-12 lg:ml-0">
        <Search size={16} className="text-muted-foreground mr-2" />
        <input
          type="text"
          placeholder="Search reports, users, or event IDs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-muted-foreground outline-none"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-surface-container-high"
            aria-label="Toggle theme"
          >
            {mounted ? (
              <>{resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</>
            ) : (
              <Moon size={18} />
            )}
          </button>
          <button
            onClick={() => router.push('/notifications')}
            className="relative p-2 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-surface-container-high">
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full ring-2 ring-surface-container-lowest" />
          </button>
          <button
            onClick={() => router.push('/support')}
            className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-surface-container-high">
            <HelpCircle size={18} />
          </button>
        </div>
        <div className="h-8 w-px bg-outline-variant" />
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-foreground leading-none">Admin</p>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Super Admin</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-primary font-bold text-sm border-2 border-primary">
            A
          </div>
        </div>
      </div>
    </header>
  )
}
