'use client'

import { AlertCircle, Bot, CheckCircle2, ChevronLeft, ChevronRight, Clock3, FlaskConical, Loader2, Plus, Sparkles, Stethoscope, TriangleAlert } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { useXarxaT } from '@/components/i18n/use-xarxa-strings'
import type { Center, PatientHistoryPayload, Professional, Program } from '@/components/pkpd/pro/xarxa-types'
import { SAMPLE_TYPES } from '@/components/pkpd/pro/xarxa-types'
import { WorkspaceErrorState, WorkspaceLoadingState } from '@/components/pkpd/pro/workspace-state'
import { Button } from '@/components/ui/button'
import { fetchJson } from '@/lib/fetch-json'

type WizardStep = 'trigger' | 'patient' | 'therapy' | 'labs' | 'completeness' | 'submit'

type DoseDraft = {
  id: string
  administeredAt: string
  doseAmount: string
  unit: string
  route: string
  weightKg: string
  phase: string
}

type DeterminantDraft = {
  id: string
  label: string
  value: string
  unit: string
  relationToDose: string
  source: string
  sampleDateTime: string
  sampleType: string
  interpretation: string
}

type FormState = {
  trigger: string
  centerId: string
  requesterId: string
  caseType: string
  priority: string
  urgencyContext: string
  responseDeadline: string
  entrySource: string
  patientCode: string
  age: string
  sex: string
  weightKg: string
  heightCm: string
  specialPopulation: string[]
  summary: string
  diagnosis: string
  phenotype: string
  activity: string
  currentDrug: string
  currentDose: string
  interval: string
  route: string
  treatmentStartDate: string
  regimenStartDate: string
  doses: DoseDraft[]
  previousTherapies: string
  adherence: string
  caseMode: string
  determinants: DeterminantDraft[]
}

const STEPS: Array<{ id: WizardStep; labelKey: string; helperKey: string }> = [
  { id: 'trigger', labelKey: 'step.trigger.label', helperKey: 'step.trigger.helper' },
  { id: 'patient', labelKey: 'step.patient.label', helperKey: 'step.patient.helper' },
  { id: 'therapy', labelKey: 'step.therapy.label', helperKey: 'step.therapy.helper' },
  { id: 'labs', labelKey: 'step.labs.label', helperKey: 'step.labs.helper' },
  { id: 'completeness', labelKey: 'step.completeness.label', helperKey: 'step.completeness.helper' },
  { id: 'submit', labelKey: 'step.submit.label', helperKey: 'step.submit.helper' },
]

const CASE_TYPES = [
  'Debutante',
  'Pérdida de respuesta',
  'Cambio de medicación',
  'Desintensificación',
  'Seguimiento PK/PD',
]

const PRIORITIES = ['Urgente', 'Alta', 'Media', 'Baja']
const ENTRY_SOURCES = ['Formulario normalizado', 'Correo electrónico', 'App móvil', 'Derivación interna']
const SPECIAL_POPULATION_OPTIONS = ['Oncológico', 'Geriátrico', 'Pediátrico', 'Inmunosuprimido', 'Transplante', 'Obesidad']
const DETERMINANT_SUGGESTIONS = ['Concentración sérica del fármaco', 'Anticuerpos anti-fármaco', 'PCR', 'Calprotectina fecal', 'Albúmina', 'Creatinina']

const inputCls =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#152520] outline-none transition placeholder:text-slate-400 focus:border-[#7b3fa0] focus:ring-2 focus:ring-[#7b3fa0]/15'

const textAreaCls = `${inputCls} resize-none`

function createDeterminant(label = ''): DeterminantDraft {
  return {
    id: `det-${Math.random().toString(36).slice(2, 9)}`,
    label,
    value: '',
    unit: '',
    relationToDose: '',
    source: 'Formulario',
    sampleDateTime: '',
    sampleType: '',
    interpretation: '',
  }
}

function createDose(): DoseDraft {
  return {
    id: `dose-${Math.random().toString(36).slice(2, 9)}`,
    administeredAt: '',
    doseAmount: '',
    unit: '',
    route: '',
    weightKg: '',
    phase: 'Mantenimiento',
  }
}

const DOSE_PHASES = ['Induccion', 'Mantenimiento']

function parseNumber(value: string) {
  const next = Number(value)
  return Number.isFinite(next) ? next : undefined
}

type AgentSuggestion = {
  id: string
  label: string
  detail: string
  kind: 'determinant' | 'warning' | 'history'
  actionLabel?: string
}

const DRUG_DETERMINANT_LIBRARY: Array<{
  match: RegExp
  labels: string[]
}> = [
  {
    match: /infliximab|adalimumab/i,
    labels: ['Concentración sérica del fármaco', 'Anticuerpos anti-fármaco', 'PCR', 'Calprotectina fecal', 'Albúmina'],
  },
  {
    match: /ustekinumab|vedolizumab/i,
    labels: ['Concentración sérica del fármaco', 'PCR', 'Calprotectina fecal', 'Albúmina'],
  },
  {
    match: /vancomicina|vancomycin/i,
    labels: ['Concentración sérica del fármaco', 'Creatinina', 'eGFR', 'Última administración'],
  },
]

function buildDeterminantSuggestions(form: FormState) {
  const labels = new Set<string>()
  const drug = form.currentDrug.trim()
  for (const item of DRUG_DETERMINANT_LIBRARY) {
    if (item.match.test(drug)) {
      item.labels.forEach((label) => labels.add(label))
    }
  }

  if (/pérdida de respuesta/i.test(form.caseType)) {
    labels.add('Calprotectina fecal')
    labels.add('PCR')
  }
  if (/desintensificación/i.test(form.caseType)) {
    labels.add('Concentración sérica del fármaco')
  }
  if (/debutante/i.test(form.caseType)) {
    labels.add('Albúmina')
    labels.add('PCR')
  }

  return Array.from(labels)
}

