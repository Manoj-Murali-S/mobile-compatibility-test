'use client'

import { useEffect, useState } from 'react'
import { Cloud, CloudOff, Database, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { exportCatalogSnapshot, getStorageHealth, requestPersistentStorage } from '@/lib/catalog-db'
import { getOfflineCatalog, isOffline, subscribeToConnectionStatus } from '@/lib/offline-store'

export default function OfflineSyncSettings() {
  const [online, setOnline] = useState(true)
  const [offlineEnabled, setOfflineEnabled] = useState(true)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [persisted, setPersisted] = useState(false)
  const [storageUsed, setStorageUsed] = useState(0)

  useEffect(() => {
    getStorageHealth().then((health) => {
      setPersisted(health.persisted)
      setStorageUsed(health.usage)
    })
    setOnline(!isOffline())
    getOfflineCatalog().then((catalog) => setLastSaved(catalog?.savedAt ?? null))
    return subscribeToConnectionStatus(setOnline)
  }, [])

  const syncCatalog = async () => {
    setSyncing(true)
    await new Promise((resolve) => setTimeout(resolve, 700))
    const snapshot = await exportCatalogSnapshot()
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `mobile-catalog-sync-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setLastSaved(new Date().toISOString())
    setSyncing(false)
  }

  const enablePersistentStorage = async () => {
    setPersisted(await requestPersistentStorage())
  }

  return (
    <Card className="border-accent/30 bg-accent/5">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              {online ? <Cloud className="h-4 w-4 text-accent" /> : <CloudOff className="h-4 w-4 text-amber-600" />}
              Offline catalog & online sync
            </CardTitle>
            <CardDescription className="mt-1 max-w-2xl">
              Keep the complete shop catalog available without internet. This demo stores a local IndexedDB snapshot; the sync button is ready for a future API/database connection.
            </CardDescription>
          </div>
          <Badge variant="outline" className={online ? 'text-emerald-600' : 'text-amber-600'}>
            {online ? 'Online' : 'Offline'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between rounded-lg border bg-background p-4">
          <div className="flex items-center gap-3">
            <Database className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Use offline mode</p>
              <p className="text-sm text-muted-foreground">Cache brands, mobiles, accessories, compatibility groups, and settings.</p>
            </div>
          </div>
          <Switch checked={offlineEnabled} onCheckedChange={setOfflineEnabled} aria-label="Use offline mode" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">Database</p>
            <p className="mt-1 font-medium">IndexedDB / Dexie</p>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">Storage used</p>
            <p className="mt-1 font-medium">{storageUsed ? `${(storageUsed / 1024 / 1024).toFixed(2)} MB` : 'Calculating…'}</p>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">Persistence</p>
            <p className="mt-1 font-medium">{persisted ? 'Protected' : 'Browser managed'}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {lastSaved ? `Last local snapshot: ${new Date(lastSaved).toLocaleString()}` : 'No local snapshot saved yet'}
          </p>
          <div className="flex flex-wrap gap-2">
            {!persisted && <Button variant="outline" onClick={enablePersistentStorage}>Protect local storage</Button>}
            <Button onClick={syncCatalog} disabled={!online || syncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing catalog…' : 'Sync online now'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
