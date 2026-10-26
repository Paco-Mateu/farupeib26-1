'use client'

import { Activity, Bot, CheckCircle2, Loader2 } from 'lucide-react'
import type * as React from 'react'
import { useEffect, useState } from 'react'

import { useXarxaT } from '@/components/i18n/use-xarxa-strings'
import type { CasoCompleto } from '@/components/pkpd/pro/xarxa-types'

export function AgentExecutionRail({
  title,
  steps,
}: {
  title: string
  steps: string[]
}) {
  const t = useXarxaT('cockpit-review')
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    setActiveStep(0)
    const timer = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % steps.length)
    }, 950)
    return () => window.clearInterval(timer)
  }, [steps])

  return (
    <div className="rounded-xl border border-[#7b3fa0]/20 bg-white px-3 py-3 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#7b3fa0]/10">
          <Bot className="h-4 w-4 text-[#7b3fa0]" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7b3fa0]">{t('rail.label')}</p>
          <p className="text-xs font-semibold text-slate-900">{title}</p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {steps.map((step, index) => {
          const isDone = index < activeStep
          const isRunning = index === activeStep
          return (
            <div
              key={step}
              className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-[11px] transition ${
                isRunning
                  ? 'border-[#7b3fa0]/20 bg-[#faf6fd] text-[#7b3fa0]'
                  : isDone
                    ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                    : 'border-slate-100 bg-slate-50 text-slate-400'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              ) : isRunning ? (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
              ) : (
                <div className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-slate-200" />
              )}
              <span className={isRunning ? 'font-semibold' : ''}>{step}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Tab: Auditoría ────────────────────────────────────────────────────────────

export function TabAuditoria({ caso }: { caso: CasoCompleto }) {
  const t = useXarxaT('cockpit-review')
  const auditEvents = [
    { event: t('audit.event.created'), timestamp: caso.createdAt, actor: caso.requesterName },
    ...((caso.timeline ?? [])
      .filter((event) => event.lane === 'Decisiones' || event.lane === 'Tareas')
      .map((event) => ({
        event: event.label,
        timestamp: event.date,
        actor: [((event as any).actorName ?? event.lane), ((event as any).actorRole ?? null), ((event as any).actorCenter ?? null)]
          .filter(Boolean)
          .join(' · '),
      }))),
    ...(caso.agentRuns ?? []).map((run) => ({
      event: `${run.agent}: ${run.message}`,
      timestamp: run.timestamp,
      actor: run.agent,
    })),
    { event: t('audit.event.updated'), timestamp: caso.updatedAt, actor: caso.assignedName },
  ].sort((a, b) => a.timestamp.localeCompare(b.timestamp))

  return (
    <div className="space-y-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-[#4a7068]">{t('audit.trail').replaceAll('{caseId}', caso.caseId)}</p>
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <table className="min-w-full text-left">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-[0.16em] text-[#4a7068]">
            <tr>
              <th className="px-4 py-3 font-medium">{t('audit.col.evento')}</th>
              <th className="px-4 py-3 font-medium">{t('audit.col.actor')}</th>
              <th className="px-4 py-3 font-medium">{t('audit.col.fecha')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {auditEvents.map((ev, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm text-[#152520]">{ev.event}</td>
                <td className="px-4 py-3 text-sm text-[#4a7068]">{ev.actor}</td>
                <td className="px-4 py-3 text-xs text-slate-400">
                  {new Date(ev.timestamp).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Shared helpers ────────────────────────────────────────────────────────────

export function Section({ title, icon: Icon, children }: { title: string; icon: typeof Activity; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#7b3fa0]" />
        <p className="text-[10px] uppercase tracking-[0.18em] text-[#4a7068]">{title}</p>
      </div>
      {children}
    </div>
  )
}
