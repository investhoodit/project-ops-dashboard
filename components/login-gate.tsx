"use client"

import { useState } from "react"
import { useDashboard } from "@/lib/dashboard-context"
import { useAuth } from "@/lib/auth-context"
import type { UserRole } from "@/lib/types"

const ROLES: { role: UserRole; description: string }[] = [
  { role: "Admin", description: "Full access to all data, settings and edits." },
  { role: "Manager", description: "Edit projects, tasks, KPIs and run notifications." },
  { role: "Team Member", description: "Update tasks and weekly review items." },
  { role: "Viewer", description: "Read-only access to the dashboard." },
]

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.42 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  )
}

export function LoginGate({ onContinue }: { onContinue: () => void }) {
  const { setUser, integrations } = useDashboard()
  const { authConfigured, signInWithGoogle } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<UserRole>("Manager")
  const [busy, setBusy] = useState(false)

  function demoSignIn() {
    setUser({ name: name.trim() || "Team User", email: email.trim(), role })
    onContinue()
  }

  async function googleSignIn() {
    setBusy(true)
    try {
      await signInWithGoogle()
      // The browser is redirected to Google; on return the AuthProvider resolves the session.
    } finally {
      setBusy(false)
    }
  }

  // When Supabase Auth is configured, show the Google sign-in experience.
  if (authConfigured) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <p className="eyebrow" style={{ color: "var(--blue)" }}>
            Investhood IT Portfolio
          </p>
          <h1>Sign in to the dashboard</h1>
          <p>Access is restricted to authorised team members. Sign in with your Google account to continue.</p>

          <button className="btn secondary google-btn" type="button" onClick={googleSignIn} disabled={busy}>
            <GoogleIcon />
            {busy ? "Redirecting to Google..." : "Sign in with Google"}
          </button>

          <p style={{ fontSize: 13 }}>
            Roles (Admin, Manager, Team Member, Viewer) are assigned after sign-in. Contact an administrator if you need
            elevated access.
          </p>
        </div>
      </div>
    )
  }

  // Demo mode: Supabase Auth is not configured, so allow role-based exploration.
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow" style={{ color: "var(--blue)" }}>
          Investhood IT Portfolio
        </p>
        <h1>Sign in to the dashboard</h1>
        <p>
          {integrations.supabase
            ? "Demo sign-in is active. Add Google Auth keys to require real authentication."
            : "Demo mode is active. Pick a role to explore, or continue as a guest. No password required yet."}
        </p>

        <div className="auth-form">
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@investhoodit.com"
            />
          </label>
          <label>Role</label>
          <div className="role-list">
            {ROLES.map((r) => (
              <button
                key={r.role}
                type="button"
                onClick={() => setRole(r.role)}
                style={
                  role === r.role
                    ? { borderColor: "var(--blue)", boxShadow: "0 0 0 2px rgba(23,105,224,.18)" }
                    : undefined
                }
              >
                <strong>{r.role}</strong>
                <small>{r.description}</small>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn" type="button" onClick={demoSignIn}>
            Continue as {role}
          </button>
          <button className="btn secondary" type="button" onClick={onContinue}>
            Continue as guest
          </button>
        </div>
      </div>
    </div>
  )
}