function buildTherapyWarnings(form: FormState) {
  const warnings: string[] = []
  const drug = form.currentDrug.trim().toLowerCase()
  const dose = form.currentDose.trim().toLowerCase()
  const interval = form.interval.trim().toLowerCase()

  if (!form.currentDrug.trim()) {
    warnings.push('El caso todavía no tiene fármaco principal informado.')
  }
  if (/infliximab|adalimumab|ustekinumab|vedolizumab/.test(drug) && !interval) {
    warnings.push('Conviene documentar el intervalo de administración antes de revisar el caso.')
  }
  if (/mg\/kg/.test(dose) && !form.weightKg.trim()) {
    warnings.push('La pauta está expresada en mg/kg y falta el peso actual del paciente.')
  }
  if (/infliximab/.test(drug) && /(12|16)\s*sem/.test(interval)) {
    warnings.push('El intervalo actual parece amplio para infliximab y merece validación humana.')
  }
  if (/pérdida de respuesta/i.test(form.caseType) && !form.summary.trim()) {
    warnings.push('Para pérdida de respuesta conviene resumir claramente el contexto clínico y analítico.')
  }
  return warnings
}

export function NuevoCasoWizard({
  onCancel,
  onCreated,
}: {
  onCancel: () => void
  onCreated: (caseId: string) => void
}) {
  const t = useXarxaT('nuevo-caso-wizard')
  const [stepIndex, setStepIndex] = useState(0)
  const [programs, setPrograms] = useState<Program[]>([])
  const [centers, setCenters] = useState<Center[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loadingRefs, setLoadingRefs] = useState(true)
  const [refsError, setRefsError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [patientHistory, setPatientHistory] = useState<PatientHistoryPayload | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [assistBusy, setAssistBusy] = useState(false)
  const [assistNotice, setAssistNotice] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({
    trigger: '',
    centerId: '',
    requesterId: '',
    caseType: '',
    priority: 'Media',
    urgencyContext: 'Ingresado',
    responseDeadline: '',
    entrySource: 'Formulario normalizado',
    patientCode: '',
    age: '',
    sex: '',
    weightKg: '',
    heightCm: '',
    specialPopulation: [],
    summary: '',
    diagnosis: '',
    phenotype: '',
    activity: '',
    currentDrug: '',
    currentDose: '',
    interval: '',
    route: '',
    treatmentStartDate: '',
    regimenStartDate: '',
    doses: [],
    previousTherapies: '',
    adherence: '',
    caseMode: 'Nuevo caso',
    determinants: [],
  })

  useEffect(() => {
    let cancelled = false

    async function loadRefs() {
      setLoadingRefs(true)
      setRefsError(null)

      try {
        const [directory, programsPayload] = await Promise.all([
          fetchJson<{ centers?: Center[]; professionals?: Professional[] }>('/api/xarxa/professionals'),
          fetchJson<{ items?: Program[] }>('/api/xarxa/programs'),
        ])

        if (cancelled) return

        const nextCenters = directory.centers ?? []
        const nextProfessionals = directory.professionals ?? []
        const nextPrograms = programsPayload.items ?? []

        setCenters(nextCenters)
        setProfessionals(nextProfessionals)
        setPrograms(nextPrograms)

      } catch (error) {
        if (cancelled) return
        setRefsError(error instanceof Error ? error.message : t('refs.error'))
      } finally {
        if (!cancelled) setLoadingRefs(false)
      }
    }

    void loadRefs()

    return () => {
      cancelled = true
    }
  }, [])

  const activeStep = STEPS[stepIndex]
  const selectedCenter = centers.find((item) => item._id === form.centerId)
  const selectedRequester = professionals.find((item) => item._id === form.requesterId)
  const activeProgram = programs.find((item) => item.status === 'Activo') ?? programs[0]

  const completeness = useMemo(() => {
    const missing: string[] = []
    const warnings: string[] = []

    if (!form.patientCode.trim()) missing.push('Código de paciente')
    if (!form.centerId) missing.push('Centro solicitante')
    if (!form.requesterId) missing.push('Profesional solicitante')
    if (!form.caseType) missing.push('Tipo de consulta')
    if (!form.currentDrug.trim()) missing.push('Fármaco actual o candidato')
    if (form.determinants.filter((item) => item.label.trim() && item.value.trim()).length === 0) {
      missing.push('Al menos un determinante PK/PD')
    }
    if (!form.weightKg.trim()) warnings.push('Falta peso actualizado')
    if (form.determinants.some((item) => item.label.trim() && !item.relationToDose.trim())) {
      warnings.push('Hay determinantes sin relación temporal con la dosis')
    }
    if (form.determinants.some((item) => item.label.trim() && item.value.trim() && !item.sampleDateTime.trim())) {
      warnings.push('Hay determinantes sin fecha y hora exacta de extracción')
    }
    if (form.doses.length > 0 && form.doses.every((item) => !item.administeredAt.trim())) {
      warnings.push('El historial de dosis administradas no tiene fechas')
    }
    if (!form.summary.trim()) warnings.push('Conviene resumir el motivo clínico de consulta')

    const score = Math.max(0, 100 - missing.length * 18 - warnings.length * 8)
    const suggestedStage = missing.length > 0 ? 'Datos incompletos' : 'Solicitud recibida'
    const suggestedNextAction =
      missing[0] ? `Completar ${missing[0].toLowerCase()}` : 'Revisión farmacéutica inicial'

    return { missing, warnings, score, suggestedStage, suggestedNextAction }
  }, [form])

  useEffect(() => {
    const patientCode = form.patientCode.trim()
    if (!patientCode || patientCode.length < 3) {
      setPatientHistory(null)
      setHistoryLoading(false)
      return
    }

    let cancelled = false
    setHistoryLoading(true)
    const timer = window.setTimeout(() => {
      fetchJson<PatientHistoryPayload>(`/api/xarxa/patients/${encodeURIComponent(patientCode)}/history`)
        .then((payload) => {
          if (!cancelled) setPatientHistory(payload)
        })
        .catch(() => {
          if (!cancelled) setPatientHistory(null)
        })
        .finally(() => {
          if (!cancelled) setHistoryLoading(false)
        })
    }, 350)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [form.patientCode])

  const suggestedDeterminants = useMemo(() => buildDeterminantSuggestions(form), [form])
  const therapyWarnings = useMemo(() => buildTherapyWarnings(form), [form])
  const missingSuggestedDeterminants = useMemo(() => {
    const currentLabels = new Set(form.determinants.map((item) => item.label.trim().toLowerCase()).filter(Boolean))
    return suggestedDeterminants.filter((label) => !currentLabels.has(label.toLowerCase()))
  }, [form.determinants, suggestedDeterminants])

  const agentSuggestions = useMemo<AgentSuggestion[]>(() => {
    const suggestions: AgentSuggestion[] = []

    missingSuggestedDeterminants.forEach((label) => {
      suggestions.push({
        id: `det-${label}`,
        label,
        detail: t('agent.det.detail'),
        kind: 'determinant',
        actionLabel: t('agent.add'),
      })
    })

    therapyWarnings.forEach((warning, index) => {
      suggestions.push({
        id: `warn-${index}`,
        label: warning,
        detail: t('agent.warning.detail'),
        kind: 'warning',
      })
    })

    if (patientHistory?.latestCase) {
      suggestions.push({
        id: 'history-latest',
        label: t('agent.history.label').replaceAll('{caseId}', patientHistory.latestCase.caseId),
        detail: t('agent.history.detail'),
        kind: 'history',
        actionLabel: t('agent.apply'),
      })
    }

    return suggestions
  }, [missingSuggestedDeterminants, patientHistory, therapyWarnings, t])

  function getStepErrors(step: WizardStep): string[] {
    if (step === 'trigger') {
      const errors: string[] = []
      if (!form.centerId) errors.push(t('error.centro'))
      if (!form.requesterId) errors.push(t('error.profesional'))
      if (!form.caseType) errors.push(t('error.tipoConsulta'))
      return errors
    }
    if (step === 'patient') {
      if (!form.patientCode.trim()) return [t('error.codigoPaciente')]
      return []
    }
    if (step === 'therapy') {
      if (!form.currentDrug.trim()) return [t('error.farmaco')]
      return []
    }
    if (step === 'labs') {
      const hasValid = form.determinants.some((d) => d.label.trim() && d.value.trim())
      if (!hasValid) return [t('error.determinante')]
      return []
    }
    return []
  }

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function setDeterminant(id: string, field: keyof DeterminantDraft, value: string) {
    setForm((current) => ({
      ...current,
      determinants: current.determinants.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }))
  }

  function addDeterminant(label = '') {
    setForm((current) => ({ ...current, determinants: [...current.determinants, createDeterminant(label)] }))
  }

  function removeDeterminant(id: string) {
    setForm((current) => ({
      ...current,
      determinants: current.determinants.filter((item) => item.id !== id),
    }))
  }

  function setDose(id: string, field: keyof DoseDraft, value: string) {
    setForm((current) => ({
      ...current,
      doses: current.doses.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }))
  }

  function addDose() {
    setForm((current) => ({ ...current, doses: [...current.doses, createDose()] }))
  }

  function removeDose(id: string) {
    setForm((current) => ({ ...current, doses: current.doses.filter((item) => item.id !== id) }))
  }

  function applyDeterminantSuggestion(label: string) {
    if (form.determinants.some((item) => item.label.trim().toLowerCase() === label.toLowerCase())) return
    addDeterminant(label)
    setAssistNotice(t('notice.det.added').replaceAll('{label}', label))
  }

  function applyAllDeterminantSuggestions() {
    if (missingSuggestedDeterminants.length === 0) return
    setAssistBusy(true)
    window.setTimeout(() => {
      setForm((current) => ({
        ...current,
        determinants: [
          ...current.determinants,
          ...missingSuggestedDeterminants.map((label) => createDeterminant(label)),
        ],
      }))
      setAssistBusy(false)
      setAssistNotice(t('notice.det.all').replaceAll('{count}', String(missingSuggestedDeterminants.length)))
    }, 850)
  }

  function applyPatientHistoryPrefill() {
    if (!patientHistory?.latestCase) return
    setAssistBusy(true)
    const latest = patientHistory.latestCase
    window.setTimeout(() => {
      setForm((current) => ({
        ...current,
        age: current.age || String(latest.patientProfile?.age ?? ''),
        sex: current.sex || String(latest.patientProfile?.sex ?? ''),
        weightKg: current.weightKg || String(latest.patientProfile?.weightKg ?? ''),
        heightCm: current.heightCm || String(latest.patientProfile?.heightCm ?? ''),
        specialPopulation:
          current.specialPopulation.length > 0
            ? current.specialPopulation
            : latest.patientProfile?.specialPopulation ?? [],
        summary: current.summary || latest.clinicalSummary || '',
        diagnosis: current.diagnosis || String(latest.diseaseContext?.diagnosis ?? ''),
        phenotype: current.phenotype || String(latest.diseaseContext?.phenotype ?? ''),
        activity: current.activity || String(latest.diseaseContext?.activity ?? ''),
        currentDrug: current.currentDrug || String(latest.therapyContext?.currentDrug ?? ''),
        currentDose: current.currentDose || String(latest.therapyContext?.currentDose ?? ''),
        interval: current.interval || String(latest.therapyContext?.interval ?? ''),
        route: current.route || String(latest.therapyContext?.route ?? ''),
        previousTherapies: current.previousTherapies || String(latest.therapyContext?.previousTherapies ?? ''),
        adherence: current.adherence || String(latest.therapyContext?.adherence ?? ''),
      }))
      setAssistBusy(false)
      setAssistNotice(t('notice.history.applied').replaceAll('{caseId}', latest.caseId))
    }, 950)
  }

  async function handleSubmit() {
    setSubmitting(true)
    setSubmitError(null)

    try {
      const payload = await fetchJson<{ caseId: string }>('/api/xarxa/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${form.caseType} · ${form.currentDrug || 'Caso PK/PD'}`,
          patientCode: form.patientCode.trim(),
          requesterId: form.requesterId,
          requesterName: selectedRequester?.name ?? 'No indicado',
          centerName: selectedCenter?.name ?? '',
          centerId: form.centerId,
          specialty: activeProgram?.specialty ?? 'Digestivo',
          caseType: form.caseType,
          priority: form.priority,
          urgencyTrack: form.priority === 'Urgente' ? 'Urgente' : 'Ordinario',
          urgencyContext: form.priority === 'Urgente' ? form.urgencyContext : null,
          responseDeadline:
            form.priority === 'Urgente' && form.responseDeadline
              ? new Date(form.responseDeadline).toISOString()
              : null,
          entrySource: form.entrySource,
          clinicalContext:
            form.summary.trim() ||
            `${form.trigger}. ${form.currentDrug ? `Fármaco actual: ${form.currentDrug}.` : ''}`,
          programId: activeProgram?._id ?? 'prog-crohn-pkpd',
          pipelineStage: completeness.suggestedStage,
          nextAction: completeness.suggestedNextAction,
          patientProfile: {
            age: parseNumber(form.age),
            sex: form.sex,
            weightKg: parseNumber(form.weightKg),
            heightCm: parseNumber(form.heightCm),
            specialPopulation: form.specialPopulation,
          },
          diseaseContext: {
            diagnosis: form.diagnosis,
            phenotype: form.phenotype,
            activity: form.activity,
            case_mode: form.caseMode,
          },
          therapyContext: {
            currentDrug: form.currentDrug,
            currentDose: form.currentDose || null,
            interval: form.interval || null,
            route: form.route || null,
            treatmentStartDate: form.treatmentStartDate || null,
            regimenStartDate: form.regimenStartDate || null,
            previousTherapies: form.previousTherapies || null,
            adherence: form.adherence || null,
          },
          doses: form.doses
            .filter((item) => item.administeredAt.trim() || item.doseAmount.trim())
            .map((item) => ({
              administeredAt: item.administeredAt ? new Date(item.administeredAt).toISOString() : null,
              doseAmount: item.doseAmount.trim() || null,
              unit: item.unit.trim() || null,
              route: item.route.trim() || null,
              weightKg: parseNumber(item.weightKg) ?? null,
              phase: item.phase,
            })),
          labDeterminants: form.determinants
            .filter((item) => item.label.trim())
            .map((item) => ({
              label: item.label.trim(),
              value: item.value.trim(),
              unit: item.unit.trim() || null,
              status: item.value.trim() ? 'Pendiente de validar' : 'Faltante',
              source: item.source.trim() || 'Formulario',
              relationToDose: item.relationToDose.trim() || null,
              sampleDateTime: item.sampleDateTime ? new Date(item.sampleDateTime).toISOString() : null,
              sampleType: item.sampleType.trim() || null,
              interpretation: item.interpretation.trim() || null,
            })),
          recommendation: {
            status: 'Borrador IA',
            text: 'Pendiente de revisión farmacéutica tras verificar completitud y relación con la dosis.',
          },
          clinicalNote: {
            status: 'Borrador',
            text: 'Caso creado desde el asistente estructurado. Pendiente de completar revisión farmacéutica.',
          },
        }),
      })

      onCreated(payload.caseId)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t('submit.error.fallback'))
      setSubmitting(false)
    }
  }

  if (loadingRefs) {
    return (
      <WorkspaceLoadingState
        title={t('state.loading.title')}
        detail={t('state.loading.detail')}
      />
    )
  }

  if (refsError) {
    return (
      <WorkspaceErrorState
        title={t('state.error.title')}
        detail={refsError}
        onRetry={() => window.location.reload()}
      />
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <button
              onClick={onCancel}
              className="mb-2 flex items-center gap-1.5 text-xs text-[#4a7068] hover:text-[#7b3fa0]"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {t('header.volver')}
            </button>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b3fa0]">{t('header.nuevoCaso')}</p>
            <h1 className="mt-1 text-2xl font-semibold text-[#152520]">{t('header.title')}</h1>
            <p className="mt-1 max-w-3xl text-sm text-[#4a7068]">
              {t('header.subtitle')}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-[#4a7068]">
            <p className="font-medium text-[#152520]">{activeProgram?.label ?? t('program.fallback')}</p>
            <p>{activeProgram?.specialty ?? t('specialty.fallback')} · {selectedCenter?.name ?? t('header.centroSinSeleccionar')}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {STEPS.map((step, index) => {
            const active = step.id === activeStep.id
            const done = index < stepIndex
            return (
              <div key={step.id} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
                    active
                      ? 'bg-[#7b3fa0] text-white'
                      : done
                        ? 'bg-[#faf6fd] text-[#7b3fa0]'
                        : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[11px]">
                    {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
                  </span>
                  {t(step.labelKey)}
                </div>
                {index < STEPS.length - 1 ? <div className="h-px w-4 bg-slate-200" /> : null}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_360px]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4a7068]">{t(activeStep.helperKey)}</p>
                <h2 className="mt-1 text-xl font-semibold text-[#152520]">{t(activeStep.labelKey)}</h2>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-[#4a7068]">
                {t('step.counter').replaceAll('{current}', String(stepIndex + 1)).replaceAll('{total}', String(STEPS.length))}
              </div>
            </div>

            {assistNotice ? (
              <div className="mb-5 rounded-2xl border border-[#7b3fa0]/20 bg-[#faf6fd] px-4 py-3 text-sm text-[#7b3fa0]">
                {assistNotice}
              </div>
            ) : null}

            {activeStep.id === 'trigger' ? (
              <div className="space-y-5">
                <Field label={t('trigger.label')}>
                  <textarea
                    className={textAreaCls}
                    rows={4}
                    value={form.trigger}
                    onChange={(event) => setField('trigger', event.target.value)}
                    placeholder={t('trigger.placeholder')}
                  />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label={t('field.centro')}>
                    <select className={inputCls} value={form.centerId} onChange={(event) => setField('centerId', event.target.value)}>
                      <option value="">{t('select.centro')}</option>
                      {centers.map((center) => (
                        <option key={center._id} value={center._id}>
                          {center.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t('field.profesional')}>
                    <select className={inputCls} value={form.requesterId} onChange={(event) => setField('requesterId', event.target.value)}>
                      <option value="">{t('select.profesional')}</option>
                      {professionals
                        .filter((item) => !form.centerId || item.centerId === form.centerId)
                        .map((professional) => (
                          <option key={professional._id} value={professional._id}>
                            {professional.name} · {professional.roleLabel}
                          </option>
                        ))}
                    </select>
                  </Field>
                  <Field label={t('field.tipoConsulta')}>
                    <select className={inputCls} value={form.caseType} onChange={(event) => setField('caseType', event.target.value)}>
                      <option value="">{t('select.tipo')}</option>
                      {CASE_TYPES.map((item) => (
                        <option key={item} value={item}>
                          {t(item)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t('field.prioridad')}>
                    <select className={inputCls} value={form.priority} onChange={(event) => setField('priority', event.target.value)}>
                      {PRIORITIES.map((item) => (
                        <option key={item} value={item}>
                          {t(item)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t('field.origen')}>
                    <select className={inputCls} value={form.entrySource} onChange={(event) => setField('entrySource', event.target.value)}>
                      {ENTRY_SOURCES.map((item) => (
                        <option key={item} value={item}>
                          {t(item)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t('field.modo')}>
                    <select className={inputCls} value={form.caseMode} onChange={(event) => setField('caseMode', event.target.value)}>
                      <option value="Nuevo caso">{t('Nuevo caso')}</option>
                      <option value="Seguimiento">{t('Seguimiento')}</option>
                    </select>
                  </Field>
                </div>

                {form.priority === 'Urgente' ? (
                  <div className="rounded-3xl border border-red-200 bg-red-50/70 p-5">
                    <p className="text-sm font-semibold text-red-800">{t('urgente.title')}</p>
                    <p className="mt-1 text-sm text-red-700">
                      {t('urgente.desc')}
                    </p>
                    <div className="mt-3 grid gap-4 md:grid-cols-2">
                      <Field label={t('urgente.situacion')}>
                        <select className={inputCls} value={form.urgencyContext} onChange={(event) => setField('urgencyContext', event.target.value)}>
                          <option value="Ingresado">{t('Ingresado')}</option>
                          <option value="Ambulatorio">{t('urgente.ambulatorio')}</option>
                        </select>
                      </Field>
                      <Field label={t('urgente.fechaLimite')}>
                        <input type="datetime-local" className={inputCls} value={form.responseDeadline} onChange={(event) => setField('responseDeadline', event.target.value)} />
                      </Field>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {activeStep.id === 'patient' ? (
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label={t('patient.codigo')}>
                    <input className={inputCls} value={form.patientCode} onChange={(event) => setField('patientCode', event.target.value)} placeholder="P-1048" />
                  </Field>
                  <Field label={t('patient.sexo')}>
                    <select className={inputCls} value={form.sex} onChange={(event) => setField('sex', event.target.value)}>
                      <option value="">{t('select.sexo')}</option>
                      <option value="Varón">{t('Varón')}</option>
                      <option value="Mujer">{t('Mujer')}</option>
                      <option value="No especificado">{t('No especificado')}</option>
                    </select>
                  </Field>
                  <Field label={t('patient.edad')}>
                    <input className={inputCls} value={form.age} onChange={(event) => setField('age', event.target.value)} placeholder="34" />
                  </Field>
                  <Field label={t('patient.peso')}>
                    <input className={inputCls} value={form.weightKg} onChange={(event) => setField('weightKg', event.target.value)} placeholder="71" />
                  </Field>
                  <Field label={t('patient.altura')}>
                    <input className={inputCls} value={form.heightCm} onChange={(event) => setField('heightCm', event.target.value)} placeholder="175" />
                  </Field>
                  <Field label={t('patient.actividad')}>
                    <input className={inputCls} value={form.activity} onChange={(event) => setField('activity', event.target.value)} placeholder={t('patient.actividad.placeholder')} />
                  </Field>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label={t('patient.diagnostico')}>
                    <input className={inputCls} value={form.diagnosis} onChange={(event) => setField('diagnosis', event.target.value)} />
                  </Field>
                  <Field label={t('patient.fenotipo')}>
                    <input className={inputCls} value={form.phenotype} onChange={(event) => setField('phenotype', event.target.value)} />
                  </Field>
                </div>
                <Field label={t('patient.resumen')}>
                  <textarea
                    className={textAreaCls}
                    rows={5}
                    value={form.summary}
                    onChange={(event) => setField('summary', event.target.value)}
                    placeholder={t('patient.resumen.placeholder')}
                  />
                </Field>
                <div>
                  <p className="mb-2 text-sm font-medium text-[#152520]">{t('patient.poblaciones')}</p>
                  <div className="flex flex-wrap gap-2">
                    {SPECIAL_POPULATION_OPTIONS.map((option) => {
                      const active = form.specialPopulation.includes(option)
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() =>
                            setField(
                              'specialPopulation',
                              active
                                ? form.specialPopulation.filter((item) => item !== option)
                                : [...form.specialPopulation, option],
                            )
                          }
                          className={`rounded-full border px-3 py-1.5 text-xs transition ${
                            active
                              ? 'border-[#7b3fa0]/30 bg-[#faf6fd] text-[#7b3fa0]'
                              : 'border-slate-200 bg-white text-[#4a7068]'
                          }`}
                        >
                          {t(option)}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : null}

            {activeStep.id === 'therapy' ? (
              <div className="space-y-5">
                {(missingSuggestedDeterminants.length > 0 || therapyWarnings.length > 0 || patientHistory?.latestCase) ? (
                  <div className="rounded-3xl border border-[#7b3fa0]/20 bg-[#faf6fd] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b3fa0]">{t('agent.title')}</p>
                        <p className="mt-1 text-sm text-[#4a7068]">
                          {t('agent.desc')}
                        </p>
                      </div>
                      <Bot className="h-5 w-5 text-[#7b3fa0]" />
                    </div>
                    <div className="mt-4 space-y-2">
                      {agentSuggestions.slice(0, 4).map((item) => (
                        <div key={item.id} className="rounded-2xl border border-white bg-white/85 px-4 py-3 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[#152520]">{item.kind === 'history' ? item.label : t(item.label)}</p>
                              <p className="mt-1 text-xs leading-6 text-[#4a7068]">{item.detail}</p>
                            </div>
                            {item.kind === 'determinant' ? (
                              <Button size="sm" variant="outline" className="shrink-0 rounded-xl text-xs" onClick={() => applyDeterminantSuggestion(item.label)}>
                                {t('agent.add')}
                              </Button>
                            ) : item.kind === 'history' ? (
                              <Button size="sm" variant="outline" className="shrink-0 rounded-xl text-xs" onClick={applyPatientHistoryPrefill}>
                                {t('agent.apply')}
                              </Button>
                            ) : (
                              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label={t('therapy.farmaco')}>
                    <input className={inputCls} value={form.currentDrug} onChange={(event) => setField('currentDrug', event.target.value)} placeholder="Infliximab" />
                  </Field>
                  <Field label={t('therapy.dosis')}>
                    <input className={inputCls} value={form.currentDose} onChange={(event) => setField('currentDose', event.target.value)} placeholder="5 mg/kg" />
                  </Field>
                  <Field label={t('therapy.intervalo')}>
                    <input className={inputCls} value={form.interval} onChange={(event) => setField('interval', event.target.value)} placeholder={t('therapy.intervalo.placeholder')} />
                  </Field>
                  <Field label={t('therapy.via')}>
                    <input className={inputCls} value={form.route} onChange={(event) => setField('route', event.target.value)} placeholder={t('therapy.via.placeholder')} />
                  </Field>
                  <Field label={t('therapy.inicioTratamiento')}>
                    <input type="date" className={inputCls} value={form.treatmentStartDate} onChange={(event) => setField('treatmentStartDate', event.target.value)} />
                  </Field>
                  <Field label={t('therapy.inicioPauta')}>
                    <input type="date" className={inputCls} value={form.regimenStartDate} onChange={(event) => setField('regimenStartDate', event.target.value)} />
                  </Field>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[#152520]">{t('doses.title')}</p>
                      <p className="text-sm text-[#4a7068]">{t('doses.subtitle')}</p>
                    </div>
                    <Button type="button" variant="outline" className="rounded-2xl text-sm" onClick={addDose}>
                      <Plus className="mr-2 h-4 w-4" />
                      {t('doses.add')}
                    </Button>
                  </div>
                  {form.doses.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-[#4a7068]">
                      {t('doses.empty')}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {form.doses.map((dose, index) => (
                        <div key={dose.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-sm font-semibold text-[#152520]">{t('doses.administracion').replaceAll('{n}', String(index + 1))}</p>
                            <button type="button" onClick={() => removeDose(dose.id)} className="text-xs text-red-600 hover:text-red-700">
                              {t('common.eliminar')}
                            </button>
                          </div>
                          <div className="grid gap-3 md:grid-cols-3">
                            <Field label={t('doses.fechaHora')}>
                              <input type="datetime-local" className={inputCls} value={dose.administeredAt} onChange={(event) => setDose(dose.id, 'administeredAt', event.target.value)} />
                            </Field>
                            <Field label={t('doses.dosis')}>
                              <input className={inputCls} value={dose.doseAmount} onChange={(event) => setDose(dose.id, 'doseAmount', event.target.value)} placeholder="5 mg/kg" />
                            </Field>
                            <Field label={t('common.unidad')}>
                              <input className={inputCls} value={dose.unit} onChange={(event) => setDose(dose.id, 'unit', event.target.value)} placeholder="mg" />
                            </Field>
                            <Field label={t('therapy.via')}>
                              <input className={inputCls} value={dose.route} onChange={(event) => setDose(dose.id, 'route', event.target.value)} placeholder="IV" />
                            </Field>
                            <Field label={t('doses.peso')}>
                              <input className={inputCls} value={dose.weightKg} onChange={(event) => setDose(dose.id, 'weightKg', event.target.value)} placeholder="71" />
                            </Field>
                            <Field label={t('doses.fase')}>
                              <select className={inputCls} value={dose.phase} onChange={(event) => setDose(dose.id, 'phase', event.target.value)}>
                                {DOSE_PHASES.map((phase) => (
                                  <option key={phase} value={phase}>{t(phase)}</option>
                                ))}
                              </select>
                            </Field>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Field label={t('therapy.previos')}>
                  <textarea
                    className={textAreaCls}
                    rows={4}
                    value={form.previousTherapies}
                    onChange={(event) => setField('previousTherapies', event.target.value)}
                    placeholder={t('therapy.previos.placeholder')}
                  />
                </Field>
                <Field label={t('therapy.adherencia')}>
                  <textarea
                    className={textAreaCls}
                    rows={3}
                    value={form.adherence}
                    onChange={(event) => setField('adherence', event.target.value)}
                    placeholder={t('therapy.adherencia.placeholder')}
                  />
                </Field>
              </div>
            ) : null}

            {activeStep.id === 'labs' ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#152520]">{t('labs.title')}</p>
                    <p className="text-sm text-[#4a7068]">{t('labs.subtitle')}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {DETERMINANT_SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => addDeterminant(suggestion)}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-[#4a7068] hover:border-[#7b3fa0]/30 hover:bg-[#faf6fd] hover:text-[#7b3fa0]"
                      >
                        + {t(suggestion)}
                      </button>
                    ))}
                    {missingSuggestedDeterminants.length > 0 ? (
                      <Button type="button" variant="outline" className="rounded-full text-xs" onClick={applyAllDeterminantSuggestions} disabled={assistBusy}>
                        {assistBusy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
                        {t('labs.aplicarSugerencias')}
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-4">
                  {form.determinants.map((determinant, index) => (
                    <div key={determinant.id} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-semibold text-[#152520]">{t('labs.determinante.n').replaceAll('{n}', String(index + 1))}</p>
                        {form.determinants.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeDeterminant(determinant.id)}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            {t('common.eliminar')}
                          </button>
                        ) : null}
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field label={t('labs.nombre')}>
                          <input className={inputCls} value={determinant.label} onChange={(event) => setDeterminant(determinant.id, 'label', event.target.value)} />
                        </Field>
                        <Field label={t('labs.valor')}>
                          <input className={inputCls} value={determinant.value} onChange={(event) => setDeterminant(determinant.id, 'value', event.target.value)} placeholder="1.8" />
                        </Field>
                        <Field label={t('common.unidad')}>
                          <input className={inputCls} value={determinant.unit} onChange={(event) => setDeterminant(determinant.id, 'unit', event.target.value)} placeholder="µg/mL" />
                        </Field>
                        <Field label={t('labs.relacion')}>
                          <input className={inputCls} value={determinant.relationToDose} onChange={(event) => setDeterminant(determinant.id, 'relationToDose', event.target.value)} placeholder={t('labs.relacion.placeholder')} />
                        </Field>
                        <Field label={t('labs.fechaExtraccion')}>
                          <input type="datetime-local" className={inputCls} value={determinant.sampleDateTime} onChange={(event) => setDeterminant(determinant.id, 'sampleDateTime', event.target.value)} />
                        </Field>
                        <Field label={t('labs.tipoMuestra')}>
                          <select className={inputCls} value={determinant.sampleType} onChange={(event) => setDeterminant(determinant.id, 'sampleType', event.target.value)}>
                            <option value="">{t('labs.pendienteIndicar')}</option>
                            {SAMPLE_TYPES.map((sampleType) => (
                              <option key={sampleType} value={sampleType}>{sampleType}</option>
                            ))}
                          </select>
                        </Field>
                        <Field label={t('labs.fuente')}>
                          <input className={inputCls} value={determinant.source} onChange={(event) => setDeterminant(determinant.id, 'source', event.target.value)} placeholder={t('labs.fuente.placeholder')} />
                        </Field>
                        <Field label={t('labs.interpretacion')}>
                          <input className={inputCls} value={determinant.interpretation} onChange={(event) => setDeterminant(determinant.id, 'interpretation', event.target.value)} placeholder={t('labs.interpretacion.placeholder')} />
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>

                <Button type="button" variant="outline" className="rounded-2xl text-sm" onClick={() => addDeterminant()}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('labs.addOtro')}
                </Button>
              </div>
            ) : null}

            {activeStep.id === 'completeness' ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <MetricCard label={t('comp.metric.completitud')} value={`${completeness.score}%`} />
                  <MetricCard label={t('comp.metric.bloqueantes')} value={String(completeness.missing.length)} />
                  <MetricCard label={t('comp.metric.advertencias')} value={String(completeness.warnings.length)} />
                </div>
                <div className="grid gap-5 xl:grid-cols-2">
                  <StatusList
                    title={t('comp.faltan')}
                    icon={AlertCircle}
                    color="red"
                    items={completeness.missing.map((item) => t(item))}
                    emptyLabel={t('comp.noBloqueos')}
                  />
                  <StatusList
                    title={t('comp.advertenciasOp')}
                    icon={Sparkles}
                    color="amber"
                    items={completeness.warnings.map((item) => t(item))}
                    emptyLabel={t('comp.noAdvertencias')}
                  />
                </div>
                <div className="rounded-3xl border border-[#7b3fa0]/20 bg-[#faf6fd] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4a7068]">{t('comp.sugerencia')}</p>
                  <p className="mt-2 text-base font-semibold text-[#152520]">{t('comp.estadoInicial').replaceAll('{stage}', t(completeness.suggestedStage))}</p>
                  <p className="mt-1 text-sm text-[#4a7068]">{t('comp.siguientePaso').replaceAll('{action}', t(completeness.suggestedNextAction))}</p>
                </div>
              </div>
            ) : null}

            {activeStep.id === 'submit' ? (
              <div className="space-y-6">
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4a7068]">{t('submit.resumen')}</p>
                    <h3 className="mt-2 text-lg font-semibold text-[#152520]">
                      {form.caseType ? t(form.caseType) : t('submit.tipoPendiente')} · {form.currentDrug || t('submit.farmacoPendiente')}
                    </h3>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <SummaryLine label={t('submit.paciente')} value={form.patientCode || t('common.pendiente')} />
                      <SummaryLine label={t('submit.centro')} value={selectedCenter?.name ?? t('common.pendiente')} />
                      <SummaryLine label={t('submit.solicitante')} value={selectedRequester?.name ?? t('common.pendiente')} />
                      <SummaryLine label={t('submit.prioridad')} value={t(form.priority)} />
                      <SummaryLine label={t('submit.determinantesValor')} value={String(form.determinants.filter((item) => item.label && item.value).length)} />
                      <SummaryLine label={t('submit.estadoInicial')} value={t(completeness.suggestedStage)} />
                    </div>
                    <p className="mt-4 text-sm leading-6 text-[#4a7068]">{form.summary || form.trigger}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4a7068]">{t('submit.resultado')}</p>
                    <ul className="mt-3 space-y-2 text-sm text-[#152520]">
                      <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-[#7b3fa0]" /> {t('submit.res1')}</li>
                      <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-[#7b3fa0]" /> {t('submit.res2')}</li>
                      <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-[#7b3fa0]" /> {t('submit.res3')}</li>
                    </ul>
                  </div>
                </div>
                {submitError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {submitError}
                  </div>
                ) : null}
              </div>
            ) : null}

            {(() => {
              const stepErrors = activeStep ? getStepErrors(activeStep.id) : []
              return stepErrors.length > 0 ? (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
                  {stepErrors[0]}
                </div>
              ) : null
            })()}
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
              <Button type="button" variant="outline" className="rounded-2xl text-sm" onClick={stepIndex === 0 ? onCancel : () => setStepIndex((value) => value - 1)}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                {stepIndex === 0 ? t('submit.cancelar') : t('submit.anterior')}
              </Button>
              <div className="flex gap-2">
                {stepIndex < STEPS.length - 1 ? (
                  <Button
                    type="button"
                    className="rounded-2xl bg-[#7b3fa0] text-sm text-white hover:bg-[#6a3490] disabled:opacity-50"
                    disabled={activeStep ? getStepErrors(activeStep.id).length > 0 : false}
                    onClick={() => setStepIndex((value) => value + 1)}
                  >
                    {t('submit.continuar')}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="button" className="rounded-2xl bg-[#7b3fa0] text-sm text-white hover:bg-[#6a3490]" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    {t('submit.crear')}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-[#7b3fa0]" />
                <p className="text-sm font-semibold text-[#152520]">{t('aside.ficha')}</p>
              </div>
              <div className="mt-4 space-y-3">
                <SummaryLine label={t('aside.programa')} value={activeProgram?.label ?? t('program.fallback')} />
                <SummaryLine label={t('aside.tipo')} value={form.caseType ? t(form.caseType) : t('common.pendiente')} />
                <SummaryLine label={t('submit.paciente')} value={form.patientCode || t('common.pendiente')} />
                <SummaryLine label={t('aside.farmaco')} value={form.currentDrug || t('common.pendiente')} />
                <SummaryLine label={t('submit.prioridad')} value={t(form.priority)} />
                <SummaryLine label={t('aside.determinantes')} value={String(form.determinants.filter((item) => item.label).length)} />
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-[#7b3fa0]" />
                <p className="text-sm font-semibold text-[#152520]">{t('aside.completitudViva')}</p>
              </div>
              <div className="mt-4 rounded-2xl border border-[#7b3fa0]/20 bg-[#faf6fd] px-4 py-3">
                <p className="text-2xl font-semibold text-[#152520]">{completeness.score}%</p>
                <p className="mt-1 text-sm text-[#4a7068]">{t('aside.recalcula')}</p>
              </div>
              <div className="mt-4 space-y-2">
                <InlineStatus label={t('aside.bloqueos')} value={String(completeness.missing.length)} tone="red" />
                <InlineStatus label={t('comp.metric.advertencias')} value={String(completeness.warnings.length)} tone="amber" />
                <InlineStatus label={t('aside.siguientePaso')} value={t(completeness.suggestedNextAction)} tone="teal" />
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-[#7b3fa0]" />
                <p className="text-sm font-semibold text-[#152520]">{t('aside.agentes')}</p>
              </div>
              {assistBusy || historyLoading ? (
                <div className="mt-4 space-y-2">
                  {[
                    'aside.busy1',
                    'aside.busy2',
                    'aside.busy3',
                  ].map((step, index) => (
                    <div key={step} className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-[#faf6fd] px-3 py-2 text-xs text-[#7b3fa0]">
                      {index === 1 ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Clock3 className="h-3.5 w-3.5" />}
                      <span>{t(step)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="mt-4 space-y-2">
                    <InlineStatus label={t('aside.sugerencias')} value={String(agentSuggestions.length)} tone="teal" />
                    <InlineStatus label={t('aside.detPropuestos')} value={String(missingSuggestedDeterminants.length)} tone="amber" />
                    <InlineStatus label={t('aside.warningsPauta')} value={String(therapyWarnings.length)} tone={therapyWarnings.length > 0 ? 'red' : 'teal'} />
                  </div>

                  {patientHistory?.items?.length ? (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4a7068]">{t('aside.historial')}</p>
                      <p className="mt-1 text-sm font-semibold text-[#152520]">{patientHistory.patientCode}</p>
                      <div className="mt-3 space-y-2">
                        {patientHistory.items.slice(0, 3).map((item) => (
                          <div key={item.caseId} className="rounded-2xl bg-white px-3 py-2 text-xs shadow-sm">
                            <p className="font-semibold text-[#152520]">{item.caseId}</p>
                            <p className="mt-0.5 text-[#4a7068]">{item.title}</p>
                            <p className="mt-1 text-slate-400">{item.pipelineStage} · {item.centerName}</p>
                          </div>
                        ))}
                      </div>
                      <Button size="sm" variant="outline" className="mt-3 w-full rounded-xl text-xs" onClick={applyPatientHistoryPrefill}>
                        {t('aside.reutilizar')}
                      </Button>
                    </div>
                  ) : form.patientCode.trim().length >= 3 ? (
                    <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-[#4a7068]">
                      {t('aside.sinCasos')}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#152520]">{label}</label>
      {children}
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.16em] text-[#4a7068]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#152520]">{value}</p>
    </div>
  )
}

function StatusList({
  title,
  icon: Icon,
  color,
  items,
  emptyLabel,
}: {
  title: string
  icon: React.ElementType
  color: 'red' | 'amber'
  items: string[]
  emptyLabel: string
}) {
  const tone =
    color === 'red'
      ? 'border-red-200 bg-red-50/60 text-red-800'
      : 'border-amber-200 bg-amber-50/60 text-amber-800'

  return (
    <div className={`rounded-3xl border p-5 ${tone}`}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <p className="text-sm font-semibold">{title}</p>
      </div>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm">
          {items.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm">{emptyLabel}</p>
      )}
    </div>
  )
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 text-sm last:border-b-0 last:pb-0">
      <span className="text-[#4a7068]">{label}</span>
      <span className="text-right font-medium text-[#152520]">{value}</span>
    </div>
  )
}

function InlineStatus({ label, value, tone }: { label: string; value: string; tone: 'red' | 'amber' | 'teal' }) {
  const cls =
    tone === 'red'
      ? 'bg-red-50 text-red-700'
      : tone === 'amber'
        ? 'bg-amber-50 text-amber-700'
        : 'bg-[#faf6fd] text-[#7b3fa0]'

  return (
    <div className={`rounded-2xl px-3 py-2 text-sm ${cls}`}>
      <span className="font-medium">{label}:</span> {value}
    </div>
  )
}
