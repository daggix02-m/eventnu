import { mutation, internalMutation, MutationCtx } from './_generated/server'
import { internal } from './_generated/api'
import { requireAdmin } from './helpers'

const CATEGORIES = [
  {
    name: 'Music',
    slug: 'music',
    description: 'Live music concerts, DJ sets, and performances across the city.',
    icon: 'music',
    sortOrder: 0,
  },
  {
    name: 'Arts & Culture',
    slug: 'arts-culture',
    description: 'Art exhibitions, galleries, film, and cultural events.',
    icon: 'palette',
    sortOrder: 1,
  },
  {
    name: 'Nightlife',
    slug: 'nightlife',
    description: 'Clubs, parties, and after-dark experiences.',
    icon: 'moon',
    sortOrder: 2,
  },
  {
    name: 'Food & Drink',
    slug: 'food-drink',
    description: 'Food festivals, tastings, and culinary gatherings.',
    icon: 'utensils-crossed',
    sortOrder: 3,
  },
  {
    name: 'Sports & Fitness',
    slug: 'sports-fitness',
    description: 'Runs, tournaments, and fitness events.',
    icon: 'dumbbell',
    sortOrder: 4,
  },
  {
    name: 'Tech & Innovation',
    slug: 'tech-innovation',
    description: 'Tech meetups, conferences, and innovation showcases.',
    icon: 'cpu',
    sortOrder: 5,
  },
  {
    name: 'Family',
    slug: 'family',
    description: 'Kid-friendly days out and family get-togethers.',
    icon: 'baby',
    sortOrder: 6,
  },
]

const FEATURED_SECTIONS = [
  {
    slug: 'editors_choice',
    label: "Editor's Choice",
    description: 'Staff picks',
    enabled: true,
    sortOrder: 0,
  },
  {
    slug: 'trending',
    label: 'Trending',
    description: 'Most popular right now',
    enabled: true,
    sortOrder: 1,
  },
  {
    slug: 'new_and_noteworthy',
    label: 'New & Noteworthy',
    description: 'Recently added events',
    enabled: true,
    sortOrder: 2,
  },
]

async function ensureBaseData(ctx: MutationCtx) {
  const existingCategories = await ctx.db.query('categories').take(1)
  if (existingCategories.length === 0) {
    for (const c of CATEGORIES) {
      await ctx.db.insert('categories', c)
    }
  }
  const existingSections = await ctx.db.query('featuredSections').take(1)
  if (existingSections.length === 0) {
    for (const s of FEATURED_SECTIONS) {
      await ctx.db.insert('featuredSections', s)
    }
  }
}

export const insertBaseData = internalMutation({
  args: {},
  handler: async (ctx): Promise<{ categoriesSeeded: boolean; sectionsSeeded: boolean }> => {
    let categoriesSeeded = false
    const existingCategories = await ctx.db.query('categories').take(1)
    if (existingCategories.length === 0) {
      for (const c of CATEGORIES) {
        await ctx.db.insert('categories', c)
      }
      categoriesSeeded = true
    }
    let sectionsSeeded = false
    const existingSections = await ctx.db.query('featuredSections').take(1)
    if (existingSections.length === 0) {
      for (const s of FEATURED_SECTIONS) {
        await ctx.db.insert('featuredSections', s)
      }
      sectionsSeeded = true
    }
    return { categoriesSeeded, sectionsSeeded }
  },
})

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    await ctx.runMutation(internal.seed.insertBaseData, {})
    return { seeded: true }
  },
})

interface SeedEvent {
  title: string
  slug: string
  poster: string
  category: string
  secondaryCategory?: string
  description: string
  venue: string
  address: string
  price: string | null
  dayOffset: number
  hour: number
  featuredSection?: string
  weekly?: boolean
}

const VENUE_POOL = [
  { venue: 'African Jazz Village', address: 'Bole, Addis Ababa' },
  { venue: 'Jazz Villaggio', address: 'Bole, Addis Ababa' },
  { venue: 'Flirt Lounge', address: 'Bole Medhanealem, Addis Ababa' },
  { venue: 'Milk Lounge', address: 'Bole Atlas, Addis Ababa' },
  { venue: 'Yod Abyssinia', address: 'Bole, Addis Ababa' },
  { venue: 'Pulp Lounge', address: 'Old Airport, Addis Ababa' },
  { venue: 'The Coffee Room', address: 'Sarbet, Addis Ababa' },
  { venue: 'Black Rose', address: '4 Kilo, Addis Ababa' },
  { venue: 'Salon 5 Café', address: 'Bole, Addis Ababa' },
  { venue: 'Entoto Park', address: 'Entoto, Addis Ababa' },
]

