"use strict";
/**
 * electron/main.ts
 *
 * Electron main process — creates the browser window and manages the app lifecycle.
 * The Next.js static export (./out/) is loaded as a local file.
 * The SQLite DB path is resolved here and communicated to the renderer via preload.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const node_crypto_1 = __importDefault(require("node:crypto"));
const electron_serve_1 = __importDefault(require("electron-serve"));
const loadURL = (0, electron_serve_1.default)({ directory: path_1.default.join(__dirname, '..', 'out') });
// Resolve DB path and store in environment for the renderer preload
const DB_DIR = path_1.default.join(electron_1.app.getPath('userData'), 'mobile-compatibility-finder');
const DB_PATH = path_1.default.join(DB_DIR, 'catalog.db');
if (!fs_1.default.existsSync(DB_DIR)) {
    fs_1.default.mkdirSync(DB_DIR, { recursive: true });
}
console.log('>>> SQLite Database Path:', DB_PATH);
// Expose DB path to the preload script via environment variable
process.env.SQLITE_DB_PATH = DB_PATH;
let mainWindow = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        title: 'Mobile Compatibility Finder',
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false, // Required for better-sqlite3 in renderer via preload
        },
        // Frame and theme
        backgroundColor: '#09090b',
        show: false,
    });
    // Load the Next.js static export
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
        // In dev: load from Next.js dev server
        mainWindow.loadURL('http://localhost:3000');
        mainWindow.webContents.openDevTools();
    }
    else {
        // In production: serve the exported static files via electron-serve
        loadURL(mainWindow);
    }
    // Temporarily open devtools to debug renderer issues
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
// IPC: provide DB path to renderer
electron_1.ipcMain.handle('get-db-path', () => DB_PATH);
// IPC: SQLite operations — all SQLite calls from the renderer go through these handlers
// This keeps the native sqlite module in the main process
let db = null;
function getOrOpenDb() {
    if (db)
        return db;
    const { DatabaseSync } = require('node:sqlite');
    const isFirstRun = !fs_1.default.existsSync(DB_PATH);
    db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA foreign_keys = ON');
    // Initialize schema if empty
    if (isFirstRun) {
        try {
            console.log('>>> Initializing SQLite schema...');
            const schemaSql = fs_1.default.readFileSync(path_1.default.join(__dirname, '..', 'lib', 'sqlite', 'schema.sql'), 'utf8');
            db.exec(schemaSql);
            console.log('>>> SQLite schema initialized successfully.');
        }
        catch (err) {
            console.error('>>> Failed to initialize schema:', err);
        }
    }
    // Create default superadmin if it doesn't exist
    try {
        const adminCheck = db.prepare('SELECT id FROM users WHERE role = ?').get('superadmin');
        if (!adminCheck) {
            const id = node_crypto_1.default.randomUUID();
            const email = 'admin@example.com';
            const salt = node_crypto_1.default.randomBytes(16).toString('hex');
            const hash = node_crypto_1.default.scryptSync('password123', salt, 64).toString('hex');
            const password_hash = `${salt}:${hash}`;
            const now = new Date().toISOString();
            db.prepare(`
        INSERT INTO users (id, email, password_hash, name, role, status, created_on, modified_on)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, email, password_hash, 'Super Admin', 'superadmin', 'approved', now, now);
            console.log('>>> Created default superadmin: admin@example.com / password123');
        }
    }
    catch (err) {
        console.error('>>> Failed to create default superadmin:', err);
    }
    return db;
}
electron_1.ipcMain.handle('sqlite-run', (_event, sql, params) => {
    try {
        getOrOpenDb().prepare(sql).run(...(params || []));
        return { ok: true };
    }
    catch (e) {
        return { ok: false, error: e.message };
    }
});
electron_1.ipcMain.handle('sqlite-get', (_event, sql, params) => {
    try {
        const row = getOrOpenDb().prepare(sql).get(...(params || []));
        return { ok: true, data: row };
    }
    catch (e) {
        return { ok: false, error: e.message };
    }
});
electron_1.ipcMain.handle('sqlite-all', (_event, sql, params) => {
    try {
        const rows = getOrOpenDb().prepare(sql).all(...(params || []));
        return { ok: true, data: rows };
    }
    catch (e) {
        return { ok: false, error: e.message };
    }
});
// IPC: Auth
electron_1.ipcMain.handle('auth-login', (_event, email, passwordAttempt) => {
    try {
        const user = getOrOpenDb().prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user)
            return { ok: false, error: 'Invalid email or password' };
        if (user.status !== 'approved')
            return { ok: false, error: 'Your account is pending approval or rejected' };
        const [salt, key] = user.password_hash.split(':');
        const hashedBuffer = node_crypto_1.default.scryptSync(passwordAttempt, salt, 64);
        const keyBuffer = Buffer.from(key, 'hex');
        const match = node_crypto_1.default.timingSafeEqual(hashedBuffer, keyBuffer);
        if (!match)
            return { ok: false, error: 'Invalid email or password' };
        // Omit password_hash
        const { password_hash, ...safeUser } = user;
        return { ok: true, user: safeUser };
    }
    catch (e) {
        return { ok: false, error: e.message };
    }
});
electron_1.ipcMain.handle('auth-register', (_event, email, passwordAttempt, name, role) => {
    try {
        const existing = getOrOpenDb().prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing)
            return { ok: false, error: 'Email already exists' };
        const id = node_crypto_1.default.randomUUID();
        const salt = node_crypto_1.default.randomBytes(16).toString('hex');
        const hash = node_crypto_1.default.scryptSync(passwordAttempt, salt, 64).toString('hex');
        const password_hash = `${salt}:${hash}`;
        const now = new Date().toISOString();
        const status = (role === 'viewer') ? 'pending' : 'pending'; // Force pending for anyone registering, except superadmin
        getOrOpenDb().prepare(`
      INSERT INTO users (id, email, password_hash, name, role, status, created_on, modified_on)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, email, password_hash, name, role, status, now, now);
        const user = { id, email, name, role, status, created_on: now, modified_on: now };
        return { ok: true, user };
    }
    catch (e) {
        return { ok: false, error: e.message };
    }
});
electron_1.ipcMain.handle('auth-get-users', () => {
    try {
        const users = getOrOpenDb().prepare('SELECT id, email, name, role, status, created_on, modified_on FROM users ORDER BY created_on DESC').all();
        return { ok: true, data: users };
    }
    catch (e) {
        return { ok: false, error: e.message };
    }
});
electron_1.ipcMain.handle('auth-update-user', (_event, id, data) => {
    try {
        const updates = [];
        const params = [];
        if (data.role) {
            updates.push('role = ?');
            params.push(data.role);
        }
        if (data.status) {
            updates.push('status = ?');
            params.push(data.status);
        }
        if (updates.length > 0) {
            updates.push('modified_on = ?');
            params.push(new Date().toISOString());
            params.push(id);
            getOrOpenDb().prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
        }
        return { ok: true };
    }
    catch (e) {
        return { ok: false, error: e.message };
    }
});
// App lifecycle
electron_1.app.whenReady().then(() => {
    console.log('>>> Electron app is ready. Initializing database...');
    getOrOpenDb(); // Force DB initialization immediately on startup
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
electron_1.app.on('window-all-closed', () => {
    if (db) {
        try {
            db.close();
        }
        catch { /* ignore */ }
        db = null;
    }
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
//# sourceMappingURL=main.js.map