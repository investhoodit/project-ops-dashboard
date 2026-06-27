import "server-only"

// Normalize SUPABASE_URL (may include trailing slash and/or /rest/v1 suffix).
function restBase(rawUrl: string): string {
  return rawUrl
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1$/i, "")
}

function creds() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return { base: restBase(url), key }
}

export interface KnowledgeEntry {
  id: string
  title: string
  category: string
  content: string
  tags: string
  source_url: string
  created_at: string
  updated_at: string
}

interface KbRow {
  id: string
  title: string | null
  category: string | null
  content: string | null
  tags: string | null
  source_url: string | null
  created_at: string | null
  updated_at: string | null
}

function rowToEntry(r: KbRow): KnowledgeEntry {
  return {
    id: r.id,
    title: r.title ?? "",
    category: r.category ?? "General",
    content: r.content ?? "",
    tags: r.tags ?? "",
    source_url: r.source_url ?? "",
    created_at: r.created_at ?? new Date().toISOString(),
    updated_at: r.updated_at ?? new Date().toISOString(),
  }
}

export interface KnowledgeResult {
  entries: KnowledgeEntry[]
  source: "supabase" | "unavailable"
}

// Read all knowledge-base entries. Returns an empty set (not an error) when the
// table is missing or Supabase is not configured, so callers can degrade safely.
export async function getKnowledgeBase(): Promise<KnowledgeResult> {
  const c = creds()
  if (!c) return { entries: [], source: "unavailable" }
  try {
    const res = await fetch(`${c.base}/rest/v1/knowledge_base?select=*&order=updated_at.desc`, {
      headers: { apikey: c.key, Authorization: `Bearer ${c.key}` },
      cache: "no-store",
    })
    if (!res.ok) return { entries: [], source: "unavailable" }
    const rows = (await res.json()) as KbRow[]
    if (!Array.isArray(rows)) return { entries: [], source: "unavailable" }
    return { entries: rows.map(rowToEntry), source: "supabase" }
  } catch {
    return { entries: [], source: "unavailable" }
  }
}

// Lightweight keyword relevance search over the knowledge base. This is the
// retrieval step for grounding the assistant. When a vector store is added
// later, swap this implementation for an embedding similarity query — the
// signature (query in, ranked entries out) is designed to stay the same.
export async function searchKnowledgeBase(query: string, limit = 4): Promise<KnowledgeEntry[]> {
  const { entries } = await getKnowledgeBase()
  if (entries.length === 0) return []

  const terms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2)
  if (terms.length === 0) return []

  const scored = entries.map((e) => {
    const haystack = `${e.title} ${e.content} ${e.tags} ${e.category}`.toLowerCase()
    let score = 0
    for (const t of terms) {
      if (haystack.includes(t)) score += 1
      // Title hits are worth more.
      if (e.title.toLowerCase().includes(t)) score += 1
    }
    return { entry: e, score }
  })

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.entry)
}

// Upsert a knowledge-base entry. Returns true on success, false in demo mode.
export async function upsertKnowledgeEntry(entry: Partial<KnowledgeEntry> & { id: string }): Promise<boolean> {
  const c = creds()
  if (!c) return false
  try {
    const res = await fetch(`${c.base}/rest/v1/knowledge_base?on_conflict=id`, {
      method: "POST",
      headers: {
        apikey: c.key,
        Authorization: `Bearer ${c.key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        id: entry.id,
        title: entry.title ?? "",
        category: entry.category ?? "General",
        content: entry.content ?? "",
        tags: entry.tags ?? "",
        source_url: entry.source_url ?? "",
        updated_at: new Date().toISOString(),
      }),
      cache: "no-store",
    })
    return res.ok
  } catch {
    return false
  }
}
