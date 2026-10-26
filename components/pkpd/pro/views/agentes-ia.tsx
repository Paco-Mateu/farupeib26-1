'use client'

import { Bot, CheckCircle2, Clock, Loader2, Sparkles, XCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { useXarxaT } from '@/components/i18n/use-xarxa-strings'
import { WorkspaceEmptyState, WorkspaceErrorState, WorkspaceLoadingState } from '@/components/pkpd/pro/workspace-state'
import type { Agent } from '@/components/pkpd/pro/xarxa-types'
import { fetchJson } from '@/lib/fetch-json'

const STATUS_STYLE: Record<string, string> = {
  Activo: 'bg-[#faf6fd] text-[#7b3fa0] ring-1 ring-[#7b3fa0]/20',
  Pausado: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  Inactivo: 'bg-slate-100 text-slate-500',
}

function RunStatusIcon({ status }: { status: string }) {
  if (status === 'Completado') return <CheckCircle2 className="h-3.5 w-3.5 text-teal-500" />
  if (status === 'Error') return <XCircle className="h-3.5 w-3.5 text-red-500" />
  return <Clock className="h-3.5 w-3.5 text-amber-500" />
}

// Dictionary keys for the simulated agent pipeline steps; resolved with t() at the render site.
function buildAgentStepKeys(agentLabel: string) {
  if (/ingesta/i.test(agentLabel)) {
    return ['steps.ingesta.1', 'steps.ingesta.2', 'steps.ingesta.3', 'steps.ingesta.4']
  }
  if (/gaps/i.test(agentLabel)) {
    return ['steps.gaps.1', 'steps.gaps.2', 'steps.gaps.3', 'steps.gaps.4']
  }
  if (/pk\/pd/i.test(agentLabel)) {
    return ['steps.pkpd.1', 'steps.pkpd.2', 'steps.pkpd.3', 'steps.pkpd.4']
  }
  if (/recomend/i.test(agentLabel)) {
    return ['steps.recomend.1', 'steps.recomend.2', 'steps.recomend.3', 'steps.recomend.4']
  }
  if (/hce|informe/i.test(agentLabel)) {
    return ['steps.hce.1', 'steps.hce.2', 'steps.hce.3', 'steps.hce.4']
  }
  return ['steps.generic.1', 'steps.generic.2', 'steps.generic.3', 'steps.generic.4']
}

function AgentLlmStream({ agent }: { agent: Agent }) {
  const t = useXarxaT('agentes-ia')
  const steps = useMemo(() => buildAgentStepKeys(agent.label), [agent.label])
  const [activeStep, setActiveStep] = useState(0)
  const [visibleChars, setVisibleChars] = useState(0)
  const sourceText = agent.recentRuns?.[0]?.message || agent.function

  useEffect(() => {
    setActiveStep(0)
    const timer = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % steps.length)
    }, 950)
    return () => window.clearInterval(timer)
  }, [steps])

  useEffect(() => {
    setVisibleChars(0)
    const timer = window.setInterval(() => {
      setVisibleChars((current) => {
        if (current >= sourceText.length) return current
        return current + 3
      })
    }, 24)
    return () => window.clearInterval(timer)
  }, [sourceText, agent._id])

  return (
    <div className="rounded-2xl border border-[#7b3fa0]/15 bg-[#faf6fd] p-4">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#7b3fa0]/10">
          <Bot className="h-4 w-4 text-[#7b3fa0]" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7b3fa0]">{t('stream.canal')}</p>
          <p className="text-sm font-semibold text-[#152520]">{agent.label}</p>
        </div>
      </div>
      <div className="mt-3 grid gap-2">
        {steps.map((step, index) => {
          const isDone = index < activeStep
          const isRunning = index === activeStep
          return (
            <div
              key={step}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] transition ${
                isRunning
                  ? 'border-[#7b3fa0]/20 bg-white text-[#7b3fa0]'
                  : isDone
                    ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                    : 'border-slate-100 bg-slate-50 text-slate-400'
              }`}
            >
              {isDone ? (
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
              ) : isRunning ? (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
              ) : (
                <div className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-slate-200" />
              )}
              <span className={isRunning ? 'font-semibold' : ''}>{t(step)}</span>
            </div>
          )
        })}
      </div>
      <div className="mt-3 rounded-xl border border-white bg-white/90 p-3 shadow-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#4a7068]">{t('stream.salida')}</p>
        <p className="mt-2 min-h-[64px] text-sm leading-6 text-[#152520]">
          {sourceText.slice(0, visibleChars)}
          {visibleChars < sourceText.length ? <span className="animate-pulse text-[#7b3fa0]">▍</span> : null}
        </p>
      </div>
    </div>
  )
}

export function AgentesIa() {
  const t = useXarxaT('agentes-ia')
  const [agents, setAgents] = useState<Agent[]>([])
  const [selected, setSelected] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadAgents() {
      setLoading(true)
      setError(null)

      try {
        const payload = await fetchJson<{ items: Agent[] }>('/api/xarxa/agents')
        if (cancelled) return

        const nextAgents = payload.items ?? []
        setAgents(nextAgents)
        setSelected((current) => nextAgents.find((agent) => agent._id === current?._id) ?? nextAgents[0] ?? null)
      } catch (loadError) {
        if (cancelled) return
        setError(loadError instanceof Error ? loadError.message : t('error.load'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadAgents()

    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const summary = useMemo(() => {
    const totalRuns = agents.reduce((sum, agent) => sum + (agent.metrics?.totalRuns ?? 0), 0)
    const casesTouched = agents.reduce((sum, agent) => sum + (agent.metrics?.casesTouched ?? 0), 0)
    const draftsPrepared = agents.reduce(
      (sum, agent) => sum + (agent.metrics?.draftsPrepared ?? 0),
      0
    )
    return { totalRuns, casesTouched, draftsPrepared }
  }, [agents])

  return (
    <div className="flex h-full flex-col overflow-y-auto px-6 py-6">
      {loading ? (
        <WorkspaceLoadingState
          title={t('loading.title')}
          detail={t('loading.detail')}
        />
      ) : error ? (
        <WorkspaceErrorState
          title={t('error.load')}
          detail={error}
          onRetry={() => setReloadKey((value) => value + 1)}
        />
      ) : agents.length === 0 ? (
        <WorkspaceEmptyState
          title={t('empty.title')}
          detail={t('empty.detail')}
          actionLabel={t('empty.action')}
          onAction={() => setReloadKey((value) => value + 1)}
        />
      ) : (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ImpactCard label={t('metric.runs.label')} value={String(summary.totalRuns)} note={t('metric.runs.note')} />
            <ImpactCard label={t('metric.casos.label')} value={String(summary.casesTouched)} note={t('metric.casos.note')} />
            <ImpactCard label={t('metric.borradores.label')} value={String(summary.draftsPrepared)} note={t('metric.borradores.note')} />
            <ImpactCard label={t('metric.activos.label')} value={String(agents.filter((agent) => agent.status === 'Activo').length)} note={t('metric.activos.note')} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Bot className="h-4 w-4 text-[#4a7068]" />
                <p className="text-sm font-semibold text-[#152520]">{t('registro.title')}</p>
                <span className="rounded-full bg-[#7b3fa0] px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {agents.length}
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {agents.map((ag) => (
                  <button
                    key={ag._id}
                    onClick={() => setSelected(ag)}
                    className={`rounded-3xl border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
                      selected?._id === ag._id
                        ? 'border-[#7b3fa0]/30 bg-[#faf6fd] shadow-sm'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7b3fa0]/10 text-[#7b3fa0]">
                        <Bot className="h-5 w-5" />
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLE[ag.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {ag.status}
                      </span>
                    </div>
                    <p className="mt-4 text-base font-semibold text-[#152520]">{ag.label}</p>
                    <p className="mt-2 text-sm leading-7 text-[#4a7068]">{ag.function}</p>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <MiniMetric label={t('mini.runs')} value={String(ag.metrics?.totalRuns ?? 0)} />
                      <MiniMetric label={t('mini.casos')} value={String(ag.metrics?.casesTouched ?? 0)} />
                      <MiniMetric label={t('mini.validacion')} value={ag.requiresHumanValidation ? t('mini.si') : t('mini.no')} />
                      <MiniMetric label={t('mini.borradores')} value={String(ag.metrics?.draftsPrepared ?? 0)} />
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 text-xs">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                        {ag.requiresHumanValidation ? t('card.validacion.obligatoria') : t('card.validacion.sin')}
                      </span>
                      <span className="text-[#4a7068]">
                        {ag.metrics?.lastRunAt
                          ? new Date(ag.metrics.lastRunAt).toLocaleString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : t('card.sinActividad')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selected ? (
              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-6 xl:self-start">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#7b3fa0]/10">
                        <Bot className="h-4 w-4 text-[#7b3fa0]" />
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLE[selected.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {selected.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-[#152520]">{selected.label}</h3>
                    <p className="mt-1 text-sm leading-7 text-[#4a7068]">{selected.function}</p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-[#4a7068]">
                    {t('detalle.trazabilidad')}
                  </span>
                </div>

                <div className="mb-5 grid gap-3 sm:grid-cols-2">
                  <ImpactCard label={t('detalle.ejecuciones.label')} value={String(selected.metrics?.totalRuns ?? 0)} note={t('detalle.ejecuciones.note')} />
                  <ImpactCard label={t('mini.casos')} value={String(selected.metrics?.casesTouched ?? 0)} note={t('detalle.casos.note')} />
                  <ImpactCard label={t('detalle.validacion.label')} value={selected.requiresHumanValidation ? t('detalle.validacion.obligatoria') : t('mini.no')} note={t('detalle.validacion.note')} />
                  <ImpactCard label={t('mini.borradores')} value={String(selected.metrics?.draftsPrepared ?? 0)} note={t('detalle.borradores.note')} />
                </div>

                <div className="mb-5">
                  <AgentLlmStream agent={selected} />
                </div>

                <div className="mb-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4a7068]">
                    {t('detalle.limites')}
                  </p>
                  <ul className="space-y-1.5">
                    {selected.limits.map((limit, index) => (
                      <li key={index} className="flex items-start gap-2 text-xs leading-6 text-[#152520]">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7b3fa0]" />
                        {limit}
                      </li>
                    ))}
                  </ul>
                  {selected.requiresHumanValidation ? (
                    <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
                      {t('detalle.revision')}
                    </div>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4a7068]">
                      {t('detalle.actividad')}
                    </p>
                  </div>
                  {selected.recentRuns && selected.recentRuns.length > 0 ? (
                    <div className="space-y-3 px-4 py-4">
                      {selected.recentRuns.map((run, index) => (
                        <div key={`${run.caseId || run.timestamp}-${index}`} className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <RunStatusIcon status={run.status} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs leading-6 text-[#152520]">{run.message}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-[#4a7068]">
                              <span>{run.caseId || t('run.sinCaso')}</span>
                              <span>·</span>
                              <span>
                                {new Date(run.timestamp).toLocaleString('es-ES', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="px-4 py-4 text-xs text-[#4a7068]">{t('detalle.sinEjecuciones')}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-white p-10 text-sm text-[#4a7068]">
                {t('detalle.seleccionar')}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function ImpactCard({
  label,
  value,
  note,
}: {
  label: string
  value: string
  note: string
}) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white px-4 py-3 shadow-sm">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#4a7068]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[#152520]">{value}</p>
      <p className="mt-1 text-[11px] text-[#4a7068]">{note}</p>
    </div>
  )
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.12em] text-[#4a7068]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#152520]">{value}</p>
    </div>
  )
}
