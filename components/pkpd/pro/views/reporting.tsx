'use client'

import { BarChart3, Bot, GitBranch, Sparkles, TrendingDown, TrendingUp } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { ReportingChartCard } from '@/components/pkpd/pro/charts/reporting-charts'
import { WorkspaceEmptyState, WorkspaceErrorState, WorkspaceLoadingState } from '@/components/pkpd/pro/workspace-state'
import type { ReportingData } from '@/components/pkpd/pro/xarxa-types'
import { fetchJson } from '@/lib/fetch-json'

type KpiCard = { label: string; value: number; unit?: string; trend?: string; up?: boolean }

export function Reporting({
  centerId = '',
  programId = '',
}: {
  centerId?: string
  programId?: string
}) {
  const [data, setData] = useState<ReportingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadReporting() {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (centerId) params.set('center', centerId)
        if (programId) params.set('program', programId)
        const payload = await fetchJson<ReportingData>(`/api/xarxa/kpis${params.toString() ? `?${params}` : ''}`)
        if (cancelled) return
        setData(payload)
      } catch (loadError) {
        if (cancelled) return
        setError(loadError instanceof Error ? loadError.message : 'No se ha podido cargar el reporting.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadReporting()

    return () => {
      cancelled = true
    }
  }, [reloadKey, centerId, programId])

  const kpis = useMemo(() => ((data?.kpis ?? []) as KpiCard[]), [data])
  const chartGroups = useMemo(() => data?.charts ?? [], [data])
  const getKpiValue = (...labels: string[]) =>
    labels.reduce<number | null>((found, label) => {
      if (found !== null) return found
      return kpis.find((item) => item.label === label)?.value ?? null
    }, null) ?? 0
  const automationRuns = getKpiValue('Pasos LLM ejecutados', 'Pasos IA ejecutados')
  const automationCases = getKpiValue('Casos preparados por LLM', 'Casos preparados por IA')
  const automationDrafts = getKpiValue('Borradores clínicos LLM', 'Borradores clínicos')
  const chartByLabel = useMemo(
    () => Object.fromEntries(chartGroups.map((group) => [group.label, group.data])),
    [chartGroups]
  )
  const automationByModule = useMemo(
    () => chartByLabel['Automatización por módulo'] ?? [],
    [chartByLabel]
  )
  const automationByStage = useMemo(
    () => chartByLabel['Cobertura LLM por etapa'] ?? [],
    [chartByLabel]
  )
  const automationOutputs = useMemo(
    () => chartByLabel['Salidas generadas por LLM'] ?? [],
    [chartByLabel]
  )
  const automationByCenter = useMemo(
    () => chartByLabel['Impacto LLM por centro'] ?? chartByLabel['Impacto de automatización por centro'] ?? [],
    [chartByLabel]
  )
  const executiveInsights = useMemo(() => {
    const casesByStage = (chartByLabel['Casos por estado'] ?? []).slice().sort((a, b) => b.value - a.value)
    const gaps = (chartByLabel['Gaps más frecuentes'] ?? []).slice().sort((a, b) => b.value - a.value)
    const topModule = automationByModule.slice().sort((a, b) => b.value - a.value)[0]
    const topCenter = automationByCenter.slice().sort((a, b) => b.value - a.value)[0]
    const insights = []
    if (casesByStage[0]) {
      insights.push(`La mayor concentración de casos está en «${casesByStage[0].label}» con ${casesByStage[0].value} caso(s).`)
    }
    if (gaps[0]) {
      insights.push(`El gap más repetido ahora es «${gaps[0].label}» y aparece en ${gaps[0].value} caso(s).`)
    }
    if (topModule) {
      insights.push(`La automatización se concentra sobre todo en ${topModule.label.toLowerCase()} (${topModule.value} ejecuciones).`)
    }
    if (topCenter) {
      insights.push(`${topCenter.label} es el centro con mayor actividad asistida por LLM en este período.`)
    }
    return insights.slice(0, 4)
  }, [automationByCenter, automationByModule, chartByLabel])
  const visibleCharts = chartGroups.filter(
    (group) =>
      ![
        'Automatización por módulo',
        'Cobertura LLM por etapa',
        'Salidas generadas por LLM',
        'Impacto LLM por centro',
        'Impacto de automatización por centro',
      ].includes(group.label)
  )

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="shrink-0 border-b border-slate-100 bg-white px-6 py-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[#4a7068]" />
          <h2 className="text-sm font-semibold text-[#152520]">Informes y actividad</h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
            Programa: Crohn PK/PD
          </span>
        </div>
      </div>

      <div className="flex-1 px-6 py-5">
        {loading ? (
          <WorkspaceLoadingState
            title="Cargando reporting de la red…"
            detail="Preparando KPIs, actividad y distribución de casos."
          />
        ) : error ? (
          <WorkspaceErrorState
            title="No se ha podido cargar el reporting."
            detail={error}
            onRetry={() => setReloadKey((value) => value + 1)}
          />
        ) : !data || (kpis.length === 0 && chartGroups.length === 0) ? (
          <WorkspaceEmptyState
            title="Todavía no hay actividad suficiente."
            detail="Cuando el programa genere casos y seguimiento, aquí aparecerán los indicadores de red."
            actionLabel="Recargar"
            onAction={() => setReloadKey((value) => value + 1)}
          />
        ) : (
          <>
        <div className="mb-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <LlmAutomationDeck
            totalRuns={automationRuns}
            automationCases={automationCases}
            drafts={automationDrafts}
            activeCases={getKpiValue('Casos activos')}
            insights={executiveInsights}
          />
          <div className="space-y-4">
            <AutomationCoverageCard
              title="Módulos con automatización"
              icon={<Bot className="h-4 w-4" />}
              accent="violet"
              data={automationByModule}
            />
            <AutomationCoverageCard
              title="Cobertura de Agentes por etapa"
              icon={<GitBranch className="h-4 w-4" />}
              accent="emerald"
              data={automationByStage}
            />
            <AutomationCoverageCard
              title="Salidas generadas por Agentes"
              icon={<Sparkles className="h-4 w-4" />}
              accent="amber"
              data={automationOutputs}
            />
          </div>
        </div>

        {automationByCenter.length > 0 ? (
          <div className="mb-6">
            <AutomationCoverageCard
              title="Centros con mayor actividad de Agentes"
              icon={<BarChart3 className="h-4 w-4" />}
              accent="sky"
              data={automationByCenter}
              compact={false}
            />
          </div>
        ) : null}

        {/* KPI grid */}
        <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <p className="text-xs text-[#4a7068]">{k.label}</p>
              <p className="mt-1 text-2xl font-bold text-[#152520]">
                {k.value}
                {k.unit && <span className="ml-1 text-sm font-normal text-[#4a7068]">{k.unit}</span>}
              </p>
              {k.trend && (
                <div className="mt-1.5 flex items-center gap-1">
                  {k.up !== undefined && (
                    k.up
                      ? <TrendingUp className="h-3 w-3 text-teal-600" />
                      : <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className="text-[10px] text-[#4a7068]">{k.trend}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-4 xl:grid-cols-2">
          {visibleCharts.map((group) => (
            <ReportingChartCard key={group.label} label={group.label} data={group.data} />
          ))}
        </div>
          </>
        )}
      </div>
    </div>
  )
}

function AutomationImpactCard({
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

function LlmAutomationDeck({
  totalRuns,
  automationCases,
  drafts,
  activeCases,
  insights,
}: {
  totalRuns: number
  automationCases: number
  drafts: number
  activeCases: number
  insights: string[]
}) {
  return (
    <section className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7b3fa0]">Resumen ejecutivo</p>
          <h3 className="mt-1 text-base font-semibold text-[#152520]">Dónde actúa la red y dónde están ayudando más los Agentes</h3>
          <p className="mt-2 text-sm leading-6 text-[#4a7068]">
            Lectura rápida para coordinación: carga activa, cobertura asistida y puntos donde conviene intervenir antes.
          </p>
        </div>
        <div className="rounded-2xl bg-[#faf6fd] p-3 text-[#7b3fa0]">
          <Bot className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AutomationImpactCard label="Pasos de Agentes" value={String(totalRuns)} note="Ejecuciones registradas" />
        <AutomationImpactCard label="Casos preparados" value={String(automationCases)} note="Casos asistidos por Agentes" />
        <AutomationImpactCard label="Borradores" value={String(drafts)} note="Recomendaciones, notas e invitaciones" />
        <AutomationImpactCard label="Cobertura" value={`${automationCases}/${activeCases || 0}`} note="Casos activos con apoyo de Agentes" />
      </div>

      <div className="mt-5 grid gap-2">
        {insights.length > 0 ? (
          insights.map((insight) => (
            <div key={insight} className="rounded-2xl border border-slate-100 bg-[#fbfcfb] px-4 py-3 text-sm text-[#152520]">
              {insight}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-[#fbfcfb] px-4 py-3 text-sm text-[#4a7068]">
            Todavía no hay suficiente actividad como para generar lectura ejecutiva en este período.
          </div>
        )}
      </div>
    </section>
  )
}

function AutomationCoverageCard({
  title,
  icon,
  accent,
  data,
  compact = true,
}: {
  title: string
  icon: React.ReactNode
  accent: 'violet' | 'emerald' | 'amber' | 'sky'
  data: Array<{ label: string; value: number }>
  compact?: boolean
}) {
  const accentStyles: Record<typeof accent, { header: string; chip: string; fill: string }> = {
    violet: { header: 'text-[#7b3fa0]', chip: 'bg-[#faf6fd] text-[#7b3fa0]', fill: 'bg-[#7b3fa0]' },
    emerald: { header: 'text-emerald-700', chip: 'bg-emerald-50 text-emerald-700', fill: 'bg-emerald-500' },
    amber: { header: 'text-amber-700', chip: 'bg-amber-50 text-amber-700', fill: 'bg-amber-500' },
    sky: { header: 'text-sky-700', chip: 'bg-sky-50 text-sky-700', fill: 'bg-sky-500' },
  }
  const style = accentStyles[accent]
  const sorted = [...data].sort((a, b) => b.value - a.value)
  const maxValue = sorted[0]?.value ?? 1
  const visible = compact ? sorted.slice(0, 4) : sorted.slice(0, 6)

  return (
    <section className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${style.header}`}>Cobertura</p>
          <h3 className="mt-1 text-sm font-semibold text-[#152520]">{title}</h3>
        </div>
        <div className={`rounded-2xl p-2 ${style.chip}`}>{icon}</div>
      </div>
      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-[#fbfcfb] px-4 py-6 text-center text-sm text-slate-400">
          Sin señales de Agentes con los filtros actuales.
        </div>
      ) : (
        <div className="space-y-2.5">
          {visible.map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-100 bg-[#fbfcfb] px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-[#152520]">{item.label}</span>
                <span className="text-sm font-semibold text-[#152520]">{item.value}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-white">
                <div
                  className={`h-2 rounded-full ${style.fill}`}
                  style={{ width: `${Math.max(12, Math.round((item.value / maxValue) * 100))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
