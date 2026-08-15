-- Supabase Migration: 001_initial_schema.sql
-- Run this in your Supabase SQL Editor to create the tables that match
-- the local SQLite schema. The sync manager will push/pull against these tables.

-- Enable RLS (Row Level Security) on all tables
-- For offline-first sync with service role key, RLS can be permissive or disabled.

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

CREATE TABLE IF NOT EXISTS catalog_brands (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  logo         TEXT DEFAULT '📱',
  device_count INTEGER DEFAULT 0,
  status       TEXT DEFAULT 'active',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by   TEXT REFERENCES users(id),
  modified_by  TEXT REFERENCES users(id),
  created_on   TEXT,
  modified_on  TEXT
);

CREATE TABLE IF NOT EXISTS catalog_mobiles (
  id          TEXT PRIMARY KEY,
  brand       TEXT NOT NULL,
  model       TEXT NOT NULL,
  image       TEXT,
  year        INTEGER,
  variants    JSONB DEFAULT '[]',
  status      TEXT DEFAULT 'active',
  accessories INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by  TEXT REFERENCES users(id),
  modified_by TEXT REFERENCES users(id),
  created_on  TEXT,
  modified_on TEXT
);

CREATE TABLE IF NOT EXISTS catalog_compatibility (
  id                TEXT PRIMARY KEY,
  category          TEXT NOT NULL,
  source_model      TEXT NOT NULL,
  compatible_models JSONB DEFAULT '[]',
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        TEXT REFERENCES users(id),
  modified_by       TEXT REFERENCES users(id),
  created_on        TEXT,
  modified_on       TEXT
);

CREATE TABLE IF NOT EXISTS catalog_accessories (
  id                TEXT PRIMARY KEY,
  category          TEXT NOT NULL,
  name              TEXT NOT NULL,
  compatible_models JSONB DEFAULT '[]',
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by        TEXT REFERENCES users(id),
  modified_by       TEXT REFERENCES users(id),
  created_on        TEXT,
  modified_on       TEXT
);

-- Indexes for sync queries (filter by updated_at)
CREATE INDEX IF NOT EXISTS idx_mobiles_updated     ON catalog_mobiles (updated_at);
CREATE INDEX IF NOT EXISTS idx_brands_updated      ON catalog_brands (updated_at);
CREATE INDEX IF NOT EXISTS idx_compat_source       ON catalog_compatibility (source_model);
CREATE INDEX IF NOT EXISTS idx_compat_updated      ON catalog_compatibility (updated_at);
CREATE INDEX IF NOT EXISTS idx_accessories_updated ON catalog_accessories (updated_at);

-- RLS policies (allow service role full access, restrict anon)
ALTER TABLE catalog_brands        ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_mobiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_compatibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_accessories   ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users and service role to read/write everything
-- Adjust these policies for multi-tenant scenarios
CREATE POLICY "Allow all for service role" ON catalog_brands
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for service role" ON catalog_mobiles
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for service role" ON catalog_compatibility
  USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for service role" ON catalog_accessories
  USING (true) WITH CHECK (true);
