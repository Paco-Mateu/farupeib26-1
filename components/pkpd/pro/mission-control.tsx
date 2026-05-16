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
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Syringe,
} from 'lucide-react'

import { useLanguage } from '@/components/i18n/language-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { humanizeToken } from '@/lib/i18n'

type MetricCard = { key: keyof NetworkMetrics; label: string; icon: typeof Activity; suffix?: string }

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
  originHospitalName?: string
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
    priorityFactors?: string[]
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
      value?: string | number
      unit?: string | null
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
    clinicalBackbone?: string
    oncologySignals?: string[]
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
  protocolComparison?: {
    referenceProtocol?: {
      title?: string
      version?: string
    }
    localProtocol?: {
      title?: string
      version?: string
    }
    comparisons?: Array<{
      heading: string
      referenceText?: string
      localText?: string
      differenceType?: string
    }>
  }
  similarCases?: Array<{
    _id: string
    drugName: string
    score: number
    originHospitalName?: string
    patientSnapshot?: { displayName?: string }
    summary?: string
    matchedSignals?: string[]
  }>
  validatedPrecedents?: Array<{
    _id: string
    sourceCaseId?: string
    drugName?: string
    originHospitalName?: string
    decisionSummary?: string
    rationale?: string
    expertName?: string
    expertRole?: string
    matchedSignals?: string[]
    patientSnapshot?: { displayName?: string }
  }>
  drugEvidence?: {
    drugProfile?: {
      name?: string
      class?: string
      therapeuticArea?: string
      monitoringType?: string
      aliases?: string[]
      typicalPkpdSignals?: string[]
      unit?: string
      targetRange?: { min?: number; max?: number }
      terminology?: { sourceNote?: string | null }
    }
    officialInformation?: {
      status?: string
      preferredSources?: Array<{ source?: string; url?: string }>
      notice?: string
      sections?: Array<{ heading?: string; text?: string }>
    }
    monitoringVocabulary?: {
      observations?: Array<{ _id?: string; name?: string; category?: string; allowedUnits?: string[] }>
      units?: Array<{ _id?: string; ucum?: string; display?: string; category?: string }>
    }
  }
  knowledgeProducts?: Array<{
    _id: string
    type: string
    status: string
    content?: { headline?: string; supportingText?: string }
  }>
  expertReviewPacket?: {
    assignedTeam?: string
    originHospital?: string
    referenceHospital?: string
    clinicalQuestion?: string
    whyNow?: string
    keyEvidence?: string[]
    protocolSectionsToReview?: string[]
    missingDataChecklist?: string[]
    fhirBackbone?: string
    nextReviewStep?: string
  }
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
      focus?: string
      resourceCounts?: Record<string, number>
      conditions?: string[]
      medications?: string[]
      procedures?: string[]
      oncologyHighlights?: {
        conditions?: string[]
        medications?: string[]
        procedures?: string[]
        narrative?: string | null
      }
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

type CopilotLabelKey = 'copilotSummary' | 'expertReviewSummary' | 'draftInterventionNote'

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
  high: 'bg-red-50 text-red-700 ring-1 ring-red-300',
  medium: 'bg-amber-50 text-amber-700 ring-1 ring-amber-300',
  low: 'bg-teal-50 text-[#1a6860] ring-1 ring-[#2a9e90]/40',
}

const protocolDifferenceTone: Record<string, string> = {
  aligned: 'border-[#2a9e90]/25 bg-teal-50',
  local_variant: 'border-amber-300/40 bg-amber-50',
  local_only: 'border-sky-300/40 bg-sky-50',
  reference_only: 'border-slate-200 bg-slate-50',
}

