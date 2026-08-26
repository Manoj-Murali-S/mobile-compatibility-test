'use client';

import { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AccessoryCategory } from '@/lib/mock-accessories';

interface AccessoryCardProps {
  category: AccessoryCategory;
  index?: number;
  viewMode?: 'grid' | 'list';
}

export function AccessoryCard({ category, index = 0, viewMode = 'grid' }: AccessoryCardProps) {
  const [isOpen, setIsOpen] = useState(true);

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: index * 0.1 },
    },
  };

  const expandVariants: Variants = {
    collapsed: { height: 0, opacity: 0 },
    expanded: { height: 'auto', opacity: 1, transition: { duration: 0.4, ease: 'easeInOut' } },
  };

  const isList = viewMode === 'list';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="h-full"
    >
      <Card className={`flex flex-col overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300 ${isList ? 'h-auto' : 'h-full'}`}>
        {/* Clickable Header for Accordion */}
        <CardHeader 
          className="pb-4 bg-muted/30 cursor-pointer select-none group"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-background shadow-md text-3xl shrink-0 group-hover:scale-105 transition-transform">
                {category.icon}
              </div>
              <div>
                <CardTitle className="text-2xl font-bold tracking-tight text-foreground">{category.title}</CardTitle>
                <p className="text-base text-muted-foreground mt-1">
                  {category.description}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 shrink-0">
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary text-base font-bold border-none rounded-full px-4 py-1.5 hidden sm:inline-flex"
              >
                {category.accessories.length} Items
              </Badge>
              <div className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                <ChevronDown className={`w-8 h-8 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Expandable Content */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.section
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              variants={expandVariants}
            >
              <CardContent className="p-0 border-t border-border/50">
                <div className={`p-4 sm:p-6 ${isList ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-4'}`}>
                  {category.accessories.map((accessory, i) => (
                    <div
                      key={accessory.id}
                      className="group flex flex-col p-4 rounded-2xl border border-border/60 bg-card hover:bg-accent/10 transition-colors duration-300 shadow-sm"
                    >
                      <div className="flex gap-4 mb-3 items-start">
                        <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-muted/50 text-4xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                          {accessory.icon}
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-bold text-xl leading-tight text-foreground">{accessory.name}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground">{accessory.description}</p>
                        </div>
                      </div>
                      
                      {accessory.compatibleModels.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Compatible With:</p>
                          <div className="flex flex-wrap gap-2">
                            {accessory.compatibleModels.map((model) => (
                              <Badge
                                key={model}
                                variant="outline"
                                className="text-sm px-3 py-1 bg-background/50"
                              >
                                {model}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </motion.section>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
