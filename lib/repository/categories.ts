/**
 * lib/repository/categories.ts
 * Category CRUD — SQLite (Electron IPC) or Dexie (browser fallback).
 */

import { catalogDb, type CatalogCategory } from '../catalog-db'
import { enqueueSyncItem } from './sync-queue'
import { getDb, isElectron } from '../sqlite/db'

const now = () => new Date().toISOString()

function rowToCategory(row: any): CatalogCategory {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
  }
}

export async function getCategories(): Promise<CatalogCategory[]> {
  if (isElectron()) {
    const rows = await getDb().allAsync<any>('SELECT * FROM catalog_categories ORDER BY name ASC')
    return rows.map(rowToCategory)
  }

  // Dexie fallback
  const list = await catalogDb.categories.orderBy('name').toArray()
  if (list.length === 0) {
    const defaults: CatalogCategory[] = [
      { id: 'tempered-glass', name: 'Tempered Glass', createdAt: now(), updatedAt: now() },
      { id: 'back-case', name: 'Back Case', createdAt: now(), updatedAt: now() },
      { id: 'silicone-cover', name: 'Silicone Cover', createdAt: now(), updatedAt: now() },
      { id: 'flip-cover', name: 'Flip Cover', createdAt: now(), updatedAt: now() },
      { id: 'camera-protector', name: 'Camera Protector', createdAt: now(), updatedAt: now() }
    ]
    await catalogDb.categories.bulkPut(defaults)
    return defaults
  }
  return list
}

export async function upsertCategory(
  category: CatalogCategory & { createdAt?: string },
  skipSync = false
): Promise<void> {
  const record = {
    ...category,
    createdAt: category.createdAt ?? now(),
    updatedAt: now(),
  }

  if (isElectron()) {
    await getDb().runAsync(
      `INSERT INTO catalog_categories (id, name, created_at, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         updated_at = excluded.updated_at`,
      [record.id, record.name, record.createdAt, record.updatedAt]
    )
  } else {
    await catalogDb.categories.put(record)
  }

  if (!skipSync) {
    await enqueueSyncItem('catalog_categories', record.id, 'upsert', record)
  }
}

export async function deleteCategory(id: string, skipSync = false): Promise<void> {
  if (isElectron()) {
    await getDb().runAsync('DELETE FROM catalog_categories WHERE id = ?', [id])
  } else {
    await catalogDb.categories.delete(id)
  }

  if (!skipSync) {
    await enqueueSyncItem('catalog_categories', id, 'delete', null)
  }
}
