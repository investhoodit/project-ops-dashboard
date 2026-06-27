# Setup Guide — Project & Operations Dashboard

This app runs out of the box in **Demo Mode** with no configuration. Add the
environment variables below to switch on live data and notifications. Every
feature degrades gracefully: if a key is missing, that feature falls back to a
safe default instead of breaking the app.

## How to add environment variables

In v0: open the **Vars** panel (settings menu, top right) and add each key.
On Vercel: Project → **Settings → Environment Variables**.

You never put secret values in code — only reference `process.env.*`.

---

## 1. Database (optional) — Supabase

| Variable | Description |
| --- | --- |
| `SUPABASE_URL` | Your project URL, e.g. `https://xxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Project anon/public API key |

When both are set, the dashboard reads tables `sbus`, `projects`, `tasks`,
`weekly_review`, `kpis`, and `events` via the Supabase REST API. If the tables
are empty or unreachable, it falls back to the built-in demo data.

The header badge shows **Live Data (Supabase)** when connected, otherwise
**Demo Mode**.

### Create the tables

Run these once in the **Supabase SQL Editor** (paste the file contents, not the path):

1. `scripts/supabase-setup.sql` — core dashboard tables (`sbus`, `projects`,
   `tasks`, `weekly_review`, `kpis`, `events`) + RLS read policies + seed data.
2. `scripts/opportunities-setup.sql` — the Opportunities & Leads tables
   (`opportunities`, `opportunity_search_runs`) + RLS policies + seed data.
   This script is **idempotent** and now also adds the link-validation and
   data-quality columns (`link_status`, `link_checked_at`, `link_http_status`,
   `is_official_source`, `data_quality_score`) — safe to re-run on an existing
   install to upgrade it.
3. `scripts/knowledge-base-setup.sql` — the `knowledge_base` table the AI
   assistant uses to ground organisation-specific answers + RLS policies + seed
   entries. Optional, but recommended for richer assistant responses.

## 2. Sign-in (optional) — Supabase Auth (Google)

When the **public** Supabase vars are set, the dashboard requires Google
sign-in before showing data. Without them, it runs in **Demo Mode** with a
role picker (no real authentication).

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Same value as `SUPABASE_URL` (exposed to the browser) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same value as `SUPABASE_ANON_KEY` (exposed to the browser) |
| `NEXT_PUBLIC_ADMIN_EMAILS` | *(optional)* comma-separated emails granted the **Admin** role. Everyone else who signs in defaults to **Manager**. |

In the Supabase dashboard, enable **Authentication → Providers → Google** and
add the redirect URL `https://<your-domain>/auth/callback` (and the local
`http://localhost:3000/auth/callback` for development).

## 3. Opportunity discovery search (optional)

The Opportunities module can auto-discover tenders, grants and funding calls.
Set **one** provider key to enable the **Run Search Now** button and the daily
search cron. Without a key, the module still works for manual entry, editing,
scoring and tracking.

| Variable | Description |
| --- | --- |
| `TAVILY_API_KEY` | Tavily search API key (recommended), OR |
| `SERPAPI_API_KEY` | SerpAPI key, OR |
| `BING_SEARCH_API_KEY` | Bing Web Search key |
| `SEARCH_API_PROVIDER` | *(optional)* force a provider: `tavily` \| `serpapi` \| `bing` |

Discovered opportunities are de-duplicated by source URL, scored
(relevance / urgency / fit), and high-priority finds trigger the configured
email + WhatsApp channels.

## 4. Email reminders (optional) — Resend or SendGrid

Provide **one** email provider:

| Variable | Description |
| --- | --- |
| `RESEND_API_KEY` | Resend API key, OR |
| `SENDGRID_API_KEY` | SendGrid API key |
| `NOTIFICATION_EMAIL_TO` | Comma-separated recipient list |
| `NOTIFICATION_EMAIL_FROM` | Verified sender (default `dashboard@investhoodit.com`) |

## 5. WhatsApp reminders (optional) — Twilio

| Variable | Description |
| --- | --- |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token |
| `TWILIO_WHATSAPP_FROM` | WhatsApp-enabled sender, e.g. `whatsapp:+14155238886` |
| `WHATSAPP_NOTIFICATION_TO` | Recipient, e.g. `whatsapp:+27...` |

## 6. AI assistant (optional)

The Portfolio AI Agent always works using grounded, on-device analysis of your
data. When a key is configured, each question is **routed** to the best mode and
the answer is tagged in the UI:

- **Dashboard** — questions about your own projects, tasks, KPIs and
  opportunities. Answered from your live dashboard data.
