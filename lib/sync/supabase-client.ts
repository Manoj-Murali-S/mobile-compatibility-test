/**
 * lib/sync/supabase-client.ts
 *
 * Creates and exports a shared Supabase JS client.
 *
 * - On Vercel/web: uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * - On Electron (offline): env vars are typically absent, so getSupabaseClient()
 *   returns null and all data goes through SQLite/Dexie instead.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient | null {
  if (_client) return _client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    // Supabase not configured — offline-only / Electron mode
    return null
  }

  try {
    _client = createClient(url, key, {
      auth: { persistSession: true },
    })
    return _client
  } catch {
    console.warn('[Supabase] Failed to create client — running offline-only')
    return null
  }
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

/**
 * Convenience: throws a descriptive error if called when Supabase is not configured.
 * Use in repository functions that require Supabase.
 */
export function requireSupabase(): SupabaseClient {
  const client = getSupabaseClient()
  if (!client) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    )
  }
  return client
}
