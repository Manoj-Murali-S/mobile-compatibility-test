import { catalogDb, type CatalogBrand, type CatalogCompatibility, type CatalogMobile, type CatalogAccessory } from './catalog-db'
import { seedCatalogIfEmpty } from './catalog-repository'

export type OfflineCatalog = {
  brands: unknown[]
  mobiles: unknown[]
  compatibility: unknown[]
  accessories: unknown[]
  settings: Record<string, unknown>
  savedAt: string
}

export async function saveOfflineCatalog(catalog: OfflineCatalog) {
  if (typeof window === 'undefined') return
  const updatedAt = catalog.savedAt || new Date().toISOString()
  await catalogDb.transaction('rw', catalogDb.tables, async () => {
    await catalogDb.brands.clear(); await catalogDb.mobiles.clear(); await catalogDb.compatibility.clear(); await catalogDb.accessories.clear()
    if (Array.isArray(catalog.brands)) await catalogDb.brands.bulkPut(catalog.brands as CatalogBrand[])
    if (Array.isArray(catalog.mobiles)) await catalogDb.mobiles.bulkPut(catalog.mobiles as CatalogMobile[])
    if (Array.isArray(catalog.compatibility)) await catalogDb.compatibility.bulkPut(catalog.compatibility as CatalogCompatibility[])
    if (Array.isArray(catalog.accessories)) await catalogDb.accessories.bulkPut(catalog.accessories as CatalogAccessory[])
    await catalogDb.settings.put({ key: 'catalog-meta', value: { ...catalog.settings, savedAt: updatedAt }, updatedAt })
  })
}

export async function getOfflineCatalog(): Promise<OfflineCatalog | null> {
  if (typeof window === 'undefined') return null
  const mobiles = await catalogDb.mobiles.toArray()
  if (!mobiles.length) return null
  const [brands, compatibility, accessories, meta] = await Promise.all([
    catalogDb.brands.toArray(), catalogDb.compatibility.toArray(), catalogDb.accessories.toArray(), catalogDb.settings.get('catalog-meta'),
  ])
  const value = (meta?.value ?? {}) as Record<string, unknown>
  return { brands, mobiles, compatibility, accessories, settings: value, savedAt: String(value.savedAt ?? '') }
}

export async function clearOfflineCatalog() {
  await Promise.all([catalogDb.brands.clear(), catalogDb.mobiles.clear(), catalogDb.compatibility.clear(), catalogDb.accessories.clear(), catalogDb.settings.clear()])
}

export async function hydrateOfflineCatalog() {
  await seedCatalogIfEmpty()
  return getOfflineCatalog()
}

export function isOffline() {
  return typeof navigator !== 'undefined' && !navigator.onLine
}

export function subscribeToConnectionStatus(callback: (online: boolean) => void) {
  const online = () => callback(true); const offline = () => callback(false)
  window.addEventListener('online', online); window.addEventListener('offline', offline)
  return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline) }
}
