// Builds every icon the site serves from one source: the barn logo artwork.
// Run with `npm run icons` after changing the art or the crop below.
//
// The crop is the barn itself, not the whole scene — a favicon renders at 16px,
// where the full painting turns to mush but the red roof still reads.
import sharp from 'sharp'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const SOURCE = 'art-src/barn_wedding_logo.png'
const PUBLIC = 'public'

/** Paper cream, matching --paper and the theme-color meta. iOS ignores alpha
 *  on home-screen icons, so everything is flattened onto this. */
const PAPER = '#f6eedf'

/** The barn, centred on its door. Source art is 2048x1879. */
const BARN = { left: 790, top: 380, width: 1180, height: 1180 }

const barn = () => sharp(SOURCE).extract(BARN).flatten({ background: PAPER })

/** A square PNG of the barn at `size`. */
async function square(size) {
  return barn().resize(size, size).png({ compressionLevel: 9 }).toBuffer()
}

/**
 * Pack PNGs into an .ico. An ICO is a 6-byte header, one 16-byte entry per
 * image, then the payloads — and since Vista the payload may be a PNG as-is,
 * so no BMP encoding is needed.
 */
function buildIco(images) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // 1 = icon
  header.writeUInt16LE(images.length, 4)

  let offset = 6 + images.length * 16
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size >= 256 ? 0 : size, 0) // 0 means 256
    entry.writeUInt8(size >= 256 ? 0 : size, 1)
    entry.writeUInt8(0, 2) // palette colours
    entry.writeUInt8(0, 3) // reserved
    entry.writeUInt16LE(1, 4) // colour planes
    entry.writeUInt16LE(32, 6) // bits per pixel
    entry.writeUInt32LE(data.length, 8)
    entry.writeUInt32LE(offset, 12)
    offset += data.length
    return entry
  })

  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)])
}

/** The link-preview card: the whole painting, uncropped, on paper. */
async function shareCard() {
  const W = 1200
  const H = 630
  const art = await sharp(SOURCE)
    .resize({ height: Math.round(H * 0.94), fit: 'inside' })
    .png()
    .toBuffer()
  return sharp({
    create: { width: W, height: H, channels: 4, background: PAPER },
  })
    .composite([{ input: art, gravity: 'centre' }])
    .png({ compressionLevel: 9 })
    .toBuffer()
}

const written = []
async function write(name, data) {
  await writeFile(join(PUBLIC, name), data)
  written.push(`${name} (${(data.length / 1024).toFixed(1)} KB)`)
}

// Tab icons, home-screen icon, and the manifest's Android sizes.
for (const size of [32, 96, 192, 512]) {
  await write(`icon-${size}.png`, await square(size))
}
await write('apple-touch-icon.png', await square(180))

// /favicon.ico is still requested bare by link unfurlers and feed readers.
await write(
  'favicon.ico',
  buildIco([
    { size: 16, data: await square(16) },
    { size: 32, data: await square(32) },
  ]),
)

await write('og-image.png', await shareCard())

console.log('Wrote:\n  ' + written.join('\n  '))
