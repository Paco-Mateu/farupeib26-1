'use client'

import { BarChart3, TrendingDown, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'

import { WorkspaceEmptyState, WorkspaceErrorState, WorkspaceLoadingState } from '@/components/pkpd/pro/workspace-state'
import type { ReportingData } from '@/components/pkpd/pro/xarxa-types'
import { fetchJson } from '@/lib/fetch-json'

type KpiCard = { label: string; value: number; unit?: string; trend?: string; up?: boolean }

type BarData = { label: string; value: number; max: number }

function SimpleBarChart({ data, colorClass }: { data: BarData[]; colorClass: string }) {
  return (
    <div className="space-y-2.5">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <p className="w-44 shrink-0 truncate text-xs text-[#4a7068]">{d.label}</p>
          <div className="flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-2 rounded-full ${colorClass}`}
              style={{ width: `${(d.value / d.max) * 100}%` }}
            />
          </div>
          <span className="w-6 shrink-0 text-right text-xs font-semibold text-[#152520]">{d.value}</span>
        </div>
      ))}
    </div>
  )
}

export function Reporting({
  centerId = '',
  programId = '',
  dateRangeDays = 30,
}: {
  centerId?: string
  programId?: string
  dateRangeDays?: number
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
        if (dateRangeDays > 0) params.set('days', String(dateRangeDays))
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
  }, [reloadKey, centerId, programId, dateRangeDays])

  const kpis = (data?.kpis ?? []) as KpiCard[]
  const chartGroups = (data?.charts ?? []).map((group) => {
    const max = Math.max(...group.data.map((item) => item.value), 1)
    return {
      label: group.label,
      data: group.data.map((item) => ({ ...item, max })),
    }
  })
  const getKpiValue = (label: string) => kpis.find((item) => item.label === label)?.value ?? 0
  const automationRuns = getKpiValue('Pasos IA ejecutados')
  const automationCases = getKpiValue('Casos preparados por IA')
  const automationDrafts = getKpiValue('Borradores clínicos')
  const automationMinutes = getKpiValue('Minutos automatizados')

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
        <div className="mb-6 rounded-[28px] border border-[#8dc63f]/20 bg-[#f0f7e3] p-5">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5a7820]">
                Automatización supervisada
              </p>
              <h3 className="mt-2 text-xl font-semibold text-[#152520]">
                La red ya puede cuantificar cuánto trabajo preparan los agentes antes de la validación profesional.
              </h3>
              <p className="mt-2 text-sm leading-7 text-[#4a7068]">
                Este panel resume cuántos pasos IA se han ejecutado, cuántos casos han llegado ya estructurados, cuántos borradores clínicos se han preparado y qué ahorro operativo estimado está generando el circuito.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:w-[420px]">
              <AutomationImpactCard label="Pasos IA" value={String(automationRuns)} note="Ejecuciones registradas" />
              <AutomationImpactCard label="Casos preparados" value={String(automationCases)} note="Casos tocados por IA" />
              <AutomationImpactCard label="Borradores" value={String(automationDrafts)} note="Recomendaciones y notas" />
              <AutomationImpactCard label="Ahorro estimado" value={`${automationMinutes} min`} note="Tiempo manual desplazado" />
            </div>
          </div>
        </div>

        {/* KPI grid */}
        <div className="mb-6 grid grid-cols-3 gap-3">
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
        <div className="grid grid-cols-2 gap-4">
          {chartGroups.map((group, index) => (
            <div key={group.label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#4a7068]">
                {group.label}
              </p>
              <SimpleBarChart
                data={group.data}
                colorClass={index % 2 === 0 ? 'bg-[#8dc63f]' : 'bg-violet-400'}
              />
            </div>
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