const EVENTS: SeedEvent[] = [
  {
    title: 'The House Party',
    slug: 'the-house-party',
    poster: '/images/events/july-20-26/the-house-party.png',
    category: 'nightlife',
    description:
      "Addis' biggest recurring house party returns — deep house, afro house, and amapiano on a proper soundsystem until late. First-come, first-served entry.",
    venue: 'Pulp Lounge',
    address: 'Old Airport, Addis Ababa',
    price: '300 ETB',
    dayOffset: 2,
    hour: 21,
    featuredSection: 'editors_choice',
    weekly: true,
  },
  {
    title: 'Hip Hop Night',
    slug: 'hip-hop-night',
    poster: '/images/events/june-22-28/hiphop.png',
    category: 'music',
    secondaryCategory: 'nightlife',
    description:
      'An open-mic + DJ night celebrating Addis hip hop. Local artists, freestyle cyphers, and a live band backing the headliners.',
    venue: 'Jazz Villaggio',
    address: 'Bole, Addis Ababa',
    price: '250 ETB',
    dayOffset: 3,
    hour: 20,
    featuredSection: 'trending',
    weekly: true,
  },
  {
    title: 'Afro Heat',
    slug: 'afro-heat',
    poster: '/images/events/july-01-05/afro-heat.png',
    category: 'music',
    description:
      'A night of afrobeats, amapiano, and East African bangers with resident DJs and a surprise guest lineup.',
    venue: 'Flirt Lounge',
    address: 'Bole Medhanealem, Addis Ababa',
    price: '200 ETB',
    dayOffset: 4,
    hour: 22,
  },
  {
    title: 'Unity in Beats',
    slug: 'unity-in-beats',
    poster: '/images/events/july-13-19/unity-in-beats.png',
    category: 'music',
    description:
      'A celebration of pan-African rhythms — live percussion, sax, and bass lines that move the whole room.',
    venue: 'African Jazz Village',
    address: 'Bole, Addis Ababa',
    price: '350 ETB',
    dayOffset: 5,
    hour: 20,
    featuredSection: 'editors_choice',
  },
  {
    title: 'Evangadi',
    slug: 'evangadi',
    poster: '/images/events/july-20-26/evangadi.png',
    category: 'music',
    description:
      'Traditional evangadi rhythms reimagined for a modern dancefloor, with a live band and resident dancers.',
    venue: 'Yod Abyssinia',
    address: 'Bole, Addis Ababa',
    price: '280 ETB',
    dayOffset: 6,
    hour: 19,
  },
  {
    title: 'Ertib',
    slug: 'ertib',
    poster: '/images/events/july-13-19/ertib.png',
    category: 'music',
    description:
      'An intimate night of soul and jazz covers from rising Addis vocalists, hosted in a candle-lit lounge.',
    venue: 'Black Rose',
    address: '4 Kilo, Addis Ababa',
    price: '220 ETB',
    dayOffset: 8,
    hour: 20,
  },
  {
    title: 'Night Shift',
    slug: 'night-shift',
    poster: '/images/events/july-20-26/night-shift.png',
    category: 'nightlife',
    description:
      "The late-night crew's weekly — techno and minimal house from the city's sharpest selectors till sunrise.",
    venue: 'Milk Lounge',
    address: 'Bole Atlas, Addis Ababa',
    price: '200 ETB',
    dayOffset: 9,
    hour: 23,
    weekly: true,
  },
  {
    title: 'Shift',
    slug: 'shift',
    poster: '/images/events/june-22-28/shift.png',
    category: 'nightlife',
    description:
      'A warehouse-style dance night with visuals, a smoke machine, and three rooms of electronic music.',
    venue: 'Pulp Lounge',
    address: 'Old Airport, Addis Ababa',
    price: '250 ETB',
    dayOffset: 10,
    hour: 22,
  },
  {
    title: 'Utopia Night',
    slug: 'utopia-night',
    poster: '/images/events/july-01-05/utopia-night.png',
    category: 'nightlife',
    description:
      'Futuristic party night — neon visuals, afro-futurist installations, and heavy bass music all night.',
    venue: 'Flirt Lounge',
    address: 'Bole Medhanealem, Addis Ababa',
    price: '300 ETB',
    dayOffset: 11,
    hour: 22,
    featuredSection: 'trending',
  },
  {
    title: 'Caribbean & Afro Night',
    slug: 'caribbean-and-afro-night',
    poster: '/images/events/july-20-26/carabian-and-afro-nigt.png',
    category: 'nightlife',
    description:
      'Dancehall, reggae, and afrobeats collide for a cross-cultural party with live DJs and MCs.',
    venue: 'Jazz Villaggio',
    address: 'Bole, Addis Ababa',
    price: '180 ETB',
    dayOffset: 12,
    hour: 21,
  },
  {
    title: 'Special Thursday',
    slug: 'special-thursday',
    poster: '/images/events/june-22-28/25-special-thursday.png',
    category: 'nightlife',
    description: 'The mid-week reset — open decks, happy-hour cocktails, and a laid-back crowd.',
    venue: 'Salon 5 Café',
    address: 'Bole, Addis Ababa',
    price: null,
    dayOffset: 3,
    hour: 19,
  },
  {
    title: 'Urban Friends',
    slug: 'urban-friends',
    poster: '/images/events/june-22-28/urban-friends.png',
    category: 'music',
    description:
      "A showcase of urban Ethiopian artists — rap, drill, and R&B from the scene's next wave.",
    venue: 'African Jazz Village',
    address: 'Bole, Addis Ababa',
    price: '250 ETB',
    dayOffset: 13,
    hour: 20,
  },
  {
    title: 'Wegdayt',
    slug: 'wegdayt',
    poster: '/images/events/june-22-28/wegdayt.png',
    category: 'music',
    description:
      'Live traditional fusion — krar and masenqo meet electric guitar in a high-energy set.',
    venue: 'Yod Abyssinia',
    address: 'Bole, Addis Ababa',
    price: '200 ETB',
    dayOffset: 15,
    hour: 19,
  },
  {
    title: 'Bedele Special',
    slug: 'bedele-special',
    poster: '/images/events/july-20-26/bedele-special.png',
    category: 'music',
    description:
      'An evening of mellow acoustic sessions and storytelling, celebrating Ethiopian songwriting.',
    venue: 'The Coffee Room',
    address: 'Sarbet, Addis Ababa',
    price: null,
    dayOffset: 16,
    hour: 18,
  },
  {
    title: 'Anime Fest',
    slug: 'anime-fest',
    poster: '/images/events/june-22-28/25-anime.png',
    category: 'arts-culture',
    secondaryCategory: 'family',
    description:
      'Cosplay contest, anime screenings, manga stalls, and a retro gaming corner. All ages welcome.',
    venue: 'Black Rose',
    address: '4 Kilo, Addis Ababa',
    price: '150 ETB',
    dayOffset: 2,
    hour: 11,
    featuredSection: 'new_and_noteworthy',
  },
  {
    title: 'Anime Fest: Grand Finale',
    slug: 'anime-fest-finale',
    poster: '/images/events/june-22-28/28-anime.png',
    category: 'arts-culture',
    secondaryCategory: 'family',
    description:
      'The closing day of Anime Fest — grand cosplay parade, awards, and a live anime-score concert.',
    venue: 'Black Rose',
    address: '4 Kilo, Addis Ababa',
    price: '150 ETB',
    dayOffset: 5,
    hour: 11,
  },
  {
    title: 'Fashion Lab',
    slug: 'fashion-lab',
    poster: '/images/events/june-22-28/fashion-lab.png',
    category: 'arts-culture',
    description:
      'A runway showcase of emerging Ethiopian designers, with installations and a pop-up market.',
    venue: 'Pulp Lounge',
    address: 'Old Airport, Addis Ababa',
    price: '400 ETB',
    dayOffset: 8,
    hour: 17,
  },
  {
    title: 'Sip & Paint',
    slug: 'sip-and-paint',
    poster: '/images/events/july-01-05/sip-and-paint.png',
    category: 'arts-culture',
    secondaryCategory: 'food-drink',
    description:
      'A guided painting session over wine and coffee — all materials provided, no experience needed.',
    venue: 'Salon 5 Café',
    address: 'Bole, Addis Ababa',
    price: '600 ETB',
    dayOffset: 9,
    hour: 15,
  },
  {
    title: 'Affordable Art Fair',
    slug: 'affordable-art',
    poster: '/images/events/july-01-05/affrodable-art.png',
    category: 'arts-culture',
    description:
      "Original works from 40+ local artists priced under 5,000 ETB — the city's most accessible art fair.",
    venue: 'Black Rose',
    address: '4 Kilo, Addis Ababa',
    price: '100 ETB',
    dayOffset: 10,
    hour: 10,
  },
  {
    title: 'Free Form Exhibition',
    slug: 'free-form',
    poster: '/images/events/july-6-12/free-form.png',
    category: 'arts-culture',
    description:
      'An experimental exhibition of abstract painting, sculpture, and sound installations.',
    venue: 'The Coffee Room',
    address: 'Sarbet, Addis Ababa',
    price: null,
    dayOffset: 12,
    hour: 14,
  },
  {
    title: 'Photography Workshop',
    slug: 'photography-workshop',
    poster: '/images/events/july-6-12/photography-woorkshope.png',
    category: 'arts-culture',
    description:
      'A hands-on street-photography workshop in the old city, followed by a group critique over coffee.',
    venue: 'Meskel Square',
    address: 'Addis Ababa',
    price: '500 ETB',
    dayOffset: 13,
    hour: 8,
  },
  {
    title: 'Bloom Week',
    slug: 'bloom-week',
    poster: '/images/events/july-20-26/bloom-week.png',
    category: 'arts-culture',
    description:
      'A week-long celebration of flora in art — botanical illustration, floral installations, and workshops.',
    venue: 'Entoto Park',
    address: 'Entoto, Addis Ababa',
    price: '200 ETB',
    dayOffset: 14,
    hour: 9,
  },
  {
    title: 'Tea Gathering',
    slug: 'tea-gathering',
    poster: '/images/events/june-22-28/27-tea.png',
    category: 'food-drink',
    description:
      'An afternoon of loose-leaf tea tastings, pastries, and quiet conversation in a garden setting.',
    venue: 'The Coffee Room',
    address: 'Sarbet, Addis Ababa',
    price: '180 ETB',
    dayOffset: 4,
    hour: 15,
  },
  {
    title: 'Feta Society',
    slug: 'feta-society',
    poster: '/images/events/july-13-19/feta-socity.png',
    category: 'food-drink',
    description:
      "A street-food crawl across the city's best night stalls — feta, suya, and everything in between.",
    venue: 'Meskel Square',
    address: 'Addis Ababa',
    price: '350 ETB',
    dayOffset: 6,
    hour: 18,
  },
  {
    title: 'Dimket Fest',
    slug: 'dimket-fest',
    poster: '/images/events/july-20-26/dimket-fest.png',
    category: 'food-drink',
    description:
      "A family-friendly food festival with live grills, traditional coffee ceremonies, and kids' activities.",
    venue: 'Entoto Park',
    address: 'Entoto, Addis Ababa',
    price: '150 ETB',
    dayOffset: 15,
    hour: 10,
    secondaryCategory: 'family',
  },
  {
    title: 'Cycle Session',
    slug: 'cycle-session',
    poster: '/images/events/june-22-28/cycle.png',
    category: 'sports-fitness',
    description:
      "A relaxed group ride through the city's green routes, with a coffee stop at the midpoint.",
    venue: 'Entoto Park',
    address: 'Entoto, Addis Ababa',
    price: null,
    dayOffset: 4,
    hour: 6,
  },
  {
    title: 'Adventure Run',
    slug: 'adventure-run',
    poster: '/images/events/july-01-05/adventure.png',
    category: 'sports-fitness',
    description:
      'A 10K trail run with obstacles, music zones, and finisher medals. Timing chips provided.',
    venue: 'Entoto Park',
    address: 'Entoto, Addis Ababa',
    price: '400 ETB',
    dayOffset: 11,
    hour: 7,
    featuredSection: 'trending',
  },
  {
    title: 'CBE Entoto Run',
    slug: 'cbe-entoto-run',
    poster: '/images/events/july-01-05/cbe-entoto-run.png',
    category: 'sports-fitness',
    description:
      "The city's biggest annual road race — 5K, 10K, and half-marathon routes through the hills of Entoto.",
    venue: 'Entoto Park',
    address: 'Entoto, Addis Ababa',
    price: '300 ETB',
    dayOffset: 18,
    hour: 6,
  },
  {
    title: 'Networking Night',
    slug: 'networking-night',
    poster: '/images/events/july-13-19/networking-night.png',
    category: 'tech-innovation',
    description:
      'Founders, engineers, and investors meet over drinks — lightning talks followed by open networking.',
    venue: 'Milk Lounge',
    address: 'Bole Atlas, Addis Ababa',
    price: null,
    dayOffset: 5,
    hour: 18,
  },
  {
    title: 'Afterwork',
    slug: 'afterwork',
    poster: '/images/events/june-22-28/26-afterwork.png',
    category: 'tech-innovation',
    description:
      "The monthly professional mixer — grab a drink, meet people across Addis' tech and creative scene.",
    venue: 'Pulp Lounge',
    address: 'Old Airport, Addis Ababa',
    price: null,
    dayOffset: 12,
    hour: 18,
  },
  {
    title: 'Baby Disco',
    slug: 'baby-disco',
    poster: '/images/events/july-01-05/baby-disco.png',
    category: 'family',
    description:
      'A daytime dance party for toddlers and parents — soft lighting, bubbles, and kid-friendly tunes.',
    venue: 'Salon 5 Café',
    address: 'Bole, Addis Ababa',
    price: '120 ETB',
    dayOffset: 6,
    hour: 10,
  },
  {
    title: 'Chimp Event',
    slug: 'chimp-event',
    poster: '/images/events/july-20-26/chimp-event.png',
    category: 'family',
    description:
      'An afternoon of primate-themed games, face painting, and a conservation talk for kids.',
    venue: 'Entoto Park',
    address: 'Entoto, Addis Ababa',
    price: '80 ETB',
    dayOffset: 9,
    hour: 10,
  },
  {
    title: 'Game Night',
    slug: 'game-night',
    poster: '/images/events/before-22/june-19-game-night.png',
    category: 'family',
    secondaryCategory: 'food-drink',
    description:
      'Board games, card games, and retro consoles — with coffee and snacks on tap. Bring a friend or come solo.',
    venue: 'The Coffee Room',
    address: 'Sarbet, Addis Ababa',
    price: '100 ETB',
    dayOffset: 3,
    hour: 17,
  },
]

