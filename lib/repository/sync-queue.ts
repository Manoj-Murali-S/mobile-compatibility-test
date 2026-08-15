/**
 * lib/repository/sync-queue.ts
 * Sync queue — SQLite (Electron) or Dexie (browser).
 */

import { catalogDb, type SyncQueueItem } from '../catalog-db'
import { getDb, isElectron } from '../sqlite/db'

const now = () => new Date().toISOString()

export async function enqueueSyncItem(
  tableName: string,
  recordId: string,
  operation: 'upsert' | 'delete',
  payload: unknown
): Promise<void> {
  if (isElectron()) {
    await getDb().runAsync(
      `INSERT INTO sync_queue (table_name, record_id, operation, payload, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [tableName, recordId, operation, payload ? JSON.stringify(payload) : null, now()]
    )
  } else {
    const entry: Omit<SyncQueueItem, 'id'> = {
      table: tableName,
      recordId,
      operation,
      payload,
      updatedAt: now(),
    }
    await catalogDb.syncQueue.add(entry)
  }
}

export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  if (isElectron()) {
    const rows = await getDb().allAsync<any>('SELECT * FROM sync_queue WHERE synced_at IS NULL ORDER BY id ASC')
    return rows.map((r: any) => ({
      id: r.id,
      table: r.table_name,
      recordId: r.record_id,
      operation: r.operation,
      payload: r.payload ? JSON.parse(r.payload) : undefined,
      updatedAt: r.created_at,
    }))
  }
  return catalogDb.syncQueue.toArray()
}

export async function markSyncItemSynced(id: number): Promise<void> {
  if (isElectron()) {
    await getDb().runAsync('UPDATE sync_queue SET synced_at = ? WHERE id = ?', [now(), id])
  } else {
    await catalogDb.syncQueue.delete(id)
  }
}

export async function getPendingCount(): Promise<number> {
  if (isElectron()) {
    const row = await getDb().getAsync<{ count: number }>('SELECT COUNT(*) as count FROM sync_queue WHERE synced_at IS NULL')
    return row?.count ?? 0
  }
  return catalogDb.syncQueue.count()
}

export async function clearSyncedItems(): Promise<void> {
  if (isElectron()) {
    await getDb().runAsync('DELETE FROM sync_queue WHERE synced_at IS NOT NULL')
  }
}
