-- Drop device_count from catalog_brands
ALTER TABLE catalog_brands DROP COLUMN IF EXISTS device_count;

-- Drop year and variants from catalog_mobiles (in case they still exist in Supabase schema)
ALTER TABLE catalog_mobiles DROP COLUMN IF EXISTS year;
ALTER TABLE catalog_mobiles DROP COLUMN IF EXISTS variants;
