'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export interface User {
  id: string
  email: string
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
    try {
      const stored = localStorage.getItem('mcf_user')
      if (stored) setUser(JSON.parse(stored))
    } catch (e) {
      console.error('Failed to load user from local storage', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signIn = async (email: string, passwordAttempt: string) => {
    try {
      const api = (window as any).electronAPI
      if (!api) {
        // Fallback for browser/dev mode via Next.js API
        const response = await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'get',
            sql: 'SELECT id, email, role, status, created_on, modified_on FROM users WHERE email = ?',
            params: [email]
          })
        })
        const data = await response.json()
        if (!data.ok || !data.data) {
          return { error: 'Invalid email or password' }
        }
        setUser(data.data)
        localStorage.setItem('mcf_user', JSON.stringify(data.data))
        return {}
      }
      
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
    } catch (e: any) {
      return { error: e.message }
    }
  }

  const signUp = async (email: string, passwordAttempt: string, role: string) => {
    try {
      const api = (window as any).electronAPI
      if (!api) {
        // Fallback for browser/dev mode via Next.js API
        const id = crypto.randomUUID()
        const now = new Date().toISOString()
        const newUser: User = {
          id,
          email,
          role: (role as any) || 'viewer',
          status: 'approved',
          created_on: now,
          modified_on: now,
        }
        
        const response = await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'run',
            sql: 'INSERT INTO users (id, email, password_hash, name, role, status, created_on, modified_on) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            params: [id, email, 'dev-mock-hash', '', newUser.role, newUser.status, now, now]
          })
        })
        const data = await response.json()
        if (!data.ok) {
          let errorMsg = data.error
          if (errorMsg.includes('UNIQUE constraint failed: users.email')) {
            errorMsg = 'Email already exists'
          }
          return { error: errorMsg }
        }
        
        if (newUser.role === 'superadmin' || newUser.status === 'approved') {
          setUser(newUser)
          localStorage.setItem('mcf_user', JSON.stringify(newUser))
        }
        return {}
      }
      
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
    } catch (e: any) {
      return { error: e.message }
    }
  }

  const signOut = () => {
    setUser(null)
    localStorage.removeItem('mcf_user')
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
