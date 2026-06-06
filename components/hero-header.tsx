"use client"

import { useRef } from "react"
import { useDashboard } from "@/lib/dashboard-context"
import { AiAgent } from "./ai-agent"
import type { DashboardData } from "@/lib/types"

export function HeroHeader() {
  const { theme, toggleTheme, resetData, importData, data, user, setUser, source } = useDashboard()
  const fileRef = useRef<HTMLInputElement>(null)

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `project-ops-dashboard-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const imported = JSON.parse(String(reader.result)) as DashboardData
        importData(imported)
        alert("Dashboard data imported successfully.")
      } catch {
        alert("Could not import the selected JSON file.")
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  return (
    <header className="hero">
      <div className="hero-main">
        <p className="eyebrow">Investhood IT Portfolio</p>
        <h1 className="text-balance">Project & Operations Dashboard</h1>
        <p className="hero-copy text-pretty">
          Track SBUs, projects, tasks, risks, revenue targets, sponsors and weekly execution priorities in one place.
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
          <span className="mode-pill">{source === "supabase" ? "Live Data (Supabase)" : "Demo Mode"}</span>
          {user ? (
            <span className="user-chip">
              {user.name} &middot; {user.role}
              <button
                className="btn ghost"
                type="button"
                onClick={() => setUser(null)}
                style={{ padding: "4px 10px", fontSize: 12 }}
              >
                Sign out
              </button>
            </span>
          ) : (
            <span className="user-chip">Browsing as guest (demo)</span>
          )}
        </div>
      </div>
      <div className="hero-side">
        <div className="hero-actions">
          <button className="btn ghost" type="button" onClick={toggleTheme}>
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
          <button
            className="btn secondary"
            type="button"
            onClick={() => {
              if (confirm("Reset dashboard to the original demo data?")) resetData()
            }}
          >
            Reset Demo Data
          </button>
          <button className="btn" type="button" onClick={exportData}>
            Export JSON
          </button>
          <button className="btn ghost" type="button" onClick={() => fileRef.current?.click()}>
            Import JSON
          </button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={onImport} />
        </div>
        <AiAgent />
      </div>
    </header>
  )
}
