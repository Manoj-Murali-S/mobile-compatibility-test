/**
 * lib/repository/mobiles.ts
 * Mobile device CRUD — SQLite (Electron IPC) or Dexie (browser fallback).
 */

import { catalogDb, type CatalogMobile } from '../catalog-db'
import { enqueueSyncItem } from './sync-queue'
import { getDb, isElectron } from '../sqlite/db'
import { getCurrentUserId } from '../auth'

const now = () => new Date().toISOString()
const uuid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

function rowToMobile(row: any): CatalogMobile {
  return {
    id: row.id,
    brand: row.brand,
    model: row.model,
    image: row.image,
    year: row.year,
    variants: row.variants ? JSON.parse(row.variants) : [],
    updatedAt: row.updated_at ?? row.updatedAt,
  }
}

export async function getMobiles(filters?: { brand?: string }): Promise<CatalogMobile[]> {
  if (isElectron()) {
    const db = getDb()
    if (filters?.brand) {
      const rows = await db.allAsync<any>('SELECT * FROM catalog_mobiles WHERE brand = ? ORDER BY model ASC', [filters.brand])
      return rows.map(rowToMobile)
    }
    const rows = await db.allAsync<any>('SELECT * FROM catalog_mobiles ORDER BY brand ASC, model ASC')
    return rows.map(rowToMobile)
  }
  if (filters?.brand) {
    return catalogDb.mobiles.where('brand').equals(filters.brand).sortBy('model')
  }
  return catalogDb.mobiles.orderBy('brand').toArray()
}

export async function getMobileById(id: string): Promise<CatalogMobile | undefined> {
  if (isElectron()) {
    const row = await getDb().getAsync<any>('SELECT * FROM catalog_mobiles WHERE id = ?', [id])
    return row ? rowToMobile(row) : undefined
  }
  return catalogDb.mobiles.get(id)
}

export async function searchMobiles(query: string, limit = 20): Promise<CatalogMobile[]> {
  const term = query.trim().toLowerCase()
  if (!term) return getMobiles()
  if (isElectron()) {
    const rows = await getDb().allAsync<any>(
      `SELECT * FROM catalog_mobiles
       WHERE lower(brand || ' ' || model) LIKE ?
       ORDER BY brand ASC, model ASC
       LIMIT ?`,
      [`%${term}%`, limit]
    )
    return rows.map(rowToMobile)
  }
  return catalogDb.mobiles
    .filter((m) => `${m.brand} ${m.model}`.toLowerCase().includes(term))
    .limit(limit)
    .toArray()
}

export async function upsertMobile(
  mobile: Partial<CatalogMobile> & { brand: string; model: string; createdBy?: string | null; modifiedBy?: string | null },
  skipSync = false
): Promise<CatalogMobile> {
  const currentUserId = getCurrentUserId()
  const record: CatalogMobile = {
    id: mobile.id ?? uuid(),
    brand: mobile.brand.trim(),
    model: mobile.model.trim(),
    image: mobile.image,
    year: mobile.year,
    variants: mobile.variants ?? [],
    updatedAt: mobile.updatedAt ?? now(),
    createdBy: mobile.createdBy ?? currentUserId,
    modifiedBy: mobile.modifiedBy ?? currentUserId,
  }

  if (isElectron()) {
    await getDb().runAsync(
      `INSERT INTO catalog_mobiles (id, brand, model, image, year, variants, status, accessories, created_at, updated_at, created_by, modified_by, created_on, modified_on)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         brand = excluded.brand,
         model = excluded.model,
         image = excluded.image,
         year = excluded.year,
         variants = excluded.variants,
         status = COALESCE(excluded.status, status),
         accessories = COALESCE(excluded.accessories, accessories),
         updated_at = excluded.updated_at,
         modified_by = excluded.modified_by,
         modified_on = excluded.modified_on`,
      [
        record.id, record.brand, record.model, record.image ?? null,
        record.year ?? null,
        JSON.stringify(record.variants ?? []),
        (mobile as any).status ?? 'active',
        (mobile as any).accessories ?? 0,
        (mobile as any).createdAt ?? now(),
        record.updatedAt,
        record.createdBy ?? null,
        record.modifiedBy ?? null,
        (mobile as any).createdAt ?? now(),
        record.updatedAt,
      ]
    )
  } else {
    await catalogDb.mobiles.put(record)
  }

  if (!skipSync) {
    await enqueueSyncItem('catalog_mobiles', record.id, 'upsert', record)
  }
  return record
}

export async function deleteMobile(id: string): Promise<void> {
  if (isElectron()) {
    await getDb().runAsync('DELETE FROM catalog_mobiles WHERE id = ?', [id])
  } else {
    await catalogDb.mobiles.delete(id)
  }
  await enqueueSyncItem('catalog_mobiles', id, 'delete', null)
}

export async function getMobileCount(): Promise<number> {
  if (isElectron()) {
    const row = await getDb().getAsync<{ count: number }>('SELECT COUNT(*) as count FROM catalog_mobiles')
    return row?.count ?? 0
  }
  return catalogDb.mobiles.count()
}

export async function bulkUpsertMobiles(mobiles: CatalogMobile[]): Promise<void> {
  if (isElectron()) {
    for (const mobile of mobiles) {
      await upsertMobile(mobile)
    }
  } else {
    await catalogDb.mobiles.bulkPut(mobiles)
    for (const m of mobiles) {
      await enqueueSyncItem('catalog_mobiles', m.id, 'upsert', m)
    }
  }
}
