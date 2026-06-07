"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { getSupabaseBrowserClient, isAuthConfigured } from "./supabase/client"
import { useDashboard } from "./dashboard-context"
import type { AppUser, UserRole } from "./types"

type AuthStatus = "loading" | "signed-in" | "signed-out" | "demo"

interface AuthContextValue {
  authConfigured: boolean
  status: AuthStatus
  user: AppUser | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Admin allowlist (optional). Comma-separated emails in NEXT_PUBLIC_ADMIN_EMAILS
// are granted the Admin role. Everyone else who signs in defaults to Manager.
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

function deriveRole(email: string, appMetaRole?: string): UserRole {
  const valid: UserRole[] = ["Admin", "Manager", "Team Member", "Viewer"]
  if (appMetaRole && valid.includes(appMetaRole as UserRole)) return appMetaRole as UserRole
  if (ADMIN_EMAILS.includes(email.toLowerCase())) return "Admin"
  // Default signed-in users to Manager so the portfolio owner is not locked out.
  return "Manager"
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setUser } = useDashboard()
  const [status, setStatus] = useState<AuthStatus>(isAuthConfigured ? "loading" : "demo")
  const [user, setLocalUser] = useState<AppUser | null>(null)

  const applyUser = useCallback(
    (next: AppUser | null) => {
      setLocalUser(next)
      setUser(next)
    },
    [setUser],
  )

  useEffect(() => {
    if (!isAuthConfigured) {
      setStatus("demo")
      return
    }
    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setStatus("demo")
      return
    }

    let active = true

    function toAppUser(session: { user: { email?: string; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> } } | null): AppUser | null {
      if (!session?.user?.email) return null
      const meta = session.user.user_metadata || {}
      const appMeta = session.user.app_metadata || {}
      const name = (meta.full_name as string) || (meta.name as string) || session.user.email.split("@")[0]
      return {
        name,
        email: session.user.email,
        role: deriveRole(session.user.email, appMeta.role as string | undefined),
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      const appUser = toAppUser(data.session)
      applyUser(appUser)
      setStatus(appUser ? "signed-in" : "signed-out")
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      const appUser = toAppUser(session)
      applyUser(appUser)
      setStatus(appUser ? "signed-in" : "signed-out")
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }, [])

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient()
    if (supabase) await supabase.auth.signOut()
    applyUser(null)
    setStatus("signed-out")
  }, [applyUser])

  return (
    <AuthContext.Provider value={{ authConfigured: isAuthConfigured, status, user, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