- **General** — strategy / how-to / general-knowledge questions. Answered from
  the model, grounded with any matching `knowledge_base` entries.
- **Web** — questions needing current, external facts (deadlines, current
  programmes, "latest…"). Answered using OpenAI web search, with clickable
  **source citations** shown beneath the reply.

To enable model-backed answers, set **one** of:

| Variable | Description |
| --- | --- |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway key (recommended), OR |
| `OPENAI_API_KEY` | OpenAI API key |

> **Web search note:** the live web-search mode uses the OpenAI Responses API.
> It works with `OPENAI_API_KEY`, or with `AI_GATEWAY_API_KEY` when the gateway
> routes to an OpenAI model. Without web access the assistant automatically
> falls back to General mode and says results should be verified.

Badge shows **AI Mode** when configured, otherwise **Local Mode**.
The same key, when present, is also used to enrich and score discovered
opportunities; otherwise a built-in rule-based scorer is used.

## 7. Scheduled jobs (optional) — Cron

Three Vercel Cron jobs are defined in `vercel.json`:

- `/api/cron/notify` — daily at **07:00 UTC**: email + WhatsApp digest of
  overdue / due tasks.
- `/api/opportunities/search` — daily at **05:00 UTC**: runs opportunity
  discovery (requires a search provider key) and notifies on high-priority finds.
- `/api/opportunities/recheck` — daily at **05:00 UTC**: re-validates every
  opportunity's source/application link. Broken links flip the record to
  **Needs Review** (they are never silently deleted once saved).

| Variable | Description |
| --- | --- |
| `CRON_SECRET` | Shared secret. When set, the cron endpoints require `Authorization: Bearer <CRON_SECRET>`. Vercel Cron sends this automatically. |

---

## Brand logos in the header

The header brand strip looks for these files in `public/logos/`:

- `charisma-smartrise.png` — Charisma Smart-Rise Crèche
- `investhood-skills-hub.png` — Investhood Skills Hub
- `investhood-it.png` — Investhood IT

Drop your logo images at those paths (transparent PNG/SVG, roughly 26px tall
works best). If a file is missing, the strip automatically falls back to a
clean text wordmark, so the header always looks intentional.

---

## Link validation & data quality

Every opportunity carries a **link status** and a **data-quality score**:

- **Link status** — `verified` (reachable), `needs_review` (reachable but
  access-restricted, e.g. login walls), `broken` (unreachable), or `unchecked`.
  Auto-discovered results with broken links are **rejected before saving**;
  links are also re-validated on manual save and by the daily re-check cron.
  Official government / SETA / foundation domains are flagged with a ★.
- **Data quality (0–100)** — completeness of key fields (deadline, value,
  contact, eligibility, application URL). Records below the threshold are
  routed to **Needs Review** automatically.

In the table you can **Re-check link** on demand or **Report broken** (a human
override that is never auto-reverted). Use the **link-status filter** to show
only verified, needs-review, broken, or official-source opportunities.

## Manual testing

- `GET /api/notify-due-tasks` — preview the digest + which channels are configured.
- `POST /api/notify-due-tasks` — actually send via configured channels.
- `POST /api/assistant` — `{ "question": "...", "data": { ... } }`. Response
  includes `mode` (`dashboard` \| `general` \| `web` \| `local`) and `sources`.
- `GET /api/opportunities` — list opportunities + data source + search status.
- `POST /api/opportunities` — upsert one opportunity (body: the opportunity object).
- `POST /api/opportunities/search` — run discovery now (requires a search provider key).
- `POST /api/opportunities/recheck` — re-validate links now. Body `{ "id": "..." }`
  to check one, or empty to re-check all.

## Database schema (if using Supabase)

```sql
create table sbus (id text primary key, name text, goal text, projects jsonb);
create table projects (
  id text primary key, name text, sbu text, status text, priority text,
  owner text, progress int, "revenueTarget" text, "currentRevenue" text,
  "targetDate" text, "nextAction" text, risk text
);
create table tasks (
  id text primary key, title text, "projectId" text, owner text,
  "dueDate" text, status text, priority text, progress int, notes text
);
create table weekly_review (label text, done boolean);
create table kpis (label text, value text);
create table events (id text primary key, title text, date text, type text, notes text);
```

For the full, ready-to-run versions (with RLS policies and seed data), use the
scripts in `scripts/` rather than copying the snippet above:

- `scripts/supabase-setup.sql` — core dashboard tables
- `scripts/opportunities-setup.sql` — `opportunities` + `opportunity_search_runs`
