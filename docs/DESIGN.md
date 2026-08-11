# Design — Event Nu Admin

The admin app's visual spec. Tokens live in `admin-app/src/app/globals.css`
(Tailwind v4 `@theme`) and the fonts are wired in `admin-app/src/app/layout.tsx`.

## Direction: Fidäl — the manuscript leaf

Admin is a distinct visual world from the consumer site, per `PRODUCT.md`: the
consumer brand is purple/lavender Material-You, dark-first. Admin is a warm "paper and
ink" world — a editorial workbench, not a social feed. The core metaphor is the
**Fidäl manuscript** (the Ge'ez script): warm paper surfaces, an ink-red primary, ruled
guidelines, and annotation mono.

- Dark-first, light available (`next-themes`, class strategy).
- Warm paper neutrals (hue ~44 light / ~30 dark) instead of neutral gray.
- One accent: a burnt ink-red primary (hue ~7). Muted gold secondary (hue ~38-40),
  cool slate tertiary (hue ~220).
- **Speed is the product** (PRODUCT.md): dense, scannable rows; the posting flow
  presents smart defaults and tucks rare options away.

## Color tokens

`globals.css` defines HSL triplets; `@theme` maps them to Tailwind utilities. Use the
semantic names, never raw hex in JSX.

| Family | Token examples | Light (hue) | Dark (hue) |
|---|---|---|---|
| Paper surfaces | `surface`, `surface-container(-low/-high/-highest/-lowest)`, `surface-dim`, `surface-bright`, `surface-variant` | 44-range, near-white containers | 30-range, near-black containers |
| Ink | `foreground`, `on-surface`, `on-surface-variant`, `muted-foreground` | warm 30 | warm 44 |
| Primary | `primary`, `primary-fixed*`, `inverse-primary` | red 7 | red 8 |
| Secondary | `secondary`, `secondary-fixed*` | gold 38-40 | gold 40 |
| Tertiary | `tertiary`, `tertiary-container` | slate 220 | slate 220 |
| Status | `success` (green 150), `warning` (gold 38-40), `destructive`/`error` (red 0) | — | — |
| Lines | `border`, `input`, `outline`, `outline-variant`, `ring` | 44-range | 30-range |
| Skeleton shimmer | `--shimmer` (RGB) | 190 158 132 | 255 238 216 |

Status colors double as the list-badge language: `draft`/`pending` → warning,
`published` → success, `rejected`/`cancelled` → destructive, `archived` → muted.

## Typography — Fidäl grid

Three families via `next/font/google`, exposed as CSS vars and mapped in `@theme`:

| Role | Font | Token |
|---|---|---|
| Display / headline (angular, geometric) | Space Grotesk 400-700 | `--font-headline` |
| Body / workhorse | Inter 400-700 | `--font-sans` |
| Annotation / data / mono | JetBrains Mono 400-600 | `--font-mono` |

Use `font-headline` for page titles and section headers, `font-mono` for IDs,
timestamps, and data annotations.

## Shape & rhythm

- Radius: `--radius: 0.625rem`; `lg` = base, `md` = base − 2px, `sm` = base − 4px.
- Sidebar width `--spacing-sidebar: 260px`; gutter `1.5rem`; section gap `2.5rem`.
- Scrollbars are 6px, thumb `outline-variant`, transparent track.
- **Rubric rule**: `.rubric-rule` draws a 2px primary hairline under headings/section
  rules — the Fidäl rubric underline.
- **Ruled page**: `.ruled-page` paints a faint 48px ruled column grid behind content.

## Motion

Animations must degrade gracefully under `prefers-reduced-motion` (globally enforced
in `globals.css`).

| Token | Use | Curve |
|---|---|---|
| `fade-in` | toasts, light reveals | 0.2s ease-out |
| `slide-in` / `slide-out` | dialogs, panels | 0.3s/0.2s |
| `ink-in` | content soaking into the page | 0.32s cubic-bezier(0.22,1,0.36,1), blur 3px → 0, rise 6px |
| `ruling-shimmer` | skeleton sheen (`.skeleton-sheen`) | 1.8s ease-in-out infinite |

Shared framer-motion presets (e.g. `fadeUp`) live in `admin-app/src/lib/motion.ts` —
import, don't duplicate.

## Interaction contract

- `:focus-visible` ring: 2px `ring` outline, 2px offset. `:focus:not(:focus-visible)`
  has no outline.
- Interactive controls need accessible names (`aria-label`, `aria-pressed`, …); icons
  are `aria-hidden`.
- Status badges and data tables are keyboard-reachable; dialogs trap focus; table sort
  sets `aria-sort`.
