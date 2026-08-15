"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    /** Get the resolved SQLite DB file path */
    getDbPath: () => electron_1.ipcRenderer.invoke('get-db-path'),
    /** SQLite operations via main process (synchronous-feeling API, returns Promises) */
    db: {
        run: (sql, params) => electron_1.ipcRenderer.invoke('sqlite-run', sql, params ?? []),
        get: (sql, params) => electron_1.ipcRenderer.invoke('sqlite-get', sql, params ?? []),
        all: (sql, params) => electron_1.ipcRenderer.invoke('sqlite-all', sql, params ?? []),
    },
    /** Auth operations */
    auth: {
        login: (email, passwordAttempt) => electron_1.ipcRenderer.invoke('auth-login', email, passwordAttempt),
        register: (email, passwordAttempt, name, role) => electron_1.ipcRenderer.invoke('auth-register', email, passwordAttempt, name, role),
        getUsers: () => electron_1.ipcRenderer.invoke('auth-get-users'),
        updateUser: (id, data) => electron_1.ipcRenderer.invoke('auth-update-user', id, data),
    },
});
//# sourceMappingURL=preload.js.map