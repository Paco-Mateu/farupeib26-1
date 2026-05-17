'use client'

import {
  Activity,
  AlertTriangle,
  Bot,
  Building2,
  ClipboardList,
  FileStack,
  GitBranch,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type Datum = { label: string; value: number }

const CHART_COLORS = ['#8dc63f', '#7b3fa0', '#1f8a70', '#4f46e5', '#f97316', '#dc2626', '#0f766e']

export function ReportingChartCard({
  label,
  data,
}: {
  label: string
  data: Datum[]
}) {
  const variant = pickVariant(label, data)
  const icon = pickIcon(label)

  return (
    <section className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#4a7068]">Indicador</p>
          <h3 className="mt-1 text-sm font-semibold text-[#152520]">{label}</h3>
        </div>
        <div className="rounded-2xl bg-[#f5f8f5] p-2 text-[#4a7068]">
          {icon}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-[#fbfcfb] px-4 py-8 text-center text-sm text-slate-400">
          Sin datos para este indicador con los filtros actuales.
        </div>
      ) : variant === 'pie' ? (
        <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
          <div className="h-[210px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<DefaultTooltip />} />
                <Pie
                  data={data}
                  innerRadius={54}
                  outerRadius={82}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="label"
                >
                  {data.map((entry, index) => (
                    <Cell key={entry.label} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <LegendList data={data} />
        </div>
      ) : (
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[...data].sort((a, b) => b.value - a.value)}
              layout="vertical"
              margin={{ top: 6, right: 14, left: 22, bottom: 0 }}
              barCategoryGap={12}
            >
              <CartesianGrid stroke="#edf1ee" horizontal={false} />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#4a7068' }} />
              <YAxis
                type="category"
                dataKey="label"
                width={132}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#152520' }}
              />
              <Tooltip content={<DefaultTooltip />} cursor={{ fill: '#f3f7f3' }} />
              <Bar dataKey="value" radius={[0, 8, 8, 0]} fill="#8dc63f">
                {data.map((entry, index) => (
                  <Cell key={entry.label} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}

function LegendList({ data }: { data: Datum[] }) {
  return (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-[#fbfcfb] px-3 py-2.5">
          <div className="flex items-center gap-3">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
            />
            <span className="text-sm text-[#152520]">{item.label}</span>
          </div>
          <span className="text-sm font-semibold text-[#152520]">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

function DefaultTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value?: number; name?: string; payload?: Datum }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const datum = payload[0]?.payload
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-[#152520]">{datum?.label ?? label}</p>
      <p className="mt-1 text-xs text-[#4a7068]">Valor: {payload[0]?.value ?? 0}</p>
    </div>
  )
}

function pickVariant(label: string, data: Datum[]) {
  const normalized = label.toLowerCase()
  if (normalized.includes('sesiones') || normalized.includes('borradores') || data.length <= 3) return 'pie'
  return 'bar'
}

function pickIcon(label: string) {
  const normalized = label.toLowerCase()
  if (normalized.includes('agente') || normalized.includes('automatización')) return <Bot className="h-4 w-4" />
  if (normalized.includes('gaps')) return <AlertTriangle className="h-4 w-4" />
  if (normalized.includes('centro')) return <Building2 className="h-4 w-4" />
  if (normalized.includes('estado')) return <GitBranch className="h-4 w-4" />
  if (normalized.includes('tipo')) return <ClipboardList className="h-4 w-4" />
  if (normalized.includes('borradores')) return <FileStack className="h-4 w-4" />
  return <Activity className="h-4 w-4" />
}
