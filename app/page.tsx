import QRCode from "react-qr-code"
import { ProviderStatus } from "@/components/landing/provider-status"

export default function Home() {
  const frontendPort = Number(process.env.FRONTEND_PORT ?? process.env.PORT ?? "3001")
  const demoUrl = process.env.PUBLIC_DEMO_URL ?? `http://localhost:${frontendPort}`
  const projectName = process.env.PROJECT_NAME ?? "PK/PD Nexus AI"
  const headline =
    process.env.WAITLIST_HEADLINE ??
    "Bellvitge’s collaborative PK/PD network, reimagined as a clinical intelligence platform."
  const portalUrl = process.env.PUBLIC_DEMO_URL_PORTAL ?? `${demoUrl}/pro`
  const appUrl = process.env.PUBLIC_DEMO_URL_APP ?? `${demoUrl}/app`

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--accent)]">
            Lazareto 26 · Winning prototype
          </p>
          <img src="/brand/logo.png" alt={projectName} className="hero-logo" />
          <p className="hero-text hero-headline">{headline}</p>
          <p className="hero-text">
            Deterministic triage first. Semantic retrieval second. LLM-assisted drafting last. Expert validation always.
          </p>
          <ProviderStatus />

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard value="10" label="Collaborating centers" />
            <StatCard value="119" label="Direct interventions" />
            <StatCard value="72%" label="Requests from medical teams" />
            <StatCard value="May 2025" label="Operational since" />
          </div>
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

      <section className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-[var(--line)] bg-[rgba(255,255,255,0.72)] p-6 shadow-[var(--shadow)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
            What makes the demo land
          </p>
          <h2 className="mt-3 font-serif text-4xl leading-none text-[var(--ink)]">
            A collaborative clinical intelligence network, not a generic chatbot.
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <StoryCard
              title="Network command center"
              text="Reference hospital in the middle, satellites around it, real KPIs on impact and response time."
            />
            <StoryCard
              title="Intelligent case queue"
              text="Cases prioritized deterministically by drug, thresholds, and risk signals before any model writes text."
            />
            <StoryCard
              title="FHIR-backed case workspace"
              text="Synthetic PK/PD events sit on top of the existing breast-cancer FHIR backbone for realistic longitudinal context."
            />
            <StoryCard
              title="Semantic knowledge products"
              text="Every validated intervention becomes reusable network knowledge instead of disappearing into a note."
            />
          </div>
        </div>

        <div className="rounded-[28px] border border-[var(--line)] bg-[rgba(255,249,239,0.9)] p-6 shadow-[var(--shadow)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
            Therapeutic scope
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Biologics", "Antibiotics", "Antifungals", "Antiepileptics", "Immunosuppressants"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-[var(--line)] bg-white/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ink)]"
              >
                {item}
              </span>
            ))}
          </div>
          <div className="mt-6 space-y-3 text-sm leading-7 text-[var(--muted)]">
            <p>
              Start on <strong className="text-[var(--ink)]">/pro</strong> for the mission-control story: network map,
              active queue, case workspace, copilot, protocol retrieval, and similar-case evidence.
            </p>
            <p>
              Then jump to <strong className="text-[var(--ink)]">/app</strong> for the mobile pharmacist flow and the
              safe patient companion experience.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[22px] border border-[var(--line)] bg-white/70 px-4 py-4">
      <p className="text-2xl font-semibold text-[var(--ink)]">{value}</p>
      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
    </div>
  )
}

function StoryCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[22px] border border-[var(--line)] bg-[rgba(255,251,244,0.8)] p-4">
      <p className="text-sm font-semibold text-[var(--ink)]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{text}</p>
    </div>
  )
}
