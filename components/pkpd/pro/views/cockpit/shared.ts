import {
  Activity, Clock, FlaskConical, LayoutDashboard, MessageSquareText, TrendingUp,
} from 'lucide-react'
import type * as React from 'react'
import type { CasoCompleto, FieldReviewMeta, Program } from '@/components/pkpd/pro/xarxa-types'

export type Tab =
  | 'resumen' | 'datos' | 'analisis' | 'recomendacion' | 'actividad' | 'flujo'

export const TABS: Array<{ id: Tab; label: string; icon: React.ElementType; mobileOnly?: boolean }> = [
  { id: 'resumen',       label: 'Resumen',    icon: LayoutDashboard },
  { id: 'datos',         label: 'Datos',      icon: FlaskConical },
  { id: 'analisis',      label: 'Análisis',   icon: TrendingUp },
  { id: 'recomendacion', label: 'Recomend.',  icon: MessageSquareText },
  { id: 'actividad',     label: 'Actividad',  icon: Clock },
  { id: 'flujo',         label: 'Flujo',      icon: Activity, mobileOnly: true },
]

export const LANE_COLORS: Record<string, string> = {
  Clínica: 'bg-violet-100 text-violet-700',
  Tratamiento: 'bg-blue-100 text-blue-700',
  Laboratorio: 'bg-teal-100 text-teal-700',
  Administración: 'bg-slate-100 text-slate-600',
  Decisiones: 'bg-amber-100 text-amber-700',
  Tareas: 'bg-orange-100 text-orange-700',
}

export const LANE_DOT_RING: Record<string, string> = {
  Clínica:        'ring-violet-300',
  Tratamiento:    'ring-blue-300',
  Laboratorio:    'ring-teal-300',
  Administración: 'ring-slate-300',
  Decisiones:     'ring-amber-300',
  Tareas:         'ring-orange-300',
}

export const RECOMMENDATION_STATUS: Record<string, { style: string; label: string }> = {
  'Borrador IA': { style: 'bg-slate-100 text-slate-600', label: 'Borrador preparado por Agentes' },
  'Editado por farmacia': { style: 'bg-blue-50 text-blue-700', label: 'Editado por farmacia' },
  'Pendiente de revisión médica': { style: 'bg-amber-50 text-amber-700', label: 'Pendiente de revisión médica' },
  Validado: { style: 'bg-green-50 text-green-700', label: 'Validado' },
  Rechazado: { style: 'bg-red-50 text-red-700', label: 'Rechazado' },
}

export const NOTE_STATUS: Record<string, { style: string }> = {
  Borrador: { style: 'bg-slate-100 text-slate-600' },
  'Informe generado': { style: 'bg-teal-50 text-teal-700' },
  'Pendiente de co-validación': { style: 'bg-amber-50 text-amber-700' },
  Validado: { style: 'bg-green-50 text-green-700' },
  'Registrado en HCE': { style: 'bg-emerald-50 text-emerald-700' },
}

export const DEMO_ACTOR = {
  actorName: 'Farmacéutico referente',
  actorRole: 'Farmacéutico experto',
  actorCenter: 'H.U. Bellvitge',
  actorType: 'human',
} as const

export type Props = {
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

export type CaseOutcomeDraft = {
  recommendationAccepted: string
  clinicalResponse: string
  treatmentDecision: string
  adverseEvents: string
  networkLearning: string
  summary: string
}

export type FollowUpDraft = {
  label: string
  dueDate: string
  controlType: string
  rationale: string
  intervalDays: string
  status: string
}

export type MedicationHistoryEntry = {
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

export const DEFAULT_MANUAL_REVIEW: FieldReviewMeta = {
  origin: 'manual',
  state: 'confirmed',
  sourceLabel: 'Registrado manualmente',
}

export type PkpdStatus = { label: string; color: string; bg: string; border: string; dot: string }

export type PkpdEvaluation = {
  engine: string
  drug: string
  targetRange: [number, number]
  unit: string
  source: string
  observed: { value: number; mic?: number; sampleDateTime?: string | null; sampleType?: string | null } | null
  inTarget: boolean | null
  firedRules: Array<{ id: string; condition: string; action: string }>
  recommendationDraft: string
  note: string
}

export type BayesEvaluation = {
  engine: string
  note: string
  drug: string
  status: 'estimated' | 'insufficient-data' | string
  detail?: string
  weightKg?: number
  clearance?: { estimatedLPerDay: number; populationLPerDay: number; relativeToPopulation: number }
  levelsUsed?: number
  dosesUsed?: number
  regimenComparison?: Array<{
    label: string
    doseMg: number
    intervalDays: number
    route: string
    cminMgPerL: number
    aucMgHPerL: number
    aucWeeklyMgHPerL: number
  }>
  sourceNote?: string
}

export type SimilarCaseItem = {
  caseId: string
  title: string
  centerName: string
  caseType: string
  pipelineStage: string
  patientCode: string
  recommendation?: { text?: string; status?: string }
  score: number
}

export type CaseEditorDraft = {
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
    sampleDateTime: string
    sampleType: string
    interpretation: string
  }>
}

export const sheetInputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#152520] outline-none transition placeholder:text-slate-400 focus:border-[#7b3fa0] focus:ring-2 focus:ring-[#7b3fa0]/15'
