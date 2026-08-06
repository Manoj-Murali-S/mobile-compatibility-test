'use client'

import { Clock, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'

interface RecentSearchesProps {
  searches: string[]
  onSelect: (search: string) => void
}

export default function RecentSearches({ searches, onSelect }: RecentSearchesProps) {
  const [removed, setRemoved] = useState<Set<string>>(new Set())

  const filteredSearches = searches.filter((s) => !removed.has(s))

  const handleRemove = (search: string) => {
    const newRemoved = new Set(removed)
    newRemoved.add(search)
    setRemoved(newRemoved)
  }

  if (filteredSearches.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute top-16 left-4 right-4 bg-card border border-border rounded-lg shadow-lg p-4 z-50"
    >
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground">Recent searches</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {filteredSearches.map((search, index) => (
          <motion.button
            key={search}
            onClick={() => onSelect(search)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ delay: index * 0.05 }}
            className="group relative px-3 py-1 rounded-full bg-accent/10 hover:bg-accent/20 text-accent text-sm font-medium transition-colors flex items-center gap-2"
          >
            {search}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleRemove(search)
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-accent/20 rounded-full"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
