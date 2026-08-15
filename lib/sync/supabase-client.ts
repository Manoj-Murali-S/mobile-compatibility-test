/**
 * lib/sync/supabase-client.ts
 *
 * Creates a Supabase JS client. Completely optional — if no env vars are set,
 * returns null and sync is silently disabled.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient | null {
  if (_client) return _client

  const url =
    typeof window !== 'undefined'
      ? ((window as any).__NEXT_DATA__?.runtimeConfig?.supabaseUrl ??
         process.env.NEXT_PUBLIC_SUPABASE_URL)
      : process.env.NEXT_PUBLIC_SUPABASE_URL

  const key =
    typeof window !== 'undefined'
      ? ((window as any).__NEXT_DATA__?.runtimeConfig?.supabaseAnonKey ??
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    // Supabase not configured — offline-only mode
    return null
  }

  try {
    _client = createClient(url, key, {
      auth: { persistSession: false },
    })
    return _client
  } catch {
    console.warn('[SyncManager] Failed to create Supabase client — running offline-only')
    return null
  }
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
