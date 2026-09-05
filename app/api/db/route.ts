import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import os from 'os'
import fs from 'fs'
import crypto from 'node:crypto'

// Lazy-loaded database connection instance
let db: any = null

/**
 * Resolves the path to the catalog.db SQLite database.
 * Matches the directory structure of the Electron app.
 */
function getDbPath(): string {
  const home = os.homedir()
  const appSubdir = path.join('Mobile Compatibility Finder', 'mobile-compatibility-finder', 'catalog.db')
  
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming')
    return path.join(appData, appSubdir)
  } else if (process.platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support', appSubdir)
  } else {
    const configHome = process.env.XDG_CONFIG_HOME || path.join(home, '.config')
    return path.join(configHome, appSubdir)
  }
}

function migrateSchema(database: any) {
  try {
    // Ensure catalog_categories table exists
    database.exec(`
      CREATE TABLE IF NOT EXISTS catalog_categories (
        id          TEXT PRIMARY KEY,
        name        TEXT UNIQUE NOT NULL,
        created_at  TEXT NOT NULL,
        updated_at  TEXT NOT NULL
      );
    `);

    // Seed default categories if empty
    const count = database.prepare('SELECT COUNT(*) as count FROM catalog_categories').get().count;
    if (count === 0) {
      const now = new Date().toISOString();
      const stmt = database.prepare('INSERT INTO catalog_categories (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)');
      const defaults = [
        ['tempered-glass', 'Tempered Glass'],
        ['back-case', 'Back Case'],
        ['silicone-cover', 'Silicone Cover'],
        ['flip-cover', 'Flip Cover'],
        ['camera-protector', 'Camera Protector']
      ];
      for (const [id, name] of defaults) {
        stmt.run(id, name, now, now);
      }
      console.log('>>> Migrated: Seeded default categories in SQLite (API Route)');
    }

    const columns = database.prepare('PRAGMA table_info(catalog_mobiles)').all()
    const columnNames = columns.map((col: any) => col.name)
    
    if (columnNames.includes('brand') && !columnNames.includes('brand_id')) {
      console.log('>>> API Route Migrated: Old schema detected. Wiping database for fresh start...');
      database.exec(`
        DROP TABLE IF EXISTS sync_queue;
        DROP TABLE IF EXISTS catalog_settings;
        DROP TABLE IF EXISTS catalog_categories;
        DROP TABLE IF EXISTS catalog_accessories;
        DROP TABLE IF EXISTS catalog_compatibility;
        DROP TABLE IF EXISTS catalog_mobiles;
        DROP TABLE IF EXISTS catalog_brands;
        DROP TABLE IF EXISTS users;
      `);
      
      const schemaPath = path.join(process.cwd(), 'lib', 'sqlite', 'schema.sql')
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8')
        database.exec(schemaSql)
      }
      return; // Early return since everything is wiped and recreated!
    }
    
    if (columnNames.includes('year')) {
      database.exec('ALTER TABLE catalog_mobiles DROP COLUMN year;')
      console.log('>>> API Route Migrated: Dropped "year" column from catalog_mobiles')
    }
    if (columnNames.includes('variants')) {
      database.exec('ALTER TABLE catalog_mobiles DROP COLUMN variants;')
      console.log('>>> API Route Migrated: Dropped "variants" column from catalog_mobiles')
    }
    if (columnNames.includes('accessories')) {
      database.exec('ALTER TABLE catalog_mobiles DROP COLUMN accessories;')
      console.log('>>> API Route Migrated: Dropped "accessories" column from catalog_mobiles')
    }

    const brandColumns = database.pragma('table_info(catalog_brands)') as any[]
    const brandColumnNames = brandColumns.map(c => c.name)
    if (brandColumnNames.includes('device_count')) {
      // Need to recreate table for SQLite since DROP COLUMN is limited in some versions,
      // but typical modern SQLite supports DROP COLUMN. Let's try DROP COLUMN first.
      try {
        database.exec('ALTER TABLE catalog_brands DROP COLUMN device_count;')
        console.log('>>> API Route Migrated: Dropped "device_count" column from catalog_brands')
      } catch (e) {
        // Fallback for older SQLite versions
        database.exec(`
          CREATE TABLE catalog_brands_new (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            logo TEXT,
            status TEXT DEFAULT 'active',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            created_by TEXT,
            modified_by TEXT,
            created_on TEXT,
            modified_on TEXT
          );
          INSERT INTO catalog_brands_new SELECT id,name,logo,status,created_at,updated_at,created_by,modified_by,created_on,modified_on FROM catalog_brands;
          DROP TABLE catalog_brands;
          ALTER TABLE catalog_brands_new RENAME TO catalog_brands;
        `)
        console.log('>>> API Route Migrated: Dropped "device_count" via table rebuild')
      }
    }

    // Detect and remove FK constraints on audit columns (created_by / modified_by → users).
    // SQLite cannot drop FKs via ALTER TABLE, so we check the CREATE SQL and recreate without them.
    const brandsTableSql = database.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='catalog_brands'").get()?.sql ?? ''
    const hasBrandAuditFk = brandsTableSql.includes('REFERENCES users') && brandsTableSql.includes('created_by')
    if (hasBrandAuditFk) {
      console.log('>>> API Route: Removing audit FK constraints from catalog_brands...')
      database.exec(`
        PRAGMA foreign_keys = OFF;
        BEGIN;
        CREATE TABLE catalog_brands_new (
          id          TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          logo TEXT,
          status TEXT DEFAULT 'active',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          created_by TEXT,
          modified_by TEXT,
          created_on TEXT,
          modified_on TEXT
        );
        INSERT INTO catalog_brands_new SELECT id,name,logo,status,created_at,updated_at,created_by,modified_by,created_on,modified_on FROM catalog_brands;
        DROP TABLE catalog_brands;
        ALTER TABLE catalog_brands_new RENAME TO catalog_brands;
        COMMIT;
        PRAGMA foreign_keys = ON;
      `)
      console.log('>>> API Route: catalog_brands audit FKs removed.')
    }

    const mobilesTableSql = database.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='catalog_mobiles'").get()?.sql ?? ''
    const hasMobilesAuditFk = mobilesTableSql.includes('REFERENCES users') && mobilesTableSql.includes('created_by')
    if (hasMobilesAuditFk) {
      console.log('>>> API Route: Removing audit FK constraints from catalog_mobiles...')
      database.exec(`
        PRAGMA foreign_keys = OFF;
        BEGIN;
        CREATE TABLE catalog_mobiles_new (
          id          TEXT PRIMARY KEY,
          brand_id    TEXT NOT NULL,
          model       TEXT NOT NULL,
          image       TEXT,
          status      TEXT DEFAULT 'active',
          created_at  TEXT NOT NULL,
          updated_at  TEXT NOT NULL,
          created_by  TEXT,
          modified_by TEXT,
          created_on  TEXT,
          modified_on TEXT,
          FOREIGN KEY(brand_id) REFERENCES catalog_brands(id) ON DELETE CASCADE
        );
        INSERT INTO catalog_mobiles_new SELECT id,brand_id,model,image,status,created_at,updated_at,created_by,modified_by,created_on,modified_on FROM catalog_mobiles;
        DROP TABLE catalog_mobiles;
        ALTER TABLE catalog_mobiles_new RENAME TO catalog_mobiles;
        COMMIT;
        PRAGMA foreign_keys = ON;
      `)
      console.log('>>> API Route: catalog_mobiles audit FKs removed.')
    }

    const compatTableSql = database.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='catalog_compatibility'").get()?.sql ?? ''
    const hasCompatAuditFk = compatTableSql.includes('REFERENCES users') && compatTableSql.includes('created_by')
    if (hasCompatAuditFk) {
      console.log('>>> API Route: Removing audit FK constraints from catalog_compatibility...')
      database.exec(`
        PRAGMA foreign_keys = OFF;
        BEGIN;
        CREATE TABLE catalog_compatibility_new (
          id                TEXT PRIMARY KEY,
          category          TEXT NOT NULL,
          source_mobile_id  TEXT NOT NULL,
          compatible_mobile_ids TEXT DEFAULT '[]',
          updated_at        TEXT NOT NULL,
          created_by        TEXT,
          modified_by       TEXT,
          created_on        TEXT,
          modified_on       TEXT,
          FOREIGN KEY(source_mobile_id) REFERENCES catalog_mobiles(id) ON DELETE CASCADE
        );
        INSERT INTO catalog_compatibility_new SELECT id,category,source_mobile_id,compatible_mobile_ids,updated_at,created_by,modified_by,created_on,modified_on FROM catalog_compatibility;
        DROP TABLE catalog_compatibility;
        ALTER TABLE catalog_compatibility_new RENAME TO catalog_compatibility;
        COMMIT;
        PRAGMA foreign_keys = ON;
      `)
      console.log('>>> API Route: catalog_compatibility audit FKs removed.')
    }

    const accTableSql = database.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='catalog_accessories'").get()?.sql ?? ''
    const hasAccAuditFk = accTableSql.includes('REFERENCES users') && accTableSql.includes('created_by')
    if (hasAccAuditFk) {
      console.log('>>> API Route: Removing audit FK constraints from catalog_accessories...')
      database.exec(`
        PRAGMA foreign_keys = OFF;
        BEGIN;
        CREATE TABLE catalog_accessories_new (
          id                    TEXT PRIMARY KEY,
          category              TEXT NOT NULL,
          name                  TEXT NOT NULL,
          compatible_mobile_ids TEXT DEFAULT '[]',
          updated_at            TEXT NOT NULL,
          created_by            TEXT,
          modified_by           TEXT,
          created_on            TEXT,
          modified_on           TEXT
        );
        INSERT INTO catalog_accessories_new SELECT id,category,name,compatible_mobile_ids,updated_at,created_by,modified_by,created_on,modified_on FROM catalog_accessories;
        DROP TABLE catalog_accessories;
        ALTER TABLE catalog_accessories_new RENAME TO catalog_accessories;
        COMMIT;
        PRAGMA foreign_keys = ON;
      `)
      console.log('>>> API Route: catalog_accessories audit FKs removed.')
    }
  } catch (err) {
    console.error('>>> API Route failed to migrate SQLite schema:', err)
  }
}

