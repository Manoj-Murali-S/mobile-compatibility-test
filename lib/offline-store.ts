const DB_NAME = 'mobile-compatibility-finder'
const DB_VERSION = 1
const STORE_NAME = 'catalog'
const SNAPSHOT_KEY = 'catalog-snapshot'

export type OfflineCatalog = {
  brands: unknown[]
  mobiles: unknown[]
  compatibility: unknown[]
  accessories: unknown[]
  settings: Record<string, unknown>
  savedAt: string
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveOfflineCatalog(catalog: OfflineCatalog) {
  if (typeof indexedDB === 'undefined') return
  const db = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).put(catalog, SNAPSHOT_KEY)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
  db.close()
}

export async function getOfflineCatalog(): Promise<OfflineCatalog | null> {
  if (typeof indexedDB === 'undefined') return null
  const db = await openDatabase()
  const catalog = await new Promise<OfflineCatalog | null>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(SNAPSHOT_KEY)
    request.onsuccess = () => resolve(request.result ?? null)
    request.onerror = () => reject(request.error)
  })
  db.close()
  return catalog
}

export async function clearOfflineCatalog() {
  if (typeof indexedDB === 'undefined') return
  const db = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).delete(SNAPSHOT_KEY)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
  db.close()
}

export function isOffline() {
  return typeof navigator !== 'undefined' && !navigator.onLine
}

export function subscribeToConnectionStatus(callback: (online: boolean) => void) {
  const online = () => callback(true)
  const offline = () => callback(false)
  window.addEventListener('online', online)
  window.addEventListener('offline', offline)
  return () => {
    window.removeEventListener('online', online)
    window.removeEventListener('offline', offline)
  }
} 
