'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import SearchHeader from '@/components/search-header'
import BrandTabs from '@/components/brand-tabs'
import MobileGrid from '@/components/mobile-grid'
import RecentSearches from '@/components/recent-searches'
import CommandPalette from '@/components/command-palette'
import { Button } from '@/components/ui/button'

const BRANDS = [
  'Samsung',
  'Apple',
  'Redmi',
  'Vivo',
  'Oppo',
  'Realme',
  'Poco',
  'Motorola',
  'Nokia'
]

export default function Home() {
  const [selectedBrand, setSelectedBrand] = useState('Samsung')
  const [searchQuery, setSearchQuery] = useState('')
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [showRecentSearches, setShowRecentSearches] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)

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

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.trim() && !recentSearches.includes(query)) {
      setRecentSearches([query, ...recentSearches.slice(0, 4)])
    }
    setShowRecentSearches(false)
  }

  const handleBrandSelect = (brand: string) => {
    setSelectedBrand(brand)
    setShowRecentSearches(false)
  }

  const handleRecentSearchClick = (search: string) => {
    handleSearch(search)
    setSearchQuery(search)
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
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
            />
          </motion.div>

          {/* Recent Searches Dropdown */}
          {showRecentSearches && recentSearches.length > 0 && (
            <RecentSearches
              searches={recentSearches}
              onSelect={handleRecentSearchClick}
            />
          )}

          {/* Search Demo Link */}
          <Link href="/search-demo" className="ml-4">
            <Button variant="outline" size="sm">
              Advanced Search Demo
            </Button>
          </Link>
        </div>
      </header>

      {/* Brand Tabs */}
      <div className="border-b border-border sticky top-[88px] z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <BrandTabs
            brands={BRANDS}
            selected={selectedBrand}
            onSelect={handleBrandSelect}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {selectedBrand} Compatible Devices
          </h1>
          <p className="text-muted-foreground text-lg">
            Find the perfect accessories for your {selectedBrand} mobile device
          </p>
        </motion.div>

        {/* Mobile Grid */}
        <MobileGrid
          brand={selectedBrand}
          searchQuery={searchQuery}
        />
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onSelectBrand={(brand) => {
          handleBrandSelect(brand)
          setShowCommandPalette(false)
        }}
        brands={BRANDS}
      />
    </main>
  )
}
