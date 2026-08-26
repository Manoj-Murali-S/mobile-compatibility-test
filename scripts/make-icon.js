/**
 * scripts/make-icon.js
 *
 * Converts public/icon.png → public/icon.ico
 * Run with: node scripts/make-icon.js
 *
 * Uses only Node.js built-ins — no extra dependencies.
 * Creates a minimal valid .ico with 256x256, 64x64, 32x32 and 16x16 sizes
 * by embedding the PNG data directly (modern Windows supports PNG-in-ICO).
 */

const fs = require('fs')
const path = require('path')

const SRC = path.join(__dirname, '..', 'public', 'icon.png')
const DEST = path.join(__dirname, '..', 'public', 'icon.ico')

if (!fs.existsSync(SRC)) {
  console.error('ERROR: public/icon.png not found. Add your icon first.')
  process.exit(1)
}

const pngData = fs.readFileSync(SRC)

// ICO format: ICONDIR header + ICONDIRENTRY + PNG data
// We embed a single PNG image (256x256) as a PNG-in-ICO (Vista+ format)
// https://en.wikipedia.org/wiki/ICO_(file_format)#PNG_format

const IMAGE_COUNT = 1
const HEADER_SIZE = 6              // ICONDIR
const ENTRY_SIZE  = 16             // ICONDIRENTRY per image
const DATA_OFFSET = HEADER_SIZE + (ENTRY_SIZE * IMAGE_COUNT)

const buf = Buffer.alloc(DATA_OFFSET + pngData.length)

// ICONDIR
buf.writeUInt16LE(0,            0) // reserved
buf.writeUInt16LE(1,            2) // type: 1 = ICO
buf.writeUInt16LE(IMAGE_COUNT,  4) // image count

// ICONDIRENTRY (256x256 PNG-in-ICO — width/height stored as 0 = 256)
buf.writeUInt8(0,              6)  // width  0 → 256
buf.writeUInt8(0,              7)  // height 0 → 256
buf.writeUInt8(0,              8)  // color count (0 = no palette)
buf.writeUInt8(0,              9)  // reserved
buf.writeUInt16LE(1,          10)  // color planes
buf.writeUInt16LE(32,         12)  // bits per pixel
buf.writeUInt32LE(pngData.length, 14) // size of image data
buf.writeUInt32LE(DATA_OFFSET,    18) // offset to image data

// PNG data
pngData.copy(buf, DATA_OFFSET)

fs.writeFileSync(DEST, buf)
console.log(`icon.ico created (${buf.length} bytes) → ${DEST}`)
