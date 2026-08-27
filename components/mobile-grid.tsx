'use client'

import { motion, AnimatePresence, Variants } from 'framer-motion'
import MobileCard from './mobile-card'
import { useState, useEffect, useMemo } from 'react'
import { getMobiles } from '@/lib/repository/mobiles'
import type { CatalogMobile } from '@/lib/catalog-db'
import { Skeleton } from '@/components/ui/skeleton'

function MobileCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-card border border-border h-full flex flex-col">
      <Skeleton className="w-full h-48 rounded-none" />
      <div className="flex flex-col flex-1 p-4 justify-between">
        <div className="mb-4 space-y-2">
          <Skeleton className="w-16 h-3" />
          <Skeleton className="w-3/4 h-5" />
          <Skeleton className="w-1/2 h-5" />
        </div>
        <Skeleton className="w-full h-10 rounded-lg" />
      </div>
    </div>
  )
}

interface MobileGridProps {
  brand: string
  brandId: string
  searchQuery: string
}

// Adapter: CatalogMobile → shape MobileCard needs
function toCardMobile(m: CatalogMobile) {
  return {
    id: m.id,
    brand: (m as any).brandName ?? (m as any).brand ?? m.brandId,
    model: m.model,
    image: m.image ?? '',
  }
}

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
}
const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100, damping: 15 } },
}

export default function MobileGrid({ brand, brandId, searchQuery }: MobileGridProps) {
  const [allMobiles, setAllMobiles] = useState<CatalogMobile[]>([])
  const [loading, setLoading] = useState(true)

  // Load all mobiles once
  useEffect(() => {
    let mounted = true
    getMobiles().then((data) => {
      if (mounted) {
        setAllMobiles(data)
        setLoading(false)
      }
    })
    return () => { mounted = false }
  }, [])

  // Mobiles to display (filter by brand and search query)
  const displayedMobiles = useMemo(() => {
    let pool = allMobiles
    
    // Filter by brand
    if (brandId) {
      pool = pool.filter(m => m.brandId === brandId)
    }

    const term = searchQuery.trim().toLowerCase()
    if (term) {
      pool = pool.filter(m =>
        m.model.toLowerCase().includes(term) ||
        ((m as any).brandName ?? '').toLowerCase().includes(term)
      )
    }
    return pool
  }, [allMobiles, brandId, searchQuery])

  // ── Loading state ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <MobileCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (displayedMobiles.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
        <p className="text-lg text-muted-foreground">No devices found.</p>
      </motion.div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`grid-${brandId}-${searchQuery}`}
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {displayedMobiles.map((mobile) => (
          <motion.div key={mobile.id} variants={item}>
            <MobileCard mobile={toCardMobile(mobile)} />
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  )
}
