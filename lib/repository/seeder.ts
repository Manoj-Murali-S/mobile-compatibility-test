/**
 * lib/repository/seeder.ts
 *
 * Seeds SQLite (or Dexie) with mock data on first launch.
 * Replaces the old seedCatalogIfEmpty() in lib/catalog-repository.ts.
 */

import { getMobileCount, bulkUpsertMobiles } from './mobiles'
import { bulkUpsertCompatibility } from './compatibility'
import { bulkUpsertAccessories } from './accessories'
import { upsertBrand } from './brands'
import { getAllMobiles } from '../mock-data'
import { COMPATIBILITY_GROUPS } from '../mock-compatibility'
import { MOCK_ACCESSORIES } from '../mock-accessories'
import type { CatalogMobile, CatalogBrand, CatalogCompatibility, CatalogAccessory } from '../catalog-db'

const now = () => new Date().toISOString()

export async function seedCatalogIfEmpty(): Promise<void> {
  const count = await getMobileCount()
  if (count > 0) return

  const timestamp = now()

  // Build mobiles from mock data
  const mobiles: CatalogMobile[] = getAllMobiles().map((mobile) => ({
    id: mobile.model.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    model: mobile.model,
    brand: mobile.brand,
    year: Number(mobile.year),
    variants: mobile.variants ?? [],
    updatedAt: timestamp,
  }))

  // Derive unique brands from mobiles
  const brandMap: Record<string, CatalogBrand> = {}
  for (const m of mobiles) {
    if (!brandMap[m.brand]) {
      brandMap[m.brand] = {
        id: m.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: m.brand,
        updatedAt: timestamp,
      }
    }
  }

  // Build compatibility from mock groups
  const compatibility: CatalogCompatibility[] = Object.entries(COMPATIBILITY_GROUPS).flatMap(
    ([sourceModel, groups]) =>
      Object.entries(groups as Record<string, { model: string }[]>).map(([category, devices]) => ({
        id: `${sourceModel.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        category,
        sourceModel,
        compatibleModels: devices.map((d) => d.model),
        updatedAt: timestamp,
      }))
  )

  // Build accessories
  const accessories: CatalogAccessory[] = (MOCK_ACCESSORIES as any[]).map((item, index) => ({
    id: item.id ?? `accessory-${index}`,
    category: item.category ?? item.type ?? 'general',
    name: item.name ?? item.title ?? 'Accessory',
    compatibleModels: item.compatibleModels ?? [],
    updatedAt: timestamp,
  }))

  // Seed brands first
  for (const brand of Object.values(brandMap)) {
    await upsertBrand(brand)
  }

  // Bulk seed the rest
  await bulkUpsertMobiles(mobiles)
  await bulkUpsertCompatibility(compatibility)
  await bulkUpsertAccessories(accessories)

  console.log(`[Seeder] Seeded ${mobiles.length} mobiles, ${compatibility.length} compatibility groups, ${accessories.length} accessories`)
}
