-- Add missing users table and audit columns to catalog tables

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL,
  status        TEXT NOT NULL,
  created_on    TEXT NOT NULL,
  modified_on   TEXT NOT NULL
);

ALTER TABLE catalog_brands
  ADD COLUMN IF NOT EXISTS created_by TEXT REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS modified_by TEXT REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS created_on TEXT,
  ADD COLUMN IF NOT EXISTS modified_on TEXT;

ALTER TABLE catalog_mobiles
  ADD COLUMN IF NOT EXISTS created_by TEXT REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS modified_by TEXT REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS created_on TEXT,
  ADD COLUMN IF NOT EXISTS modified_on TEXT;

ALTER TABLE catalog_compatibility
  ADD COLUMN IF NOT EXISTS created_by TEXT REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS modified_by TEXT REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS created_on TEXT,
  ADD COLUMN IF NOT EXISTS modified_on TEXT;

ALTER TABLE catalog_accessories
  ADD COLUMN IF NOT EXISTS created_by TEXT REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS modified_by TEXT REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS created_on TEXT,
  ADD COLUMN IF NOT EXISTS modified_on TEXT;

-- Notify PostgREST to reload the schema cache so the new columns are recognized
NOTIFY pgrst, 'reload schema';
