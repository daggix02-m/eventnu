/**
 * Background helpers for the full-screen ambient shader.
 *
 * Kept pure and side-effect free so the gating decisions are unit-testable;
 * the components read browser APIs once and feed the results in here.
 */

const LOW_MEMORY_GB = 2
const LOW_MEMORY_GB_WITH_FEW_CORES = 4
const FEW_CORES = 4

/**
 * Whether the device is low-end enough to skip the full-screen WebGL shader
 * and render the CSS static frame instead. Targets genuinely constrained
 * devices (old 2 GB phones, budget Androids); modern phones and all desktops
 * keep the shader, preserving the brand's ambient background everywhere it
 * can run smoothly.
 */
export function isLowEndDevice(opts: {
  deviceMemory?: number
  hardwareConcurrency?: number
}): boolean {
  const { deviceMemory, hardwareConcurrency } = opts

  if (typeof deviceMemory === 'number' && deviceMemory > 0) {
    if (deviceMemory <= LOW_MEMORY_GB) return true
    if (
      deviceMemory <= LOW_MEMORY_GB_WITH_FEW_CORES &&
      typeof hardwareConcurrency === 'number' &&
      hardwareConcurrency > 0 &&
      hardwareConcurrency <= FEW_CORES
    ) {
      return true
    }
  }

  return false
}

/**
 * Read the theme's `--color-primary` so the shader's violet matches the rest
 * of the UI (marquee accents, buttons). The CSS variable is a hex color in the
 * Tailwind theme; if it is ever redefined as an rgb triplet, wrap it so
 * THREE.Color can parse it. Falls back to `fallback` when the variable is
 * absent (e.g. jsdom, or before the stylesheet applies).
 */
export function readThemePrimary(fallback: string): string {
  if (typeof window === 'undefined') return fallback
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim()
  if (!raw) return fallback
  return raw.startsWith('#') ? raw : `rgb(${raw})`
}
