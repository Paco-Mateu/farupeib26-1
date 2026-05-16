import QRCode from "react-qr-code"
import { ProviderStatus } from "@/components/landing/provider-status"

export default function Home() {
  const appName = process.env.APP_NAME ?? "proto1"
  const frontendPort = Number(process.env.FRONTEND_PORT ?? process.env.PORT ?? "3001")
  const demoUrl = process.env.PUBLIC_DEMO_URL ?? `http://localhost:${frontendPort}`
  const projectName = process.env.PROJECT_NAME ?? appName
  const headline = process.env.WAITLIST_HEADLINE ?? "We are building this prototype live today."
  const portalUrl = process.env.PUBLIC_DEMO_URL_PORTAL ?? `${demoUrl}/pro`
  const appUrl = process.env.PUBLIC_DEMO_URL_APP ?? `${demoUrl}/app`

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">{appName}</p>
          <h1>{projectName}</h1>
          <p className="hero-text hero-headline">{headline}</p>
          <ProviderStatus />
        </div>

        <div className="qr-panel">
          <div className="qr-card">
            <QRCode value={demoUrl} size={180} bgColor="transparent" fgColor="#132c29" />
          </div>
          <p className="qr-label">Scan now. Come back in two hours.</p>
          <a className="public-link" href={demoUrl} target="_blank" rel="noreferrer">
            {demoUrl}
          </a>
        </div>
      </section>

      <div className="portal-links">
        <a className="portal-link" href={portalUrl} target="_blank" rel="noreferrer">
          <span className="portal-link-label">Professional</span>
          <span className="portal-link-route">/pro →</span>
        </a>
        <a className="portal-link" href={appUrl} target="_blank" rel="noreferrer">
          <span className="portal-link-label">End User</span>
          <span className="portal-link-route">/app →</span>
        </a>
      </div>
    </main>
  )
}
