'use client'

import { motion } from 'framer-motion'

interface BrandTabsProps {
  brands: { name: string; logo?: string }[]
  selected: string
  onSelect: (brand: string) => void
}

export default function BrandTabs({ brands, selected, onSelect }: BrandTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-0 hide-scrollbar">
      {brands.map((brand, index) => (
        <motion.button
          key={brand.name}
          onClick={() => onSelect(brand.name)}
          className="relative px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          {brand.logo && brand.logo.startsWith('data:image/') ? (
            <img src={brand.logo} alt={brand.name} className="w-5 h-5 object-contain" />
          ) : brand.logo ? (
            <span>{brand.logo}</span>
          ) : null}
          <span className={selected === brand.name ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}>
            {brand.name}
          </span>

          {selected === brand.name && (
            <motion.div
              layoutId="underline"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </motion.button>
      ))}

      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
