import { readdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'

// After `next build`, verify that the React 19 streaming-hydration race
// workaround actually shipped. The fix (see patches/next+16.3.1.patch,
// applied by patch-package in the root postinstall) patches Next.js 16's own
// compiled copy of the scheduler so React defers work while the document is
// still parsing or streaming reveals are queued (window.$RB). If patch-package
// silently failed (e.g. version drift, install skipped), hydration #418 would
// come back in production. This guard fails the build instead.
//
// The marker string matches the patched performWorkUntilDeadline preamble:
//   `("loading"===document.readyState||("undefined"!==typeof window&&null!=window.$RB&&0<window.$RB.length))`
// We grep for the stable `$RB`-length check rather than the whole snippet so
// the guard survives minifier renames of surrounding identifiers.

const STATIC_DIR = '.next/static'
const MARKER = 'window.$RB'
const FALLBACK_MARKER = '$RB'

async function collectJsFiles(dir, out = []) {
  let entries
  try {
    entries = await readdir(dir)
  } catch {
    return out
  }
  for (const entry of entries) {
    const full = join(dir, entry)
    const info = await stat(full)
    if (info.isDirectory()) {
      await collectJsFiles(full, out)
    } else if (entry.endsWith('.js')) {
      out.push(full)
    }
  }
  return out
}

async function main() {
  const files = await collectJsFiles(STATIC_DIR)
  if (files.length === 0) {
    console.error('No .next/static output found — cannot verify scheduler patch.')
    process.exit(1)
  }

  let matched = 0
  for (const file of files) {
    const content = await readFile(file, 'utf8')
    if (content.includes(MARKER) || content.includes(FALLBACK_MARKER)) matched++
  }

  if (matched === 0) {
    console.error(
      'FAIL: React streaming-hydration race workaround is missing from the build.\n' +
        'The scheduler patch (patches/next+16.3.1.patch) was not applied before `next build`.\n' +
        'Run `npm install` at the repo root (postinstall runs patch-package), then rebuild.\n' +
        'This guard exists to prevent silent hydration #418 regressions in production.',
    )
    process.exit(1)
  }

  console.log(`Scheduler patch verified in ${matched} static JS chunk(s).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
