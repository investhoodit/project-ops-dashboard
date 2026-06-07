import { getDashboardData } from "@/lib/data"
import { getPublicIntegrationStatus } from "@/lib/integration-status"
import { DashboardProvider } from "@/lib/dashboard-context"
import { DashboardShell } from "@/components/dashboard-shell"

export const dynamic = "force-dynamic"

export default async function Page() {
  const { data, source } = await getDashboardData()
  const integrations = getPublicIntegrationStatus()

  return (
    <DashboardProvider initialData={data} source={source} integrations={integrations}>
      <DashboardShell />
    </DashboardProvider>
  )
}
