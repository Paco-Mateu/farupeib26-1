'use client'

import { ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar, Cell, CartesianGrid } from 'recharts'

import { useXarxaT } from '@/components/i18n/use-xarxa-strings'
import type { TimelineEvent } from '@/components/pkpd/pro/xarxa-types'

const LANE_PALETTE: Record<string, string> = {
  Clínica: '#8b5cf6',
  Tratamiento: '#3b82f6',
  Laboratorio: '#14b8a6',
  Decisiones: '#f59e0b',
  Tareas: '#f97316',
  Administración: '#94a3b8',
}

export function TimelineLaneOverview({
  timeline,
}: {
  timeline: TimelineEvent[]
}) {
  const counts = Object.entries(
    timeline.reduce<Record<string, number>>((acc, event) => {
      acc[event.lane] = (acc[event.lane] ?? 0) + 1
      return acc
    }, {}),
  )
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)

  const t = useXarxaT('charts-timeline')

  if (!counts.length) return null

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#4a7068]">{t('lanes.kicker')}</p>
          <p className="mt-1 text-sm font-semibold text-[#152520]">{t('lanes.title')}</p>
        </div>
        <p className="text-xs text-[#4a7068]">{t('lanes.events.count').replaceAll('{count}', String(timeline.length))}</p>
      </div>

      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={counts} margin={{ top: 6, right: 4, left: 0, bottom: 2 }}>
            <CartesianGrid stroke="#edf1ee" vertical={false} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#4a7068' }}
            />
            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#4a7068' }} />
            <Tooltip content={<LaneTooltip />} cursor={{ fill: '#f5f8f5' }} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {counts.map((entry) => (
                <Cell key={entry.label} fill={LANE_PALETTE[entry.label] ?? '#8dc63f'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function LaneTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ value?: number; payload?: { label: string; value: number } }>
}) {
  const t = useXarxaT('charts-timeline')
  if (!active || !payload?.length) return null
  const datum = payload[0]?.payload
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-[#152520]">{datum?.label}</p>
      <p className="mt-1 text-xs text-[#4a7068]">{t('lanes.tooltip.count').replaceAll('{count}', String(datum?.value ?? ''))}</p>
    </div>
  )
}
