'use client'

import type * as React from 'react'
import {
  Cell, Pie, PieChart, PolarAngleAxis, PolarGrid, Radar, RadarChart,
  ResponsiveContainer, Tooltip,
} from 'recharts'

import { useXarxaT } from '@/components/i18n/use-xarxa-strings'

import type { PkpdStatus } from './shared'

const PolarAngleAxisCompat = PolarAngleAxis as unknown as React.ComponentType<any>

// ── Visualization components ──────────────────────────────────────────────────

// 1. Therapeutic window gauge (SVG)
const DRUG_RANGES: Array<{ pattern: RegExp; lo: number; hi: number; max: number; unit: string }> = [
  { pattern: /infliximab|inflectra|remsima/i, lo: 3,  hi: 7,   max: 15,  unit: 'µg/mL' },
  { pattern: /adalimumab|humira/i,            lo: 5,  hi: 12,  max: 25,  unit: 'µg/mL' },
  { pattern: /vedolizumab|entyvio/i,          lo: 10, hi: 40,  max: 80,  unit: 'µg/mL' },
  { pattern: /ustekinumab|stelara/i,          lo: 1,  hi: 4.5, max: 10,  unit: 'µg/mL' },
]
const DEFAULT_RANGE = { lo: 3, hi: 7, max: 15, unit: 'µg/mL' }
function resolveRange(drugLine: string) {
  return DRUG_RANGES.find(r => r.pattern.test(drugLine)) ?? DEFAULT_RANGE
}

