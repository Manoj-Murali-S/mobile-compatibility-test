'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { RefreshCw, LayoutGrid, List } from 'lucide-react'
import SearchHeader from '@/components/search-header'
import BrandTabs from '@/components/brand-tabs'
import MobileGrid from '@/components/mobile-grid'
import RecentSearches from '@/components/recent-searches'
import CommandPalette from '@/components/command-palette'
import SyncStatusBar from '@/components/sync-status-bar'
import { getBrands } from '@/lib/repository/brands'
import { getMobiles } from '@/lib/repository/mobiles'
import type { CatalogBrand, CatalogMobile } from '@/lib/catalog-db'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { Button } from '@/components/ui/button'
import { seedCatalogIfEmpty } from '@/lib/catalog-repository'
import { useSync } from '@/lib/sync/use-sync'

function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || '')
  const [selectedBrandId, setSelectedBrandId] = useState('')
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [showRecentSearches, setShowRecentSearches] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  const [dynamicBrands, setDynamicBrands] = useState<CatalogBrand[]>([])
  const [dynamicMobiles, setDynamicMobiles] = useState<CatalogMobile[]>([])
  const [loading, setLoading] = useState(true)

  // Sync hook — provides status bar data and the Sync button handler
  const syncHook = useSync()

  // Seed catalog and load data on mount
  useEffect(() => {
    let mounted = true
    async function loadData() {
      await seedCatalogIfEmpty()
      const [brandsData, mobilesData] = await Promise.all([
        getBrands(),
        getMobiles(),
      ])
      if (mounted) {
        setDynamicBrands(brandsData)
        setDynamicMobiles(mobilesData)
        if (brandsData.length > 0 && !selectedBrand && !searchParams.get('brand')) {
          setSelectedBrand(brandsData[0].name)
          setSelectedBrandId(brandsData[0].id)
        } else if (searchParams.get('brand')) {
          const brandName = searchParams.get('brand')!
          const found = brandsData.find(b => b.name === brandName)
          if (found) setSelectedBrandId(found.id)
        }
        setLoading(false)
      }
    }
    loadData()
    return () => { mounted = false }
  }, [])

  const lastPushedQ = useRef(searchParams.get('q') || '')

  // Sync URL changes to state
  useEffect(() => {
    const brand = searchParams.get('brand')
    const q = searchParams.get('q') || ''

    if (brand && brand !== selectedBrand) {
      setSelectedBrand(brand)
      const found = dynamicBrands.find(b => b.name === brand)
      if (found) setSelectedBrandId(found.id)
    } else if (!brand && selectedBrand) {
      // URL was cleared (e.g. clicking logo), reset to default brand
      if (dynamicBrands.length > 0) {
        setSelectedBrand(dynamicBrands[0].name)
        setSelectedBrandId(dynamicBrands[0].id)
      }
    }

    if (q !== lastPushedQ.current) {
      setSearchQuery(q)
      lastPushedQ.current = q
    }
  }, [searchParams, dynamicBrands])

  // Debounce updating the URL while typing
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentQ = searchParams.get('q') || ''
      if (searchQuery !== currentQ) {
        lastPushedQ.current = searchQuery
        updateUrl(selectedBrand, searchQuery)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery, selectedBrand, searchParams])

  // Handle keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowCommandPalette(!showCommandPalette)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showCommandPalette])

  const updateUrl = (brand: string, query: string) => {
    const params = new URLSearchParams()
    if (brand) params.set('brand', brand)
    if (query) params.set('q', query)
    router.replace(`/?${params.toString()}`, { scroll: false })
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    updateUrl(selectedBrand, query)
    if (query.trim() && !recentSearches.includes(query)) {
      setRecentSearches([query, ...recentSearches.slice(0, 4)])
    }
    setShowRecentSearches(false)
  }

  const handleBrandSelect = (brand: string) => {
    setSelectedBrand(brand)
    const found = dynamicBrands.find(b => b.name === brand)
    setSelectedBrandId(found?.id ?? '')
    setShowRecentSearches(false)
    setSearchQuery('')
    updateUrl(brand, '')
  }

  const handleRecentSearchClick = (search: string) => {
    handleSearch(search)
    setSearchQuery(search)
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Sync Status Bar (replaces old online/offline banner) */}
      {/* <SyncStatusBar syncHook={syncHook} /> */}

      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4 justify-between">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <Image
              src="/logo.png"
              alt="Cell's and Cell"
              width={110}
              height={44}
              className="object-contain"
              style={{ maxHeight: 44 }}
              priority
            />
          </Link>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1"
          >
            <SearchHeader
              value={searchQuery}
              onChange={(value) => {
                setSearchQuery(value)
                setShowRecentSearches(value.length > 0)
              }}
              onSearch={handleSearch}
              showCommandPalette={true}
              onCommandPaletteClick={() => setShowCommandPalette(true)}
              suggestions={[
                ...dynamicBrands.map(b => ({ type: 'brand' as const, text: b.name, id: b.id })),
                ...dynamicMobiles.map((mobile) => ({ type: 'device' as const, text: mobile.model, id: mobile.id })),
              ]}
              onSuggestionSelect={(suggestion) => {
                if (suggestion.type === 'brand') {
                  handleBrandSelect(suggestion.text)
                } else if (suggestion.type === 'device' && suggestion.id) {
                  router.push(`/details?id=${suggestion.id}`)
                }
              }}
              onFocusChange={(focused) => setShowRecentSearches(focused && !searchQuery.trim())}
            />
          </motion.div>

          {/* Recent Searches Dropdown */}
          {showRecentSearches && recentSearches.length > 0 && (
            <RecentSearches
              searches={recentSearches}
              onSelect={handleRecentSearchClick}
            />
          )}

          {/* Links */}
          <div className="ml-4 flex items-center gap-2">
            {/* <Link href="/search-demo">
              <Button variant="outline" size="sm">
                Advanced Search
              </Button>
            </Link> */}
            <ThemeSwitcher />
            <Link href="/admin">
              <Button variant="outline" size="sm">
                Admin Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Brand Tabs */}
      <div className="border-b border-border sticky top-[88px] z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <BrandTabs
            brands={dynamicBrands.map(b => ({ name: b.name, logo: b.logo }))}
            selected={selectedBrand}
            onSelect={handleBrandSelect}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-4 md:mb-12 flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {selectedBrand} Compatible Devices
            </h1>
            <p className="text-muted-foreground text-base">
              Find the perfect accessories for your {selectedBrand} mobile device
            </p>
          </div>

          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border w-fit ml-auto">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="px-3"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="px-3"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4 mr-2" />
              List
            </Button>
          </div>
        </motion.div>

        {/* Compatibility results for a searched model, or the regular brand browser */}
        <MobileGrid
          brand={selectedBrand}
          brandId={selectedBrandId}
          searchQuery={searchQuery}
          viewMode={viewMode}
        />
      </div>

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onSelectBrand={(brand) => {
          handleBrandSelect(brand)
          setShowCommandPalette(false)
        }}
        brands={dynamicBrands.map(b => b.name)}
      />
    </main>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <HomeContent />
    </Suspense>
  )
}
