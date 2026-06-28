"use client"

import { useState } from "react"
import { DrillDownProvider } from "./drill-down"
import { HeroHeader } from "./hero-header"
import { SetupBanner } from "./setup-banner"
import { ChartsSection } from "./charts-section"
import { SummaryCards } from "./summary-cards"
import { NotificationsPanel } from "./notifications-panel"
import { CalendarSection } from "./calendar-section"
import { SbuSection } from "./sbu-section"
import { ProjectsAndReview } from "./projects-review"
import { TaskTracker } from "./task-tracker"
import { KpiAndRisks } from "./kpi-risks"
import { OpportunitiesSection } from "./opportunities/opportunities-section"
import { DataTools } from "./data-tools"
import { LoginGate } from "./login-gate"
import { DailyBriefingCard } from "./voice/daily-briefing-card"
import { VoiceAssistantButton } from "./voice/voice-assistant-button"
import { AuthProvider, useAuth } from "@/lib/auth-context"

function DashboardBody() {
  const { authConfigured, status } = useAuth()
  // Demo mode: allow viewing without login, but offer a login screen first.
  const [entered, setEntered] = useState(false)

  // When Supabase Auth is configured, enforce real authentication.
  if (authConfigured) {
    if (status === "loading") {
      return (
        <div className="auth-shell">
          <div className="auth-card">
            <h1>Loading...</h1>
            <p>Checking your session.</p>
          </div>
        </div>
      )
    }
    if (status !== "signed-in") {
      return <LoginGate onContinue={() => setEntered(true)} />
    }
  } else if (!entered) {
    // Demo mode gate.
    return <LoginGate onContinue={() => setEntered(true)} />
  }

  return (
    <DrillDownProvider>
      <div className="app-shell">
        <HeroHeader />
        <main>
          <SetupBanner />
          <DailyBriefingCard />
          <ChartsSection />
          <SummaryCards />
          <NotificationsPanel />
          <OpportunitiesSection />
          <CalendarSection />
          <SbuSection />
          <ProjectsAndReview />
          <TaskTracker />
          <KpiAndRisks />
          <DataTools />
        </main>
        <VoiceAssistantButton />
      </div>
    </DrillDownProvider>
  )
}

export function DashboardShell() {
  return (
    <AuthProvider>
      <DashboardBody />
    </AuthProvider>
  )
}
