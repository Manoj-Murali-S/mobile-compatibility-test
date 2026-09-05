'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getSupabaseClient } from './sync/supabase-client'
import { isWebApp } from './sqlite/db'

export interface User {
  id: string
  email: string
  name?: string
  role: 'superadmin' | 'admin' | 'editor' | 'viewer'
  status: 'pending' | 'approved' | 'rejected'
  created_on: string
  modified_on: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signIn: (email: string, passwordAttempt: string) => Promise<{ error?: string }>
  signUp: (email: string, passwordAttempt: string, role: string) => Promise<{ error?: string }>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isWebApp()) {
      // Web App: restore session from Supabase
      const supabase = getSupabaseClient()
      if (supabase) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            setUser(supabaseUserToAppUser(session.user))
          }
          setIsLoading(false)
        })

        // Keep user in sync when Supabase session changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ? supabaseUserToAppUser(session.user) : null)
        })
        return () => subscription.unsubscribe()
      } else {
        setIsLoading(false)
      }
    } else {
      // Electron: restore from localStorage
      try {
        const stored = localStorage.getItem('mcf_user')
        if (stored) setUser(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to load user from local storage', e)
      } finally {
        setIsLoading(false)
      }
    }
  }, [])

  const signIn = async (email: string, passwordAttempt: string) => {
    try {
      // ── Web App path (Supabase Auth) ──────────────────────────────────────
      if (isWebApp()) {
        const supabase = getSupabaseClient()
        if (!supabase) return { error: 'Supabase is not configured for this deployment.' }

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: passwordAttempt,
        })
        if (error) return { error: error.message }
        if (!data.user) return { error: 'Invalid email or password' }

        const appUser = supabaseUserToAppUser(data.user)
        setUser(appUser)
        return {}
      }

      // ── Electron path (local IPC) ─────────────────────────────────────────
      const api = (window as any).electronAPI
      if (api) {
        const res = await api.auth.login(email, passwordAttempt)
        if (!res.ok) {
          let errorMsg = res.error
          if (errorMsg.includes('UNIQUE constraint failed: users.email')) {
            errorMsg = 'Email already exists'
          }
          return { error: errorMsg }
        }
        setUser(res.user)
        localStorage.setItem('mcf_user', JSON.stringify(res.user))
        return {}
      }

      // ── Local dev fallback (no Electron, no Supabase) ─────────────────────
      const response = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login-user', email, passwordAttempt })
      })
      if (!response.ok) return { error: 'API not available in this environment.' }
      const data = await response.json()
      if (!data.ok || !data.user) return { error: data.error || 'Invalid email or password' }
      setUser(data.user)
      localStorage.setItem('mcf_user', JSON.stringify(data.user))
      return {}
    } catch (e: any) {
      return { error: e.message }
    }
  }

  const signUp = async (email: string, passwordAttempt: string, role: string) => {
    try {
      // ── Web App path (Supabase Auth) ──────────────────────────────────────
      if (isWebApp()) {
        const supabase = getSupabaseClient()
        if (!supabase) return { error: 'Supabase is not configured for this deployment.' }

        const { data, error } = await supabase.auth.signUp({
          email,
          password: passwordAttempt,
          options: {
            data: { role: role || 'viewer' }, // stored in auth.users user_metadata
          },
        })
        if (error) {
          if (error.message.includes('already registered')) return { error: 'Email already exists' }
          return { error: error.message }
        }
        if (!data.user) return { error: 'Sign up failed.' }

        const appUser = supabaseUserToAppUser(data.user)
        setUser(appUser)
        return {}
      }

      // ── Electron path (local IPC) ─────────────────────────────────────────
      const api = (window as any).electronAPI
      if (api) {
        const res = await api.auth.register(email, passwordAttempt, role)
        if (!res.ok) {
          let errorMsg = res.error
          if (errorMsg.includes('UNIQUE constraint failed: users.email')) {
            errorMsg = 'Email already exists'
          }
          return { error: errorMsg }
        }
        if (res.user.role === 'superadmin' || res.user.status === 'approved') {
          setUser(res.user)
          localStorage.setItem('mcf_user', JSON.stringify(res.user))
        }
        return {}
      }

      // ── Local dev fallback ────────────────────────────────────────────────
      const response = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register-user',
          email,
          passwordAttempt,
          role: (role as any) || 'viewer',
          status: 'approved',
          name: ''
        })
      })
      if (!response.ok) return { error: 'API not available in this environment.' }
      const data = await response.json()
      if (!data.ok) {
        let errorMsg = data.error
        if (errorMsg.includes('UNIQUE constraint failed: users.email')) {
          errorMsg = 'Email already exists'
        }
        return { error: errorMsg }
      }
      const newUser = data.user
      if (newUser.role === 'superadmin' || newUser.status === 'approved') {
        setUser(newUser)
        localStorage.setItem('mcf_user', JSON.stringify(newUser))
      }
      return {}
    } catch (e: any) {
      return { error: e.message }
    }
  }

  const signOut = () => {
    setUser(null)
    if (isWebApp()) {
      getSupabaseClient()?.auth.signOut()
    } else {
      localStorage.removeItem('mcf_user')
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

/** Helper to get current user ID for database repository calls (client-side only) */
export function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem('mcf_user')
    if (stored) return JSON.parse(stored).id
  } catch {
    // ignore
  }
  return null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Maps a Supabase auth user to the app's User shape.
 * Role is read from user_metadata (set during signUp) or defaults to 'viewer'.
 */
function supabaseUserToAppUser(supabaseUser: any): User {
  const meta = supabaseUser.user_metadata ?? {}
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    name: meta.name ?? meta.full_name ?? '',
    role: meta.role ?? 'viewer',
    status: 'approved', // Supabase-authenticated users are considered approved
    created_on: supabaseUser.created_at ?? new Date().toISOString(),
    modified_on: supabaseUser.updated_at ?? new Date().toISOString(),
  }
}