export const insertSeedEvents = internalMutation({
  args: {},
  handler: async (ctx) => {
    await ensureBaseData(ctx)

    const categories = await ctx.db.query('categories').take(200)
    const catBySlug = new Map(categories.map((c) => [c.slug, c._id]))

    let created = 0
    let skipped = 0

    for (const e of EVENTS) {
      const existing = await ctx.db
        .query('events')
        .withIndex('by_slug', (q) => q.eq('slug', e.slug))
        .unique()
      if (existing) {
        skipped += 1
        continue
      }

      const primaryId = catBySlug.get(e.category)
      if (!primaryId) {
        skipped += 1
        continue
      }

      const start = new Date()
      start.setDate(start.getDate() + e.dayOffset)
      start.setHours(e.hour, 0, 0, 0)

      const eventId = await ctx.db.insert('events', {
        title: e.title,
        slug: e.slug,
        description: e.description,
        startDate: start.getTime(),
        endDate: start.getTime() + (5 * 60 + 30) * 60 * 1000,
        posterUrl: e.poster,
        isFree: !e.price,
        priceDisplay: e.price ?? undefined,
        actionType: 'open_entry',
        status: 'published',
        source: 'manual',
        isStandalone: true,
        isFeatured: !!e.featuredSection,
        featuredSection: e.featuredSection,
        frequencyType: e.weekly ? 'weekly' : 'one_time',
        reservationEnabled: false,
        reservationCount: 0,
        likeCount: Math.floor(Math.random() * 120) + 4,
        timezone: 'Africa/Addis_Ababa',
        venueName: e.venue,
        venueAddress: e.address,
      })

      await ctx.db.insert('eventCategories', {
        eventId,
        categoryId: primaryId,
        isPrimary: true,
      })
      if (e.secondaryCategory) {
        const secondaryId = catBySlug.get(e.secondaryCategory)
        if (secondaryId) {
          await ctx.db.insert('eventCategories', {
            eventId,
            categoryId: secondaryId,
            isPrimary: false,
          })
        }
      }
      created += 1
    }

    return { created, skipped }
  },
})

export const seedEvents = mutation({
  args: {},
  handler: async (ctx): Promise<{ created: number; skipped: number }> => {
    await requireAdmin(ctx)
    const result: { created: number; skipped: number } = await ctx.runMutation(
      internal.seed.insertSeedEvents,
      {},
    )
    return result
  },
})
