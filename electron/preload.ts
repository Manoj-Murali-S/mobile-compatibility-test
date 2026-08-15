/**
 * electron/preload.ts
 *
 * Preload script — securely bridges the Electron main process IPC to the renderer.
 * Exposes window.electronAPI with:
 *   - getDbPath(): returns the SQLite file path
 *   - db.run(sql, params): run a write query
 *   - db.get(sql, params): get a single row
 *   - db.all(sql, params): get all rows
 */

import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  /** Get the resolved SQLite DB file path */
  getDbPath: (): Promise<string> => ipcRenderer.invoke('get-db-path'),

  /** SQLite operations via main process (synchronous-feeling API, returns Promises) */
  db: {
    run: (sql: string, params?: unknown[]): Promise<{ ok: boolean; error?: string }> =>
      ipcRenderer.invoke('sqlite-run', sql, params ?? []),

    get: <T = unknown>(sql: string, params?: unknown[]): Promise<{ ok: boolean; data?: T; error?: string }> =>
      ipcRenderer.invoke('sqlite-get', sql, params ?? []),

    all: <T = unknown>(sql: string, params?: unknown[]): Promise<{ ok: boolean; data?: T[]; error?: string }> =>
      ipcRenderer.invoke('sqlite-all', sql, params ?? []),
  },

  /** Auth operations */
  auth: {
    login: (email: string, passwordAttempt: string): Promise<{ ok: boolean; user?: any; error?: string }> =>
      ipcRenderer.invoke('auth-login', email, passwordAttempt),
      
    register: (email: string, passwordAttempt: string, name: string, role: string): Promise<{ ok: boolean; user?: any; error?: string }> =>
      ipcRenderer.invoke('auth-register', email, passwordAttempt, name, role),
      
    getUsers: (): Promise<{ ok: boolean; data?: any[]; error?: string }> =>
      ipcRenderer.invoke('auth-get-users'),
      
    updateUser: (id: string, data: { role?: string; status?: string }): Promise<{ ok: boolean; error?: string }> =>
      ipcRenderer.invoke('auth-update-user', id, data),
  },
})
