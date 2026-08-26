'use client'

import { motion, AnimatePresence } from 'framer-motion'
import MobileCard from './mobile-card'
import { useState, useEffect, useMemo } from 'react'
import { getMobiles } from '@/lib/repository/mobiles'
import { getCompatibilityForModel } from '@/lib/repository/compatibility'
import type { CatalogMobile } from '@/lib/catalog-db'
import type { CatalogCompatibility } from '@/lib/catalog-db'

interface MobileGridProps {
  brand: string
  brandId: string
  searchQuery: string
}

interface CompatibilityGroup {
  category: string
  mobiles: CatalogMobile[]
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

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
}
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } },
}

export default function MobileGrid({ brand, brandId, searchQuery }: MobileGridProps) {
  const [allMobiles, setAllMobiles] = useState<CatalogMobile[]>([])
  const [loading, setLoading] = useState(true)
  const [compatGroups, setCompatGroups] = useState<CompatibilityGroup[]>([])
  const [compatLoading, setCompatLoading] = useState(false)
  const [matchedMobile, setMatchedMobile] = useState<CatalogMobile | null>(null)

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

  // Mobiles for the selected brand (shown when not searching)
  const brandMobiles = useMemo(() => {
    if (!brandId) return allMobiles
    return allMobiles.filter(m => m.brandId === brandId)
  }, [allMobiles, brandId])

  // When search changes: find matching mobile and load its compatibility
  useEffect(() => {
    const term = searchQuery.trim().toLowerCase()
    if (!term) {
      setCompatGroups([])
      setMatchedMobile(null)
      return
    }

    // Find the first mobile whose model matches the search
    const found = allMobiles.find(m =>
      m.model.toLowerCase().includes(term) ||
      ((m as any).brandName ?? '').toLowerCase().includes(term)
    )
    setMatchedMobile(found ?? null)

    if (!found) {
      setCompatGroups([])
      return
    }

    // Load compatibility rules for this mobile
    setCompatLoading(true)
    getCompatibilityForModel(found.id)
      .then((rules: CatalogCompatibility[]) => {
        // Build a mobile id→mobile lookup
        const mobileMap = new Map(allMobiles.map(m => [m.id, m]))

        const groups: CompatibilityGroup[] = rules
          .map(rule => ({
            category: rule.category,
            mobiles: (rule.compatibleMobileIds ?? [])
              .map((id: string) => mobileMap.get(id))
              .filter(Boolean) as CatalogMobile[],
          }))
          .filter(g => g.mobiles.length > 0)

        setCompatGroups(groups)
      })
      .catch(console.error)
      .finally(() => setCompatLoading(false))
  }, [searchQuery, allMobiles])

  // ── Loading state ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="text-center py-16 text-muted-foreground animate-pulse">
        Loading devices...
      </div>
    )
  }

  // ── SEARCH MODE: show compatible mobiles grouped by category ─────
  if (searchQuery.trim()) {
    if (compatLoading) {
      return (
        <div className="text-center py-16 text-muted-foreground animate-pulse">
          Finding compatible accessories...
        </div>
      )
    }

    if (!matchedMobile) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <p className="text-lg text-muted-foreground mb-2">
            No device found matching &quot;{searchQuery}&quot;
          </p>
          <p className="text-sm text-muted-foreground">Try a different model name</p>
        </motion.div>
      )
    }

    if (compatGroups.length === 0) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <p className="text-lg font-semibold mb-1">
            {(matchedMobile as any).brandName ?? brand} {matchedMobile.model}
          </p>
          <p className="text-muted-foreground">No compatibility data found for this device.</p>
        </motion.div>
      )
    }

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="compat-view"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="space-y-10"
        >
          {/* Source device header */}
          <div className="flex items-center gap-3 pb-2 border-b border-border">
            <div className="text-2xl">📱</div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Showing compatibility for
              </p>
              <h2 className="text-xl font-bold text-foreground">
                {(matchedMobile as any).brandName ?? brand} {matchedMobile.model}
              </h2>
            </div>
          </div>

          {/* Compatible mobiles grouped by category */}
          {compatGroups.map((group) => (
            <motion.section
              key={group.category}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-sm font-semibold uppercase tracking-widest text-accent mb-4 flex items-center gap-2">
                <span className="h-px flex-1 bg-border" />
                {group.category}
                <span className="h-px flex-1 bg-border" />
              </h3>
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {group.mobiles.map((m) => (
                  <motion.div key={m.id} variants={item}>
                    <MobileCard mobile={toCardMobile(m)} />
                  </motion.div>
                ))}
              </motion.div>
            </motion.section>
          ))}
        </motion.div>
      </AnimatePresence>
    )
  }

  // ── DEFAULT MODE: all mobiles for the selected brand ────────────
  if (brandMobiles.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
        <p className="text-lg text-muted-foreground">No devices found for {brand}.</p>
      </motion.div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`brand-${brandId}`}
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {brandMobiles.map((mobile) => (
          <motion.div key={mobile.id} variants={item}>
            <MobileCard mobile={toCardMobile(mobile)} />
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  )
}
