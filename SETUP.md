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

## 2. Email reminders (optional) — Resend or SendGrid

Provide **one** email provider:

| Variable | Description |
| --- | --- |
| `RESEND_API_KEY` | Resend API key, OR |
| `SENDGRID_API_KEY` | SendGrid API key |
| `NOTIFICATION_EMAIL_TO` | Comma-separated recipient list |
| `NOTIFICATION_EMAIL_FROM` | Verified sender (default `dashboard@investhoodit.com`) |

## 3. WhatsApp reminders (optional) — Twilio

| Variable | Description |
| --- | --- |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token |
| `TWILIO_WHATSAPP_FROM` | WhatsApp-enabled sender, e.g. `whatsapp:+14155238886` |
| `WHATSAPP_NOTIFICATION_TO` | Recipient, e.g. `whatsapp:+27...` |

## 4. AI assistant (optional)

The Portfolio AI Agent always works using grounded, on-device analysis of your
data. To have a model phrase the answers, set **one** of:

| Variable | Description |
| --- | --- |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway key (recommended), OR |
| `OPENAI_API_KEY` | OpenAI API key |

Badge shows **AI Mode** when configured, otherwise **Local Mode**.

## 5. Scheduled reminders (optional) — Cron

A Vercel Cron job (`vercel.json`) calls `/api/cron/notify` daily at 07:00 UTC,
which triggers the email + WhatsApp digest of overdue / due tasks.

| Variable | Description |
| --- | --- |
| `CRON_SECRET` | Shared secret. When set, the cron endpoint requires `Authorization: Bearer <CRON_SECRET>`. Vercel Cron sends this automatically. |

---

## Manual testing

- `GET /api/notify-due-tasks` — preview the digest + which channels are configured.
- `POST /api/notify-due-tasks` — actually send via configured channels.
- `POST /api/assistant` — `{ "question": "...", "data": { ... } }`.

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
