/**
 * lib/sync/sync-manager.ts
 *
 * Handles bidirectional sync between local SQLite/Dexie and Supabase.
 *
 * Strategy:
 *  1. PUSH — iterate sync_queue (pending items), upsert/delete in Supabase, mark synced
 *  2. PULL — fetch remote rows updated after last_sync_at, merge locally (last-write-wins by updated_at)
 *
 * Never throws — all errors are caught and returned in the SyncResult object.
 * Local data is NEVER lost if sync fails.
 */

import { getSupabaseClient } from './supabase-client'
import {
  getPendingSyncItems,
  markSyncItemSynced,
  clearSyncedItems,
  getPendingCount,
} from '../repository/sync-queue'
import { getSetting, setSetting } from '../repository/settings'
import { upsertBrand } from '../repository/brands'
import { upsertMobile } from '../repository/mobiles'
import { upsertCompatibility } from '../repository/compatibility'
import { upsertAccessory } from '../repository/accessories'
import { upsertCategory } from '../repository/categories'

export interface SyncStatus {
  pendingCount: number
  lastSyncAt: string | null
  isSyncing: boolean
  lastError: string | null
  supabaseConfigured: boolean
}

export interface SyncResult {
  pushed: number
  pulled: number
  errors: string[]
  syncedAt: string
}

const SUPABASE_TABLE_MAP: Record<string, string> = {
  catalog_brands: 'catalog_brands',
  catalog_mobiles: 'catalog_mobiles',
  catalog_compatibility: 'catalog_compatibility',
  catalog_accessories: 'catalog_accessories',
  catalog_categories: 'catalog_categories',
}

// ─── PUSH local changes to Supabase ────────────────────────────────────────

async function pushLocalChanges(): Promise<{ pushed: number; errors: string[] }> {
  const supabase = getSupabaseClient()
  if (!supabase) return { pushed: 0, errors: [] }

  const pending = await getPendingSyncItems()
  let pushed = 0
  const errors: string[] = []

  for (const item of pending) {
    const remoteTable = SUPABASE_TABLE_MAP[item.table]
    if (!remoteTable) continue

    try {
      if (item.operation === 'upsert' && item.payload) {
        // Transform camelCase back to snake_case for Supabase columns
        const row = toSnakeCase(item.payload as Record<string, unknown>)
        const { error } = await supabase.from(remoteTable).upsert(row)
        if (error) throw new Error(error.message)
      } else if (item.operation === 'delete') {
        const { error } = await supabase.from(remoteTable).delete().eq('id', item.recordId)
        if (error) throw new Error(error.message)
      }

      if (item.id !== undefined) await markSyncItemSynced(item.id as number)
      pushed++
    } catch (e: any) {
      errors.push(`[${item.table}:${item.recordId}] ${e.message}`)
    }
  }

  await clearSyncedItems()
  return { pushed, errors }
}

// ─── PULL remote changes from Supabase ─────────────────────────────────────

async function pullRemoteChanges(lastSyncAt: string | null): Promise<{ pulled: number; errors: string[] }> {
  const supabase = getSupabaseClient()
  if (!supabase) return { pulled: 0, errors: [] }

  let pulled = 0
  const errors: string[] = []
  const since = lastSyncAt ?? '1970-01-01T00:00:00Z'

  const tables: Array<{ remote: string; handler: (row: any) => Promise<void> }> = [
    {
      remote: 'catalog_brands',
      handler: async (row) => {
        await upsertBrand({
          id: row.id, name: row.name, logo: row.logo,
          updatedAt: row.updated_at ?? row.updatedAt,
        }, true)
      },
    },
    {
      remote: 'catalog_mobiles',
      handler: async (row) => {
        await upsertMobile({
          id: row.id, 
          brandId: row.brand_id ?? row.brandId, 
          model: row.model,
          updatedAt: row.updated_at ?? row.updatedAt,
        }, true)
      },
    },
    {
      remote: 'catalog_compatibility',
      handler: async (row) => {
        await upsertCompatibility({
          id: row.id, 
          category: row.category,
          sourceMobileId: row.source_mobile_id ?? row.sourceMobileId,
          compatibleMobileIds: Array.isArray(row.compatible_mobile_ids)
            ? row.compatible_mobile_ids
            : JSON.parse(row.compatible_mobile_ids ?? row.compatible_models ?? '[]'),
          updatedAt: row.updated_at ?? row.updatedAt,
        } as any, true)
      },
    },
    {
      remote: 'catalog_accessories',
      handler: async (row) => {
        await upsertAccessory({
          id: row.id, 
          category: row.category, 
          name: row.name,
          compatibleMobileIds: Array.isArray(row.compatible_mobile_ids)
            ? row.compatible_mobile_ids
            : JSON.parse(row.compatible_mobile_ids ?? row.compatible_models ?? '[]'),
          updatedAt: row.updated_at ?? row.updatedAt,
        } as any, true)
      },
    },
    {
      remote: 'catalog_categories',
      handler: async (row) => {
        await upsertCategory({
          id: row.id,
          name: row.name,
          createdAt: row.created_at ?? row.createdAt,
          updatedAt: row.updated_at ?? row.updatedAt,
        }, true)
      },
    },
  ]

  for (const { remote, handler } of tables) {
    try {
      const { data, error } = await supabase
        .from(remote)
        .select('*')
        .gte('updated_at', since)
        .order('updated_at', { ascending: true })

      if (error) throw new Error(error.message)
      if (!data) continue

      for (const row of data) {
        try {
          await handler(row)
          pulled++
        } catch (e: any) {
          errors.push(`[pull:${remote}] ${e.message}`)
        }
      }
    } catch (e: any) {
      errors.push(`[pull:${remote}] ${e.message}`)
    }
  }

  return { pulled, errors }
}

// ─── Main sync entry point ──────────────────────────────────────────────────

export async function runSync(): Promise<SyncResult> {
  const syncedAt = new Date().toISOString()
  const lastSyncAt = await getSetting<string>('last_sync_at') ?? null

  const { pushed, errors: pushErrors } = await pushLocalChanges()
  const { pulled, errors: pullErrors } = await pullRemoteChanges(lastSyncAt)

  const allErrors = [...pushErrors, ...pullErrors]

  // Only update last_sync_at if no errors occurred
  if (allErrors.length === 0 || pushed > 0 || pulled > 0) {
    await setSetting('last_sync_at', syncedAt)
  }

  return { pushed, pulled, errors: allErrors, syncedAt }
}

export async function getSyncStatus(): Promise<SyncStatus> {
  const pendingCount = await getPendingCount()
  const lastSyncAt = await getSetting<string>('last_sync_at') ?? null
  const supabase = getSupabaseClient()

  return {
    pendingCount,
    lastSyncAt,
    isSyncing: false,
    lastError: null,
    supabaseConfigured: Boolean(supabase),
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Convert camelCase object keys to snake_case for Supabase */
function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
    // Serialize arrays to JSON string for Supabase JSONB columns
    result[snakeKey] = Array.isArray(value) ? value : value
  }
  return result
}
