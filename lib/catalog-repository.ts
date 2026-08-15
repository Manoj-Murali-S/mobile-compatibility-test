/**
 * lib/catalog-repository.ts
 *
 * Updated to delegate to the new repository layer.
 * Keeps the same public function signatures so existing callers are unaffected.
 */

import { seedCatalogIfEmpty as seed } from './repository/seeder'
import { searchMobiles } from './repository/mobiles'
import type { CatalogMobile } from './catalog-db'

export async function seedCatalogIfEmpty(): Promise<void> {
  await seed()
}

export async function searchCatalog(query: string): Promise<CatalogMobile[]> {
  await seed()
  return searchMobiles(query)
}
