/**
 * forge.config.js
 *
 * Electron Forge configuration.
 * Packages the Next.js static export (out/) + Electron main process into
 * a distributable Windows installer using Squirrel.Windows.
 *
 * Run:  npm run electron:make
 * Output: out/make/squirrel.windows/x64/Mobile Compatibility Finder Setup.exe
 */

const path = require('path')
const fs   = require('fs')

const iconIco = path.join(__dirname, 'public', 'icon.ico')
const hasIcon = fs.existsSync(iconIco)

if (!hasIcon) {
  console.warn('[forge] WARNING: public/icon.ico not found — using default Electron icon.')
  console.warn('[forge] Run "node scripts/make-icon.js" after adding public/icon.png to generate it.')
}

module.exports = {
  packagerConfig: {
    name:           'Mobile Compatibility Finder',
    executableName: 'mobile-compatibility-finder',
    appVersion:     require('./package.json').version,
    appCopyright:   `Copyright © ${new Date().getFullYear()}`,
    asar:           true,

    // Include the SQLite schema file as an extra resource
    extraResource: [
      path.join(__dirname, 'lib', 'sqlite'),
    ],

    // Windows icon (optional — falls back to default Electron icon if missing)
    ...(hasIcon ? { icon: path.join(__dirname, 'public', 'icon') } : {}),

    // Ignore files/dirs that should NOT be in the packaged app
    ignore: [
      /^\/\.git/,
      /^\/\.next/,
      /^\/electron\//,          // source TS files (compiled output in .electron/ is included)
      /^\/scripts\//,
      /^\/supabase\//,
      /^\/\.env/,
      /^\/start\.bat/,
      /^\/build\.bat/,
      /^\/README\.md/,
      /^\/QUICK_START\.md/,
      /^\/pnpm-lock\.yaml/,
      /^\/package-lock\.json/,
      /node_modules\/\.cache/,
    ],
  },

  makers: [
    // Windows: Squirrel installer (.exe) — silent install, auto-update ready
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name:      'MobileCompatibilityFinder',
        setupExe:  'Mobile Compatibility Finder Setup.exe',
        setupIcon: hasIcon ? iconIco : undefined,
        // Squirrel shortcut locations
        shortcutLocations: ['Desktop', 'StartMenu'],
      },
    },

    // Windows: Portable ZIP (no install needed — just extract and run)
    {
      name:      '@electron-forge/maker-zip',
      platforms: ['win32'],
    },
  ],

  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
}
