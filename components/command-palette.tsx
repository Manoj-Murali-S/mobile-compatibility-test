'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X } from 'lucide-react'

import type { CatalogMobile } from '@/lib/catalog-db'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onSelectBrand: (brand: string) => void
  onSelectMobile: (mobileId: string) => void
  brands: string[]
  mobiles: CatalogMobile[]
}

export default function CommandPalette({
  isOpen,
  onClose,
  onSelectBrand,
  onSelectMobile,
  brands,
  mobiles,
}: CommandPaletteProps) {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const searchTerm = search.toLowerCase()
  
  const filteredBrands = brands
    .filter((brand) => brand.toLowerCase().includes(searchTerm))
    .map(b => ({ type: 'brand' as const, id: b, text: b, subtitle: 'Brand' }))

  const filteredMobiles = mobiles
    .filter((m) => 
      m.model.toLowerCase().includes(searchTerm) || 
      (m as any).brandName?.toLowerCase().includes(searchTerm) ||
      m.brandId.toLowerCase().includes(searchTerm)
    )
    .map(m => ({
      type: 'mobile' as const,
      id: m.id,
      text: m.model,
      subtitle: (m as any).brandName || m.brandId
    }))

  const filtered = [...filteredBrands, ...filteredMobiles].slice(0, 50)

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % filtered.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filtered.length > 0) {
          const item = filtered[selectedIndex]
          if (item.type === 'brand') onSelectBrand(item.id)
          else onSelectMobile(item.id)
          onClose()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filtered, selectedIndex, onSelectBrand, onSelectMobile, onClose])

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  // Reset when closing
  useEffect(() => {
    if (!isOpen) {
      setSearch('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
          >
            <div className="bg-card border border-border rounded-lg shadow-xl overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search brands and devices..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-muted rounded transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-96 overflow-y-auto">
                {filtered.length > 0 ? (
                  filtered.map((item, index) => (
                    <motion.button
                      key={`${item.type}-${item.id}`}
                      onClick={() => {
                        if (item.type === 'brand') onSelectBrand(item.id)
                        else onSelectMobile(item.id)
                        onClose()
                      }}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={`w-full px-4 py-3 text-left flex items-center justify-between transition-colors border-b border-border last:border-b-0 ${
                        selectedIndex === index
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      <div className="flex flex-col text-left">
                        <span className="font-medium">{item.text}</span>
                        <span className={`text-xs ${selectedIndex === index ? 'text-accent-foreground/80' : 'text-muted-foreground'}`}>
                          {item.subtitle}
                        </span>
                      </div>
                      {selectedIndex === index && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 rounded-full bg-accent-foreground flex-shrink-0"
                        />
                      )}
                    </motion.button>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-muted-foreground">
                    <p>No results found</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 bg-muted/50 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex gap-2">
                  <span>↑↓</span>
                  <span>Navigate</span>
                  <span>Enter</span>
                  <span>Select</span>
                </div>
                <span>Esc to close</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