function formatDate(value: string | null | undefined, language: string, pendingLabel: string) {
  if (!value) return pendingLabel
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const locale = language === 'es' ? 'es-ES' : language === 'ca' ? 'ca-ES' : 'en-GB'
  return date.toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function MissionControl() {
  const { language, copy } = useLanguage()
  const t = copy.missionControl
  const [network, setNetwork] = useState<NetworkPayload | null>(null)
  const [queue, setQueue] = useState<QueueCase[]>([])
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [workspace, setWorkspace] = useState<WorkspacePayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [copilotText, setCopilotText] = useState<string>('')
  const [copilotLabel, setCopilotLabel] = useState<CopilotLabelKey>('copilotSummary')
  const [copilotWarning, setCopilotWarning] = useState<string | null>(null)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const metricCards: MetricCard[] = [
    { key: 'centers', label: t.metrics.centers, icon: Orbit },
    { key: 'directInterventions', label: t.metrics.directInterventions, icon: HeartPulse },
    { key: 'activeCases', label: t.metrics.activeCases, icon: Activity },
    { key: 'criticalCases', label: t.metrics.criticalCases, icon: AlertTriangle },
    { key: 'averageResponseHours', label: t.metrics.averageResponseHours, icon: Clock3, suffix: 'h' },
    { key: 'medicalTeamRequestsShare', label: t.metrics.medicalTeamRequestsShare, icon: Radar, suffix: '%' },
  ]

  const priorityLabel = (value?: string | null) => t.priorities[(value || 'medium') as keyof typeof t.priorities] ?? humanizeToken(value)
  const statusLabel = (value?: string | null) => t.statuses[(value || 'local_review') as keyof typeof t.statuses] ?? humanizeToken(value)
  const evidenceStatusLabel =
    (value?: string | null) =>
      t.evidenceStatuses[(value || 'download_required') as keyof typeof t.evidenceStatuses] ?? humanizeToken(value)
  const fallbackDate = t.pendingDate

  useEffect(() => {
    let cancelled = false

    async function loadInitialData() {
      setLoading(true)
      setError(null)

      try {
        await fetch('/api/pkpd/bootstrap', { method: 'POST' })

        const [networkResponse, casesResponse] = await Promise.all([
          fetch('/api/network/kpis'),
          fetch('/api/cases?limit=18&include_historical=false'),
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
          setError(loadError instanceof Error ? loadError.message : t.loadError)
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
  }, [t.loadError])

  async function selectCase(caseId: string) {
    startTransition(() => {
      setSelectedCaseId(caseId)
    })
    setCopilotWarning(null)

    const response = await fetch(`/api/cases/${caseId}`)
    const payload = (await response.json()) as WorkspacePayload
    setWorkspace(payload)
    setCopilotLabel('copilotSummary')
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
        setCopilotLabel('expertReviewSummary')
        setCopilotText(payload.summary ?? '')
      } else {
        setCopilotLabel('draftInterventionNote')
        setCopilotText(payload.draftIntervention ?? '')
      }
      setCopilotWarning(payload.warning ?? null)
    } catch (actionError) {
      setCopilotWarning(actionError instanceof Error ? actionError.message : t.copilotActionFailed)
    } finally {
      setBusyAction(null)
    }
  }

  const selectedCase = workspace?.case
  const officialSections =
    workspace?.drugEvidence?.officialInformation?.sections?.length
      ? workspace.drugEvidence.officialInformation.sections
      : [{ heading: t.sourceManifestNotice, text: t.noOfficialSections }]

  return (
    <div className="min-h-screen bg-[#f0f9f8]">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 lg:px-6">
        <section
          id="command-center"
          className="overflow-hidden rounded-[32px] border border-[#2a9e90]/20 bg-[linear-gradient(135deg,_#1a6860,_#0f2d2a)] p-6 shadow-[0_24px_64px_rgba(26,104,96,0.22)]"
        >
          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="rounded-full bg-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.32em] text-white">
                  PK/PD Nexus AI
                </Badge>
                <Badge className="rounded-full bg-[#e8762b]/20 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-orange-200">
                  {t.referenceHospitalBadge}
                </Badge>
              </div>

              <div className="max-w-4xl space-y-3">
                <h1 className="font-serif text-4xl leading-none tracking-tight text-white md:text-6xl">
                  {t.heroTitle}
                </h1>
                <p className="max-w-3xl text-base leading-7 text-slate-200/82 md:text-lg">
                  {t.heroText}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  className="h-11 rounded-full bg-[#2a9e90] px-5 text-[13px] font-semibold uppercase tracking-[0.16em] text-white hover:bg-[#3ab5a8]"
                  onClick={() => runCopilot('summarize')}
                  disabled={!selectedCaseId || busyAction !== null}
                >
                  {busyAction === 'summarize' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  {t.summarizeLiveCase}
                </Button>
                <Button
                  variant="outline"
                  className="h-11 rounded-full border-white/20 bg-white/5 px-5 text-[13px] font-semibold uppercase tracking-[0.16em] text-white hover:bg-white/10"
                  onClick={() => runCopilot('draft-intervention')}
                  disabled={!selectedCaseId || busyAction !== null}
                >
                  {busyAction === 'draft-intervention' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                  {t.draftIntervention}
                </Button>
                <a
                  href="/app"
                  className="inline-flex h-11 items-center rounded-full border border-white/20 bg-transparent px-5 text-[13px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
                >
                  {t.openMobileFlow}
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
                      <Icon className="h-4 w-4 text-white/60" />
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
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-300/70">{t.networkStory}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">{t.territorialModel}</h2>
                </div>
                <BrainCircuit className="h-8 w-8 text-white/60" />
              </div>

              <div className="space-y-4 text-sm leading-6 text-slate-200/85">
                <p>{t.territorialText}</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {(network?.network?.story?.drugHighlights ?? []).map((item) => (
                    <div key={item.drugName} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-300/70">{item.drugName}</p>
                      <p className="mt-2 text-2xl font-semibold text-white">{item.cases}</p>
                      <p className="text-xs text-slate-300/70">{t.documentedCases}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/70">{t.safetyPositioning}</p>
                  <p className="mt-2 text-sm leading-6 text-white/85">{t.safetyText}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-3xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.18fr_0.95fr]">
          <section
            id="queue"
            className="space-y-6 rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[#4a7068]">{t.networkCommandCenter}</p>
                <h2 className="mt-2 text-2xl font-semibold text-[#152520]">{t.collaborationMap}</h2>
              </div>
              <Orbit className="h-6 w-6 text-[#2a9e90]" />
            </div>

            <div className="relative mx-auto aspect-square w-full max-w-[360px] rounded-full border border-[#2a9e90]/20 bg-[radial-gradient(circle,_rgba(42,158,144,0.10),_transparent_52%)]">
              <div className="absolute inset-[15%] rounded-full border border-dashed border-[#2a9e90]/20" />
              <div className="absolute inset-[28%] rounded-full border border-dashed border-[#2a9e90]/20" />
              <div className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-[#2a9e90]/40 bg-[#2a9e90]/10 px-3 text-center shadow-[0_0_40px_rgba(42,158,144,0.15)]">
                <img src="/brand/logo.png" alt="Bellvitge" className="mb-2 h-7 w-auto" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1a6860]">{t.referenceCenter}</span>
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
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#2a9e90]/30 bg-[#2a9e90]/10 text-xs font-semibold text-[#1a6860]">
                      {hospital.activeCases}
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-2 py-1 text-center text-[11px] leading-4 shadow-sm">
                      <div className="font-medium text-[#152520]">{hospital.name.replace(' Hospital', '')}</div>
                      <div className="text-[#4a7068]">{hospital.criticalCases} {t.critical}</div>
                    </div>
                  </div>
                ))}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-[#f8faf9] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#152520]">{t.intelligentQueue}</h3>
                {loading ? <Loader2 className="h-4 w-4 animate-spin text-[#4a7068]" /> : null}
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
                          ? 'border-[#2a9e90]/40 bg-[#2a9e90]/[0.08] shadow-sm'
                          : 'border-slate-200 bg-white hover:border-[#2a9e90]/30 hover:bg-[#2a9e90]/[0.04]'
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <Badge className={`rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] ${priorityTone[item.priority] ?? priorityTone.medium}`}>
                          {priorityLabel(item.priority)}
                        </Badge>
                        <span className="text-[11px] uppercase tracking-[0.18em] text-[#4a7068]">
                          {statusLabel(item.status)}
                        </span>
                      </div>
                      <h4 className="text-base font-semibold text-[#152520]">
                        {item.drugName} · {item.patientSnapshot?.displayName}
                      </h4>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[#4a7068]">
                        {item.originHospitalName ?? item.originHospitalId}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#4a7068]">{item.caseReason}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(item.riskSignals ?? []).slice(0, 3).map((signal) => (
                          <Badge key={signal} className="rounded-full bg-[#2a9e90]/10 text-[10px] uppercase tracking-[0.16em] text-[#1a6860]">
                            {humanizeToken(signal)}
                          </Badge>
                        ))}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </section>

          <section
            id="workspace"
            className="space-y-6 rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm"
          >
            {selectedCase ? (
              <>
                <div className="rounded-[28px] border border-[#2a9e90]/20 bg-[linear-gradient(135deg,_rgba(42,158,144,0.08),_rgba(255,255,255,0))] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${priorityTone[selectedCase.priority] ?? priorityTone.medium}`}>
                          {priorityLabel(selectedCase.priority)}
                        </Badge>
                        <Badge className="rounded-full bg-[#2a9e90]/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#1a6860]">
                          {statusLabel(selectedCase.status)}
                        </Badge>
                      </div>
                      <div>
                        <h2 className="font-serif text-4xl leading-none text-[#152520]">{selectedCase.drugName}</h2>
                        <p className="mt-3 max-w-2xl text-base leading-7 text-[#4a7068]">
                          {selectedCase.ai?.explanation}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {(selectedCase.riskSignals ?? []).map((signal) => (
                            <Badge key={signal} className="rounded-full bg-[#2a9e90]/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-[#1a6860]">
                              {humanizeToken(signal)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="grid min-w-[240px] gap-3 sm:grid-cols-2">
                      <InfoTile label={t.originHospital} value={workspace?.originHospital?.name ?? '—'} />
                      <InfoTile label={t.referenceCenter} value={workspace?.referenceHospital?.name ?? '—'} />
                      <InfoTile label={t.therapeuticArea} value={humanizeToken(selectedCase.therapeuticArea)} />
                      <InfoTile
                        label={t.fhirLink}
                        value={selectedCase.syntheaPatientRef ? t.connected : t.missing}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <Panel
                    icon={Syringe}
                    title={t.caseWorkspace}
                    subtitle={t.caseWorkspaceSubtitle}
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InfoTile
                        label={t.patient}
                        value={`${selectedCase.patientSnapshot?.displayName} · ${selectedCase.patientSnapshot?.age ?? '—'} · ${selectedCase.patientSnapshot?.sex ?? '—'}`}
                      />
                      <InfoTile
                        label={t.targetWindow}
                        value={`${selectedCase.targets.levelMin}–${selectedCase.targets.levelMax} ${selectedCase.targets.unit}`}
                      />
                    </div>

                    <div className="mt-4 rounded-2xl border border-[#2a9e90]/20 bg-teal-50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-[#1a6860]">{t.deterministicPriorityFactors}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(selectedCase.priorityFactors ?? []).map((factor) => (
                          <Badge key={factor} className="rounded-full bg-[#2a9e90]/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-[#1a6860]">
                            {humanizeToken(factor)}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {selectedCase.timeline.map((event, index) => (
                        <div key={`${event.type}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.18em] text-[#4a7068]">
                                {humanizeToken(event.type)}
                              </p>
                              <h4 className="mt-1 text-base font-semibold text-[#152520]">
                                {event.name ?? event.drug ?? humanizeToken(event.type)}
                              </h4>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold text-[#152520]">
                                {event.doseMg ? `${event.doseMg} mg` : `${event.value} ${event.unit ?? ''}`.trim()}
                              </p>
                              <p className="text-xs uppercase tracking-[0.16em] text-[#4a7068]">{formatDate(event.datetime, language, fallbackDate)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-2xl border border-amber-300/40 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                      <p className="font-semibold text-amber-900">{t.missingInformation}</p>
                      <p className="mt-2">
                        {(selectedCase.ai?.missingData ?? []).join(', ') || t.noMissingData}
                      </p>
                    </div>
                  </Panel>

                  <Panel
                    icon={Database}
                    title={t.fhirBackbone}
                    subtitle={t.fhirBackboneSubtitle}
                  >
                    <div className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <InfoTile label={t.fhirPatient} value={workspace?.fhirContext?.patient?.name ?? t.linkedSyntheticPatient} />
                        <InfoTile
                          label={t.clinicalBackbone}
                          value={humanizeToken(workspace?.fhirContext?.summary?.focus ?? workspace?.patient?.clinicalBackbone ?? 'general_clinical')}
                        />
                        <InfoTile
                          label={t.resourceTypes}
                          value={Object.keys(workspace?.fhirContext?.summary?.resourceCounts ?? {}).length.toString()}
                        />
                        <InfoTile
                          label={t.oncologyLinkage}
                          value={
                            workspace?.patient?.oncologySignals?.length
                              ? workspace.patient.oncologySignals.map((item) => humanizeToken(item)).join(', ')
                              : t.sharedLongitudinalContext
                          }
                        />
                      </div>

                      {workspace?.fhirContext?.summary?.oncologyHighlights?.narrative ? (
                        <div className="rounded-2xl border border-rose-300/40 bg-rose-50 p-4 text-sm leading-6 text-rose-800">
                          {workspace.fhirContext.summary.oncologyHighlights.narrative}
                        </div>
                      ) : null}

                      <TagCloud title={t.oncologyConditions} items={workspace?.fhirContext?.summary?.oncologyHighlights?.conditions ?? []} emptyLabel={t.noItemsHighlighted} />
                      <TagCloud title={t.oncologyTherapies} items={workspace?.fhirContext?.summary?.oncologyHighlights?.medications ?? []} emptyLabel={t.noItemsHighlighted} />
                      <TagCloud title={t.breastProcedures} items={workspace?.fhirContext?.summary?.oncologyHighlights?.procedures ?? []} emptyLabel={t.noItemsHighlighted} />
                      <TagCloud title={t.generalConditions} items={workspace?.fhirContext?.summary?.conditions ?? []} emptyLabel={t.noItemsHighlighted} />

                      <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.18em] text-[#4a7068]">{t.prioritizedLabs}</p>
                        {(workspace?.fhirContext?.summary?.labs ?? []).slice(0, 4).map((lab, index) => (
                          <div key={`${lab.label}-${index}`} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
                            <span className="text-[#4a7068]">{lab.label}</span>
                            <span className="font-semibold text-[#152520]">
                              {[lab.value, lab.unit].filter(Boolean).join(' ')}
                            </span>
                          </div>
                        ))}
                      </div>

                      <TagCloud title={t.recentProcedures} items={workspace?.fhirContext?.summary?.procedures ?? []} emptyLabel={t.noItemsHighlighted} />
                    </div>
                  </Panel>
                </div>

                <Panel icon={Stethoscope} title={t.collaborationThread} subtitle={t.collaborationThreadSubtitle}>
                  <div className="space-y-3">
                    {(selectedCase.collaboration?.comments ?? []).map((comment, index) => (
                      <div key={`${comment.author}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-[#152520]">{comment.author}</p>
                          <span className="text-xs uppercase tracking-[0.16em] text-[#4a7068]">{formatDate(comment.timestamp, language, fallbackDate)}</span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[#4a7068]">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                </Panel>
              </>
            ) : (
              <EmptyPanel label={t.selectCaseWorkspace} />
            )}
          </section>

          <section
            id="copilot"
            className="space-y-6 rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <Panel icon={FileText} title={t.protocolRetrieval} subtitle={t.protocolRetrievalSubtitle}>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-[#152520]">
                  {workspace?.protocolMatch?.protocol?.title ?? t.loadingProtocolContext}
                </h3>
                {(workspace?.protocolMatch?.topChunks ?? []).map((chunk) => (
                  <div key={chunk.chunkId} className="rounded-2xl border border-slate-200 bg-[#f8faf9] p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <Badge className="rounded-full bg-[#2a9e90]/10 text-[10px] uppercase tracking-[0.18em] text-[#1a6860]">
                        {chunk.section}
                      </Badge>
                      <span className="text-[11px] uppercase tracking-[0.16em] text-[#4a7068]">{humanizeToken(chunk.variant)}</span>
                    </div>
                    <p className="text-sm leading-6 text-[#4a7068]">{chunk.chunkText}</p>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel icon={ShieldCheck} title={t.trustedDrugEvidence} subtitle={t.trustedDrugEvidenceSubtitle}>
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoTile
                    label={t.drugClass}
                    value={humanizeToken(workspace?.drugEvidence?.drugProfile?.class) || '—'}
                  />
                  <InfoTile
                    label={t.monitoringType}
                    value={humanizeToken(workspace?.drugEvidence?.drugProfile?.monitoringType) || '—'}
                  />
                </div>

                <TagCloud
                  title={t.monitoringSignals}
                  items={(workspace?.drugEvidence?.drugProfile?.typicalPkpdSignals ?? []).map((item) => humanizeToken(item))}
                  emptyLabel={t.noItemsHighlighted}
                />
                <TagCloud
                  title={t.structuredObservations}
                  items={(workspace?.drugEvidence?.monitoringVocabulary?.observations ?? []).map((item) => item.name || item._id || '').filter(Boolean)}
                  emptyLabel={t.noItemsHighlighted}
                />
                <TagCloud
                  title={t.unitVocabulary}
                  items={(workspace?.drugEvidence?.monitoringVocabulary?.units ?? []).map((item) => item.display || item.ucum || '').filter(Boolean)}
                  emptyLabel={t.noItemsHighlighted}
                />

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#4a7068]">{t.officialInformationStatus}</p>
                    <Badge className="rounded-full bg-[#2a9e90]/10 text-[10px] uppercase tracking-[0.16em] text-[#1a6860]">
                      {evidenceStatusLabel(workspace?.drugEvidence?.officialInformation?.status)}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#4a7068]">
                    {workspace?.drugEvidence?.officialInformation?.notice ?? t.noOfficialSections}
                  </p>
                  {(workspace?.drugEvidence?.drugProfile?.terminology?.sourceNote ?? '').trim() ? (
                    <p className="mt-3 text-xs leading-6 text-[#4a7068]">
                      <span className="font-semibold text-[#152520]">{t.terminologyNote}:</span>{' '}
                      {workspace?.drugEvidence?.drugProfile?.terminology?.sourceNote}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#4a7068]">{t.preferredSources}</p>
                  <div className="flex flex-wrap gap-2">
                    {(workspace?.drugEvidence?.officialInformation?.preferredSources ?? []).map((item) => (
                      <a
                        key={`${item.source}-${item.url}`}
                        href={item.url || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex rounded-full border border-[#2a9e90]/30 bg-[#2a9e90]/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-[#1a6860] transition hover:bg-[#2a9e90]/20"
                      >
                        {item.source}
                      </a>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {officialSections.map((section, index) => (
                    <div key={`${section.heading}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="font-semibold text-[#152520]">{section.heading}</p>
                      <p className="mt-2 text-sm leading-6 text-[#4a7068]">{section.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel icon={ArrowRight} title={t.protocolComparison} subtitle={t.protocolComparisonSubtitle}>
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoTile
                    label={t.referenceProtocol}
                    value={workspace?.protocolComparison?.referenceProtocol?.title ?? t.referenceProtocolPending}
                  />
                  <InfoTile
                    label={t.localProtocol}
                    value={workspace?.protocolComparison?.localProtocol?.title ?? t.noLocalVariantFound}
                  />
                </div>
                {(workspace?.protocolComparison?.comparisons ?? []).slice(0, 3).map((item) => (
                  <div
                    key={item.heading}
                    className={`rounded-2xl border p-4 ${protocolDifferenceTone[item.differenceType ?? 'aligned'] ?? protocolDifferenceTone.aligned}`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="font-semibold text-[#152520]">{item.heading}</p>
                      <Badge className="rounded-full bg-[#2a9e90]/10 text-[10px] uppercase tracking-[0.16em] text-[#1a6860]">
                        {humanizeToken(item.differenceType ?? 'aligned')}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm leading-6">
                      <p className="text-[#4a7068]">
                        <span className="font-semibold text-[#152520]">{t.referenceLabel}:</span> {item.referenceText ?? t.notPresent}
                      </p>
                      <p className="text-[#4a7068]">
                        <span className="font-semibold text-[#152520]">{t.localLabel}:</span> {item.localText ?? t.notPresent}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel icon={Radar} title={t.similarHistoricalCases} subtitle={t.similarHistoricalCasesSubtitle}>
              <div className="space-y-3">
                {(workspace?.similarCases ?? []).map((item) => (
                  <div key={item._id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="font-semibold text-[#152520]">{item.drugName}</p>
                      <span className="text-xs uppercase tracking-[0.16em] text-[#4a7068]">{t.scoreLabel} {item.score}</span>
                    </div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[#4a7068]">
                      {(item.patientSnapshot?.displayName ?? t.linkedPatient)} · {item.originHospitalName ?? t.networkPrecedent}
                    </p>
                    <p className="text-sm leading-6 text-[#4a7068]">{item.summary}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(item.matchedSignals ?? []).map((signal) => (
                        <Badge key={signal} className="rounded-full bg-[#2a9e90]/10 text-[10px] uppercase tracking-[0.16em] text-[#1a6860]">
                          {humanizeToken(signal)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel icon={HeartPulse} title={t.networkPrecedents} subtitle={t.networkPrecedentsSubtitle}>
              <div className="space-y-3">
                {(workspace?.validatedPrecedents ?? []).length ? (
                  (workspace?.validatedPrecedents ?? []).map((item) => (
                    <div key={item._id} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-[#152520]">{item.drugName ?? t.validatedPrecedent}</p>
                        <span className="text-[11px] uppercase tracking-[0.16em] text-[#4a7068]">
                          {item.originHospitalName ?? t.bellvitgeNetwork}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[#4a7068]">{item.decisionSummary}</p>
                      <p className="mt-2 text-sm leading-6 text-[#4a7068]">{item.rationale}</p>
                      {item.expertName ? (
                        <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-[#4a7068]">
                          {t.validatedBy} {item.expertName}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(item.matchedSignals ?? []).map((signal) => (
                          <Badge key={signal} className="rounded-full bg-[#2a9e90]/10 text-[10px] uppercase tracking-[0.16em] text-[#1a6860]">
                            {humanizeToken(signal)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-[#f8faf9] p-4 text-sm leading-6 text-[#4a7068]">
                    {t.noPrecedents}
                  </div>
                )}
              </div>
            </Panel>

            <Panel icon={BrainCircuit} title={t[copilotLabel]} subtitle={t.groundedCopilotSubtitle}>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="rounded-full bg-[#2a9e90] text-white hover:bg-[#3ab5a8]"
                    onClick={() => runCopilot('summarize')}
                    disabled={busyAction !== null || !selectedCaseId}
                  >
                    {t.summarizeCase}
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full border-[#2a9e90] text-[#1a6860] hover:bg-[#2a9e90]/10"
                    onClick={() => runCopilot('draft-intervention')}
                    disabled={busyAction !== null || !selectedCaseId}
                  >
                    {t.draftNote}
                  </Button>
                </div>
                <div className="rounded-3xl border border-[#2a9e90]/20 bg-teal-50 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-[#152520]">
                    {copilotText || t.chooseCaseForCopilot}
                  </p>
                </div>
                {copilotWarning ? (
                  <div className="rounded-2xl border border-amber-300/40 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                    {copilotWarning}
                  </div>
                ) : null}
              </div>
            </Panel>

            <Panel icon={Stethoscope} title={t.expertReviewPacket} subtitle={t.expertReviewPacketSubtitle}>
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoTile
                    label={t.assignedTeam}
                    value={workspace?.expertReviewPacket?.assignedTeam ? humanizeToken(workspace.expertReviewPacket.assignedTeam) : t.pendingAssignment}
                  />
                  <InfoTile
                    label={t.nextStep}
                    value={workspace?.expertReviewPacket?.nextReviewStep ?? t.pendingReview}
                  />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#4a7068]">{t.whyNow}</p>
                  <p className="mt-2 text-sm leading-6 text-[#4a7068]">
                    {workspace?.expertReviewPacket?.whyNow ?? t.clinicalReviewPacketPreparing}
                  </p>
                </div>
                <TagCloud title={t.protocolSectionsToReview} items={workspace?.expertReviewPacket?.protocolSectionsToReview ?? []} emptyLabel={t.noItemsHighlighted} />
                <LineList title={t.keyEvidence} items={workspace?.expertReviewPacket?.keyEvidence ?? []} emptyLabel={t.noOutstandingItems} />
                <LineList title={t.missingBeforeMeeting} items={workspace?.expertReviewPacket?.missingDataChecklist ?? []} emptyLabel={t.noOutstandingItems} />
              </div>
            </Panel>

            <Panel icon={Sparkles} title={t.semanticKnowledgeProducts} subtitle={t.knowledgeProductsSubtitle}>
              <div className="space-y-3">
                {(workspace?.knowledgeProducts ?? []).slice(0, 5).map((item) => (
                  <div key={item._id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-[#152520]">{humanizeToken(item.type)}</p>
                      <Badge className="rounded-full bg-[#2a9e90]/10 text-[10px] uppercase tracking-[0.16em] text-[#1a6860]">
                        {humanizeToken(item.status)}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#4a7068]">
                      {item.content?.headline ?? t.generatedForValidation}
                    </p>
                    {item.content?.supportingText ? (
                      <p className="mt-2 text-sm leading-6 text-[#4a7068]">{item.content.supportingText}</p>
                    ) : null}
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
    <div className="rounded-[28px] border border-slate-100 bg-[#f8faf9] p-4">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[#4a7068]">{subtitle}</p>
          <h3 className="mt-2 text-xl font-semibold text-[#152520]">{title}</h3>
        </div>
        <Icon className="mt-1 h-5 w-5 text-[#2a9e90]" />
      </div>
      {children}
    </div>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#4a7068]">{label}</p>
      <p className="mt-2 text-sm font-medium leading-6 text-[#152520]">{value}</p>
    </div>
  )
}

function TagCloud({ title, items, emptyLabel }: { title: string; items: string[]; emptyLabel: string }) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.18em] text-[#4a7068]">{title}</p>
      {items.length ? (
        <div className="flex flex-wrap gap-2">
          {items.slice(0, 8).map((item) => (
            <Badge key={item} className="rounded-full bg-[#2a9e90]/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-[#1a6860]">
              {item}
            </Badge>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-[#4a7068]">
          {emptyLabel}
        </div>
      )}
    </div>
  )
}

function LineList({ title, items, emptyLabel }: { title: string; items: string[]; emptyLabel: string }) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.18em] text-[#4a7068]">{title}</p>
      {items.length ? (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-[#4a7068]">
              {item}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-[#4a7068]">
          {emptyLabel}
        </div>
      )}
    </div>
  )
}

function EmptyPanel({ label }: { label: string }) {
  return (
    <div className="flex min-h-[360px] items-center justify-center rounded-[28px] border border-dashed border-[#2a9e90]/25 bg-[#f8faf9] p-6 text-center text-sm leading-7 text-[#4a7068]">
      {label}
    </div>
  )
}
