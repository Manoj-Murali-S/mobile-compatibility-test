'use client'

import { useState } from 'react'
import { Search, Command } from 'lucide-react'
import { motion } from 'framer-motion'

interface SearchHeaderProps {
  value: string
  onChange: (value: string) => void
  onSearch: (query: string) => void
  showCommandPalette: boolean
  onCommandPaletteClick: () => void
}

export default function SearchHeader({
  value,
  onChange,
  onSearch,
  showCommandPalette,
  onCommandPaletteClick,
}: SearchHeaderProps) {
  const [isFocused, setIsFocused] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(value)
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <form onSubmit={handleSubmit} className="w-full">
            <div className="relative">
              <motion.div
                animate={{
                  boxShadow: isFocused
                    ? '0 0 0 3px rgba(59, 130, 246, 0.1)'
                    : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                transition={{ duration: 0.2 }}
                className="relative rounded-lg overflow-hidden"
              >
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Search for your phone model..."
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="w-full pl-12 pr-12 py-4 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors"
                />
                {showCommandPalette && (
                  <button
                    type="button"
                    onClick={onCommandPaletteClick}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-muted hover:bg-muted/80 text-muted-foreground text-xs font-medium flex items-center gap-1 transition-colors"
                    title="Press Ctrl+K to open command palette"
                  >
                    <Command className="w-3 h-3" />
                    <span className="hidden sm:inline">Ctrl+K</span>
                  </button>
                )}
              </motion.div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
