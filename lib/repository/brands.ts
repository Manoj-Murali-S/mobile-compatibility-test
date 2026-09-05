/**
 * lib/repository/brands.ts
 * Brand CRUD — SQLite (Electron IPC) | Supabase (web app) | Dexie (fallback).
 */

import { catalogDb, type CatalogBrand } from '../catalog-db'
import { enqueueSyncItem } from './sync-queue'
import { getDb, isElectron, isWebApp } from '../sqlite/db'
import { requireSupabase } from '../sync/supabase-client'
import { getCurrentUserId } from '../auth'

const now = () => new Date().toISOString()

function rowToBrand(row: any): CatalogBrand {
  return {
    id: row.id,
    name: row.name,
    logo: row.logo ?? '📱',
    status: row.status ?? 'active',
    updatedAt: row.updated_at ?? row.updatedAt,
  } as CatalogBrand
}

export async function getBrands(): Promise<CatalogBrand[]> {
  if (isElectron()) {
    const rows = await getDb().allAsync<any>(
      `SELECT b.* 
       FROM catalog_brands b 
       ORDER BY b.name ASC`
    )
    return rows.map(rowToBrand)
  }

  if (isWebApp()) {
    const supabase = requireSupabase()
    const { data, error } = await supabase
      .from('catalog_brands')
      .select('*')
      .order('name', { ascending: true })
    if (error) throw error
    return (data ?? []).map(rowToBrand)
  }

  const list = await catalogDb.brands.orderBy('name').toArray()
  return list
}

export async function getBrandById(id: string): Promise<CatalogBrand | undefined> {
  if (isElectron()) {
    const row = await getDb().getAsync<any>(
      `SELECT b.* 
       FROM catalog_brands b 
       WHERE b.id = ?`,
      [id]
    )
    return row ? rowToBrand(row) : undefined
  }

  if (isWebApp()) {
    const supabase = requireSupabase()
    const { data, error } = await supabase
      .from('catalog_brands')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return undefined
    return data ? rowToBrand(data) : undefined
  }

  const brand = await catalogDb.brands.get(id)
  return brand
}

export async function upsertBrand(
  brand: Omit<CatalogBrand, 'updatedAt'> & { updatedAt?: string; createdBy?: string | null; modifiedBy?: string | null },
  skipSync = false
): Promise<void> {
  const currentUserId = getCurrentUserId()
  const record: CatalogBrand = { 
    ...brand, 
    updatedAt: brand.updatedAt ?? now(),
    createdBy: null,
    modifiedBy: null,
  } as CatalogBrand

  if (isElectron()) {
    await getDb().runAsync(
      `INSERT INTO catalog_brands (id, name, logo, status, created_at, updated_at, created_by, modified_by, created_on, modified_on)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         logo = excluded.logo,
         status = excluded.status,
         updated_at = excluded.updated_at,
         modified_on = excluded.modified_on`,
      [
        record.id, record.name, record.logo ?? '📱',
        record.status ?? 'active',
        (record as any).createdAt ?? now(),
        record.updatedAt,
        null,
        null,
        (record as any).createdAt ?? now(),
        record.updatedAt,
      ]
    )
  } else if (isWebApp()) {
    const supabase = requireSupabase()
    const { error } = await supabase.from('catalog_brands').upsert({
      id: record.id,
      name: record.name,
      logo: record.logo ?? '📱',
      status: record.status ?? 'active',
      updated_at: record.updatedAt,
    })
    if (error) throw error
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
  } else if (isWebApp()) {
    const supabase = requireSupabase()
    const { error } = await supabase.from('catalog_brands').delete().eq('id', id)
    if (error) throw error
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

  if (isWebApp()) {
    const supabase = requireSupabase()
    const { count, error } = await supabase
      .from('catalog_brands')
      .select('id', { count: 'exact', head: true })
    if (error) throw error
    return count ?? 0
  }

  return catalogDb.brands.count()
}
