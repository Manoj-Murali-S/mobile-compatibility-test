'use client'

import { useMemo, useState, useEffect } from 'react'
import { Grid2X2, List, SearchX, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import MobileCard from '@/components/mobile-card'
import { ACCESSORY_TYPES, type AccessoryType, type CompatibilityDevice } from '@/lib/mock-compatibility'
import { getCompatibleDevicesAsync, checkHasCompatibilityDataAsync } from '@/lib/repository/compatibility'

interface CompatibilityExplorerProps {
  query: string
}

export default function CompatibilityExplorer({ query }: CompatibilityExplorerProps) {
  const [activeType, setActiveType] = useState<AccessoryType>('tempered-glass')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const [devices, setDevices] = useState<CompatibilityDevice[]>([])
  const [hasData, setHasData] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const activeCategory = ACCESSORY_TYPES.find((category) => category.id === activeType)

  useEffect(() => {
    let mounted = true
    setIsLoading(true)

    async function fetchData() {
      try {
        const has = await checkHasCompatibilityDataAsync(query)
        if (mounted) setHasData(has)

        if (has) {
          const fetchedDevices = await getCompatibleDevicesAsync(query, activeType)
          if (mounted) setDevices(fetchedDevices)
        }
      } catch (err) {
        console.error('Failed to fetch compatibility data', err)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    void fetchData()
    return () => { mounted = false }
  }, [query, activeType])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-dashed border-border bg-card/60">
        <p className="text-muted-foreground animate-pulse">Loading compatibility data...</p>
      </div>
    )
  }

  if (!hasData) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
        <SearchX className="mx-auto mb-4 h-10 w-10 text-muted-foreground/60" />
        <h2 className="text-xl font-semibold">No compatibility group found</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Search a model such as S24 or iPhone 15 to see which other devices can use the same accessories.
        </p>
      </div>
    )
  }

  return (
    <section aria-label="Compatible devices by accessory type" className="space-y-6">
      <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Compatibility lookup</p>
            <h2 className="mt-1 text-2xl font-bold">Accessories that fit “{query}”</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select an accessory type to find other devices that use the same stock.
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
            <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('grid')} aria-label="Grid view">
              <Grid2X2 className="mr-1.5 h-4 w-4" /> Grid
            </Button>
            <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('list')} aria-label="List view">
              <List className="mr-1.5 h-4 w-4" /> List
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Accessory types">
        {ACCESSORY_TYPES.map((category) => {
          // Since it's dynamic now, we don't have synchronous counts easily without complex querying. 
          // We'll omit the precise count for inactive tabs, or just use a generic label.
          const isActive = activeType === category.id
          return (
            <button
              key={category.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveType(category.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-3 text-left transition-colors ${isActive ? 'border-accent bg-accent text-accent-foreground shadow-sm' : 'border-border bg-card hover:border-accent/50'
                }`}
            >
              <span className="text-lg" aria-hidden="true">{category.icon}</span>
              <span>
                <span className="block text-sm font-semibold">{category.shortLabel}</span>
                {isActive && <span className="block text-xs text-accent-foreground/75">{devices.length} devices</span>}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{activeCategory?.label} fits</h3>
          <p className="text-sm text-muted-foreground">{devices.length} compatible devices for this stock item</p>
        </div>
        <Badge variant="secondary">{query.toUpperCase()} compatible</Badge>
      </div>

      {devices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-muted-foreground">
          No compatible devices are mapped for {activeCategory?.label.toLowerCase()} yet.
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {devices.map((device) => <MobileCard key={device.id} mobile={device} />)}
        </div>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {devices.map((device) => (
            <div key={device.id} className="flex items-center justify-between gap-4 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl">{device.image}</div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{device.model}</p>
                  <p className="text-sm text-muted-foreground">{device.brand} · {device.matchedAccessory}</p>
                </div>
              </div>
              <a
                href={`/details?id=${device.model.toLowerCase().replace(/\s+/g, '-')}`}
                className="inline-flex h-7 items-center rounded-lg border border-border px-2.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                Details <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </a>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
