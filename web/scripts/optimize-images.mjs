import { readdir, stat, unlink } from 'node:fs/promises'
import { join, extname } from 'node:path'
import sharp from 'sharp'

const TARGETS = ['public/images/events', 'public/asset-2.png']
const WEBP_QUALITY = 80

async function collectPngs(dir, out = []) {
  const entries = await readdir(dir)
  for (const entry of entries) {
    const full = join(dir, entry)
    const info = await stat(full)
    if (info.isDirectory()) {
      await collectPngs(full, out)
    } else if (extname(full).toLowerCase() === '.png') {
      out.push(full)
    }
  }
  return out
}

async function convert(file) {
  const out = file.replace(/\.png$/i, '.webp')
  const { size } = await stat(file)
  await sharp(file, { animated: false }).webp({ quality: WEBP_QUALITY }).toFile(out)
  const result = await stat(out)
  const saved = ((1 - result.size / size) * 100).toFixed(1)
  console.log(
    `${file}  ${(size / 1024 / 1024).toFixed(2)}MB -> ${(result.size / 1024 / 1024).toFixed(2)}MB (${saved}%)`,
  )
  await unlink(file)
  return { inBytes: size, outBytes: result.size }
}

async function main() {
  const files = []
  for (const target of TARGETS) {
    let info
    try {
      info = await stat(target)
    } catch {
      // Already converted in a previous run — nothing to do.
      continue
    }
    if (info.isDirectory()) {
      files.push(...(await collectPngs(target)))
    } else if (extname(target).toLowerCase() === '.png') {
      files.push(target)
    }
  }

  if (files.length === 0) {
    console.log('No PNGs to convert — all images already optimized.')
    return
  }

  let totalIn = 0
  let totalOut = 0
  for (const file of files) {
    const { inBytes, outBytes } = await convert(file)
    totalIn += inBytes
    totalOut += outBytes
  }

  console.log(
    `\nDone. ${files.length} PNGs -> WebP. Total: ${(totalIn / 1024 / 1024).toFixed(1)}MB -> ${(totalOut / 1024 / 1024).toFixed(1)}MB (${((1 - totalOut / totalIn) * 100).toFixed(1)}% smaller)`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
