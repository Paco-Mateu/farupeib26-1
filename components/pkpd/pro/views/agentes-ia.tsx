'use client'

import { Bot, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { WorkspaceEmptyState, WorkspaceErrorState, WorkspaceLoadingState } from '@/components/pkpd/pro/workspace-state'
import type { Agent } from '@/components/pkpd/pro/xarxa-types'
import { fetchJson } from '@/lib/fetch-json'

const STATUS_STYLE: Record<string, string> = {
  Activo: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200',
  Pausado: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  Inactivo: 'bg-slate-100 text-slate-500',
}

function RunStatusIcon({ status }: { status: string }) {
  if (status === 'Completado') return <CheckCircle2 className="h-3.5 w-3.5 text-teal-500" />
  if (status === 'Error') return <XCircle className="h-3.5 w-3.5 text-red-500" />
  return <Clock className="h-3.5 w-3.5 text-amber-500" />
}

export function AgentesIa() {
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
        setError(loadError instanceof Error ? loadError.message : 'No se han podido cargar los agentes.')
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
          title="Cargando agentes IA…"
          detail="Recuperando capacidades, límites y ejecuciones recientes."
        />
      ) : error ? (
        <WorkspaceErrorState
          title="No se han podido cargar los agentes."
          detail={error}
          onRetry={() => setReloadKey((value) => value + 1)}
        />
      ) : agents.length === 0 ? (
        <WorkspaceEmptyState
          title="No hay agentes configurados."
          detail="Cuando el programa tenga agentes activos aparecerán aquí."
          actionLabel="Recargar"
          onAction={() => setReloadKey((value) => value + 1)}
        />
      ) : (
        <>
          <div className="mb-6 rounded-[28px] border border-[#8dc63f]/20 bg-[#f0f7e3] p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5a7820]">
                  Automatización supervisada en la red
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[#152520]">
                  Los agentes no solo dejan traza: ya están absorbiendo trabajo operativo real.
                </h2>
                <p className="mt-2 text-sm leading-7 text-[#4a7068]">
                  Aquí se ve qué automatiza cada agente, cuántas veces ha intervenido, cuántos casos ha tocado y cuántos borradores deja preparados antes de la validación profesional.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:w-[420px]">
                <ImpactCard label="Pasos IA ejecutados" value={String(summary.totalRuns)} note="Ejecuciones registradas" />
                <ImpactCard label="Casos tocados" value={String(summary.casesTouched)} note="Casos con intervención de agentes" />
                <ImpactCard label="Borradores preparados" value={String(summary.draftsPrepared)} note="Salidas clínicas en borrador" />
                <ImpactCard label="Agentes activos" value={String(agents.filter((agent) => agent.status === 'Activo').length)} note="Capacidades supervisadas en red" />
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Bot className="h-4 w-4 text-[#4a7068]" />
                <p className="text-sm font-semibold text-[#152520]">Registro de agentes</p>
                <span className="rounded-full bg-[#8dc63f] px-1.5 py-0.5 text-[10px] font-bold text-white">
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
                        ? 'border-[#8dc63f]/30 bg-[#f8fcf1] shadow-sm'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf7f6] text-[#1a6860]">
                        <Bot className="h-5 w-5" />
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLE[ag.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {ag.status}
                      </span>
                    </div>
                    <p className="mt-4 text-base font-semibold text-[#152520]">{ag.label}</p>
                    <p className="mt-2 text-sm leading-7 text-[#4a7068]">{ag.function}</p>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <MiniMetric label="Runs" value={String(ag.metrics?.totalRuns ?? 0)} />
                      <MiniMetric label="Casos" value={String(ag.metrics?.casesTouched ?? 0)} />
                      <MiniMetric label="Validación" value={ag.requiresHumanValidation ? 'Sí' : 'No'} />
                      <MiniMetric label="Borradores" value={String(ag.metrics?.draftsPrepared ?? 0)} />
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 text-xs">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                        {ag.requiresHumanValidation ? 'Validación humana obligatoria' : 'Sin validación adicional'}
                      </span>
                      <span className="text-[#4a7068]">
                        {ag.metrics?.lastRunAt
                          ? new Date(ag.metrics.lastRunAt).toLocaleString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Sin actividad'}
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
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#8dc63f]/10">
                        <Bot className="h-4 w-4 text-[#8dc63f]" />
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLE[selected.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {selected.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-[#152520]">{selected.label}</h3>
                    <p className="mt-1 text-sm leading-7 text-[#4a7068]">{selected.function}</p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-[#4a7068]">
                    Trazabilidad operativa
                  </span>
                </div>

                <div className="mb-5 grid gap-3 sm:grid-cols-2">
                  <ImpactCard label="Ejecuciones" value={String(selected.metrics?.totalRuns ?? 0)} note="Runs acumulados" />
                  <ImpactCard label="Casos" value={String(selected.metrics?.casesTouched ?? 0)} note="Casos tocados" />
                  <ImpactCard label="Validación humana" value={selected.requiresHumanValidation ? 'Obligatoria' : 'No'} note="Nivel de supervisión" />
                  <ImpactCard label="Borradores" value={String(selected.metrics?.draftsPrepared ?? 0)} note="Salidas preparadas" />
                </div>

                <div className="mb-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4a7068]">
                    Límites y validación
                  </p>
                  <ul className="space-y-1.5">
                    {selected.limits.map((limit, index) => (
                      <li key={index} className="flex items-start gap-2 text-xs leading-6 text-[#152520]">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8dc63f]" />
                        {limit}
                      </li>
                    ))}
                  </ul>
                  {selected.requiresHumanValidation ? (
                    <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
                      Revisión humana obligatoria antes de usar la salida del agente en el circuito clínico.
                    </div>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4a7068]">
                      Actividad reciente
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
                              <span>{run.caseId || 'Sin caso asociado'}</span>
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
                    <p className="px-4 py-4 text-xs text-[#4a7068]">Sin ejecuciones recientes</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-white p-10 text-sm text-[#4a7068]">
                Selecciona un agente para ver el detalle
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
