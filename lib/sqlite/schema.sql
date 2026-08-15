-- Mobile Compatibility Finder — SQLite Schema
-- Applied automatically on first launch by lib/sqlite/db.ts

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL,             -- 'superadmin' | 'admin' | 'editor' | 'viewer'
  status        TEXT NOT NULL,             -- 'pending' | 'approved' | 'rejected'
  created_on    TEXT NOT NULL,
  modified_on   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS catalog_brands (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  logo        TEXT DEFAULT '📱',
  device_count INTEGER DEFAULT 0,
  status      TEXT DEFAULT 'active',   -- 'active' | 'inactive'
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  created_by  TEXT,
  modified_by TEXT,
  created_on  TEXT,
  modified_on TEXT,
  FOREIGN KEY(created_by) REFERENCES users(id),
  FOREIGN KEY(modified_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS catalog_mobiles (
  id          TEXT PRIMARY KEY,
  brand       TEXT NOT NULL,
  model       TEXT NOT NULL,
  image       TEXT,
  year        INTEGER,
  variants    TEXT DEFAULT '[]',        -- JSON array e.g. ["128GB","256GB"]
  status      TEXT DEFAULT 'active',   -- 'active' | 'inactive' | 'discontinued'
  accessories INTEGER DEFAULT 0,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  created_by  TEXT,
  modified_by TEXT,
  created_on  TEXT,
  modified_on TEXT,
  FOREIGN KEY(created_by) REFERENCES users(id),
  FOREIGN KEY(modified_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS catalog_compatibility (
  id               TEXT PRIMARY KEY,
  category         TEXT NOT NULL,       -- e.g. 'Tempered Glass'
  source_model     TEXT NOT NULL,
  compatible_models TEXT DEFAULT '[]',  -- JSON array of model ids/names
  updated_at       TEXT NOT NULL,
  created_by       TEXT,
  modified_by      TEXT,
  created_on       TEXT,
  modified_on      TEXT,
  FOREIGN KEY(created_by) REFERENCES users(id),
  FOREIGN KEY(modified_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS catalog_accessories (
  id                TEXT PRIMARY KEY,
  category          TEXT NOT NULL,
  name              TEXT NOT NULL,
  compatible_models TEXT DEFAULT '[]',  -- JSON array
  updated_at        TEXT NOT NULL,
  created_by        TEXT,
  modified_by       TEXT,
  created_on        TEXT,
  modified_on       TEXT,
  FOREIGN KEY(created_by) REFERENCES users(id),
  FOREIGN KEY(modified_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS catalog_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT,                      -- JSON-encoded value
  updated_at TEXT NOT NULL
);

-- Offline sync queue — records every write for later Supabase push
CREATE TABLE IF NOT EXISTS sync_queue (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  record_id  TEXT NOT NULL,
  operation  TEXT NOT NULL,             -- 'upsert' | 'delete'
  payload    TEXT,                      -- JSON snapshot of the record
  created_at TEXT NOT NULL,
  synced_at  TEXT                       -- NULL = pending, ISO string = done
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_mobiles_brand      ON catalog_mobiles (brand);
CREATE INDEX IF NOT EXISTS idx_mobiles_updated    ON catalog_mobiles (updated_at);
CREATE INDEX IF NOT EXISTS idx_compat_source      ON catalog_compatibility (source_model);
CREATE INDEX IF NOT EXISTS idx_sync_queue_pending ON sync_queue (synced_at) WHERE synced_at IS NULL;
