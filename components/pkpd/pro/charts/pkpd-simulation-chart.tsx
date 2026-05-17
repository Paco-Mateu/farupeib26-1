'use client'

import { AlertTriangle, CheckCircle2, FlaskConical, TrendingUp } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import {
  CartesianGrid,
  Label,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { CasoCompleto } from '@/components/pkpd/pro/xarxa-types'

type ScenarioKind = 'exposure' | 'diagnostic' | 'decision'
type CurveKey = 'current' | 'maintain' | 'raise-light' | 'raise-strong' | 'lower-light' | 'lower-strong'

type ScenarioDescriptor = {
  label: string
  kind: ScenarioKind
  outcome: string
  risk: string
  requirement: string
  note: string
  validationOwner: string
  curveKey?: CurveKey
}

type SimulationPoint = {
  moment: string
  current: number
  selected: number
  targetMin: number
  targetMax: number
}

const LOW_EXPOSURE_CURVES: Record<CurveKey, number[]> = {
  current: [18, 28, 34, 38, 40, 39, 37],
  maintain: [20, 29, 35, 39, 41, 40, 38],
  'raise-light': [21, 33, 43, 50, 54, 53, 50],
  'raise-strong': [22, 36, 48, 58, 62, 60, 57],
  'lower-light': [17, 25, 31, 35, 36, 35, 33],
  'lower-strong': [16, 23, 28, 31, 32, 31, 30],
}

const HIGH_EXPOSURE_CURVES: Record<CurveKey, number[]> = {
  current: [78, 74, 70, 67, 64, 62, 60],
  maintain: [76, 72, 69, 65, 63, 61, 59],
  'raise-light': [80, 76, 73, 70, 67, 65, 63],
  'raise-strong': [82, 79, 76, 73, 70, 68, 66],
  'lower-light': [72, 65, 59, 55, 53, 52, 50],
  'lower-strong': [68, 60, 54, 50, 47, 45, 44],
}

const BALANCED_CURVES: Record<CurveKey, number[]> = {
  current: [44, 48, 52, 54, 55, 54, 53],
  maintain: [45, 49, 53, 55, 56, 55, 54],
  'raise-light': [46, 52, 56, 59, 60, 59, 58],
  'raise-strong': [47, 54, 59, 62, 64, 63, 61],
  'lower-light': [42, 46, 50, 52, 53, 52, 51],
  'lower-strong': [40, 44, 48, 50, 51, 50, 49],
}

const LOW_TARGET = { min: 52, max: 64 }
const HIGH_TARGET = { min: 46, max: 58 }
const BALANCED_TARGET = { min: 50, max: 60 }

const MOMENTS = ['Postdosis', '24 h', '48 h', '72 h', 'Valle', '96 h', '120 h']

export function PkpdSimulationChart({
  caso,
  preferredScenario,
}: {
  caso: CasoCompleto
  preferredScenario?: string | null
}) {
  const scenarios = buildScenarioDescriptors(caso)
  const defaultScenario = preferredScenario && scenarios.some((scenario) => scenario.label === preferredScenario)
    ? preferredScenario
    : scenarios[0]?.label ?? 'Mantener dosis'
  const [selectedScenario, setSelectedScenario] = useState(defaultScenario)

  useEffect(() => {
    setSelectedScenario(defaultScenario)
  }, [defaultScenario, caso.caseId])

  const scenario = scenarios.find((item) => item.label === selectedScenario) ?? scenarios[0]
  const model = buildSimulationModel(caso, scenario)

  return (
    <div className="space-y-5">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.7fr)_340px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#4a7068]">Comparador de escenarios</p>
              <h3 className="mt-1 text-lg font-semibold text-[#152520]">{scenario.label}</h3>
              <p className="mt-1 text-sm text-[#4a7068]">{scenario.outcome}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <LegendChip color="emerald" label="Propuesta" />
              <LegendChip color="rose" label="Situación actual" dashed />
              <LegendChip color="lime" label="Rango diana" soft />
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Impacto esperado" value={scenario.outcome} accent="text-[#152520]" icon={TrendingUp} />
            <MetricCard label="Riesgo" value={scenario.risk} accent={riskAccent(scenario.risk)} icon={AlertTriangle} />
            <MetricCard label="Requiere confirmar" value={scenario.requirement} accent="text-[#152520]" icon={FlaskConical} />
            <MetricCard label="Validación principal" value={scenario.validationOwner} accent="text-[#152520]" icon={CheckCircle2} />
          </div>

          <div className="mt-5 h-[340px] rounded-2xl border border-slate-100 bg-white p-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={model.points}
                margin={{ top: 22, right: 22, left: 4, bottom: 16 }}
              >
                <CartesianGrid stroke="#e8ecf0" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="moment"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: '#4a7068' }}
                />
                <YAxis
                  width={54}
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: '#4a7068' }}
                  tickFormatter={(value) => `${value}`}
                >
                  <Label
                    value="Concentración rel. (%)"
                    angle={-90}
                    position="insideLeft"
                    offset={-2}
                    fill="#4a7068"
                    style={{ fontSize: 11 }}
                  />
                </YAxis>
                <Tooltip content={<SimulationTooltip selectedLabel={scenario.label} />} />
                <ReferenceArea
                  y1={model.target.min}
                  y2={model.target.max}
                  fill="#7b3fa0"
                  fillOpacity={0.08}
                  strokeOpacity={0}
                />
                <ReferenceDot
                  x="Valle"
                  y={model.sample.current}
                  r={6}
                  fill="#ef4444"
                  stroke="#ffffff"
                  strokeWidth={2}
                  label={{ value: 'Muestra actual', position: 'top', fill: '#ef4444', fontSize: 11 }}
                />
                <Line
                  type="monotone"
                  dataKey="selected"
                  stroke="#16a34a"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5, fill: '#16a34a' }}
                />
                <Line
                  type="monotone"
                  dataKey="current"
                  stroke="#ef4444"
                  strokeDasharray="6 4"
                  strokeWidth={2.4}
                  dot={false}
                  activeDot={{ r: 5, fill: '#ef4444' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <SmallInsight
              label="Lectura clínica"
              value={model.readout}
              tone="emerald"
            />
            <SmallInsight
              label="Contexto de validación"
              value={scenario.note}
              tone="slate"
            />
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#4a7068]">Escenarios de optimización</p>
            <h3 className="mt-1 text-lg font-semibold text-[#152520]">Comparador de estrategias</h3>
          </div>

          <div className="space-y-2">
            {scenarios.map((item) => {
              const active = item.label === selectedScenario
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setSelectedScenario(item.label)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    active
                      ? 'border-[#7b3fa0]/40 bg-[#faf6fd] shadow-sm'
                      : 'border-slate-200 bg-white hover:border-[#7b3fa0]/20 hover:bg-[#faf6fd]/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#152520]">{item.label}</p>
                      <p className="mt-1 text-sm text-[#4a7068]">{item.outcome}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${riskPill(item.risk)}`}>
                      {item.risk}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">{item.validationOwner}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">{item.kind === 'exposure' ? 'Con curva' : 'Discusión cualitativa'}</span>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="rounded-2xl border border-[#7b3fa0]/10 bg-[#faf6fd]/60 px-4 py-3">
            <p className="text-xs text-[#7b3fa0]">{model.sampleMessage}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function buildSimulationModel(caso: CasoCompleto, scenario: ScenarioDescriptor) {
  const direction = deriveExposureDirection(caso)
  const target = direction === 'low' ? LOW_TARGET : direction === 'high' ? HIGH_TARGET : BALANCED_TARGET
  const curveSet = direction === 'low' ? LOW_EXPOSURE_CURVES : direction === 'high' ? HIGH_EXPOSURE_CURVES : BALANCED_CURVES
  const selectedCurveKey = scenario.curveKey ?? bestCurveForScenario(scenario, direction)
  const selectedCurve = curveSet[selectedCurveKey]
  const currentCurve = curveSet.current

  const points: SimulationPoint[] = MOMENTS.map((moment, index) => ({
    moment,
    current: currentCurve[index],
    selected: selectedCurve[index],
    targetMin: target.min,
    targetMax: target.max,
  }))

  const currentSample = points.find((point) => point.moment === 'Valle') ?? points[4]
  const selectedSample = points.find((point) => point.moment === 'Valle') ?? points[4]
  const delta = Math.round(selectedSample.selected - currentSample.current)

  let readout = 'La alternativa mantiene una lectura parecida a la situación actual.'
  if (delta >= 10) readout = 'La alternativa desplaza la exposición de forma visible hacia la zona objetivo.'
  if (delta <= -10) readout = 'La alternativa reduce exposición y puede ser útil si el riesgo principal es sobreexposición.'
  if (scenario.kind !== 'exposure') readout = 'El valor de este escenario está en la decisión clínica o en la confirmación de datos, no en la curva.'

  let sampleMessage = 'La muestra actual debe confirmarse dentro del contexto del caso.'
  if (String(caso.pkpdInterpretation?.summary ?? '').toLowerCase().includes('valle')) {
    sampleMessage = 'La interpretación depende de confirmar que la extracción corresponde a un nivel valle.'
  } else if (direction === 'high') {
    sampleMessage = 'La concentración actual se interpreta con señal de sobreexposición y requiere contexto renal o de seguridad.'
  } else if (direction === 'low') {
    sampleMessage = 'La concentración actual queda por debajo del rango objetivo y favorece revisar optimización o repetición del determinante.'
  }

  return {
    points,
    sample: {
      current: currentSample.current,
      selected: selectedSample.selected,
    },
    target,
    readout,
    sampleMessage,
  }
}

function buildScenarioDescriptors(caso: CasoCompleto): ScenarioDescriptor[] {
  const labels = caso.simulation?.scenarios?.length
    ? caso.simulation.scenarios
    : fallbackScenarioLabels(caso)

  return labels.map((label) => describeScenario(label))
}

function fallbackScenarioLabels(caso: CasoCompleto) {
  const direction = deriveExposureDirection(caso)
  if (direction === 'high') {
    return ['Mantener dosis', 'Alargar intervalo', 'Reducir dosis', 'Desintensificar', 'Repetir determinantes']
  }

  if (direction === 'balanced') {
    return ['Mantener dosis', 'Confirmar tratamiento', 'Repetir determinantes', 'Cambiar mecanismo']
  }

  return ['Mantener dosis', 'Acortar intervalo', 'Aumentar dosis', 'Cambiar mecanismo', 'Repetir determinantes']
}

function describeScenario(label: string): ScenarioDescriptor {
  const normalized = label.toLowerCase()

  if (normalized.includes('acortar') || normalized.includes('intensificar')) {
    return {
      label,
      kind: 'exposure',
      outcome: 'Aumenta la exposición y reduce la probabilidad de infradosificación.',
      risk: 'Bajo',
      requirement: 'Confirmar peso actual y fecha de última administración.',
      note: 'Úsalo para discutir optimización de pauta dentro de la validación farmacéutica.',
      validationOwner: 'Farmacia + Digestivo',
      curveKey: 'raise-strong',
    }
  }

  if (normalized.includes('aument')) {
    return {
      label,
      kind: 'exposure',
      outcome: 'Incrementa exposición, con cambio moderado y controlable.',
      risk: 'Medio',
      requirement: 'Revisar seguridad y datos analíticos recientes.',
      note: 'Adecuado cuando el equipo quiere subir exposición sin modificar tanto el intervalo.',
      validationOwner: 'Farmacia + Digestivo',
      curveKey: 'raise-light',
    }
  }

  if (normalized.includes('alargar') || normalized.includes('reduc') || normalized.includes('desintens')) {
    return {
      label,
      kind: 'exposure',
      outcome: 'Reduce exposición y favorece una estrategia de ajuste conservador.',
      risk: 'Bajo',
      requirement: 'Corroborar estabilidad clínica y seguimiento previsto.',
      note: 'Úsalo cuando el objetivo es bajar exposición manteniendo vigilancia de respuesta.',
      validationOwner: 'Farmacia + Digestivo',
      curveKey: normalized.includes('reduc') ? 'lower-strong' : 'lower-light',
    }
  }

  if (normalized.includes('repetir') || normalized.includes('confirm')) {
    return {
      label,
      kind: 'diagnostic',
      outcome: 'No cambia la pauta; mejora la confianza interpretativa del caso.',
      risk: 'Muy bajo',
      requirement: 'Confirmar extracción en valle y fuente del determinante.',
      note: 'Escenario orientado a cerrar gaps antes de tomar una decisión terapéutica.',
      validationOwner: 'Laboratorio + Enfermería',
      curveKey: 'maintain',
    }
  }

  if (normalized.includes('cambiar')) {
    return {
      label,
      kind: 'decision',
      outcome: 'Abre discusión de cambio terapéutico cuando la exposición no explica la respuesta.',
      risk: 'Alto',
      requirement: 'Alinear historial de biológicos, inflamación y criterio clínico.',
      note: 'Escenario cualitativo para discusión clínica; la curva solo sirve como referencia contextual.',
      validationOwner: 'Digestivo + Farmacia',
      curveKey: 'maintain',
    }
  }

  return {
    label,
    kind: 'exposure',
    outcome: 'Mantiene la pauta actual como comparador base.',
    risk: 'Alto',
    requirement: 'Adherencia confirmada y cronología consistente.',
    note: 'Sirve como línea base frente a otras alternativas antes de validar la recomendación.',
    validationOwner: 'Farmacia',
    curveKey: 'maintain',
  }
}

function deriveExposureDirection(caso: CasoCompleto) {
  const text = [
    caso.title,
    caso.caseType,
    caso.pkpdInterpretation?.pattern,
    caso.pkpdInterpretation?.summary,
    caso.clinicalSummary,
  ].join(' ').toLowerCase()

  if (
    text.includes('exposición baja')
    || text.includes('subter')
    || text.includes('pérdida de respuesta')
    || text.includes('infrados')
    || text.includes('baja exposición')
  ) {
    return 'low'
  }

  if (
    text.includes('exposición alta')
    || text.includes('suprater')
    || text.includes('sobredos')
    || text.includes('toxicidad')
    || text.includes('sobreexposición')
  ) {
    return 'high'
  }

  return 'balanced'
}

function bestCurveForScenario(scenario: ScenarioDescriptor, direction: 'low' | 'high' | 'balanced') {
  if (direction === 'high') {
    if (scenario.label.toLowerCase().includes('reduc')) return 'lower-strong'
    if (scenario.label.toLowerCase().includes('alargar') || scenario.label.toLowerCase().includes('desintens')) return 'lower-light'
  }

  return scenario.curveKey ?? 'maintain'
}

function riskAccent(risk: string) {
  if (risk.toLowerCase().includes('alto')) return 'text-red-600'
  if (risk.toLowerCase().includes('medio')) return 'text-amber-600'
  return 'text-emerald-600'
}

function riskPill(risk: string) {
  if (risk.toLowerCase().includes('alto')) return 'bg-red-50 text-red-700'
  if (risk.toLowerCase().includes('medio')) return 'bg-amber-50 text-amber-700'
  return 'bg-emerald-50 text-emerald-700'
}

function LegendChip({
  label,
  color,
  dashed,
  soft,
}: {
  label: string
  color: 'emerald' | 'rose' | 'lime'
  dashed?: boolean
  soft?: boolean
}) {
  const styles: Record<string, string> = {
    emerald: soft ? 'bg-emerald-50 text-emerald-700' : 'bg-emerald-100 text-emerald-700',
    rose: soft ? 'bg-rose-50 text-rose-700' : 'bg-rose-100 text-rose-700',
    lime: soft ? 'bg-lime-50 text-lime-700' : 'bg-lime-100 text-lime-700',
  }

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${styles[color]}`}>
      <span className={`h-1.5 w-5 rounded-full ${color === 'emerald' ? 'bg-emerald-600' : color === 'rose' ? 'bg-rose-500' : 'bg-lime-500'} ${dashed ? 'border-t-2 border-dashed border-current bg-transparent' : ''}`} />
      {label}
    </span>
  )
}

function MetricCard({
  label,
  value,
  accent,
  icon: Icon,
}: {
  label: string
  value: string
  accent: string
  icon: React.ElementType
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-[#f8faf9] p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[#4a7068]">{label}</p>
        <Icon className="h-4 w-4 text-[#8dc63f]" />
      </div>
      <p className={`mt-2 text-sm font-semibold leading-6 ${accent}`}>{value}</p>
    </div>
  )
}

function SmallInsight({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'emerald' | 'amber' | 'slate'
}) {
  const styles = {
    emerald: 'border-emerald-100 bg-emerald-50/70',
    amber: 'border-amber-100 bg-amber-50/70',
    slate: 'border-slate-100 bg-slate-50/80',
  }

  return (
    <div className={`rounded-2xl border p-3 ${styles[tone]}`}>
      <p className="text-[10px] uppercase tracking-[0.18em] text-[#4a7068]">{label}</p>
      <p className="mt-2 text-sm leading-6 text-[#152520]">{value}</p>
    </div>
  )
}

function SimulationTooltip({
  active,
  payload,
  label,
  selectedLabel,
}: {
  active?: boolean
  payload?: Array<{ value?: number; dataKey?: string }>
  label?: string
  selectedLabel: string
}) {
  if (!active || !payload?.length) return null

  const current = payload.find((item) => item.dataKey === 'current')?.value
  const selected = payload.find((item) => item.dataKey === 'selected')?.value

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-[#152520]">{label}</p>
      <p className="mt-1 text-xs text-[#4a7068]">Escenario actual: {current}</p>
      <p className="text-xs text-emerald-700">{selectedLabel}: {selected}</p>
    </div>
  )
}
