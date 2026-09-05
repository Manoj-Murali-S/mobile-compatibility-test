/**
 * lib/repository/accessories.ts
 * Accessory CRUD — SQLite (Electron) | Supabase (web app) | Dexie (fallback).
 */

import { catalogDb, type CatalogAccessory } from '../catalog-db'
import { enqueueSyncItem } from './sync-queue'
import { getDb, isElectron, isWebApp } from '../sqlite/db'
import { requireSupabase } from '../sync/supabase-client'
import { getCurrentUserId } from '../auth'

const now = () => new Date().toISOString()

function rowToAccessory(row: any): CatalogAccessory {
  // Supabase returns JSONB already parsed; SQLite returns a JSON string
  const compatIds = Array.isArray(row.compatible_mobile_ids)
    ? row.compatible_mobile_ids
    : (row.compatible_mobile_ids
        ? JSON.parse(row.compatible_mobile_ids)
        : (row.compatible_models ? JSON.parse(row.compatible_models) : []))

  return {
    id: row.id,
    category: row.category,
    name: row.name,
    compatibleMobileIds: compatIds,
    updatedAt: row.updated_at ?? row.updatedAt,
  } as CatalogAccessory
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

  if (isWebApp()) {
    const supabase = requireSupabase()
    let query = supabase
      .from('catalog_accessories')
      .select('*')
      .order('name', { ascending: true })
    if (filters?.category) {
      query = query.eq('category', filters.category)
    }
    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map(rowToAccessory)
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
    createdBy: null,
    modifiedBy: null,
  }

  if (isElectron()) {
    await getDb().runAsync(
      `INSERT INTO catalog_accessories (id, category, name, compatible_mobile_ids, updated_at, created_by, modified_by, created_on, modified_on)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         category = excluded.category,
         name = excluded.name,
         compatible_mobile_ids = excluded.compatible_mobile_ids,
         updated_at = excluded.updated_at,
         modified_by = excluded.modified_by,
         modified_on = excluded.modified_on`,
      [
        record.id, record.category, record.name,
        JSON.stringify(record.compatibleMobileIds ?? []),
        record.updatedAt,
        null,
        null,
        (acc as any).createdAt ?? now(),
        record.updatedAt,
      ]
    )
  } else if (isWebApp()) {
    const supabase = requireSupabase()
    const { error } = await supabase.from('catalog_accessories').upsert({
      id: record.id,
      category: record.category,
      name: record.name,
      compatible_mobile_ids: record.compatibleMobileIds ?? [],
      updated_at: record.updatedAt,
    })
    if (error) throw error
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
  } else if (isWebApp()) {
    const supabase = requireSupabase()
    const { error } = await supabase.from('catalog_accessories').delete().eq('id', id)
    if (error) throw error
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

  if (isWebApp()) {
    const supabase = requireSupabase()
    const { count, error } = await supabase
      .from('catalog_accessories')
      .select('id', { count: 'exact', head: true })
    if (error) throw error
    return count ?? 0
  }

  return catalogDb.accessories.count()
}

export async function bulkUpsertAccessories(accessories: CatalogAccessory[]): Promise<void> {
  if (isElectron()) {
    for (const a of accessories) await upsertAccessory(a)
  } else if (isWebApp()) {
    const supabase = requireSupabase()
    const rows = accessories.map(a => ({
      id: a.id,
      category: a.category,
      name: a.name,
      compatible_mobile_ids: a.compatibleMobileIds ?? [],
      updated_at: a.updatedAt ?? now(),
    }))
    const { error } = await supabase.from('catalog_accessories').upsert(rows)
    if (error) throw error
    for (const a of accessories) await enqueueSyncItem('catalog_accessories', a.id, 'upsert', a)
  } else {
    await catalogDb.accessories.bulkPut(accessories)
    for (const a of accessories) await enqueueSyncItem('catalog_accessories', a.id, 'upsert', a)
  }
}
