'use client'

/**
 * lib/sync/use-sync.ts
 *
 * React hook that exposes sync state to any UI component.
 * Subscribes to online/offline events and provides a triggerSync() function.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { runSync, getSyncStatus, type SyncStatus } from './sync-manager'
import { isSupabaseConfigured } from './supabase-client'

export interface UseSyncReturn {
  syncStatus: SyncStatus
  isSyncing: boolean
  isOnline: boolean
  triggerSync: () => Promise<void>
  lastSyncResult: { pushed: number; pulled: number; errors: string[] } | null
}

const DEFAULT_STATUS: SyncStatus = {
  pendingCount: 0,
  lastSyncAt: null,
  isSyncing: false,
  lastError: null,
  supabaseConfigured: false,
}

export function useSync(): UseSyncReturn {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(DEFAULT_STATUS)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [lastSyncResult, setLastSyncResult] = useState<{ pushed: number; pulled: number; errors: string[] } | null>(null)
  const syncingRef = useRef(false)

  // Load initial status
  useEffect(() => {
    setIsOnline(navigator.onLine)
    getSyncStatus().then(setSyncStatus).catch(console.error)
  }, [])

  // Subscribe to online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      getSyncStatus().then(setSyncStatus).catch(console.error)
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Refresh status every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!syncingRef.current) {
        getSyncStatus().then(setSyncStatus).catch(console.error)
      }
    }, 30_000)
    return () => clearInterval(interval)
  }, [])

  const triggerSync = useCallback(async () => {
    if (syncingRef.current || !isOnline) return
    if (!isSupabaseConfigured()) {
      console.info('[useSync] Supabase not configured — skipping sync')
      return
    }

    syncingRef.current = true
    setIsSyncing(true)
    setSyncStatus((prev) => ({ ...prev, isSyncing: true, lastError: null }))

    try {
      const result = await runSync()
      setLastSyncResult({ pushed: result.pushed, pulled: result.pulled, errors: result.errors })
      const updated = await getSyncStatus()
      setSyncStatus({ ...updated, isSyncing: false, lastError: result.errors[0] ?? null })
    } catch (e: any) {
      setSyncStatus((prev) => ({ ...prev, isSyncing: false, lastError: e.message }))
    } finally {
      syncingRef.current = false
      setIsSyncing(false)
    }
  }, [isOnline])

  return { syncStatus, isSyncing, isOnline, triggerSync, lastSyncResult }
}
