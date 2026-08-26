/**
 * scripts/setup-logo.js
 *
 * Run this once after adding your logo:
 *   node scripts/setup-logo.js
 *
 * It will:
 *   1. Generate public/icon.ico from public/logo.png (for Electron installer)
 *   2. Copy logo.png → public/icon.png (alias used by make-icon.js)
 */

const fs   = require('fs')
const path = require('path')

const LOGO   = path.join(__dirname, '..', 'public', 'logo.png')
const ICO    = path.join(__dirname, '..', 'public', 'icon.ico')
const ICON   = path.join(__dirname, '..', 'public', 'icon.png')

if (!fs.existsSync(LOGO)) {
  console.error('ERROR: public/logo.png not found.')
  console.error('  Save your logo as public/logo.png (PNG format, recommended 512x512 or larger), then re-run this script.')
  process.exit(1)
}

// Copy logo.png → icon.png
fs.copyFileSync(LOGO, ICON)
console.log('Copied logo.png → icon.png')

// Generate a minimal PNG-in-ICO (Vista+ format, works on Windows 7+)
const pngData = fs.readFileSync(LOGO)
const IMAGE_COUNT = 1
const DATA_OFFSET = 6 + 16 * IMAGE_COUNT
const buf = Buffer.alloc(DATA_OFFSET + pngData.length)

buf.writeUInt16LE(0,            0)  // reserved
buf.writeUInt16LE(1,            2)  // type ICO
buf.writeUInt16LE(IMAGE_COUNT,  4)  // count

// ICONDIRENTRY
buf.writeUInt8(0,              6)   // width  (0 = 256)
buf.writeUInt8(0,              7)   // height (0 = 256)
buf.writeUInt8(0,              8)   // color count
buf.writeUInt8(0,              9)   // reserved
buf.writeUInt16LE(1,          10)   // planes
buf.writeUInt16LE(32,         12)   // bpp
buf.writeUInt32LE(pngData.length, 14)
buf.writeUInt32LE(DATA_OFFSET,    18)

pngData.copy(buf, DATA_OFFSET)
fs.writeFileSync(ICO, buf)
console.log(`Generated icon.ico (${buf.length} bytes)`)
console.log('')
console.log('Done! You can now run build.bat to create the installer.')
