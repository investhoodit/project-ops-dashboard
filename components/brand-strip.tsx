"use client"

import { useState } from "react"

interface Brand {
  name: string
  short: string
  logo: string
}

// When you attach the logo files, save them to /public/logos/ with these names
// and they will appear automatically. Until then, a clean text chip is shown.
const BRANDS: Brand[] = [
  { name: "Charisma Smart-Rise Crèche", short: "Charisma Smart-Rise Crèche", logo: "/logos/charisma-smartrise.png" },
  { name: "Investhood Skills Hub", short: "Investhood Skills Hub", logo: "/logos/investhood-skills-hub.png" },
  { name: "Investhood IT", short: "Investhood IT", logo: "/logos/investhood-it.png" },
]

function BrandLogo({ brand }: { brand: Brand }) {
  const [failed, setFailed] = useState(false)

  return (
    <div className="brand-chip" title={brand.name}>
      {failed ? (
        <span className="brand-text">{brand.short}</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={brand.logo || "/placeholder.svg"}
          alt={brand.name}
          className="brand-logo"
          onError={() => setFailed(true)}
          loading="eager"
        />
      )}
    </div>
  )
}

export function BrandStrip() {
  return (
    <div className="brand-strip" aria-label="Investhood group brands">
      {BRANDS.map((b) => (
        <BrandLogo key={b.name} brand={b} />
      ))}
    </div>
  )
}
