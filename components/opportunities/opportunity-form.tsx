"use client"

import { useState } from "react"
import {
  SBU_OPTIONS,
  OPPORTUNITY_TYPES,
  ORGANISATION_TYPES,
  OPPORTUNITY_STATUSES,
} from "@/lib/opportunity-sources"
import type { Opportunity, OpportunityType, OrganisationType, OpportunityStatus, Priority } from "@/lib/types"

interface Props {
  opportunity: Opportunity | null
  onClose: () => void
  onSaved: () => void
}

const PRIORITIES: Priority[] = ["High", "Medium", "Low"]

export function OpportunityForm({ opportunity, onClose, onSaved }: Props) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    const payload: Partial<Opportunity> = {
      id: opportunity?.id,
      title: String(fd.get("title") || "").trim(),
      description: String(fd.get("description") || ""),
      source_name: String(fd.get("source_name") || "Manual entry"),
      source_url: String(fd.get("source_url") || ""),
      opportunity_type: fd.get("opportunity_type") as OpportunityType,
      sbu_id: String(fd.get("sbu_id") || "general"),
      organisation_type: fd.get("organisation_type") as OrganisationType,
      estimated_value: String(fd.get("estimated_value") || ""),
      location: String(fd.get("location") || ""),
      closing_date: String(fd.get("closing_date") || ""),
      eligibility: String(fd.get("eligibility") || ""),
      contact_email: String(fd.get("contact_email") || ""),
      contact_phone: String(fd.get("contact_phone") || ""),
      application_url: String(fd.get("application_url") || ""),
      status: fd.get("status") as OpportunityStatus,
      priority: fd.get("priority") as Priority,
      assigned_to: String(fd.get("assigned_to") || ""),
      notes: String(fd.get("notes") || ""),
      created_at: opportunity?.created_at,
    }
    if (!payload.title) {
      setError("Title is required.")
      setSaving(false)
      return
    }
    try {
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("save failed")
      onSaved()
    } catch {
      setError("Could not save. Please try again.")
      setSaving(false)
    }
  }

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,.55)", display: "grid", placeItems: "center", zIndex: 60, padding: 16 }}
    >
      <form
        className="dialog-form"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        style={{ background: "var(--card)", borderRadius: 22, width: "min(760px, 94vw)", maxHeight: "90vh", overflow: "auto" }}
      >
        <h2>{opportunity ? "Edit Opportunity" : "Add Opportunity"}</h2>

        <label>
          Title
          <input name="title" required defaultValue={opportunity?.title ?? ""} placeholder="e.g. SETA discretionary grant window" />
        </label>
        <label>
          Description
          <textarea name="description" rows={3} defaultValue={opportunity?.description ?? ""} />
        </label>

        <div className="form-row">
          <label>
            Type
            <select name="opportunity_type" defaultValue={opportunity?.opportunity_type ?? "Other"}>
              {OPPORTUNITY_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            Business unit
            <select name="sbu_id" defaultValue={opportunity?.sbu_id ?? "general"}>
              {SBU_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-row">
          <label>
            Organisation type
            <select name="organisation_type" defaultValue={opportunity?.organisation_type ?? "General"}>
              {ORGANISATION_TYPES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>
          <label>
            Closing date
            <input name="closing_date" type="date" defaultValue={opportunity?.closing_date ?? ""} />
          </label>
        </div>

        <div className="form-row">
          <label>
            Estimated value
            <input name="estimated_value" defaultValue={opportunity?.estimated_value ?? ""} placeholder="e.g. R250,000" />
          </label>
          <label>
            Location
            <input name="location" defaultValue={opportunity?.location ?? ""} placeholder="e.g. Gauteng / National" />
          </label>
        </div>

        <label>
          Eligibility / requirements
          <textarea name="eligibility" rows={2} defaultValue={opportunity?.eligibility ?? ""} />
        </label>

        <div className="form-row">
          <label>
            Source name
            <input name="source_name" defaultValue={opportunity?.source_name ?? ""} placeholder="e.g. eTenders / NLC" />
          </label>
          <label>
            Source URL
            <input name="source_url" type="url" defaultValue={opportunity?.source_url ?? ""} />
          </label>
        </div>

        <label>
          Application URL
          <input name="application_url" type="url" defaultValue={opportunity?.application_url ?? ""} />
        </label>

        <div className="form-row">
          <label>
            Contact email
            <input name="contact_email" type="email" defaultValue={opportunity?.contact_email ?? ""} />
          </label>
          <label>
            Contact phone
            <input name="contact_phone" defaultValue={opportunity?.contact_phone ?? ""} />
          </label>
        </div>

        <div className="form-row">
          <label>
            Status
            <select name="status" defaultValue={opportunity?.status ?? "New"}>
              {OPPORTUNITY_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Priority
            <select name="priority" defaultValue={opportunity?.priority ?? "Medium"}>
              {PRIORITIES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-row">
          <label>
            Assigned to
            <input name="assigned_to" defaultValue={opportunity?.assigned_to ?? ""} />
          </label>
        </div>

        <label>
          Notes
          <textarea name="notes" rows={2} defaultValue={opportunity?.notes ?? ""} />
        </label>

        {error && (
          <p role="alert" style={{ color: "var(--danger, #dc2626)", margin: 0 }}>
            {error}
          </p>
        )}

        <div className="dialog-actions">
          <button type="button" className="btn secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn" disabled={saving}>
            {saving ? "Saving…" : "Save Opportunity"}
          </button>
        </div>
      </form>
    </div>
  )
}
