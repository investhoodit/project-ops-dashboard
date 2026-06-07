"use client"

import { useState } from "react"
import { useDashboard } from "@/lib/dashboard-context"
import type { UserRole } from "@/lib/types"

const ROLES: { role: UserRole; description: string }[] = [
  { role: "Admin", description: "Full access to all data, settings and edits." },
  { role: "Manager", description: "Edit projects, tasks, KPIs and run notifications." },
  { role: "Team Member", description: "Update tasks and weekly review items." },
  { role: "Viewer", description: "Read-only access to the dashboard." },
]

export function LoginGate({ onContinue }: { onContinue: () => void }) {
  const { setUser, integrations } = useDashboard()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<UserRole>("Manager")

  function signIn() {
    setUser({ name: name.trim() || "Team User", email: email.trim(), role })
    onContinue()
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow" style={{ color: "var(--blue)" }}>
          Investhood IT Portfolio
        </p>
        <h1>Sign in to the dashboard</h1>
        <p>
          {integrations.supabase
            ? "Choose your role to continue. Full authentication uses Supabase when configured."
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
                style={role === r.role ? { borderColor: "var(--blue)", boxShadow: "0 0 0 2px rgba(23,105,224,.18)" } : undefined}
              >
                <strong>{r.role}</strong>
                <small>{r.description}</small>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn" type="button" onClick={signIn}>
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
