/**
 * electron/main.ts
 *
 * Electron main process — creates the browser window and manages the app lifecycle.
 * The Next.js static export (./out/) is loaded as a local file.
 * The SQLite DB path is resolved here and communicated to the renderer via preload.
 */

import { app, BrowserWindow, ipcMain, protocol } from 'electron'
import path from 'path'
import fs from 'fs'
import crypto from 'node:crypto'
import serve from 'electron-serve'

const loadURL = serve({ directory: path.join(__dirname, '..', 'out') })

// Resolve DB path and store in environment for the renderer preload
const DB_DIR = path.join(app.getPath('userData'), 'mobile-compatibility-finder')
const DB_PATH = path.join(DB_DIR, 'catalog.db')

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true })
}

console.log('>>> SQLite Database Path:', DB_PATH)

// Expose DB path to the preload script via environment variable
process.env.SQLITE_DB_PATH = DB_PATH

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Mobile Compatibility Finder',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Required for better-sqlite3 in renderer via preload
    },
    // Frame and theme
    backgroundColor: '#09090b',
    show: false,
  })

  // Load the Next.js static export
  const isDev = process.env.NODE_ENV === 'development'

  if (isDev) {
    // In dev: load from Next.js dev server
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    // In production: serve the exported static files via electron-serve
    loadURL(mainWindow)
  }
  
  // Temporarily open devtools to debug renderer issues

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// IPC: provide DB path to renderer
ipcMain.handle('get-db-path', () => DB_PATH)

// IPC: SQLite operations — all SQLite calls from the renderer go through these handlers
// This keeps the native sqlite module in the main process
let db: any = null

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
      console.log('>>> Migrated: Seeded default categories in SQLite (Electron)');
    }

    const columns = database.prepare('PRAGMA table_info(catalog_mobiles)').all()
    const columnNames = columns.map((col: any) => col.name)
    
    if (columnNames.includes('brand') && !columnNames.includes('brand_id')) {
      console.log('>>> Migrated: Old schema detected. Wiping database for fresh start...');
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
      
      const schemaSql = fs.readFileSync(path.join(__dirname, '..', 'lib', 'sqlite', 'schema.sql'), 'utf8')
      database.exec(schemaSql)
      return; // Early return since everything is wiped and recreated!
    }
    
    if (columnNames.includes('year')) {
      database.exec('ALTER TABLE catalog_mobiles DROP COLUMN year;')
      console.log('>>> Migrated: Dropped "year" column from catalog_mobiles')
    }
    if (columnNames.includes('variants')) {
      database.exec('ALTER TABLE catalog_mobiles DROP COLUMN variants;')
      console.log('>>> Migrated: Dropped "variants" column from catalog_mobiles')
    }
    if (columnNames.includes('accessories')) {
      database.exec('ALTER TABLE catalog_mobiles DROP COLUMN accessories;')
      console.log('>>> Migrated: Dropped "accessories" column from catalog_mobiles')
    }
  } catch (err) {
    console.error('>>> Failed to migrate SQLite schema:', err)
  }
}

