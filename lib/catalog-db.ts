import Dexie, { type Table } from 'dexie'

export type CatalogBrand = { id: string; name: string; logo?: string; updatedAt: string }
export type CatalogMobile = { id: string; model: string; brand: string; year?: number; variants?: string[]; updatedAt: string }
export type CatalogCompatibility = { id: string; category: string; sourceModel: string; compatibleModels: string[]; updatedAt: string }
export type CatalogAccessory = { id: string; category: string; name: string; compatibleModels: string[]; updatedAt: string }
export type CatalogSetting = { key: string; value: unknown; updatedAt: string }
export type SyncQueueItem = { id?: number; table: string; recordId: string; operation: 'upsert' | 'delete'; payload?: unknown; updatedAt: string }

export class CatalogDatabase extends Dexie {
  brands!: Table<CatalogBrand, string>
  mobiles!: Table<CatalogMobile, string>
  compatibility!: Table<CatalogCompatibility, string>
  accessories!: Table<CatalogAccessory, string>
  settings!: Table<CatalogSetting, string>
  syncQueue!: Table<SyncQueueItem, number>

  constructor() {
    super('mobile-compatibility-finder')
    this.version(1).stores({
      brands: 'id, name, updatedAt',
      mobiles: 'id, model, brand, updatedAt',
      compatibility: 'id, category, sourceModel, updatedAt',
      accessories: 'id, category, updatedAt',
      settings: 'key, updatedAt',
      syncQueue: '++id, table, recordId, updatedAt',
    })
  }
}

export const catalogDb = new CatalogDatabase()

export async function requestPersistentStorage() {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) return false
  return navigator.storage.persist()
}

export async function getStorageHealth() {
  if (typeof navigator === 'undefined') return { persisted: false, usage: 0, quota: 0 }
  const persisted = navigator.storage?.persisted ? await navigator.storage.persisted() : false
  const estimate = navigator.storage?.estimate ? await navigator.storage.estimate() : {}
  return { persisted, usage: estimate.usage ?? 0, quota: estimate.quota ?? 0 }
}

export async function clearCatalogDatabase() {
  await Promise.all([
    catalogDb.brands.clear(), catalogDb.mobiles.clear(), catalogDb.compatibility.clear(),
    catalogDb.accessories.clear(), catalogDb.settings.clear(), catalogDb.syncQueue.clear(),
  ])
}

export async function exportCatalogSnapshot() {
  const [brands, mobiles, compatibility, accessories, settings] = await Promise.all([
    catalogDb.brands.toArray(), catalogDb.mobiles.toArray(), catalogDb.compatibility.toArray(),
    catalogDb.accessories.toArray(), catalogDb.settings.toArray(),
  ])
  return { version: 1, exportedAt: new Date().toISOString(), brands, mobiles, compatibility, accessories, settings }
}

export async function importCatalogSnapshot(snapshot: Record<string, unknown>) {
  await catalogDb.transaction('rw', catalogDb.tables, async () => {
    await clearCatalogDatabase()
    if (Array.isArray(snapshot.brands)) await catalogDb.brands.bulkPut(snapshot.brands)
    if (Array.isArray(snapshot.mobiles)) await catalogDb.mobiles.bulkPut(snapshot.mobiles)
    if (Array.isArray(snapshot.compatibility)) await catalogDb.compatibility.bulkPut(snapshot.compatibility)
    if (Array.isArray(snapshot.accessories)) await catalogDb.accessories.bulkPut(snapshot.accessories)
    if (Array.isArray(snapshot.settings)) await catalogDb.settings.bulkPut(snapshot.settings)
  })
}
