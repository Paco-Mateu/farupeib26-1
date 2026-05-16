'use client'

import { useEffect, useState } from 'react'
import { BellRing, CheckCircle2, ChevronRight, Clock3, HeartPulse, MessageSquareMore, ShieldAlert, Syringe } from 'lucide-react'

import { useLanguage } from '@/components/i18n/language-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { humanizeToken } from '@/lib/i18n'

type MobileCase = {
  _id: string
  priority: string
  drugName: string
  caseReason: string
  originHospitalName?: string
  riskSignals?: string[]
  patientSnapshot: {
    displayName: string
  }
}

type MobileWorkspace = {
  case: {
    _id: string
    drugName: string
    clinicalQuestion: string
    riskSignals: string[]
    ai?: {
      caseSummary?: string
    }
  }
  originHospital?: {
    name?: string
  }
  fhirContext?: {
    summary?: {
      focus?: string
    }
  }
  protocolMatch?: {
    protocol?: { title?: string }
  }
}

const tones: Record<string, string> = {
  high: 'bg-red-50 text-red-700 border-red-300',
  medium: 'bg-amber-50 text-amber-700 border-amber-300',
}

export function MobileExperience() {
  const [queue, setQueue] = useState<MobileCase[]>([])
  const [workspace, setWorkspace] = useState<MobileWorkspace | null>(null)
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [activeProfile, setActiveProfile] = useState<'pharmacist' | 'patient'>('pharmacist')
  const { copy } = useLanguage()
  const mobile = copy.mobile
  const priorityLabel =
    (value?: string | null) =>
      copy.missionControl.priorities[(value || 'medium') as keyof typeof copy.missionControl.priorities] ?? humanizeToken(value)

  useEffect(() => {
    let cancelled = false

    async function loadMobileData() {
      await fetch('/api/pkpd/bootstrap', { method: 'POST' })
      const queueResponse = await fetch('/api/cases?limit=6&include_historical=false')
      const queueJson = (await queueResponse.json()) as { items: MobileCase[] }
      if (cancelled) return
      setQueue(queueJson.items)

      const firstCaseId = queueJson.items[0]?._id
      if (firstCaseId) {
        setSelectedCaseId(firstCaseId)
        const workspaceResponse = await fetch(`/api/cases/${firstCaseId}`)
        const workspaceJson = (await workspaceResponse.json()) as MobileWorkspace
        if (!cancelled) {
          setWorkspace(workspaceJson)
        }
      }
    }

    loadMobileData()
    return () => {
      cancelled = true
    }
  }, [])

  async function selectCase(caseId: string) {
    setSelectedCaseId(caseId)
    const workspaceResponse = await fetch(`/api/cases/${caseId}`)
    const workspaceJson = (await workspaceResponse.json()) as MobileWorkspace
    setWorkspace(workspaceJson)
  }

  return (
    <div className="min-h-full bg-[linear-gradient(180deg,_#f6efe5_0%,_#eef5f3_42%,_#e5f0ee_100%)] pb-28">
      <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-4">
        <section
          id="home"
          className="overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,_#0f1d1c,_#163533)] p-5 text-white shadow-[0_30px_80px_rgba(11,26,25,0.18)]"
        >
          <Badge className="rounded-full bg-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/90">
            {mobile.onCallPharmacist}
          </Badge>
          <h1 className="mt-4 font-serif text-4xl leading-none tracking-tight">{mobile.heroTitle}</h1>
          <p className="mt-3 text-sm leading-6 text-white/78">{mobile.heroText}</p>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <MiniMetric label={mobile.alerts} value={String(queue.length || 0)} />
            <MiniMetric label={mobile.urgent} value={String(queue.filter((item) => item.priority === 'high').length)} />
            <MiniMetric label={mobile.protocol} value={workspace?.protocolMatch?.protocol?.title ? mobile.live : mobile.pending} />
          </div>
        </section>

        <div className="rounded-full bg-white/80 p-1 shadow-[0_12px_30px_rgba(15,30,28,0.08)]">
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setActiveProfile('pharmacist')}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                activeProfile === 'pharmacist' ? 'bg-slate-950 text-white' : 'text-slate-600'
              }`}
            >
              {mobile.pharmacist}
            </button>
            <button
              onClick={() => setActiveProfile('patient')}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                activeProfile === 'patient' ? 'bg-slate-950 text-white' : 'text-slate-600'
              }`}
            >
              {mobile.patient}
            </button>
          </div>
        </div>

        {activeProfile === 'pharmacist' ? (
          <div className="space-y-4">
            <section id="search" className="rounded-[28px] border border-black/5 bg-white/80 p-4 shadow-[0_20px_50px_rgba(15,30,28,0.07)] backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{mobile.assignedCases}</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">{mobile.pharmacistAlertStack}</h2>
                </div>
                <BellRing className="h-5 w-5 text-[#2a9e90]" />
              </div>
              <div className="space-y-3">
                {queue.map((item) => {
                  const selected = item._id === selectedCaseId
                  return (
                    <button
                      key={item._id}
                      onClick={() => selectCase(item._id)}
                      className={`w-full rounded-3xl border p-4 text-left transition ${
                        selected ? 'border-[#2a9e90]/50 bg-[#2a9e90]/[0.07]' : 'border-black/5 bg-white'
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <Badge className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${tones[item.priority] ?? tones.medium}`}>
                          {priorityLabel(item.priority)}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {item.drugName} · {item.patientSnapshot?.displayName}
                      </h3>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                        {item.originHospitalName ?? mobile.networkHospital}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.caseReason}</p>
                    </button>
                  )
                })}
              </div>
            </section>

            <section id="activity" className="rounded-[28px] border border-black/5 bg-white/80 p-4 shadow-[0_20px_50px_rgba(15,30,28,0.07)] backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{mobile.voiceAndReview}</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">{mobile.expertActionLane}</h2>
                </div>
                <MessageSquareMore className="h-5 w-5 text-[#2a9e90]" />
              </div>
              <div className="rounded-3xl border border-[#2a9e90]/25 bg-[#2a9e90]/[0.07] p-4">
                <p className="text-sm font-semibold text-[#152520]">{mobile.currentLiveCase}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-[#4a7068]">
                  {workspace?.originHospital?.name ?? copy.missionControl.bellvitgeNetwork} · {humanizeToken(workspace?.fhirContext?.summary?.focus) || mobile.linkedContext}
                </p>
                <p className="mt-2 text-sm leading-6 text-[#4a7068]">
                  {workspace?.case?.ai?.caseSummary ??
                    mobile.currentCaseSummaryPending}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(workspace?.case?.riskSignals ?? []).map((signal) => (
                    <Badge key={signal} className="rounded-full border border-[#2a9e90]/30 bg-white text-[10px] uppercase tracking-[0.16em] text-[#1a6860]">
                      {humanizeToken(signal)}
                    </Badge>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button className="rounded-full bg-[#2a9e90] text-white hover:bg-[#3ab5a8]">
                    {mobile.approve}
                  </Button>
                  <Button variant="outline" className="rounded-full border-[#2a9e90] text-[#1a6860] hover:bg-[#2a9e90]/10">
                    {mobile.requestData}
                  </Button>
                </div>
              </div>
            </section>

            <section id="profile" className="rounded-[28px] border border-black/5 bg-white/80 p-4 shadow-[0_20px_50px_rgba(15,30,28,0.07)] backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{mobile.trustModel}</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">{mobile.whatKeepsSafe}</h2>
                </div>
                <CheckCircle2 className="h-5 w-5 text-[#2a9e90]" />
              </div>
              <ul className="space-y-3 text-sm leading-6 text-slate-700">
                {mobile.trustPoints.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </div>
        ) : (
          <div className="space-y-4">
            <section id="explore" className="rounded-[28px] border border-black/5 bg-white/80 p-4 shadow-[0_20px_50px_rgba(15,30,28,0.07)] backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{mobile.patientCompanion}</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">{mobile.safePatientFlow}</h2>
                </div>
                <HeartPulse className="h-5 w-5 text-rose-600" />
              </div>
              <div className="space-y-3">
                <ReminderCard
                  icon={Syringe}
                  title={mobile.medicationReminder}
                  text={mobile.medicationReminderText}
                />
                <ReminderCard
                  icon={Clock3}
                  title={mobile.labReminder}
                  text={mobile.labReminderText}
                />
                <ReminderCard
                  icon={ShieldAlert}
                  title={mobile.validatedInstructions}
                  text={mobile.validatedInstructionsText}
                />
              </div>
            </section>

            <section className="rounded-[28px] border border-black/5 bg-white/80 p-4 shadow-[0_20px_50px_rgba(15,30,28,0.07)] backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{mobile.symptomRouting}</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">{mobile.structuredReviewInput}</h2>
                </div>
                <ShieldAlert className="h-5 w-5 text-amber-600" />
              </div>
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-950">{mobile.patientMessage}</p>
                <p className="mt-2 text-sm leading-6 text-amber-900/80">
                  {mobile.patientMessageText}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['injection_site_reaction', 'fever', 'needs_clinical_review'].map((item) => (
                    <Badge key={item} className="rounded-full border border-amber-200 bg-white text-[10px] uppercase tracking-[0.16em] text-amber-900">
                      {humanizeToken(item)}
                    </Badge>
                  ))}
                </div>
                <p className="mt-4 text-sm leading-6 text-amber-900/80">
                  {mobile.patientRoutingText}
                </p>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-center">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/55">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </div>
  )
}

function ReminderCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Syringe
  title: string
  text: string
}) {
  return (
    <div className="rounded-3xl border border-black/5 bg-slate-950/[0.03] p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2a9e90]/10 text-[#1a6860]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
        </div>
      </div>
    </div>
  )
}
