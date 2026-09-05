/**
 * lib/repository/compatibility.ts
 * Compatibility record CRUD — SQLite (Electron) | Supabase (web app) | Dexie (fallback).
 */

import { catalogDb, type CatalogCompatibility } from '../catalog-db'
import { enqueueSyncItem } from './sync-queue'
import { getDb, isElectron, isWebApp } from '../sqlite/db'
import { requireSupabase } from '../sync/supabase-client'
import { getCurrentUserId } from '../auth'
import { getMobiles } from './mobiles'


export interface CompatibilityDevice {
  id: string
  brand: string
  model: string
  image: string
  accessories?: number
  matchedAccessory: string
}

const now = () => new Date().toISOString()

function rowToCompat(row: any): CatalogCompatibility {
  // Supabase JSONB returns arrays already parsed; SQLite returns a string
  const compatIds = Array.isArray(row.compatible_mobile_ids)
    ? row.compatible_mobile_ids
    : (row.compatible_mobile_ids
        ? JSON.parse(row.compatible_mobile_ids)
        : (row.compatible_models ? JSON.parse(row.compatible_models) : []))

  return {
    id: row.id,
    category: row.category,
    sourceMobileId: row.source_mobile_id ?? row.sourceMobileId,
    compatibleMobileIds: compatIds,
    updatedAt: row.updated_at ?? row.updatedAt,
  } as CatalogCompatibility
}

export async function getCompatibilityForModel(sourceMobileId: string): Promise<CatalogCompatibility[]> {
  if (isElectron()) {
    const rows = await getDb().allAsync<any>('SELECT * FROM catalog_compatibility WHERE source_mobile_id = ? ORDER BY category ASC', [sourceMobileId])
    return rows.map(rowToCompat)
  }

  if (isWebApp()) {
    const supabase = requireSupabase()
    const { data, error } = await supabase
      .from('catalog_compatibility')
      .select('*')
      .eq('source_mobile_id', sourceMobileId)
      .order('category', { ascending: true })
    if (error) throw error
    return (data ?? []).map(rowToCompat)
  }

  return catalogDb.compatibility.where('sourceMobileId').equals(sourceMobileId).toArray()
}

export async function getAllCompatibility(): Promise<CatalogCompatibility[]> {
  if (isElectron()) {
    const rows = await getDb().allAsync<any>('SELECT * FROM catalog_compatibility ORDER BY source_mobile_id, category')
    return rows.map(rowToCompat)
  }

  if (isWebApp()) {
    const supabase = requireSupabase()
    const { data, error } = await supabase
      .from('catalog_compatibility')
      .select('*')
      .order('source_mobile_id', { ascending: true })
    if (error) throw error
    return (data ?? []).map(rowToCompat)
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
    createdBy: null,
    modifiedBy: null,
  }

  if (isElectron()) {
    await getDb().runAsync(
      `INSERT INTO catalog_compatibility (id, category, source_mobile_id, compatible_mobile_ids, updated_at, created_by, modified_by, created_on, modified_on)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         category = excluded.category,
         source_mobile_id = excluded.source_mobile_id,
         compatible_mobile_ids = excluded.compatible_mobile_ids,
         updated_at = excluded.updated_at,
         modified_by = excluded.modified_by,
         modified_on = excluded.modified_on`,
      [
        record.id, record.category, record.sourceMobileId,
        JSON.stringify(record.compatibleMobileIds ?? []),
        record.updatedAt,
        null,
        null,
        (entry as any).createdAt ?? now(),
        record.updatedAt,
      ]
    )
  } else if (isWebApp()) {
    const supabase = requireSupabase()
    const { error } = await supabase.from('catalog_compatibility').upsert({
      id: record.id,
      category: record.category,
      source_mobile_id: record.sourceMobileId,
      compatible_mobile_ids: record.compatibleMobileIds ?? [],
      updated_at: record.updatedAt,
    })
    if (error) throw error
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
  } else if (isWebApp()) {
    const supabase = requireSupabase()
    const { error } = await supabase.from('catalog_compatibility').delete().eq('id', id)
    if (error) throw error
  } else {
    await catalogDb.compatibility.delete(id)
  }
  await enqueueSyncItem('catalog_compatibility', id, 'delete', null)
}

export async function bulkUpsertCompatibility(entries: CatalogCompatibility[]): Promise<void> {
  if (isElectron()) {
    for (const e of entries) await upsertCompatibility(e)
  } else if (isWebApp()) {
    const supabase = requireSupabase()
    const rows = entries.map(e => ({
      id: e.id,
      category: e.category,
      source_mobile_id: e.sourceMobileId,
      compatible_mobile_ids: e.compatibleMobileIds ?? [],
      updated_at: e.updatedAt ?? now(),
    }))
    const { error } = await supabase.from('catalog_compatibility').upsert(rows)
    if (error) throw error
    for (const e of entries) await enqueueSyncItem('catalog_compatibility', e.id, 'upsert', e)
  } else {
    await catalogDb.compatibility.bulkPut(entries)
    for (const e of entries) await enqueueSyncItem('catalog_compatibility', e.id, 'upsert', e)
  }
}

