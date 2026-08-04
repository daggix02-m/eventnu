import { mutation } from "./_generated/server";
import { requireAdmin } from "./helpers";

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.query("categories").take(1);
    if (existing.length > 0) return { alreadySeeded: true };

    await ctx.db.insert("categories", {
      name: "Music",
      slug: "music",
      description: "Live music concerts and performances",
      icon: "music",
      sortOrder: 0,
    });

    await ctx.db.insert("categories", {
      name: "Arts & Culture",
      slug: "arts-culture",
      description: "Art exhibitions, galleries, and cultural events",
      icon: "palette",
      sortOrder: 1,
    });

    await ctx.db.insert("categories", {
      name: "Nightlife",
      slug: "nightlife",
      description: "Clubs, parties, and nightlife experiences",
      icon: "moon",
      sortOrder: 2,
    });

    await ctx.db.insert("categories", {
      name: "Food & Drink",
      slug: "food-drink",
      description: "Food festivals, tastings, and culinary events",
      icon: "utensils-crossed",
      sortOrder: 3,
    });

    await ctx.db.insert("categories", {
      name: "Sports & Fitness",
      slug: "sports-fitness",
      description: "Sports events, tournaments, and fitness activities",
      icon: "dumbbell",
      sortOrder: 4,
    });

    await ctx.db.insert("categories", {
      name: "Tech & Innovation",
      slug: "tech-innovation",
      description: "Tech meetups, conferences, and innovation showcases",
      icon: "cpu",
      sortOrder: 5,
    });

    await ctx.db.insert("featuredSections", {
      slug: "editors_choice",
      label: "Editor's Choice",
      description: "Staff picks",
      enabled: true,
      sortOrder: 0,
    });

    await ctx.db.insert("featuredSections", {
      slug: "trending",
      label: "Trending",
      description: "Most popular right now",
      enabled: true,
      sortOrder: 1,
    });

    await ctx.db.insert("featuredSections", {
      slug: "new_and_noteworthy",
      label: "New & Noteworthy",
      description: "Recently added events",
      enabled: true,
      sortOrder: 2,
    });

    return { seeded: true };
  },
});

