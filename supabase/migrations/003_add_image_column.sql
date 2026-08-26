-- Add missing image column to catalog_mobiles

ALTER TABLE catalog_mobiles
  ADD COLUMN IF NOT EXISTS image TEXT;

-- Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';
