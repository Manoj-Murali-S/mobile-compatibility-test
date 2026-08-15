'use client'

/**
 * components/sync-status-bar.tsx
 *
 * A slim banner that shows current sync state.
 * Shown at the top of the main page and admin layout.
 */

import { RefreshCw, Wifi, WifiOff, CheckCircle2, AlertCircle, CloudOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { type UseSyncReturn } from '@/lib/sync/use-sync'

interface SyncStatusBarProps {
  syncHook: UseSyncReturn
  className?: string
}

export default function SyncStatusBar({ syncHook, className = '' }: SyncStatusBarProps) {
  const { syncStatus, isSyncing, isOnline, triggerSync } = syncHook

  const lastSync = syncStatus.lastSyncAt
    ? new Date(syncStatus.lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div
      className={`flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-1.5 text-xs text-muted-foreground ${className}`}
    >
      {/* Left: connectivity + DB indicator */}
      <div className="flex items-center gap-2">
        {isOnline ? (
          <Wifi className="h-3 w-3 text-emerald-500" />
        ) : (
          <WifiOff className="h-3 w-3 text-amber-500" />
        )}
        <span>
          {isOnline ? 'Online' : 'Offline'}
        </span>
        <span className="text-border">·</span>
        <span className="font-medium text-foreground/70">SQLite (local)</span>
        {syncStatus.pendingCount > 0 && (
          <>
            <span className="text-border">·</span>
            <Badge
              variant="outline"
              className="h-4 rounded px-1 text-[10px] border-amber-400 text-amber-600"
            >
              {syncStatus.pendingCount} pending
            </Badge>
          </>
        )}
      </div>

      {/* Center: last sync info */}
      <div className="flex items-center gap-1">
        {syncStatus.lastError && (
          <AlertCircle className="h-3 w-3 text-destructive" />
        )}
        {!syncStatus.lastError && lastSync && (
          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
        )}
        <span>
          {syncStatus.lastError
            ? `Sync error: ${syncStatus.lastError}`
            : lastSync
            ? `Synced ${lastSync}`
            : !syncStatus.supabaseConfigured
            ? 'Supabase not configured'
            : 'Not yet synced'}
        </span>
      </div>

      {/* Right: Sync button */}
      <Button
        size="sm"
        variant="ghost"
        className="h-6 gap-1 px-2 text-xs"
        disabled={!isOnline || isSyncing || !syncStatus.supabaseConfigured}
        onClick={triggerSync}
        title={
          !syncStatus.supabaseConfigured
            ? 'Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local to enable sync'
            : !isOnline
            ? 'No internet connection'
            : 'Sync local changes to Supabase'
        }
      >
        <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? 'Syncing…' : 'Sync'}
      </Button>
    </div>
  )
}
