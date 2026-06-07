"use client"

import { useRef, useState } from "react"
import { useDashboard } from "@/lib/dashboard-context"
import type { DashboardData } from "@/lib/types"

export function DataTools() {
  const { resetData, importData, data, source, user } = useDashboard()
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Only Admins (or demo/guest) manage data tools.
  const canManage = !user || user.role === "Admin"

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `investhood-portfolio-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    setMessage("Exported dashboard data as JSON.")
  }

  function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const imported = JSON.parse(String(reader.result)) as DashboardData
        importData(imported)
        setMessage("Dashboard data imported successfully.")
      } catch {
        setMessage("Could not import the selected JSON file.")
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  return (
    <footer className="panel data-tools">
      <details>
        <summary>
          <span>Admin &amp; Data Tools</span>
          <small>Reset demo mode, export or import the dashboard data as JSON.</small>
        </summary>

        {!canManage ? (
          <p className="panel-note" style={{ marginTop: 14 }}>
            Data tools are available to Admin users only. You are signed in as {user?.role}.
          </p>
        ) : (
          <>
            <div className="data-tools-actions">
              <button
                className="btn secondary"
                type="button"
                onClick={() => {
                  if (source !== "demo") {
                    setMessage("Reset only applies in Demo Mode. Live Supabase data is managed in your database.")
                    return
                  }
                  if (confirm("Reset dashboard to the original demo data?")) {
                    resetData()
                    setMessage("Demo data has been reset to defaults.")
                  }
                }}
              >
                Reset Demo Mode
              </button>
              <button className="btn" type="button" onClick={exportData}>
                Export JSON
              </button>
              <button className="btn ghost dark-text" type="button" onClick={() => fileRef.current?.click()}>
                Import JSON
              </button>
              <input ref={fileRef} type="file" accept="application/json" hidden onChange={onImport} />
            </div>
            {message ? <p className="status-message info">{message}</p> : null}
          </>
        )}
      </details>
    </footer>
  )
}
