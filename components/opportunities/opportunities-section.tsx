"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { useDashboard } from "@/lib/dashboard-context"
import { OpportunityForm } from "./opportunity-form"
import { OpportunityTable } from "./opportunity-table"
import type { Opportunity, OpportunityStatus } from "@/lib/types"

interface ApiResponse {
  opportunities: Opportunity[]
  source: "supabase" | "demo"
  integrations: { search: boolean }
}

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<ApiResponse>)

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null
  const d = new Date(dateStr).getTime()
  if (Number.isNaN(d)) return null
  return Math.ceil((d - Date.now()) / 86400000)
}

// Rank by a blend of relevance, urgency and fit so high-value, time-sensitive
// opportunities surface first.
function compositeScore(o: Opportunity): number {
  const s = o.scores
  if (!s) return 0
  return s.relevance * 0.5 + s.urgency * 0.3 + s.fit * 0.2
}

export function OpportunitiesSection() {
  const { canEdit } = useDashboard()
  const { data, isLoading, mutate } = useSWR<ApiResponse>("/api/opportunities", fetcher, {
    revalidateOnFocus: false,
  })

  const [statusFilter, setStatusFilter] = useState<OpportunityStatus | "All">("All")
  const [sbuFilter, setSbuFilter] = useState<string>("All")
  const [query, setQuery] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Opportunity | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchMsg, setSearchMsg] = useState<string | null>(null)

  const opportunities = data?.opportunities ?? []
  const searchConfigured = data?.integrations?.search ?? false

  const filtered = useMemo(() => {
    return opportunities
      .filter((o) => (statusFilter === "All" ? true : o.status === statusFilter))
      .filter((o) => (sbuFilter === "All" ? true : o.sbu_id === sbuFilter))
      .filter((o) => {
        if (!query.trim()) return true
        const q = query.toLowerCase()
        return (
          o.title.toLowerCase().includes(q) ||
          o.description.toLowerCase().includes(q) ||
          o.source_name.toLowerCase().includes(q) ||
          o.opportunity_type.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => compositeScore(b) - compositeScore(a))
  }, [opportunities, statusFilter, sbuFilter, query])

  const stats = useMemo(() => {
    const open = opportunities.filter((o) => !["Won", "Lost", "Archived", "Not Relevant"].includes(o.status))
    const high = opportunities.filter((o) => o.priority === "High").length
    const closingSoon = opportunities.filter((o) => {
      const d = daysUntil(o.closing_date)
      return d != null && d >= 0 && d <= 7
    }).length
    const applied = opportunities.filter((o) => o.status === "Applied").length
    return { total: opportunities.length, open: open.length, high, closingSoon, applied }
  }, [opportunities])

  function openNew() {
    setEditing(null)
    setFormOpen(true)
  }
  function openEdit(opp: Opportunity) {
    setEditing(opp)
    setFormOpen(true)
  }

  async function runSearch() {
    setSearching(true)
    setSearchMsg(null)
    try {
      const res = await fetch("/api/opportunities/search", { method: "POST" })
      const json = await res.json()
      if (!json.configured) {
        setSearchMsg(json.message || "Search is not configured.")
      } else {
        setSearchMsg(`Found ${json.found} opportunities, added ${json.inserted} new.`)
        await mutate()
      }
    } catch {
      setSearchMsg("Search failed. Please try again.")
    } finally {
      setSearching(false)
    }
  }

  return (
    <section className="panel" aria-label="Opportunities and leads">
      <div className="panel-header">
        <div>
          <p className="eyebrow" style={{ color: "var(--muted)" }}>
            Growth Pipeline
          </p>
          <h2>Opportunities &amp; Leads</h2>
        </div>
        <div className="opp-header-actions">
          <button
            className="btn secondary"
            type="button"
            onClick={runSearch}
            disabled={searching || !canEdit}
            title={searchConfigured ? "Run an automated web search now" : "Add a search provider API key to enable"}
          >
            {searching ? "Searching…" : "Run Search Now"}
          </button>
          <button className="btn" type="button" onClick={openNew} disabled={!canEdit}>
            Add Opportunity
          </button>
        </div>
      </div>

      {searchMsg && (
        <p className="opp-search-msg" role="status">
          {searchMsg}
        </p>
      )}
      {!searchConfigured && (
        <p className="opp-hint">
          Automated discovery is in manual mode. Add a search provider key (TAVILY_API_KEY, SERPAPI_API_KEY or
          BING_SEARCH_API_KEY) to let the dashboard find tenders, grants and funding calls for you. You can still
          capture opportunities manually below.
        </p>
      )}

      <div className="opp-stats">
        <article className="opp-stat">
          <small>Total Tracked</small>
          <strong>{stats.total}</strong>
        </article>
        <article className="opp-stat">
          <small>Open / Active</small>
          <strong>{stats.open}</strong>
        </article>
        <article className="opp-stat accent-high">
          <small>High Priority</small>
          <strong>{stats.high}</strong>
        </article>
        <article className="opp-stat accent-warn">
          <small>Closing ≤ 7 days</small>
          <strong>{stats.closingSoon}</strong>
        </article>
        <article className="opp-stat accent-ok">
          <small>Applied</small>
          <strong>{stats.applied}</strong>
        </article>
      </div>

      <div className="opp-filters">
        <input
          type="search"
          placeholder="Search title, source, type…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search opportunities"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as OpportunityStatus | "All")} aria-label="Filter by status">
          <option value="All">All statuses</option>
          {["New", "Reviewing", "Applied", "Not Relevant", "Won", "Lost", "Archived"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select value={sbuFilter} onChange={(e) => setSbuFilter(e.target.value)} aria-label="Filter by business unit">
          <option value="All">All business units</option>
          <option value="education">Education &amp; Child Development</option>
          <option value="technology">Technology &amp; Software</option>
          <option value="npo">Youth Skills &amp; NPO</option>
          <option value="agro">Agro-Tech, Camps &amp; Community</option>
          <option value="general">General / Cross-cutting</option>
        </select>
      </div>

      {isLoading ? (
        <p className="opp-empty">Loading opportunities…</p>
      ) : filtered.length === 0 ? (
        <p className="opp-empty">No opportunities match your filters yet.</p>
      ) : (
        <OpportunityTable opportunities={filtered} onEdit={openEdit} onChanged={() => mutate()} canEdit={canEdit} />
      )}

      {formOpen && (
        <OpportunityForm
          opportunity={editing}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false)
            mutate()
          }}
        />
      )}
    </section>
  )
}
