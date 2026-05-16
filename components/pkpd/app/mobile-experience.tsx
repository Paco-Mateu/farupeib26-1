'use client'

import { useEffect, useState } from 'react'
import { BellRing, CheckCircle2, ChevronRight, Clock3, HeartPulse, MessageSquareMore, ShieldAlert, Syringe } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

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
  high: 'bg-red-500/15 text-red-50 border-red-300/25',
  medium: 'bg-amber-400/15 text-amber-50 border-amber-200/20',
}

export function MobileExperience() {
  const [queue, setQueue] = useState<MobileCase[]>([])
  const [workspace, setWorkspace] = useState<MobileWorkspace | null>(null)
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [activeProfile, setActiveProfile] = useState<'pharmacist' | 'patient'>('pharmacist')

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
          <Badge className="rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-emerald-100">
            On-call pharmacist
          </Badge>
          <h1 className="mt-4 font-serif text-4xl leading-none tracking-tight">Network alerts, ready on mobile.</h1>
          <p className="mt-3 text-sm leading-6 text-white/78">
            Review AI-prepared case summaries, validate interventions, or escalate to Bellvitge while the case is still moving.
          </p>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <MiniMetric label="Alerts" value={String(queue.length || 0)} />
            <MiniMetric label="Urgent" value={String(queue.filter((item) => item.priority === 'high').length)} />
            <MiniMetric label="Protocol" value={workspace?.protocolMatch?.protocol?.title ? 'Live' : 'Pending'} />
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
              Pharmacist
            </button>
            <button
              onClick={() => setActiveProfile('patient')}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                activeProfile === 'patient' ? 'bg-slate-950 text-white' : 'text-slate-600'
              }`}
            >
              Patient
            </button>
          </div>
        </div>

        {activeProfile === 'pharmacist' ? (
          <div className="space-y-4">
            <section id="search" className="rounded-[28px] border border-black/5 bg-white/80 p-4 shadow-[0_20px_50px_rgba(15,30,28,0.07)] backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Assigned cases</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">Pharmacist alert stack</h2>
                </div>
                <BellRing className="h-5 w-5 text-emerald-700" />
              </div>
              <div className="space-y-3">
                {queue.map((item) => {
                  const selected = item._id === selectedCaseId
                  return (
                    <button
                      key={item._id}
                      onClick={() => selectCase(item._id)}
                      className={`w-full rounded-3xl border p-4 text-left transition ${
                        selected ? 'border-emerald-300/70 bg-emerald-50' : 'border-black/5 bg-slate-950/[0.03]'
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <Badge className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${tones[item.priority] ?? tones.medium}`}>
                          {item.priority}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {item.drugName} · {item.patientSnapshot?.displayName}
                      </h3>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                        {item.originHospitalName ?? 'Network hospital'}
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
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Voice and review</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">Expert action lane</h2>
                </div>
                <MessageSquareMore className="h-5 w-5 text-emerald-700" />
              </div>
              <div className="rounded-3xl border border-emerald-200/50 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-950">Current live case</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-emerald-900/60">
                  {workspace?.originHospital?.name ?? 'Bellvitge network'} · {workspace?.fhirContext?.summary?.focus?.replaceAll('_', ' ') ?? 'linked context'}
                </p>
                <p className="mt-2 text-sm leading-6 text-emerald-900/80">
                  {workspace?.case?.ai?.caseSummary ??
                    'The mobile app will show the active case summary here once the workspace is loaded.'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(workspace?.case?.riskSignals ?? []).map((signal) => (
                    <Badge key={signal} className="rounded-full border border-emerald-200 bg-white/70 text-[10px] uppercase tracking-[0.16em] text-emerald-900">
                      {signal.replaceAll('_', ' ')}
                    </Badge>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button className="rounded-full bg-emerald-600 text-white hover:bg-emerald-500">
                    Approve
                  </Button>
                  <Button variant="outline" className="rounded-full border-emerald-200 text-emerald-900 hover:bg-emerald-100">
                    Request data
                  </Button>
                </div>
              </div>
            </section>

            <section id="profile" className="rounded-[28px] border border-black/5 bg-white/80 p-4 shadow-[0_20px_50px_rgba(15,30,28,0.07)] backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Trust model</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">What keeps the workflow safe</h2>
                </div>
                <CheckCircle2 className="h-5 w-5 text-emerald-700" />
              </div>
              <ul className="space-y-3 text-sm leading-6 text-slate-700">
                <li>Deterministic triage computes priority before any LLM text is generated.</li>
                <li>Protocol retrieval is bounded to approved network content.</li>
                <li>Mobile actions support review, escalation, and documentation rather than autonomous dosing.</li>
                <li>Every expert decision can be converted into a reusable knowledge product.</li>
              </ul>
            </section>
          </div>
        ) : (
          <div className="space-y-4">
            <section id="explore" className="rounded-[28px] border border-black/5 bg-white/80 p-4 shadow-[0_20px_50px_rgba(15,30,28,0.07)] backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Patient companion</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">Safe, conservative patient flow</h2>
                </div>
                <HeartPulse className="h-5 w-5 text-rose-600" />
              </div>
              <div className="space-y-3">
                <ReminderCard
                  icon={Syringe}
                  title="Medication reminder"
                  text="Confirm the last administration and the next lab draw. The care team sees adherence gaps before the review meeting."
                />
                <ReminderCard
                  icon={Clock3}
                  title="Lab draw reminder"
                  text="You have a therapeutic monitoring blood draw tomorrow at 08:30. Follow your hospital’s preparation instructions."
                />
                <ReminderCard
                  icon={ShieldAlert}
                  title="Validated instructions"
                  text="Professional instructions are translated into plain language after clinician review. The app does not diagnose."
                />
              </div>
            </section>

            <section className="rounded-[28px] border border-black/5 bg-white/80 p-4 shadow-[0_20px_50px_rgba(15,30,28,0.07)] backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Symptom routing</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">Free text becomes structured review input</h2>
                </div>
                <ShieldAlert className="h-5 w-5 text-amber-600" />
              </div>
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-950">Patient message</p>
                <p className="mt-2 text-sm leading-6 text-amber-900/80">
                  “I have a red bump where I injected the medicine and I also have fever.”
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['injection_site_reaction', 'fever', 'needs_clinical_review'].map((item) => (
                    <Badge key={item} className="rounded-full border border-amber-200 bg-white text-[10px] uppercase tracking-[0.16em] text-amber-900">
                      {item.replaceAll('_', ' ')}
                    </Badge>
                  ))}
                </div>
                <p className="mt-4 text-sm leading-6 text-amber-900/80">
                  Your message has been sent to your care team for review. If symptoms worsen rapidly, or if you have breathing difficulty or severe fever, follow your hospital’s emergency instructions.
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
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
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
