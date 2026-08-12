import { AuthForm } from '@/components/auth-form'

export default function SignInPage() {
  return <main className="flex min-h-screen items-center justify-center p-6"><div className="w-full"><h1 className="mb-6 text-center text-2xl font-semibold">Sign in to your shop</h1><AuthForm mode="sign-in" /></div></main>
}