/**
 * Initializes and returns the SQLite database connection.
 * Automatically handles schema creation and default admin setup on first run.
 */
function getDbInstance() {
  if (db) return db

  const dbPath = getDbPath()
  const dir = path.dirname(dbPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const isFirstRun = !fs.existsSync(dbPath)
  let nodeSqliteError: any = null

  // Try native node:sqlite first (Node v22.5.0+)
  // We use eval('require') to bypass Webpack/Turbopack bundling at build time.
  try {
    const requireFunc = eval('require')
    const { DatabaseSync } = requireFunc('node:sqlite')
    db = new DatabaseSync(dbPath)
    db.exec('PRAGMA journal_mode = WAL')
    db.exec('PRAGMA foreign_keys = ON')
    
    if (isFirstRun) {
      const schemaPath = path.join(process.cwd(), 'lib', 'sqlite', 'schema.sql')
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8')
        db.exec(schemaSql)
      }
    } else {
      migrateSchema(db)
    }
    
    ensureDefaultAdmin(db)
    return db
  } catch (e: any) {
    nodeSqliteError = e
    console.warn('node:sqlite not available or failed to load. Falling back to better-sqlite3...', e)
  }

  // Fallback to better-sqlite3
  // We use eval('require') to bypass Webpack/Turbopack bundling at build time.
  try {
    const requireFunc = eval('require')
    const Database = requireFunc('better-sqlite3')
    db = new Database(dbPath)
    db.exec('PRAGMA journal_mode = WAL')
    db.exec('PRAGMA foreign_keys = ON')
    
    if (isFirstRun) {
      const schemaPath = path.join(process.cwd(), 'lib', 'sqlite', 'schema.sql')
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8')
        db.exec(schemaSql)
      }
    } else {
      migrateSchema(db)
    }
    
    ensureDefaultAdmin(db)
    return db
  } catch (e: any) {
    console.error('Failed to load SQLite drivers (node:sqlite and better-sqlite3):', e)
    throw new Error(
      `No SQLite driver available on Next.js server. ` +
      `node:sqlite error: ${nodeSqliteError?.message || nodeSqliteError}. ` +
      `better-sqlite3 error: ${e?.message || e}`
    )
  }
}

