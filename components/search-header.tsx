'use client'

import { useMemo, useState } from 'react'
import { Search, Command, ArrowUpRight } from 'lucide-react'
import { motion } from 'framer-motion'

interface SearchHeaderProps {
  value: string
  onChange: (value: string) => void
  onSearch: (query: string) => void
  showCommandPalette: boolean
  onCommandPaletteClick: () => void
  suggestions?: string[]
  onFocusChange?: (focused: boolean) => void
}

export default function SearchHeader({
  value,
  onChange,
  onSearch,
  showCommandPalette,
  onCommandPaletteClick,
  suggestions = [],
  onFocusChange,
}: SearchHeaderProps) {
  const [isFocused, setIsFocused] = useState(false)
  const filteredSuggestions = useMemo(() => {
    const normalized = value.trim().toLowerCase()
    if (!normalized) return []
    return suggestions
      .filter((suggestion) => suggestion.toLowerCase().includes(normalized))
      .slice(0, 6)
  }, [suggestions, value])

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
                  onFocus={() => {
                    setIsFocused(true)
                    onFocusChange?.(true)
                  }}
                  onBlur={() => {
                    setIsFocused(false)
                    onFocusChange?.(false)
                  }}
                  className="w-full pl-12 pr-12 py-4 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors"
                />
                {isFocused && filteredSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                    <p className="px-4 pb-2 pt-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Matching devices
                    </p>
                    {filteredSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          onChange(suggestion)
                          onSearch(suggestion)
                          setIsFocused(false)
                        }}
                        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-muted"
                      >
                        <span>{suggestion}</span>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
