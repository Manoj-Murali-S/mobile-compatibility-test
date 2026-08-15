/**
 * lib/offline-store.ts
 *
 * Updated to delegate to the new Repository Layer.
 * The browser fallback still uses Dexie via the repository's internal routing.
 * Connection status helpers are unchanged.
 */

import { getMobiles, getBrands, getAllCompatibility, getAccessories } from './repository'
import { getSetting } from './repository/settings'
import { seedCatalogIfEmpty } from './repository/seeder'

export type OfflineCatalog = {
  brands: unknown[]
  mobiles: unknown[]
  compatibility: unknown[]
  accessories: unknown[]
  settings: Record<string, unknown>
  savedAt: string
}

export async function getOfflineCatalog(): Promise<OfflineCatalog | null> {
  if (typeof window === 'undefined') return null
  try {
    const mobiles = await getMobiles()
    if (!mobiles.length) return null
    const [brands, compatibility, accessories, savedAt] = await Promise.all([
      getBrands(),
      getAllCompatibility(),
      getAccessories(),
      getSetting<string>('catalog-meta'),
    ])
    return {
      brands,
      mobiles,
      compatibility,
      accessories,
      settings: {},
      savedAt: savedAt ?? '',
    }
  } catch {
    return null
  }
}

export async function hydrateOfflineCatalog(): Promise<OfflineCatalog | null> {
  await seedCatalogIfEmpty()
  return getOfflineCatalog()
}

export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine
}

export function subscribeToConnectionStatus(callback: (online: boolean) => void): () => void {
  const online = () => callback(true)
  const offline = () => callback(false)
  window.addEventListener('online', online)
  window.addEventListener('offline', offline)
  return () => {
    window.removeEventListener('online', online)
    window.removeEventListener('offline', offline)
  }
}
