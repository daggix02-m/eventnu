import type { Metadata, Viewport } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { TopNav } from '@/components/layout/TopNav'
import { BottomTabBar } from '@/components/layout/BottomTabBar'
import { Footer } from '@/components/layout/Footer'
import { ConditionalFooter } from '@/components/layout/ConditionalFooter'
import { SkipLink } from '@/components/layout/SkipLink'
import { ConvexAuthClientProvider } from '@/components/providers/ConvexAuthClientProvider'
import { ConvexAuthNextjsServerProvider } from '@convex-dev/auth/nextjs/server'
import { AuthRedirectProvider } from '@/components/auth/AuthRedirectContext'

import { MainContent } from '@/components/layout/MainContent'

import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'
import { SiteBackground } from '@/components/layout/SiteBackground'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#151318',
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://eventnu.et'),
  title: 'Event Nu — Discover Live Experiences in Addis',
  description:
    'Discover concerts, arts, nightlife, and cultural experiences across Addis Ababa. All events in one place.',
  keywords: ['events', 'Addis Ababa', 'concerts', 'nightlife', 'arts', 'Ethiopia'],
  applicationName: 'Event Nu',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/logo.png', sizes: 'any', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/logo.png', sizes: '180x180', type: 'image/png' },
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/logo.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Event Nu',
  },
  openGraph: {
    title: 'Event Nu — Discover Live Experiences in Addis',
    description: 'Discover concerts, arts, nightlife, and cultural experiences across Addis Ababa.',
    type: 'website',
    locale: 'en_ET',
    images: [{ url: '/logo.png', width: 794, height: 672, alt: 'Event Nu' }],
  },
}

function originFrom(value?: string): string | null {
  try {
    return value ? new URL(value).origin : null
  } catch {
    return null
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const convexOrigin = originFrom(process.env.NEXT_PUBLIC_CONVEX_URL)
  const convexStorageOrigin = originFrom(process.env.NEXT_PUBLIC_CONVEX_STORAGE_URL)
  const convexOrigins = [convexOrigin, convexStorageOrigin].filter(
    (origin): origin is string => origin !== null,
  )

  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth">
      <head>
        {convexOrigins.flatMap((origin) => [
          <link
            key={`${origin}-preconnect`}
            rel="preconnect"
            href={origin}
            crossOrigin="anonymous"
          />,
          <link key={`${origin}-dns-prefetch`} rel="dns-prefetch" href={origin} />,
        ])}
      </head>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} bg-background text-on-background font-sans antialiased`}
      >
        <ConvexAuthNextjsServerProvider>
          <ConvexAuthClientProvider>
            <AuthRedirectProvider>
              <SkipLink />
              <SiteBackground />
              <ServiceWorkerRegister />
              <TopNav />
              <MainContent>{children}</MainContent>
              <ConditionalFooter>
                <Footer />
              </ConditionalFooter>
              <BottomTabBar />
              <InstallPrompt />
            </AuthRedirectProvider>
          </ConvexAuthClientProvider>
        </ConvexAuthNextjsServerProvider>
      </body>
    </html>
  )
}
