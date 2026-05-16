'use client'

import { startTransition, useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  Clock3,
  Database,
  FileText,
  HeartPulse,
  Loader2,
  Orbit,
  Radar,
  Sparkles,
  Stethoscope,
  Syringe,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type MetricCard = {
  key: keyof NetworkMetrics
  label: string
  icon: typeof Activity
  suffix?: string
}

type NetworkMetrics = {
  centers: number
  directInterventions: number
  activeCases: number
  criticalCases: number
  pendingExpertReviews: number
  averageResponseHours: number
  medicalTeamRequestsShare: number
}

type HospitalNode = {
  _id: string
  name: string
  role: string
  city: string
  activeCases: number
  criticalCases: number
  pendingExpertReviews: number
  responseTimeHours: number
}

type QueueCase = {
  _id: string
  priority: string
  status: string
  drugName: string
  caseReason: string
  patientSnapshot: {
    displayName: string
    age: number | null
    sex: string
  }
  originHospitalId: string
  riskSignals: string[]
}

type WorkspacePayload = {
  case: QueueCase & {
    therapeuticArea: string
    protocolId: string
    clinicalQuestion: string
    syntheaPatientRef?: string
    ai?: {
      caseSummary?: string
      missingData?: string[]
      explanation?: string
    }
    timeline: Array<{
      type: string
      datetime: string
      drug?: string
      name?: string
      value?: number
      unit?: string
      doseMg?: number
    }>
    targets: {
      levelMin: number
      levelMax: number
      unit: string
    }
    collaboration?: {
      comments?: Array<{ author: string; timestamp: string; text: string }>
    }
  }
  patient?: {
    _id: string
    syntheaPatientRef?: string
    demographics?: {
      age?: number
      sex?: string
      displayName?: string
    }
  }
  originHospital?: { _id: string; name: string; city: string }
  referenceHospital?: { _id: string; name: string }
  protocolMatch?: {
    protocol?: {
      title?: string
      version?: string
    }
    topChunks?: Array<{
      chunkId: string
      section: string
      variant: string
      chunkText: string
      matchedTerms: string[]
    }>
  }
  similarCases?: Array<{
    _id: string
    drugName: string
    score: number
    summary?: string
    matchedSignals?: string[]
  }>
  knowledgeProducts?: Array<{
    _id: string
    type: string
    status: string
    content?: { headline?: string }
  }>
  expertInterventions?: Array<{
    _id: string
    decisionSummary?: string
    rationale?: string
  }>
  fhirContext?: {
    patient?: {
      name?: string
      age?: number
      sex?: string
    }
    summary?: {
      resourceCounts?: Record<string, number>
      conditions?: string[]
      medications?: string[]
      labs?: Array<{ label?: string; value?: string | number; unit?: string | null; date?: string | null }>
      recentEvents?: Array<{ type?: string; label?: string; date?: string | null }>
    }
  }
}

type NetworkPayload = {
  network?: {
    name?: string
    positioning?: string
    story?: {
      operationalSince?: string
      therapeuticScope?: string[]
      drugHighlights?: Array<{ drugName: string; cases: number }>
    }
  }
  metrics: NetworkMetrics
  hospitals: HospitalNode[]
}

const orbitPositions = [
  { top: '8%', left: '48%' },
  { top: '18%', left: '74%' },
  { top: '42%', left: '84%' },
  { top: '68%', left: '76%' },
  { top: '82%', left: '50%' },
  { top: '70%', left: '22%' },
  { top: '44%', left: '12%' },
  { top: '18%', left: '24%' },
  { top: '6%', left: '18%' },
]

const priorityTone: Record<string, string> = {
  high: 'bg-red-500/15 text-red-100 ring-1 ring-red-400/35',
  medium: 'bg-amber-400/15 text-amber-50 ring-1 ring-amber-300/30',
  low: 'bg-emerald-400/15 text-emerald-50 ring-1 ring-emerald-300/30',
}

const metricCards: MetricCard[] = [
  { key: 'centers', label: 'Centers', icon: Orbit },
  { key: 'directInterventions', label: 'Direct interventions', icon: HeartPulse },
  { key: 'activeCases', label: 'Active cases', icon: Activity },
  { key: 'criticalCases', label: 'Critical cases', icon: AlertTriangle },
  { key: 'averageResponseHours', label: 'Avg. response', icon: Clock3, suffix: 'h' },
  { key: 'medicalTeamRequestsShare', label: 'Medical-team requests', icon: Radar, suffix: '%' },
]

function formatDate(value?: string | null) {
  if (!value) return 'Pending'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-GB', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function MissionControl() {
  const [network, setNetwork] = useState<NetworkPayload | null>(null)
  const [queue, setQueue] = useState<QueueCase[]>([])
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [workspace, setWorkspace] = useState<WorkspacePayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [copilotText, setCopilotText] = useState<string>('')
  const [copilotLabel, setCopilotLabel] = useState<string>('Copilot summary')
  const [copilotWarning, setCopilotWarning] = useState<string | null>(null)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadInitialData() {
      setLoading(true)
      setError(null)

      try {
        await fetch('/api/pkpd/bootstrap', { method: 'POST' })

        const [networkResponse, casesResponse] = await Promise.all([
          fetch('/api/network/kpis'),
          fetch('/api/cases?limit=18&include_historical=true'),
        ])
        const networkJson = (await networkResponse.json()) as NetworkPayload
        const casesJson = (await casesResponse.json()) as { items: QueueCase[] }

        if (cancelled) return

        setNetwork(networkJson)
        setQueue(casesJson.items)

        const defaultCaseId = casesJson.items[0]?._id ?? null
        setSelectedCaseId(defaultCaseId)

        if (defaultCaseId) {
          const workspaceResponse = await fetch(`/api/cases/${defaultCaseId}`)
          const workspaceJson = (await workspaceResponse.json()) as WorkspacePayload
          if (!cancelled) {
            setWorkspace(workspaceJson)
            setCopilotText(workspaceJson.case?.ai?.caseSummary ?? '')
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load PK/PD data.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadInitialData()
    return () => {
      cancelled = true
    }
  }, [])

  async function selectCase(caseId: string) {
    startTransition(() => {
      setSelectedCaseId(caseId)
    })
    setCopilotWarning(null)

    const response = await fetch(`/api/cases/${caseId}`)
    const payload = (await response.json()) as WorkspacePayload
    setWorkspace(payload)
    setCopilotLabel('Copilot summary')
    setCopilotText(payload.case?.ai?.caseSummary ?? '')
  }

  async function runCopilot(action: 'summarize' | 'draft-intervention') {
    if (!selectedCaseId) return

    setBusyAction(action)
    setCopilotWarning(null)

    try {
      const response = await fetch(`/api/cases/${selectedCaseId}/${action}`, { method: 'POST' })
      const payload = (await response.json()) as {
        summary?: string
        draftIntervention?: string
        warning?: string | null
      }
      if (action === 'summarize') {
        setCopilotLabel('Expert-review summary')
        setCopilotText(payload.summary ?? '')
      } else {
        setCopilotLabel('Draft intervention note')
        setCopilotText(payload.draftIntervention ?? '')
      }
      setCopilotWarning(payload.warning ?? null)
    } catch (actionError) {
      setCopilotWarning(actionError instanceof Error ? actionError.message : 'Copilot action failed.')
    } finally {
      setBusyAction(null)
    }
  }

  const selectedCase = workspace?.case

  return (
    <div className="min-h-screen bg-[#0d1718] text-slate-100">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 lg:px-6">
        <section
          id="command-center"
          className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(255,126,87,0.24),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.18),_transparent_28%),linear-gradient(135deg,_rgba(8,18,20,0.98),_rgba(17,44,42,0.94))] p-6 shadow-[0_40px_120px_rgba(2,12,13,0.42)]"
        >
          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.32em] text-emerald-100">
                  PK/PD Nexus AI
                </Badge>
                <Badge className="rounded-full bg-amber-300/15 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-amber-100">
                  Bellvitge reference hospital
                </Badge>
              </div>

              <div className="max-w-4xl space-y-3">
                <h1 className="font-serif text-4xl leading-none tracking-tight text-white md:text-6xl">
                  Collaborative intelligence for hospital PK/PD review.
                </h1>
                <p className="max-w-3xl text-base leading-7 text-slate-200/82 md:text-lg">
                  This is not a chatbot. It is a clinical mission-control layer for Bellvitge’s
                  collaborative PK/PD network: deterministic triage first, semantic retrieval next,
                  expert validation always.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  className="h-11 rounded-full bg-emerald-400 px-5 text-[13px] font-semibold uppercase tracking-[0.16em] text-[#08211f] hover:bg-emerald-300"
                  onClick={() => runCopilot('summarize')}
                  disabled={!selectedCaseId || busyAction !== null}
                >
                  {busyAction === 'summarize' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Summarize live case
                </Button>
                <Button
                  variant="outline"
                  className="h-11 rounded-full border-white/20 bg-white/5 px-5 text-[13px] font-semibold uppercase tracking-[0.16em] text-white hover:bg-white/10"
                  onClick={() => runCopilot('draft-intervention')}
                  disabled={!selectedCaseId || busyAction !== null}
                >
                  {busyAction === 'draft-intervention' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                  Draft intervention
                </Button>
                <a
                  href="/app"
                  className="inline-flex h-11 items-center rounded-full border border-white/20 bg-transparent px-5 text-[13px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
                >
                  Open mobile flow
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {metricCards.map(({ key, label, icon: Icon, suffix }) => (
                  <div
                    key={key}
                    className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs uppercase tracking-[0.24em] text-slate-300/70">{label}</span>
                      <Icon className="h-4 w-4 text-emerald-200" />
                    </div>
                    <div className="text-3xl font-semibold tracking-tight text-white">
                      {network?.metrics?.[key as keyof NetworkMetrics] ?? '—'}
                      {suffix ? <span className="ml-1 text-lg text-slate-300/70">{suffix}</span> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-black/20 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-300/70">Network story</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Bellvitge-led territorial model</h2>
                </div>
                <BrainCircuit className="h-8 w-8 text-emerald-200" />
              </div>

              <div className="space-y-4 text-sm leading-6 text-slate-200/85">
                <p>
                  Operational since <span className="font-semibold text-white">May 2025</span>, with a
                  bi-weekly expert-review rhythm and a workflow that turns each validated case into a reusable
                  network knowledge product.
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {(network?.network?.story?.drugHighlights ?? []).map((item) => (
                    <div key={item.drugName} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-300/70">{item.drugName}</p>
                      <p className="mt-2 text-2xl font-semibold text-white">{item.cases}</p>
                      <p className="text-xs text-slate-300/70">documented cases</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/8 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-emerald-100/80">Safety positioning</p>
                  <p className="mt-2 text-sm leading-6 text-emerald-50/90">
                    AI drafts, retrieves, summarizes, and explains. Clinicians decide. Every recommendation remains
                    bounded by protocol evidence and expert validation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-3xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.18fr_0.95fr]">
          <section
            id="queue"
            className="space-y-6 rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,_rgba(8,18,20,0.98),_rgba(12,28,31,0.96))] p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-300/70">Network command center</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">10-center collaboration map</h2>
              </div>
              <Orbit className="h-6 w-6 text-emerald-200" />
            </div>

            <div className="relative mx-auto aspect-square w-full max-w-[360px] rounded-full border border-white/10 bg-[radial-gradient(circle,_rgba(16,185,129,0.12),_transparent_52%)]">
              <div className="absolute inset-[15%] rounded-full border border-dashed border-white/10" />
              <div className="absolute inset-[28%] rounded-full border border-dashed border-white/10" />
              <div className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-emerald-200/40 bg-emerald-200/12 px-3 text-center shadow-[0_0_40px_rgba(16,185,129,0.15)]">
                <img src="/brand/logo.png" alt="Bellvitge" className="mb-2 h-7 w-auto" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-50">Reference center</span>
              </div>
              {(network?.hospitals ?? [])
                .filter((hospital) => hospital.role !== 'reference_center')
                .slice(0, orbitPositions.length)
                .map((hospital, index) => (
                  <div
                    key={hospital._id}
                    className="absolute flex w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
                    style={orbitPositions[index]}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-xs font-semibold text-white">
                      {hospital.activeCases}
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/25 px-2 py-1 text-center text-[11px] leading-4 text-slate-200/80">
                      <div className="font-medium text-white">{hospital.name.replace(' Hospital', '')}</div>
                      <div>{hospital.criticalCases} critical</div>
                    </div>
                  </div>
                ))}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Intelligent case queue</h3>
                {loading ? <Loader2 className="h-4 w-4 animate-spin text-slate-300" /> : null}
              </div>
              <div className="space-y-3">
                {queue.map((item) => {
                  const selected = item._id === selectedCaseId
                  return (
                    <button
                      key={item._id}
                      onClick={() => selectCase(item._id)}
                      className={`w-full rounded-3xl border p-4 text-left transition ${
                        selected
                          ? 'border-emerald-300/40 bg-emerald-300/10 shadow-[0_20px_40px_rgba(16,185,129,0.08)]'
                          : 'border-white/10 bg-black/20 hover:bg-white/5'
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <Badge className={`rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] ${priorityTone[item.priority] ?? priorityTone.medium}`}>
                          {item.priority}
                        </Badge>
                        <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                          {item.status.replaceAll('_', ' ')}
                        </span>
                      </div>
                      <h4 className="text-base font-semibold text-white">
                        {item.drugName} · {item.patientSnapshot?.displayName}
                      </h4>
                      <p className="mt-2 text-sm leading-6 text-slate-300/78">{item.caseReason}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          </section>

          <section
            id="workspace"
            className="space-y-6 rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,_rgba(9,14,18,0.98),_rgba(14,27,34,0.96))] p-5"
          >
            {selectedCase ? (
              <>
                <div className="rounded-[28px] border border-emerald-200/15 bg-[linear-gradient(135deg,_rgba(16,185,129,0.14),_rgba(255,255,255,0.02))] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${priorityTone[selectedCase.priority] ?? priorityTone.medium}`}>
                          {selectedCase.priority} priority
                        </Badge>
                        <Badge className="rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-100">
                          {selectedCase.status.replaceAll('_', ' ')}
                        </Badge>
                      </div>
                      <div>
                        <h2 className="font-serif text-4xl leading-none text-white">{selectedCase.drugName}</h2>
                        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-200/82">
                          {selectedCase.ai?.explanation}
                        </p>
                      </div>
                    </div>
                    <div className="grid min-w-[240px] gap-3 sm:grid-cols-2">
                      <InfoTile label="Origin hospital" value={workspace?.originHospital?.name ?? '—'} />
                      <InfoTile label="Reference center" value={workspace?.referenceHospital?.name ?? '—'} />
                      <InfoTile label="Therapeutic area" value={selectedCase.therapeuticArea} />
                      <InfoTile
                        label="FHIR link"
                        value={selectedCase.syntheaPatientRef ? 'Connected' : 'Missing'}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <Panel
                    icon={Syringe}
                    title="Case workspace"
                    subtitle="Dose, levels, biomarkers, and missing data"
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InfoTile
                        label="Patient"
                        value={`${selectedCase.patientSnapshot?.displayName} · ${selectedCase.patientSnapshot?.age ?? '—'} · ${selectedCase.patientSnapshot?.sex ?? '—'}`}
                      />
                      <InfoTile
                        label="Target window"
                        value={`${selectedCase.targets.levelMin}–${selectedCase.targets.levelMax} ${selectedCase.targets.unit}`}
                      />
                    </div>

                    <div className="mt-4 space-y-3">
                      {selectedCase.timeline.map((event, index) => (
                        <div key={`${event.type}-${index}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                                {event.type.replaceAll('_', ' ')}
                              </p>
                              <h4 className="mt-1 text-base font-semibold text-white">
                                {event.name ?? event.drug ?? event.type}
                              </h4>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold text-white">
                                {event.doseMg ? `${event.doseMg} mg` : `${event.value} ${event.unit ?? ''}`.trim()}
                              </p>
                              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{formatDate(event.datetime)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/8 p-4 text-sm leading-6 text-amber-50/85">
                      <p className="font-semibold text-amber-50">Missing information to request</p>
                      <p className="mt-2">
                        {(selectedCase.ai?.missingData ?? []).join(', ') || 'No missing data flagged.'}
                      </p>
                    </div>
                  </Panel>

                  <Panel
                    icon={Database}
                    title="FHIR backbone"
                    subtitle="Real patient context pulled from the existing breast-cancer dataset"
                  >
                    <div className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <InfoTile label="FHIR patient" value={workspace?.fhirContext?.patient?.name ?? 'Linked synthetic patient'} />
                        <InfoTile
                          label="Resource types"
                          value={Object.keys(workspace?.fhirContext?.summary?.resourceCounts ?? {}).length.toString()}
                        />
                      </div>

                      <TagCloud
                        title="Conditions"
                        items={workspace?.fhirContext?.summary?.conditions ?? []}
                      />
                      <TagCloud
                        title="Medications"
                        items={workspace?.fhirContext?.summary?.medications ?? []}
                      />

                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Recent labs</p>
                        {(workspace?.fhirContext?.summary?.labs ?? []).slice(0, 4).map((lab, index) => (
                          <div key={`${lab.label}-${index}`} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm">
                            <span className="text-slate-200/85">{lab.label}</span>
                            <span className="font-semibold text-white">
                              {[lab.value, lab.unit].filter(Boolean).join(' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Panel>
                </div>

                <Panel icon={Stethoscope} title="Collaboration thread" subtitle="How the network moves from detection to validated decision">
                  <div className="space-y-3">
                    {(selectedCase.collaboration?.comments ?? []).map((comment, index) => (
                      <div key={`${comment.author}-${index}`} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-white">{comment.author}</p>
                          <span className="text-xs uppercase tracking-[0.16em] text-slate-400">{formatDate(comment.timestamp)}</span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-200/80">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                </Panel>
              </>
            ) : (
              <EmptyPanel label="Select a case from the queue to open the workspace." />
            )}
          </section>

          <section
            id="copilot"
            className="space-y-6 rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,_rgba(7,15,18,0.98),_rgba(11,24,29,0.96))] p-5"
          >
            <Panel icon={FileText} title="Protocol retrieval" subtitle="Deterministic retrieval first, semantic explanation second">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">
                  {workspace?.protocolMatch?.protocol?.title ?? 'Loading protocol context'}
                </h3>
                {(workspace?.protocolMatch?.topChunks ?? []).map((chunk) => (
                  <div key={chunk.chunkId} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <Badge className="rounded-full bg-white/10 text-[10px] uppercase tracking-[0.18em] text-slate-100">
                        {chunk.section}
                      </Badge>
                      <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{chunk.variant}</span>
                    </div>
                    <p className="text-sm leading-6 text-slate-200/82">{chunk.chunkText}</p>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel icon={Radar} title="Similar historical cases" subtitle="Validated cases retrieved inside the trusted subset">
              <div className="space-y-3">
                {(workspace?.similarCases ?? []).map((item) => (
                  <div key={item._id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="font-semibold text-white">{item.drugName}</p>
                      <span className="text-xs uppercase tracking-[0.16em] text-slate-400">score {item.score}</span>
                    </div>
                    <p className="text-sm leading-6 text-slate-200/80">{item.summary}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(item.matchedSignals ?? []).map((signal) => (
                        <Badge key={signal} className="rounded-full bg-white/10 text-[10px] uppercase tracking-[0.16em] text-slate-100">
                          {signal.replaceAll('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel icon={BrainCircuit} title={copilotLabel} subtitle="Grounded copilot output for pharmacist review">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="rounded-full bg-emerald-400 text-[#08211f] hover:bg-emerald-300"
                    onClick={() => runCopilot('summarize')}
                    disabled={busyAction !== null || !selectedCaseId}
                  >
                    Summarize case
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/10"
                    onClick={() => runCopilot('draft-intervention')}
                    disabled={busyAction !== null || !selectedCaseId}
                  >
                    Draft note
                  </Button>
                </div>
                <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/8 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-emerald-50/90">
                    {copilotText || 'Choose a case to see the grounded copilot response.'}
                  </p>
                </div>
                {copilotWarning ? (
                  <div className="rounded-2xl border border-amber-300/20 bg-amber-300/8 px-4 py-3 text-sm leading-6 text-amber-50/85">
                    {copilotWarning}
                  </div>
                ) : null}
              </div>
            </Panel>

            <Panel icon={Sparkles} title="Semantic knowledge products" subtitle="Every validated case becomes reusable network knowledge">
              <div className="space-y-3">
                {(workspace?.knowledgeProducts ?? []).slice(0, 5).map((item) => (
                  <div key={item._id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-white">{item.type.replaceAll('_', ' ')}</p>
                      <Badge className="rounded-full bg-white/10 text-[10px] uppercase tracking-[0.16em] text-slate-100">
                        {item.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-200/80">
                      {item.content?.headline ?? 'Knowledge product generated for expert validation.'}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>
          </section>
        </div>
      </div>
    </div>
  )
}

function Panel({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: typeof Activity
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-4">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{subtitle}</p>
          <h3 className="mt-2 text-xl font-semibold text-white">{title}</h3>
        </div>
        <Icon className="mt-1 h-5 w-5 text-emerald-200" />
      </div>
      {children}
    </div>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-medium leading-6 text-white">{value}</p>
    </div>
  )
}

function TagCloud({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.slice(0, 8).map((item) => (
          <Badge key={item} className="rounded-full bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-100">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  )
}

function EmptyPanel({ label }: { label: string }) {
  return (
    <div className="flex min-h-[360px] items-center justify-center rounded-[28px] border border-dashed border-white/12 bg-white/5 p-6 text-center text-sm leading-7 text-slate-300/75">
      {label}
    </div>
  )
}
