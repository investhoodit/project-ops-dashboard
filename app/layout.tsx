import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Investhood IT Portfolio | Project & Operations Dashboard",
  description:
    "Track SBUs, projects, tasks, risks, revenue targets, sponsors and weekly execution priorities for the Investhood IT portfolio in one place.",
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: "#071b4d",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-background">{children}</body>
    </html>
  )
}
