'use client'

import { useEffect, useState } from 'react'
import { Cloud, CloudOff, Database, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { getSetting } from '@/lib/repository/settings'
import { getPendingCount } from '@/lib/repository/sync-queue'
import { useSync } from '@/lib/sync/use-sync'

export default function OfflineSyncSettings() {
  const { syncStatus, isSyncing, isOnline, triggerSync } = useSync()
  const [offlineEnabled, setOfflineEnabled] = useState(true)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    getSetting<string>('last_sync_at').then((v) => setLastSaved(v ?? null))
    getPendingCount().then(setPendingCount)
  }, [syncStatus.lastSyncAt])

  return (
    <Card className="border-accent/30 bg-accent/5">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              {isOnline ? <Cloud className="h-4 w-4 text-accent" /> : <CloudOff className="h-4 w-4 text-amber-600" />}
              Offline catalog &amp; online sync
            </CardTitle>
            <CardDescription className="mt-1 max-w-2xl">
              All data is stored locally in <strong>SQLite</strong>. The app works fully offline. When internet is available and Supabase is configured, use the Sync button to push/pull changes.
            </CardDescription>
          </div>
          <Badge variant="outline" className={isOnline ? 'text-emerald-600' : 'text-amber-600'}>
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between rounded-lg border bg-background p-4">
          <div className="flex items-center gap-3">
            <Database className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Use offline mode</p>
              <p className="text-sm text-muted-foreground">All data is always local — this is always on.</p>
            </div>
          </div>
          <Switch checked={offlineEnabled} onCheckedChange={setOfflineEnabled} aria-label="Use offline mode" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">Database</p>
            <p className="mt-1 font-medium">SQLite (local file)</p>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">Pending changes</p>
            <p className="mt-1 font-medium">{pendingCount} item{pendingCount !== 1 ? 's' : ''}</p>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">Sync target</p>
            <p className="mt-1 font-medium">
              {syncStatus.supabaseConfigured ? 'Supabase (configured)' : 'Not configured'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {lastSaved
              ? `Last synced: ${new Date(lastSaved).toLocaleString()}`
              : 'Never synced with Supabase'}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={triggerSync}
              disabled={!isOnline || isSyncing || !syncStatus.supabaseConfigured}
              title={
                !syncStatus.supabaseConfigured
                  ? 'Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable sync'
                  : undefined
              }
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing…' : 'Sync with Supabase'}
            </Button>
          </div>
        </div>
        {!syncStatus.supabaseConfigured && (
          <div className="rounded-lg border border-amber-200 bg-amber-500/5 p-3 text-xs text-amber-700">
            <strong>To enable Supabase sync:</strong> add{' '}
            <code>NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to your <code>.env.local</code> file and restart the app.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
