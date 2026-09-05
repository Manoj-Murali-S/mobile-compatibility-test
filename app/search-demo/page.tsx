'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MobileSearch } from '@/components/mobile-search';
import { getBrands } from '@/lib/repository/brands';
import { getMobiles } from '@/lib/repository/mobiles';
import type { CatalogMobile, CatalogBrand } from '@/lib/catalog-db';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * MobileSearch Component Demo Page
 * Showcases the reusable search component with all features
 */
export default function SearchDemoPage() {
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [lastSelected, setLastSelected] = useState<string>('');
  const [searchLog, setSearchLog] = useState<Array<{ query: string; brand: string }>>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [brandDevices, setBrandDevices] = useState<CatalogMobile[]>([]);

  // Fetch all brands on mount
  useEffect(() => {
    let mounted = true;
    async function loadBrands() {
      try {
        const data = await getBrands();
        if (mounted && data.length > 0) {
          setBrands(data.map(b => b.name).sort());
        }
      } catch (err) {
        console.error('Failed to load brands:', err);
      }
    }
    void loadBrands();
    return () => { mounted = false; };
  }, []);

  // Fetch mobiles when selectedBrand changes
  useEffect(() => {
    let mounted = true;
    async function loadMobiles() {
      try {
        const data = await getMobiles();
        const filtered = data.filter(d => (d as any).brandName === selectedBrand);
        if (mounted) {
          setBrandDevices(filtered);
        }
      } catch (err) {
        console.error('Failed to load mobiles:', err);
      }
    }
    void loadMobiles();
    return () => { mounted = false; };
  }, [selectedBrand]);

  // Transform devices to SearchItem format
  const searchItems = brandDevices.map(device => ({
    id: device.id,
    name: device.model,
    brand: (device as any).brandName,
  }));

  return (
    <main className="min-h-screen bg-background">
      {/* Back Button */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Finder
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-foreground mb-3">
            Advanced Mobile Search
          </h1>
          <p className="text-muted-foreground text-lg">
            Explore the reusable MobileSearch component with instant filtering, keyboard navigation, and smart search aliases.
          </p>
        </motion.div>

        {/* Brand Selector */}
        <div className="mb-12">
          <h2 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">
            Select Brand
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {brands.map(brand => (
              <button
                key={brand}
                onClick={() => {
                  setSelectedBrand(brand);
                  setLastSelected('');
                }}
                className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${selectedBrand === brand
                  ? 'bg-accent text-accent-foreground shadow-lg'
                  : 'bg-muted hover:bg-muted/80 text-foreground'
                  }`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>

        {/* Search Component */}
        <motion.div
          key={selectedBrand}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">
            {selectedBrand} Device Search
          </h2>
          <div className="bg-card border border-border rounded-lg p-6">
            <MobileSearch
              items={searchItems}
              searchFields={['name', 'brand']}
              placeholder={`Search ${selectedBrand} models... (try "S24", "Ultra", or "Pro")`}
              brand={selectedBrand}
              debounceMs={300}
              showRecentSearches={true}
              showLoadingState={true}
              emptyStateMessage={`No ${selectedBrand} devices match your search`}
              onSearch={(query, brand) => {
                if (query) {
                  setSearchLog(prev => [...prev.slice(-9), { query, brand }]);
                }
              }}
              onSelect={(item) => {
                setLastSelected(item.name);
              }}

            />
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
        >
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold mb-3 text-foreground">✨ Features</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✓ Instant debounced search (300ms)</li>
              <li>✓ Smart search aliases (S24 → Galaxy S24)</li>
              <li>✓ Arrow key navigation (↑↓)</li>
              <li>✓ Enter to select results</li>
              <li>✓ Text highlighting on matches</li>
              <li>✓ Recent searches (localStorage)</li>
              <li>✓ Loading skeleton states</li>
              <li>✓ Empty state messaging</li>
            </ul>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold mb-3 text-foreground">⌨️ Keyboard Shortcuts</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><span className="font-mono bg-muted px-2 py-1 rounded text-xs">↑↓</span> Navigate results</li>
              <li><span className="font-mono bg-muted px-2 py-1 rounded text-xs">Enter</span> Select current</li>
              <li><span className="font-mono bg-muted px-2 py-1 rounded text-xs">Esc</span> Close dropdown</li>
              <li><span className="font-mono bg-muted px-2 py-1 rounded text-xs">Ctrl+K</span> Brand switcher</li>
              <li className="pt-2 border-t border-border/30">Type to filter instantly</li>
              <li>Recent searches auto-save</li>
            </ul>
          </div>
        </motion.div>

        {/* Status Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="space-y-4"
        >
          <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
            <h3 className="font-semibold text-sm text-accent mb-2">Last Selected</h3>
            <p className="text-foreground text-lg font-medium">
              {lastSelected || 'None yet - select a device from the search results'}
            </p>
          </div>

          {searchLog.length > 0 && (
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <h3 className="font-semibold text-sm text-muted-foreground mb-3">Search History</h3>
              <div className="space-y-2">
                {searchLog.map((entry, idx) => (
                  <div key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="text-accent font-medium">{entry.query}</span>
                    <span>in {entry.brand}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Documentation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 pt-12 border-t border-border"
        >
          <h2 className="text-xl font-semibold mb-4 text-foreground">Component Usage</h2>
          <div className="bg-muted/30 border border-border rounded-lg p-6 space-y-4 font-mono text-sm">
            <p className="text-muted-foreground">{`import { MobileSearch } from '@/components/mobile-search';`}</p>
            <p className="text-muted-foreground">{`
// Basic usage:
<MobileSearch
  items={devices}
  searchFields={['name', 'brand']}
  placeholder="Search devices..."
  brand="Samsung"
  onSearch={(query, brand) => console.log(query, brand)}
  onSelect={(item) => console.log('Selected:', item)}
/>
            `}</p>

          </div>
        </motion.div>
      </div>
    </main>
  );
}
