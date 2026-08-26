import type { NextConfig } from 'next'

let config: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    // Optimized images are immutable (hashed URLs in production); caching them
    // for a year avoids re-optimizing the same source on every cache miss.
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.convex.cloud',
      },
      {
        protocol: 'https',
        hostname: '*.convex.site',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), midi=(), autoplay=(), encrypted-media=(), picture-in-picture=(), screen-wake-lock=()',
          },
          { key: 'Speculation-Rules', value: '"/speculation-rules.json"' },
        ],
      },
      {
        source: '/speculation-rules.json',
        headers: [{ key: 'Content-Type', value: 'application/speculationrules+json' }],
      },
    ]
  },
}

// ANALYZE=true npm run build opens the bundle analyzer after the build.
if (process.env.ANALYZE === 'true') {
  const withBundleAnalyzer = require('@next/bundle-analyzer')
  config = withBundleAnalyzer({ enabled: true })(config)
}

export default config
