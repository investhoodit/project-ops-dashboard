# Project Ops Dashboard

A lightweight web-based Portfolio Command Centre for tracking Investhood IT, SmartRise EdTech, Investhood Skills Hub, Dhlamini Farm, SOS Coding Camps and related project operations.

## What this MVP includes

- 4 Strategic Business Units (SBUs)
- Project status dashboard
- Task tracker with priority, owners, deadlines and progress
- KPI cards for day-to-day management
- Risk and revenue tracking
- Local browser persistence using `localStorage`
- Export and import of dashboard data as JSON
- GitHub Pages-ready static web app

## Important note

This first version is a static dashboard. It can be hosted on GitHub Pages and shared by link. Edits are saved in each user's browser only. For real-time shared updates across the whole team, the next phase should connect this frontend to Supabase or Firebase.

## Suggested live URL after GitHub Pages is enabled

`https://investhoodit.github.io/project-ops-dashboard/`

## How to enable GitHub Pages

1. Open the repository on GitHub.
2. Go to **Settings**.
3. Go to **Pages**.
4. Under **Build and deployment**, select **GitHub Actions** as the source.
5. Push any change to `main`, or manually run the workflow from the **Actions** tab.

## Phase 2 recommendation

Add Supabase authentication and database tables for shared team updates:

- users
- projects
- tasks
- comments
- risks
- sponsors
- revenue_updates
- weekly_reviews

