export const SITE = {
  name: 'Event Nu',
  domain: 'eventnu.et',
  handle: 'event.nua',
  tagline:
    "Addis Ababa's city guide. Concerts, arts, nightlife, and culture — everything on tonight, in one place.",
  email: 'event.nua@gmail.com',
  phones: [
    { label: '+251 947 471 516', tel: '+251947471516', whatsapp: '251947471516' },
    { label: '+251 967 288 810', tel: '+251967288810', whatsapp: '251967288810' },
  ],
  social: {
    instagram: {
      label: '@event_nu',
      url: 'https://www.instagram.com/event_nu?igsh=eWxocTA3Yno4OXN0',
    },
    telegram: {
      label: '@Event_Nu',
      url: 'https://t.me/Event_Nu',
    },
  },
  location: 'Addis Ababa, Ethiopia',
  timezone: 'Africa/Addis_Ababa',
} as const

export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL
  if (url) return url.replace(/\/+$/, '')
  return `https://${SITE.domain}`
}

export function absoluteUrl(path: string): string {
  return `${getSiteUrl()}${path.startsWith('/') ? path : `/${path}`}`
}