export async function checkHasCompatibilityDataAsync(query: string): Promise<boolean> {
  const term = query.trim().toLowerCase()
  if (!term) return false

  if (isElectron()) {
    const rows = await getDb().allAsync<{ id: string }>(
      `SELECT c.id FROM catalog_compatibility c
       LEFT JOIN catalog_mobiles m ON c.source_mobile_id = m.id
       LEFT JOIN catalog_brands b ON m.brand_id = b.id
       WHERE lower(m.model) LIKE ? OR lower(b.name) LIKE ? LIMIT 1`,
      [`%${term}%`, `%${term}%`]
    )
    return rows.length > 0
  }

  // For both web app and Dexie: use getMobiles() which auto-routes
  const allMobiles = await getMobiles()
  const matchingMobileIds = new Set(
    allMobiles
      .filter(m => {
        const brandName = (m as any).brandName ?? ''
        return m.model.toLowerCase().includes(term) || brandName.toLowerCase().includes(term)
      })
      .map(m => m.id)
  )

  if (matchingMobileIds.size === 0) return false

  if (isWebApp()) {
    const supabase = requireSupabase()
    const { data, error } = await supabase
      .from('catalog_compatibility')
      .select('id, source_mobile_id, compatible_mobile_ids')
      .limit(100)
    if (error) return false
    return (data ?? []).some(c => {
      const compatIds = Array.isArray(c.compatible_mobile_ids) ? c.compatible_mobile_ids : []
      return matchingMobileIds.has(c.source_mobile_id) || compatIds.some((id: string) => matchingMobileIds.has(id))
    })
  }

  const allCompat = await catalogDb.compatibility.toArray()
  return allCompat.some(c =>
    matchingMobileIds.has(c.sourceMobileId) ||
    c.compatibleMobileIds.some(id => matchingMobileIds.has(id))
  )
}

export async function getCompatibleDevicesAsync(query: string, categoryName: string): Promise<CompatibilityDevice[]> {
  const term = query.trim().toLowerCase()
  if (!term || !categoryName) return []

  const dbCategory = categoryName

  // getMobiles() auto-routes to Supabase/SQLite/Dexie
  const allMobiles = await getMobiles()
  const matchingMobiles = allMobiles.filter(m => 
    m.model.toLowerCase().includes(term) || 
    (m as any).brandName?.toLowerCase().includes(term)
  )
  const matchingMobileIds = new Set(matchingMobiles.map(m => m.id))

  if (matchingMobileIds.size === 0) return []

  // Load all compatibility records for this category
  let compatRecords: CatalogCompatibility[] = []
  if (isElectron()) {
    const rows = await getDb().allAsync<any>(
      `SELECT * FROM catalog_compatibility WHERE category = ?`,
      [dbCategory]
    )
    compatRecords = rows.map(rowToCompat)
  } else if (isWebApp()) {
    const supabase = requireSupabase()
    const { data, error } = await supabase
      .from('catalog_compatibility')
      .select('*')
      .eq('category', dbCategory)
    if (error) throw error
    compatRecords = (data ?? []).map(rowToCompat)
  } else {
    compatRecords = await catalogDb.compatibility.where('category').equals(dbCategory).toArray()
  }

  // Find records that involve any of the matching devices
  const involvedMobileIds = new Set<string>()
  for (const c of compatRecords) {
    const isSourceMatch = matchingMobileIds.has(c.sourceMobileId)
    const isTargetMatch = c.compatibleMobileIds.some(id => matchingMobileIds.has(id))
    
    if (isSourceMatch || isTargetMatch) {
      involvedMobileIds.add(c.sourceMobileId)
      for (const id of c.compatibleMobileIds) {
        involvedMobileIds.add(id)
      }
    }
  }

  // Filter out the searched models themselves
  for (const id of Array.from(matchingMobileIds)) {
    involvedMobileIds.delete(id)
  }

  const devices: CompatibilityDevice[] = []
  for (const mobileId of Array.from(involvedMobileIds)) {
    const mobile = allMobiles.find(m => m.id === mobileId)
    if (mobile) {
      devices.push({
        id: mobile.id,
        brand: (mobile as any).brandName ?? 'Unknown',
        model: mobile.model,
        image: mobile.image ?? '📱',
        accessories: 0,
        matchedAccessory: `${term} ${dbCategory}`
      })
    }
  }

  return devices
}
