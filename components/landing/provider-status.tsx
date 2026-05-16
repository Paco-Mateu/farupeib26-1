"use client"

import { useEffect, useState } from "react"

type Providers = {
  mongo: { configured: boolean; connected?: boolean }
  openai: { configured: boolean; chatReady?: boolean }
  voyage: { configured: boolean; ready?: boolean }
}

export function ProviderStatus() {
  const [providers, setProviders] = useState<Providers | null>(null)

  useEffect(() => {
    fetch("/api/health")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setProviders(data.providers))
      .catch(() => {})
  }, [])

  return (
    <div className="status-row-inline">
      <Dot
        label="MongoDB"
        active={Boolean(providers?.mongo.connected)}
        standby={Boolean(providers?.mongo.configured && !providers?.mongo.connected)}
      />
      <Dot
        label="OpenAI"
        active={Boolean(providers?.openai.chatReady)}
        standby={Boolean(providers?.openai.configured && !providers?.openai.chatReady)}
      />
      <Dot
        label="Voyage"
        active={Boolean(providers?.voyage.ready)}
        standby={Boolean(providers?.voyage.configured && !providers?.voyage.ready)}
      />
    </div>
  )
}

function Dot({ label, active, standby = false }: { label: string; active: boolean; standby?: boolean }) {
  return (
    <span className="status-dot-item">
      <span className={`status-dot ${active ? "dot-ready" : standby ? "dot-warning" : "dot-idle"}`} />
      {label}
    </span>
  )
}
