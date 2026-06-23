import type { Opportunity } from "./types"

// Fields that materially affect whether an opportunity is actionable, with
// weights. A complete, high-quality record scores 100.
const FIELD_WEIGHTS: { key: keyof Opportunity; weight: number }[] = [
  { key: "title", weight: 15 },
  { key: "description", weight: 15 },
  { key: "closing_date", weight: 15 },
  { key: "estimated_value", weight: 10 },
  { key: "eligibility", weight: 10 },
  { key: "source_url", weight: 10 },
  { key: "application_url", weight: 5 },
  { key: "contact_email", weight: 5 },
  { key: "location", weight: 5 },
  { key: "opportunity_type", weight: 5 },
  { key: "organisation_type", weight: 5 },
]

function hasValue(v: unknown): boolean {
  if (v == null) return false
  if (typeof v === "string") {
    const t = v.trim().toLowerCase()
    return t.length > 0 && t !== "other" && t !== "general" && t !== "south africa"
  }
  return true
}

// Compute a 0-100 data-quality score from field completeness.
export function dataQualityScore(opp: Partial<Opportunity>): number {
  let earned = 0
  let total = 0
  for (const f of FIELD_WEIGHTS) {
    total += f.weight
    if (hasValue(opp[f.key])) earned += f.weight
  }
  if (total === 0) return 0
  return Math.round((earned / total) * 100)
}

// Below this, an opportunity is considered incomplete and routed to review.
export const QUALITY_REVIEW_THRESHOLD = 55

export function needsReview(opp: Partial<Opportunity>): boolean {
  return dataQualityScore(opp) < QUALITY_REVIEW_THRESHOLD
}

// Try to infer a few structured fields from free text (title + description).
// Best-effort and conservative: only fills empty fields.
export function inferFields(opp: Opportunity): Opportunity {
  const text = `${opp.title} ${opp.description} ${opp.notes}`
  const next = { ...opp }

  // Closing date: look for an ISO date or common "DD Month YYYY" patterns.
  if (!hasValue(next.closing_date)) {
    const iso = text.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/)
    if (iso) {
      next.closing_date = iso[0]
    } else {
      const dm = text.match(
        /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})\b/i,
      )
      if (dm) {
        const months: Record<string, string> = {
          january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
          july: "07", august: "08", september: "09", october: "10", november: "11", december: "12",
        }
        const mm = months[dm[2].toLowerCase()]
        const dd = dm[1].padStart(2, "0")
        if (mm) next.closing_date = `${dm[3]}-${mm}-${dd}`
      }
    }
  }

  // Estimated value: detect Rand / USD amounts.
  if (!hasValue(next.estimated_value)) {
    const rand = text.match(/\bR\s?\d[\d\s.,]{2,}(?:\s?(?:million|m|bn|billion))?\b/i)
    const usd = text.match(/\b(?:USD|US\$|\$)\s?\d[\d\s.,]{2,}(?:\s?(?:million|m|bn|billion))?\b/i)
    if (rand) next.estimated_value = rand[0].replace(/\s+/g, " ").trim()
    else if (usd) next.estimated_value = usd[0].replace(/\s+/g, " ").trim()
  }

  // Contact email.
  if (!hasValue(next.contact_email)) {
    const email = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/)
    if (email) next.contact_email = email[0]
  }

  return next
}
