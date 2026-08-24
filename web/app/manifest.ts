import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Event Nu — Live Experiences in Addis',
    short_name: 'Event Nu',
    description:
      'Discover concerts, arts, nightlife, and cultural experiences across Addis Ababa. All events in one place.',
    start_url: '/',
    id: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    background_color: '#151318',
    theme_color: '#151318',
    orientation: 'portrait-primary',
    categories: ['entertainment', 'events', 'lifestyle', 'music'],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        // Largest asset also improves iOS's auto-generated launch splash
        // (iOS 15.4+ zooms the icon onto the background color).
        src: '/icons/icon-1024x1024.png',
        sizes: '1024x1024',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/maskable-icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Discover Events',
        short_name: 'Events',
        description: 'Browse all upcoming events in Addis',
        url: '/',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'City Schedule',
        short_name: 'Schedule',
        description: 'Plan and sync upcoming events by date',
        url: '/schedule',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'For Organizers',
        short_name: 'Organizers',
        description: 'Host and manage your events with Event Nu',
        url: '/organizers',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
    ],
    prefer_related_applications: false,
  }
}
