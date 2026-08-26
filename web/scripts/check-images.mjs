import { readdir, stat } from 'node:fs/promises'
import { join, extname } from 'node:path'

// Fails CI when oversized or uncompressed images are committed to public/.
// Static assets ship verbatim to users on the first request, so keeping them
// small is part of the performance budget (see lighthouserc.json).

const ROOT = 'public'
const MAX_BYTES = 1024 * 1024 // 1 MB per image
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif'])

async function walk(dir, out = []) {
  const entries = await readdir(dir)
  for (const entry of entries) {
    const full = join(dir, entry)
    const info = await stat(full)
    if (info.isDirectory()) {
      await walk(full, out)
    } else if (IMAGE_EXT.has(extname(full).toLowerCase())) {
      out.push({ full, size: info.size })
    }
  }
  return out
}

const problems = []

// Rule 1: any image over the size budget.
const images = await walk(ROOT)
for (const { full, size } of images) {
  if (size > MAX_BYTES) {
    problems.push(`${full} is ${(size / 1024 / 1024).toFixed(2)}MB (limit 1MB)`)
  }
}

// Rule 2: event posters must be WebP — run `node scripts/optimize-images.mjs`.
const eventPngs = images.filter(
  (i) => i.full.startsWith(`${ROOT}/images/events`) && extname(i.full) === '.png',
)
for (const { full } of eventPngs) {
  problems.push(`${full} should be converted to WebP (run node scripts/optimize-images.mjs)`)
}

if (problems.length > 0) {
  console.error(
    `Image size check failed (${problems.length} issue${problems.length === 1 ? '' : 's'}):`,
  )
  for (const p of problems) console.error(`  - ${p}`)
  process.exit(1)
}

console.log(`Image size check passed: ${images.length} images in ${ROOT}/, all within budget.`)
