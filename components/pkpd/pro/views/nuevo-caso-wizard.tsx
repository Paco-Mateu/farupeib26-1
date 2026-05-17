'use client'

import { AlertCircle, Bot, CheckCircle2, ChevronLeft, ChevronRight, Clock3, FlaskConical, Loader2, Plus, Sparkles, Stethoscope, TriangleAlert } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import type { Center, PatientHistoryPayload, Professional, Program } from '@/components/pkpd/pro/xarxa-types'
import { WorkspaceErrorState, WorkspaceLoadingState } from '@/components/pkpd/pro/workspace-state'
import { Button } from '@/components/ui/button'
import { fetchJson } from '@/lib/fetch-json'

type WizardStep = 'trigger' | 'patient' | 'therapy' | 'labs' | 'completeness' | 'submit'

type DeterminantDraft = {
  id: string
  label: string
  value: string
  unit: string
  relationToDose: string
  source: string
  interpretation: string
}

type FormState = {
  trigger: string
  centerId: string
  requesterId: string
  caseType: string
  priority: string
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
  previousTherapies: string
  adherence: string
  caseMode: string
  determinants: DeterminantDraft[]
}

const STEPS: Array<{ id: WizardStep; label: string; helper: string }> = [
  { id: 'trigger', label: 'Trigger', helper: 'Entrada clínica y prioridad' },
  { id: 'patient', label: 'Paciente', helper: 'Demografía sintética y contexto' },
  { id: 'therapy', label: 'Tratamiento', helper: 'Medicaciones y objetivo clínico' },
  { id: 'labs', label: 'Determinantes', helper: 'Laboratorio y relación con dosis' },
  { id: 'completeness', label: 'Completitud', helper: 'Gaps y siguiente paso sugerido' },
  { id: 'submit', label: 'Enviar', helper: 'Creación del caso estructurado' },
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
    interpretation: '',
  }
}

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
        setRefsError(error instanceof Error ? error.message : 'No se han podido cargar los datos de referencia.')
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
        detail: 'Determinante sugerido por Agentes para este fármaco y tipo de caso.',
        kind: 'determinant',
        actionLabel: 'Añadir',
      })
    })

    therapyWarnings.forEach((warning, index) => {
      suggestions.push({
        id: `warn-${index}`,
        label: warning,
        detail: 'Conviene revisarlo antes de enviar el caso a la cola operativa.',
        kind: 'warning',
      })
    })

    if (patientHistory?.latestCase) {
      suggestions.push({
        id: 'history-latest',
        label: `Reutilizar contexto del último caso ${patientHistory.latestCase.caseId}`,
        detail: 'Edad, diagnóstico, pauta y antecedentes del mismo paciente pueden reaprovecharse como punto de partida.',
        kind: 'history',
        actionLabel: 'Aplicar',
      })
    }

    return suggestions
  }, [missingSuggestedDeterminants, patientHistory, therapyWarnings])

  function getStepErrors(step: WizardStep): string[] {
    if (step === 'trigger') {
      const errors: string[] = []
      if (!form.centerId) errors.push('Selecciona un centro solicitante')
      if (!form.requesterId) errors.push('Selecciona un profesional solicitante')
      if (!form.caseType) errors.push('Selecciona el tipo de consulta')
      return errors
    }
    if (step === 'patient') {
      if (!form.patientCode.trim()) return ['El código de paciente es obligatorio']
      return []
    }
    if (step === 'therapy') {
      if (!form.currentDrug.trim()) return ['Indica el fármaco actual o candidato']
      return []
    }
    if (step === 'labs') {
      const hasValid = form.determinants.some((d) => d.label.trim() && d.value.trim())
      if (!hasValid) return ['Añade al menos un determinante con etiqueta y valor']
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

  function applyDeterminantSuggestion(label: string) {
    if (form.determinants.some((item) => item.label.trim().toLowerCase() === label.toLowerCase())) return
    addDeterminant(label)
    setAssistNotice(`Se ha añadido «${label}» como determinante sugerido por Agentes.`)
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
      setAssistNotice(`Los Agentes han añadido ${missingSuggestedDeterminants.length} determinante(s) sugerido(s).`)
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
      setAssistNotice(`Se ha reutilizado el contexto del caso ${latest.caseId} como base de trabajo.`)
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
            previousTherapies: form.previousTherapies || null,
            adherence: form.adherence || null,
          },
          labDeterminants: form.determinants
            .filter((item) => item.label.trim())
            .map((item) => ({
              label: item.label.trim(),
              value: item.value.trim(),
              unit: item.unit.trim() || null,
              status: item.value.trim() ? 'Pendiente de validar' : 'Faltante',
              source: item.source.trim() || 'Formulario',
              relationToDose: item.relationToDose.trim() || null,
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
      setSubmitError(error instanceof Error ? error.message : 'No se ha podido crear el caso.')
      setSubmitting(false)
    }
  }

  if (loadingRefs) {
    return (
      <WorkspaceLoadingState
        title="Preparando el asistente de nuevo caso…"
        detail="Cargando centros, profesionales y programa clínico activo."
      />
    )
  }

  if (refsError) {
    return (
      <WorkspaceErrorState
        title="No se ha podido abrir el asistente."
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
              Volver a la cola de casos
            </button>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b3fa0]">Nuevo caso</p>
            <h1 className="mt-1 text-2xl font-semibold text-[#152520]">Alta estructurada con revisión humana</h1>
            <p className="mt-1 max-w-3xl text-sm text-[#4a7068]">
              Captura clínica ampliada para que el caso nazca con contexto útil, determinantes claros y un siguiente paso gobernado.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-[#4a7068]">
            <p className="font-medium text-[#152520]">{activeProgram?.label ?? 'Crohn PK/PD'}</p>
            <p>{activeProgram?.specialty ?? 'Digestivo'} · {selectedCenter?.name ?? 'Centro sin seleccionar'}</p>
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
                  {step.label}
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
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4a7068]">{activeStep.helper}</p>
                <h2 className="mt-1 text-xl font-semibold text-[#152520]">{activeStep.label}</h2>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-[#4a7068]">
                Paso {stepIndex + 1} de {STEPS.length}
              </div>
            </div>

            {assistNotice ? (
              <div className="mb-5 rounded-2xl border border-[#7b3fa0]/20 bg-[#faf6fd] px-4 py-3 text-sm text-[#7b3fa0]">
                {assistNotice}
              </div>
            ) : null}

            {activeStep.id === 'trigger' ? (
              <div className="space-y-5">
                <Field label="Motivo o trigger principal">
                  <textarea
                    className={textAreaCls}
                    rows={4}
                    value={form.trigger}
                    onChange={(event) => setField('trigger', event.target.value)}
                    placeholder="Ejemplo: pérdida de respuesta secundaria con sospecha de baja exposición y biomarcadores elevados."
                  />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Centro solicitante">
                    <select className={inputCls} value={form.centerId} onChange={(event) => setField('centerId', event.target.value)}>
                      <option value="">Seleccionar centro…</option>
                      {centers.map((center) => (
                        <option key={center._id} value={center._id}>
                          {center.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Profesional solicitante">
                    <select className={inputCls} value={form.requesterId} onChange={(event) => setField('requesterId', event.target.value)}>
                      <option value="">Seleccionar profesional…</option>
                      {professionals
                        .filter((item) => !form.centerId || item.centerId === form.centerId)
                        .map((professional) => (
                          <option key={professional._id} value={professional._id}>
                            {professional.name} · {professional.roleLabel}
                          </option>
                        ))}
                    </select>
                  </Field>
                  <Field label="Tipo de consulta">
                    <select className={inputCls} value={form.caseType} onChange={(event) => setField('caseType', event.target.value)}>
                      <option value="">Seleccionar tipo…</option>
                      {CASE_TYPES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Prioridad">
                    <select className={inputCls} value={form.priority} onChange={(event) => setField('priority', event.target.value)}>
                      {PRIORITIES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Origen de la solicitud">
                    <select className={inputCls} value={form.entrySource} onChange={(event) => setField('entrySource', event.target.value)}>
                      {ENTRY_SOURCES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Modo del caso">
                    <select className={inputCls} value={form.caseMode} onChange={(event) => setField('caseMode', event.target.value)}>
                      <option value="Nuevo caso">Nuevo caso</option>
                      <option value="Seguimiento">Seguimiento</option>
                    </select>
                  </Field>
                </div>
              </div>
            ) : null}

            {activeStep.id === 'patient' ? (
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Código de paciente">
                    <input className={inputCls} value={form.patientCode} onChange={(event) => setField('patientCode', event.target.value)} placeholder="P-1048" />
                  </Field>
                  <Field label="Sexo">
                    <select className={inputCls} value={form.sex} onChange={(event) => setField('sex', event.target.value)}>
                      <option value="">Seleccionar…</option>
                      <option>Varón</option>
                      <option>Mujer</option>
                      <option>No especificado</option>
                    </select>
                  </Field>
                  <Field label="Edad">
                    <input className={inputCls} value={form.age} onChange={(event) => setField('age', event.target.value)} placeholder="34" />
                  </Field>
                  <Field label="Peso actual (kg)">
                    <input className={inputCls} value={form.weightKg} onChange={(event) => setField('weightKg', event.target.value)} placeholder="71" />
                  </Field>
                  <Field label="Altura (cm)">
                    <input className={inputCls} value={form.heightCm} onChange={(event) => setField('heightCm', event.target.value)} placeholder="175" />
                  </Field>
                  <Field label="Actividad clínica">
                    <input className={inputCls} value={form.activity} onChange={(event) => setField('activity', event.target.value)} placeholder="Moderada" />
                  </Field>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Diagnóstico">
                    <input className={inputCls} value={form.diagnosis} onChange={(event) => setField('diagnosis', event.target.value)} />
                  </Field>
                  <Field label="Fenotipo">
                    <input className={inputCls} value={form.phenotype} onChange={(event) => setField('phenotype', event.target.value)} />
                  </Field>
                </div>
                <Field label="Resumen clínico para el caso">
                  <textarea
                    className={textAreaCls}
                    rows={5}
                    value={form.summary}
                    onChange={(event) => setField('summary', event.target.value)}
                    placeholder="Resume aquí el motivo de consulta, biomarcadores, sospecha clínica y contexto relevante."
                  />
                </Field>
                <div>
                  <p className="mb-2 text-sm font-medium text-[#152520]">Poblaciones especiales</p>
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
                          {option}
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
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b3fa0]">Asistencia de Agentes</p>
                        <p className="mt-1 text-sm text-[#4a7068]">
                          Los Agentes están proponiendo contexto, determinantes y señales de revisión para este tratamiento.
                        </p>
                      </div>
                      <Bot className="h-5 w-5 text-[#7b3fa0]" />
                    </div>
                    <div className="mt-4 space-y-2">
                      {agentSuggestions.slice(0, 4).map((item) => (
                        <div key={item.id} className="rounded-2xl border border-white bg-white/85 px-4 py-3 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[#152520]">{item.label}</p>
                              <p className="mt-1 text-xs leading-6 text-[#4a7068]">{item.detail}</p>
                            </div>
                            {item.kind === 'determinant' ? (
                              <Button size="sm" variant="outline" className="shrink-0 rounded-xl text-xs" onClick={() => applyDeterminantSuggestion(item.label)}>
                                Añadir
                              </Button>
                            ) : item.kind === 'history' ? (
                              <Button size="sm" variant="outline" className="shrink-0 rounded-xl text-xs" onClick={applyPatientHistoryPrefill}>
                                Aplicar
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
                  <Field label="Fármaco actual o candidato">
                    <input className={inputCls} value={form.currentDrug} onChange={(event) => setField('currentDrug', event.target.value)} placeholder="Infliximab" />
                  </Field>
                  <Field label="Dosis actual">
                    <input className={inputCls} value={form.currentDose} onChange={(event) => setField('currentDose', event.target.value)} placeholder="5 mg/kg" />
                  </Field>
                  <Field label="Intervalo">
                    <input className={inputCls} value={form.interval} onChange={(event) => setField('interval', event.target.value)} placeholder="Cada 8 semanas" />
                  </Field>
                  <Field label="Vía de administración">
                    <input className={inputCls} value={form.route} onChange={(event) => setField('route', event.target.value)} placeholder="Intravenosa" />
                  </Field>
                </div>
                <Field label="Tratamientos previos">
                  <textarea
                    className={textAreaCls}
                    rows={4}
                    value={form.previousTherapies}
                    onChange={(event) => setField('previousTherapies', event.target.value)}
                    placeholder="Ejemplo: corticoides, adalimumab, azatioprina."
                  />
                </Field>
                <Field label="Adherencia referida">
                  <textarea
                    className={textAreaCls}
                    rows={3}
                    value={form.adherence}
                    onChange={(event) => setField('adherence', event.target.value)}
                    placeholder="Describe si la adherencia está confirmada, dudosa o pendiente."
                  />
                </Field>
              </div>
            ) : null}

            {activeStep.id === 'labs' ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#152520]">Determinantes PK/PD</p>
                    <p className="text-sm text-[#4a7068]">Añade valores y relación temporal con la dosis para que el caso sea interpretable.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {DETERMINANT_SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => addDeterminant(suggestion)}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-[#4a7068] hover:border-[#7b3fa0]/30 hover:bg-[#faf6fd] hover:text-[#7b3fa0]"
                      >
                        + {suggestion}
                      </button>
                    ))}
                    {missingSuggestedDeterminants.length > 0 ? (
                      <Button type="button" variant="outline" className="rounded-full text-xs" onClick={applyAllDeterminantSuggestions} disabled={assistBusy}>
                        {assistBusy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
                        Aplicar sugerencias de Agentes
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-4">
                  {form.determinants.map((determinant, index) => (
                    <div key={determinant.id} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-semibold text-[#152520]">Determinante {index + 1}</p>
                        {form.determinants.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeDeterminant(determinant.id)}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            Eliminar
                          </button>
                        ) : null}
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Nombre">
                          <input className={inputCls} value={determinant.label} onChange={(event) => setDeterminant(determinant.id, 'label', event.target.value)} />
                        </Field>
                        <Field label="Valor">
                          <input className={inputCls} value={determinant.value} onChange={(event) => setDeterminant(determinant.id, 'value', event.target.value)} placeholder="1.8" />
                        </Field>
                        <Field label="Unidad">
                          <input className={inputCls} value={determinant.unit} onChange={(event) => setDeterminant(determinant.id, 'unit', event.target.value)} placeholder="µg/mL" />
                        </Field>
                        <Field label="Relación con la dosis">
                          <input className={inputCls} value={determinant.relationToDose} onChange={(event) => setDeterminant(determinant.id, 'relationToDose', event.target.value)} placeholder="Valle confirmado" />
                        </Field>
                        <Field label="Fuente">
                          <input className={inputCls} value={determinant.source} onChange={(event) => setDeterminant(determinant.id, 'source', event.target.value)} placeholder="Laboratorio" />
                        </Field>
                        <Field label="Interpretación preliminar">
                          <input className={inputCls} value={determinant.interpretation} onChange={(event) => setDeterminant(determinant.id, 'interpretation', event.target.value)} placeholder="Baja exposición" />
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>

                <Button type="button" variant="outline" className="rounded-2xl text-sm" onClick={() => addDeterminant()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Añadir otro determinante
                </Button>
              </div>
            ) : null}

            {activeStep.id === 'completeness' ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <MetricCard label="Completitud" value={`${completeness.score}%`} />
                  <MetricCard label="Campos bloqueantes" value={String(completeness.missing.length)} />
                  <MetricCard label="Advertencias" value={String(completeness.warnings.length)} />
                </div>
                <div className="grid gap-5 xl:grid-cols-2">
                  <StatusList
                    title="Faltan datos obligatorios"
                    icon={AlertCircle}
                    color="red"
                    items={completeness.missing}
                    emptyLabel="No hay bloqueos críticos."
                  />
                  <StatusList
                    title="Advertencias operativas"
                    icon={Sparkles}
                    color="amber"
                    items={completeness.warnings}
                    emptyLabel="No se han detectado advertencias."
                  />
                </div>
                <div className="rounded-3xl border border-[#7b3fa0]/20 bg-[#faf6fd] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4a7068]">Sugerencia del sistema</p>
                  <p className="mt-2 text-base font-semibold text-[#152520]">Estado inicial sugerido: {completeness.suggestedStage}</p>
                  <p className="mt-1 text-sm text-[#4a7068]">Siguiente paso sugerido: {completeness.suggestedNextAction}</p>
                </div>
              </div>
            ) : null}

            {activeStep.id === 'submit' ? (
              <div className="space-y-6">
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4a7068]">Resumen de alta</p>
                    <h3 className="mt-2 text-lg font-semibold text-[#152520]">
                      {form.caseType || 'Tipo pendiente'} · {form.currentDrug || 'Fármaco pendiente'}
                    </h3>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <SummaryLine label="Paciente" value={form.patientCode || 'Pendiente'} />
                      <SummaryLine label="Centro" value={selectedCenter?.name ?? 'Pendiente'} />
                      <SummaryLine label="Solicitante" value={selectedRequester?.name ?? 'Pendiente'} />
                      <SummaryLine label="Prioridad" value={form.priority} />
                      <SummaryLine label="Determinantes con valor" value={String(form.determinants.filter((item) => item.label && item.value).length)} />
                      <SummaryLine label="Estado inicial" value={completeness.suggestedStage} />
                    </div>
                    <p className="mt-4 text-sm leading-6 text-[#4a7068]">{form.summary || form.trigger}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4a7068]">Resultado esperado</p>
                    <ul className="mt-3 space-y-2 text-sm text-[#152520]">
                      <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-[#7b3fa0]" /> Caso estructurado listo para la cola operativa.</li>
                      <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-[#7b3fa0]" /> Gaps iniciales detectados y siguiente paso sugerido.</li>
                      <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-[#7b3fa0]" /> Datos clínicos visibles al abrir el Case Cockpit.</li>
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
                {stepIndex === 0 ? 'Cancelar' : 'Anterior'}
              </Button>
              <div className="flex gap-2">
                {stepIndex < STEPS.length - 1 ? (
                  <Button
                    type="button"
                    className="rounded-2xl bg-[#7b3fa0] text-sm text-white hover:bg-[#6a3490] disabled:opacity-50"
                    disabled={activeStep ? getStepErrors(activeStep.id).length > 0 : false}
                    onClick={() => setStepIndex((value) => value + 1)}
                  >
                    Continuar
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="button" className="rounded-2xl bg-[#7b3fa0] text-sm text-white hover:bg-[#6a3490]" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Crear caso estructurado
                  </Button>
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-[#7b3fa0]" />
                <p className="text-sm font-semibold text-[#152520]">Ficha rápida del caso</p>
              </div>
              <div className="mt-4 space-y-3">
                <SummaryLine label="Programa" value={activeProgram?.label ?? 'Crohn PK/PD'} />
                <SummaryLine label="Tipo" value={form.caseType || 'Pendiente'} />
                <SummaryLine label="Paciente" value={form.patientCode || 'Pendiente'} />
                <SummaryLine label="Fármaco" value={form.currentDrug || 'Pendiente'} />
                <SummaryLine label="Prioridad" value={form.priority} />
                <SummaryLine label="Determinantes" value={String(form.determinants.filter((item) => item.label).length)} />
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-[#7b3fa0]" />
                <p className="text-sm font-semibold text-[#152520]">Completitud en vivo</p>
              </div>
              <div className="mt-4 rounded-2xl border border-[#7b3fa0]/20 bg-[#faf6fd] px-4 py-3">
                <p className="text-2xl font-semibold text-[#152520]">{completeness.score}%</p>
                <p className="mt-1 text-sm text-[#4a7068]">Se recalcula a medida que rellenas el formulario.</p>
              </div>
              <div className="mt-4 space-y-2">
                <InlineStatus label="Bloqueos" value={String(completeness.missing.length)} tone="red" />
                <InlineStatus label="Advertencias" value={String(completeness.warnings.length)} tone="amber" />
                <InlineStatus label="Siguiente paso" value={completeness.suggestedNextAction} tone="teal" />
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-[#7b3fa0]" />
                <p className="text-sm font-semibold text-[#152520]">Agentes asistiendo la creación</p>
              </div>
              {assistBusy || historyLoading ? (
                <div className="mt-4 space-y-2">
                  {[
                    'Revisando el contexto del caso',
                    'Comparando con patrones terapéuticos',
                    'Preparando sugerencias aplicables',
                  ].map((step, index) => (
                    <div key={step} className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-[#faf6fd] px-3 py-2 text-xs text-[#7b3fa0]">
                      {index === 1 ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Clock3 className="h-3.5 w-3.5" />}
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="mt-4 space-y-2">
                    <InlineStatus label="Sugerencias" value={String(agentSuggestions.length)} tone="teal" />
                    <InlineStatus label="Determinantes propuestos" value={String(missingSuggestedDeterminants.length)} tone="amber" />
                    <InlineStatus label="Warnings de pauta" value={String(therapyWarnings.length)} tone={therapyWarnings.length > 0 ? 'red' : 'teal'} />
                  </div>

                  {patientHistory?.items?.length ? (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4a7068]">Historial del paciente</p>
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
                        Reutilizar último contexto
                      </Button>
                    </div>
                  ) : form.patientCode.trim().length >= 3 ? (
                    <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-[#4a7068]">
                      No hay casos previos de este paciente en la red.
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