export function TherapeuticWindowGauge({ value, unit, drugLine, status }: {
  value: number | null; unit: string; drugLine: string; status: PkpdStatus
}) {
  const t = useXarxaT('cockpit-root')
  const range = resolveRange(drugLine)
  const { lo, hi, max } = range
  const pct = (v: number) => Math.min(100, Math.max(0, (v / max) * 100))
  return (
    <div className={`rounded-xl border ${status.border} ${status.bg} px-5 py-4`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#4a7068]">{t('chart.concentracion')}</p>
          <p className={`mt-0.5 text-3xl font-bold tabular-nums ${status.color}`}>
            {value !== null ? `${value} ${unit}`.trim() : '—'}
          </p>
          <p className={`mt-0.5 text-xs font-semibold ${status.color}`}>{t(status.label)}</p>
        </div>
        <div className={`rounded-xl border ${status.border} bg-white px-3 py-1.5 text-center`}>
          <p className="text-[9px] uppercase tracking-wide text-slate-400">{t('chart.objetivo')}</p>
          <p className="text-xs font-bold text-[#152520]">{lo}–{hi}</p>
          <p className="text-[9px] text-slate-400">{range.unit}</p>
        </div>
      </div>
      <div className="mt-4 space-y-1.5">
        <div className="relative h-5 w-full rounded-full overflow-hidden">
          <div className="absolute inset-y-0 left-0 rounded-l-full bg-red-200/70" style={{ width: `${pct(lo)}%` }} />
          <div className="absolute inset-y-0 bg-emerald-200/90"
            style={{ left: `${pct(lo)}%`, width: `${pct(hi) - pct(lo)}%` }} />
          <div className="absolute inset-y-0 right-0 rounded-r-full bg-orange-200/70" style={{ left: `${pct(hi)}%` }} />
          <div className="absolute inset-y-0 w-0.5 bg-white/80" style={{ left: `${pct(lo)}%` }} />
          <div className="absolute inset-y-0 w-0.5 bg-white/80" style={{ left: `${pct(hi)}%` }} />
          {value !== null && (
            <div className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2" style={{ left: `${pct(value)}%` }}>
              <div className={`h-6 w-2.5 rounded-full border-2 border-white shadow-md ${status.dot}`} />
            </div>
          )}
        </div>
        <div className="flex justify-between text-[9px] text-slate-400">
          <span>0</span>
          <span className="font-medium text-emerald-600">{t('chart.rangoObjetivo').replaceAll('{lo}', String(lo)).replaceAll('{hi}', String(hi)).replaceAll('{unit}', range.unit)}</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  )
}

// 2. Case health radar (Recharts)
export function CaseHealthRadar({ completeness, confidence, priority, gapCount, gapCritical }: {
  completeness: number; confidence: string; priority: string
  gapCount: number; gapCritical: number
}) {
  const t = useXarxaT('cockpit-root')
  const confScore = confidence === 'Alta' ? 90 : confidence === 'Media' ? 60 : 35
  const riskScore = priority === 'Alta' ? 25 : priority === 'Media' ? 60 : 90
  const gapsScore = gapCount === 0 ? 100 : Math.max(10, 100 - gapCritical * 30 - (gapCount - gapCritical) * 10)
  const data = [
    { axis: t('chart.completitud'), value: completeness },
    { axis: t('chart.confianza'), value: confScore },
    { axis: t('chart.sinRiesgo'), value: riskScore },
    { axis: t('chart.gapsOk'), value: gapsScore },
  ]
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-[#4a7068]">{t('chart.saludCaso')}</p>
      <div className="mt-1 flex items-start gap-2">
        <ResponsiveContainer width="55%" height={160}>
          <RadarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxisCompat dataKey="axis" tick={{ fontSize: 9, fill: '#4a7068' }} />
            <Radar dataKey="value" stroke="#7b3fa0" fill="#7b3fa0" fillOpacity={0.18} strokeWidth={1.5} />
          </RadarChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2 pt-3">
          {[
            { label: t('chart.completitud'), value: `${completeness}%` },
            { label: t('chart.confianza'), value: confidence || '—' },
            { label: t('chart.riesgo'), value: priority === 'Alta' ? t('chart.alto') : priority === 'Media' ? t('chart.medio') : t('chart.bajo') },
            { label: t('chart.gaps'), value: t('chart.gapsValor').replaceAll('{count}', String(gapCount)).replaceAll('{critical}', String(gapCritical)) },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-baseline justify-between gap-2 text-xs">
              <span className="text-slate-500">{label}</span>
              <span className="font-semibold text-[#152520]">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// 3. Gaps severity donut (Recharts)
export function GapSeverityDonut({ gaps, activeFilter, onFilter }: {
  gaps: Array<{ severity: string }>
  activeFilter: string | null
  onFilter: (s: string | null) => void
}) {
  const t = useXarxaT('cockpit-root')
  const COLORS: Record<string, string> = { Crítico: '#ef4444', Importante: '#f59e0b', Informativo: '#3b82f6' }
  const data = Object.entries(COLORS)
    .map(([name, color]) => ({ name, value: gaps.filter(g => g.severity === name).length, color }))
    .filter(d => d.value > 0)
  if (data.length === 0) return null
  return (
    <div className="flex items-center gap-4">
      <PieChart width={80} height={80}>
        <Pie data={data} dataKey="value" cx={36} cy={36} innerRadius={22} outerRadius={36}
          strokeWidth={0}
          onClick={(_, index) => {
            const item = data[index]
            if (!item) return
            onFilter(activeFilter === item.name ? null : item.name)
          }}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} opacity={activeFilter && activeFilter !== entry.name ? 0.25 : 1} />
          ))}
        </Pie>
      </PieChart>
      <div className="space-y-1.5">
        {data.map(({ name, value, color }) => (
          <button key={name} onClick={() => onFilter(activeFilter === name ? null : name)}
            className={`flex items-center gap-2 rounded-full px-2.5 py-0.5 text-[10px] font-medium transition ${activeFilter === name ? 'ring-2 ring-offset-1' : 'opacity-70 hover:opacity-100'}`}
            style={{ backgroundColor: color + '18', color }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
            {value} {t(name)}
          </button>
        ))}
        {activeFilter && (
          <button onClick={() => onFilter(null)} className="text-[10px] text-slate-400 underline hover:text-slate-600">
            {t('chart.verTodos')}
          </button>
        )}
      </div>
    </div>
  )
}

// 5. Confidence radar — TabAnalisis
export function ConfidenceRadar({ completeness, confidence }: { completeness: number; confidence: string }) {
  const t = useXarxaT('cockpit-root')
  const confScore = confidence === 'Alta' ? 90 : confidence === 'Media' ? 65 : 40
  const coherence = Math.min(100, completeness + 10)
  const data = [
    { axis: t('chart.determinantes'), value: completeness },
    { axis: t('chart.interpretabilidad'), value: confScore },
    { axis: t('chart.coherencia'), value: coherence },
  ]
  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width={140} height={140}>
        <RadarChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxisCompat dataKey="axis" tick={{ fontSize: 9, fill: '#4a7068' }} />
          <Radar dataKey="value" stroke="#7b3fa0" fill="#7b3fa0" fillOpacity={0.2} strokeWidth={1.5} />
          <Tooltip formatter={(v) => [`${String(v ?? 0)}%`]} />
        </RadarChart>
      </ResponsiveContainer>
      <div className="flex-1 space-y-2.5">
        {data.map((d) => (
          <div key={d.axis}>
            <div className="flex justify-between text-xs">
              <span className="text-[#152520]">{d.axis}</span>
              <span className="text-[#4a7068]">{d.value}%</span>
            </div>
            <div className="mt-0.5 h-1 rounded-full bg-slate-100">
              <div className="h-1 rounded-full bg-[#7b3fa0]/60" style={{ width: `${d.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 6. Lab bullet chart (SVG)
const LAB_REFS: Array<{ pattern: RegExp; lo: number; hi: number; max: number; unit: string }> = [
  { pattern: /infliximab|inflectra|remsima/i,    lo: 3,  hi: 7,   max: 15,   unit: 'µg/mL' },
  { pattern: /adalimumab|humira/i,               lo: 5,  hi: 12,  max: 25,   unit: 'µg/mL' },
  { pattern: /vedolizumab|entyvio/i,             lo: 10, hi: 40,  max: 80,   unit: 'µg/mL' },
  { pattern: /anti.*(drug|fármaco|infliximab)/i, lo: 0,  hi: 50,  max: 200,  unit: 'AU/mL' },
  { pattern: /calprotect/i,                      lo: 0,  hi: 250, max: 1000, unit: 'µg/g' },
  { pattern: /pcr|crp|prote.*react/i,            lo: 0,  hi: 5,   max: 50,   unit: 'mg/L' },
  { pattern: /albúmina|albumin/i,                lo: 35, hi: 52,  max: 60,   unit: 'g/L' },
  { pattern: /hemoglobin|hb\b/i,                 lo: 12, hi: 16,  max: 20,   unit: 'g/dL' },
]
export function LabBulletChart({ determinants }: {
  determinants: Array<{ label: string; value: unknown; unit?: string | null; interpretation?: string | null }>
}) {
  if (determinants.length === 0) return null
  return (
    <div className="space-y-3.5">
      {determinants.map((det, i) => {
        const val = typeof det.value === 'number' ? det.value : parseFloat(String(det.value))
        const ref = LAB_REFS.find(r => r.pattern.test(det.label))
        if (!ref || isNaN(val)) {
          return (
            <div key={i} className="flex items-center justify-between rounded-xl border border-slate-100 bg-[#f8faf9] px-3 py-2 text-sm">
              <span className="text-[#4a7068]">{det.label}</span>
              <span className="font-semibold text-[#152520]">{String(det.value)} {det.unit ?? ''}</span>
            </div>
          )
        }
        const pct = (v: number) => Math.min(100, Math.max(0, (v / ref.max) * 100))
        const valPct = pct(val)
        const inRange = val >= ref.lo && val <= ref.hi
        const color = inRange ? '#22c55e' : val < ref.lo ? '#f59e0b' : '#ef4444'
        return (
          <div key={i}>
            <div className="flex items-baseline justify-between text-xs mb-1">
              <span className="text-[#4a7068]">{det.label}</span>
              <span className="font-bold tabular-nums" style={{ color }}>
                {String(det.value)} {det.unit ?? ref.unit}
              </span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="absolute inset-y-0 bg-emerald-100"
                style={{ left: `${pct(ref.lo)}%`, width: `${pct(ref.hi) - pct(ref.lo)}%` }} />
              <div className="absolute inset-y-0 w-0.5 bg-white" style={{ left: `${pct(ref.lo)}%` }} />
              <div className="absolute inset-y-0 w-0.5 bg-white" style={{ left: `${pct(ref.hi)}%` }} />
              <div className="absolute top-0.5 bottom-0.5 w-2 -translate-x-1/2 rounded-full shadow"
                style={{ left: `${valPct}%`, backgroundColor: color }} />
            </div>
            <div className="mt-0.5 flex justify-between text-[9px] text-slate-300">
              <span>0</span>
              <span className="text-emerald-600">{ref.lo}–{ref.hi} {ref.unit}</span>
              <span>{ref.max}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// 7. Follow-up timeline ruler (SVG)
export function FollowUpTimelineRuler({ followUps }: {
  followUps: Array<{ label: string; dueDate?: string | null; status: string }>
}) {
  const t = useXarxaT('cockpit-root')
  const upcoming = followUps
    .filter(f => f.dueDate)
    .map(f => ({ ...f, date: new Date(f.dueDate!) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
  if (upcoming.length === 0) return null
  const today = new Date()
  const latest = upcoming[upcoming.length - 1].date
  const spanMs = Math.max(latest.getTime() - today.getTime(), 1000 * 60 * 60 * 24 * 7)
  const pct = (d: Date) => Math.min(97, Math.max(3, ((d.getTime() - today.getTime()) / spanMs) * 92 + 5))
  const fmt = (d: Date) => d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="mb-5 text-[10px] uppercase tracking-[0.18em] text-[#4a7068]">{t('chart.cronograma')}</p>
      <div className="relative py-7">
        <div className="absolute left-[3%] right-[3%] top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-slate-200" />
        {/* Today */}
        <div className="absolute top-1/2 left-[3%] -translate-y-1/2 -translate-x-1/2">
          <div className="h-3.5 w-3.5 animate-pulse rounded-full bg-[#7b3fa0] ring-4 ring-[#7b3fa0]/20" />
          <p className="absolute top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold text-[#7b3fa0]">{t('chart.hoy')}</p>
        </div>
        {upcoming.map((f, i) => {
          const x = pct(f.date)
          const isDone = f.status === 'Completado'
          const above = i % 2 === 0
          return (
            <div key={i} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
              style={{ left: `${x}%` }}>
              <div className={`h-3 w-3 rounded-full border-2 border-white shadow ${isDone ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              <div className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] ${above ? 'bottom-5' : 'top-5'}`}>
                <p className="font-medium text-[#152520] text-center">{f.label}</p>
                <p className="text-slate-400 text-center">{fmt(f.date)}</p>
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-400">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#7b3fa0]" />{t('chart.hoy')}</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-400" />{t('chart.pendiente')}</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />{t('chart.completado')}</span>
      </div>
    </div>
  )
}
