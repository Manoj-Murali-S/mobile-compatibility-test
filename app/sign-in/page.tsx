import Image from 'next/image'
import { AuthForm } from '@/components/auth-form'

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <Image
            src="/logo.png"
            alt="Shop logo"
            width={80}
            height={80}
            priority
            className="mb-4 rounded-xl object-contain"
          />

          <h1 className="text-center text-2xl font-semibold tracking-tight">
            Sign in to your shop
          </h1>

          <p className="mt-2 text-center text-sm text-muted-foreground">
            Enter your details below to access your account
          </p>
        </div>

        <AuthForm mode="sign-in" />
      </div>
    </main>
  )
}
