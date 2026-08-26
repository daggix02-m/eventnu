'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { AuthButton } from '@/components/auth/AuthButton'

const navItems = [
  { href: '/', label: 'Find Events' },
  { href: '/schedule', label: 'Schedule' },
  { href: '/organizers', label: 'For Organizers' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export function TopNav() {
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 10)
        ticking = false
      })
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (pathname.startsWith('/auth')) return null

  return (
    <header
      className={cn(
        'w-full sticky top-0 z-40 border-b border-outline-variant/40 bg-background/85 backdrop-blur-xl transition-all duration-200',
        scrolled && 'sticky-nav-active shadow-md bg-background/95',
      )}
    >
      {/* Safe area top padding container for notch / Dynamic Island / status bar */}
      <div className="pt-[max(0.5rem,env(safe-area-inset-top))] pb-1 md:py-0">
        <div className="flex justify-between items-center h-13 md:h-16 px-4 md:px-gutter max-w-container-max mx-auto">
          <div className="flex items-center gap-lg">
            <Link href="/" className="flex items-center gap-2.5 group">
              <Image
                src="/logo.png"
                alt="Event Nu"
                width={794}
                height={672}
                style={{ height: '36px', width: 'auto' }}
                className="transition-transform duration-200 group-hover:scale-105"
              />
              <span className="font-bold text-lg text-primary tracking-tight md:hidden">
                Event Nu
              </span>
              <span className="sr-only">Event Nu</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-md" aria-label="Desktop Navigation">
              {navItems.map((item) => {
                const isActive =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'font-body-md text-body-md transition-colors duration-200',
                      isActive
                        ? 'text-primary font-bold border-b-2 border-primary pb-1'
                        : 'text-on-surface-variant hover:text-primary',
                    )}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center">
            <AuthButton />
          </div>
        </div>
      </div>
    </header>
  )
}
