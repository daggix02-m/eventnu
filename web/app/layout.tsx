import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";
import { SkipLink } from "@/components/layout/SkipLink";
import { ConvexAuthClientProvider } from "./ConvexAuthClientProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://eventnu.et"),
  title: "Event Nu — Discover Live Experiences in Addis",
  description:
    "Discover concerts, arts, nightlife, and cultural experiences across Addis Ababa. All events in one place.",
  keywords: ["events", "Addis Ababa", "concerts", "nightlife", "arts", "Ethiopia"],
  icons: { icon: "/logo.png" },
  openGraph: {
    title: "Event Nu — Discover Live Experiences in Addis",
    description: "Discover concerts, arts, nightlife, and cultural experiences across Addis Ababa.",
    type: "website",
    locale: "en_ET",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Event Nu" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} bg-background text-on-background font-sans overflow-x-hidden antialiased`}
      >
        <ConvexAuthClientProvider>
          <SkipLink />
          <TopNav />
          <main id="main-content" className="min-h-screen" tabIndex={-1}>
            {children}
          </main>
          <Footer />
        </ConvexAuthClientProvider>
      </body>
    </html>
  );
}
