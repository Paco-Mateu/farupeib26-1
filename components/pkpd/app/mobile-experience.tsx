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

        <section id="search" className="rounded-[28px] border border-black/5 bg-white/80 p-4 shadow-[0_20px_50px_rgba(15,30,28,0.07)] backdrop-blur-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Assigned cases</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">Pharmacist alert stack</h2>
            </div>
            <BellRing className="h-5 w-5 text-emerald-700" />
          </div>
          <div className="space-y-3">
            {queue.map((item) => (
              <div key={item._id} className="rounded-3xl border border-black/5 bg-slate-950/[0.03] p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <Badge className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${tones[item.priority] ?? tones.medium}`}>
                    {item.priority}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  {item.drugName} · {item.patientSnapshot?.displayName}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.caseReason}</p>
              </div>
            ))}
          </div>
        </section>

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
              title="Symptom escalation"
              text="If you report fever plus injection-site symptoms, the app routes it for clinical review and shows emergency guidance, not a diagnosis."
            />
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
            <p className="mt-2 text-sm leading-6 text-emerald-900/80">
              {workspace?.case?.ai?.caseSummary ??
                'The mobile app will show the active case summary here once the workspace is loaded.'}
            </p>
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
            <li>Patient-facing messages route for review and never claim diagnosis.</li>
            <li>Every expert decision can be converted into a reusable knowledge product.</li>
          </ul>
        </section>
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
