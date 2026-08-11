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
    <footer className="w-full bg-surface-container-lowest pb-tabbar-safe md:pb-0">
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

      <div className="max-w-container-max mx-auto px-gutter pt-2xl pb-xl">
        {/* Row 1: brand + contact */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl lg:gap-2xl">
          <div className="lg:col-span-7 space-y-md">
            <Link href="/" className="inline-flex items-center gap-sm">
              <Image
                src="/logo.png"
                alt="Event Nu"
                width={794}
                height={672}
                style={{ height: '40px', width: 'auto' }}
                className="rounded-lg"
              />
              <span className="text-headline-md text-primary font-bold">Event Nu</span>
            </Link>
            <h2 className="font-display text-display-md md:text-display-lg font-extrabold leading-tight text-on-background">
              Discover live experiences in Addis Ababa.{' '}
              <span className="text-primary">All events in one place.</span>
            </h2>
            <p className="text-body-lg text-on-surface-variant max-w-[28rem]">{SITE.tagline}</p>
            <Link
              href="/organizers"
              className="inline-flex items-center gap-xs text-body-md text-primary font-semibold hover:underline underline-offset-4"
            >
              Have an event? List it for free
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="lg:col-span-5 lg:justify-self-end">
            <p className="font-mono text-label-sm text-secondary uppercase tracking-wider">
              Contact
            </p>
            <ul className="mt-sm space-y-sm">
              <li>
                <a
                  href={`mailto:${SITE.email}`}
                  className="inline-flex items-center gap-sm text-body-md text-on-surface-variant hover:text-primary transition-colors"
                >
                  <Mail className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  {SITE.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${SITE.phones[0].tel}`}
                  className="inline-flex items-center gap-sm text-body-md text-on-surface-variant hover:text-primary transition-colors"
                >
                  <Phone className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  {SITE.phones[0].label}
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
                      className="inline-flex items-center gap-sm text-body-md text-on-surface-variant hover:text-primary transition-colors"
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                      {link.label}
                    </a>
                  </li>
                )
              })}
              <li className="flex items-center gap-sm text-body-md text-on-surface-variant">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                {SITE.location}
              </li>
            </ul>
          </div>
        </div>

        {/* Row 2: real-data columns */}
        <div className="mt-xl grid grid-cols-1 md:grid-cols-2 gap-xl">
          {categories.length > 0 && (
            <div>
              <p className="font-mono text-label-sm text-secondary uppercase tracking-wider">
                Browse by category
              </p>
              <nav className="mt-sm flex flex-wrap gap-xs" aria-label="Category links">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/categories/${category.slug}`}
                    className="px-md py-2 rounded-full border border-outline-variant bg-surface-container/40 text-body-md text-on-surface-variant hover:text-primary hover:border-primary transition-colors"
                  >
                    {category.name}
                  </Link>
                ))}
              </nav>
            </div>
          )}

          <div className={categories.length > 0 ? '' : 'md:col-span-2'}>
            <p className="font-mono text-label-sm text-secondary uppercase tracking-wider">
              Info &amp; legal
            </p>
            <nav className="mt-sm flex flex-col gap-sm" aria-label="Info and legal links">
              {infoLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center gap-sm text-body-md text-on-surface-variant hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-lg mt-xl flex flex-col sm:flex-row items-center justify-between gap-md border-t border-outline-variant">
          <p className="text-on-surface-variant text-label-sm">
            &copy; {new Date().getFullYear()} Event Nu. All rights reserved.
          </p>
          <p className="inline-flex items-center gap-xs text-on-surface-variant/70 text-label-sm">
            <CalendarHeart className="w-3.5 h-3.5" aria-hidden="true" />
            Made in {SITE.location}
          </p>
        </div>
      </div>
    </footer>
  )
}
