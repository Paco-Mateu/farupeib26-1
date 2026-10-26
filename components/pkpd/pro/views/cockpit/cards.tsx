'use client'

import {
  Activity, CheckCircle2, ChevronDown, FlaskConical, Layers, Loader2, Pill, Sparkles, TrendingUp, Users, Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { deriveProtocolSemanticFrame, formatProtocolReviewDate, getProgramProtocol } from '@/components/pkpd/pro/protocol-guidance'
import type { CasoCompleto } from '@/components/pkpd/pro/xarxa-types'
import { PIPELINE_STAGES } from '@/components/pkpd/pro/xarxa-types'
import { useXarxaT } from '@/components/i18n/use-xarxa-strings'
import { Button } from '@/components/ui/button'
import { fetchJson } from '@/lib/fetch-json'
import { deriveDrugLine, deriveTrough, formatSampleDateTime, pkpdStatus } from './derive'
import { LANE_COLORS } from './shared'
import type { BayesEvaluation, PkpdEvaluation, SimilarCaseItem } from './shared'
import { AgentExecutionRail } from './tab-auditoria'

export function PkpdRulesCard({
  caso,
  onCaseUpdated,
}: {
  caso: CasoCompleto
  onCaseUpdated?: (updated: CasoCompleto) => void
}) {
  const t = useXarxaT('cockpit-core')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [evaluation, setEvaluation] = useState<PkpdEvaluation | null>(
    (caso.pkpdInterpretation as Record<string, any>)?.engineEvaluation ?? null,
  )

  async function run() {
    setBusy(true)
    setError(null)
    try {
      const payload = await fetchJson<{ case: CasoCompleto; evaluation: PkpdEvaluation }>(
        `/api/xarxa/cases/${caso.caseId}/run-pkpd`,
        { method: 'POST' },
      )
      setEvaluation(payload.evaluation)
      onCaseUpdated?.(payload.case)
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : t('pkpd.rules.error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border border-[#7b3fa0]/25 bg-[#faf6fd] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#7b3fa0]/10">
            <Zap className="h-4 w-4 text-[#7b3fa0]" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#4a7068]">{t('pkpd.rules.kicker')}</p>
            <p className="text-sm font-semibold text-[#152520]">{t('pkpd.rules.title')}</p>
          </div>
        </div>
        <Button size="sm" className="rounded-xl bg-[#7b3fa0] text-xs text-white hover:bg-[#6a3490]" onClick={() => void run()} disabled={busy}>
          {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Zap className="mr-1.5 h-3.5 w-3.5" />}
          {t('pkpd.rules.run')}
        </Button>
      </div>

      {error ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{error}</p>
      ) : null}

      {evaluation ? (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#152520] ring-1 ring-slate-200">
              {t('pkpd.rules.drug')} {evaluation.drug}
            </span>
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#152520] ring-1 ring-slate-200">
              {t('pkpd.rules.target')} {evaluation.targetRange[0]}–{evaluation.targetRange[1]} {evaluation.unit}
            </span>
            {evaluation.observed ? (
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#152520] ring-1 ring-slate-200">
                {t('pkpd.rules.observed')} {evaluation.observed.value} {evaluation.unit}
                {evaluation.observed.sampleDateTime ? ` · ${formatSampleDateTime(evaluation.observed.sampleDateTime)}` : ''}
              </span>
            ) : null}
            {evaluation.inTarget !== null ? (
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${evaluation.inTarget ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>
                {evaluation.inTarget ? t('pkpd.rules.inTarget') : t('pkpd.rules.outOfTarget')}
              </span>
            ) : null}
          </div>

          {evaluation.firedRules.length > 0 ? (
            <div className="space-y-1.5">
              {evaluation.firedRules.map((rule) => (
                <div key={rule.id} className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs">
                  <span className="font-bold text-[#7b3fa0]">{rule.id}</span>
                  <span className="text-[#4a7068]"> · {rule.condition}</span>
                  <p className="mt-0.5 font-medium text-[#152520]">→ {rule.action}</p>
                </div>
              ))}
            </div>
          ) : null}

          {evaluation.recommendationDraft ? (
            <p className="rounded-lg bg-white px-3 py-2 text-xs leading-6 text-[#152520] ring-1 ring-slate-200">
              <span className="font-semibold text-[#7b3fa0]">{t('pkpd.rules.draftLabel')}</span> {evaluation.recommendationDraft}
            </p>
          ) : null}

          <p className="text-[10px] leading-5 text-slate-500">
            {evaluation.note} · {t('pkpd.rules.source')} {evaluation.source}
          </p>
        </div>
      ) : null}
    </div>
  )
}

export function BayesMipdCard({
  caso,
  onCaseUpdated,
}: {
  caso: CasoCompleto
  onCaseUpdated?: (updated: CasoCompleto) => void
}) {
  const t = useXarxaT('cockpit-core')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [evaluation, setEvaluation] = useState<BayesEvaluation | null>(
    (caso.pkpdInterpretation as Record<string, any>)?.bayesEvaluation ?? null,
  )

  async function run() {
    setBusy(true)
    setError(null)
    try {
      const payload = await fetchJson<{ case: CasoCompleto; evaluation: BayesEvaluation }>(
        `/api/xarxa/cases/${caso.caseId}/run-bayes`,
        { method: 'POST' },
      )
      setEvaluation(payload.evaluation)
      onCaseUpdated?.(payload.case)
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : t('bayes.error'))
    } finally {
      setBusy(false)
    }
  }

  const equivalenceGroups = new Map<number, string[]>()
  for (const regimen of evaluation?.regimenComparison ?? []) {
    const rounded = Math.round(regimen.aucWeeklyMgHPerL)
    equivalenceGroups.set(rounded, [...(equivalenceGroups.get(rounded) ?? []), regimen.label])
  }
  const equivalenceNotes = Array.from(equivalenceGroups.entries())
    .filter(([, labels]) => labels.length > 1)
    .map(([auc, labels]) => t('bayes.equivalence.note').replaceAll('{auc}', String(auc)).replaceAll('{regimens}', labels.join(' ≡ ')))

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600/10">
            <TrendingUp className="h-4 w-4 text-blue-700" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#4a7068]">{t('bayes.kicker')}</p>
            <p className="text-sm font-semibold text-[#152520]">{t('bayes.title')}</p>
          </div>
        </div>
        <Button size="sm" className="rounded-xl bg-blue-700 text-xs text-white hover:bg-blue-800" onClick={() => void run()} disabled={busy}>
          {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <TrendingUp className="mr-1.5 h-3.5 w-3.5" />}
          {t('bayes.run')}
        </Button>
      </div>

      {error ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{error}</p>
      ) : null}

      {evaluation?.status === 'insufficient-data' ? (
        <p className="mt-3 rounded-lg bg-white px-3 py-2 text-xs text-[#152520] ring-1 ring-slate-200">{evaluation.detail}</p>
      ) : null}

      {evaluation?.status === 'estimated' && evaluation.clearance ? (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#152520] ring-1 ring-slate-200">
              {t('bayes.cl').replaceAll('{value}', evaluation.clearance.estimatedLPerDay.toFixed(4))}
            </span>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${evaluation.clearance.relativeToPopulation < 0.9 ? 'bg-amber-100 text-amber-900' : evaluation.clearance.relativeToPopulation > 1.1 ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
              {t('bayes.cl.relative').replaceAll('{pct}', String(Math.round(evaluation.clearance.relativeToPopulation * 100))).replaceAll('{value}', evaluation.clearance.populationLPerDay.toFixed(4))}
            </span>
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] text-[#4a7068] ring-1 ring-slate-200">
              {t('bayes.levels').replaceAll('{levels}', String(evaluation.levelsUsed ?? '')).replaceAll('{doses}', String(evaluation.dosesUsed ?? ''))}
            </span>
          </div>

          {evaluation.regimenComparison?.length ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] uppercase tracking-[0.08em] text-[#4a7068]">
                    <th className="px-4 py-2.5 font-semibold">{t('bayes.th.maintenance')}</th>
                    <th className="px-4 py-2.5 font-semibold">{t('bayes.th.cmin')}</th>
                    <th className="px-4 py-2.5 font-semibold">{t('bayes.th.auc')}</th>
                    <th className="px-4 py-2.5 font-semibold">{t('bayes.th.route')}</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluation.regimenComparison.map((regimen) => (
                    <tr key={regimen.label} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-4 py-2.5 font-medium text-[#152520]">{regimen.label}</td>
                      <td className="px-4 py-2.5 text-[#152520]">{regimen.cminMgPerL.toFixed(2)} mg/L</td>
                      <td className="px-4 py-2.5 text-slate-600">{Math.round(regimen.aucWeeklyMgHPerL)}</td>
                      <td className="px-4 py-2.5 text-slate-600">{regimen.route}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {equivalenceNotes.length > 0 ? (
            <div className="space-y-1">
              {equivalenceNotes.map((note) => (
                <p key={note} className="rounded-lg bg-white px-3 py-2 text-[11px] text-[#152520] ring-1 ring-slate-200">
                  <span className="font-semibold text-blue-700">{t('bayes.equivalence.prefix')}</span> {note}
                </p>
              ))}
            </div>
          ) : null}

          <p className="text-[10px] leading-5 text-slate-500">
            {evaluation.note} · {t('bayes.finalNote')}
          </p>
        </div>
      ) : null}
    </div>
  )
}

export function SimilarCasesCard({ caso }: { caso: CasoCompleto }) {
  const t = useXarxaT('cockpit-core')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<SimilarCaseItem[] | null>(null)
  const [note, setNote] = useState<string | null>(null)

  async function run() {
    setBusy(true)
    setError(null)
    setNote(null)
    try {
      const payload = await fetchJson<{ caseId: string; items: SimilarCaseItem[]; total: number; note: string }>(
        `/api/xarxa/cases/${caso.caseId}/similar-cases`,
        { method: 'POST' },
      )
      setItems(payload.items)
      setNote(payload.note)
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : t('similar.error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100">
            <Layers className="h-4 w-4 text-slate-600" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#4a7068]">{t('similar.kicker')}</p>
            <p className="text-sm font-semibold text-[#152520]">{t('similar.title')}</p>
          </div>
        </div>
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => void run()} disabled={busy}>
          {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
          {t('similar.search')}
        </Button>
      </div>

      {error ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{error}</p>
      ) : null}

      {items && items.length === 0 ? (
        <p className="mt-3 text-xs text-[#4a7068]">{t('similar.empty')}</p>
      ) : null}

      {items && items.length > 0 ? (
        <div className="mt-3 space-y-2">
          {items.map((item) => (
            <div key={item.caseId} className="rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-[#152520]">
                  {item.caseId} · {item.title}
                </p>
                <span className="rounded-full bg-[#7b3fa0]/10 px-2 py-0.5 text-[10px] font-semibold text-[#7b3fa0]">
                  {t('similar.score').replaceAll('{score}', item.score.toFixed(3))}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-[#4a7068]">
                {item.centerName} · {item.caseType} · {item.pipelineStage}
              </p>
              {item.recommendation?.text ? (
                <p className="mt-1 line-clamp-2 text-[11px] text-slate-600">{t('similar.decision').replaceAll('{text}', item.recommendation.text)}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {note ? <p className="mt-2 text-[10px] text-slate-500">{note}</p> : null}
    </div>
  )
}

export function UrgentSlaChip({ caso }: { caso: CasoCompleto }) {
  const t = useXarxaT('cockpit-core')
  const resolved = ['Informe validado', 'Registrado en HCE', 'Seguimiento 4 semanas', 'Seguimiento 8 semanas', 'Cerrado con resultado']
    .includes(caso.pipelineStage)
  if (resolved) {
    return (
      <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="text-xs font-semibold text-emerald-700">{t('urgent.resolved')}</span>
        {caso.urgencyContext ? <span className="text-[10px] text-slate-400">· {caso.urgencyContext}</span> : null}
      </div>
    )
  }
  if (!caso.responseDeadline) {
    return (
      <div className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5">
        <span className="h-2 w-2 rounded-full bg-red-500" />
        <span className="text-xs font-semibold text-red-700">{t('urgent.noDeadline')}</span>
      </div>
    )
  }
  const deadline = new Date(caso.responseDeadline)
  const hoursLeft = (deadline.getTime() - Date.now()) / 3_600_000
  const breached = hoursLeft <= 0
  const timeLeft = hoursLeft < 1 ? `${Math.max(0, Math.round(hoursLeft * 60))} min` : `${Math.round(hoursLeft)} h`
  return (
    <div className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 ${breached ? 'border-red-300 bg-red-100' : 'border-amber-200 bg-amber-50'}`}>
      <span className={`h-2 w-2 rounded-full ${breached ? 'bg-red-600' : 'bg-amber-500'}`} />
      <span className={`text-xs font-semibold ${breached ? 'text-red-800' : 'text-amber-800'}`}>
        {breached
          ? t('urgent.breached')
          : t('urgent.pending').replaceAll('{time}', timeLeft)}
      </span>
      {caso.urgencyContext ? <span className="text-[10px] text-slate-500">· {caso.urgencyContext}</span> : null}
    </div>
  )
}

export function ClinicalIdentityBar({ caso }: { caso: CasoCompleto }) {
  const t = useXarxaT('cockpit-core')
  const drugLine = deriveDrugLine(caso)
  const trough = deriveTrough(caso)
  const status = pkpdStatus(caso.pkpdInterpretation?.pattern ?? '')
  return (
    <div className="shrink-0 border-b border-slate-100 bg-[#faf6fd]/60 px-6 py-3">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
        {/* Drug identity */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#7b3fa0]/10">
            <Pill className="h-4 w-4 text-[#7b3fa0]" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#4a7068]">{t('identity.treatment')}</p>
            <p className="text-sm font-semibold text-[#152520]">{drugLine}</p>
          </div>
        </div>

        <div className="h-8 w-px bg-slate-200" />

        {/* Trough level */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100">
            <FlaskConical className="h-4 w-4 text-slate-500" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#4a7068]">{t('identity.trough')}</p>
            <p className="text-sm font-semibold text-[#152520]">
              {trough ? `${trough.value} ${trough.unit}`.trim() : '—'}
            </p>
          </div>
        </div>

        <div className="h-8 w-px bg-slate-200" />

        {/* PK/PD status */}
        <div className={`flex items-center gap-2 rounded-xl border ${status.border} ${status.bg} px-3 py-1.5`}>
          <span className={`h-2 w-2 rounded-full ${status.dot}`} />
          <span className={`text-xs font-semibold ${status.color}`}>{t(status.label)}</span>
          {caso.pkpdInterpretation?.confidence && (
            <span className="ml-1 text-[10px] text-slate-400">{t('identity.confidence').replaceAll('{value}', String(caso.pkpdInterpretation.confidence))}</span>
          )}
        </div>

        {/* Urgent circuit SLA (UC-07) */}
        {caso.urgencyTrack === 'Urgente' ? (
          <UrgentSlaChip caso={caso} />
        ) : null}

        {/* Patient quick info */}
        {caso.patientProfile && (
          <>
            <div className="h-8 w-px bg-slate-200 hidden xl:block" />
            <div className="hidden xl:flex items-center gap-2 text-xs text-[#4a7068]">
              {caso.patientProfile.age && <span>{t('identity.age').replaceAll('{age}', String(caso.patientProfile.age))}</span>}
              {caso.patientProfile.sex && <span>· {caso.patientProfile.sex}</span>}
              {caso.patientProfile.weightKg && <span>· {caso.patientProfile.weightKg} kg</span>}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Tab: Análisis PK/PD ───────────────────────────────────────────────────────

export function ProtocolFrameCard({
  protocol,
  frame,
  compact = false,
}: {
  protocol: ReturnType<typeof getProgramProtocol>
  frame?: ReturnType<typeof deriveProtocolSemanticFrame>
  compact?: boolean
}) {
  const t = useXarxaT('cockpit-core')
  if (!protocol && !frame) return null

  return (
    <div className={`rounded-xl border border-slate-200 bg-white ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#4a7068]">{t('protocol.frameKicker')}</p>
          <p className="mt-1 text-base font-semibold text-[#152520]">
            {frame?.label ?? protocol?.title ?? t('protocol.active')}
          </p>
          {frame?.rationale ? (
            <p className="mt-2 text-sm leading-6 text-[#152520]">{frame.rationale}</p>
          ) : null}
          {protocol?.alignment ? (
            <p className="mt-2 text-sm leading-6 text-[#4a7068]">{protocol.alignment}</p>
          ) : null}
          {frame?.caution ? (
            <p className="mt-2 text-xs font-medium text-amber-700">{frame.caution}</p>
          ) : null}
        </div>
        <div className="space-y-2 lg:w-[280px]">
          <div className="rounded-2xl border border-slate-200 bg-[#fbfcfb] px-4 py-3 text-sm">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#4a7068]">{t('protocol.active')}</p>
            <p className="mt-1 font-semibold text-[#152520]">{protocol?.title ?? t('protocol.activeClinical')}</p>
            <p className="mt-1 text-xs text-[#4a7068]">{t('protocol.lastReview').replaceAll('{date}', formatProtocolReviewDate(protocol?.lastReview))}</p>
          </div>
          {protocol?.references?.length ? (
            <div className="rounded-2xl border border-slate-200 bg-[#fbfcfb] px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#4a7068]">{t('protocol.references')}</p>
              <div className="mt-2 space-y-2">
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
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function OutcomeCard({
  label,
  value,
  long = false,
}: {
  label: string
  value: string
  long?: boolean
}) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white px-4 py-3 ${long ? 'sm:col-span-2 xl:col-span-3' : ''}`}>
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#4a7068]">{label}</p>
      <p className={`mt-1 text-sm text-[#152520] ${long ? 'leading-7' : 'font-medium'}`}>{value}</p>
    </div>
  )
}

export function FollowUpPatternButton({
  label,
  detail,
  onClick,
}: {
  label: string
  detail: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition hover:border-[#7b3fa0]/25 hover:bg-[#faf6fd]"
    >
      <p className="text-xs font-semibold text-[#152520]">{label}</p>
      <p className="mt-0.5 text-[11px] text-[#4a7068]">{detail}</p>
    </button>
  )
}

export function FollowUpStatusPill({ status }: { status: string }) {
  const cls =
    status === 'Completado'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
      : status === 'Pendiente'
        ? 'bg-amber-50 text-amber-700 ring-amber-200'
        : 'bg-sky-50 text-sky-700 ring-sky-200'
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ring-1 ${cls}`}>
      {status}
    </span>
  )
}

// ── Stage metadata ────────────────────────────────────────────────────────────

export const STAGE_DOT: Record<string, string> = {
  'Solicitud recibida':          '#64748b',
  'Caso creado por IA':          '#7c3aed',
  'Datos incompletos':           '#e8981e',
  'Pendiente de determinantes':  '#e8501e',
  'Determinantes recibidos':     '#ca8a04',
  'Análisis PK/PD generado':     '#2563eb',
  'Revisión farmacéutica':       '#7b3fa0',
  'Revisión médica':             '#9333ea',
  'Discusión en red':            '#4f46e5',
  'Informe generado':            '#8dc63f',
  'Informe validado':            '#16a34a',
  'Registrado en HCE':           '#059669',
  'Seguimiento 4 semanas':       '#0891b2',
  'Seguimiento 8 semanas':       '#0284c7',
  'Cerrado con resultado':       '#6b7280',
}

// Values are dictionary keys (namespace 'cockpit-core'), resolved with t() at the render site.
export const STAGE_DESC: Record<string, string> = {
  'Solicitud recibida':          'stage.solicitudRecibida',
  'Caso creado por IA':          'stage.casoCreadoIa',
  'Datos incompletos':           'stage.datosIncompletos',
  'Pendiente de determinantes':  'stage.pendienteDeterminantes',
  'Determinantes recibidos':     'stage.determinantesRecibidos',
  'Análisis PK/PD generado':     'stage.analisisPkpd',
  'Revisión farmacéutica':       'stage.revisionFarmaceutica',
  'Revisión médica':             'stage.revisionMedica',
  'Discusión en red':            'stage.discusionRed',
  'Informe generado':            'stage.informeGenerado',
  'Informe validado':            'stage.informeValidado',
  'Registrado en HCE':           'stage.registradoHce',
  'Seguimiento 4 semanas':       'stage.seguimiento4',
  'Seguimiento 8 semanas':       'stage.seguimiento8',
  'Cerrado con resultado':       'stage.cerradoResultado',
}

// ── Pipeline Panel (unified single scroll) ───────────────────────────────────

export function PipelinePanel({
  caso,
  actionBusy,
  inline = false,
}: {
  caso: CasoCompleto
  actionBusy: string | null
  inline?: boolean
}) {
  const t = useXarxaT('cockpit-core')
  const stageIndex = PIPELINE_STAGES.findIndex((s) => s === caso.pipelineStage)
  const [expandedStage, setExpandedStage] = useState<string | null>(caso.pipelineStage)
  const [block1Open, setBlock1Open] = useState(true)
  const [block2Open, setBlock2Open] = useState(true)
  const pendingTasks = (caso.tasks ?? []).filter((task) => task.status !== 'Resuelta')
  const pendingFollowUps = (caso.followUps ?? []).filter((followUp) => followUp.status !== 'Completado')
  const approvalItems = [
    caso.recommendation?.status !== 'Validado' ? t('pipeline.approval.recPending') : null,
    caso.clinicalNote?.status !== 'Registrado en HCE' ? t('pipeline.approval.noteNotRegistered') : null,
    pendingTasks.length > 0
      ? t(pendingTasks.length > 1 ? 'pipeline.approval.tasks' : 'pipeline.approval.task').replaceAll('{count}', String(pendingTasks.length))
      : null,
    pendingFollowUps.length > 0
      ? t(pendingFollowUps.length > 1 ? 'pipeline.approval.followUps' : 'pipeline.approval.followUp').replaceAll('{count}', String(pendingFollowUps.length))
      : null,
  ].filter(Boolean) as string[]

  useEffect(() => {
    setExpandedStage(caso.pipelineStage)
  }, [caso.pipelineStage])

  const activeAgentFlow =
    actionBusy === 'orchestrate'
      ? {
          title: t('flow.orchestrate.title'),
          steps: [
            t('flow.orchestrate.step1'),
            t('flow.orchestrate.step2'),
            t('flow.orchestrate.step3'),
            t('flow.orchestrate.step4'),
          ],
        }
      : actionBusy === 'note:generate'
        ? {
            title: t('flow.note.title'),
            steps: [
              t('flow.note.step1'),
              t('flow.note.step2'),
              t('flow.note.step3'),
            ],
          }
        : null

  return (
    <aside className={inline
      ? 'w-full'
      : 'hidden lg:flex h-full w-72 shrink-0 flex-col border-l border-slate-200 bg-[#f1f3f5]'
    }>

      {/* ── Block 1: Pipeline stages ── */}
      <div className={`flex flex-col border-b-2 border-[#7b3fa0]/20 ${inline ? '' : block1Open ? 'flex-1 min-h-0' : 'shrink-0'}`}>
        <button
          onClick={() => setBlock1Open((v) => !v)}
          className="flex w-full items-center justify-between gap-2 bg-[#7b3fa0]/8 px-3 py-2.5 text-left hover:bg-[#7b3fa0]/12 transition"
        >
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-[#7b3fa0]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#7b3fa0]">{t('pipeline.header')}</span>
          </div>
          <ChevronDown className={`h-3.5 w-3.5 text-[#7b3fa0] transition-transform ${block1Open ? '' : '-rotate-90'}`} />
        </button>
        {block1Open && (
      <div className={inline ? 'px-3 py-3 space-y-3' : 'flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-3 space-y-3'}>

        {/* Siguiente paso callout */}
        <div className="rounded-xl border border-[#7b3fa0]/20 bg-white px-3 py-3 shadow-sm">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#7b3fa0]">{t('pipeline.nextStep')}</p>
          <p className="mt-1 text-sm font-bold text-slate-900">{caso.nextAction}</p>
          {actionBusy && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-[#7b3fa0]">
              <Sparkles className="h-3 w-3 animate-pulse" />
              {t('pipeline.updating')}
            </div>
          )}
        </div>

        {activeAgentFlow ? (
          <AgentExecutionRail title={activeAgentFlow.title} steps={activeAgentFlow.steps} />
        ) : null}

        {/* Pipeline stages */}
        <div>
          <p className="mb-2 px-1 text-[9px] font-bold uppercase tracking-widest text-slate-400">
            {t('pipeline.header')}
          </p>
          <div className="relative">
            <div className="absolute bottom-2 left-[15px] top-2 w-0.5 bg-slate-200" />
            <div className="space-y-0.5">
              {PIPELINE_STAGES.map((stage, i) => {
                const isDone = i < stageIndex
                const isActive = i === stageIndex
                const isPending = i > stageIndex
                const isExpanded = expandedStage === stage
                const dot = STAGE_DOT[stage] ?? '#64748b'
                const stageEvents = (caso.timeline ?? []).filter((e) =>
                  e.label.toLowerCase().includes(stage.toLowerCase().split(' ').slice(0, 2).join(' '))
                )

                return (
                  <div key={stage}>
                    <button
                      onClick={() => setExpandedStage(isExpanded ? null : stage)}
                      disabled={isPending}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition ${
                        isActive
                          ? 'bg-white shadow-sm ring-1 ring-slate-200'
                          : isPending
                            ? 'cursor-default'
                            : 'hover:bg-white'
                      }`}
                    >
                      <div
                        className="relative z-10 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: isPending ? '#e2e8f0' : dot }}
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        ) : isActive ? (
                          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-slate-300" />
                        )}
                      </div>
                      <span
                        className={`flex-1 truncate text-xs ${
                          isActive ? 'font-bold text-slate-900' : isDone ? 'font-medium text-slate-500' : 'text-slate-300'
                        }`}
                      >
                        {stage}
                      </span>
                      {isActive && (
                        <span
                          className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold text-white"
                          style={{ backgroundColor: dot }}
                        >
                          {t('pipeline.now')}
                        </span>
                      )}
                    </button>

                    {isExpanded && !isPending && (
                      <div
                        className="mb-1 ml-9 overflow-hidden rounded-lg border-l-4 bg-white p-2.5"
                        style={{ borderColor: dot }}
                      >
                        <p className="text-[11px] leading-relaxed text-slate-500">{t(STAGE_DESC[stage] ?? '')}</p>
                        {stageEvents.length > 0 && (
                          <div className="mt-2 space-y-1.5">
                            {stageEvents.slice(0, 3).map((e, j) => (
                              <div key={j} className="flex items-start gap-1.5">
                                <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold ${LANE_COLORS[e.lane] ?? 'bg-slate-100 text-slate-600'}`}>
                                  {e.lane}
                                </span>
                                <span className="text-[11px] font-medium text-slate-700">{e.label}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {isActive && pendingTasks.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {pendingTasks.slice(0, 2).map((task) => (
                              <div key={task.taskId} className="rounded border border-slate-200 bg-slate-50 px-2 py-1.5">
                                <p className="text-[11px] font-semibold text-slate-800">{task.title}</p>
                                <p className="text-[10px] text-slate-500">{task.ownerRole}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        </div>
        )}
      </div>

      {/* ── Block 2: Context ── */}
      <div className={`flex flex-col ${inline ? '' : block2Open ? 'flex-1 min-h-0' : 'shrink-0'}`}>
        <button
          onClick={() => setBlock2Open((v) => !v)}
          className="flex w-full items-center justify-between gap-2 bg-[#7b3fa0]/10 px-3 py-2.5 text-left hover:bg-[#7b3fa0]/15 transition"
        >
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-[#7b3fa0]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#7b3fa0]">{t('pipeline.contextHeader')}</span>
          </div>
          <ChevronDown className={`h-3.5 w-3.5 text-[#7b3fa0] transition-transform ${block2Open ? '' : '-rotate-90'}`} />
        </button>
        {block2Open && (
      <div className={inline ? 'px-3 py-3 space-y-3' : 'flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-3 space-y-3'}>

        {/* People */}
        <div className="flex items-start gap-2">
          <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#7b3fa0]" />
          <div className="min-w-0 text-xs">
            <p className="font-semibold text-slate-800">{caso.requesterName}</p>
            <p className="text-slate-400">{t('pipeline.requester').replaceAll('{center}', caso.centerName)}</p>
            <p className="mt-1.5 font-semibold text-slate-800">{caso.assignedName}</p>
            <p className="text-slate-400">{t('pipeline.pharmacyOwner')}</p>
          </div>
        </div>

        {/* Approvals needed */}
        {approvalItems.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-amber-600">{t('pipeline.pendingValidation')}</p>
            {approvalItems.map((item) => (
              <div key={item} className="rounded-lg border-l-4 border-amber-400 bg-amber-50 px-2.5 py-1.5 text-[11px] font-medium text-amber-800">
                {item}
              </div>
            ))}
          </div>
        )}

        {pendingFollowUps.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-cyan-700">{t('pipeline.followUpsVisible')}</p>
            {pendingFollowUps.slice(0, 2).map((item) => (
              <div key={item.label} className="rounded-lg border-l-4 border-cyan-400 bg-cyan-50 px-2.5 py-1.5 text-[11px] font-medium text-cyan-800">
                {item.label}
                {item.dueDate ? ` · ${new Date(item.dueDate).toLocaleDateString('es-ES')}` : ''}
              </div>
            ))}
          </div>
        )}

      </div>
        )}
      </div>

    </aside>
  )
}
