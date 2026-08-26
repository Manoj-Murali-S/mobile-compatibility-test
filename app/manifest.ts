import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cell's and Cell - Mobile Compatibility Finder",
    short_name: "C&C Finder",
    description: "Find compatible mobile accessories for your phone — Cell's and Cell official catalog",
    start_url: '/',
    display: 'standalone',
    background_color: '#7B1FA2',
    theme_color: '#E91E8C',
    icons: [
      { src: '/icon.svg',          sizes: 'any',     type: 'image/svg+xml', purpose: 'any' },
      { src: '/apple-icon.png',    sizes: '180x180', type: 'image/png',     purpose: 'any' },
      { src: '/logo.png',          sizes: '512x512', type: 'image/png',     purpose: 'maskable' },
    ],
  }

}
