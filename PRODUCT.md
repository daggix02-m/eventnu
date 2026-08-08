# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Internal content team** (primary for the admin app): a small team that posts events on behalf of venues and organizers. Posts several events per day, often batched before an event week. Values speed above all; a routine task must never get slower.
- **Admins**: review, moderate, and publish organizer- and host-submitted content; manage users, reports, categories, CMS pages, notifications, and analytics.
- **End audience** (consumer site, not in scope here): people in Addis Ababa deciding what to do.

## Product Purpose

Event Nu is Addis Ababa's city guide: the single trusted place to know what's happening in the city on any given night. The admin app is the tooling that keeps that guide accurate — a fast, no-fluff posting and management surface.

## Positioning

Addis's city guide. The definitive weekly/nightly program for the city — venue coverage, editorial picks, and curated featured sections (Editor's Choice, Trending, Popular, New & Noteworthy) that no generic event template or social feed can claim.

## Operating Context

- Admin posts events **in batches** before an event week, several per day, on behalf of venues/organizers who may not run their own accounts.
- Real Addis event posters and flyer material are the source imagery (`datas/` at repo root); event covers are drawn from these.
- Posting must be fast and repetitive-safe: smart defaults, one-page flow, rare options tucked away.
- Admin also reviews organizer-submitted events (`pending_review`) and manages content at scale (bulk actions, filters).

## Capabilities and Constraints

Confirmed functionality (must keep working):

- Events with lifecycle statuses: `draft`, `published`, `pending_review`, `rejected`, `cancelled`, `archived`.
- Ownership models: host, organizer, or standalone.
- Categories with parent + subcategories; event can hold a primary and multiple subcategory tags.
- Media: multiple images (carousel, filters, aspect ratios), poster/cover, teaser video + aspect ratio.
- Pricing: free toggle, free-text price display.
- Action types: `open_entry`, `reservation` (with limit), `external_link` (URL + label), `contact` (email).
- Featured sections: `editors_choice`, `trending`, `popular`, `new_and_noteworthy`.
- Platform features surfaced to admins: likes, comments, reservations, reports/moderation, notifications, CMS pages, announcements, analytics, Instagram publishing, timezone default `Africa/Addis_Ababa`.

Technical constraints:

- Backend: Convex (schema in `web/convex/schema.ts`); admin calls it via server actions in `admin-app/src/lib/actions/`.
- Stack: Next.js 16, React 19, Tailwind v4 (`@theme` tokens), framer-motion, TanStack Query, sonner, lucide-react, next-themes dark mode.
- Route structure must stay stable (`/events`, `/events/new`, `/events/[id]`, etc.) — no link breakage.
- Two legacy component systems exist (`src/components/ui` shadcn + `company-design-system`); consolidation into one is desired.

## Brand Commitments

- Name: **Event Nu**; handle **event.nua**; home city **Addis Ababa**.
- Consumer site uses a purple/lavender Material-You family (`#d0bcff`, `#a078ff`), Inter + Space Grotesk + JetBrains Mono, dark-first. The admin app may have a distinct visual world but must not contradict the brand family.
- "Speed over style" is a brand commitment for admin tooling: the redesign must never slow down a routine posting task.

## Evidence on Hand

- Real Addis event poster imagery in `datas/` (nightlife, running, art, family events).
- `AUDIT.md` at repo root documents prior product/technical audit.
- Consumer-site design system in `web/app/globals.css` and `web/components/`.

## Product Principles

1. **Speed is the product.** The posting flow optimizes for a batched content team; every extra decision is a defect.
2. **Completeness is trust.** Accurate dates, venue, price, and access information are the guide's core value.
3. **Admins are the city's voice.** They publish on behalf of venues and own editorial curation (featured sections).
4. **Addis is the subject.** Imagery and tone root to the city's real nightlife and culture.
5. **Content truth is preserved.** Statuses, ownership, categories, media, pricing, and action types are durable product facts that redesigns may relayout but never drop.

## Accessibility & Inclusion

- Existing globals.css already reduces all motion under `prefers-reduced-motion`; the redesign keeps that contract.
- Focus visibility (`:focus-visible`) and contrast must remain intact across light and dark themes.