/**
 * Creates a default superadmin if one does not exist yet.
 */
function ensureDefaultAdmin(database: any) {
  try {
    const adminCheck = database.prepare('SELECT id FROM users WHERE role = ?').get('superadmin')
    if (!adminCheck) {
      const id = crypto.randomUUID()
      const email = 'admin@example.com'
      const salt = crypto.randomBytes(16).toString('hex')
      const hash = crypto.scryptSync('password123', salt, 64).toString('hex')
      const password_hash = `${salt}:${hash}`
      const now = new Date().toISOString()
      
      database.prepare(`
        INSERT INTO users (id, email, password_hash, name, role, status, created_on, modified_on)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, email, password_hash, 'Super Admin', 'superadmin', 'approved', now, now)
      
      console.log('>>> API Route created default superadmin: admin@example.com / password123')
    }
  } catch (err) {
    console.error('>>> API Route failed to check/create default superadmin:', err)
  }
}

export async function POST(req: NextRequest) {
  // On Vercel (cloud), this route is not available.
  // All data goes through Supabase directly from the client repositories.
  if (process.env.VERCEL || process.env.VERCEL_ENV) {
    return NextResponse.json(
      { ok: false, error: 'Local SQLite API is not available on Vercel. Use Supabase instead.' },
      { status: 503 }
    )
  }

  try {
    const body = await req.json()
    const { action, sql, params, email, passwordAttempt, role, status, name } = body
    const dbInstance = getDbInstance()
    
    if (action === 'run') {
      dbInstance.prepare(sql).run(...(params || []))
      return NextResponse.json({ ok: true })
    } else if (action === 'get') {
      const data = dbInstance.prepare(sql).get(...(params || []))
      return NextResponse.json({ ok: true, data })
    } else if (action === 'all') {
      const data = dbInstance.prepare(sql).all(...(params || []))
      return NextResponse.json({ ok: true, data })
    } else if (action === 'register-user') {
      if (!email || !passwordAttempt) {
        return NextResponse.json({ ok: false, error: 'Email and password are required' })
      }
      const existing = dbInstance.prepare('SELECT id FROM users WHERE email = ?').get(email)
      if (existing) return NextResponse.json({ ok: false, error: 'Email already exists' })
      
      const id = crypto.randomUUID()
      const salt = crypto.randomBytes(16).toString('hex')
      const hash = crypto.scryptSync(passwordAttempt, salt, 64).toString('hex')
      const password_hash = `${salt}:${hash}`
      const now = new Date().toISOString()
      
      dbInstance.prepare(`
        INSERT INTO users (id, email, password_hash, name, role, status, created_on, modified_on)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, email, password_hash, name || '', role || 'viewer', status || 'approved', now, now)
      
      const user = { id, email, name: name || '', role: role || 'viewer', status: status || 'approved', created_on: now, modified_on: now }
      return NextResponse.json({ ok: true, user })
    } else if (action === 'login-user') {
      if (!email || !passwordAttempt) {
        return NextResponse.json({ ok: false, error: 'Email and password are required' })
      }
      const user = dbInstance.prepare('SELECT * FROM users WHERE email = ?').get(email)
      if (!user) return NextResponse.json({ ok: false, error: 'Invalid email or password' })
      if (user.status !== 'approved') return NextResponse.json({ ok: false, error: 'Your account is pending approval or rejected' })
      
      if (!user.password_hash || typeof user.password_hash !== 'string' || !user.password_hash.includes(':')) {
        return NextResponse.json({ ok: false, error: 'Invalid email or password (malformed hash)' })
      }
      
      const [salt, key] = user.password_hash.split(':')
      if (!salt || !key) return NextResponse.json({ ok: false, error: 'Invalid email or password' })
      
      const hashedBuffer = crypto.scryptSync(passwordAttempt, salt, 64)
      const keyBuffer = Buffer.from(key, 'hex')
      const match = crypto.timingSafeEqual(hashedBuffer, keyBuffer)
      
      if (!match) return NextResponse.json({ ok: false, error: 'Invalid email or password' })
      
      const { password_hash, ...safeUser } = user
      return NextResponse.json({ ok: true, user: safeUser })
    } else {
      return NextResponse.json({ ok: false, error: 'Invalid db action' }, { status: 400 })
    }
  } catch (err: any) {
    console.error('Next.js API SQLite handler error:', err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
