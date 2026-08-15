'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const { signIn, signUp } = useAuth()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setPending(true); setError('')
    try {
      const result = mode === 'sign-up'
        ? await signUp(String(formData.get('email')), String(formData.get('password')), String(formData.get('name')), 'viewer')
        : await signIn(String(formData.get('email')), String(formData.get('password')))
        
      if (result.error) setError(result.error)
      else { router.push('/admin'); router.refresh() }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setPending(false)
    }
  }
  
  return <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-sm flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm">
    {mode === 'sign-up' && <input name="name" required placeholder="Your name" className="rounded-lg border bg-background px-3 py-2" />}
    <input name="email" type="email" required placeholder="Email" className="rounded-lg border bg-background px-3 py-2" />
    <input name="password" type="password" required minLength={8} placeholder="Password" className="rounded-lg border bg-background px-3 py-2" />
    {error && <p className="text-sm text-destructive">{error}</p>}
    <Button type="submit" disabled={pending}>{pending ? 'Please wait…' : mode === 'sign-up' ? 'Register for Access' : 'Sign in'}</Button>
    {mode === 'sign-up' && <p className="text-xs text-muted-foreground mt-2 text-center">Registrations require admin approval.</p>}
  </form>
}
