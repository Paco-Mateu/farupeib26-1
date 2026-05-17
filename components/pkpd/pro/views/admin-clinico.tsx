'use client'

import { CheckCircle2, ChevronLeft, ChevronRight, FolderCog, Loader2, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'

import { WorkspaceEmptyState, WorkspaceErrorState, WorkspaceLoadingState } from '@/components/pkpd/pro/workspace-state'
import type { ClinicalForm, Program } from '@/components/pkpd/pro/xarxa-types'
import { Button } from '@/components/ui/button'
import { fetchJson } from '@/lib/fetch-json'

type ProgramsPayload = {
  items: Program[]
  forms: ClinicalForm[]
}

type ProgramDraft = {
  _id?: string
  label: string
  specialty: string
  status: string
  version: string
  conditions: string
  drugs: string
  determinants: string
  caseTypes: string
  workflowStages: string
  sharingPolicy: string
}

type WizardStep = 'basics' | 'scope' | 'therapy' | 'workflow' | 'review'

const WIZARD_STEPS: Array<{
  id: WizardStep
  label: string
  description: string
}> = [
  {
    id: 'basics',
    label: 'Base clínica',
    description: 'Nombre, especialidad, estado y versión del programa.',
  },
  {
    id: 'scope',
    label: 'Alcance',
    description: 'Indicaciones, tipos de caso y política de compartición.',
  },
  {
    id: 'therapy',
    label: 'Terapia y determinantes',
    description: 'Fármacos y variables clínicas que alimentan el circuito.',
  },
  {
    id: 'workflow',
    label: 'Workflow',
    description: 'Etapas del pipeline y formularios asociados al programa.',
  },
  {
    id: 'review',
    label: 'Revisión final',
    description: 'Resumen listo para guardar o publicar en red.',
  },
]

export function AdminClinico() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [forms, setForms] = useState<ClinicalForm[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<ProgramDraft | null>(null)
  const [wizardStep, setWizardStep] = useState<WizardStep>('basics')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadPrograms() {
      setLoading(true)
      setError(null)

      try {
        const payload = await fetchJson<ProgramsPayload>('/api/xarxa/programs')
        if (cancelled) return

        const nextPrograms = payload.items ?? []
        setPrograms(nextPrograms)
        setForms(payload.forms ?? [])
        const nextSelected = nextPrograms.find((program) => program._id === selectedId) ?? nextPrograms[0] ?? null
        setSelectedId(nextSelected?._id ?? null)
        setDraft(nextSelected ? buildDraft(nextSelected) : buildEmptyDraft())
        setWizardStep('basics')
      } catch (loadError) {
        if (cancelled) return
        setError(loadError instanceof Error ? loadError.message : 'No se ha podido cargar la configuración clínica.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadPrograms()

    return () => {
      cancelled = true
    }
  }, [reloadKey, selectedId])

  const selectedProgram = useMemo(
    () => programs.find((program) => program._id === selectedId) ?? null,
    [programs, selectedId]
  )

  const selectedForms = useMemo(
    () => forms.filter((form) => form.programId === selectedProgram?._id),
    [forms, selectedProgram]
  )

  const summary = useMemo(
    () => ({
      active: programs.filter((program) => program.status === 'Activo').length,
      drafts: programs.filter((program) => program.status.toLowerCase().includes('borrador')).length,
      specialties: new Set(programs.map((program) => program.specialty)).size,
      forms: forms.length,
    }),
    [forms.length, programs]
  )

  function updateDraft(field: keyof ProgramDraft, value: string) {
    setDraft((current) => (current ? { ...current, [field]: value } : current))
  }

  function createNewDraft() {
    setSelectedId(null)
    setDraft(buildEmptyDraft())
    setWizardStep('basics')
    setNotice('Nuevo programa clínico en edición. Puedes configurarlo y guardarlo como borrador.')
  }

  function selectProgram(program: Program) {
    setSelectedId(program._id)
    setDraft(buildDraft(program))
    setWizardStep('basics')
    setNotice(null)
  }

  async function saveProgram() {
    if (!draft) return
    setSaving(true)
    setError(null)
    setNotice(null)

    try {
      const payload = serializeDraft(draft)
      const saved = draft._id
        ? await fetchJson<Program>(`/api/xarxa/programs/${draft._id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetchJson<Program>('/api/xarxa/programs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })

      setSelectedId(saved._id)
      setDraft(buildDraft(saved))
      setNotice(draft._id ? 'Configuración clínica guardada correctamente.' : 'Programa clínico creado como borrador.')
      setReloadKey((value) => value + 1)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se ha podido guardar el programa clínico.')
    } finally {
      setSaving(false)
    }
  }

  const currentStepIndex = WIZARD_STEPS.findIndex((step) => step.id === wizardStep)
  const currentStep = WIZARD_STEPS[currentStepIndex] ?? WIZARD_STEPS[0]

  const reviewMetrics = useMemo(
    () =>
      draft
        ? [
            {
              label: 'Indicaciones',
              value: String(splitList(draft.conditions).length),
              note: 'Enfermedades o situaciones clínicas cubiertas',
            },
            {
              label: 'Tipos de caso',
              value: String(splitList(draft.caseTypes).length),
              note: 'Escenarios configurados en el circuito',
            },
            {
              label: 'Fármacos',
              value: String(splitList(draft.drugs).length),
              note: 'Terapias contempladas por el programa',
            },
            {
              label: 'Determinantes',
              value: String(splitList(draft.determinants).length),
              note: 'Variables PK/PD y biomarcadores utilizados',
            },
            {
              label: 'Etapas',
              value: String(splitList(draft.workflowStages, '\n').length),
              note: 'Pasos del pipeline clínico y operativo',
            },
            {
              label: 'Formularios',
              value: String(selectedForms.length),
              note: 'Entradas estructuradas asociadas al programa',
            },
          ]
        : [],
    [draft, selectedForms.length]
  )

  function goToPreviousStep() {
    if (currentStepIndex <= 0) return
    setWizardStep(WIZARD_STEPS[currentStepIndex - 1].id)
  }

  function goToNextStep() {
    if (currentStepIndex >= WIZARD_STEPS.length - 1) return
    setWizardStep(WIZARD_STEPS[currentStepIndex + 1].id)
  }

  async function publishProgram() {
    if (!draft?._id) return
    setPublishing(true)
    setError(null)
    setNotice(null)

    try {
      const published = await fetchJson<Program>(`/api/xarxa/programs/${draft._id}/publish`, {
        method: 'POST',
      })
      setSelectedId(published._id)
      setDraft(buildDraft(published))
      setNotice('Programa publicado con nueva versión. Ya puede usarse como circuito clínico activo.')
      setReloadKey((value) => value + 1)
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : 'No se ha podido publicar el programa clínico.')
    } finally {
      setPublishing(false)
    }
  }

  if (loading && programs.length === 0) {
    return (
      <WorkspaceLoadingState
        title="Cargando administración clínica…"
        detail="Recuperando programas, formularios y configuración del workflow."
      />
    )
  }

  if (error && programs.length === 0) {
    return (
      <WorkspaceErrorState
        title="No se ha podido cargar Admin clínico."
        detail={error}
        onRetry={() => setReloadKey((value) => value + 1)}
      />
    )
  }

  if (!draft) {
    return (
      <WorkspaceEmptyState
        title="No hay programas clínicos configurados."
        detail="Crea un programa base para activar un circuito PK/PD o ampliar la plataforma a nuevas especialidades."
        actionLabel="Crear programa clínico"
        onAction={createNewDraft}
      />
    )
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto px-6 py-6">
      <div className="mb-6 rounded-[28px] border border-[#7b3fa0]/15 bg-[#f7f2fb] p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#7b3fa0]" />
              <p className="text-sm font-semibold text-[#152520]">Admin clínico</p>
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-[#152520]">
              Configuración de programas clínicos
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#4a7068]">
              Cada programa define el circuito completo: especialidad, enfermedades, fármacos, determinantes, tipos de caso y reglas de compartición entre centros.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:w-[420px]">
            <SummaryCard label="Programas activos" value={String(summary.active)} note="Circuitos listos para uso" />
            <SummaryCard label="Borradores" value={String(summary.drafts)} note="Expansiones en preparación" />
            <SummaryCard label="Especialidades" value={String(summary.specialties)} note="Áreas clínicas configurables" />
            <SummaryCard label="Formularios" value={String(summary.forms)} note="Entradas estructuradas disponibles" />
          </div>
        </div>
      </div>

      {notice ? (
        <div className="mb-4 rounded-2xl border border-[#7b3fa0]/20 bg-[#faf6fd] px-4 py-3 text-sm text-[#7b3fa0]">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4a7068]">
                Programas clínicos
              </p>
              <p className="mt-1 text-sm font-semibold text-[#152520]">Base activa + expansión multi-especialidad</p>
            </div>
            <Button size="sm" className="rounded-xl bg-[#152520] text-xs text-white hover:bg-[#243732]" onClick={createNewDraft}>
              Nuevo programa
            </Button>
          </div>

          <div className="space-y-3">
            {programs.map((program) => (
              <button
                key={program._id}
                onClick={() => selectProgram(program)}
                className={`w-full rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${
                  selectedId === program._id
                    ? 'border-[#7b3fa0]/30 bg-[#faf6fd]'
                    : 'border-slate-200 bg-[#fbfcfb]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#7b3fa0]/10 text-[#7b3fa0]">
                    <FolderCog className="h-4 w-4" />
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    program.status === 'Activo'
                      ? 'bg-[#f1f8e6] text-[#7b3fa0]'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {program.status}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold text-[#152520]">{program.label}</p>
                <p className="mt-1 text-xs text-[#4a7068]">{program.specialty} · {program.version}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4a7068]">
                Configuración del programa
              </p>
              <h3 className="mt-2 text-xl font-semibold text-[#152520]">
                {draft.label || 'Nuevo programa clínico'}
              </h3>
              <p className="mt-1 text-sm text-[#4a7068]">
                Configura el alcance clínico y el flujo de trabajo con un recorrido paso a paso.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl text-xs"
                onClick={saveProgram}
                disabled={saving || publishing}
              >
                {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                Guardar cambios
              </Button>
              <Button
                size="sm"
                className="rounded-xl bg-[#7b3fa0] text-xs text-white hover:bg-[#6a3490]"
                onClick={publishProgram}
                disabled={!draft._id || saving || publishing}
              >
                {publishing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                Publicar versión
              </Button>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4a7068]">
                Paso {currentStepIndex + 1} de {WIZARD_STEPS.length}
              </p>
              <p className="mt-1 text-sm font-semibold text-[#152520]">{currentStep.label}</p>
              <p className="mt-1 text-xs text-[#4a7068]">{currentStep.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {WIZARD_STEPS.map((step, index) => {
                const isActive = step.id === wizardStep
                const isCompleted = index < currentStepIndex
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setWizardStep(step.id)}
                    className={`rounded-2xl border px-3 py-2 text-left transition ${
                      isActive
                        ? 'border-[#7b3fa0]/30 bg-[#faf6fd] text-[#7b3fa0]'
                        : isCompleted
                          ? 'border-[#d6e8b5] bg-[#fbfdf7] text-[#7b3fa0]'
                          : 'border-slate-200 bg-white text-[#4a7068]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                          isActive || isCompleted ? 'bg-[#7b3fa0] text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="text-xs font-semibold">{step.label}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              {wizardStep === 'basics' ? (
                <div className="space-y-6 rounded-3xl border border-slate-200 bg-[#fbfcfb] p-6">
                  <div>
                    <p className="text-sm font-semibold text-[#152520]">Identidad y gobierno del programa</p>
                    <p className="mt-1 text-sm text-[#4a7068]">
                      Define cómo se presentará este circuito dentro de la red y en qué estado de gobierno se encuentra.
                    </p>
                  </div>
                  <div className="grid gap-6 xl:grid-cols-2">
                    <Field label="Programa">
                      <input
                        value={draft.label}
                        onChange={(event) => updateDraft('label', event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#152520] outline-none focus:border-[#7b3fa0]/40"
                      />
                    </Field>
                    <Field label="Especialidad">
                      <input
                        value={draft.specialty}
                        onChange={(event) => updateDraft('specialty', event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#152520] outline-none focus:border-[#7b3fa0]/40"
                      />
                    </Field>
                    <Field label="Estado">
                      <select
                        value={draft.status}
                        onChange={(event) => updateDraft('status', event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#152520] outline-none focus:border-[#7b3fa0]/40"
                      >
                        {['Activo', 'Borrador', 'En revisión clínica', 'Retirado', 'Archivado'].map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Versión">
                      <input
                        value={draft.version}
                        onChange={(event) => updateDraft('version', event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#152520] outline-none focus:border-[#7b3fa0]/40"
                      />
                    </Field>
                  </div>
                </div>
              ) : null}

              {wizardStep === 'scope' ? (
                <div className="space-y-6 rounded-3xl border border-slate-200 bg-[#fbfcfb] p-6">
                  <div>
                    <p className="text-sm font-semibold text-[#152520]">Alcance clínico y compartición</p>
                    <p className="mt-1 text-sm text-[#4a7068]">
                      Describe qué enfermedad cubre el programa, qué tipos de caso va a recibir y cómo comparte conocimiento con la red.
                    </p>
                  </div>
                  <div className="grid gap-6 xl:grid-cols-2">
                    <TextAreaField
                      label="Enfermedades o indicaciones"
                      hint="Una por línea o separadas por coma."
                      value={draft.conditions}
                      onChange={(value) => updateDraft('conditions', value)}
                    />
                    <TextAreaField
                      label="Tipos de caso"
                      hint="Debutante, pérdida de respuesta, cambio, desintensificación…"
                      value={draft.caseTypes}
                      onChange={(value) => updateDraft('caseTypes', value)}
                    />
                  </div>
                  <TextAreaField
                    label="Política de compartición"
                    hint="Define cómo comparte conocimiento este programa dentro de la red."
                    value={draft.sharingPolicy}
                    onChange={(value) => updateDraft('sharingPolicy', value)}
                    rows={5}
                  />
                </div>
              ) : null}

              {wizardStep === 'therapy' ? (
                <div className="space-y-6 rounded-3xl border border-slate-200 bg-[#fbfcfb] p-6">
                  <div>
                    <p className="text-sm font-semibold text-[#152520]">Terapias, determinantes y biomarcadores</p>
                    <p className="mt-1 text-sm text-[#4a7068]">
                      Configura la base farmacoterapéutica y analítica que luego utilizarán los casos, formularios y agentes IA.
                    </p>
                  </div>
                  <div className="grid gap-6 xl:grid-cols-2">
                    <TextAreaField
                      label="Fármacos"
                      hint="Ejemplo: infliximab, adalimumab, ustekinumab."
                      value={draft.drugs}
                      onChange={(value) => updateDraft('drugs', value)}
                    />
                    <TextAreaField
                      label="Determinantes"
                      hint="Determinantes PK/PD y biomarcadores utilizados en el circuito."
                      value={draft.determinants}
                      onChange={(value) => updateDraft('determinants', value)}
                    />
                  </div>
                </div>
              ) : null}

              {wizardStep === 'workflow' ? (
                <div className="space-y-6 rounded-3xl border border-slate-200 bg-[#fbfcfb] p-6">
                  <div>
                    <p className="text-sm font-semibold text-[#152520]">Workflow clínico y formularios asociados</p>
                    <p className="mt-1 text-sm text-[#4a7068]">
                      Ajusta el pipeline y revisa qué formularios ya están preparados para soportar este programa en producción.
                    </p>
                  </div>
                  <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <TextAreaField
                      label="Workflow clínico"
                      hint="Define aquí las etapas del pipeline. Una etapa por línea."
                      value={draft.workflowStages}
                      onChange={(value) => updateDraft('workflowStages', value)}
                      rows={10}
                    />
                    <div className="rounded-3xl border border-slate-200 bg-white p-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4a7068]">
                        Formularios asociados
                      </p>
                      <div className="mt-3 space-y-2">
                        {selectedForms.length > 0 ? (
                          selectedForms.map((form) => (
                            <div key={form._id} className="rounded-2xl border border-slate-200 bg-[#fbfcfb] px-4 py-3">
                              <p className="text-sm font-semibold text-[#152520]">{form.label}</p>
                              <p className="mt-1 text-xs text-[#4a7068]">{form.sections.length} secciones configuradas</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-[#4a7068]">
                            No hay formularios asociados todavía. Puedes seguir editando el circuito y añadir formularios en una siguiente iteración.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {wizardStep === 'review' ? (
                <div className="space-y-6 rounded-3xl border border-slate-200 bg-[#fbfcfb] p-6">
                  <div>
                    <p className="text-sm font-semibold text-[#152520]">Revisión final antes de guardar o publicar</p>
                    <p className="mt-1 text-sm text-[#4a7068]">
                      Verifica el resumen del circuito. Esta vista es la que deja claro que Crohn es el primer programa activo, pero no el único posible.
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <ReviewLine label="Programa" value={draft.label || 'Sin nombre todavía'} />
                    <ReviewLine label="Especialidad" value={draft.specialty || 'Pendiente de definir'} />
                    <ReviewLine label="Estado" value={draft.status} />
                    <ReviewLine label="Versión" value={draft.version || 'Sin versión'} />
                    <ReviewLine
                      label="Indicaciones"
                      value={splitList(draft.conditions).join(', ') || 'Sin indicaciones configuradas'}
                    />
                    <ReviewLine
                      label="Tipos de caso"
                      value={splitList(draft.caseTypes).join(', ') || 'Sin tipos de caso configurados'}
                    />
                    <ReviewLine
                      label="Fármacos"
                      value={splitList(draft.drugs).join(', ') || 'Sin terapias configuradas'}
                    />
                    <ReviewLine
                      label="Determinantes"
                      value={splitList(draft.determinants).join(', ') || 'Sin determinantes configurados'}
                    />
                  </div>
                  <ReviewList
                    title="Etapas del workflow"
                    items={splitList(draft.workflowStages, '\n')}
                    emptyLabel="No se han definido etapas todavía."
                  />
                  <ReviewList
                    title="Formularios asociados"
                    items={selectedForms.map((form) => form.label)}
                    emptyLabel="No hay formularios asociados a este programa."
                  />
                  <ReviewLine
                    label="Política de compartición"
                    value={draft.sharingPolicy || 'Sin política de compartición definida'}
                    fullWidth
                  />
                </div>
              ) : null}

              <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#152520]">Siguiente movimiento recomendado</p>
                  <p className="mt-1 text-sm text-[#4a7068]">
                    {wizardStep === 'review'
                      ? 'Guardar el borrador o publicar una nueva versión para que el circuito quede listo para la red.'
                      : 'Completa este paso y avanza para dejar el programa listo para operar de forma multi-especialidad.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl text-xs"
                    onClick={goToPreviousStep}
                    disabled={currentStepIndex === 0}
                  >
                    <ChevronLeft className="mr-1.5 h-3.5 w-3.5" />
                    Anterior
                  </Button>
                  {wizardStep !== 'review' ? (
                    <Button
                      type="button"
                      className="rounded-xl bg-[#152520] text-xs text-white hover:bg-[#243732]"
                      onClick={goToNextStep}
                    >
                      Siguiente paso
                      <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-[#f8faf8] p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4a7068]">
                  Estado del wizard
                </p>
                <p className="mt-2 text-sm font-semibold text-[#152520]">
                  {currentStep.label}
                </p>
                <p className="mt-1 text-sm text-[#4a7068]">{currentStep.description}</p>
                <div className="mt-4 space-y-2">
                  {WIZARD_STEPS.map((step, index) => {
                    const isActive = step.id === wizardStep
                    const isCompleted = index < currentStepIndex
                    return (
                      <div
                        key={step.id}
                        className={`flex items-start gap-3 rounded-2xl px-3 py-2 ${
                          isActive ? 'bg-white' : 'bg-transparent'
                        }`}
                      >
                        <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#7b3fa0]/10 text-[#7b3fa0]">
                          {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="text-[10px] font-semibold">{index + 1}</span>}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#152520]">{step.label}</p>
                          <p className="mt-0.5 text-[11px] text-[#4a7068]">{step.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4a7068]">
                  Resumen ejecutivo
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  {reviewMetrics.map((item) => (
                    <SummaryCard key={item.label} label={item.label} value={item.value} note={item.note} />
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4a7068]">
                  Acciones
                </p>
                <div className="mt-4 space-y-2">
                  <Button
                    className="w-full rounded-xl bg-[#152520] text-xs text-white hover:bg-[#243732]"
                    onClick={saveProgram}
                    disabled={saving || publishing}
                  >
                    {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                    Guardar borrador
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full rounded-xl text-xs"
                    onClick={publishProgram}
                    disabled={!draft._id || saving || publishing}
                  >
                    {publishing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                    Publicar versión
                  </Button>
                </div>
                <p className="mt-3 text-xs leading-6 text-[#4a7068]">
                  Este asistente permite configurar nuevas especialidades y circuitos clínicos sin necesidad de desarrollo adicional.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function buildDraft(program: Program): ProgramDraft {
  return {
    _id: program._id,
    label: program.label ?? '',
    specialty: program.specialty ?? '',
    status: program.status ?? 'Borrador',
    version: program.version ?? 'v0.1',
    conditions: joinList(program.conditions),
    drugs: joinList(program.drugs),
    determinants: joinList(program.determinants),
    caseTypes: joinList(program.caseTypes),
    workflowStages: joinList(program.workflowStages, '\n'),
    sharingPolicy: program.sharingPolicy ?? '',
  }
}

function buildEmptyDraft(): ProgramDraft {
  return {
    label: '',
    specialty: '',
    status: 'Borrador',
    version: 'v0.1',
    conditions: '',
    drugs: '',
    determinants: '',
    caseTypes: '',
    workflowStages: [
      'Solicitud recibida',
      'Caso creado por IA',
      'Datos incompletos',
      'Pendiente de determinantes',
      'Determinantes recibidos',
      'Análisis PK/PD generado',
      'Revisión farmacéutica',
      'Revisión médica',
      'Discusión en red',
      'Informe generado',
      'Informe validado',
      'Registrado en HCE',
      'Seguimiento 4 semanas',
      'Seguimiento 8 semanas',
      'Cerrado con resultado',
    ].join('\n'),
    sharingPolicy: 'Compartición anonimizada y aprendizaje de red con validación clínica.',
  }
}

function serializeDraft(draft: ProgramDraft) {
  return {
    label: draft.label.trim(),
    specialty: draft.specialty.trim(),
    status: draft.status,
    version: draft.version.trim(),
    conditions: splitList(draft.conditions),
    drugs: splitList(draft.drugs),
    determinants: splitList(draft.determinants),
    caseTypes: splitList(draft.caseTypes),
    workflowStages: splitList(draft.workflowStages, '\n'),
    sharingPolicy: draft.sharingPolicy.trim(),
  }
}

function splitList(value: string, delimiter = ',') {
  return value
    .split(delimiter)
    .map((item) => item.trim())
    .filter(Boolean)
}

function joinList(items?: string[], delimiter = ', ') {
  return (items ?? []).join(delimiter)
}

function SummaryCard({
  label,
  value,
  note,
}: {
  label: string
  value: string
  note: string
}) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white px-4 py-3 shadow-sm">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#4a7068]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[#152520]">{value}</p>
      <p className="mt-1 text-[11px] text-[#4a7068]">{note}</p>
    </div>
  )
}

function ReviewLine({
  label,
  value,
  fullWidth = false,
}: {
  label: string
  value: string
  fullWidth?: boolean
}) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white px-4 py-3 ${fullWidth ? 'md:col-span-2' : ''}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4a7068]">{label}</p>
      <p className="mt-2 text-sm leading-7 text-[#152520]">{value}</p>
    </div>
  )
}

function ReviewList({
  title,
  items,
  emptyLabel,
}: {
  title: string
  items: string[]
  emptyLabel: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4a7068]">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item) => (
            <span
              key={`${title}-${item}`}
              className="rounded-full border border-[#7b3fa0]/20 bg-[#f5f0fa] px-3 py-1 text-xs font-medium text-[#7b3fa0]"
            >
              {item}
            </span>
          ))
        ) : (
          <p className="text-sm text-[#4a7068]">{emptyLabel}</p>
        )}
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4a7068]">
        {label}
      </p>
      {children}
    </label>
  )
}

function TextAreaField({
  label,
  hint,
  value,
  onChange,
  rows = 6,
}: {
  label: string
  hint: string
  value: string
  onChange: (value: string) => void
  rows?: number
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4a7068]">{label}</p>
        <span className="text-[10px] text-[#4a7068]">{hint}</span>
      </div>
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-[#152520] outline-none focus:border-[#7b3fa0]/40"
      />
    </label>
  )
}
