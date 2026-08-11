import { catalogDb, type CatalogAccessory, type CatalogBrand, type CatalogCompatibility, type CatalogMobile } from './catalog-db'
import { getAllMobiles } from './mock-data'
import { COMPATIBILITY_GROUPS } from './mock-compatibility'
import { MOCK_ACCESSORIES } from './mock-accessories'

const now = () => new Date().toISOString()

export async function seedCatalogIfEmpty() {
  if (await catalogDb.mobiles.count()) return
  const timestamp = now()
  const mobiles: CatalogMobile[] = getAllMobiles().map((mobile, index) => ({
    id: mobile.model.toLowerCase().replace(/[^a-z0-9]+/g, '-'), model: mobile.model, brand: mobile.brand,
    year: Number(mobile.year), variants: mobile.variants, updatedAt: timestamp,
  }))
  const brands: CatalogBrand[] = Object.keys(mobiles.reduce<Record<string, true>>((acc, mobile) => { acc[mobile.brand] = true; return acc }, {})).map((name) => ({ id: name.toLowerCase(), name, updatedAt: timestamp }))
  const compatibility: CatalogCompatibility[] = Object.entries(COMPATIBILITY_GROUPS).flatMap(([sourceModel, groups]) =>
    Object.entries(groups).map(([category, devices]) => ({
      id: `${sourceModel}-${category}`, category, sourceModel,
      compatibleModels: devices.map((device) => device.model), updatedAt: timestamp,
    })),
  )
  const accessories: CatalogAccessory[] = MOCK_ACCESSORIES.map((item: any, index: number) => ({
    id: item.id ?? `accessory-${index}`, category: item.category ?? item.type ?? 'general',
    name: item.name ?? item.title ?? 'Accessory', compatibleModels: item.compatibleModels ?? [], updatedAt: timestamp,
  }))
  await catalogDb.transaction('rw', catalogDb.tables, async () => {
    await catalogDb.brands.bulkPut(brands); await catalogDb.mobiles.bulkPut(mobiles)
    await catalogDb.compatibility.bulkPut(compatibility); await catalogDb.accessories.bulkPut(accessories)
  })
}

export async function searchCatalog(query: string) {
  await seedCatalogIfEmpty()
  const term = query.trim().toLowerCase()
  if (!term) return catalogDb.mobiles.limit(12).toArray()
  return catalogDb.mobiles.filter((mobile) => `${mobile.brand} ${mobile.model}`.toLowerCase().includes(term)).limit(20).toArray()
}
