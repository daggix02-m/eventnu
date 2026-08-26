import { test, expect, type Page } from '@playwright/test'

// Regression guard for React #418 hydration mismatches in production builds.
// A hydration error surfaces as a console error containing "#418" (minified)
// or the phrase "Hydration failed"/"did not match" (dev). Either form fails the
// test so a hydration regression can never silently reach production again.

const HYDRATION_ERROR_PATTERNS = [/Hydration failed/i, /did not match/i, /error #418/, /418/]

function hydrationErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const text = msg.text()
    if (HYDRATION_ERROR_PATTERNS.some((re) => re.test(text))) {
      errors.push(text)
    }
  })
  page.on('pageerror', (err) => {
    const text = err.message
    if (HYDRATION_ERROR_PATTERNS.some((re) => re.test(text))) {
      errors.push(text)
    }
  })
  return errors
}

function todayStr(): string {
  const now = new Date()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${m}-${d}`
}

async function expectNoHydrationErrors(page: Page, url: string) {
  const errors = hydrationErrors(page)
  await page.goto(url, { waitUntil: 'networkidle' })
  // Give hydration + any immediate post-mount re-renders time to settle.
  await page.waitForTimeout(1500)
  expect(errors, `hydration errors on ${url}`).toEqual([])
}

test('home page hydrates cleanly', async ({ page }) => {
  await expectNoHydrationErrors(page, '/')
})

test('home page with category param hydrates cleanly', async ({ page }) => {
  // /discover?category=X redirects to /?category=X — the static bake has empty
  // params, so a mismatch here would have been the deterministic #418 source.
  await expectNoHydrationErrors(page, '/?category=music')
})

test('schedule page with date param hydrates cleanly', async ({ page }) => {
  // /categories redirects to /schedule?category=… — same static-bake risk.
  await expectNoHydrationErrors(page, `/schedule?date=${todayStr()}`)
})

test('event detail page hydrates cleanly', async ({ page }) => {
  // Discover a real event slug from the home page rather than hard-coding one
  // that may drift out of the seed data.
  const errors = hydrationErrors(page)
  await page.goto('/', { waitUntil: 'networkidle' })
  const href = page
    .locator('a[href^="/events/"]')
    .first()
    .getAttribute('href')
    .then((h) => h ?? null)
    .catch(() => null)
  const slug = await href
  await page.waitForTimeout(1500)
  expect(errors, `hydration errors on /`).toEqual([])

  if (!slug) {
    test.skip(true, 'no event links found on home page to build a detail-page URL')
    return
  }

  await expectNoHydrationErrors(page, slug)
})
