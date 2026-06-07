import "server-only"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Server-side auth configuration check. Falls back to the public vars so it
// works whether the values were set with or without the NEXT_PUBLIC_ prefix.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

export const isServerAuthConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

// Creates a request-scoped Supabase server client wired to Next.js cookies so
// auth sessions persist. Returns null when auth is not configured.
export async function getSupabaseServerClient() {
  if (!isServerAuthConfigured) return null
  const cookieStore = await cookies()
  return createServerClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Called from a Server Component without write access — safe to ignore
          // because middleware/route handlers refresh the session cookies.
        }
      },
    },
  })
}
