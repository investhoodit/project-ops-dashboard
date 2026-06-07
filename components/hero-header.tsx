"use client"

import { useDashboard } from "@/lib/dashboard-context"
import { useAuth } from "@/lib/auth-context"
import { AiAgent } from "./ai-agent"
import { BrandStrip } from "./brand-strip"

export function HeroHeader() {
  const { theme, toggleTheme, user, setUser, source } = useDashboard()
  const { authConfigured, signOut } = useAuth()

  async function handleSignOut() {
    if (authConfigured) {
      await signOut()
    } else {
      setUser(null)
    }
  }

  return (
    <header className="hero compact">
      <div className="hero-main">
        <BrandStrip />
        <h1 className="text-balance">Investhood IT Portfolio</h1>
        <div className="hero-meta">
          <span className="mode-pill">{source === "supabase" ? "Live Data (Supabase)" : "Demo Mode"}</span>
          {user ? (
            <span className="user-chip">
              <span className="user-chip-name">
                {user.name}
                {user.email ? <small> · {user.email}</small> : null}
              </span>
              <span className="role-badge">{user.role}</span>
              <button
                className="btn ghost"
                type="button"
                onClick={handleSignOut}
                style={{ padding: "4px 10px", fontSize: 12 }}
              >
                Sign out
              </button>
            </span>
          ) : (
            <span className="user-chip">Browsing as guest (demo)</span>
          )}
          <button className="btn ghost" type="button" onClick={toggleTheme} style={{ padding: "6px 12px", fontSize: 12 }}>
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </div>
      <div className="hero-side">
        <AiAgent />
      </div>
    </header>
  )
}
