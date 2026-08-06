'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { AccessoryCategory } from '@/lib/mock-accessories';

interface AccessoryCardProps {
  category: AccessoryCategory;
  index?: number;
}

export function AccessoryCard({ category, index = 0 }: AccessoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        delay: index * 0.1,
      },
    },
  };

  const expandVariants = {
    collapsed: { height: 0, opacity: 0 },
    expanded: {
      height: 'auto',
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="h-full"
    >
      <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
        {/* Header */}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{category.icon}</span>
                <CardTitle className="text-lg">{category.title}</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                {category.description}
              </p>
            </div>
            <Badge
              variant="secondary"
              className="whitespace-nowrap ml-2 bg-accent/10 text-accent"
            >
              {category.accessories.length}
            </Badge>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="flex-1 flex flex-col">
          {/* Featured Accessories Preview */}
          <div className="space-y-2 mb-4">
            {category.accessories.slice(0, 2).map((accessory) => (
              <div
                key={accessory.id}
                className="flex items-start gap-2 p-2 bg-muted/50 rounded-md"
              >
                <span className="text-lg flex-shrink-0 mt-0.5">
                  {accessory.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {accessory.name}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {accessory.description}
                  </p>
                </div>
                {accessory.featured && (
                  <Badge variant="outline" className="flex-shrink-0 text-xs">
                    ⭐
                  </Badge>
                )}
              </div>
            ))}

            {category.accessories.length > 2 && (
              <div className="flex items-center justify-center py-1 text-xs text-muted-foreground">
                +{category.accessories.length - 2} more
              </div>
            )}
          </div>

          {/* Expandable List */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                variants={expandVariants}
                className="overflow-hidden mb-4"
              >
                <div className="border-t pt-3 mb-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    All Compatible Models
                  </p>
                  <ScrollArea className="h-48">
                    <div className="space-y-2 pr-4">
                      {category.accessories.map((accessory) => (
                        <div key={accessory.id} className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium">
                                {accessory.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {accessory.description}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleCopy(accessory.name, accessory.id)
                              }
                              className="flex-shrink-0"
                            >
                              {copiedId === accessory.id ? (
                                <Check className="w-4 h-4 text-accent" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>

                          {/* Models for this accessory */}
                          <div className="flex flex-wrap gap-1 ml-1">
                            {accessory.compatibleModels.map((model) => (
                              <Badge
                                key={model}
                                variant="outline"
                                className="text-xs"
                              >
                                {model}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Buttons */}
          <div className="flex gap-2 mt-auto pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <ChevronDown
                className={`w-4 h-4 mr-1 transition-transform duration-300 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
              {isExpanded ? 'Show Less' : 'Expand'}
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-accent hover:bg-accent/90"
              onClick={() =>
                handleCopy(
                  `${category.title} - ${category.accessories.length} items`,
                  category.id
                )
              }
            >
              {copiedId === category.id ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy List
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
