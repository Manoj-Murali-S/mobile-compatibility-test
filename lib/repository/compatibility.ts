/**
 * lib/repository/compatibility.ts
 * Compatibility record CRUD — SQLite (Electron) or Dexie (browser).
 */

import { catalogDb, type CatalogCompatibility } from '../catalog-db'
import { enqueueSyncItem } from './sync-queue'
import { getDb, isElectron } from '../sqlite/db'
import { getCurrentUserId } from '../auth'

const now = () => new Date().toISOString()

function rowToCompat(row: any): CatalogCompatibility {
  return {
    id: row.id,
    category: row.category,
    sourceModel: row.source_model ?? row.sourceModel,
    compatibleModels: row.compatible_models ? JSON.parse(row.compatible_models) : [],
    updatedAt: row.updated_at ?? row.updatedAt,
  }
}

export async function getCompatibilityForModel(sourceModel: string): Promise<CatalogCompatibility[]> {
  if (isElectron()) {
    const rows = await getDb().allAsync<any>('SELECT * FROM catalog_compatibility WHERE source_model = ? ORDER BY category ASC', [sourceModel])
    return rows.map(rowToCompat)
  }
  return catalogDb.compatibility.where('sourceModel').equals(sourceModel).toArray()
}

export async function getAllCompatibility(): Promise<CatalogCompatibility[]> {
  if (isElectron()) {
    const rows = await getDb().allAsync<any>('SELECT * FROM catalog_compatibility ORDER BY source_model, category')
    return rows.map(rowToCompat)
  }
  return catalogDb.compatibility.toArray()
}

export async function upsertCompatibility(
  entry: CatalogCompatibility & { createdBy?: string | null; modifiedBy?: string | null },
  skipSync = false
): Promise<void> {
  const currentUserId = getCurrentUserId()
  const record = { 
    ...entry, 
    updatedAt: entry.updatedAt ?? now(),
    createdBy: entry.createdBy ?? currentUserId,
    modifiedBy: entry.modifiedBy ?? currentUserId,
  }
  if (isElectron()) {
    await getDb().runAsync(
      `INSERT INTO catalog_compatibility (id, category, source_model, compatible_models, updated_at, created_by, modified_by, created_on, modified_on)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         category = excluded.category,
         source_model = excluded.source_model,
         compatible_models = excluded.compatible_models,
         updated_at = excluded.updated_at,
         modified_by = excluded.modified_by,
         modified_on = excluded.modified_on`,
      [
        record.id, record.category, record.sourceModel,
        JSON.stringify(record.compatibleModels ?? []),
        record.updatedAt,
        record.createdBy ?? null,
        record.modifiedBy ?? null,
        (entry as any).createdAt ?? now(),
        record.updatedAt,
      ]
    )
  } else {
    await catalogDb.compatibility.put(record)
  }
  if (!skipSync) {
    await enqueueSyncItem('catalog_compatibility', record.id, 'upsert', record)
  }
}

export async function deleteCompatibility(id: string): Promise<void> {
  if (isElectron()) {
    await getDb().runAsync('DELETE FROM catalog_compatibility WHERE id = ?', [id])
  } else {
    await catalogDb.compatibility.delete(id)
  }
  await enqueueSyncItem('catalog_compatibility', id, 'delete', null)
}

export async function bulkUpsertCompatibility(entries: CatalogCompatibility[]): Promise<void> {
  if (isElectron()) {
    for (const e of entries) await upsertCompatibility(e)
  } else {
    await catalogDb.compatibility.bulkPut(entries)
    for (const e of entries) await enqueueSyncItem('catalog_compatibility', e.id, 'upsert', e)
  }
}
