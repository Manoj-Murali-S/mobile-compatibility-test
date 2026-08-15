'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export interface User {
  id: string
  email: string
  name: string
  role: 'superadmin' | 'admin' | 'editor' | 'viewer'
  status: 'pending' | 'approved' | 'rejected'
  created_on: string
  modified_on: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signIn: (email: string, passwordAttempt: string) => Promise<{ error?: string }>
  signUp: (email: string, passwordAttempt: string, name: string, role: string) => Promise<{ error?: string }>
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
      if (!api) throw new Error('Not running in Electron environment')
      
      const res = await api.auth.login(email, passwordAttempt)
      if (!res.ok) return { error: res.error }
      
      setUser(res.user)
      localStorage.setItem('mcf_user', JSON.stringify(res.user))
      return {}
    } catch (e: any) {
      return { error: e.message }
    }
  }

  const signUp = async (email: string, passwordAttempt: string, name: string, role: string) => {
    try {
      const api = (window as any).electronAPI
      if (!api) throw new Error('Not running in Electron environment')
      
      const res = await api.auth.register(email, passwordAttempt, name, role)
      if (!res.ok) return { error: res.error }
      
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
