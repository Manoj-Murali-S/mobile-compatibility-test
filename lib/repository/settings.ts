/**
 * lib/repository/settings.ts
 * Key/value settings — SQLite (Electron) or Dexie (browser).
 */

import { catalogDb, type CatalogSetting } from '../catalog-db'
import { getDb, isElectron } from '../sqlite/db'

const now = () => new Date().toISOString()

export async function getSetting<T = unknown>(key: string): Promise<T | undefined> {
  if (isElectron()) {
    const row = await getDb().getAsync<any>('SELECT value FROM catalog_settings WHERE key = ?', [key])
    if (!row) return undefined
    try { return JSON.parse(row.value) as T } catch { return row.value as unknown as T }
  }
  const s = await catalogDb.settings.get(key)
  return s?.value as T | undefined
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  const serialized = JSON.stringify(value)
  if (isElectron()) {
    await getDb().runAsync(
      `INSERT INTO catalog_settings (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      [key, serialized, now()]
    )
  } else {
    const record: CatalogSetting = { key, value, updatedAt: now() }
    await catalogDb.settings.put(record)
  }
}

export async function deleteSetting(key: string): Promise<void> {
  if (isElectron()) {
    await getDb().runAsync('DELETE FROM catalog_settings WHERE key = ?', [key])
  } else {
    await catalogDb.settings.delete(key)
  }
}

export async function getAllSettings(): Promise<Record<string, unknown>> {
  if (isElectron()) {
    const rows = await getDb().allAsync<any>('SELECT key, value FROM catalog_settings')
    return Object.fromEntries(rows.map((r: any) => {
      try { return [r.key, JSON.parse(r.value)] } catch { return [r.key, r.value] }
    }))
  }
  const all = await catalogDb.settings.toArray()
  return Object.fromEntries(all.map((s) => [s.key, s.value]))
}
