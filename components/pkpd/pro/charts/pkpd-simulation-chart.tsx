'use client'

import { AlertTriangle, CheckCircle2, Download, FlaskConical, ShieldCheck, TrendingUp } from 'lucide-react'
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

import { useXarxaT } from '@/components/i18n/use-xarxa-strings'
import { deriveProtocolSemanticFrame, formatProtocolReviewDate, getProgramProtocol } from '@/components/pkpd/pro/protocol-guidance'
import type { CasoCompleto, Program } from '@/components/pkpd/pro/xarxa-types'

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
  program,
  preferredScenario,
}: {
  caso: CasoCompleto
  program?: Program | null
  preferredScenario?: string | null
}) {
  const t = useXarxaT('charts-simulation')
  const scenarios = buildScenarioDescriptors(caso, t)
  const defaultScenario = preferredScenario && scenarios.some((scenario) => scenario.label === preferredScenario)
    ? preferredScenario
    : scenarios[0]?.label ?? 'Mantener dosis'
  const [selectedScenario, setSelectedScenario] = useState(defaultScenario)

  useEffect(() => {
    setSelectedScenario(defaultScenario)
  }, [defaultScenario, caso.caseId])

  const scenario = scenarios.find((item) => item.label === selectedScenario) ?? scenarios[0]
  const model = buildSimulationModel(caso, scenario, t)
  const observed = buildObservedData(caso, t)
  const inputQuality = buildInputQuality(caso, t)
  const protocol = getProgramProtocol(program)
  const semanticFrame = deriveProtocolSemanticFrame(caso)

  function exportSimulationPackage() {
    const payload = {
      caseId: caso.caseId,
      title: caso.title,
      generatedAt: new Date().toISOString(),
      preview: true,
      note: t('sim.export.note'),
      therapyContext: caso.therapyContext,
      patientProfile: caso.patientProfile,
      determinants: caso.labDeterminants,
      interpretation: caso.pkpdInterpretation,
      selectedScenario: scenario,
      model,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${caso.caseId.toLowerCase()}-paquete-pkpd.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-800">
                {t('sim.badge.indicative')}
              </span>
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-[#4a7068] ring-1 ring-amber-200">
                {t('sim.badge.pending')}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              {t('sim.banner.note')}
            </p>
          </div>
          <button
            type="button"
            onClick={exportSimulationPackage}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-900 transition hover:bg-amber-50"
          >
            <Download className="h-3.5 w-3.5" />
            {t('sim.export')}
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label={t('sim.metric.therapy')} value={t(observed.drugLine)} accent="text-[#152520]" icon={FlaskConical} />
            <MetricCard label={t('sim.metric.sample')} value={t(observed.sampleLine)} accent="text-[#152520]" icon={TrendingUp} />
            <MetricCard label={t('sim.metric.protocolReading')} value={semanticFrame.label} accent="text-[#152520]" icon={ShieldCheck} />
            <MetricCard label={t('sim.metric.decision')} value={t(classifyDecision(scenario))} accent={riskAccent(scenario.risk)} icon={CheckCircle2} />
          </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_360px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#4a7068]">{t('sim.workbench.kicker')}</p>
              <h3 className="mt-1 text-lg font-semibold text-[#152520]">{scenario.label}</h3>
              <p className="mt-1 text-sm text-[#4a7068]">{scenario.outcome}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <LegendChip color="emerald" label={t('sim.legend.proposal')} />
              <LegendChip color="rose" label={t('sim.legend.current')} dashed />
              <LegendChip color="lime" label={t('sim.legend.target')} soft />
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label={t('sim.metric.impact')} value={scenario.outcome} accent="text-[#152520]" icon={TrendingUp} />
            <MetricCard label={t('sim.metric.risk')} value={t(riskDisplayKey(scenario.risk))} accent={riskAccent(scenario.risk)} icon={AlertTriangle} />
            <MetricCard label={t('sim.metric.requirement')} value={scenario.requirement} accent="text-[#152520]" icon={FlaskConical} />
            <MetricCard label={t('sim.metric.validation')} value={scenario.validationOwner} accent="text-[#152520]" icon={CheckCircle2} />
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
                    value={t('sim.axis.concentration')}
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
                  label={{ value: t('sim.dot.sample'), position: 'top', fill: '#ef4444', fontSize: 11 }}
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
              label={t('sim.insight.clinical')}
              value={semanticFrame.rationale}
              tone="emerald"
            />
            <SmallInsight
              label={t('sim.insight.validationContext')}
              value={scenario.note}
              tone="slate"
            />
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <WorkbenchPanel
              title={t('sim.panel.observed')}
              items={[
                [t('sim.observed.drug'), t(observed.drugLine)],
                [t('sim.observed.level'), t(observed.sampleLine)],
                [t('sim.observed.interval'), t(observed.intervalLine)],
                [t('sim.observed.biomarkers'), t(observed.biomarkerLine)],
              ]}
            />
            <WorkbenchPanel
              title={t('sim.panel.quality')}
              items={inputQuality.map((item) => [t(item.label), t(item.value)] as [string, string])}
            />
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#4a7068]">{t('sim.decision.kicker')}</p>
            <h3 className="mt-1 text-lg font-semibold text-[#152520]">{t('sim.decision.title')}</h3>
            <p className="mt-1 text-sm leading-6 text-[#4a7068]">
              {t('sim.decision.intro')}
            </p>
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
                      {t(riskDisplayKey(item.risk))}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">{item.validationOwner}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">{item.kind === 'exposure' ? t('sim.scenario.withCurve') : t('sim.scenario.qualitative')}</span>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-[#fbfcfb] p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#4a7068]">{t('sim.metric.decision')}</p>
            <p className="mt-2 text-base font-semibold text-[#152520]">{scenario.label}</p>
            <div className="mt-3 space-y-2 text-sm">
              <DecisionRow label={t('sim.decision.type')} value={t(classifyDecision(scenario))} />
              <DecisionRow label={t('sim.decision.approval')} value={scenario.validationOwner} />
              <DecisionRow label={t('sim.decision.action')} value={scenario.requirement} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-[#fbfcfb] p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#4a7068]">{t('sim.protocol.kicker')}</p>
            <p className="mt-2 text-base font-semibold text-[#152520]">{semanticFrame.label}</p>
            <p className="mt-2 text-sm leading-6 text-[#4a7068]">{semanticFrame.rationale}</p>
            {semanticFrame.caution ? (
              <p className="mt-2 text-xs font-medium text-amber-700">{semanticFrame.caution}</p>
            ) : null}
          </div>

          {protocol ? (
            <div className="rounded-2xl border border-slate-200 bg-[#fbfcfb] p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#4a7068]">{t('sim.protocol.sources')}</p>
              <p className="mt-2 text-base font-semibold text-[#152520]">{protocol.title}</p>
              <p className="mt-1 text-xs text-[#4a7068]">{t('sim.protocol.lastReview').replaceAll('{date}', formatProtocolReviewDate(protocol.lastReview))}</p>
              {protocol.alignment ? <p className="mt-2 text-sm leading-6 text-[#4a7068]">{protocol.alignment}</p> : null}
              {protocol.references?.length ? (
                <div className="mt-3 space-y-2">
                  {protocol.references.map((reference) => (
                    <a
                      key={`${reference.label}-${reference.url}`}
                      href={reference.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-xl border border-slate-200 bg-white px-3 py-2 transition hover:border-[#7b3fa0]/20 hover:bg-[#faf6fd]"
                    >
                      <p className="text-sm font-semibold text-[#152520]">{reference.label}</p>
                      {reference.source ? <p className="mt-0.5 text-[11px] text-[#4a7068]">{reference.source}</p> : null}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-2xl border border-[#7b3fa0]/10 bg-[#faf6fd]/60 px-4 py-3">
            <p className="text-xs text-[#7b3fa0]">{model.sampleMessage}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function buildSimulationModel(caso: CasoCompleto, scenario: ScenarioDescriptor, t: (key: string) => string) {
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

  let readout = t('sim.readout.neutral')
  if (delta >= 10) readout = t('sim.readout.up')
  if (delta <= -10) readout = t('sim.readout.down')
  if (scenario.kind !== 'exposure') readout = t('sim.readout.qualitative')

  let sampleMessage = t('sim.sample.default')
  if (String(caso.pkpdInterpretation?.summary ?? '').toLowerCase().includes('valle')) {
    sampleMessage = t('sim.sample.valle')
  } else if (direction === 'high') {
    sampleMessage = t('sim.sample.high')
  } else if (direction === 'low') {
    sampleMessage = t('sim.sample.low')
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

function buildScenarioDescriptors(caso: CasoCompleto, t: (key: string) => string): ScenarioDescriptor[] {
  const labels = caso.simulation?.scenarios?.length
    ? caso.simulation.scenarios
    : fallbackScenarioLabels(caso)

  return labels.map((label) => describeScenario(label, t))
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

function describeScenario(label: string, t: (key: string) => string): ScenarioDescriptor {
  const normalized = label.toLowerCase()

  if (normalized.includes('acortar') || normalized.includes('intensificar')) {
    return {
      label,
      kind: 'exposure',
      outcome: t('sim.scenario.intensify.outcome'),
      risk: 'Bajo',
      requirement: t('sim.scenario.intensify.requirement'),
      note: t('sim.scenario.intensify.note'),
      validationOwner: t('sim.owner.pharmacy.digestive'),
      curveKey: 'raise-strong',
    }
  }

  if (normalized.includes('aument')) {
    return {
      label,
      kind: 'exposure',
      outcome: t('sim.scenario.increase.outcome'),
      risk: 'Medio',
      requirement: t('sim.scenario.increase.requirement'),
      note: t('sim.scenario.increase.note'),
      validationOwner: t('sim.owner.pharmacy.digestive'),
      curveKey: 'raise-light',
    }
  }

  if (normalized.includes('alargar') || normalized.includes('reduc') || normalized.includes('desintens')) {
    return {
      label,
      kind: 'exposure',
      outcome: t('sim.scenario.deintensify.outcome'),
      risk: 'Bajo',
      requirement: t('sim.scenario.deintensify.requirement'),
      note: t('sim.scenario.deintensify.note'),
      validationOwner: t('sim.owner.pharmacy.digestive'),
      curveKey: normalized.includes('reduc') ? 'lower-strong' : 'lower-light',
    }
  }

  if (normalized.includes('repetir') || normalized.includes('confirm')) {
    return {
      label,
      kind: 'diagnostic',
      outcome: t('sim.scenario.repeat.outcome'),
      risk: 'Muy bajo',
      requirement: t('sim.scenario.repeat.requirement'),
      note: t('sim.scenario.repeat.note'),
      validationOwner: t('sim.owner.lab.nursing'),
      curveKey: 'maintain',
    }
  }

  if (normalized.includes('cambiar')) {
    return {
      label,
      kind: 'decision',
      outcome: t('sim.scenario.change.outcome'),
      risk: 'Alto',
      requirement: t('sim.scenario.change.requirement'),
      note: t('sim.scenario.change.note'),
      validationOwner: t('sim.owner.digestive.pharmacy'),
      curveKey: 'maintain',
    }
  }

  return {
    label,
    kind: 'exposure',
    outcome: t('sim.scenario.maintain.outcome'),
    risk: 'Alto',
    requirement: t('sim.scenario.maintain.requirement'),
    note: t('sim.scenario.maintain.note'),
    validationOwner: t('sim.owner.pharmacy'),
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

function buildObservedData(caso: CasoCompleto, t: (key: string) => string) {
  const therapy = caso.therapyContext ?? {}
  const determinants = caso.labDeterminants ?? []
  const trough = determinants.find((item) =>
    String(item.relationToDose ?? '').toLowerCase().includes('valle') ||
    /concentraci[oó]n|trough|nivel/i.test(item.label)
  )
  const biomarkers = determinants
    .filter((item) => /pcr|calprotectina|alb[uú]mina|anticuerpo/i.test(item.label.toLowerCase()))
    .slice(0, 3)
    .map((item) => `${item.label}: ${item.value}${item.unit ? ` ${item.unit}` : ''}`)

  return {
    drugLine: [therapy.currentDrug, therapy.currentDose, therapy.interval].filter(Boolean).join(' · ') || t('sim.observed.pending'),
    sampleLine: trough ? `${trough.value}${trough.unit ? ` ${trough.unit}` : ''}` : t('sim.observed.noLevel'),
    intervalLine: String(therapy.interval ?? t('sim.observed.noInterval')),
    biomarkerLine: biomarkers.length > 0 ? biomarkers.join(' · ') : t('sim.observed.noBiomarkers'),
  }
}

function buildInputQuality(caso: CasoCompleto, t: (key: string) => string) {
  const determinants = caso.labDeterminants ?? []
  const confirmed = determinants.filter((item) => item.status === 'Confirmado').length
  const troughItem = determinants.find((item) =>
    String(item.relationToDose ?? '').toLowerCase().includes('valle') ||
    /concentraci[oó]n|trough|nivel/i.test(item.label)
  )
  return [
    {
      label: t('sim.quality.timing'),
      value: troughItem?.relationToDose ? String(troughItem.relationToDose) : t('sim.quality.pending'),
    },
    {
      label: t('sim.quality.confirmed'),
      value: `${confirmed}/${determinants.length || 0}`,
    },
    {
      label: t('sim.quality.confidence'),
      value: caso.pkpdInterpretation?.confidence || 'Media',
    },
    {
      label: t('sim.quality.origin'),
      value: t('sim.quality.preview'),
    },
  ]
}

function classifyDecision(scenario: ScenarioDescriptor) {
  const normalized = scenario.label.toLowerCase()
  if (normalized.includes('mantener') || normalized.includes('confirmar')) return 'sim.decisionType.ratify'
  if (normalized.includes('acortar') || normalized.includes('aument') || normalized.includes('intensif')) return 'sim.decisionType.increase'
  if (normalized.includes('alargar') || normalized.includes('reduc') || normalized.includes('desintens')) return 'sim.decisionType.reduce'
  if (normalized.includes('cambiar')) return 'sim.decisionType.change'
  if (normalized.includes('repetir')) return 'sim.decisionType.repeat'
  return 'sim.decisionType.discussion'
}

function riskDisplayKey(risk: string) {
  const normalized = risk.toLowerCase()
  if (normalized.includes('muy bajo')) return 'sim.risk.veryLow'
  if (normalized.includes('bajo')) return 'sim.risk.low'
  if (normalized.includes('medio')) return 'sim.risk.medium'
  return 'sim.risk.high'
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

function WorkbenchPanel({
  title,
  items,
}: {
  title: string
  items: Array<[string, string]>
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-[#f8faf9] p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-[#4a7068]">{title}</p>
      <div className="mt-3 space-y-2.5">
        {items.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-0.5 rounded-xl border border-white bg-white px-3 py-2.5 shadow-sm">
            <span className="text-[10px] uppercase tracking-[0.12em] text-slate-400">{label}</span>
            <span className="text-sm text-[#152520]">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DecisionRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm text-[#152520]">{value}</p>
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
  const t = useXarxaT('charts-simulation')
  if (!active || !payload?.length) return null

  const current = payload.find((item) => item.dataKey === 'current')?.value
  const selected = payload.find((item) => item.dataKey === 'selected')?.value

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-[#152520]">{label}</p>
      <p className="mt-1 text-xs text-[#4a7068]">{t('sim.tooltip.current')}{current}</p>
      <p className="text-xs text-emerald-700">{selectedLabel}: {selected}</p>
    </div>
  )
}
