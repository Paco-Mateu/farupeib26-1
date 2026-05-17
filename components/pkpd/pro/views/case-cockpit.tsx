'use client'

import {
  Activity, AlertTriangle, ArrowLeft, BookOpen, Bot, CheckCircle2, ChevronDown,
  CircleHelp,
  Clock, ClipboardEdit, Droplet, Eye, FileText, FlaskConical, Layers, LayoutDashboard, Loader2,
  Mail, MessageCircle, MessageSquareText, Microscope, PencilLine, Pill, Plus, RefreshCw,
  Save, Shield, Sparkles, Stethoscope, TrendingUp, Users, X, Zap,
  Trash2,
} from 'lucide-react'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Cell, Pie, PieChart, PolarAngleAxis, PolarGrid, Radar, RadarChart,
  ResponsiveContainer, Tooltip,
} from 'recharts'

import { PkpdSimulationChart } from '@/components/pkpd/pro/charts/pkpd-simulation-chart'
import { TimelineLaneOverview } from '@/components/pkpd/pro/charts/timeline-lane-overview'
import { deriveProtocolSemanticFrame, formatProtocolReviewDate, getProgramProtocol } from '@/components/pkpd/pro/protocol-guidance'
import type { CasoCompleto, FieldReviewMeta, FollowUpPlan, Program } from '@/components/pkpd/pro/xarxa-types'
import { PIPELINE_STAGES, PRIORITY_STYLE, SEVERITY_STYLE, STAGE_STYLE } from '@/components/pkpd/pro/xarxa-types'
import { PersonAvatar } from '@/components/pkpd/pro/person-avatar'
import { ActionConfirmDialog } from '@/components/ui/action-confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { fetchJson } from '@/lib/fetch-json'

type Tab =
  | 'resumen' | 'datos' | 'analisis' | 'recomendacion' | 'actividad' | 'flujo'

const TABS: Array<{ id: Tab; label: string; icon: React.ElementType; mobileOnly?: boolean }> = [
  { id: 'resumen',       label: 'Resumen',    icon: LayoutDashboard },
  { id: 'datos',         label: 'Datos',      icon: FlaskConical },
  { id: 'analisis',      label: 'Análisis',   icon: TrendingUp },
  { id: 'recomendacion', label: 'Recomend.',  icon: MessageSquareText },
  { id: 'actividad',     label: 'Actividad',  icon: Clock },
  { id: 'flujo',         label: 'Flujo',      icon: Activity, mobileOnly: true },
]

const LANE_COLORS: Record<string, string> = {
  Clínica: 'bg-violet-100 text-violet-700',
  Tratamiento: 'bg-blue-100 text-blue-700',
  Laboratorio: 'bg-teal-100 text-teal-700',
  Administración: 'bg-slate-100 text-slate-600',
  Decisiones: 'bg-amber-100 text-amber-700',
  Tareas: 'bg-orange-100 text-orange-700',
}

const LANE_DOT_RING: Record<string, string> = {
  Clínica:        'ring-violet-300',
  Tratamiento:    'ring-blue-300',
  Laboratorio:    'ring-teal-300',
  Administración: 'ring-slate-300',
  Decisiones:     'ring-amber-300',
  Tareas:         'ring-orange-300',
}

const RECOMMENDATION_STATUS: Record<string, { style: string; label: string }> = {
  'Borrador IA': { style: 'bg-slate-100 text-slate-600', label: 'Borrador preparado por Agentes' },
  'Editado por farmacia': { style: 'bg-blue-50 text-blue-700', label: 'Editado por farmacia' },
  'Pendiente de revisión médica': { style: 'bg-amber-50 text-amber-700', label: 'Pendiente de revisión médica' },
  Validado: { style: 'bg-green-50 text-green-700', label: 'Validado' },
  Rechazado: { style: 'bg-red-50 text-red-700', label: 'Rechazado' },
}

const NOTE_STATUS: Record<string, { style: string }> = {
  Borrador: { style: 'bg-slate-100 text-slate-600' },
  'Informe generado': { style: 'bg-teal-50 text-teal-700' },
  'Pendiente de co-validación': { style: 'bg-amber-50 text-amber-700' },
  Validado: { style: 'bg-green-50 text-green-700' },
  'Registrado en HCE': { style: 'bg-emerald-50 text-emerald-700' },
}

const PolarAngleAxisCompat = PolarAngleAxis as unknown as React.ComponentType<any>

const DEMO_ACTOR = {
  actorName: 'Farmacéutico referente',
  actorRole: 'Farmacéutico experto',
  actorCenter: 'H.U. Bellvitge',
  actorType: 'human',
} as const

type Props = {
  caso: CasoCompleto
  program?: Program | null
  onBack: () => void
  onCaseUpdated?: (caso: CasoCompleto) => void | Promise<void>
  onCaseDeleted?: (caseId: string) => void | Promise<void>
  launchPreset?: CaseCockpitLaunchPreset
  onLaunchPresetConsumed?: () => void
}

export type CaseCockpitLaunchPreset = {
  caseId: string
  initialTab?: Tab
  openEditor?: boolean
  notice?: string
  source?: 'inbox' | 'wizard'
}

type CaseOutcomeDraft = {
  recommendationAccepted: string
  clinicalResponse: string
  treatmentDecision: string
  adverseEvents: string
  networkLearning: string
  summary: string
}

type FollowUpDraft = {
  label: string
  dueDate: string
  controlType: string
  rationale: string
  intervalDays: string
  status: string
}

function buildOutcomeDraft(caso: CasoCompleto): CaseOutcomeDraft {
  return {
    recommendationAccepted: caso.caseOutcome?.recommendationAccepted ?? '',
    clinicalResponse: caso.caseOutcome?.clinicalResponse ?? '',
    treatmentDecision: caso.caseOutcome?.treatmentDecision ?? '',
    adverseEvents: caso.caseOutcome?.adverseEvents ?? '',
    networkLearning: caso.caseOutcome?.networkLearning ?? '',
    summary: caso.caseOutcome?.summary ?? '',
  }
}

function buildFollowUpDraft(seed?: Partial<FollowUpPlan>): FollowUpDraft {
  return {
    label: seed?.label ?? '',
    dueDate: seed?.dueDate ?? '',
    controlType: seed?.controlType ?? 'Laboratorio',
    rationale: seed?.rationale ?? '',
    intervalDays: seed?.intervalDays ? String(seed.intervalDays) : '',
    status: seed?.status ?? 'Programado',
  }
}

// ── Clinical helpers ─────────────────────────────────────────────────────────

function deriveDrugLine(caso: CasoCompleto): string {
  const ctx = caso.therapyContext ?? {}
  const drugKey = Object.keys(ctx).find(k => /fármaco|drug|medicament|biológic|biologic/i.test(k))
  const doseKey = Object.keys(ctx).find(k => /^dosis|dose|^pauta/i.test(k))
  const intervalKey = Object.keys(ctx).find(k => /intervalo|interval|cadencia/i.test(k))
  const drug = drugKey ? ctx[drugKey] : null
  const dose = doseKey ? ctx[doseKey] : null
  const interval = intervalKey ? ctx[intervalKey] : null
  const parts = [drug, dose, interval].filter(Boolean)
  return parts.length ? parts.join(' · ') : Object.values(ctx).filter(Boolean).slice(0, 3).join(' · ') || '—'
}

function deriveTrough(caso: CasoCompleto): { value: string; unit: string } | null {
  const dets = caso.labDeterminants ?? []
  const hit = dets.find(d =>
    d.relationToDose === 'Valle' ||
    /concentraci[oó]n|séric|niveau|trough|sérum|sérique/i.test(d.label)
  )
  if (!hit || hit.value === null || hit.value === undefined) return null
  return { value: String(hit.value), unit: hit.unit ?? '' }
}

type MedicationHistoryEntry = {
  label: string
  doseText: string
  doseValue: number | null
  interval: string
  route: string
  dateLabel: string
  periodLabel: string
  source: string
  changeLabel: string
  isCurrent?: boolean
}

function parseDoseValue(value?: string | null) {
  if (!value) return null
  const match = String(value).match(/(\d+(?:[.,]\d+)?)/)
  return match ? Number(match[1].replace(',', '.')) : null
}

function extractDoseText(value?: string | null) {
  if (!value) return '—'
  const match = String(value).match(/(\d+(?:[.,]\d+)?\s*(?:mg|g|mcg|µg|ml))/i)
  return match ? match[1] : String(value)
}

function inferMedicationChange(label: string) {
  const normalized = label.toLowerCase()
  if (/mantener|sin cambios|ratific|continuar/i.test(normalized)) return 'Ratificación'
  if (/aument|intensif|acortar/i.test(normalized)) return 'Intensificación'
  if (/reduc|desintensif|espaciar/i.test(normalized)) return 'Reducción'
  if (/cambi|switch|suspender|retirar/i.test(normalized)) return 'Cambio'
  if (/inicio|debut|start/i.test(normalized)) return 'Inicio'
  return 'Seguimiento'
}

function deriveMedicationHistory(caso: CasoCompleto): MedicationHistoryEntry[] {
  const therapy = (caso.therapyContext ?? {}) as Record<string, any>
  const rawTimelineEntries = (caso.timeline ?? [])
    .filter((event) => event.lane === 'Tratamiento' || event.lane === 'Administración')
    .sort((a, b) => a.date.localeCompare(b.date))

  const timelineEntries = rawTimelineEntries
    .map<MedicationHistoryEntry>((event) => ({
      label: event.label,
      doseText: extractDoseText(event.label),
      doseValue: parseDoseValue(event.label),
      interval: /cada\s+[0-9]+\s*(?:sem|semanas|días|dias|h|horas)/i.exec(event.label)?.[0] ?? '',
      route: /iv|intravenosa|subcut|oral/i.exec(event.label)?.[0] ?? '',
      dateLabel: new Date(event.date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
      }),
      periodLabel: '',
      source: event.lane,
      changeLabel: inferMedicationChange(event.label),
    }))

  const previousTherapies = Array.isArray(therapy.previousTherapies)
    ? therapy.previousTherapies
    : String(therapy.previousTherapies ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)

  const previousEntries = previousTherapies.map<MedicationHistoryEntry>((item) => ({
    label: item,
    doseText: extractDoseText(item),
    doseValue: parseDoseValue(item),
    interval: /cada\s+[0-9]+\s*(?:sem|semanas|días|dias|h|horas)/i.exec(item)?.[0] ?? '',
    route: /iv|intravenosa|subcut|oral/i.exec(item)?.[0] ?? '',
    dateLabel: 'Previo',
    periodLabel: 'Periodo previo',
    source: 'Historial',
    changeLabel: 'Antecedente',
  }))

  const currentEntry: MedicationHistoryEntry = {
    label: String(therapy.currentDrug ?? 'Tratamiento actual'),
    doseText: extractDoseText(String(therapy.currentDose ?? '')),
    doseValue: parseDoseValue(String(therapy.currentDose ?? '')),
    interval: String(therapy.interval ?? ''),
    route: String(therapy.route ?? ''),
    dateLabel: 'Actual',
    periodLabel: 'En curso',
    source: 'Tratamiento actual',
    changeLabel: 'Pauta vigente',
    isCurrent: true,
  }

  const enrichedTimelineEntries = timelineEntries.map((entry, index) => {
    const nextEntry = timelineEntries[index + 1]
    return {
      ...entry,
      periodLabel: nextEntry ? `${entry.dateLabel} → ${nextEntry.dateLabel}` : `${entry.dateLabel} → actual`,
    }
  })

  return [...previousEntries, ...enrichedTimelineEntries, currentEntry]
}

const DEFAULT_MANUAL_REVIEW: FieldReviewMeta = {
  origin: 'manual',
  state: 'confirmed',
  sourceLabel: 'Registrado manualmente',
}

function getFieldReviewMeta(caso: CasoCompleto, path: string): FieldReviewMeta {
  const review = caso.fieldReview?.[path]
  if (!review) return DEFAULT_MANUAL_REVIEW
  return {
    origin: review.origin ?? 'manual',
    state: review.state ?? (review.origin === 'llm' ? 'pending' : 'confirmed'),
    sourceLabel:
      review.sourceLabel ??
      (review.origin === 'llm' ? 'Extraído del email' : 'Registrado manualmente'),
  }
}

function getDraftFieldReviewMeta(
  reviewMap: Record<string, FieldReviewMeta>,
  path: string,
): FieldReviewMeta {
  const review = reviewMap[path]
  if (!review) return DEFAULT_MANUAL_REVIEW
  return {
    origin: review.origin ?? 'manual',
    state: review.state ?? (review.origin === 'llm' ? 'pending' : 'confirmed'),
    sourceLabel:
      review.sourceLabel ??
      (review.origin === 'llm' ? 'Extraído del email' : 'Registrado manualmente'),
  }
}

