import type { Metadata, Viewport } from 'next'
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { TopNav } from '@/components/layout/TopNav'
import { BottomTabBar } from '@/components/layout/BottomTabBar'
import { Footer } from '@/components/layout/Footer'
import { SkipLink } from '@/components/layout/SkipLink'
import { ConvexAuthClientProvider } from '@/components/providers/ConvexAuthClientProvider'
import { ConvexAuthNextjsServerProvider } from '@convex-dev/auth/nextjs/server'
import { AuthModalProvider } from '@/components/auth/AuthModalContext'

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

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
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
  icons: { icon: '/logo.png' },
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
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'Event Nu' }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} bg-background text-on-background font-sans overflow-x-hidden antialiased`}
      >
        <ConvexAuthNextjsServerProvider>
          <ConvexAuthClientProvider>
            <AuthModalProvider>
              <SkipLink />
              <TopNav />
              <main id="main-content" className="min-h-screen" tabIndex={-1}>
                {children}
              </main>
              <Footer />
              <BottomTabBar />
            </AuthModalProvider>
          </ConvexAuthClientProvider>
        </ConvexAuthNextjsServerProvider>
      </body>
    </html>
  )
}
