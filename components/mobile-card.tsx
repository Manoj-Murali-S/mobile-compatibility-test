'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, ShoppingCart } from 'lucide-react'
import { useState } from 'react'

interface Mobile {
  id: string
  brand: string
  model: string
  year: string
  variants: string[]
  image: string
  accessories: number
}

interface MobileCardProps {
  mobile: Mobile
}

export default function MobileCard({ mobile }: MobileCardProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative h-full"
    >
      <div className="relative overflow-hidden rounded-2xl bg-card border border-border hover:border-accent/50 transition-all duration-300 shadow-sm hover:shadow-lg h-full flex flex-col">
        {/* Image Container */}
        <div className="relative w-full h-48 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden">
          <motion.div
            animate={{ scale: isHovered ? 1.1 : 1 }}
            transition={{ duration: 0.3 }}
            className="w-32 h-32 rounded-full bg-background/50 flex items-center justify-center overflow-hidden"
          >
            {mobile.image && mobile.image.startsWith('data:image/') ? (
              <img src={mobile.image} alt={mobile.model} className="w-full h-full object-contain p-2" />
            ) : (
              <div className="text-4xl">{mobile.image || '📱'}</div>
            )}
          </motion.div>

          {/* Favorite Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsFavorite(!isFavorite)}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur hover:bg-white transition-colors shadow-sm"
          >
            <Heart
              className={`w-5 h-5 transition-colors ${
                isFavorite
                  ? 'fill-red-500 text-red-500'
                  : 'text-muted-foreground'
              }`}
            />
          </motion.button>

          {/* Year Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-semibold backdrop-blur-sm"
          >
            {mobile.year}
          </motion.div>
        </div>

        {/* Content Container */}
        <div className="flex flex-col flex-1 p-4">
          {/* Title */}
          <h3 className="font-bold text-foreground mb-1 line-clamp-2">
            {mobile.model}
          </h3>

          {/* Variants */}
          <div className="mb-4 flex-1">
            <p className="text-xs text-muted-foreground mb-2">Variants:</p>
            <div className="flex flex-wrap gap-1">
              {mobile.variants.slice(0, 3).map((variant, idx) => (
                <motion.span
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="px-2 py-1 rounded text-xs bg-muted text-muted-foreground font-medium"
                >
                  {variant}
                </motion.span>
              ))}
              {mobile.variants.length > 3 && (
                <span className="px-2 py-1 rounded text-xs bg-muted text-muted-foreground font-medium">
                  +{mobile.variants.length - 3}
                </span>
              )}
            </div>
          </div>

          {/* Accessories Count */}
          <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Available Accessories</p>
            <p className="text-lg font-bold text-accent">
              {mobile.accessories}+
            </p>
          </div>

          {/* Button */}
          <Link href={`/details/${mobile.model.replace(/\s+/g, '-')}`}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-2 px-4 rounded-lg bg-accent text-accent-foreground font-medium flex items-center justify-center gap-2 transition-colors hover:bg-accent/90"
            >
              <ShoppingCart className="w-4 h-4" />
              View Details
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
