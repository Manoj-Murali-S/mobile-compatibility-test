'use client'

import { motion } from 'framer-motion'
import MobileCard from './mobile-card'
import { getMobilesByBrand } from '@/lib/mock-data'

interface MobileGridProps {
  brand: string
  searchQuery: string
}

export default function MobileGrid({ brand, searchQuery }: MobileGridProps) {
  const mobiles = getMobilesByBrand(brand)

  const filtered = mobiles.filter((mobile) =>
    mobile.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mobile.variants.some((v) =>
      v.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
      },
    },
  }

  if (filtered.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-16"
      >
        <p className="text-lg text-muted-foreground mb-2">
          No devices found matching &quot;{searchQuery}&quot;
        </p>
        <p className="text-sm text-muted-foreground">
          Try adjusting your search query
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      {filtered.map((mobile) => (
        <motion.div key={mobile.id} variants={item}>
          <MobileCard mobile={mobile} />
        </motion.div>
      ))}
    </motion.div>
  )
}
