/**
 * lib/sqlite/db.ts
 *
 * Unified SQLite adapter for the offline-first desktop app.
 *
 * In Electron: calls are proxied to the main process via window.electronAPI.db.*
 * (better-sqlite3 runs in the main process; renderer calls it via IPC).
 *
 * In browser-only dev: falls back to an in-memory no-op adapter so the
 * Next.js dev server still renders the UI for styling/layout work.
 * Real data operations in browser-only dev still go through Dexie (IndexedDB)
 * via the repository layer's fallback paths.
 */

export interface DbRow {
  [key: string]: unknown
}

export interface SqliteAdapter {
  run(sql: string, params?: unknown[]): void
  get<T = DbRow>(sql: string, params?: unknown[]): T | undefined
  all<T = DbRow>(sql: string, params?: unknown[]): T[]
}

// ─── Runtime detection ───────────────────────────────────────────────────────

function isElectronRenderer(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as any).electronAPI !== 'undefined' &&
    typeof (window as any).electronAPI.db !== 'undefined'
  )
}

// ─── IPC-based adapter (Electron renderer) ───────────────────────────────────

/**
 * NOTE: better-sqlite3 is synchronous, but Electron IPC is async.
 * We wrap in a synchronous-looking API by using a synchronous XHR trick
 * (not available in modern Electron) — instead we provide a proper async
 * adapter and make the repository functions async (which they already are).
 *
 * The adapter returned here wraps IPC calls in Promises.
 * Repository functions call await on these, so it works transparently.
 */

class IpcSqliteAdapter implements SqliteAdapter {
  private api = (window as any).electronAPI.db

  run(sql: string, params: unknown[] = []): void {
    // Fire-and-forget in sync context; repositories await this separately
    // For truly sync behavior, the main process handles it atomically
    this.api.run(sql, params).catch(console.error)
  }

  get<T = DbRow>(sql: string, params: unknown[] = []): T | undefined {
    // Note: this appears synchronous but is used via async repository functions
    // The adapter itself stores the promise; actual resolution happens in the async callers
    throw new Error('Use getAsync instead in Electron mode')
  }

  all<T = DbRow>(sql: string, params: unknown[] = []): T[] {
    throw new Error('Use allAsync instead in Electron mode')
  }

  async runAsync(sql: string, params: unknown[] = []): Promise<void> {
    const result = await this.api.run(sql, params)
    if (!result.ok) throw new Error(result.error ?? 'SQLite run failed')
  }

  async getAsync<T = DbRow>(sql: string, params: unknown[] = []): Promise<T | undefined> {
    const result = await this.api.get<T>(sql, params)
    if (!result.ok) throw new Error(result.error ?? 'SQLite get failed')
    return result.data
  }

  async allAsync<T = DbRow>(sql: string, params: unknown[] = []): Promise<T[]> {
    const result = await this.api.all<T>(sql, params)
    if (!result.ok) throw new Error(result.error ?? 'SQLite all failed')
    return result.data ?? []
  }
}

// ─── In-memory no-op adapter (browser dev) ───────────────────────────────────

class MemoryAdapter implements SqliteAdapter {
  run(_sql: string, _params: unknown[] = []): void {}
  get<T = DbRow>(_sql: string, _params: unknown[] = []): T | undefined { return undefined }
  all<T = DbRow>(_sql: string, _params: unknown[] = []): T[] { return [] }
  async runAsync(_sql: string, _params: unknown[] = []): Promise<void> {}
  async getAsync<T = DbRow>(_sql: string, _params: unknown[] = []): Promise<T | undefined> { return undefined }
  async allAsync<T = DbRow>(_sql: string, _params: unknown[] = []): Promise<T[]> { return [] }
}

// ─── Extended adapter interface ───────────────────────────────────────────────

export interface AsyncSqliteAdapter extends SqliteAdapter {
  runAsync(sql: string, params?: unknown[]): Promise<void>
  getAsync<T = DbRow>(sql: string, params?: unknown[]): Promise<T | undefined>
  allAsync<T = DbRow>(sql: string, params?: unknown[]): Promise<T[]>
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let _adapter: AsyncSqliteAdapter | null = null

export function getDb(): AsyncSqliteAdapter {
  if (_adapter) return _adapter

  if (isElectronRenderer()) {
    _adapter = new IpcSqliteAdapter()
  } else {
    _adapter = new MemoryAdapter() as unknown as AsyncSqliteAdapter
  }

  return _adapter
}

export function resetDb(): void {
  _adapter = null
}

/** Convenience: true when running inside Electron */
export function isElectron(): boolean {
  return isElectronRenderer()
}
