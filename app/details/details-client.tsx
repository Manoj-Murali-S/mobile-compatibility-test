'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, Heart, Loader2, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MobileCard from '@/components/mobile-card';
import { MobileListRow, toCardMobile } from '@/components/mobile-grid';
import { getMobileById, getMobiles } from '@/lib/repository/mobiles';
import { getAllCompatibility } from '@/lib/repository/compatibility';
import { getAccessories } from '@/lib/repository/accessories';
import { getCategories } from '@/lib/repository/categories';
import type { CatalogMobile } from '@/lib/catalog-db';

export default function DetailsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const modelId = searchParams.get('id');

  if (!modelId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-2xl font-bold mb-4">No Device Selected</h1>
          <Link href="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const [mobile, setMobile] = useState<CatalogMobile | null>(null);
  const [allMobiles, setAllMobiles] = useState<CatalogMobile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [accessoryStats, setAccessoryStats] = useState<any>({ totalCount: 0, categories: 0, accessories: [] });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const [found, allMobiles, allCompat, allAccessories, allCategories] = await Promise.all([
          getMobileById(modelId as string),
          getMobiles(),
          getAllCompatibility(),
          getAccessories(),
          getCategories()
        ]);

        if (mounted && found) {
          setMobile(found);
          setAllMobiles(allMobiles);

          const getMobileName = (id: string) => {
            const m = allMobiles.find(x => x.id === id);
            return m ? `${(m as any).brandName || m.brandId} ${m.model}` : id;
          };

          const compatMobilesByCategory = new Map<string, Set<string>>();
          for (const c of allCompat) {
            const isSource = c.sourceMobileId === found.id;
            const isTarget = c.compatibleMobileIds.includes(found.id);

            if (isSource || isTarget) {
              if (!compatMobilesByCategory.has(c.category)) {
                compatMobilesByCategory.set(c.category, new Set());
              }
              const set = compatMobilesByCategory.get(c.category)!;
              set.add(c.sourceMobileId);
              for (const id of c.compatibleMobileIds) {
                set.add(id);
              }
            }
          }

          const categoryMap = new Map<string, any>();
          const icons: Record<string, string> = {
            'Tempered Glass': '🛡️',
            'Back Case': '📱',
            'Silicone Cover': '🎨',
            'Flip Cover': '💳',
            'Camera Protector': '📷',
          };

          for (const [catName, deviceIdsSet] of Array.from(compatMobilesByCategory.entries())) {
            const catInfo = allCategories.find(c => c.name === catName);
            categoryMap.set(catName, {
              id: catInfo?.id || catName.toLowerCase().replace(/\s+/g, '-'),
              title: catName,
              icon: icons[catName] || '✨',
              description: `Accessories compatible with ${catName}`,
              accessories: []
            });

            const otherDevices = Array.from(deviceIdsSet).filter(id => id !== found.id);

            const realAccs = allAccessories.filter(a =>
              a.category === catName &&
              (a.compatibleMobileIds.includes(found.id) || a.compatibleMobileIds.some(id => deviceIdsSet.has(id)))
            );

            if (realAccs.length > 0) {
              for (const acc of realAccs) {
                categoryMap.get(catName).accessories.push({
                  id: acc.id,
                  name: acc.name,
                  icon: '✨',
                  description: 'Verified Compatible',
                  compatibleModels: otherDevices.map(getMobileName),
                  featured: false
                });
              }
            } else if (otherDevices.length > 0) {
              categoryMap.get(catName).accessories.push({
                id: `generic-${catName.toLowerCase().replace(/\s+/g, '-')}`,
                name: `${catName}`,
                icon: '✨',
                description: `Compatible with ${otherDevices.length} other devices`,
                compatibleModels: otherDevices.map(getMobileName),
                featured: true
              });
            }
          }

          const accessoriesList = Array.from(categoryMap.values()).filter(cat => cat.accessories.length > 0);
          const totalCount = accessoriesList.reduce((sum: number, cat: any) => sum + cat.accessories.length, 0);

          const stats = {
            totalCount,
            categories: accessoriesList.length,
            accessories: accessoriesList
          };
          setAccessoryStats(stats);

          if (stats.accessories && stats.accessories.length > 0) {
            setActiveTabId(stats.accessories[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void loadData();
    return () => { mounted = false; };
  }, [modelId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!mobile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-2xl font-bold mb-4">Device Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The requested device could not be found.
          </p>
          <Link href="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">{(mobile as any).brandName || mobile.brandId} {mobile.model}</h1>
              <p className="text-sm text-muted-foreground">
                {accessoryStats.categories} accessory categories
              </p>
            </div>
          </div>
          {/* <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <Share2 className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Heart className="w-4 h-4" />
            </Button>
          </div> */}
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-background/50 backdrop-blur-md rounded-2xl p-6 border border-border shadow-sm">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold">{(mobile as any).brandName || mobile.brandId} {mobile.model}</h1>
                <Badge variant="secondary" className="font-normal text-xs bg-accent/10 text-accent">
                  {accessoryStats.totalCount} Accessories ({accessoryStats.categories} Categories)
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                Compatible accessories available for this device
              </p>
            </div>

            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border w-fit">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                className="px-3 text-xs h-8"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className="px-3 text-xs h-8"
                onClick={() => setViewMode('list')}
              >
                <List className="w-3.5 h-3.5 mr-1.5" />
                List
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Accessories Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="mb-6 flex flex-col gap-4">
            {accessoryStats.accessories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-0 hide-scrollbar mt-4 border-b border-border/50">
                {accessoryStats.accessories.map((category: any) => (
                  <motion.button
                    key={category.id}
                    onClick={() => setActiveTabId(category.id)}
                    className="relative px-6 py-4 text-lg font-medium whitespace-nowrap transition-colors flex items-center gap-3"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-2xl">{category.icon}</span>
                    <span className={activeTabId === category.id ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'}>
                      {category.title}
                    </span>
                    {activeTabId === category.id && (
                      <motion.div
                        layoutId="underline-category"
                        className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"
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
            )}
          </div>

          {accessoryStats.accessories.length > 0 ? (
            <div className="mt-8">
              {(() => {
                const activeCategory = accessoryStats.accessories.find((c: any) => c.id === activeTabId);
                if (!activeCategory) return null;

                // Extract all unique compatible models from all accessories in this category
                const compatibleModelNames = new Set<string>();
                activeCategory.accessories.forEach((acc: any) => {
                  acc.compatibleModels.forEach((m: string) => compatibleModelNames.add(m));
                });

                // Exclude the current mobile so we only show *other* compatible devices
                if (mobile) {
                  const currentMobileFullName = `${(mobile as any).brandName || mobile.brandId} ${mobile.model}`;
                  compatibleModelNames.delete(currentMobileFullName);
                }

                // Map full model names back to actual Mobile objects
                const compatibleMobiles = Array.from(compatibleModelNames)
                  .map(modelName => allMobiles.find(m => `${(m as any).brandName || m.brandId} ${m.model}` === modelName || m.model === modelName))
                  .filter(Boolean) as CatalogMobile[];

                if (compatibleMobiles.length === 0) {
                  return (
                    <div className="text-center py-12 bg-muted/30 rounded-2xl border border-border/50">
                      <p className="text-lg font-medium mb-2">No other compatible devices</p>
                      <p className="text-muted-foreground">
                        This accessory category is currently only listed for {mobile?.model}.
                      </p>
                    </div>
                  );
                }

                return (
                  <motion.div
                    key={activeCategory.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={
                      viewMode === 'grid'
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4"
                    }
                  >
                    {compatibleMobiles.map((compMobile, i) => (
                      <motion.div
                        key={compMobile.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05, duration: 0.3 }}
                        className="h-full"
                      >
                        {viewMode === 'grid' ? (
                          <MobileCard mobile={toCardMobile(compMobile)} hideViewDetails={true} />
                        ) : (
                          <MobileListRow mobile={toCardMobile(compMobile)} hideViewDetails={true} />
                        )}
                      </motion.div>
                    ))}
                  </motion.div>
                );
              })()}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 bg-muted/50 rounded-lg border border-border"
            >
              <p className="text-lg font-medium mb-2">No accessories found</p>
              <p className="text-muted-foreground mb-4">
                We&apos;re still adding accessories for {mobile.model}
              </p>
              <Link href="/">
                <Button variant="outline">Browse Other Devices</Button>
              </Link>
            </motion.div>
          )}
        </motion.section>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 pt-8 border-t border-border"
        >
          <div className="text-center">
            <h3 className="text-xl font-bold mb-2">Can&apos;t find what you&apos;re looking for?</h3>
            <div className="flex gap-2 justify-center">
              <Link href="/">
                <Button variant="outline">Browse All Devices</Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
