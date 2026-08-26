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
    brandId: row.brand_id ?? row.brandId,
    brandName: row.brand_name ?? row.brandName,
    model: row.model,
    image: row.image,
    status: row.status ?? 'active',
    updatedAt: row.updated_at ?? row.updatedAt,
  } as CatalogMobile
}

export async function getMobiles(filters?: { brandId?: string }): Promise<CatalogMobile[]> {
  if (isElectron()) {
    const db = getDb()
    if (filters?.brandId) {
      const rows = await db.allAsync<any>(
        `SELECT m.*, b.name as brand_name 
         FROM catalog_mobiles m 
         LEFT JOIN catalog_brands b ON m.brand_id = b.id 
         WHERE m.brand_id = ? 
         ORDER BY m.model ASC`,
        [filters.brandId]
      )
      return rows.map(rowToMobile)
    }
    const rows = await db.allAsync<any>(
      `SELECT m.*, b.name as brand_name 
       FROM catalog_mobiles m 
       LEFT JOIN catalog_brands b ON m.brand_id = b.id 
       ORDER BY b.name ASC, m.model ASC`
    )
    return rows.map(rowToMobile)
  }

  // Dexie
  let list: CatalogMobile[] = []
  if (filters?.brandId) {
    list = await catalogDb.mobiles.where('brandId').equals(filters.brandId).sortBy('model')
  } else {
    list = await catalogDb.mobiles.toArray()
  }

  // Resolve brandNames
  const brands = await catalogDb.brands.toArray()
  const brandMap = new Map(brands.map(b => [b.id, b.name]))
  for (const m of list) {
    ;(m as any).brandName = brandMap.get(m.brandId) ?? 'Unknown Brand'
  }
  return list
}

export async function getMobileById(id: string): Promise<CatalogMobile | undefined> {
  if (isElectron()) {
    const row = await getDb().getAsync<any>(
      `SELECT m.*, b.name as brand_name 
       FROM catalog_mobiles m 
       LEFT JOIN catalog_brands b ON m.brand_id = b.id 
       WHERE m.id = ?`,
      [id]
    )
    return row ? rowToMobile(row) : undefined
  }
  const mobile = await catalogDb.mobiles.get(id)
  if (mobile) {
    const brand = await catalogDb.brands.get(mobile.brandId)
    ;(mobile as any).brandName = brand?.name ?? 'Unknown Brand'
  }
  return mobile
}

export async function searchMobiles(query: string, limit = 20): Promise<CatalogMobile[]> {
  const term = query.trim().toLowerCase()
  if (!term) return getMobiles()
  
  if (isElectron()) {
    const rows = await getDb().allAsync<any>(
      `SELECT m.*, b.name as brand_name 
       FROM catalog_mobiles m 
       LEFT JOIN catalog_brands b ON m.brand_id = b.id
       WHERE lower(b.name || ' ' || m.model) LIKE ?
       ORDER BY b.name ASC, m.model ASC
       LIMIT ?`,
      [`%${term}%`, limit]
    )
    return rows.map(rowToMobile)
  }

  // Dexie search
  const list = await catalogDb.mobiles.toArray()
  const brands = await catalogDb.brands.toArray()
  const brandMap = new Map(brands.map(b => [b.id, b.name]))
  
  return list
    .map(m => {
      (m as any).brandName = brandMap.get(m.brandId) ?? 'Unknown Brand'
      return m
    })
    .filter(m => `${(m as any).brandName} ${m.model}`.toLowerCase().includes(term))
    .slice(0, limit)
}

export async function upsertMobile(
  mobile: Partial<CatalogMobile> & { brandId: string; model: string; createdBy?: string | null; modifiedBy?: string | null },
  skipSync = false
): Promise<CatalogMobile> {
  const currentUserId = getCurrentUserId()
  const record: CatalogMobile = {
    id: mobile.id ?? uuid(),
    brandId: mobile.brandId.trim(),
    model: mobile.model.trim(),
    image: mobile.image,
    status: mobile.status ?? 'active',
    updatedAt: mobile.updatedAt ?? now(),
    createdBy: null,
    modifiedBy: null,
  } as CatalogMobile

  if (isElectron()) {
    await getDb().runAsync(
      `INSERT INTO catalog_mobiles (id, brand_id, model, image, status, created_at, updated_at, created_by, modified_by, created_on, modified_on)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         brand_id = excluded.brand_id,
         model = excluded.model,
         image = excluded.image,
         status = COALESCE(excluded.status, status),
         updated_at = excluded.updated_at,
         modified_by = excluded.modified_by,
         modified_on = excluded.modified_on`,
      [
        record.id, record.brandId, record.model, record.image ?? null,
        record.status ?? 'active',
        (mobile as any).createdAt ?? now(),
        record.updatedAt,
        null,
        null,
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
