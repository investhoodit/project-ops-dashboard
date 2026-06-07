# Project & Operations Dashboard

A Portfolio Command Centre for Investhood IT — tracking Strategic Business Units
(SBUs), projects, tasks, KPIs, risks, revenue targets and weekly execution
priorities in one place.

Built with **Next.js (App Router)** and designed to deploy to **Vercel** with
zero required configuration. It runs fully in **Demo Mode** out of the box, and
progressively enables live data, notifications and AI as you add credentials.

## Features

- 4 Strategic Business Units with goals and linked projects
- Project status board (On Track / In Progress / At Risk / Delayed / Completed)
- Task tracker with owners, due dates, priority and progress
- KPI cards, risk register and revenue tracking
- Interactive calendar with events
- Drill-down detail dialogs across every section
- Charts (status mix, progress by SBU)
- Portfolio AI Agent (grounded local analysis, optional model phrasing)
- Email + WhatsApp task reminders with a daily cron job
- Role-based sign-in (Admin / Manager / Team Member / Viewer) with guest demo mode
- Dark mode, JSON export/import
- Supabase-ready data layer that falls back to demo data automatically

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy

This repo is connected to Vercel. Pushing to the connected branch deploys
automatically. No environment variables are required to deploy — everything
degrades gracefully.

## Configuration

All integrations are **optional**. See **[SETUP.md](./SETUP.md)** for the full
list of environment variables (Supabase, Resend/SendGrid, Twilio WhatsApp,
OpenAI/AI Gateway, Cron) and how each feature behaves when a key is missing.

## API routes

- `GET|POST /api/notify-due-tasks` — preview or send the due-task digest
- `GET /api/cron/notify` — cron-triggered digest (protected by `CRON_SECRET`)
- `POST /api/assistant` — portfolio AI assistant
