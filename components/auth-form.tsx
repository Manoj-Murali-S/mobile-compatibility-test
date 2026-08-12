'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  async function submit(formData: FormData) {
    setPending(true); setError('')
    const result = mode === 'sign-up'
      ? await authClient.signUp.email({ email: String(formData.get('email')), password: String(formData.get('password')), name: String(formData.get('name')) })
      : await authClient.signIn.email({ email: String(formData.get('email')), password: String(formData.get('password')) })
    if (result.error) setError(result.error.message || 'Unable to continue')
    else { router.push('/'); router.refresh() }
    setPending(false)
  }
  return <form action={submit} className="mx-auto flex w-full max-w-sm flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm">
    {mode === 'sign-up' && <input name="name" required placeholder="Shop owner name" className="rounded-lg border bg-background px-3 py-2" />}
    <input name="email" type="email" required placeholder="Email" className="rounded-lg border bg-background px-3 py-2" />
    <input name="password" type="password" required minLength={8} placeholder="Password" className="rounded-lg border bg-background px-3 py-2" />
    {error && <p className="text-sm text-destructive">{error}</p>}
    <Button disabled={pending}>{pending ? 'Please wait…' : mode === 'sign-up' ? 'Create account' : 'Sign in'}</Button>
  </form>
}
