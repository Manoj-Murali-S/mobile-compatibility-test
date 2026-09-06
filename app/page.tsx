'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { RefreshCw, LayoutGrid, List, Loader2, Search, BookOpen, ShieldCheck } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
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

  const [globalSearchText, setGlobalSearchText] = useState('')
  const [localSearchText, setLocalSearchText] = useState(searchParams.get('q') || '')
  const [isGlobalNavigating, setIsGlobalNavigating] = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)

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
      setLocalSearchText(q)
      setSearchQuery(q)
      lastPushedQ.current = q
    }
  }, [searchParams, dynamicBrands])

  // Debounce updating the URL and local search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearchText)
      const currentQ = searchParams.get('q') || ''
      if (localSearchText !== currentQ) {
        lastPushedQ.current = localSearchText
        updateUrl(selectedBrand, localSearchText)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [localSearchText, selectedBrand, searchParams])

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
    // If they press enter on global search, we don't filter locally anymore.
    // Instead we could route to a search page, or just do nothing for now.
    setGlobalSearchText(query)
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
    setLocalSearchText('')
    setSearchQuery('')
    updateUrl(brand, '')
  }

  const handleRecentSearchClick = (search: string) => {
    setGlobalSearchText(search)
    handleSearch(search)
  }

  const SearchComponent = (
    <div className="relative w-full">
      <SearchHeader
        value={globalSearchText}
        onChange={(value) => {
          setGlobalSearchText(value)
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
            setIsGlobalNavigating(true)
            router.push(`/details?id=${suggestion.id}`)
          }
        }}
        onFocusChange={(focused) => setShowRecentSearches(focused && !globalSearchText.trim())}
      />
      {/* Recent Searches Dropdown */}
      {showRecentSearches && recentSearches.length > 0 && (
        <RecentSearches
          searches={recentSearches}
          onSelect={handleRecentSearchClick}
        />
      )}
    </div>
  )

  return (
    <main className="min-h-screen bg-background relative">
      {isGlobalNavigating && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <h2 className="text-xl font-semibold">Loading...</h2>
        </div>
      )}

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
              className="object-contain w-20 sm:w-[110px] h-auto"
              priority
            />
          </Link>

          {/* Desktop Search */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1 hidden md:block"
          >
            {SearchComponent}
          </motion.div>

          {/* Links */}
          <div className="ml-2 sm:ml-4 flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Mobile Search Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              title="Search"
            >
              <Search className="w-5 h-5" />
            </Button>

            <ThemeSwitcher />
            
            <Link href="/user-manual">
              <Button variant="ghost" size="sm" className="hidden sm:flex" title="User Manual">
                <BookOpen className="w-4 h-4 mr-2" />
                User Manual
              </Button>
              <Button variant="ghost" size="icon" className="flex sm:hidden" title="User Manual">
                <BookOpen className="w-4 h-4" />
              </Button>
            </Link>
            
            <Link href="/admin">
              <Button variant="outline" size="sm" className="hidden sm:flex" title="Admin Dashboard">
                <ShieldCheck className="w-4 h-4 mr-2" />
                Admin Dashboard
              </Button>
              <Button variant="outline" size="icon" className="flex sm:hidden" title="Admin Dashboard">
                <ShieldCheck className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Search Accordion */}
        {showMobileSearch && (
          <div className="md:hidden border-t border-border bg-background p-4 shadow-sm">
            {SearchComponent}
          </div>
        )}
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
          <div className='flex gap-2 items-center'>
            <div className="flex-1 max-w-sm ml-auto">
              <div
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-md bg-white dark:bg-neutral-800 outline-1 -outline-offset-1 outline-slate-300 dark:outline-neutral-700 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-blue-600">
                <label htmlFor="search" className="sr-only">Search</label>
                <input type="search" id="search"
                  className="text-sm text-slate-900 dark:text-slate-50 w-full outline-none" placeholder={`Search ${selectedBrand} mobiles...`}
                  value={localSearchText}
                  onChange={(e) => setLocalSearchText(e.target.value)} />
                <Search className='w-4 h-4 text-slate-400 ml-auto' />
              </div>
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
        onSelectMobile={(mobileId) => {
          setIsGlobalNavigating(true)
          router.push(`/details?id=${mobileId}`)
          setShowCommandPalette(false)
        }}
        brands={dynamicBrands.map(b => b.name)}
        mobiles={dynamicMobiles}
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
