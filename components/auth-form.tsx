'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff } from 'lucide-react'

export function AuthForm({
  mode,
}: {
  mode: 'sign-in' | 'sign-up'
}) {
  const router = useRouter()
  const { signIn, signUp } = useAuth()

  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)

    const email = String(formData.get('email') || '')
    const password = String(formData.get('password') || '')

    setPending(true)
    setError('')

    try {
      const result =
        mode === 'sign-up'
          ? await signUp(email, password, 'viewer')
          : await signIn(email, password)

      if (result.error) {
        setError(result.error)
        toast.error(result.error)
        return
      }

      toast.success(mode === 'sign-up' ? 'Successfully registered' : 'Successfully signed in')
      router.push('/admin')
      router.refresh()
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred')
      toast.error(err?.message || 'An unexpected error occurred')
    } finally {
      setPending(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full flex-col gap-5 rounded-2xl border bg-card p-6 shadow-sm"
    >

      <div className="space-y-2">
        <label
          htmlFor="email"
          className="text-sm font-medium"
        >
          Email
        </label>

        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="h-11 w-full rounded border bg-background px-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="text-sm font-medium"
        >
          Password
        </label>

        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            minLength={8}
            autoComplete={
              mode === 'sign-up' ? 'new-password' : 'current-password'
            }
            placeholder="Enter your password"
            className="h-11 w-full rounded border bg-background px-3 pr-10 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="h-11 w-full"
      >
        {pending
          ? 'Please wait…'
          : mode === 'sign-up'
            ? 'Register for Access'
            : 'Sign in'}
      </Button>

      {mode === 'sign-up' && (
        <p className="text-center text-xs text-muted-foreground">
          Registrations require admin approval.
        </p>
      )}
    </form>
  )
}
