"use client"

import { createBrowserClient } from "@supabase/ssr"

// Whether browser-side Supabase Auth is configured. Uses the PUBLIC vars so it
// is safe to evaluate in the browser. When false, the app runs in demo mode.
export const isAuthConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
)

// Singleton browser client. Returns null when auth is not configured so callers
// can gracefully fall back to demo mode instead of throwing.
let browserClient: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseBrowserClient() {
  if (!isAuthConfigured) return null
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    )
  }
  return browserClient
}
