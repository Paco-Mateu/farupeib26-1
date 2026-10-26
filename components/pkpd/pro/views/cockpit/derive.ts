import type { CasoCompleto, FieldReviewMeta, FollowUpPlan } from '@/components/pkpd/pro/xarxa-types'
import { DEFAULT_MANUAL_REVIEW } from './shared'
import type { CaseOutcomeDraft, FollowUpDraft, MedicationHistoryEntry, PkpdStatus } from './shared'

export function buildOutcomeDraft(caso: CasoCompleto): CaseOutcomeDraft {
  return {
    recommendationAccepted: caso.caseOutcome?.recommendationAccepted ?? '',
    clinicalResponse: caso.caseOutcome?.clinicalResponse ?? '',
    treatmentDecision: caso.caseOutcome?.treatmentDecision ?? '',
    adverseEvents: caso.caseOutcome?.adverseEvents ?? '',
    networkLearning: caso.caseOutcome?.networkLearning ?? '',
    summary: caso.caseOutcome?.summary ?? '',
  }
}

export function buildFollowUpDraft(seed?: Partial<FollowUpPlan>): FollowUpDraft {
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

export function deriveDrugLine(caso: CasoCompleto): string {
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

export function deriveTrough(caso: CasoCompleto): { value: string; unit: string } | null {
  const dets = caso.labDeterminants ?? []
  const hit = dets.find(d =>
    d.relationToDose === 'Valle' ||
    /concentraci[oó]n|séric|niveau|trough|sérum|sérique/i.test(d.label)
  )
  if (!hit || hit.value === null || hit.value === undefined) return null
  return { value: String(hit.value), unit: hit.unit ?? '' }
}

export function parseDoseValue(value?: string | null) {
  if (!value) return null
  const match = String(value).match(/(\d+(?:[.,]\d+)?)/)
  return match ? Number(match[1].replace(',', '.')) : null
}

export function extractDoseText(value?: string | null) {
  if (!value) return '—'
  const match = String(value).match(/(\d+(?:[.,]\d+)?\s*(?:mg|g|mcg|µg|ml))/i)
  return match ? match[1] : String(value)
}

export function inferMedicationChange(label: string) {
  const normalized = label.toLowerCase()
  if (/mantener|sin cambios|ratific|continuar/i.test(normalized)) return 'Ratificación'
  if (/aument|intensif|acortar/i.test(normalized)) return 'Intensificación'
  if (/reduc|desintensif|espaciar/i.test(normalized)) return 'Reducción'
  if (/cambi|switch|suspender|retirar/i.test(normalized)) return 'Cambio'
  if (/inicio|debut|start/i.test(normalized)) return 'Inicio'
  return 'Seguimiento'
}

export function deriveMedicationHistory(caso: CasoCompleto): MedicationHistoryEntry[] {
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

export function getFieldReviewMeta(caso: CasoCompleto, path: string): FieldReviewMeta {
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

export function getDraftFieldReviewMeta(
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

// `label` is a dictionary key (namespace 'cockpit-core', lib/i18n/xarxa/cockpit-core.ts),
// resolved with t() at the render site.
export function pkpdStatus(pattern: string): PkpdStatus {
  const p = (pattern ?? '').toLowerCase()
  if (/infra|bajo|sub|under|low/i.test(p))
    return { label: 'pkpd.status.infraexposicion', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-400' }
  if (/sobre|supra|alto|over|high/i.test(p))
    return { label: 'pkpd.status.sobreexposicion', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500' }
  if (/rango|range|objetivo|optim|diana/i.test(p))
    return { label: 'pkpd.status.en-rango', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' }
  return { label: pattern || '—', color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200', dot: 'bg-slate-400' }
}

export function toDatetimeLocalInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return ''
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`
}

export function formatSampleDateTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return String(iso)
  return parsed.toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function parseCommaList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function humanizeFieldLabel(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim()
}

export function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
