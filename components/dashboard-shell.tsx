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
import { LoginGate } from "./login-gate"

export function DashboardShell() {
  // Demo mode: allow viewing without login, but offer a login screen first.
  const [entered, setEntered] = useState(false)

  if (!entered) {
    return <LoginGate onContinue={() => setEntered(true)} />
  }

  return (
    <DrillDownProvider>
      <div className="app-shell">
        <HeroHeader />
        <main>
          <SetupBanner />
          <ChartsSection />
          <SummaryCards />
          <NotificationsPanel />
          <CalendarSection />
          <SbuSection />
          <ProjectsAndReview />
          <TaskTracker />
          <KpiAndRisks />
        </main>
      </div>
    </DrillDownProvider>
  )
}
