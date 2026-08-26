/**
 * lib/repository/seeder.ts
 *
 * Mock data has been removed as part of the SQLite refactoring.
 * This function is kept to satisfy existing callers but no longer seeds mock data.
 */

export async function seedCatalogIfEmpty(): Promise<void> {
  // Data is now handled dynamically or synced from the remote server.
  // The mock data arrays (MOCK_MOBILES, COMPATIBILITY_GROUPS) were removed.
  return
}
