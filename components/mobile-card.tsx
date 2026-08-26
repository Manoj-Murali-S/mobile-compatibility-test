'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, ShoppingCart } from 'lucide-react'
import { useState } from 'react'

interface Mobile {
  id: string
  brand: string
  model: string
  image: string
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
              className={`w-5 h-5 transition-colors ${isFavorite
                  ? 'fill-red-500 text-red-500'
                  : 'text-muted-foreground'
                }`}
            />
          </motion.button>
        </div>

        {/* Content Container */}
        <div className="flex flex-col flex-1 p-4 justify-between">
          <div className="mb-4">
            {/* Brand */}
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {mobile.brand}
            </p>
            {/* Title */}
            <h3 className="font-bold text-lg text-foreground line-clamp-2">
              {mobile.model}
            </h3>
          </div>

          {/* Button */}
          <Link href={`/details?id=${mobile.id}`}>
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
