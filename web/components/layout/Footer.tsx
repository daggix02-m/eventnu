import Link from 'next/link'
import Image from 'next/image'
import { Mail, Instagram, Send, Phone, MapPin, ArrowUpRight, CalendarHeart } from 'lucide-react'
import { getCategories, getPublishedPages } from '@/lib/api/events'
import { SITE } from '@/lib/site'

const LEGAL_PAGES = [
  { href: '/info/privacy-policy', label: 'Privacy Policy' },
  { href: '/info/terms-of-service', label: 'Terms of Service' },
  { href: '/info/community-guidelines', label: 'Community Guidelines' },
]

export async function Footer() {
  let categories: Awaited<ReturnType<typeof getCategories>> = []
  let pages: Awaited<ReturnType<typeof getPublishedPages>> = []
  try {
    ;[categories, pages] = await Promise.all([getCategories(), getPublishedPages()])
  } catch (err) {
    console.error('Footer data fetch failed:', err)
  }

  const infoLinks = [
    ...LEGAL_PAGES,
    ...pages
      .filter((p) => !LEGAL_PAGES.some((l) => l.href === `/info/${p.slug}`))
      .map((p) => ({ href: `/info/${p.slug}`, label: p.title })),
  ]

  const socialLinks = [
    {
      href: SITE.social.instagram.url,
      label: SITE.social.instagram.label,
      icon: Instagram,
      external: true,
    },
    {
      href: SITE.social.telegram.url,
      label: SITE.social.telegram.label,
      icon: Send,
      external: true,
    },
  ]

  return (
    <footer className="hidden md:block w-full bg-surface-container-lowest border-t border-outline-variant/30 pb-10">
      <div
        className="h-[2px] w-full"
        style={{
          background:
            'repeating-linear-gradient(90deg, var(--color-primary) 0px, var(--color-primary) 4px, transparent 4px, transparent 8px, var(--color-secondary) 8px, var(--color-secondary) 12px, transparent 12px, transparent 16px)',
          opacity: 0.5,
          maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
        }}
        aria-hidden="true"
      />

      <div className="max-w-container-max mx-auto px-gutter pt-12 md:pt-16">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Column 1: Brand & Tagline */}
          <div className="sm:col-span-2 lg:col-span-4 space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <Image
                src="/asset-2.png"
                alt="Event Nu"
                width={794}
                height={672}
                style={{ height: '40px', width: 'auto' }}
                className="rounded-lg transition-transform group-hover:scale-105"
              />
              <span className="text-xl font-bold text-primary tracking-tight">Event Nu</span>
            </Link>
            <h2 className="font-display text-lg md:text-xl font-bold leading-snug text-on-background max-w-[24rem]">
              Discover live experiences in Addis Ababa.{' '}
              <span className="text-primary">All events in one place.</span>
            </h2>
            <p className="text-sm text-on-surface-variant max-w-[24rem] leading-relaxed">{SITE.tagline}</p>
            <div>
              <Link
                href="/organizers"
                className="inline-flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline underline-offset-4 group"
              >
                <span>Have an event? List it for free</span>
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </div>

          {/* Column 2: Categories (if available) */}
          {categories.length > 0 && (
            <div className="sm:col-span-2 lg:col-span-3 space-y-3.5">
              <p className="font-mono text-xs font-semibold text-secondary uppercase tracking-wider">
                Categories
              </p>
              <nav className="flex flex-wrap gap-1.5" aria-label="Category links">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/categories/${category.slug}`}
                    className="px-3 py-1 rounded-full border border-outline-variant/50 bg-surface-container-low/60 text-xs font-medium text-on-surface-variant hover:text-primary hover:border-primary/60 hover:bg-surface-container transition-colors"
                  >
                    {category.name}
                  </Link>
                ))}
              </nav>
            </div>
          )}

          {/* Column 3: Contact */}
          <div
            className={`${
              categories.length > 0
                ? 'sm:col-span-1 lg:col-span-3'
                : 'sm:col-span-1 lg:col-span-4'
            } space-y-3.5`}
          >
            <p className="font-mono text-xs font-semibold text-secondary uppercase tracking-wider">
              Contact
            </p>
            <ul className="space-y-2.5">
              <li>
                <a
                  href={`mailto:${SITE.email}`}
                  className="inline-flex items-center gap-2.5 text-sm text-on-surface-variant hover:text-primary transition-colors group"
                >
                  <Mail className="w-4 h-4 text-outline group-hover:text-primary transition-colors shrink-0" aria-hidden="true" />
                  <span className="break-all">{SITE.email}</span>
                </a>
              </li>
              <li>
                <a
                  href={`tel:${SITE.phones[0].tel}`}
                  className="inline-flex items-center gap-2.5 text-sm text-on-surface-variant hover:text-primary transition-colors group"
                >
                  <Phone className="w-4 h-4 text-outline group-hover:text-primary transition-colors shrink-0" aria-hidden="true" />
                  <span>{SITE.phones[0].label}</span>
                </a>
              </li>
              {socialLinks.map((link) => {
                const Icon = link.icon
                return (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={link.external ? '_blank' : undefined}
                      rel={link.external ? 'noopener noreferrer' : undefined}
                      className="inline-flex items-center gap-2.5 text-sm text-on-surface-variant hover:text-primary transition-colors group"
                    >
                      <Icon className="w-4 h-4 text-outline group-hover:text-primary transition-colors shrink-0" aria-hidden="true" />
                      <span>{link.label}</span>
                    </a>
                  </li>
                )
              })}
              <li className="inline-flex items-center gap-2.5 text-sm text-on-surface-variant/80">
                <MapPin className="w-4 h-4 text-outline shrink-0" aria-hidden="true" />
                <span>{SITE.location}</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Info & Legal */}
          <div
            className={`${
              categories.length > 0
                ? 'sm:col-span-1 lg:col-span-2'
                : 'sm:col-span-1 lg:col-span-4'
            } space-y-3.5`}
          >
            <p className="font-mono text-xs font-semibold text-secondary uppercase tracking-wider">
              Info &amp; Legal
            </p>
            <nav className="flex flex-col space-y-2.5" aria-label="Info and legal links">
              {infoLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-on-surface-variant hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-outline-variant/30 text-xs text-on-surface-variant">
          <p>
            &copy; {new Date().getFullYear()} Event Nu. All rights reserved.
          </p>
          <p className="inline-flex items-center gap-1.5 text-on-surface-variant/70">
            <CalendarHeart className="w-3.5 h-3.5 text-primary/70" aria-hidden="true" />
            Made in {SITE.location}
          </p>
        </div>
      </div>
    </footer>
  )
}
