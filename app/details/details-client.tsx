'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AccessoryCard } from '@/components/accessory-card';
import { getAccessoryStats } from '@/lib/mock-accessories';
import { getMobileById } from '@/lib/repository/mobiles';
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const found = await getMobileById(modelId as string);
        if (mounted) {
          setMobile(found || null);
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

  const accessoryStats = getAccessoryStats(mobile.model);

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
              onClick={() => router.back()}
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
          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <Share2 className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Heart className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-2xl p-8 border border-border">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
              <div>
                <h2 className="text-3xl font-bold mb-2">{(mobile as any).brandName || mobile.brandId} {mobile.model}</h2>
                <p className="text-muted-foreground text-lg">
                  Find the perfect accessories for your device
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-accent mb-1">
                  {accessoryStats.totalCount}
                </div>
                <p className="text-sm text-muted-foreground">
                  Compatible Accessories
                </p>
              </div>
            </div>

            {/* Device Info Badges */}
            <div className="flex flex-wrap gap-2">
              {accessoryStats.categories > 0 && (
                <Badge variant="secondary" className="bg-accent/20 text-accent">
                  🎁 {accessoryStats.categories} Categories
                </Badge>
              )}
            </div>
          </div>
        </motion.div>

        {/* Accessories Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Compatible Accessories</h2>
            <p className="text-muted-foreground">
              Browse accessories compatible with {mobile.model}
            </p>
          </div>

          {accessoryStats.accessories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-max">
              {accessoryStats.accessories.map((category, idx) => (
                <AccessoryCard
                  key={category.id}
                  category={category}
                  index={idx}
                />
              ))}
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
            <p className="text-muted-foreground mb-4">
              Contact us for custom recommendations
            </p>
            <div className="flex gap-2 justify-center">
              <Link href="/">
                <Button variant="outline">Browse All Devices</Button>
              </Link>
              <Button className="bg-accent hover:bg-accent/90">
                Get Recommendations
              </Button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
