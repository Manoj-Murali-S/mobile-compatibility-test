/**
 * lib/repository/brands.ts
 * Brand CRUD — SQLite (Electron IPC) or Dexie (browser fallback).
 */

import { catalogDb, type CatalogBrand } from '../catalog-db'
import { enqueueSyncItem } from './sync-queue'
import { getDb, isElectron } from '../sqlite/db'
import { getCurrentUserId } from '../auth'

const now = () => new Date().toISOString()

function rowToBrand(row: any): CatalogBrand {
  return {
    id: row.id,
    name: row.name,
    logo: row.logo ?? '📱',
    updatedAt: row.updated_at ?? row.updatedAt,
  }
}

export async function getBrands(): Promise<CatalogBrand[]> {
  if (isElectron()) {
    const rows = await getDb().allAsync<any>('SELECT * FROM catalog_brands ORDER BY name ASC')
    return rows.map(rowToBrand)
  }
  return catalogDb.brands.orderBy('name').toArray()
}

export async function getBrandById(id: string): Promise<CatalogBrand | undefined> {
  if (isElectron()) {
    const row = await getDb().getAsync<any>('SELECT * FROM catalog_brands WHERE id = ?', [id])
    return row ? rowToBrand(row) : undefined
  }
  return catalogDb.brands.get(id)
}

export async function upsertBrand(
  brand: Omit<CatalogBrand, 'updatedAt'> & { updatedAt?: string; createdBy?: string | null; modifiedBy?: string | null },
  skipSync = false
): Promise<void> {
  const currentUserId = getCurrentUserId()
  const record: CatalogBrand = { 
    ...brand, 
    updatedAt: brand.updatedAt ?? now(),
    createdBy: brand.createdBy ?? currentUserId,
    modifiedBy: brand.modifiedBy ?? currentUserId,
  } as CatalogBrand
  if (isElectron()) {
    await getDb().runAsync(
      `INSERT INTO catalog_brands (id, name, logo, device_count, status, created_at, updated_at, created_by, modified_by, created_on, modified_on)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         logo = excluded.logo,
         device_count = excluded.device_count,
         status = excluded.status,
         updated_at = excluded.updated_at,
         modified_by = excluded.modified_by,
         modified_on = excluded.modified_on`,
      [
        record.id, record.name, record.logo ?? '📱',
        (record as any).deviceCount ?? 0,
        (record as any).status ?? 'active',
        (record as any).createdAt ?? now(),
        record.updatedAt,
        (record as any).createdBy ?? null,
        (record as any).modifiedBy ?? null,
        (record as any).createdAt ?? now(),
        record.updatedAt,
      ]
    )
  } else {
    await catalogDb.brands.put(record)
  }
  if (!skipSync) {
    await enqueueSyncItem('catalog_brands', record.id, 'upsert', record)
  }
}

export async function deleteBrand(id: string): Promise<void> {
  if (isElectron()) {
    await getDb().runAsync('DELETE FROM catalog_brands WHERE id = ?', [id])
  } else {
    await catalogDb.brands.delete(id)
  }
  await enqueueSyncItem('catalog_brands', id, 'delete', null)
}

export async function getBrandCount(): Promise<number> {
  if (isElectron()) {
    const row = await getDb().getAsync<{ count: number }>('SELECT COUNT(*) as count FROM catalog_brands')
    return row?.count ?? 0
  }
  return catalogDb.brands.count()
}
