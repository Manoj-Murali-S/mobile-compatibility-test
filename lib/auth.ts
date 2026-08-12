import { betterAuth } from 'better-auth'
import { Pool } from 'pg'

const baseURL = process.env.BETTER_AUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  baseURL,
  trustedOrigins: [baseURL, process.env.V0_RUNTIME_URL, process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL].filter(Boolean) as string[],
  emailAndPassword: { enabled: true },
  advanced: { defaultCookieAttributes: { sameSite: 'none', secure: true } },
})