export const seedEvents = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.query("events").take(1);
    if (existing.length > 0) return { alreadySeeded: true };

    const categories = await ctx.db.query("categories").collect();
    const cat = (slug: string) => {
      const found = categories.find((c) => c.slug === slug);
      return found ? found._id : (null as any);
    };

    const events = [
      { title: "Hip Hop Night", slug: "hip-hop-night", posterUrl: "/images/events/june-22-28/hiphop.png", categorySlug: "nightlife", featured: true, day: 25, month: 5, year: 2026 },
      { title: "Shift", slug: "shift", posterUrl: "/images/events/june-22-28/shift.png", categorySlug: "nightlife", day: 26, month: 5, year: 2026 },
      { title: "Urban Friends", slug: "urban-friends", posterUrl: "/images/events/june-22-28/urban-friends.png", categorySlug: "music", day: 27, month: 5, year: 2026 },
      { title: "Cycle Session", slug: "cycle-session", posterUrl: "/images/events/june-22-28/cycle.png", categorySlug: "sports-fitness", day: 24, month: 5, year: 2026 },
      { title: "Fashion Lab", slug: "fashion-lab", posterUrl: "/images/events/june-22-28/fashion-lab.png", categorySlug: "arts-culture", day: 27, month: 5, year: 2026 },
      { title: "25 Anime Fest", slug: "anime-fest", posterUrl: "/images/events/june-22-28/25-anime.png", categorySlug: "arts-culture", day: 25, month: 5, year: 2026 },
      { title: "27 Tea Gathering", slug: "tea-gathering", posterUrl: "/images/events/june-22-28/27-tea.png", categorySlug: "food-drink", day: 27, month: 5, year: 2026 },
      { title: "Wegdayt", slug: "wegdayt", posterUrl: "/images/events/june-22-28/wegdayt.png", categorySlug: "music", day: 26, month: 5, year: 2026 },
      { title: "Utopia Night", slug: "utopia-night", posterUrl: "/images/events/july-01-05/utopia-night.png", categorySlug: "nightlife", featured: true, day: 3, month: 6, year: 2026 },
      { title: "Afro Heat", slug: "afro-heat", posterUrl: "/images/events/july-01-05/afro-heat.png", categorySlug: "music", day: 4, month: 6, year: 2026 },
      { title: "Voice Live", slug: "voice-live", posterUrl: "/images/events/july-01-05/voice.png", categorySlug: "music", day: 2, month: 6, year: 2026 },
      { title: "Sip & Paint", slug: "sip-paint", posterUrl: "/images/events/july-01-05/sip-and-paint.png", categorySlug: "arts-culture", day: 5, month: 6, year: 2026 },
      { title: "Jampiano", slug: "jampiano", posterUrl: "/images/events/july-01-05/jampiano.png", categorySlug: "music", day: 3, month: 6, year: 2026 },
      { title: "Adventure Run", slug: "adventure-run", posterUrl: "/images/events/july-01-05/adventure.png", categorySlug: "sports-fitness", day: 5, month: 6, year: 2026 },
      { title: "Unity in Beats", slug: "unity-in-beats", posterUrl: "/images/events/july-13-19/unity-in-beats.png", categorySlug: "music", featured: true, day: 18, month: 6, year: 2026 },
      { title: "Networking Night", slug: "networking-night", posterUrl: "/images/events/july-13-19/networking-night.png", categorySlug: "tech-innovation", day: 17, month: 6, year: 2026 },
      { title: "Feta Society", slug: "feta-society", posterUrl: "/images/events/july-13-19/feta-socity.png", categorySlug: "food-drink", day: 19, month: 6, year: 2026 },
      { title: "Casual Addis", slug: "casual-addis", posterUrl: "/images/events/july-13-19/casaddis.png", categorySlug: "nightlife", day: 18, month: 6, year: 2026 },
      { title: "Ertib", slug: "ertib", posterUrl: "/images/events/july-13-19/ertib.png", categorySlug: "music", day: 16, month: 6, year: 2026 },
      { title: "The House Party", slug: "the-house-party", posterUrl: "/images/events/july-20-26/the-house-party.png", categorySlug: "nightlife", featured: true, day: 25, month: 6, year: 2026 },
      { title: "Night Shift", slug: "night-shift", posterUrl: "/images/events/july-20-26/night-shift.png", categorySlug: "nightlife", day: 24, month: 6, year: 2026 },
      { title: "Bloom Week", slug: "bloom-week", posterUrl: "/images/events/july-20-26/bloom-week.png", categorySlug: "arts-culture", day: 22, month: 6, year: 2026 },
      { title: "Evangadi", slug: "evangadi", posterUrl: "/images/events/july-20-26/evangadi.png", categorySlug: "music", day: 26, month: 6, year: 2026 },
      { title: "Dimket Fest", slug: "dimket-fest", posterUrl: "/images/events/july-20-26/dimket-fest.png", categorySlug: "food-drink", day: 25, month: 6, year: 2026 },
    ];

    for (const e of events) {
      const eventId = await ctx.db.insert("events", {
        title: e.title,
        slug: e.slug,
        description: `Join us for ${e.title} — an amazing event in Addis Ababa.`,
        startDate: new Date(e.year, e.month, e.day).getTime(),
        endDate: new Date(e.year, e.month, e.day, 23, 59).getTime(),
        posterUrl: e.posterUrl,
        venueName: "Addis Ababa",
        venueAddress: "Ethiopia",
        isFree: false,
        actionType: "open_entry",
        status: "published",
        source: "manual",
        isFeatured: e.featured ?? false,
        isStandalone: true,
        frequencyType: "once",
        reservationEnabled: false,
        reservationCount: 0,
        likeCount: Math.floor(Math.random() * 50),
        timezone: "Africa/Addis_Ababa",
        organizerId: undefined as any,
        hostId: undefined as any,
      });
      const categoryId = cat(e.categorySlug);
      if (categoryId) {
        await ctx.db.insert("eventCategories", {
          eventId,
          categoryId,
          isPrimary: true,
        });
      }
    }

    return { seeded: events.length };
  },
});
