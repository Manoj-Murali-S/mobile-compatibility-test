/**
 * lib/repository/accessories.ts
 * Accessory CRUD — SQLite (Electron) or Dexie (browser).
 */

import { catalogDb, type CatalogAccessory } from '../catalog-db'
import { enqueueSyncItem } from './sync-queue'
import { getDb, isElectron } from '../sqlite/db'
import { getCurrentUserId } from '../auth'

const now = () => new Date().toISOString()

function rowToAccessory(row: any): CatalogAccessory {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    compatibleModels: row.compatible_models ? JSON.parse(row.compatible_models) : [],
    updatedAt: row.updated_at ?? row.updatedAt,
  }
}

export async function getAccessories(filters?: { category?: string }): Promise<CatalogAccessory[]> {
  if (isElectron()) {
    const db = getDb()
    if (filters?.category) {
      const rows = await db.allAsync<any>('SELECT * FROM catalog_accessories WHERE category = ? ORDER BY name ASC', [filters.category])
      return rows.map(rowToAccessory)
    }
    const rows = await db.allAsync<any>('SELECT * FROM catalog_accessories ORDER BY category, name')
    return rows.map(rowToAccessory)
  }
  if (filters?.category) {
    return catalogDb.accessories.where('category').equals(filters.category).toArray()
  }
  return catalogDb.accessories.toArray()
}

export async function upsertAccessory(
  acc: CatalogAccessory & { createdBy?: string | null; modifiedBy?: string | null },
  skipSync = false
): Promise<void> {
  const currentUserId = getCurrentUserId()
  const record = { 
    ...acc, 
    updatedAt: acc.updatedAt ?? now(),
    createdBy: acc.createdBy ?? currentUserId,
    modifiedBy: acc.modifiedBy ?? currentUserId,
  }
  if (isElectron()) {
    await getDb().runAsync(
      `INSERT INTO catalog_accessories (id, category, name, compatible_models, updated_at, created_by, modified_by, created_on, modified_on)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         category = excluded.category,
         name = excluded.name,
         compatible_models = excluded.compatible_models,
         updated_at = excluded.updated_at,
         modified_by = excluded.modified_by,
         modified_on = excluded.modified_on`,
      [
        record.id, record.category, record.name,
        JSON.stringify(record.compatibleModels ?? []),
        record.updatedAt,
        record.createdBy ?? null,
        record.modifiedBy ?? null,
        (acc as any).createdAt ?? now(),
        record.updatedAt,
      ]
    )
  } else {
    await catalogDb.accessories.put(record)
  }
  if (!skipSync) {
    await enqueueSyncItem('catalog_accessories', record.id, 'upsert', record)
  }
}

export async function deleteAccessory(id: string): Promise<void> {
  if (isElectron()) {
    await getDb().runAsync('DELETE FROM catalog_accessories WHERE id = ?', [id])
  } else {
    await catalogDb.accessories.delete(id)
  }
  await enqueueSyncItem('catalog_accessories', id, 'delete', null)
}

export async function getAccessoryCount(): Promise<number> {
  if (isElectron()) {
    const row = await getDb().getAsync<{ count: number }>('SELECT COUNT(*) as count FROM catalog_accessories')
    return row?.count ?? 0
  }
  return catalogDb.accessories.count()
}

export async function bulkUpsertAccessories(accessories: CatalogAccessory[]): Promise<void> {
  if (isElectron()) {
    for (const a of accessories) await upsertAccessory(a)
  } else {
    await catalogDb.accessories.bulkPut(accessories)
    for (const a of accessories) await enqueueSyncItem('catalog_accessories', a.id, 'upsert', a)
  }
}