type PkpdStatus = { label: string; color: string; bg: string; border: string; dot: string }
function pkpdStatus(pattern: string): PkpdStatus {
  const p = (pattern ?? '').toLowerCase()
  if (/infra|bajo|sub|under|low/i.test(p))
    return { label: 'Infraexposición', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-400' }
  if (/sobre|supra|alto|over|high/i.test(p))
    return { label: 'Sobreexposición', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500' }
  if (/rango|range|objetivo|optim|diana/i.test(p))
    return { label: 'En rango', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' }
  return { label: pattern || '—', color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200', dot: 'bg-slate-400' }
}

function ClinicalIdentityBar({ caso }: { caso: CasoCompleto }) {
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
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#4a7068]">Tratamiento</p>
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
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#4a7068]">Concentración (valle)</p>
            <p className="text-sm font-semibold text-[#152520]">
              {trough ? `${trough.value} ${trough.unit}`.trim() : '—'}
            </p>
          </div>
        </div>

        <div className="h-8 w-px bg-slate-200" />

        {/* PK/PD status */}
        <div className={`flex items-center gap-2 rounded-xl border ${status.border} ${status.bg} px-3 py-1.5`}>
          <span className={`h-2 w-2 rounded-full ${status.dot}`} />
          <span className={`text-xs font-semibold ${status.color}`}>{status.label}</span>
          {caso.pkpdInterpretation?.confidence && (
            <span className="ml-1 text-[10px] text-slate-400">· Confianza {caso.pkpdInterpretation.confidence}</span>
          )}
        </div>

        {/* Patient quick info */}
        {caso.patientProfile && (
          <>
            <div className="h-8 w-px bg-slate-200 hidden xl:block" />
            <div className="hidden xl:flex items-center gap-2 text-xs text-[#4a7068]">
              {caso.patientProfile.age && <span>{caso.patientProfile.age} años</span>}
              {caso.patientProfile.sex && <span>· {caso.patientProfile.sex}</span>}
              {caso.patientProfile.weightKg && <span>· {caso.patientProfile.weightKg} kg</span>}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export function CaseCockpit({
  caso,
  program,
  onBack,
  onCaseUpdated,
  onCaseDeleted,
  launchPreset,
  onLaunchPresetConsumed,
}: Props) {
  const [currentCase, setCurrentCase] = useState(caso)
  const [activeTab, setActiveTab] = useState<Tab>('resumen')
  const [recText, setRecText] = useState(caso.recommendation?.text ?? '')
  const [noteText, setNoteText] = useState(caso.clinicalNote?.text ?? '')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorSaving, setEditorSaving] = useState(false)
  const [editorError, setEditorError] = useState<string | null>(null)
  const [editorDraft, setEditorDraft] = useState(() => buildEditorDraft(caso))
  const [closeOutcomeOpen, setCloseOutcomeOpen] = useState(false)
  const [closeOutcomeDraft, setCloseOutcomeDraft] = useState(() => buildOutcomeDraft(caso))
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [actionBusy, setActionBusy] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionNotice, setActionNotice] = useState<string | null>(null)
  const appliedPresetRef = useRef<string | null>(null)

  useEffect(() => {
    setCurrentCase(caso)
    setRecText(caso.recommendation?.text ?? '')
    setNoteText(caso.clinicalNote?.text ?? '')
    setEditorDraft(buildEditorDraft(caso))
    setCloseOutcomeDraft(buildOutcomeDraft(caso))
  }, [caso])

  useEffect(() => {
    if (!launchPreset || launchPreset.caseId !== caso.caseId) return

    const presetKey = JSON.stringify(launchPreset)
    if (appliedPresetRef.current === presetKey) return

    if (launchPreset.initialTab) {
      setActiveTab(launchPreset.initialTab)
    }
    if (launchPreset.notice) {
      setActionNotice(launchPreset.notice)
    }
    if (launchPreset.openEditor) {
      setEditorDraft(buildEditorDraft(caso))
      setEditorError(null)
      setEditorOpen(true)
    }

    appliedPresetRef.current = presetKey
    onLaunchPresetConsumed?.()
  }, [caso, launchPreset, onLaunchPresetConsumed])

  const stageIndex = PIPELINE_STAGES.findIndex((s) => s === currentCase.pipelineStage)
  const criticalGaps = currentCase.gaps?.filter((g) => g.severity === 'Crítico') ?? []
  const totalGaps = currentCase.gaps?.length ?? 0

  function openEditor() {
    setEditorDraft(buildEditorDraft(currentCase))
    setEditorError(null)
    setEditorOpen(true)
  }

  function openCloseOutcome() {
    setCloseOutcomeDraft(buildOutcomeDraft(currentCase))
    setCloseOutcomeOpen(true)
  }

  async function runCaseMutation(
    actionKey: string,
    input: RequestInfo | URL,
    init: RequestInit,
    successMessage: string,
  ) {
    setActionBusy(actionKey)
    setActionError(null)
    setActionNotice(null)

    try {
      const updated = await fetchJson<CasoCompleto>(input, init)
      setCurrentCase(updated)
      setRecText(updated.recommendation?.text ?? '')
      setNoteText(updated.clinicalNote?.text ?? '')
      const stageChanged = updated.pipelineStage !== currentCase.pipelineStage
      const stageMessage = stageChanged
        ? ` La etapa ha cambiado de «${currentCase.pipelineStage}» a «${updated.pipelineStage}».`
        : ''
      setActionNotice(`${successMessage}${stageMessage}`)
      await onCaseUpdated?.(updated)
      return updated
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'No se ha podido completar la acción solicitada.')
      return null
    } finally {
      setActionBusy(null)
    }
  }

  async function saveEditor() {
    setEditorSaving(true)
    setEditorError(null)

    try {
      const updated = await fetchJson<CasoCompleto>(`/api/xarxa/cases/${currentCase.caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...DEMO_ACTOR,
          title: editorDraft.title,
          clinicalSummary: editorDraft.clinicalSummary,
          fieldReview: editorDraft.fieldReview,
          nextAction: editorDraft.nextAction,
          patientProfile: {
            age: editorDraft.age ? Number(editorDraft.age) : null,
            sex: editorDraft.sex || null,
            weightKg: editorDraft.weightKg ? Number(editorDraft.weightKg) : null,
            heightCm: editorDraft.heightCm ? Number(editorDraft.heightCm) : null,
            specialPopulation: parseCommaList(editorDraft.specialPopulation),
          },
          diseaseContext: {
            diagnosis: editorDraft.diagnosis,
            phenotype: editorDraft.phenotype,
            activity: editorDraft.activity,
            extraintestinal: editorDraft.extraintestinal,
          },
          therapyContext: {
            currentDrug: editorDraft.currentDrug,
            currentDose: editorDraft.currentDose || null,
            interval: editorDraft.interval || null,
            route: editorDraft.route || null,
            previousTherapies: editorDraft.previousTherapies || null,
            adherence: editorDraft.adherence || null,
          },
          labDeterminants: editorDraft.labDeterminants.map((item) => ({
            label: item.label,
            value: item.value,
            unit: item.unit || null,
            status: item.status,
            source: item.source,
            relationToDose: item.relationToDose || null,
            interpretation: item.interpretation || null,
          })),
        }),
      })

      setCurrentCase(updated)
      setRecText(updated.recommendation?.text ?? '')
      const stageChanged = updated.pipelineStage !== currentCase.pipelineStage
      setActionNotice(
        stageChanged
          ? `Los datos clínicos se han guardado y la etapa ha cambiado de «${currentCase.pipelineStage}» a «${updated.pipelineStage}» tras reevaluar gaps y determinantes.`
          : 'Los datos clínicos se han guardado y el workflow se ha reevaluado.'
      )
      await onCaseUpdated?.(updated)
      setEditorOpen(false)
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : 'No se han podido guardar los cambios clínicos.')
    } finally {
      setEditorSaving(false)
    }
  }

  async function transitionCase(body: Record<string, unknown>, successMessage: string) {
    return runCaseMutation(
      `transition:${String(body.eventLabel ?? successMessage)}`,
      `/api/xarxa/cases/${currentCase.caseId}/transition`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...DEMO_ACTOR, ...body }),
      },
      successMessage,
    )
  }

  async function deleteCurrentCase() {
    if (currentCase.demoLocked || currentCase.deletable === false) {
      setActionError('Este caso de demo está protegido y no se puede eliminar.')
      setActionNotice(null)
      return
    }

    setActionBusy('delete')
    setActionError(null)
    setActionNotice(null)
    try {
      await fetchJson(`/api/xarxa/cases/${currentCase.caseId}`, { method: 'DELETE' })
      setActionNotice(`El caso ${currentCase.caseId} se ha eliminado.`)
      setDeleteConfirmOpen(false)
      await onCaseDeleted?.(currentCase.caseId)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'No se ha podido eliminar el caso.')
    } finally {
      setActionBusy(null)
    }
  }

  async function updateTask(taskId: string, body: Record<string, unknown>, successMessage: string) {
    return runCaseMutation(
      `task:${taskId}`,
      `/api/xarxa/cases/${currentCase.caseId}/tasks/${taskId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...DEMO_ACTOR, ...body }),
      },
      successMessage,
    )
  }

  async function saveRecommendation(body: Record<string, unknown>, successMessage: string) {
    return runCaseMutation(
      'recommendation',
      `/api/xarxa/cases/${currentCase.caseId}/recommendation`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...DEMO_ACTOR, ...body }),
      },
      successMessage,
    )
  }

  async function saveNote(body: Record<string, unknown>, successMessage: string) {
    return runCaseMutation(
      'note',
      `/api/xarxa/cases/${currentCase.caseId}/note`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...DEMO_ACTOR, ...body }),
      },
      successMessage,
    )
  }

  async function generateNoteDraft() {
    setActiveTab('recomendacion')
    return runCaseMutation(
      'note:generate',
      `/api/xarxa/cases/${currentCase.caseId}/note/generate`,
      { method: 'POST' },
      'Se ha generado un borrador de informe HCE.',
    )
  }

  async function orchestrateCase() {
    setActiveTab('resumen')
    return runCaseMutation(
      'orchestrate',
      `/api/xarxa/cases/${currentCase.caseId}/orchestrate`,
      { method: 'POST' },
      'El sistema ha preparado el paquete automático del caso para validación humana.',
    )
  }

  async function saveFollowUp(body: Record<string, unknown>, successMessage: string) {
    return runCaseMutation(
      `followup:${String(body.label ?? '')}`,
      `/api/xarxa/cases/${currentCase.caseId}/followup`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...DEMO_ACTOR, ...body }),
      },
      successMessage,
    )
  }

  async function updateFieldReviewState(path: string, state: FieldReviewMeta['state']) {
    const currentReview = getFieldReviewMeta(currentCase, path)
    const nextFieldReview = {
      ...(currentCase.fieldReview ?? {}),
      [path]: {
        ...currentReview,
        state,
        sourceLabel: currentReview.sourceLabel ?? (currentReview.origin === 'llm' ? 'Extraído del email' : 'Registrado manualmente'),
      },
    }

    return runCaseMutation(
      `field-review:${path}`,
      `/api/xarxa/cases/${currentCase.caseId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...DEMO_ACTOR,
          fieldReview: nextFieldReview,
        }),
      },
      'Se ha actualizado el estado de validación del campo.',
    )
  }

  function openPrintableNote() {
    void (async () => {
      setActionBusy('note:pdf')
      setActionError(null)
      setActionNotice(null)

      try {
        const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')
        const noteBody = noteText || currentCase.clinicalNote?.text || 'Sin contenido disponible.'
        const pdf = await PDFDocument.create()
        const regularFont = await pdf.embedFont(StandardFonts.Helvetica)
        const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold)
        const pageWidth = 595.28
        const pageHeight = 841.89
        const marginX = 48
        const marginBottom = 56
        const maxWidth = pageWidth - marginX * 2
        let page = pdf.addPage([pageWidth, pageHeight])
        let cursorY = 56

        const drawText = (
          text: string,
          x: number,
          y: number,
          size: number,
          font: typeof regularFont,
          color: ReturnType<typeof rgb>
        ) => {
          page.drawText(text, {
            x,
            y: pageHeight - y,
            size,
            font,
            color,
          })
        }

        const addWrappedText = (
          text: string,
          options?: { size?: number; color?: ReturnType<typeof rgb>; gapAfter?: number }
        ) => {
          const size = options?.size ?? 11
          const color = options?.color ?? rgb(21 / 255, 37 / 255, 32 / 255)
          const gapAfter = options?.gapAfter ?? 16
          const lines: string[] = []
          const paragraphs = text.split('\n')

          for (const paragraph of paragraphs) {
            const words = paragraph.split(/\s+/).filter(Boolean)
            let currentLine = ''

            if (words.length === 0) {
              lines.push('')
              continue
            }

            for (const word of words) {
              const candidate = currentLine ? `${currentLine} ${word}` : word
              if (regularFont.widthOfTextAtSize(candidate, size) <= maxWidth) {
                currentLine = candidate
              } else {
                if (currentLine) lines.push(currentLine)
                currentLine = word
              }
            }
            if (currentLine) lines.push(currentLine)
          }

          const lineHeight = size + 4
          const estimatedHeight = lines.length * lineHeight
          if (cursorY + estimatedHeight > pageHeight - marginBottom) {
            page = pdf.addPage([pageWidth, pageHeight])
            cursorY = 56
          }
          for (const line of lines) {
            drawText(line, marginX, cursorY, size, regularFont, color)
            cursorY += lineHeight
          }
          cursorY += gapAfter
        }

        const addSectionTitle = (text: string) => {
          if (cursorY > pageHeight - 96) {
            page = pdf.addPage([pageWidth, pageHeight])
            cursorY = 56
          }
          drawText(
            text.toUpperCase(),
            marginX,
            cursorY,
            10,
            boldFont,
            rgb(74 / 255, 112 / 255, 104 / 255)
          )
          cursorY += 18
        }

        drawText(
          `${currentCase.caseId} · Informe HCE`,
          marginX,
          cursorY,
          18,
          boldFont,
          rgb(21 / 255, 37 / 255, 32 / 255)
        )
        cursorY += 22

        addWrappedText(
          `${currentCase.title} · ${currentCase.patientCode} · ${currentCase.centerName}`,
          { size: 10, color: rgb(74 / 255, 112 / 255, 104 / 255), gapAfter: 20 }
        )

        addSectionTitle('Estado del informe')
        addWrappedText(currentCase.clinicalNote?.status || 'Borrador', { size: 11, gapAfter: 18 })

        addSectionTitle('Texto del informe')
        addWrappedText(noteBody, { size: 11, gapAfter: 18 })

        addSectionTitle('Aviso')
        addWrappedText(
          'Documento generado desde Xarxa PK/PD Intelligence Hub. Requiere validación profesional antes de registro definitivo en HCE.',
          { size: 10, color: rgb(74 / 255, 112 / 255, 104 / 255), gapAfter: 0 }
        )

        const safeCaseId = currentCase.caseId.toLowerCase().replace(/[^a-z0-9-]+/g, '-')
        const pdfBytes = await pdf.save()
        const blob = new Blob([pdfBytes], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${safeCaseId}-informe-hce.pdf`
        link.click()
        URL.revokeObjectURL(url)
        setActionNotice('Se ha descargado el informe HCE en PDF.')
      } catch (error) {
        setActionError(
          error instanceof Error
            ? error.message
            : 'No se ha podido generar el PDF del informe.'
        )
      } finally {
        setActionBusy(null)
      }
    })()
  }

  async function requestGapFollowUp(gapLabel: string) {
    const linkedTask = (currentCase.tasks ?? []).find((task) => task.title === gapLabel)
    if (linkedTask) {
      await updateTask(
        linkedTask.taskId,
        {
          status: 'En curso',
          eventLabel: `Solicitud enviada para completar: ${gapLabel}`,
        },
        'Se ha activado la solicitud de datos para este gap.',
      )
      return
    }

    await transitionCase(
      {
        pipelineStage: 'Datos incompletos',
        nextAction: 'Solicitar datos al centro solicitante',
        eventLabel: `Gap marcado para completar: ${gapLabel}`,
      },
      'El caso queda pendiente de completar datos.',
    )
  }

  function nextFollowupDate(days: number) {
    const target = new Date()
    target.setDate(target.getDate() + days)
    return target.toISOString().slice(0, 10)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Sticky case header */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-3">
        <button
          onClick={onBack}
          className="mb-1.5 flex items-center gap-1.5 text-xs text-[#4a7068] hover:text-[#7b3fa0]"
        >
          <ArrowLeft className="h-3 w-3" /> Volver a casos
        </button>
        {/* Title */}
        <h2 className="text-xl font-semibold text-[#152520] leading-snug">{currentCase.title}</h2>
        {/* Next action + gap alerts */}
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-[#7b3fa0]">{currentCase.nextAction}</span>
          {criticalGaps.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 ring-1 ring-red-200">
              <AlertTriangle className="h-3 w-3" />
              {criticalGaps.length} crítico{criticalGaps.length > 1 ? 's' : ''}
            </span>
          )}
          {totalGaps > criticalGaps.length && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
              {totalGaps - criticalGaps.length} gap{totalGaps - criticalGaps.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {/* Compact meta: patient + requester */}
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-[#4a7068]">
            {currentCase.patientCode}
            {currentCase.patientProfile?.age ? ` · ${currentCase.patientProfile.age}a` : ''}
            {currentCase.patientProfile?.sex ? ` · ${currentCase.patientProfile.sex}` : ''}
            {' · '}{currentCase.centerName}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-[#4a7068]">
            <PersonAvatar name={currentCase.requesterName} size="xs" />
            {currentCase.requesterName}
          </span>
          {currentCase.demoLocked || currentCase.deletable === false ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200">
              Demo protegido
            </span>
          ) : null}
        </div>
      </div>

      {/* Clinical identity bar */}
      <ClinicalIdentityBar caso={currentCase} />

      {/* Tabs + content + pipeline panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left column: tabs + scrollable content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-slate-200 bg-white px-6">
            <div className="flex overflow-x-auto">
              {TABS.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                const hasCritical =
                  tab.id === 'resumen' ? criticalGaps.length > 0 :
                  tab.id === 'recomendacion' ? (
                    currentCase.recommendation?.status === 'Borrador IA' ||
                    currentCase.recommendation?.status === 'Pendiente de revisión médica'
                  ) : false
                const hasWarning =
                  tab.id === 'resumen' ? (!hasCritical && totalGaps > 0) : false
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-semibold tracking-wide transition ${tab.mobileOnly ? 'lg:hidden' : ''} ${
                      isActive
                        ? 'border-[#7b3fa0] text-[#7b3fa0]'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {tab.label}
                    {hasCritical && (
                      <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-red-500" />
                    )}
                    {hasWarning && (
                      <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Contextual action toolbar — sticky between tab bar and content */}
          <div className="shrink-0 border-b border-slate-100 bg-[#faf6fd]/70 px-6 py-2">
            <StageActions
              caso={currentCase}
              actionBusy={actionBusy}
              onOrchestrate={() => void orchestrateCase()}
              onEdit={openEditor}
              onGenerateNote={() => void generateNoteDraft()}
              onRequestData={() =>
                void transitionCase(
                  { pipelineStage: 'Datos incompletos', nextAction: 'Completar determinantes pendientes', eventLabel: 'Se solicita completar datos clínicos y determinantes' },
                  'El caso se ha devuelto para completar datos.',
                )
              }
              onMarkSession={() =>
                void transitionCase(
                  { pipelineStage: 'Discusión en red', nextAction: 'Preparar resumen para sesión de red', eventLabel: 'Caso marcado para sesión de red' },
                  'El caso se ha marcado para sesión de red.',
                )
              }
              onClose={openCloseOutcome}
              onDelete={() => setDeleteConfirmOpen(true)}
            />
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {actionError ? (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {actionError}
              </div>
            ) : null}
            {actionNotice ? (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-[#7b3fa0]">
                {actionNotice}
              </div>
            ) : null}
            <div className="min-w-0">
              {activeTab === 'resumen' && (
                <>
                  <TabResumen
                    caso={currentCase}
                    onOpenTab={setActiveTab}
                    onConfirm={() =>
                      void transitionCase(
                        {
                          pipelineStage: 'Determinantes recibidos',
                          nextAction: 'Revisión farmacéutica',
                          eventLabel: 'Caso confirmado para revisión farmacéutica',
                        },
                        'El caso ha avanzado a revisión farmacéutica.',
                      )
                    }
                    onRequestData={() =>
                      void transitionCase(
                        {
                          pipelineStage: 'Datos incompletos',
                          nextAction: 'Completar determinantes críticos',
                          eventLabel: 'Se han solicitado datos adicionales para la revisión',
                        },
                        'Se han solicitado datos adicionales para el caso.',
                      )
                    }
                  />
                  <div className="my-6 border-t border-slate-100" />
                  <TabGaps
                    caso={currentCase}
                    busyKey={actionBusy}
                    onRequestGap={requestGapFollowUp}
                    onResolveTask={(taskId) =>
                      void updateTask(
                        taskId,
                        { status: 'Resuelta', eventLabel: 'Tarea marcada como resuelta' },
                        'La tarea se ha marcado como resuelta.',
                      )
                    }
                    onStartTask={(taskId) =>
                      void updateTask(
                        taskId,
                        { status: 'En curso', eventLabel: 'Tarea puesta en curso' },
                        'La tarea queda en curso.',
                      )
                    }
                  />
                </>
              )}
              {activeTab === 'datos' && (
                <TabDatos
                  caso={currentCase}
                  onEdit={openEditor}
                  busyKey={actionBusy}
                  onUpdateDeterminantReview={(path, state) => void updateFieldReviewState(path, state)}
                />
              )}
              {activeTab === 'analisis' && (
                <>
                  <TabAnalisis caso={currentCase} program={program} />
                  <div className="my-6 border-t border-slate-100" />
                  <TabSimulacion caso={currentCase} program={program} />
                </>
              )}
              {activeTab === 'recomendacion' && (
                <>
                <TabRecomendacion
                  caso={currentCase}
                  program={program}
                  recText={recText}
                  onRecChange={setRecText}
                  busy={actionBusy === 'recommendation'}
                  onAcceptDraft={() =>
                    void saveRecommendation(
                      {
                        status: 'Editado por farmacia',
                        text: recText,
                        pipelineStage: 'Revisión farmacéutica',
                        nextAction: 'Valorar envío a revisión médica',
                        eventLabel: 'Recomendación revisada por farmacia',
                      },
                      'La recomendación se ha guardado como borrador revisado.',
                    )
                  }
                  onRequestData={() =>
                    void saveRecommendation(
                      {
                        status: currentCase.recommendation?.status ?? 'Borrador IA',
                        text: recText,
                        pipelineStage: 'Datos incompletos',
                        nextAction: 'Completar información antes de validar',
                        eventLabel: 'La recomendación se ha pausado por falta de datos',
                      },
                      'La recomendación queda pendiente de más datos.',
                    )
                  }
                  onSendDigestivo={() =>
                    void saveRecommendation(
                      {
                        status: 'Pendiente de revisión médica',
                        text: recText,
                        pipelineStage: 'Revisión médica',
                        nextAction: 'Revisión médica del caso',
                        eventLabel: 'Recomendación enviada a revisión médica',
                      },
                      'La recomendación se ha enviado a revisión médica.',
                    )
                  }
                  onSendSession={() =>
                    void saveRecommendation(
                      {
                        status: 'Pendiente de revisión médica',
                        text: recText,
                        pipelineStage: 'Discusión en red',
                        nextAction: 'Preparar discusión en red',
                        eventLabel: 'Recomendación escalada a sesión de red',
                      },
                      'La recomendación se ha escalado a la sesión de red.',
                    )
                  }
                  onReject={() =>
                    void saveRecommendation(
                      {
                        status: 'Rechazado',
                        text: recText,
                        nextAction: 'Reformular propuesta con validación humana',
                        eventLabel: 'Recomendación rechazada y devuelta a revisión',
                      },
                      'La recomendación se ha marcado como rechazada.',
                    )
                  }
                />
                <div className="my-6 border-t border-slate-100" />
                <TabInforme
                  caso={currentCase}
                  program={program}
                  noteText={noteText}
                  onNoteChange={setNoteText}
                  busy={actionBusy === 'note' || actionBusy === 'note:generate'}
                  onGenerateDraft={() => void generateNoteDraft()}
                  onSaveDraft={() =>
                    void saveNote(
                      {
                        status: currentCase.clinicalNote?.status || 'Borrador',
                        text: noteText,
                        eventLabel: 'Borrador de informe guardado manualmente',
                      },
                      'Se han guardado los cambios del informe.',
                    )
                  }
                  onRequestCovalidation={() =>
                    void saveNote(
                      {
                        status: 'Pendiente de co-validación',
                        text: noteText,
                        pipelineStage: 'Informe generado',
                        nextAction: 'Co-validación clínica del informe',
                        eventLabel: 'Informe enviado a co-validación',
                      },
                      'El informe se ha enviado a co-validación.',
                    )
                  }
                  onSendToEhr={() =>
                    void saveNote(
                      {
                        status: 'Registrado en HCE',
                        text: noteText,
                        pipelineStage: 'Registrado en HCE',
                        nextAction: 'Programar seguimiento a 4 semanas',
                        eventLabel: 'Informe registrado en HCE',
                      },
                      'El informe se ha marcado como registrado en HCE.',
                    )
                  }
                  onExportPdf={openPrintableNote}
                />
                </>
              )}
              {activeTab === 'flujo' && (
                <div className="lg:hidden">
                  <PipelinePanel
                    caso={currentCase}
                    actionBusy={actionBusy}
                    inline
                  />
                </div>
              )}
              {activeTab === 'actividad' && (
                <>
                  <TabTimeline caso={currentCase} />
                  <div className="my-6 border-t border-slate-100" />
                  <TabAprendizaje
                    caso={currentCase}
                    busyKey={actionBusy}
                    onRegisterFollowUp={(plan) =>
                      void saveFollowUp(
                        {
                          label: plan.label,
                          status: plan.status ?? 'Programado',
                          dueDate: plan.dueDate,
                          controlType: plan.controlType,
                          rationale: plan.rationale,
                          intervalDays: plan.intervalDays,
                          pipelineStage: plan.label,
                          nextAction: `Esperar ${plan.label.toLowerCase()}`,
                          eventLabel: `${plan.label} programado`,
                        },
                        `Se ha programado ${plan.label.toLowerCase()}.`,
                      )
                    }
                    onCompleteFollowUp={(label) =>
                      void saveFollowUp(
                        {
                          label,
                          status: 'Completado',
                          nextAction: 'Registrar resultado y lección aprendida',
                          eventLabel: `${label} completado`,
                        },
                        `${label} se ha marcado como completado.`,
                      )
                    }
                    nextFollowupDate={nextFollowupDate}
                  />
                  <div className="my-6 border-t border-slate-100" />
                  <TabAuditoria caso={currentCase} />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right column: pipeline panel */}
        <PipelinePanel
          caso={currentCase}
          actionBusy={actionBusy}
        />
      </div>

      {editorOpen ? (
        <CaseEditorSheet
          draft={editorDraft}
          entrySource={currentCase.entrySource}
          emailOriginal={currentCase.emailOriginal}
          onChange={setEditorDraft}
          onClose={() => setEditorOpen(false)}
          onSave={saveEditor}
          saving={editorSaving}
          error={editorError}
        />
      ) : null}

      {closeOutcomeOpen ? (
        <CloseOutcomeSheet
          draft={closeOutcomeDraft}
          saving={actionBusy === 'transition:Caso cerrado con outcome registrado'}
          onClose={() => setCloseOutcomeOpen(false)}
          onChange={setCloseOutcomeDraft}
          onSave={() =>
            void transitionCase(
              {
                pipelineStage: 'Cerrado con resultado',
                nextAction: 'Caso cerrado con outcome registrado',
                eventLabel: 'Caso cerrado con outcome registrado',
                caseOutcome: closeOutcomeDraft,
              },
              'El caso se ha cerrado y el outcome ha quedado registrado.',
            ).then((updated) => {
              if (updated) setCloseOutcomeOpen(false)
            })
          }
        />
      ) : null}

      <ActionConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={`Eliminar ${currentCase.caseId}`}
        description={`Se eliminarán el caso «${currentCase.title}», sus tareas, timeline, recomendación, nota clínica, seguimiento y trazas de agentes asociadas.`}
        confirmLabel="Eliminar caso"
        cancelLabel="Cancelar"
        tone="danger"
        icon={<Trash2 className="h-5 w-5" />}
        confirmBusy={actionBusy === 'delete'}
        onConfirm={() => void deleteCurrentCase()}
      />
	    </div>
	  )
}

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

function TherapeuticWindowGauge({ value, unit, drugLine, status }: {
  value: number | null; unit: string; drugLine: string; status: PkpdStatus
}) {
  const range = resolveRange(drugLine)
  const { lo, hi, max } = range
  const pct = (v: number) => Math.min(100, Math.max(0, (v / max) * 100))
  return (
    <div className={`rounded-xl border ${status.border} ${status.bg} px-5 py-4`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#4a7068]">Concentración sérica (valle)</p>
          <p className={`mt-0.5 text-3xl font-bold tabular-nums ${status.color}`}>
            {value !== null ? `${value} ${unit}`.trim() : '—'}
          </p>
          <p className={`mt-0.5 text-xs font-semibold ${status.color}`}>{status.label}</p>
        </div>
        <div className={`rounded-xl border ${status.border} bg-white px-3 py-1.5 text-center`}>
          <p className="text-[9px] uppercase tracking-wide text-slate-400">Objetivo</p>
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
          <span className="font-medium text-emerald-600">▲ {lo}–{hi} {range.unit} objetivo</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  )
}

// 2. Case health radar (Recharts)
function CaseHealthRadar({ completeness, confidence, priority, gapCount, gapCritical }: {
  completeness: number; confidence: string; priority: string
  gapCount: number; gapCritical: number
}) {
  const confScore = confidence === 'Alta' ? 90 : confidence === 'Media' ? 60 : 35
  const riskScore = priority === 'Alta' ? 25 : priority === 'Media' ? 60 : 90
  const gapsScore = gapCount === 0 ? 100 : Math.max(10, 100 - gapCritical * 30 - (gapCount - gapCritical) * 10)
  const data = [
    { axis: 'Completitud', value: completeness },
    { axis: 'Confianza PK/PD', value: confScore },
    { axis: 'Sin riesgo', value: riskScore },
    { axis: 'Gaps ok', value: gapsScore },
  ]
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-[#4a7068]">Salud del caso</p>
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
            { label: 'Completitud', value: `${completeness}%` },
            { label: 'Confianza PK/PD', value: confidence || '—' },
            { label: 'Riesgo', value: priority === 'Alta' ? 'Alto' : priority === 'Media' ? 'Medio' : 'Bajo' },
            { label: 'Gaps', value: `${gapCount} (${gapCritical} críticos)` },
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
function GapSeverityDonut({ gaps, activeFilter, onFilter }: {
  gaps: Array<{ severity: string }>
  activeFilter: string | null
  onFilter: (s: string | null) => void
}) {
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
            {value} {name}
          </button>
        ))}
        {activeFilter && (
          <button onClick={() => onFilter(null)} className="text-[10px] text-slate-400 underline hover:text-slate-600">
            Ver todos
          </button>
        )}
      </div>
    </div>
  )
}

// 5. Confidence radar — TabAnalisis
function ConfidenceRadar({ completeness, confidence }: { completeness: number; confidence: string }) {
  const confScore = confidence === 'Alta' ? 90 : confidence === 'Media' ? 65 : 40
  const coherence = Math.min(100, completeness + 10)
  const data = [
    { axis: 'Determinantes', value: completeness },
    { axis: 'Interpretabilidad', value: confScore },
    { axis: 'Coherencia', value: coherence },
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
function LabBulletChart({ determinants }: {
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
function FollowUpTimelineRuler({ followUps }: {
  followUps: Array<{ label: string; dueDate?: string | null; status: string }>
}) {
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
      <p className="mb-5 text-[10px] uppercase tracking-[0.18em] text-[#4a7068]">Cronograma de seguimiento</p>
      <div className="relative py-7">
        <div className="absolute left-[3%] right-[3%] top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-slate-200" />
        {/* Today */}
        <div className="absolute top-1/2 left-[3%] -translate-y-1/2 -translate-x-1/2">
          <div className="h-3.5 w-3.5 animate-pulse rounded-full bg-[#7b3fa0] ring-4 ring-[#7b3fa0]/20" />
          <p className="absolute top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold text-[#7b3fa0]">Hoy</p>
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
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#7b3fa0]" />Hoy</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-400" />Pendiente</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />Completado</span>
      </div>
    </div>
  )
}

// ── Tab: Resumen ─────────────────────────────────────────────────────────────

function TabResumen({
  caso,
  onOpenTab,
  onConfirm,
  onRequestData,
}: {
  caso: CasoCompleto
  onOpenTab: (tab: Tab) => void
  onConfirm: () => void
  onRequestData: () => void
}) {
  const completeness = Math.round(
    ((caso.labDeterminants?.filter((d) => d.status === 'Confirmado').length ?? 0) /
      Math.max(caso.labDeterminants?.length ?? 1, 1)) * 100
  )
  const criticalGapsResumen = caso.gaps?.filter((g) => g.severity === 'Crítico') ?? []
  const focus = stageFocus(caso.pipelineStage)

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[#7b3fa0]/20 bg-[#faf6fd] px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#7b3fa0]">Foco de la etapa</p>
            <p className="mt-1.5 text-lg font-semibold text-[#152520]">{focus.title}</p>
            <p className="mt-1 text-sm leading-6 text-[#4a7068]">{focus.detail}</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenTab(focus.tab)}
            className="rounded-full border border-[#7b3fa0]/20 bg-white px-3 py-1.5 text-xs font-semibold text-[#7b3fa0] transition hover:bg-[#f3ebfa]"
          >
            Abrir {focus.ctaLabel}
          </button>
        </div>
        {criticalGapsResumen.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {criticalGapsResumen.slice(0, 2).map((g, i) => (
              <div key={i} className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700 ring-1 ring-red-200">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {g.label}
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 flex gap-2">
          <Button size="sm" className="rounded-xl bg-[#7b3fa0] text-xs text-white hover:bg-[#6a3490]" onClick={onConfirm}>Confirmar</Button>
          <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onRequestData}>Solicitar datos</Button>
          <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => onOpenTab(focus.tab)}>
            Ir a {focus.ctaLabel}
          </Button>
        </div>
      </div>

      {/* Summary card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#4a7068]">Resumen clínico</p>
          </div>
          <Sparkles className="h-5 w-5 shrink-0 text-[#7b3fa0]" />
        </div>
        <p className="mt-3 text-sm leading-7 text-[#152520]">{caso.clinicalSummary}</p>
      </div>

      {/* 1. Therapeutic window gauge */}
      {(() => {
        const trough = deriveTrough(caso)
        const status = pkpdStatus(caso.pkpdInterpretation?.pattern ?? '')
        const val = trough ? parseFloat(trough.value) : null
        const drugLine = deriveDrugLine(caso)
        return (
          <TherapeuticWindowGauge
            value={val}
            unit={trough?.unit ?? 'µg/mL'}
            drugLine={drugLine}
            status={status}
          />
        )
      })()}

      {/* 2. Case health radar */}
      <CaseHealthRadar
        completeness={completeness}
        confidence={caso.pkpdInterpretation?.confidence ?? '—'}
        priority={caso.priority ?? 'Baja'}
        gapCount={caso.gaps?.length ?? 0}
        gapCritical={caso.gaps?.filter(g => g.severity === 'Crítico').length ?? 0}
      />

    </div>
  )
}

function stageFocus(stage: string): {
  title: string
  detail: string
  tab: Tab
  ctaLabel: string
} {
  if (['Solicitud recibida', 'Caso creado por IA', 'Datos incompletos', 'Pendiente de determinantes', 'Determinantes recibidos'].includes(stage)) {
    return {
      title: 'Completar el contexto clínico antes de seguir avanzando',
      detail: 'En esta etapa conviene validar tratamiento, determinantes, relación con la dosis y campos sugeridos por Agentes.',
      tab: 'datos',
      ctaLabel: 'Datos',
    }
  }
  if (['Análisis PK/PD generado', 'Revisión farmacéutica', 'Revisión médica', 'Discusión en red'].includes(stage)) {
    return {
      title: 'Contrastar interpretación, escenarios y recomendación',
      detail: 'El caso ya está preparado para revisar el análisis PK/PD, discutir escenarios y validar la recomendación clínica.',
      tab: 'recomendacion',
      ctaLabel: 'Recomendación',
    }
  }
  if (['Informe generado', 'Informe validado', 'Registrado en HCE'].includes(stage)) {
    return {
      title: 'Cerrar el circuito documental y confirmar trazabilidad',
      detail: 'La prioridad ahora es revisar el informe HCE, enviarlo al registro adecuado y dejar el seguimiento planificado.',
      tab: 'recomendacion',
      ctaLabel: 'Informe',
    }
  }
  return {
    title: 'Leer el estado del caso y preparar el seguimiento',
    detail: 'En esta fase interesa revisar resultado, seguimiento y trazabilidad final del caso dentro de la red.',
    tab: 'actividad',
    ctaLabel: 'Actividad',
  }
}

function StatusCard({ label, value, note, color }: { label: string; value: string; note: string; color: string }) {
  const colorMap: Record<string, string> = {
    teal: 'border-teal-100 bg-[#faf6fd]',
    blue: 'border-blue-100 bg-blue-50/50',
    red: 'border-red-100 bg-red-50/50',
    amber: 'border-amber-100 bg-amber-50/50',
    orange: 'border-orange-100 bg-orange-50/50',
  }
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color] ?? 'border-slate-200 bg-white'}`}>
      <p className="text-[10px] uppercase tracking-[0.18em] text-[#4a7068]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[#152520]">{value}</p>
      <p className="mt-0.5 text-xs text-[#4a7068]">{note}</p>
    </div>
  )
}

// ── Stage-aware header actions ────────────────────────────────────────────────

function StageActions({
  caso,
  actionBusy,
  onOrchestrate,
  onEdit,
  onGenerateNote,
  onRequestData,
  onMarkSession,
  onClose,
  onDelete,
}: {
  caso: CasoCompleto
  actionBusy: string | null
  onOrchestrate: () => void
  onEdit: () => void
  onGenerateNote: () => void
  onRequestData: () => void
  onMarkSession: () => void
  onClose: () => void
  onDelete: () => void
}) {
  const stage = caso.pipelineStage
  const canDelete = !caso.demoLocked && caso.deletable !== false

  const earlyStages = ['Solicitud recibida', 'Caso creado por IA', 'Datos incompletos', 'Pendiente de determinantes', 'Determinantes recibidos']
  const analysisStages = ['Análisis PK/PD generado', 'Revisión farmacéutica']
  const reviewStages = ['Revisión médica', 'Discusión en red']
  const reportStages = ['Informe generado', 'Informe validado']
  const closedStages = ['Registrado en HCE', 'Seguimiento 4 semanas', 'Seguimiento 8 semanas', 'Cerrado con resultado']

  if (closedStages.includes(stage)) {
    return (
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onEdit}>
          <PencilLine className="mr-1.5 h-3.5 w-3.5" /> Editar datos
        </Button>
        {canDelete ? (
          <Button size="sm" variant="outline" className="rounded-xl border-red-200 text-xs text-red-700 hover:bg-red-50" onClick={onDelete} disabled={actionBusy === 'delete'}>
            {actionBusy === 'delete' ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-1.5 h-3.5 w-3.5" />}
            Eliminar
          </Button>
        ) : null}
      </div>
    )
  }

  if (reportStages.includes(stage)) {
    return (
      <div className="flex gap-2">
        <Button size="sm" className="rounded-xl bg-[#7b3fa0] text-xs text-white hover:bg-[#6a3490]" onClick={onGenerateNote} disabled={actionBusy === 'note:generate'}>
          <FileText className="mr-1.5 h-3.5 w-3.5" /> Generar informe con Agentes
        </Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onEdit}>
          <PencilLine className="mr-1.5 h-3.5 w-3.5" /> Editar
        </Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs text-slate-500" onClick={onClose}>Cerrar caso</Button>
        {canDelete ? (
          <Button size="sm" variant="outline" className="rounded-xl border-red-200 text-xs text-red-700 hover:bg-red-50" onClick={onDelete} disabled={actionBusy === 'delete'}>
            {actionBusy === 'delete' ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-1.5 h-3.5 w-3.5" />}
            Eliminar
          </Button>
        ) : null}
      </div>
    )
  }

  if (reviewStages.includes(stage)) {
    return (
      <div className="flex gap-2">
        <Button size="sm" className="rounded-xl bg-[#7b3fa0] text-xs text-white hover:bg-[#6c348f]" onClick={onOrchestrate} disabled={actionBusy === 'orchestrate'}>
          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          {actionBusy === 'orchestrate' ? 'Agentes trabajando…' : 'Actualizar con Agentes'}
        </Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onGenerateNote} disabled={actionBusy === 'note:generate'}>
          <FileText className="mr-1.5 h-3.5 w-3.5" /> Informe
        </Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs text-slate-500" onClick={onClose}>Cerrar</Button>
        {canDelete ? (
          <Button size="sm" variant="outline" className="rounded-xl border-red-200 text-xs text-red-700 hover:bg-red-50" onClick={onDelete} disabled={actionBusy === 'delete'}>
            {actionBusy === 'delete' ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-1.5 h-3.5 w-3.5" />}
            Eliminar
          </Button>
        ) : null}
      </div>
    )
  }

  if (analysisStages.includes(stage)) {
    return (
      <div className="flex gap-2">
        <Button size="sm" className="rounded-xl bg-[#7b3fa0] text-xs text-white hover:bg-[#6c348f]" onClick={onOrchestrate} disabled={actionBusy === 'orchestrate'}>
          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          {actionBusy === 'orchestrate' ? 'Agentes trabajando…' : 'Actualizar con Agentes'}
        </Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onEdit}>
          <PencilLine className="mr-1.5 h-3.5 w-3.5" /> Editar datos
        </Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onMarkSession}>Sesión de red</Button>
        {canDelete ? (
          <Button size="sm" variant="outline" className="rounded-xl border-red-200 text-xs text-red-700 hover:bg-red-50" onClick={onDelete} disabled={actionBusy === 'delete'}>
            {actionBusy === 'delete' ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-1.5 h-3.5 w-3.5" />}
            Eliminar
          </Button>
        ) : null}
      </div>
    )
  }

  // earlyStages + fallback
  return (
    <div className="flex gap-2">
      <Button size="sm" className="rounded-xl bg-[#7b3fa0] text-xs text-white hover:bg-[#6c348f]" onClick={onOrchestrate} disabled={actionBusy === 'orchestrate'}>
        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
        {actionBusy === 'orchestrate' ? 'Agentes trabajando…' : 'Actualizar con Agentes'}
      </Button>
      <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onEdit}>
        <PencilLine className="mr-1.5 h-3.5 w-3.5" /> Editar datos
      </Button>
      <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onRequestData}>Solicitar datos</Button>
      {canDelete ? (
        <Button size="sm" variant="outline" className="rounded-xl border-red-200 text-xs text-red-700 hover:bg-red-50" onClick={onDelete} disabled={actionBusy === 'delete'}>
          {actionBusy === 'delete' ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-1.5 h-3.5 w-3.5" />}
          Eliminar
        </Button>
      ) : null}
    </div>
  )
}

// ── Tab: Timeline (swim lanes) ────────────────────────────────────────────────

const LANE_ORDER = ['Clínica', 'Tratamiento', 'Laboratorio', 'Decisiones', 'Tareas', 'Administración']

const LANE_ICON_COMPONENT: Record<string, React.ElementType> = {
  Clínica:        Stethoscope,
  Tratamiento:    Pill,
  Laboratorio:    FlaskConical,
  Decisiones:     Zap,
  Tareas:         CheckCircle2,
  Administración: ClipboardEdit,
}

const LANE_DOT_ICON_COLOR: Record<string, string> = {
  Clínica:        'text-violet-500',
  Tratamiento:    'text-blue-500',
  Laboratorio:    'text-teal-500',
  Decisiones:     'text-amber-500',
  Tareas:         'text-orange-500',
  Administración: 'text-slate-400',
}

const EVENT_TYPE_ICON_COMPONENT: Record<string, React.ElementType> = {
  'Solicitud':             FileText,
  'Estado':                RefreshCw,
  'Recomendación':         MessageCircle,
  'Informe':               FileText,
  'Informe HCE':           FileText,
  'Inicio de tratamiento': Pill,
  'Determinante recibido': FlaskConical,
  'Seguimiento':           Eye,
  'Análisis':              TrendingUp,
  'Biomarcador':           Microscope,
  'Diagnóstico':           Stethoscope,
  'Extracción':            Droplet,
  'Sesión':                Users,
  'Administración':        ClipboardEdit,
}

function TabTimeline({ caso }: { caso: CasoCompleto }) {
  const [activeLane, setActiveLane] = useState<string | null>(null)
  const sorted = [...(caso.timeline ?? [])].sort((a, b) => a.date.localeCompare(b.date))
  const presentLanes = LANE_ORDER.filter((l) => sorted.some((e) => e.lane === l))
  const filtered = activeLane ? sorted.filter((e) => e.lane === activeLane) : sorted

  const agentLanes = new Set(['Decisiones', 'Tareas'])
  const groupedByDay = filtered.reduce<Array<{ day: string; items: typeof filtered }>>((groups, event) => {
    const day = new Date(event.date).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    const existing = groups.find((group) => group.day === day)
    if (existing) {
      existing.items.push(event)
      return groups
    }
    groups.push({ day, items: [event] })
    return groups
  }, [])
  const latestEvent = filtered[filtered.length - 1]

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_320px]">
        <TimelineLaneOverview timeline={sorted} />
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#4a7068]">Foco actual</p>
          <p className="mt-1 text-sm font-semibold text-[#152520]">
            {activeLane ? `Leyendo solo la pista «${activeLane}»` : 'Vista completa del recorrido del caso'}
          </p>
          <p className="mt-2 text-sm leading-6 text-[#4a7068]">
            {activeLane
              ? 'Úsalo para revisar una sola dimensión clínica sin ruido del resto del caso.'
              : 'Empieza por el conjunto y después baja a la pista que quieras validar con más detalle.'}
          </p>

          <div className="mt-4 rounded-2xl border border-slate-100 bg-[#f8faf9] p-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#4a7068]">Último hito</p>
            {latestEvent ? (
              <>
                <p className="mt-1 text-sm font-semibold text-[#152520]">{latestEvent.label}</p>
                <p className="mt-1 text-xs text-[#4a7068]">
                  {latestEvent.lane} · {new Date(latestEvent.date).toLocaleString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-[#4a7068]">Todavía no hay eventos registrados en esta vista.</p>
            )}
          </div>
        </div>
      </div>

      {/* Lane filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveLane(null)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            activeLane === null
              ? 'bg-slate-800 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Todas las pistas
        </button>
        {presentLanes.map((lane) => (
          <button
            key={lane}
            onClick={() => setActiveLane(activeLane === lane ? null : lane)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
              activeLane === lane
                ? `${LANE_COLORS[lane] ?? 'bg-slate-100 text-slate-600'} ring-2 ring-offset-1`
                : `${LANE_COLORS[lane] ?? 'bg-slate-100 text-slate-600'} opacity-60 hover:opacity-100`
            }`}
          >
            {(() => { const LI = LANE_ICON_COMPONENT[lane]; return LI ? <LI className="h-3 w-3" /> : null })()}
            {lane}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-5">
        {groupedByDay.map((group) => (
          <div key={group.day} className="rounded-2xl border border-slate-100 bg-[#fbfcfb] p-4">
            <div className="mb-3 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <p className="text-sm font-semibold capitalize text-[#152520]">{group.day}</p>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] text-[#4a7068]">
                {group.items.length} eventos
              </span>
            </div>

            <div className="relative">
              <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-slate-200" />
              <div className="space-y-2">
                {group.items.map((event, i) => {
                  const isAgent = agentLanes.has(event.lane)
                  return (
                    <div key={`${group.day}-${i}`} className="relative flex items-start gap-4 pl-[60px]">
                      {(() => {
                        const DotIcon = EVENT_TYPE_ICON_COMPONENT[event.type] ?? LANE_ICON_COMPONENT[event.lane] ?? Activity
                        const dotColor = LANE_DOT_ICON_COLOR[event.lane] ?? 'text-slate-400'
                        return (
                          <div className={`absolute left-[4px] top-[10px] flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white shadow-md ring-2 ${LANE_DOT_RING[event.lane] ?? 'ring-slate-200'}`}>
                            <DotIcon className={`h-4 w-4 ${dotColor}`} />
                          </div>
                        )
                      })()}

                      <div
                        className={`flex-1 rounded-xl border px-4 py-3 ${
                          isAgent ? 'border-[#7b3fa0]/20 bg-[#faf6fd]' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${LANE_COLORS[event.lane] ?? 'bg-slate-100 text-slate-600'}`}>
                              {event.lane}
                            </span>
                          {isAgent && (
                              <span className="rounded-full bg-[#7b3fa0]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#7b3fa0]">Agentes</span>
                            )}
                            <span className="text-[10px] text-slate-400">{event.type}</span>
                          </div>
                          <span className="shrink-0 text-[10px] text-slate-400">
                            {new Date(event.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-medium text-[#152520]">{event.label}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-6 text-center text-sm text-slate-400">No hay eventos en esta pista.</p>
      )}
    </div>
  )
}

// ── Tab: Datos y determinantes ────────────────────────────────────────────────

function TabDatos({
  caso,
  onEdit,
  busyKey,
  onUpdateDeterminantReview,
}: {
  caso: CasoCompleto
  onEdit: () => void
  busyKey: string | null
  onUpdateDeterminantReview: (path: string, state: FieldReviewMeta['state']) => void
}) {
  const statusStyle: Record<string, string> = {
    Confirmado: 'text-green-700 bg-green-50',
    'Extraído por IA': 'text-[#7b3fa0] bg-teal-50',
    Pendiente: 'text-amber-700 bg-amber-50',
    Faltante: 'text-slate-500 bg-slate-100',
    Conflictivo: 'text-red-700 bg-red-50',
  }
  const reviewValues = Object.values(caso.fieldReview ?? {})
  const pendingCount = reviewValues.filter((item) => item.state === 'pending').length
  const confirmedCount = reviewValues.filter((item) => item.state === 'confirmed').length
  const editedCount = reviewValues.filter((item) => item.state === 'edited').length
  const llmCount = reviewValues.filter((item) => item.origin === 'llm').length
  const medicationHistory = deriveMedicationHistory(caso)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <FieldStatusHelpTrigger />
        <Button size="sm" className="rounded-xl bg-[#7b3fa0] text-xs text-white hover:bg-[#6a3490]" onClick={onEdit}>
          <PencilLine className="mr-1.5 h-3.5 w-3.5" />
          Abrir editor
        </Button>
      </div>

      <Section title="Origen del caso" icon={Mail}>
        <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-3">
            {caso.entrySource === 'Email' ? (
              <div className="grid gap-2 sm:grid-cols-4">
                <ReviewMiniMetric label="Agentes" value={String(llmCount)} tone="llm" />
                <ReviewMiniMetric label="Pendientes" value={String(pendingCount)} tone="pending" />
                <ReviewMiniMetric label="Confirmados" value={String(confirmedCount)} tone="confirmed" />
                <ReviewMiniMetric label="Editados" value={String(editedCount)} tone="edited" />
              </div>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoField label="Origen" value={caso.entrySource || '—'} />
              <InfoField
                label="Tratamiento de entrada"
                value={caso.entrySource === 'Email' ? 'Email estructurado por Agentes' : 'Formulario estructurado'}
              />
            </div>
            {caso.entrySource === 'Email' ? (
              <div className="rounded-xl border border-[#7b3fa0]/15 bg-[#faf6fd] px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7b3fa0]">
                  Evidencia preservada
                </p>
                <p className="mt-1 text-xs leading-6 text-[#4a7068]">
                  El correo original se conserva dentro del expediente como referencia de entrada. Los campos del caso pueden corregirse, pero el texto bruto permanece intacto.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4a7068]">
                  Solicitud estructurada
                </p>
                <p className="mt-1 text-xs leading-6 text-[#4a7068]">
                  Este caso nació desde un formulario clínico estructurado. La edición del caso sigue el mismo flujo de validación y completitud.
                </p>
              </div>
            )}
          </div>

          {caso.entrySource === 'Email' && caso.emailOriginal ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4a7068]">
                Email original preservado
              </p>
              <div className="mt-3 max-h-[260px] overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-4">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-[#152520]">
                  {caso.emailOriginal}
                </pre>
              </div>
            </div>
          ) : null}
        </div>
      </Section>

      {/* Patient context */}
      <Section title="Paciente" icon={Users}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <InfoField label="Código" value={caso.patientCode} />
          <InfoField
            label="Edad"
            value={caso.patientProfile?.age != null ? String(caso.patientProfile.age) : '—'}
            review={getFieldReviewMeta(caso, 'patientProfile.age')}
          />
          <InfoField
            label="Sexo"
            value={caso.patientProfile?.sex || '—'}
            review={getFieldReviewMeta(caso, 'patientProfile.sex')}
          />
          <InfoField
            label="Peso"
            value={caso.patientProfile?.weightKg != null ? `${caso.patientProfile.weightKg} kg` : '—'}
            review={getFieldReviewMeta(caso, 'patientProfile.weightKg')}
          />
          <InfoField
            label="Altura"
            value={caso.patientProfile?.heightCm != null ? `${caso.patientProfile.heightCm} cm` : '—'}
            review={getFieldReviewMeta(caso, 'patientProfile.heightCm')}
          />
        </div>
        {(caso.patientProfile?.specialPopulation ?? []).length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {caso.patientProfile?.specialPopulation?.map((item) => (
              <span key={item} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-700">
                {item}
              </span>
            ))}
          </div>
        ) : null}
      </Section>

      {/* Disease context */}
      <Section title="Enfermedad" icon={Activity}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(caso.diseaseContext ?? {}).map(([k, v]) => (
            <InfoField key={k} label={k} value={String(v)} review={getFieldReviewMeta(caso, `diseaseContext.${k}`)} />
          ))}
        </div>
      </Section>

      {/* Therapy context */}
      <Section title="Tratamiento actual" icon={Shield}>
        <div className="space-y-4">
          {/* Current therapy fields */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <InfoField
              label="Fármaco actual"
              value={String((caso.therapyContext as any)?.currentDrug ?? '—')}
              review={getFieldReviewMeta(caso, 'therapyContext.currentDrug')}
            />
            <InfoField
              label="Dosis actual"
              value={String((caso.therapyContext as any)?.currentDose ?? '—')}
              review={getFieldReviewMeta(caso, 'therapyContext.currentDose')}
            />
            <InfoField
              label="Intervalo"
              value={String((caso.therapyContext as any)?.interval ?? '—')}
              review={getFieldReviewMeta(caso, 'therapyContext.interval')}
            />
            <InfoField
              label="Vía"
              value={String((caso.therapyContext as any)?.route ?? '—')}
              review={getFieldReviewMeta(caso, 'therapyContext.route')}
            />
            <InfoField
              label="Última administración"
              value={String((caso.therapyContext as any)?.lastAdministration ?? '—')}
              review={getFieldReviewMeta(caso, 'therapyContext.lastAdministration')}
            />
          </div>
          {String((caso.therapyContext as any)?.previousTherapies ?? '').trim() ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#4a7068]">Tratamientos previos</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {String((caso.therapyContext as any)?.previousTherapies ?? '')
                  .split(',')
                  .map((item) => item.trim())
                  .filter(Boolean)
                  .map((item) => (
                    <span key={item} className="rounded-full bg-white px-2.5 py-1 text-[11px] text-slate-700 ring-1 ring-slate-200">
                      {item}
                    </span>
                  ))}
              </div>
            </div>
          ) : null}

          {/* Full-width interactive timeline */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#4a7068]">Evolución de pauta</p>
                <p className="mt-0.5 text-sm font-semibold text-[#152520]">Toca un punto para ver el detalle</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] text-[#4a7068]">
                {medicationHistory.length} registros
              </span>
            </div>
            <TherapyTimeline entries={medicationHistory} />
          </div>
        </div>
      </Section>

      {/* Lab determinants */}
      <Section title="Determinantes PK/PD" icon={FlaskConical}>
        <div className="grid gap-3 lg:grid-cols-2">
          {(caso.labDeterminants ?? []).map((det, i) => {
            const review = getFieldReviewMeta(caso, `labDeterminants.${i}`)
            return (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-[#152520]">{det.label}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${reviewStatusTone(review)}`}>
                      <span>{reviewStatusSymbol(review)}</span>
                      Estado: {reviewStatusLabel(review)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-700">
                      Origen: {reviewOriginLabel(review)}
                    </span>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-medium ${statusStyle[det.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      Dato: {det.status}
                    </span>
                  </div>
                </div>
                {review.origin === 'llm' ? (
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => onUpdateDeterminantReview(`labDeterminants.${i}`, 'confirmed')}
                      disabled={busyKey !== null}
                      className="rounded-full border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                    >
                      Confirmar
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateDeterminantReview(`labDeterminants.${i}`, 'pending')}
                      disabled={busyKey !== null}
                      className="rounded-full border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-700 transition hover:bg-amber-50 disabled:opacity-50"
                    >
                      Pendiente
                    </button>
                  </div>
                ) : null}
              </div>
              <p className="mt-1 text-xl font-bold text-[#152520]">
                {String(det.value)} {det.unit ?? ''}
              </p>
              {det.interpretation && (
                <p className="mt-1 text-xs text-[#4a7068]">{det.interpretation}</p>
              )}
              {det.relationToDose && (
                <p className="mt-1 text-xs text-[#7b3fa0]">{det.relationToDose}</p>
              )}
              <div className="mt-2 space-y-1">
                <p className="text-[10px] text-slate-500">
                  <span className="font-semibold text-slate-600">Fuente:</span> {det.source}
                </p>
                <p className="text-[10px] text-slate-500">
                  <span className="font-semibold text-slate-600">Trazabilidad:</span> {reviewTraceLabel(review)}
                </p>
              </div>
            </div>
          )})}
        </div>
      </Section>
    </div>
  )
}

function FieldStatusHelpContent() {
  return (
    <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-lg bg-slate-50 px-3 py-2">
        <p className="font-semibold text-slate-700">Estado</p>
        <p className="mt-1">Indica si el dato está pendiente, confirmado por un profesional o editado manualmente.</p>
      </div>
      <div className="rounded-lg bg-slate-50 px-3 py-2">
        <p className="font-semibold text-slate-700">Origen</p>
        <p className="mt-1">Muestra si el dato fue sugerido por agentes o cargado manualmente.</p>
      </div>
      <div className="rounded-lg bg-slate-50 px-3 py-2">
        <p className="font-semibold text-slate-700">Trazabilidad</p>
        <p className="mt-1">Explica de dónde vino el valor concreto: email, laboratorio u otra fuente registrada.</p>
      </div>
      <div className="rounded-lg bg-slate-50 px-3 py-2">
        <p className="font-semibold text-slate-700">Validación humana</p>
        <p className="mt-1">Los datos sugeridos por agentes pueden confirmarse, dejarse pendientes o corregirse desde el editor.</p>
      </div>
    </div>
  )
}

function FieldStatusHelpTrigger() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const media = window.matchMedia('(max-width: 1023px)')
    const sync = () => setIsMobile(media.matches)

    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="rounded-xl border-slate-200 text-slate-500"
              aria-label="Cómo leer estado, origen y trazabilidad"
            />
          }
        >
          <CircleHelp className="h-4 w-4" />
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-[28px] bg-white">
          <SheetHeader className="pr-12">
            <SheetTitle>Cómo leer los datos</SheetTitle>
            <SheetDescription>
              Estado, origen y trazabilidad explicados de forma breve para revisar el caso.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-5">
            <FieldStatusHelpContent />
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div className="group/help relative hidden lg:block">
      <button
        type="button"
        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-[#7b3fa0]"
        aria-label="Cómo leer estado, origen y trazabilidad"
      >
        <CircleHelp className="h-4 w-4" />
      </button>
      <div className="pointer-events-none absolute left-0 top-10 z-20 w-[340px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl opacity-0 transition duration-150 group-hover/help:opacity-100 group-focus-within/help:opacity-100">
        <p className="text-sm font-semibold text-[#152520]">Cómo leer los datos</p>
        <p className="mt-1 text-xs leading-5 text-[#4a7068]">
          Estado, origen y trazabilidad explicados de forma breve para revisar el caso.
        </p>
        <div className="mt-3">
          <FieldStatusHelpContent />
        </div>
      </div>
    </div>
  )
}

function reviewStatusTone(meta: FieldReviewMeta) {
  if (meta.state === 'confirmed') return 'bg-emerald-50 text-emerald-700'
  if (meta.state === 'edited') return 'bg-sky-50 text-sky-700'
  return 'bg-amber-50 text-amber-700'
}

function reviewStatusLabel(meta: FieldReviewMeta) {
  if (meta.state === 'confirmed') return 'Confirmado'
  if (meta.state === 'edited') return 'Editado'
  return 'Pendiente'
}

function reviewStatusSymbol(meta: FieldReviewMeta) {
  if (meta.state === 'confirmed') return '✓'
  if (meta.state === 'edited') return '✎'
  return '○'
}

function reviewOriginLabel(meta: FieldReviewMeta) {
  return meta.origin === 'llm' ? 'Agentes' : 'Manual'
}

function reviewTraceLabel(meta: FieldReviewMeta) {
  if (meta.sourceLabel) return meta.sourceLabel
  return meta.origin === 'llm' ? 'Extraído del email' : 'Registrado manualmente'
}

function InfoField({ label, value, review }: { label: string; value: string; review?: FieldReviewMeta }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[10px] uppercase tracking-[0.14em] text-[#4a7068]">{humanizeFieldLabel(label)}</p>
        {review ? (
          <>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold ${reviewStatusTone(review)}`}>
              <span>{reviewStatusSymbol(review)}</span>
              Estado: {reviewStatusLabel(review)}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-medium text-slate-600">
              Origen: {reviewOriginLabel(review)}
            </span>
          </>
        ) : null}
      </div>
      <p className="mt-0.5 text-sm font-medium text-[#152520]">{value}</p>
      {review ? (
        <div className="mt-1.5 space-y-0.5">
          <p className="text-[10px] text-slate-500">
            <span className="font-semibold text-slate-600">Trazabilidad:</span> {reviewTraceLabel(review)}
          </p>
        </div>
      ) : null}
    </div>
  )
}

function ReviewMiniMetric({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'llm' | 'pending' | 'confirmed' | 'edited'
}) {
  const toneCls = {
    llm: 'bg-[#faf6fd] text-[#7b3fa0] border-[#7b3fa0]/15',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    edited: 'bg-sky-50 text-sky-700 border-sky-200',
  }[tone]

  return (
    <div className={`rounded-xl border px-3 py-2 ${toneCls}`}>
      <p className="text-[9px] font-semibold uppercase tracking-[0.14em]">{label}</p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  )
}

function MiniData({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1 text-xs font-medium text-[#152520]">{value}</p>
    </div>
  )
}

function TherapyTimeline({ entries }: { entries: MedicationHistoryEntry[] }) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-4 text-xs text-[#4a7068]">
        No hay historial de pauta disponible.
      </div>
    )
  }

  const CHART_H = 96
  const NODE_R = 7
  const COL_W = 88
  const PAD_X = 48
  const PAD_TOP = 22
  const PAD_BOT = 56
  const SVG_H = CHART_H + PAD_TOP + PAD_BOT
  const SVG_W = entries.length * COL_W + PAD_X * 2

  const doseValues = entries.map(e => e.doseValue).filter((v): v is number => v !== null)
  const maxDose = doseValues.length > 0 ? Math.max(...doseValues) : 1
  const minDose = doseValues.length > 0 ? Math.min(...doseValues) : 0
  const range = maxDose - minDose || maxDose || 1

  const ys = entries.map((entry) => {
    if (entry.doseValue !== null) {
      const norm = (entry.doseValue - minDose) / range
      return PAD_TOP + CHART_H - norm * (CHART_H - NODE_R * 2) - NODE_R
    }
    return PAD_TOP + CHART_H / 2
  })
  const xs = entries.map((_, i) => PAD_X + i * COL_W + COL_W / 2)

  const CHANGE_COLOR: Record<string, string> = {
    Inicio:          '#7b3fa0',
    Intensificación: '#ef4444',
    Reducción:       '#3b82f6',
    Ratificación:    '#22c55e',
    Cambio:          '#f59e0b',
    Antecedente:     '#94a3b8',
    Seguimiento:     '#64748b',
  }

  const selected = selectedIdx !== null ? entries[selectedIdx] : null
  const selectedColor = selected ? (CHANGE_COLOR[selected.changeLabel] ?? '#64748b') : '#64748b'
  const usedLabels = Array.from(new Set(entries.map(e => e.changeLabel))).filter(l => CHANGE_COLOR[l])

  return (
    <div className="space-y-3">
      {/* Chart */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: SVG_W }}>
          <svg width={SVG_W} height={SVG_H} style={{ overflow: 'visible' }}>
            {/* Axis guide lines */}
            <line x1={PAD_X} y1={PAD_TOP} x2={SVG_W - PAD_X} y2={PAD_TOP}
              stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 3" />
            <line x1={PAD_X} y1={PAD_TOP + CHART_H} x2={SVG_W - PAD_X} y2={PAD_TOP + CHART_H}
              stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 3" />

            {/* Connecting segments — colored by dose direction */}
            {entries.slice(0, -1).map((entry, i) => {
              const next = entries[i + 1]
              let seg = '#e2e8f0'
              if (entry.doseValue !== null && next.doseValue !== null) {
                if (next.doseValue > entry.doseValue) seg = '#fca5a5'
                else if (next.doseValue < entry.doseValue) seg = '#93c5fd'
                else seg = '#bbf7d0'
              }
              return <line key={i} x1={xs[i]} y1={ys[i]} x2={xs[i + 1]} y2={ys[i + 1]}
                stroke={seg} strokeWidth="2.5" strokeLinecap="round" />
            })}

            {/* Y-axis dose labels */}
            {doseValues.length > 0 && (
              <>
                <text x={PAD_X - 8} y={PAD_TOP + 4} textAnchor="end" fontSize="9" fill="#94a3b8">{maxDose}mg</text>
                {minDose > 0 && minDose !== maxDose && (
                  <text x={PAD_X - 8} y={PAD_TOP + CHART_H} textAnchor="end" fontSize="9" fill="#94a3b8">{minDose}mg</text>
                )}
              </>
            )}

            {/* Nodes */}
            {entries.map((entry, i) => {
              const x = xs[i]; const y = ys[i]
              const color = CHANGE_COLOR[entry.changeLabel] ?? '#94a3b8'
              const isSelected = selectedIdx === i
              return (
                <g key={i} onClick={() => setSelectedIdx(isSelected ? null : i)} style={{ cursor: 'pointer' }}>
                  {(entry.isCurrent || isSelected) && (
                    <circle cx={x} cy={y} r={NODE_R + 6} fill="none" stroke={color} strokeWidth="1.5" opacity="0.35" />
                  )}
                  <circle cx={x} cy={y} r={NODE_R}
                    fill={isSelected ? color : 'white'} stroke={color} strokeWidth="2" />
                  {entry.isCurrent && !isSelected && (
                    <circle cx={x} cy={y} r={3} fill={color} />
                  )}
                  {/* Dose above node */}
                  {entry.doseText && entry.doseText !== '—' && (
                    <text x={x} y={y - NODE_R - 5}
                      textAnchor="middle" fontSize="9" fontWeight="600" fill={color}>
                      {entry.doseText}
                    </text>
                  )}
                  {/* Date below chart */}
                  <text x={x} y={PAD_TOP + CHART_H + 16}
                    textAnchor="middle" fontSize="9" fill="#94a3b8">
                    {entry.dateLabel}
                  </text>
                  {/* Change type */}
                  <text x={x} y={PAD_TOP + CHART_H + 30}
                    textAnchor="middle" fontSize="8.5" fill={color} fontWeight="500">
                    {entry.changeLabel}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      {/* Detail card — appears on click */}
      {selected && (
        <div className="rounded-xl border px-4 py-3.5 transition-all"
          style={{ borderColor: selectedColor + '40', backgroundColor: selectedColor + '08' }}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                  style={{ backgroundColor: selectedColor }}>
                  {selected.changeLabel}
                </span>
                <span className="text-[10px] text-slate-400">{selected.dateLabel}</span>
                {selected.isCurrent && (
                  <span className="rounded-full bg-[#faf6fd] px-2 py-0.5 text-[10px] font-semibold text-[#7b3fa0] ring-1 ring-[#7b3fa0]/20">
                    Vigente
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-sm font-semibold text-[#152520]">{selected.label}</p>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs">
                {selected.doseText && selected.doseText !== '—' && (
                  <span><span className="text-slate-400">Dosis </span><span className="font-medium text-[#152520]">{selected.doseText}</span></span>
                )}
                {selected.interval && (
                  <span><span className="text-slate-400">Intervalo </span><span className="font-medium text-[#152520]">{selected.interval}</span></span>
                )}
                {selected.route && (
                  <span><span className="text-slate-400">Vía </span><span className="font-medium text-[#152520]">{selected.route}</span></span>
                )}
                {(selected.periodLabel || selected.dateLabel) && (
                  <span><span className="text-slate-400">Período </span><span className="font-medium text-[#152520]">{selected.periodLabel || selected.dateLabel}</span></span>
                )}
                {selected.source && (
                  <span><span className="text-slate-400">Fuente </span><span className="font-medium text-[#152520]">{selected.source}</span></span>
                )}
              </div>
            </div>
            <button onClick={() => setSelectedIdx(null)}
              className="shrink-0 rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-1.5">
        {usedLabels.map((label) => (
          <span key={label} className="flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600 ring-1 ring-slate-100">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: CHANGE_COLOR[label] }} />
            {label}
          </span>
        ))}
        <span className="flex items-center gap-2 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] text-slate-500 ring-1 ring-slate-100">
          <span className="inline-block h-1 w-4 rounded bg-red-200" /> alza
          <span className="inline-block h-1 w-4 rounded bg-blue-200" /> baja
          <span className="inline-block h-1 w-4 rounded bg-green-200" /> igual
        </span>
      </div>
    </div>
  )
}

// ── Tab: Gaps y tareas ────────────────────────────────────────────────────────

function TabGaps({
  caso,
  busyKey,
  onRequestGap,
  onResolveTask,
  onStartTask,
}: {
  caso: CasoCompleto
  busyKey: string | null
  onRequestGap: (gapLabel: string) => void
  onResolveTask: (taskId: string) => void
  onStartTask: (taskId: string) => void
}) {
  const [gapFilter, setGapFilter] = useState<string | null>(null)

  const GAP_CARD: Record<string, { border: string; bg: string; icon: string; badge: string }> = {
    Crítico:    { border: 'border-red-200',   bg: 'bg-red-50',   icon: 'text-red-500',   badge: 'bg-red-600 text-white' },
    Importante: { border: 'border-amber-200', bg: 'bg-amber-50', icon: 'text-amber-500', badge: 'bg-amber-500 text-white' },
    Informativo:{ border: 'border-blue-200',  bg: 'bg-blue-50',  icon: 'text-blue-500',  badge: 'bg-blue-500 text-white' },
  }
  const allGaps = [...(caso.gaps ?? [])].sort((a, b) => {
    const order = { Crítico: 0, Importante: 1, Informativo: 2 }
    return (order[a.severity as keyof typeof order] ?? 3) - (order[b.severity as keyof typeof order] ?? 3)
  })
  const visibleGaps = gapFilter ? allGaps.filter(g => g.severity === gapFilter) : allGaps
  const tasks = caso.tasks ?? []
  const ACTOR_KEY = (role: string) =>
    /farmac/i.test(role) ? 'Farmacia'
    : /lab/i.test(role) ? 'Laboratorio'
    : /médic|medic|digestiv|gastro/i.test(role) ? 'Médico'
    : /enferm/i.test(role) ? 'Enfermería'
    : (role || 'Otros')
  const ACTOR_DOT: Record<string, string> = {
    Farmacia: '#7b3fa0', Laboratorio: '#0ea5e9', Médico: '#3b82f6', Enfermería: '#14b8a6',
  }
  const COLS: Array<{ id: string; label: string; header: string }> = [
    { id: 'Pendiente', label: 'Pendiente', header: 'bg-amber-50 text-amber-700 border-amber-200' },
    { id: 'En curso',  label: 'En curso',  header: 'bg-blue-50 text-blue-700 border-blue-200' },
    { id: 'Resuelta',  label: 'Resuelta',  header: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ]

  return (
    <div className="space-y-5">
      {/* 3. Gaps with donut filter */}
      <Section title="Gaps detectados" icon={AlertTriangle}>
        {allGaps.length === 0 ? (
          <p className="text-sm text-[#4a7068]">No se han detectado gaps en este caso.</p>
        ) : (
          <>
            <div className="mb-4">
              <GapSeverityDonut gaps={allGaps} activeFilter={gapFilter} onFilter={setGapFilter} />
            </div>
            <div className="space-y-2">
              {visibleGaps.map((gap, i) => {
                const style = GAP_CARD[gap.severity] ?? { border: 'border-slate-200', bg: 'bg-white', icon: 'text-slate-400', badge: 'bg-slate-100 text-slate-600' }
                return (
                  <div key={i} className={`flex items-start gap-3 rounded-xl border ${style.border} ${style.bg} px-4 py-3`}>
                    <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${style.icon} ${gap.severity === 'Crítico' ? 'animate-pulse' : ''}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.badge}`}>{gap.severity}</span>
                        <p className="text-sm font-semibold text-[#152520]">{gap.label}</p>
                      </div>
                      <p className="mt-1 text-xs text-[#4a7068]">{gap.status}</p>
                    </div>
                    <Button size="sm" variant="outline" className="shrink-0 rounded-xl text-xs"
                      onClick={() => onRequestGap(gap.label)} disabled={busyKey !== null}>
                      Solicitar
                    </Button>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </Section>

      {/* 4. Kanban task board */}
      <Section title="Tareas por estado" icon={ClipboardEdit}>
        {tasks.length === 0 ? (
          <p className="text-sm text-[#4a7068]">No hay tareas pendientes.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {COLS.map(col => {
              const colTasks = tasks.filter(t => t.status === col.id)
              return (
                <div key={col.id} className="flex flex-col gap-2">
                  <div className={`flex items-center justify-between rounded-xl border px-3 py-2 ${col.header}`}>
                    <span className="text-[10px] font-bold uppercase tracking-wide">{col.label}</span>
                    <span className="text-[10px] font-semibold opacity-70">{colTasks.length}</span>
                  </div>
                  {colTasks.map((task, i) => {
                    const actorKey = ACTOR_KEY(task.ownerRole ?? '')
                    const dot = ACTOR_DOT[actorKey] ?? '#94a3b8'
                    const isResolved = col.id === 'Resuelta'
                    return (
                      <div key={i} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
                        <div className="flex items-start gap-2">
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: dot }} />
                          <p className={`flex-1 text-xs ${isResolved ? 'text-slate-400 line-through' : 'font-medium text-[#152520]'}`}>{task.title}</p>
                        </div>
                        <div className="mt-1.5 flex items-center justify-between gap-1">
                          <span className="text-[10px] text-slate-400">{actorKey}</span>
                          {task.dueDate && !isResolved && (
                            <span className="text-[10px] text-slate-400">{new Date(task.dueDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
                          )}
                        </div>
                        {!isResolved && (
                          <div className="mt-2 flex gap-1">
                            <Button size="sm" className="h-6 flex-1 rounded-lg bg-emerald-600 px-2 text-[10px] text-white hover:bg-emerald-700"
                              onClick={() => onResolveTask(task.taskId)} disabled={busyKey !== null}>
                              Resuelta
                            </Button>
                            {col.id === 'Pendiente' && (
                              <Button size="sm" variant="outline" className="h-6 flex-1 rounded-lg px-2 text-[10px]"
                                onClick={() => onStartTask(task.taskId)} disabled={busyKey !== null}>
                                En curso
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {colTasks.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-[10px] text-slate-300">
                      Sin tareas
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Section>
    </div>
  )
}

// ── Tab: Análisis PK/PD ───────────────────────────────────────────────────────

function ProtocolFrameCard({
  protocol,
  frame,
  compact = false,
}: {
  protocol: ReturnType<typeof getProgramProtocol>
  frame?: ReturnType<typeof deriveProtocolSemanticFrame>
  compact?: boolean
}) {
  if (!protocol && !frame) return null

  return (
    <div className={`rounded-xl border border-slate-200 bg-white ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#4a7068]">Marco de decisión</p>
          <p className="mt-1 text-base font-semibold text-[#152520]">
            {frame?.label ?? protocol?.title ?? 'Protocolo activo'}
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
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#4a7068]">Protocolo activo</p>
            <p className="mt-1 font-semibold text-[#152520]">{protocol?.title ?? 'Protocolo clínico activo'}</p>
            <p className="mt-1 text-xs text-[#4a7068]">Última revisión: {formatProtocolReviewDate(protocol?.lastReview)}</p>
          </div>
          {protocol?.references?.length ? (
            <div className="rounded-2xl border border-slate-200 bg-[#fbfcfb] px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#4a7068]">Fuentes</p>
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

function TabAnalisis({ caso, program }: { caso: CasoCompleto; program?: Program | null }) {
  const interpretation = caso.pkpdInterpretation
  const det = caso.labDeterminants ?? []
  const confirmed = det.filter((d) => d.status === 'Confirmado').length
  const total = det.length || 1
  const completeness = Math.round((confirmed / total) * 100)
  const lowConfidence = interpretation?.confidence === 'Baja'
  const semanticFrame = deriveProtocolSemanticFrame(caso)
  const protocol = getProgramProtocol(program)

  return (
    <div className="space-y-5">
      {lowConfidence ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold">Confianza baja en la interpretación</p>
          <p className="mt-1 leading-6">
            El caso necesita más validación humana o más datos antes de convertir este análisis en una recomendación firme.
          </p>
        </div>
      ) : null}
      <div className="rounded-xl border border-[#7b3fa0]/20 bg-slate-50 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#4a7068]">Patrón sugerido</p>
            <p className="mt-1 text-xl font-semibold text-[#152520]">{interpretation?.pattern ?? '—'}</p>
          </div>
          <TrendingUp className="h-6 w-6 shrink-0 text-[#7b3fa0]" />
        </div>
        <p className="mt-3 text-sm leading-7 text-[#152520]">{interpretation?.summary}</p>
      </div>

      <ProtocolFrameCard
        protocol={protocol}
        frame={semanticFrame}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Confianza del análisis" icon={Shield}>
          <ConfidenceRadar completeness={completeness} confidence={interpretation?.confidence ?? ''} />
        </Section>

        <Section title="Datos utilizados" icon={FlaskConical}>
          <LabBulletChart determinants={(caso.labDeterminants ?? []).filter((d) => d.status === 'Confirmado')} />
        </Section>
      </div>

      {det.filter((d) => d.status !== 'Confirmado').length > 0 && (
        <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-amber-700">Datos pendientes de confirmar</p>
          <ul className="mt-3 space-y-1 text-sm text-amber-800">
            {det.filter((d) => d.status !== 'Confirmado').map((d, i) => (
              <li key={i}>· {d.label}{d.value ? ` — ${String(d.value)} ${d.unit ?? ''}` : ''}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ── Tab: Simulación ───────────────────────────────────────────────────────────

function TabSimulacion({
  caso,
  program,
}: {
  caso: CasoCompleto
  program?: Program | null
}) {
  return (
    <PkpdSimulationChart
      caso={caso}
      program={program}
      preferredScenario={caso.simulation?.preferredScenario ?? null}
    />
  )
}

// ── Tab: Recomendación ────────────────────────────────────────────────────────

function TabRecomendacion({
  caso,
  program,
  recText,
  onRecChange,
  busy,
  onAcceptDraft,
  onRequestData,
  onSendDigestivo,
  onSendSession,
  onReject,
}: {
  caso: CasoCompleto
  program?: Program | null
  recText: string
  onRecChange: (v: string) => void
  busy: boolean
  onAcceptDraft: () => void
  onRequestData: () => void
  onSendDigestivo: () => void
  onSendSession: () => void
  onReject: () => void
}) {
  const rec = caso.recommendation
  const statusInfo = RECOMMENDATION_STATUS[rec?.status ?? ''] ?? { style: 'bg-slate-100 text-slate-600', label: rec?.status }
  const lowConfidence = caso.pkpdInterpretation?.confidence === 'Baja'
  const protocol = getProgramProtocol(program)
  const semanticFrame = deriveProtocolSemanticFrame(caso)

  const trough = deriveTrough(caso)
  const status = pkpdStatus(caso.pkpdInterpretation?.pattern ?? '')
  const drugLine = deriveDrugLine(caso)

  return (
    <div className="space-y-5">
      {lowConfidence ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold">Recomendación con lectura cauta</p>
          <p className="mt-1 leading-6">
            La confianza del caso es baja. Antes de validar, conviene completar datos, revisar determinantes o elevar el caso a sesión de red.
          </p>
        </div>
      ) : null}
      {/* Clinical context frame */}
      <div className={`rounded-xl border ${status.border} ${status.bg} px-4 py-3`}>
        <p className="text-[10px] uppercase tracking-[0.14em] text-[#4a7068]">Contexto clínico para esta recomendación</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
          <span><span className="text-[#4a7068]">Paciente:</span> <span className="font-semibold text-[#152520]">{caso.patientCode}</span></span>
          <span><span className="text-[#4a7068]">Tratamiento:</span> <span className="font-semibold text-[#152520]">{drugLine}</span></span>
          {trough && <span><span className="text-[#4a7068]">Valle:</span> <span className={`font-bold ${status.color}`}>{trough.value} {trough.unit}</span></span>}
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${status.border} ${status.color} bg-white`}>{status.label}</span>
        </div>
      </div>

      <ProtocolFrameCard protocol={protocol} frame={semanticFrame} compact />

      <div className="flex items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusInfo.style}`}>{statusInfo.label}</span>
      </div>

      <Section title="Propuesta del sistema" icon={Sparkles}>
        <textarea
          value={recText}
          onChange={(e) => onRecChange(e.target.value)}
          rows={5}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#152520] outline-none focus:border-[#7b3fa0]/40 focus:bg-white"
        />
      </Section>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" className="rounded-xl bg-[#7b3fa0] text-xs text-white hover:bg-[#6a3490]" onClick={onAcceptDraft} disabled={busy}>Aceptar como borrador</Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onRequestData} disabled={busy}>Solicitar más datos</Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onSendDigestivo} disabled={busy}>Enviar a digestivo</Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onSendSession} disabled={busy}>Enviar a sesión de red</Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs text-red-600 hover:bg-red-50" onClick={onReject} disabled={busy}>Rechazar y justificar</Button>
      </div>

      {(caso.gaps ?? []).filter((g) => g.status === 'Pendiente').length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-800">
          <p className="font-semibold">Datos pendientes antes de validar</p>
          <ul className="mt-2 space-y-1">
            {caso.gaps?.filter((g) => g.status === 'Pendiente').map((g, i) => (
              <li key={i}>· {g.label}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ── Tab: Informe HCE ──────────────────────────────────────────────────────────

function TabInforme({
  caso,
  program,
  noteText,
  onNoteChange,
  busy,
  onGenerateDraft,
  onSaveDraft,
  onRequestCovalidation,
  onSendToEhr,
  onExportPdf,
}: {
  caso: CasoCompleto
  program?: Program | null
  noteText: string
  onNoteChange: (value: string) => void
  busy: boolean
  onGenerateDraft: () => void
  onSaveDraft: () => void
  onRequestCovalidation: () => void
  onSendToEhr: () => void
  onExportPdf: () => void
}) {
  const note = caso.clinicalNote
  const protocol = getProgramProtocol(program)
  const statusInfo = NOTE_STATUS[note?.status ?? ''] ?? { style: 'bg-slate-100 text-slate-600' }

  const sections = [
    { label: 'Motivo de consulta', value: caso.caseType },
    { label: 'Fármaco y pauta', value: `${(caso.therapyContext as any)?.currentDrug ?? '—'} ${(caso.therapyContext as any)?.currentDose ?? ''} ${(caso.therapyContext as any)?.interval ?? ''}`.trim() },
    { label: 'Patrón PK/PD', value: caso.pkpdInterpretation?.pattern ?? '—' },
    { label: 'Farmacéutico validador', value: caso.assignedName },
    { label: 'Versión del protocolo', value: `${protocol?.title ?? 'Protocolo activo'} ${program?.version ?? ''}`.trim() },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusInfo.style}`}>{note?.status ?? 'Borrador'}</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => <InfoField key={s.label} label={s.label} value={s.value} />)}
      </div>

      <ProtocolFrameCard protocol={protocol} compact />

      <Section title="Texto del informe" icon={FileText}>
        <textarea
          value={noteText}
          onChange={(e) => onNoteChange(e.target.value)}
          rows={8}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#152520] outline-none focus:border-[#7b3fa0]/40 focus:bg-white"
        />
      </Section>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" className="rounded-xl bg-[#7b3fa0] text-xs text-white hover:bg-[#6a3490]" onClick={onGenerateDraft} disabled={busy}>
          <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Generar borrador con Agentes
        </Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onSaveDraft} disabled={busy}>Guardar borrador</Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onExportPdf}>Descargar PDF</Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onRequestCovalidation} disabled={busy}>Solicitar co-validación</Button>
        <Button size="sm" className="ml-auto rounded-xl bg-slate-900 text-xs text-white hover:bg-slate-800" onClick={onSendToEhr} disabled={busy}>Enviar a HCE</Button>
      </div>
    </div>
  )
}

// ── Tab: Aprendizaje ──────────────────────────────────────────────────────────

function TabAprendizaje({
  caso,
  busyKey,
  onRegisterFollowUp,
  onCompleteFollowUp,
  nextFollowupDate,
}: {
  caso: CasoCompleto
  busyKey: string | null
  onRegisterFollowUp: (plan: FollowUpPlan) => void
  onCompleteFollowUp: (label: string) => void
  nextFollowupDate: (days: number) => string
}) {
  const outcome = caso.caseOutcome
  const followUps = useMemo(() => caso.followUps ?? [], [caso.followUps])
  const [plannerDraft, setPlannerDraft] = useState<FollowUpDraft>(buildFollowUpDraft())
  const [editingLabel, setEditingLabel] = useState<string | null>(null)

  useEffect(() => {
    if (!editingLabel) return
    const current = followUps.find((item) => item.label === editingLabel)
    if (!current) {
      setEditingLabel(null)
      setPlannerDraft(buildFollowUpDraft())
    }
  }, [editingLabel, followUps])

  function applyPlannerSeed(seed: {
    label: string
    days: number
    controlType: string
    rationale: string
  }) {
    setEditingLabel(null)
    setPlannerDraft(
      buildFollowUpDraft({
        label: seed.label,
        dueDate: nextFollowupDate(seed.days),
        controlType: seed.controlType,
        rationale: seed.rationale,
        intervalDays: seed.days,
        status: 'Programado',
      })
    )
  }

  function startEditingFollowUp(item: FollowUpPlan) {
    setEditingLabel(item.label)
    setPlannerDraft(buildFollowUpDraft(item))
  }

  function resetPlanner() {
    setEditingLabel(null)
    setPlannerDraft(buildFollowUpDraft())
  }

  function savePlanner() {
    if (!plannerDraft.label.trim() || !plannerDraft.dueDate) return
    onRegisterFollowUp({
      label: plannerDraft.label.trim(),
      dueDate: plannerDraft.dueDate,
      controlType: plannerDraft.controlType.trim() || 'Seguimiento',
      rationale: plannerDraft.rationale.trim() || undefined,
      intervalDays: plannerDraft.intervalDays ? Number(plannerDraft.intervalDays) : undefined,
      status: plannerDraft.status,
    })
    resetPlanner()
  }

  return (
    <div className="space-y-5">
      <Section title="Outcome documentado" icon={BookOpen}>
        {outcome ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <OutcomeCard label="Recomendación aceptada" value={outcome.recommendationAccepted || '—'} />
            <OutcomeCard label="Respuesta clínica" value={outcome.clinicalResponse || '—'} />
            <OutcomeCard label="Decisión terapéutica" value={outcome.treatmentDecision || '—'} />
            <OutcomeCard label="Eventos adversos" value={outcome.adverseEvents || '—'} />
            <OutcomeCard label="Aprendizaje de red" value={outcome.networkLearning || '—'} />
            <OutcomeCard label="Resumen de cierre" value={outcome.summary || '—'} long />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-[#4a7068]">
            El caso todavía no tiene un outcome registrado. Cuando se cierre, aquí quedará documentado si la recomendación se aceptó, qué respuesta clínica hubo y qué aprendizaje aporta a la red.
          </div>
        )}
      </Section>

      <FollowUpTimelineRuler followUps={followUps} />

      <Section title="Seguimiento programado" icon={Clock}>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_380px]">
          <div className="space-y-3">
            {followUps.length > 0 ? (
              followUps.map((fu, index) => (
                <div key={`${fu.label}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-[#152520]">{fu.label}</p>
                        <FollowUpStatusPill status={fu.status} />
                        {fu.controlType ? (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600">
                            {fu.controlType}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#4a7068]">
                        <span>Fecha: {fu.dueDate ? new Date(fu.dueDate).toLocaleDateString('es-ES') : 'Pendiente'}</span>
                        {fu.intervalDays ? <span>Intervalo: {fu.intervalDays} días</span> : null}
                      </div>
                      {fu.rationale ? (
                        <p className="mt-2 text-sm leading-6 text-[#4a7068]">{fu.rationale}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl text-xs"
                        onClick={() => startEditingFollowUp(fu)}
                        disabled={busyKey !== null}
                      >
                        Editar plan
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl text-xs"
                        onClick={() => onCompleteFollowUp(fu.label)}
                        disabled={busyKey !== null || fu.status === 'Completado'}
                      >
                        {fu.status === 'Completado' ? 'Seguimiento completado' : 'Registrar seguimiento'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-5 text-sm text-[#4a7068]">
                No hay seguimientos programados todavía. Puedes definirlos por patrón rápido o crear un plan manual.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#4a7068]">Planificador de seguimiento</p>
                <h3 className="mt-1 text-lg font-semibold text-[#152520]">
                  {editingLabel ? 'Editar control programado' : 'Definir próximo control'}
                </h3>
                <p className="mt-1 text-sm leading-6 text-[#4a7068]">
                  Ajusta cuándo volver a pedir laboratorio, cuándo revisar al paciente y qué motivo clínico justifica ese control.
                </p>
              </div>
              {editingLabel ? (
                <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={resetPlanner}>
                  Nuevo plan
                </Button>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <FollowUpPatternButton
                label="Lab 2 sem"
                detail="Concentración + biomarcadores"
                onClick={() =>
                  applyPlannerSeed({
                    label: 'Control de laboratorio 2 semanas',
                    days: 14,
                    controlType: 'Laboratorio',
                    rationale: 'Repetir determinantes y confirmar evolución temprana tras el ajuste terapéutico.',
                  })
                }
              />
              <FollowUpPatternButton
                label="Clínica 4 sem"
                detail="Respuesta y tolerancia"
                onClick={() =>
                  applyPlannerSeed({
                    label: 'Seguimiento clínico 4 semanas',
                    days: 28,
                    controlType: 'Visita clínica',
                    rationale: 'Valorar respuesta clínica inicial, adherencia y tolerabilidad del plan acordado.',
                  })
                }
              />
              <FollowUpPatternButton
                label="Outcome 8 sem"
                detail="Cierre del caso"
                onClick={() =>
                  applyPlannerSeed({
                    label: 'Seguimiento outcome 8 semanas',
                    days: 56,
                    controlType: 'Outcome / cierre',
                    rationale: 'Documentar outcome, decisión terapéutica final y aprendizaje de red.',
                  })
                }
              />
            </div>

            <div className="mt-5 space-y-4">
              <LabeledInput
                label="Etiqueta del control"
                value={plannerDraft.label}
                onChange={(value) => setPlannerDraft((current) => ({ ...current, label: value }))}
                placeholder="Ej.: Control de laboratorio 2 semanas"
                disabled={Boolean(editingLabel)}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <LabeledSelect
                  label="Tipo de control"
                  value={plannerDraft.controlType}
                  onChange={(value) => setPlannerDraft((current) => ({ ...current, controlType: value }))}
                  options={['Laboratorio', 'Visita clínica', 'Outcome / cierre', 'Revisión PK/PD', 'Co-validación', 'Personalizado']}
                />
                <LabeledInput
                  label="Fecha objetivo"
                  type="date"
                  value={plannerDraft.dueDate}
                  onChange={(value) => setPlannerDraft((current) => ({ ...current, dueDate: value }))}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <LabeledInput
                  label="Intervalo en días"
                  type="number"
                  value={plannerDraft.intervalDays}
                  onChange={(value) => setPlannerDraft((current) => ({ ...current, intervalDays: value }))}
                  placeholder="14"
                />
                <LabeledSelect
                  label="Estado del plan"
                  value={plannerDraft.status}
                  onChange={(value) => setPlannerDraft((current) => ({ ...current, status: value }))}
                  options={['Programado', 'Pendiente', 'Completado']}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#152520]">Motivo clínico o criterio</label>
                <textarea
                  className={`${sheetInputCls} min-h-[120px] resize-none`}
                  value={plannerDraft.rationale}
                  onChange={(event) => setPlannerDraft((current) => ({ ...current, rationale: event.target.value }))}
                  placeholder="Explica por qué el siguiente control debe ser en 2, 4, 8 semanas o en una fecha concreta."
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                size="sm"
                className="rounded-xl bg-[#7b3fa0] text-xs text-white hover:bg-[#6a3490]"
                onClick={savePlanner}
                disabled={busyKey !== null || !plannerDraft.label.trim() || !plannerDraft.dueDate}
              >
                Guardar planificación
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl text-xs"
                onClick={resetPlanner}
                disabled={busyKey !== null}
              >
                Limpiar
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Resultado y aprendizaje" icon={TrendingUp}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
	          {['Respuesta clínica', 'Respuesta bioquímica', 'Resultado PK/PD'].map((label) => (
	            <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
	              <p className="text-[10px] uppercase tracking-[0.14em] text-[#4a7068]">{label}</p>
	              <p className="mt-2 text-sm text-[#152520]">
                  {(caso.followUps ?? []).some((item) => item.status === 'Completado')
                    ? 'Ya existe seguimiento completado. El equipo puede usar este resultado para cierre y aprendizaje de red.'
                    : 'Se documentará cuando el seguimiento clínico esté completado y validado por el equipo.'}
                </p>
	            </div>
	          ))}
	        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {['Caso docente', 'Caso recurrente', 'Nuevo patrón', 'Revisión de protocolo sugerida'].map((tag) => (
            <span key={tag} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-[#4a7068]">
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-[#7b3fa0]/20 bg-slate-50 px-4 py-3">
          <p className="text-sm font-medium text-[#152520]">Aprendizaje de red</p>
          <p className="mt-1 text-[11px] leading-6 text-[#4a7068]">
            El caso pasa a aprendizaje compartido cuando hay seguimiento clínico completado, recomendación validada y cierre del circuito con trazabilidad profesional.
          </p>
        </div>
      </Section>
    </div>
  )
}

function OutcomeCard({
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

function FollowUpPatternButton({
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

function FollowUpStatusPill({ status }: { status: string }) {
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

const STAGE_DOT: Record<string, string> = {
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

const STAGE_DESC: Record<string, string> = {
  'Solicitud recibida':          'Solicitud registrada y pendiente de asignación al programa.',
  'Caso creado por IA':          'El agente IA ha estructurado el caso y asignado tipo de consulta.',
  'Datos incompletos':           'El farmacéutico ha detectado datos clínicos o analíticos pendientes.',
  'Pendiente de determinantes':  'Se aguardan niveles plasmáticos o resultados de laboratorio.',
  'Determinantes recibidos':     'Resultados analíticos disponibles para análisis PK/PD.',
  'Análisis PK/PD generado':     'El agente ha calculado parámetros PK y generado la interpretación.',
  'Revisión farmacéutica':       'El farmacéutico referente revisa el análisis y elabora recomendación.',
  'Revisión médica':             'El médico solicitante revisa y valida la recomendación.',
  'Discusión en red':            'El caso se presenta en sesión colaborativa con otros centros.',
  'Informe generado':            'La recomendación formal está redactada y pendiente de validación.',
  'Informe validado':            'El informe ha sido validado por farmacia y medicina.',
  'Registrado en HCE':           'La recomendación se ha integrado en la historia clínica electrónica.',
  'Seguimiento 4 semanas':       'Revisión intermedia: valoración de respuesta a los 30 días.',
  'Seguimiento 8 semanas':       'Revisión final: consolidación del resultado clínico.',
  'Cerrado con resultado':       'Caso cerrado con documentación del resultado clínico.',
}

// ── Pipeline Panel (unified single scroll) ───────────────────────────────────

function PipelinePanel({
  caso,
  actionBusy,
  inline = false,
}: {
  caso: CasoCompleto
  actionBusy: string | null
  inline?: boolean
}) {
  const stageIndex = PIPELINE_STAGES.findIndex((s) => s === caso.pipelineStage)
  const [expandedStage, setExpandedStage] = useState<string | null>(caso.pipelineStage)
  const [block1Open, setBlock1Open] = useState(true)
  const [block2Open, setBlock2Open] = useState(true)
  const pendingTasks = (caso.tasks ?? []).filter((t) => t.status !== 'Resuelta')
  const pendingFollowUps = (caso.followUps ?? []).filter((followUp) => followUp.status !== 'Completado')
  const approvalItems = [
    caso.recommendation?.status !== 'Validado' ? 'Recomendación pendiente de validar' : null,
    caso.clinicalNote?.status !== 'Registrado en HCE' ? 'Informe HCE no registrado' : null,
    pendingTasks.length > 0 ? `${pendingTasks.length} tarea${pendingTasks.length > 1 ? 's' : ''} abierta${pendingTasks.length > 1 ? 's' : ''}` : null,
    pendingFollowUps.length > 0 ? `${pendingFollowUps.length} seguimiento${pendingFollowUps.length > 1 ? 's' : ''} pendiente${pendingFollowUps.length > 1 ? 's' : ''}` : null,
  ].filter(Boolean) as string[]

  useEffect(() => {
    setExpandedStage(caso.pipelineStage)
  }, [caso.pipelineStage])

  const activeAgentFlow =
    actionBusy === 'orchestrate'
      ? {
          title: 'Agentes trabajando sobre el caso',
          steps: [
            'Validando completitud clínica',
            'Preparando interpretación PK/PD',
            'Redactando recomendación',
            'Preparando nota HCE',
          ],
        }
      : actionBusy === 'note:generate'
        ? {
            title: 'Agente de informe HCE trabajando',
            steps: [
              'Leyendo contexto validado',
              'Componiendo borrador clínico',
              'Preparando salida para revisión',
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
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#7b3fa0]">Flujo del caso</span>
          </div>
          <ChevronDown className={`h-3.5 w-3.5 text-[#7b3fa0] transition-transform ${block1Open ? '' : '-rotate-90'}`} />
        </button>
        {block1Open && (
      <div className={inline ? 'px-3 py-3 space-y-3' : 'flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-3 space-y-3'}>

        {/* Siguiente paso callout */}
        <div className="rounded-xl border border-[#7b3fa0]/20 bg-white px-3 py-3 shadow-sm">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#7b3fa0]">Siguiente paso</p>
          <p className="mt-1 text-sm font-bold text-slate-900">{caso.nextAction}</p>
          {actionBusy && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-[#7b3fa0]">
              <Sparkles className="h-3 w-3 animate-pulse" />
              Actualizando workflow…
            </div>
          )}
        </div>

        {activeAgentFlow ? (
          <AgentExecutionRail title={activeAgentFlow.title} steps={activeAgentFlow.steps} />
        ) : null}

        {/* Pipeline stages */}
        <div>
          <p className="mb-2 px-1 text-[9px] font-bold uppercase tracking-widest text-slate-400">
            Flujo del caso
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
                          ▶ AHORA
                        </span>
                      )}
                    </button>

                    {isExpanded && !isPending && (
                      <div
                        className="mb-1 ml-9 overflow-hidden rounded-lg border-l-4 bg-white p-2.5"
                        style={{ borderColor: dot }}
                      >
                        <p className="text-[11px] leading-relaxed text-slate-500">{STAGE_DESC[stage]}</p>
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
                            {pendingTasks.slice(0, 2).map((t) => (
                              <div key={t.taskId} className="rounded border border-slate-200 bg-slate-50 px-2 py-1.5">
                                <p className="text-[11px] font-semibold text-slate-800">{t.title}</p>
                                <p className="text-[10px] text-slate-500">{t.ownerRole}</p>
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
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#7b3fa0]">Contexto y acciones</span>
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
            <p className="text-slate-400">Solicitante · {caso.centerName}</p>
            <p className="mt-1.5 font-semibold text-slate-800">{caso.assignedName}</p>
            <p className="text-slate-400">Farmacia responsable</p>
          </div>
        </div>

        {/* Approvals needed */}
        {approvalItems.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-amber-600">Pendiente de validar</p>
            {approvalItems.map((item) => (
              <div key={item} className="rounded-lg border-l-4 border-amber-400 bg-amber-50 px-2.5 py-1.5 text-[11px] font-medium text-amber-800">
                {item}
              </div>
            ))}
          </div>
        )}

        {pendingFollowUps.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-cyan-700">Seguimiento visible</p>
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

function AgentExecutionRail({
  title,
  steps,
}: {
  title: string
  steps: string[]
}) {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    setActiveStep(0)
    const timer = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % steps.length)
    }, 950)
    return () => window.clearInterval(timer)
  }, [steps])

  return (
    <div className="rounded-xl border border-[#7b3fa0]/20 bg-white px-3 py-3 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#7b3fa0]/10">
          <Bot className="h-4 w-4 text-[#7b3fa0]" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7b3fa0]">Ejecución agentic</p>
          <p className="text-xs font-semibold text-slate-900">{title}</p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {steps.map((step, index) => {
          const isDone = index < activeStep
          const isRunning = index === activeStep
          return (
            <div
              key={step}
              className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-[11px] transition ${
                isRunning
                  ? 'border-[#7b3fa0]/20 bg-[#faf6fd] text-[#7b3fa0]'
                  : isDone
                    ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                    : 'border-slate-100 bg-slate-50 text-slate-400'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              ) : isRunning ? (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
              ) : (
                <div className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-slate-200" />
              )}
              <span className={isRunning ? 'font-semibold' : ''}>{step}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Tab: Auditoría ────────────────────────────────────────────────────────────

function TabAuditoria({ caso }: { caso: CasoCompleto }) {
  const auditEvents = [
    { event: 'Caso creado', timestamp: caso.createdAt, actor: caso.requesterName },
    ...((caso.timeline ?? [])
      .filter((event) => event.lane === 'Decisiones' || event.lane === 'Tareas')
      .map((event) => ({
        event: event.label,
        timestamp: event.date,
        actor: [((event as any).actorName ?? event.lane), ((event as any).actorRole ?? null), ((event as any).actorCenter ?? null)]
          .filter(Boolean)
          .join(' · '),
      }))),
    ...(caso.agentRuns ?? []).map((run) => ({
      event: `${run.agent}: ${run.message}`,
      timestamp: run.timestamp,
      actor: run.agent,
    })),
    { event: 'Última actualización', timestamp: caso.updatedAt, actor: caso.assignedName },
  ].sort((a, b) => a.timestamp.localeCompare(b.timestamp))

  return (
    <div className="space-y-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-[#4a7068]">Registro de auditoría · {caso.caseId}</p>
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <table className="min-w-full text-left">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-[0.16em] text-[#4a7068]">
            <tr>
              <th className="px-4 py-3 font-medium">Evento</th>
              <th className="px-4 py-3 font-medium">Actor</th>
              <th className="px-4 py-3 font-medium">Fecha y hora</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {auditEvents.map((ev, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm text-[#152520]">{ev.event}</td>
                <td className="px-4 py-3 text-sm text-[#4a7068]">{ev.actor}</td>
                <td className="px-4 py-3 text-xs text-slate-400">
                  {new Date(ev.timestamp).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Activity; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#7b3fa0]" />
        <p className="text-[10px] uppercase tracking-[0.18em] text-[#4a7068]">{title}</p>
      </div>
      {children}
    </div>
  )
}

type CaseEditorDraft = {
  title: string
  clinicalSummary: string
  fieldReview: Record<string, FieldReviewMeta>
  nextAction: string
  age: string
  sex: string
  weightKg: string
  heightCm: string
  specialPopulation: string
  diagnosis: string
  phenotype: string
  activity: string
  extraintestinal: string
  currentDrug: string
  currentDose: string
  interval: string
  route: string
  previousTherapies: string
  adherence: string
  labDeterminants: Array<{
    id: string
    label: string
    value: string
    unit: string
    status: string
    source: string
    relationToDose: string
    interpretation: string
  }>
}

function buildEditorDraft(caso: CasoCompleto): CaseEditorDraft {
  const disease = caso.diseaseContext as Record<string, any>
  const therapy = caso.therapyContext as Record<string, any>

  return {
    title: caso.title ?? '',
    clinicalSummary: caso.clinicalSummary ?? '',
    fieldReview: caso.fieldReview ?? {},
    nextAction: caso.nextAction ?? '',
    age: caso.patientProfile?.age != null ? String(caso.patientProfile.age) : '',
    sex: caso.patientProfile?.sex ?? '',
    weightKg: caso.patientProfile?.weightKg != null ? String(caso.patientProfile.weightKg) : '',
    heightCm: caso.patientProfile?.heightCm != null ? String(caso.patientProfile.heightCm) : '',
    specialPopulation: (caso.patientProfile?.specialPopulation ?? []).join(', '),
    diagnosis: String(disease.diagnosis ?? ''),
    phenotype: String(disease.phenotype ?? ''),
    activity: String(disease.activity ?? ''),
    extraintestinal: String(disease.extraintestinal ?? ''),
    currentDrug: String(therapy.currentDrug ?? ''),
    currentDose: String(therapy.currentDose ?? ''),
    interval: String(therapy.interval ?? ''),
    route: String(therapy.route ?? ''),
    previousTherapies: Array.isArray(therapy.previousTherapies)
      ? therapy.previousTherapies.join(', ')
      : String(therapy.previousTherapies ?? ''),
    adherence: String(therapy.adherence ?? ''),
    labDeterminants: (caso.labDeterminants ?? []).map((item, index) => ({
      id: `sheet-det-${index + 1}`,
      label: item.label ?? '',
      value: String(item.value ?? ''),
      unit: item.unit ?? '',
      status: item.status ?? 'Pendiente de validar',
      source: item.source ?? 'Formulario',
      relationToDose: item.relationToDose ?? '',
      interpretation: item.interpretation ?? '',
    })),
  }
}

function parseCommaList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function humanizeFieldLabel(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim()
}

function CloseOutcomeSheet({
  draft,
  saving,
  onClose,
  onChange,
  onSave,
}: {
  draft: CaseOutcomeDraft
  saving: boolean
  onClose: () => void
  onChange: React.Dispatch<React.SetStateAction<CaseOutcomeDraft>>
  onSave: () => void
}) {
  function setField<K extends keyof CaseOutcomeDraft>(field: K, value: CaseOutcomeDraft[K]) {
    onChange((current) => ({ ...current, [field]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/25 backdrop-blur-[1px]">
      <div className="flex h-full w-full max-w-[620px] flex-col overflow-hidden bg-white shadow-[0_30px_90px_rgba(15,30,28,0.2)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b3fa0]">Cierre clínico del caso</p>
            <h3 className="mt-1 text-xl font-semibold text-[#152520]">Registrar outcome antes de cerrar</h3>
            <p className="mt-1 text-sm text-[#4a7068]">
              Documenta aceptación, respuesta clínica, decisión terapéutica y aprendizaje para que el caso alimente la inteligencia de red.
            </p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <LabeledSelect
              label="¿Se aceptó la recomendación?"
              value={draft.recommendationAccepted}
              onChange={(value) => setField('recommendationAccepted', value)}
              options={['', 'Aceptada íntegramente', 'Aceptada con ajustes', 'No aceptada', 'Pendiente de confirmar']}
            />
            <LabeledSelect
              label="Respuesta clínica al seguimiento"
              value={draft.clinicalResponse}
              onChange={(value) => setField('clinicalResponse', value)}
              options={['', 'Mejora clara', 'Mejora parcial', 'Sin cambios', 'Empeoramiento', 'Pendiente de seguimiento']}
            />
            <LabeledSelect
              label="Decisión terapéutica final"
              value={draft.treatmentDecision}
              onChange={(value) => setField('treatmentDecision', value)}
              options={['', 'Mantener', 'Optimizar dosis', 'Acortar intervalo', 'Cambiar fármaco', 'Desintensificar', 'Repetir determinantes']}
            />
            <LabeledSelect
              label="Eventos adversos"
              value={draft.adverseEvents}
              onChange={(value) => setField('adverseEvents', value)}
              options={['', 'Ninguno relevante', 'Leves', 'Moderados', 'Graves', 'Pendiente de revisar']}
            />
          </div>

          <div className="mt-4">
            <LabeledInput
              label="Valor para aprendizaje de red"
              value={draft.networkLearning}
              onChange={(value) => setField('networkLearning', value)}
              placeholder="Ej.: caso docente, patrón recurrente, revisión de protocolo sugerida…"
            />
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-[#152520]">Resumen de cierre</label>
            <textarea
              className={`${sheetInputCls} min-h-[150px] resize-none`}
              value={draft.summary}
              onChange={(event) => setField('summary', event.target.value)}
              placeholder="Resume qué se decidió, qué ocurrió en el seguimiento y qué aprendizaje deja el caso."
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
          <p className="text-xs text-[#4a7068]">El caso quedará marcado como «Cerrado con resultado».</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onClose}>
              Cancelar
            </Button>
            <Button size="sm" className="rounded-xl bg-[#7b3fa0] text-xs text-white hover:bg-[#6a3490]" onClick={onSave} disabled={saving}>
              {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Guardar y cerrar caso
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

const sheetInputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#152520] outline-none transition placeholder:text-slate-400 focus:border-[#7b3fa0] focus:ring-2 focus:ring-[#7b3fa0]/15'

function CaseEditorSheet({
  draft,
  entrySource,
  emailOriginal,
  onChange,
  onClose,
  onSave,
  saving,
  error,
}: {
  draft: CaseEditorDraft
  entrySource: string
  emailOriginal?: string
  onChange: React.Dispatch<React.SetStateAction<CaseEditorDraft>>
  onClose: () => void
  onSave: () => void
  saving: boolean
  error: string | null
}) {
  function setField<K extends keyof CaseEditorDraft>(field: K, value: CaseEditorDraft[K]) {
    onChange((current) => ({ ...current, [field]: value }))
  }

  function setReviewedField<K extends keyof CaseEditorDraft>(
    field: K,
    value: CaseEditorDraft[K],
    reviewPath?: string,
  ) {
    onChange((current) => {
      const nextReview = { ...(current.fieldReview ?? {}) }
      if (reviewPath) {
        const currentReview = getDraftFieldReviewMeta(nextReview, reviewPath)
        nextReview[reviewPath] = {
          ...currentReview,
          origin: currentReview.origin,
          state: currentReview.origin === 'llm' ? 'edited' : 'confirmed',
          sourceLabel: currentReview.sourceLabel ?? (currentReview.origin === 'llm' ? 'Extraído del email' : 'Registrado manualmente'),
        }
      }
      return { ...current, [field]: value, fieldReview: nextReview }
    })
  }

  function setFieldReviewState(reviewPath: string, state: FieldReviewMeta['state']) {
    onChange((current) => {
      const currentReview = getDraftFieldReviewMeta(current.fieldReview ?? {}, reviewPath)
      return {
        ...current,
        fieldReview: {
          ...(current.fieldReview ?? {}),
          [reviewPath]: {
            ...currentReview,
            state,
            sourceLabel: currentReview.sourceLabel ?? (currentReview.origin === 'llm' ? 'Extraído del email' : 'Registrado manualmente'),
          },
        },
      }
    })
  }

  function updateDeterminant(
    id: string,
    field: keyof CaseEditorDraft['labDeterminants'][number],
    value: string,
    reviewPath?: string,
  ) {
    onChange((current) => ({
      ...current,
      labDeterminants: current.labDeterminants.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
      fieldReview: reviewPath
        ? {
            ...(current.fieldReview ?? {}),
            [reviewPath]: {
              ...getDraftFieldReviewMeta(current.fieldReview ?? {}, reviewPath),
              state:
                getDraftFieldReviewMeta(current.fieldReview ?? {}, reviewPath).origin === 'llm'
                  ? 'edited'
                  : 'confirmed',
              sourceLabel:
                getDraftFieldReviewMeta(current.fieldReview ?? {}, reviewPath).sourceLabel
                ?? (getDraftFieldReviewMeta(current.fieldReview ?? {}, reviewPath).origin === 'llm'
                  ? 'Extraído del email'
                  : 'Registrado manualmente'),
            },
          }
        : current.fieldReview,
    }))
  }

  function addDeterminant() {
    onChange((current) => ({
      ...current,
      labDeterminants: [
        ...current.labDeterminants,
        {
          id: `sheet-det-${Date.now()}`,
          label: '',
          value: '',
          unit: '',
          status: 'Pendiente de validar',
          source: 'Formulario',
          relationToDose: '',
          interpretation: '',
        },
      ],
    }))
  }

  function removeDeterminant(id: string) {
    onChange((current) => ({
      ...current,
      labDeterminants: current.labDeterminants.filter((item) => item.id !== id),
    }))
  }

  const reviewValues = Object.values(draft.fieldReview ?? {})
  const pendingCount = reviewValues.filter((item) => item.state === 'pending').length
  const confirmedCount = reviewValues.filter((item) => item.state === 'confirmed').length
  const editedCount = reviewValues.filter((item) => item.state === 'edited').length
  const llmCount = reviewValues.filter((item) => item.origin === 'llm').length

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/25 backdrop-blur-[1px]">
      <div className="flex h-full w-full max-w-[760px] flex-col overflow-hidden bg-white shadow-[0_30px_90px_rgba(15,30,28,0.2)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b3fa0]">Editor clínico lateral</p>
            <h3 className="mt-1 text-xl font-semibold text-[#152520]">Actualizar datos, tratamiento y determinantes</h3>
            <p className="mt-1 text-sm text-[#4a7068]">
              Mantén el caso visible y edita la información clave sin salir del cockpit.
            </p>
            {entrySource === 'Email' ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#7b3fa0]/10 px-2.5 py-1 text-[10px] font-semibold text-[#7b3fa0]">
                  Precompletado por Agentes desde email
                </span>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
                  Revisión humana requerida
                </span>
              </div>
            ) : null}
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            {entrySource === 'Email' ? (
              <div className="grid gap-2 sm:grid-cols-4">
                <ReviewMiniMetric label="Agentes" value={String(llmCount)} tone="llm" />
                <ReviewMiniMetric label="Pendientes" value={String(pendingCount)} tone="pending" />
                <ReviewMiniMetric label="Confirmados" value={String(confirmedCount)} tone="confirmed" />
                <ReviewMiniMetric label="Editados" value={String(editedCount)} tone="edited" />
              </div>
            ) : null}

            {entrySource === 'Email' && emailOriginal ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <p className="mb-3 text-sm font-semibold text-[#152520]">Solicitud original por email</p>
                <p className="mb-3 text-xs leading-6 text-[#4a7068]">
                  Este contenido bruto se conserva como referencia de entrada. Puedes corregir los campos del caso sin perder el texto original.
                </p>
                <div className="max-h-[220px] overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-[#152520]">
                    {emailOriginal}
                  </pre>
                </div>
              </div>
            ) : null}

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-sm font-semibold text-[#152520]">Resumen y siguiente paso</p>
              <div className="space-y-4">
                <div>
                  <ReviewedInput
                    label="Título del caso"
                    value={draft.title}
                    onChange={(value) => setReviewedField('title', value, 'title')}
                    review={getDraftFieldReviewMeta(draft.fieldReview, 'title')}
                    onConfirm={() => setFieldReviewState('title', 'confirmed')}
                    onPending={() => setFieldReviewState('title', 'pending')}
                  />
                </div>
                <div>
                  <ReviewedTextarea
                    label="Resumen clínico"
                    value={draft.clinicalSummary}
                    onChange={(value) => setReviewedField('clinicalSummary', value, 'clinicalSummary')}
                    review={getDraftFieldReviewMeta(draft.fieldReview, 'clinicalSummary')}
                    onConfirm={() => setFieldReviewState('clinicalSummary', 'confirmed')}
                    onPending={() => setFieldReviewState('clinicalSummary', 'pending')}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#152520]">Siguiente paso</label>
                  <input
                    className={sheetInputCls}
                    value={draft.nextAction}
                    onChange={(event) => setField('nextAction', event.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <p className="mb-3 text-sm font-semibold text-[#152520]">Paciente</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ReviewedInput label="Edad" value={draft.age} onChange={(value) => setReviewedField('age', value, 'patientProfile.age')} review={getDraftFieldReviewMeta(draft.fieldReview, 'patientProfile.age')} onConfirm={() => setFieldReviewState('patientProfile.age', 'confirmed')} onPending={() => setFieldReviewState('patientProfile.age', 'pending')} />
                  <ReviewedInput label="Sexo" value={draft.sex} onChange={(value) => setReviewedField('sex', value, 'patientProfile.sex')} review={getDraftFieldReviewMeta(draft.fieldReview, 'patientProfile.sex')} onConfirm={() => setFieldReviewState('patientProfile.sex', 'confirmed')} onPending={() => setFieldReviewState('patientProfile.sex', 'pending')} />
                  <ReviewedInput label="Peso (kg)" value={draft.weightKg} onChange={(value) => setReviewedField('weightKg', value, 'patientProfile.weightKg')} review={getDraftFieldReviewMeta(draft.fieldReview, 'patientProfile.weightKg')} onConfirm={() => setFieldReviewState('patientProfile.weightKg', 'confirmed')} onPending={() => setFieldReviewState('patientProfile.weightKg', 'pending')} />
                  <LabeledInput label="Altura (cm)" value={draft.heightCm} onChange={(value) => setField('heightCm', value)} />
                </div>
                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium text-[#152520]">Población especial</label>
                  <input
                    className={sheetInputCls}
                    value={draft.specialPopulation}
                    onChange={(event) => setField('specialPopulation', event.target.value)}
                    placeholder="Inmunosuprimido, Geriátrico…"
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <p className="mb-3 text-sm font-semibold text-[#152520]">Enfermedad</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <LabeledInput label="Diagnóstico" value={draft.diagnosis} onChange={(value) => setField('diagnosis', value)} />
                  <ReviewedInput label="Fenotipo" value={draft.phenotype} onChange={(value) => setReviewedField('phenotype', value, 'diseaseContext.phenotype')} review={getDraftFieldReviewMeta(draft.fieldReview, 'diseaseContext.phenotype')} onConfirm={() => setFieldReviewState('diseaseContext.phenotype', 'confirmed')} onPending={() => setFieldReviewState('diseaseContext.phenotype', 'pending')} />
                  <ReviewedInput label="Actividad" value={draft.activity} onChange={(value) => setReviewedField('activity', value, 'diseaseContext.activity')} review={getDraftFieldReviewMeta(draft.fieldReview, 'diseaseContext.activity')} onConfirm={() => setFieldReviewState('diseaseContext.activity', 'confirmed')} onPending={() => setFieldReviewState('diseaseContext.activity', 'pending')} />
                  <LabeledInput label="Manifestaciones extraintestinales" value={draft.extraintestinal} onChange={(value) => setField('extraintestinal', value)} />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-sm font-semibold text-[#152520]">Tratamiento actual</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <ReviewedInput label="Fármaco actual" value={draft.currentDrug} onChange={(value) => setReviewedField('currentDrug', value, 'therapyContext.currentDrug')} review={getDraftFieldReviewMeta(draft.fieldReview, 'therapyContext.currentDrug')} onConfirm={() => setFieldReviewState('therapyContext.currentDrug', 'confirmed')} onPending={() => setFieldReviewState('therapyContext.currentDrug', 'pending')} />
                <ReviewedInput label="Dosis actual" value={draft.currentDose} onChange={(value) => setReviewedField('currentDose', value, 'therapyContext.currentDose')} review={getDraftFieldReviewMeta(draft.fieldReview, 'therapyContext.currentDose')} onConfirm={() => setFieldReviewState('therapyContext.currentDose', 'confirmed')} onPending={() => setFieldReviewState('therapyContext.currentDose', 'pending')} />
                <ReviewedInput label="Intervalo" value={draft.interval} onChange={(value) => setReviewedField('interval', value, 'therapyContext.interval')} review={getDraftFieldReviewMeta(draft.fieldReview, 'therapyContext.interval')} onConfirm={() => setFieldReviewState('therapyContext.interval', 'confirmed')} onPending={() => setFieldReviewState('therapyContext.interval', 'pending')} />
                <ReviewedInput label="Vía" value={draft.route} onChange={(value) => setReviewedField('route', value, 'therapyContext.route')} review={getDraftFieldReviewMeta(draft.fieldReview, 'therapyContext.route')} onConfirm={() => setFieldReviewState('therapyContext.route', 'confirmed')} onPending={() => setFieldReviewState('therapyContext.route', 'pending')} />
                <div className="sm:col-span-2">
                  <LabeledInput label="Tratamientos previos" value={draft.previousTherapies} onChange={(value) => setField('previousTherapies', value)} />
                </div>
                <div className="sm:col-span-2">
                  <LabeledInput label="Adherencia" value={draft.adherence} onChange={(value) => setField('adherence', value)} />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#152520]">Determinantes PK/PD</p>
                  <p className="text-xs text-[#4a7068]">Corrige o completa los determinantes en un panel amplio y contextual.</p>
                </div>
                <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={addDeterminant}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Añadir
                </Button>
              </div>
              <div className="space-y-4">
                {draft.labDeterminants.map((item, index) => (
                  <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[#152520]">{item.label || 'Nuevo determinante'}</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <ReviewStatusInline
                            review={getDraftFieldReviewMeta(draft.fieldReview, `labDeterminants.${index}`)}
                            onConfirm={() => setFieldReviewState(`labDeterminants.${index}`, 'confirmed')}
                            onPending={() => setFieldReviewState(`labDeterminants.${index}`, 'pending')}
                          />
                        </div>
                      </div>
                      {draft.labDeterminants.length > 1 ? (
                        <button onClick={() => removeDeterminant(item.id)} className="text-xs text-red-600 hover:text-red-700">
                          Eliminar
                        </button>
                      ) : null}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <LabeledInput label="Nombre" value={item.label} onChange={(value) => updateDeterminant(item.id, 'label', value, `labDeterminants.${index}`)} />
                      <LabeledInput label="Valor" value={item.value} onChange={(value) => updateDeterminant(item.id, 'value', value, `labDeterminants.${index}`)} />
                      <LabeledInput label="Unidad" value={item.unit} onChange={(value) => updateDeterminant(item.id, 'unit', value, `labDeterminants.${index}`)} />
                      <LabeledInput label="Estado" value={item.status} onChange={(value) => updateDeterminant(item.id, 'status', value, `labDeterminants.${index}`)} />
                      <LabeledInput label="Fuente" value={item.source} onChange={(value) => updateDeterminant(item.id, 'source', value, `labDeterminants.${index}`)} />
                      <LabeledInput label="Relación con la dosis" value={item.relationToDose} onChange={(value) => updateDeterminant(item.id, 'relationToDose', value, `labDeterminants.${index}`)} />
                      <div className="sm:col-span-2">
                        <LabeledInput label="Interpretación" value={item.interpretation} onChange={(value) => updateDeterminant(item.id, 'interpretation', value, `labDeterminants.${index}`)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
          <p className="text-xs text-[#4a7068]">Los cambios se guardan sobre el caso activo y quedan reflejados en la actualización del expediente.</p>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl text-sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button className="rounded-xl bg-[#7b3fa0] text-sm text-white hover:bg-[#6a3490]" onClick={onSave} disabled={saving}>
              {saving ? <Save className="mr-2 h-4 w-4 animate-pulse" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar cambios
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  disabled?: boolean
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#152520]">{label}</label>
      <input
        className={sheetInputCls}
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

function LabeledSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#152520]">{label}</label>
      <select className={sheetInputCls} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option || '__empty__'} value={option}>
            {option || 'Seleccionar…'}
          </option>
        ))}
      </select>
    </div>
  )
}

function ReviewedInput({
  label,
  value,
  onChange,
  review,
  onConfirm,
  onPending,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  review: FieldReviewMeta
  onConfirm: () => void
  onPending: () => void
}) {
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm font-medium text-[#152520]">{label}</label>
        <ReviewStatusInline review={review} onConfirm={onConfirm} onPending={onPending} />
      </div>
      <input className={sheetInputCls} value={value} onChange={(event) => onChange(event.target.value)} />
      <p className="mt-1 text-[10px] text-slate-400">
        Trazabilidad: {reviewTraceLabel(review)}
      </p>
    </div>
  )
}

function ReviewedTextarea({
  label,
  value,
  onChange,
  review,
  onConfirm,
  onPending,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  review: FieldReviewMeta
  onConfirm: () => void
  onPending: () => void
}) {
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm font-medium text-[#152520]">{label}</label>
        <ReviewStatusInline review={review} onConfirm={onConfirm} onPending={onPending} />
      </div>
      <textarea
        rows={5}
        className={`${sheetInputCls} resize-none`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <p className="mt-1 text-[10px] text-slate-400">
        Trazabilidad: {reviewTraceLabel(review)}
      </p>
    </div>
  )
}

function ReviewStatusInline({
  review,
  onConfirm,
  onPending,
}: {
  review: FieldReviewMeta
  onConfirm: () => void
  onPending: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold ${reviewStatusTone(review)}`}>
        <span>{reviewStatusSymbol(review)}</span>
        Estado: {reviewStatusLabel(review)}
      </span>
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-medium text-slate-600">
        Origen: {reviewOriginLabel(review)}
      </span>
      {review.origin === 'llm' ? (
        <>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full border border-emerald-200 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            Confirmar
          </button>
          <button
            type="button"
            onClick={onPending}
            className="rounded-full border border-amber-200 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700 transition hover:bg-amber-50"
          >
            Pendiente
          </button>
        </>
      ) : null}
    </div>
  )
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
