import { readdir, stat, writeFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

// After `next build`, walk the hashed static output and write a precache
// manifest (public/sw-precache.json) so the service worker can install the
// app shell (JS chunks, CSS, fonts) for instant repeat visits. Content-hashed
// URLs are immutable, so a stale manifest is harmless — it just misses.
// Idempotent: regenerates the whole file on every build.

const STATIC_DIR = '.next/static'
const OUT = 'public/sw-precache.json'
const EXTENSIONS = new Set(['.js', '.css', '.woff2', '.woff', '.ttf'])

async function collect(dir, base, out = []) {
  const entries = await readdir(dir)
  for (const entry of entries) {
    const full = join(dir, entry)
    const info = await stat(full)
    if (info.isDirectory()) {
      await collect(full, base, out)
    } else {
      const ext = entry.slice(entry.lastIndexOf('.')).toLowerCase()
      if (EXTENSIONS.has(ext)) {
        out.push(`/_next/static/${relative(base, full).replace(/\\/g, '/')}`)
      }
    }
  }
  return out
}

async function main() {
  let files
  try {
    const base = join(STATIC_DIR)
    files = await collect(base, base)
  } catch {
    console.log('No .next/static output found — skipping SW precache manifest.')
    return
  }
  if (files.length === 0) return
  await writeFile(OUT, JSON.stringify(files, null, 2) + '\n')
  console.log(
    `Wrote ${OUT} with ${files.length} assets (${(JSON.stringify(files).length / 1024).toFixed(1)} KB).`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