function getOrOpenDb() {
  if (db) return db
  const { DatabaseSync } = require('node:sqlite')
  const isFirstRun = !fs.existsSync(DB_PATH)
  
  db = new DatabaseSync(DB_PATH)
  db.exec('PRAGMA journal_mode = WAL')
  db.exec('PRAGMA foreign_keys = ON')
  
  // Initialize schema if empty
  if (isFirstRun) {
    try {
      console.log('>>> Initializing SQLite schema...')
      const schemaSql = fs.readFileSync(path.join(__dirname, '..', 'lib', 'sqlite', 'schema.sql'), 'utf8')
      ;(db as any).exec(schemaSql)
      console.log('>>> SQLite schema initialized successfully.')
    } catch (err) {
      console.error('>>> Failed to initialize schema:', err)
    }
  } else {
    migrateSchema(db)
  }

  // Create default superadmin if it doesn't exist
  try {
    const adminCheck = db.prepare('SELECT id FROM users WHERE role = ?').get('superadmin')
    if (!adminCheck) {
      const id = crypto.randomUUID()
      const email = 'admin@example.com'
      const salt = crypto.randomBytes(16).toString('hex')
      const hash = crypto.scryptSync('password123', salt, 64).toString('hex')
      const password_hash = `${salt}:${hash}`
      const now = new Date().toISOString()
      
      db.prepare(`
        INSERT INTO users (id, email, password_hash, name, role, status, created_on, modified_on)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, email, password_hash, 'Super Admin', 'superadmin', 'approved', now, now)
      
      console.log('>>> Created default superadmin: admin@example.com / password123')
    }
  } catch (err) {
    console.error('>>> Failed to create default superadmin:', err)
  }

  return db
}

ipcMain.handle('sqlite-run', (_event, sql: string, params: unknown[]) => {
  try {
    getOrOpenDb()!.prepare(sql).run(...(params || []))
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
})

ipcMain.handle('sqlite-get', (_event, sql: string, params: unknown[]) => {
  try {
    const row = getOrOpenDb()!.prepare(sql).get(...(params || []))
    return { ok: true, data: row }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
})

ipcMain.handle('sqlite-all', (_event, sql: string, params: unknown[]) => {
  try {
    const rows = getOrOpenDb()!.prepare(sql).all(...(params || []))
    return { ok: true, data: rows }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
})

// IPC: Auth
ipcMain.handle('auth-login', (_event, email: string, passwordAttempt: string) => {
  try {
    const user = getOrOpenDb().prepare('SELECT * FROM users WHERE email = ?').get(email)
    if (!user) return { ok: false, error: 'Invalid email or password' }
    
    if (user.status !== 'approved') return { ok: false, error: 'Your account is pending approval or rejected' }
    
    const [salt, key] = user.password_hash.split(':')
    const hashedBuffer = crypto.scryptSync(passwordAttempt, salt, 64)
    
    const keyBuffer = Buffer.from(key, 'hex')
    const match = crypto.timingSafeEqual(hashedBuffer, keyBuffer)
    
    if (!match) return { ok: false, error: 'Invalid email or password' }
    
    // Omit password_hash
    const { password_hash, ...safeUser } = user
    return { ok: true, user: safeUser }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
})

ipcMain.handle('auth-register', (_event, email: string, passwordAttempt: string, name: string, role: string) => {
  try {
    const existing = getOrOpenDb().prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (existing) return { ok: false, error: 'Email already exists' }
    
    const id = crypto.randomUUID()
    const salt = crypto.randomBytes(16).toString('hex')
    const hash = crypto.scryptSync(passwordAttempt, salt, 64).toString('hex')
    const password_hash = `${salt}:${hash}`
    const now = new Date().toISOString()
    const status = (role === 'viewer') ? 'pending' : 'pending' // Force pending for anyone registering, except superadmin
    
    getOrOpenDb().prepare(`
      INSERT INTO users (id, email, password_hash, name, role, status, created_on, modified_on)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, email, password_hash, name, role, status, now, now)
    
    const user = { id, email, name, role, status, created_on: now, modified_on: now }
    return { ok: true, user }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
})

ipcMain.handle('auth-get-users', () => {
  try {
    const users = getOrOpenDb().prepare('SELECT id, email, name, role, status, created_on, modified_on FROM users ORDER BY created_on DESC').all()
    return { ok: true, data: users }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
})

ipcMain.handle('auth-update-user', (_event, id: string, data: { role?: string; status?: string }) => {
  try {
    const updates = []
    const params = []
    if (data.role) { updates.push('role = ?'); params.push(data.role) }
    if (data.status) { updates.push('status = ?'); params.push(data.status) }
    
    if (updates.length > 0) {
      updates.push('modified_on = ?')
      params.push(new Date().toISOString())
      params.push(id)
      getOrOpenDb().prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params)
    }
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
})

// App lifecycle
app.whenReady().then(() => {
  console.log('>>> Electron app is ready. Initializing database...')
  getOrOpenDb() // Force DB initialization immediately on startup
  
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (db) {
    try { (db as any).close() } catch { /* ignore */ }
    db = null
  }
  if (process.platform !== 'darwin') app.quit()
})
