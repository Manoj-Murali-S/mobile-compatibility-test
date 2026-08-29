'use client'

import { Skeleton } from '@/components/ui/skeleton'
import type { CatalogMobile } from '@/lib/catalog-db'
import { getMobiles } from '@/lib/repository/mobiles'
import { AnimatePresence, motion, Variants } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import MobileCard from './mobile-card'

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
  viewMode?: 'grid' | 'list'
}

// Adapter: CatalogMobile → shape MobileCard needs
export function toCardMobile(m: CatalogMobile) {
  return {
    id: m.id,
    brand: (m as any).brandName ?? (m as any).brand ?? m.brandId,
    model: m.model,
    image: m.image ?? '',
  }
}

export function MobileListRow({ mobile, hideViewDetails = false }: { mobile: ReturnType<typeof toCardMobile>, hideViewDetails?: boolean }) {
  return (
    <Link
      href={`/details?id=${mobile.id}`}
      className="block h-full"
    >
      <div className="flex items-center p-2 sm:p-3 rounded-lg border border-border bg-card hover:border-accent/50 hover:bg-accent/5 transition-colors shadow-sm h-full cursor-pointer">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded bg-muted flex items-center justify-center text-xl sm:text-2xl mr-3 shrink-0 overflow-hidden">
          {mobile.image && mobile.image.startsWith('data:image/') ? (
            <img
              src={mobile.image}
              alt={mobile.model}
              className="w-full h-full object-cover"
            />
          ) : (
            mobile.image || '📱'
          )}
        </div>

        <div className="flex-1 min-w-0 mr-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
            {mobile.brand}
          </p>

          <h3 className="font-bold text-sm text-foreground truncate">
            {mobile.model}
          </h3>
        </div>

        {!hideViewDetails && (
          <div className="shrink-0">
            <div
              className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              title="View Details"
            >
              <ArrowRight
                className="w-4 h-4" />
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
}
const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100, damping: 15 } },
}

export default function MobileGrid({ brand, brandId, searchQuery, viewMode = 'grid' }: MobileGridProps) {
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
    if (viewMode === 'list') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {Array.from({ length: 15 }).map((_, i) => (
            <Skeleton key={i} className="w-full h-[72px] sm:h-[76px] rounded-lg" />
          ))}
        </div>
      )
    }

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
        className={
          viewMode === 'grid'
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4"
        }
      >
        {displayedMobiles.map((mobile) => (
          <motion.div key={mobile.id} variants={item}>
            {viewMode === 'grid' ? (
              <MobileCard mobile={toCardMobile(mobile)} />
            ) : (
              <MobileListRow mobile={toCardMobile(mobile)} />
            )}
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  )
}
