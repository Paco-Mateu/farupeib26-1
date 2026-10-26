'use client'

import { CheckCircle2, ChevronLeft, ChevronRight, FolderCog, Loader2, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'

import { useXarxaT } from '@/components/i18n/use-xarxa-strings'
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
  protocolTitle: string
  protocolSummary: string
  protocolAlignment: string
  protocolLastReview: string
  protocolSemantics: string
  protocolReferences: string
}

type WizardStep = 'basics' | 'scope' | 'therapy' | 'workflow' | 'review'

const WIZARD_STEPS: Array<{
  id: WizardStep
  label: string
  description: string
}> = [
  {
    id: 'basics',
    label: 'wizard.basics.label',
    description: 'wizard.basics.description',
  },
  {
    id: 'scope',
    label: 'wizard.scope.label',
    description: 'wizard.scope.description',
  },
  {
    id: 'therapy',
    label: 'wizard.therapy.label',
    description: 'wizard.therapy.description',
  },
  {
    id: 'workflow',
    label: 'wizard.workflow.label',
    description: 'wizard.workflow.description',
  },
  {
    id: 'review',
    label: 'wizard.review.label',
    description: 'wizard.review.description',
  },
]

export function AdminClinico() {
  const t = useXarxaT('admin-clinico')
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
        setError(loadError instanceof Error ? loadError.message : t('error.cargarConfig'))
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
    setNotice(t('notice.nuevoPrograma'))
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
      setNotice(draft._id ? t('notice.guardado') : t('notice.creado'))
      setReloadKey((value) => value + 1)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('error.guardar'))
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
              label: t('label.indicaciones'),
              value: String(splitList(draft.conditions).length),
              note: t('metric.indicaciones.nota'),
            },
            {
              label: t('label.tiposCaso'),
              value: String(splitList(draft.caseTypes).length),
              note: t('metric.tiposCaso.nota'),
            },
            {
              label: t('label.farmacos'),
              value: String(splitList(draft.drugs).length),
              note: t('metric.farmacos.nota'),
            },
            {
              label: t('label.determinantes'),
              value: String(splitList(draft.determinants).length),
              note: t('metric.determinantes.nota'),
            },
            {
              label: t('metric.etapas.label'),
              value: String(splitList(draft.workflowStages, '\n').length),
              note: t('metric.etapas.nota'),
            },
            {
              label: t('metric.formularios.label'),
              value: String(selectedForms.length),
              note: t('metric.formularios.nota'),
            },
            {
              label: t('metric.fuentes.label'),
              value: String(parseReferenceLines(draft.protocolReferences).length),
              note: t('metric.fuentes.nota'),
            },
          ]
        : [],
    [draft, selectedForms.length, t]
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
      setNotice(t('notice.publicado'))
      setReloadKey((value) => value + 1)
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : t('error.publicar'))
    } finally {
      setPublishing(false)
    }
  }

  if (loading && programs.length === 0) {
    return (
      <WorkspaceLoadingState
        title={t('loading.titulo')}
        detail={t('loading.detalle')}
      />
    )
  }

  if (error && programs.length === 0) {
    return (
      <WorkspaceErrorState
        title={t('error.titulo')}
        detail={error}
        onRetry={() => setReloadKey((value) => value + 1)}
      />
    )
  }

  if (!draft) {
    return (
      <WorkspaceEmptyState
        title={t('empty.titulo')}
        detail={t('empty.detalle')}
        actionLabel={t('empty.accion')}
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
              <p className="text-sm font-semibold text-[#152520]">{t('header.badge')}</p>
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-[#152520]">
              {t('header.titulo')}
            </h2>
            <p className="mt-2 text-sm leading-7 text-[#4a7068]">
              {t('header.subtitulo')}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:w-[420px]">
            <SummaryCard label={t('summary.activos')} value={String(summary.active)} note={t('summary.activos.nota')} />
            <SummaryCard label={t('summary.borradores')} value={String(summary.drafts)} note={t('summary.borradores.nota')} />
            <SummaryCard label={t('summary.especialidades')} value={String(summary.specialties)} note={t('summary.especialidades.nota')} />
            <SummaryCard label={t('summary.formularios')} value={String(summary.forms)} note={t('summary.formularios.nota')} />
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
                {t('lista.titulo')}
              </p>
              <p className="mt-1 text-sm font-semibold text-[#152520]">{t('lista.subtitulo')}</p>
            </div>
            <Button size="sm" className="rounded-xl bg-[#152520] text-xs text-white hover:bg-[#243732]" onClick={createNewDraft}>
              {t('lista.nuevo')}
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
                {t('panel.titulo')}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-[#152520]">
                {draft.label || t('panel.sinNombre')}
              </h3>
              <p className="mt-1 text-sm text-[#4a7068]">
                {t('panel.subtitulo')}
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
                {t('accion.guardarCambios')}
              </Button>
              <Button
                size="sm"
                className="rounded-xl bg-[#7b3fa0] text-xs text-white hover:bg-[#6a3490]"
                onClick={publishProgram}
                disabled={!draft._id || saving || publishing}
              >
                {publishing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                {t('accion.publicarVersion')}
              </Button>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4a7068]">
                {t('wizard.paso').replaceAll('{current}', String(currentStepIndex + 1)).replaceAll('{total}', String(WIZARD_STEPS.length))}
              </p>
              <p className="mt-1 text-sm font-semibold text-[#152520]">{t(currentStep.label)}</p>
              <p className="mt-1 text-xs text-[#4a7068]">{t(currentStep.description)}</p>
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
                      <span className="text-xs font-semibold">{t(step.label)}</span>
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
                    <p className="text-sm font-semibold text-[#152520]">{t('basics.titulo')}</p>
                    <p className="mt-1 text-sm text-[#4a7068]">
                      {t('basics.subtitulo')}
                    </p>
                  </div>
                  <div className="grid gap-6 xl:grid-cols-2">
                    <Field label={t('label.programa')}>
                      <input
                        value={draft.label}
                        onChange={(event) => updateDraft('label', event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#152520] outline-none focus:border-[#7b3fa0]/40"
                      />
                    </Field>
                    <Field label={t('label.especialidad')}>
                      <input
                        value={draft.specialty}
                        onChange={(event) => updateDraft('specialty', event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#152520] outline-none focus:border-[#7b3fa0]/40"
                      />
                    </Field>
                    <Field label={t('label.estado')}>
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
                    <Field label={t('label.version')}>
                      <input
                        value={draft.version}
                        onChange={(event) => updateDraft('version', event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#152520] outline-none focus:border-[#7b3fa0]/40"
                      />
                    </Field>
                  </div>
                  <div className="grid gap-6 xl:grid-cols-2">
                    <Field label={t('label.tituloProtocolo')}>
                      <input
                        value={draft.protocolTitle}
                        onChange={(event) => updateDraft('protocolTitle', event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#152520] outline-none focus:border-[#7b3fa0]/40"
                      />
                    </Field>
                    <Field label={t('label.ultimaRevision')}>
                      <input
                        type="date"
                        value={draft.protocolLastReview}
                        onChange={(event) => updateDraft('protocolLastReview', event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#152520] outline-none focus:border-[#7b3fa0]/40"
                      />
                    </Field>
                  </div>
                  <TextAreaField
                    label={t('label.resumen')}
                    hint={t('hint.resumen')}
                    value={draft.protocolSummary}
                    onChange={(value) => updateDraft('protocolSummary', value)}
                    rows={4}
                  />
                </div>
              ) : null}

              {wizardStep === 'scope' ? (
                <div className="space-y-6 rounded-3xl border border-slate-200 bg-[#fbfcfb] p-6">
                  <div>
                    <p className="text-sm font-semibold text-[#152520]">{t('scope.titulo')}</p>
                    <p className="mt-1 text-sm text-[#4a7068]">
                      {t('scope.subtitulo')}
                    </p>
                  </div>
                  <div className="grid gap-6 xl:grid-cols-2">
                    <TextAreaField
                      label={t('label.enfermedades')}
                      hint={t('hint.enfermedades')}
                      value={draft.conditions}
                      onChange={(value) => updateDraft('conditions', value)}
                    />
                    <TextAreaField
                      label={t('label.tiposCaso')}
                      hint={t('hint.tiposCaso')}
                      value={draft.caseTypes}
                      onChange={(value) => updateDraft('caseTypes', value)}
                    />
                  </div>
                  <TextAreaField
                    label={t('label.politica')}
                    hint={t('hint.politica')}
                    value={draft.sharingPolicy}
                    onChange={(value) => updateDraft('sharingPolicy', value)}
                    rows={5}
                  />
                  <TextAreaField
                    label={t('label.alineamiento')}
                    hint={t('hint.alineamiento')}
                    value={draft.protocolAlignment}
                    onChange={(value) => updateDraft('protocolAlignment', value)}
                    rows={5}
                  />
                </div>
              ) : null}

              {wizardStep === 'therapy' ? (
                <div className="space-y-6 rounded-3xl border border-slate-200 bg-[#fbfcfb] p-6">
                  <div>
                    <p className="text-sm font-semibold text-[#152520]">{t('therapy.titulo')}</p>
                    <p className="mt-1 text-sm text-[#4a7068]">
                      {t('therapy.subtitulo')}
                    </p>
                  </div>
                  <div className="grid gap-6 xl:grid-cols-2">
                    <TextAreaField
                      label={t('label.farmacos')}
                      hint={t('hint.farmacos')}
                      value={draft.drugs}
                      onChange={(value) => updateDraft('drugs', value)}
                    />
                    <TextAreaField
                      label={t('label.determinantes')}
                      hint={t('hint.determinantes')}
                      value={draft.determinants}
                      onChange={(value) => updateDraft('determinants', value)}
                    />
                  </div>
                  <TextAreaField
                    label={t('label.semantica')}
                    hint={t('hint.semantica')}
                    value={draft.protocolSemantics}
                    onChange={(value) => updateDraft('protocolSemantics', value)}
                    rows={6}
                  />
                </div>
              ) : null}

              {wizardStep === 'workflow' ? (
                <div className="space-y-6 rounded-3xl border border-slate-200 bg-[#fbfcfb] p-6">
                  <div>
                    <p className="text-sm font-semibold text-[#152520]">{t('workflowStep.titulo')}</p>
                    <p className="mt-1 text-sm text-[#4a7068]">
                      {t('workflowStep.subtitulo')}
                    </p>
                  </div>
                  <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <TextAreaField
                      label={t('label.workflowClinico')}
                      hint={t('hint.workflowClinico')}
                      value={draft.workflowStages}
                      onChange={(value) => updateDraft('workflowStages', value)}
                      rows={10}
                    />
                    <div className="rounded-3xl border border-slate-200 bg-white p-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4a7068]">
                        {t('formularios.titulo')}
                      </p>
                      <div className="mt-3 space-y-2">
                        {selectedForms.length > 0 ? (
                          selectedForms.map((form) => (
                            <div key={form._id} className="rounded-2xl border border-slate-200 bg-[#fbfcfb] px-4 py-3">
                              <p className="text-sm font-semibold text-[#152520]">{form.label}</p>
                              <p className="mt-1 text-xs text-[#4a7068]">{t('formularios.secciones').replaceAll('{count}', String(form.sections.length))}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-[#4a7068]">
                            {t('formularios.vacio')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <TextAreaField
                    label={t('label.fuentes')}
                    hint={t('hint.fuentes')}
                    value={draft.protocolReferences}
                    onChange={(value) => updateDraft('protocolReferences', value)}
                    rows={6}
                  />
                </div>
              ) : null}

              {wizardStep === 'review' ? (
                <div className="space-y-6 rounded-3xl border border-slate-200 bg-[#fbfcfb] p-6">
                  <div>
                    <p className="text-sm font-semibold text-[#152520]">{t('review.titulo')}</p>
                    <p className="mt-1 text-sm text-[#4a7068]">
                      {t('review.subtitulo')}
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <ReviewLine label={t('label.programa')} value={draft.label || t('review.sinNombre')} />
                    <ReviewLine label={t('label.especialidad')} value={draft.specialty || t('review.pendienteDefinir')} />
                    <ReviewLine label={t('label.estado')} value={draft.status} />
                    <ReviewLine label={t('label.version')} value={draft.version || t('review.sinVersion')} />
                    <ReviewLine
                      label={t('label.indicaciones')}
                      value={splitList(draft.conditions).join(', ') || t('review.sinIndicaciones')}
                    />
                    <ReviewLine
                      label={t('label.tiposCaso')}
                      value={splitList(draft.caseTypes).join(', ') || t('review.sinTiposCaso')}
                    />
                    <ReviewLine
                      label={t('label.farmacos')}
                      value={splitList(draft.drugs).join(', ') || t('review.sinTerapias')}
                    />
                    <ReviewLine
                      label={t('label.determinantes')}
                      value={splitList(draft.determinants).join(', ') || t('review.sinDeterminantes')}
                    />
                  </div>
                  <ReviewList
                    title={t('review.etapasTitulo')}
                    items={splitList(draft.workflowStages, '\n')}
                    emptyLabel={t('review.sinEtapas')}
                  />
                  <ReviewList
                    title={t('formularios.titulo')}
                    items={selectedForms.map((form) => form.label)}
                    emptyLabel={t('review.sinFormularios')}
                  />
                  <ReviewLine
                    label={t('label.politica')}
                    value={draft.sharingPolicy || t('review.sinPolitica')}
                    fullWidth
                  />
                  <ReviewLine
                    label={t('review.protocoloActivo')}
                    value={draft.protocolTitle || t('review.sinTituloProtocolo')}
                  />
                  <ReviewLine
                    label={t('label.ultimaRevision')}
                    value={draft.protocolLastReview || t('review.sinFechaRevision')}
                  />
                  <ReviewLine
                    label={t('review.alineamiento')}
                    value={draft.protocolAlignment || t('review.sinAlineamiento')}
                    fullWidth
                  />
                  <ReviewLine
                    label={t('label.resumen')}
                    value={draft.protocolSummary || t('review.sinResumen')}
                    fullWidth
                  />
                  <ReviewList
                    title={t('label.semantica')}
                    items={splitList(draft.protocolSemantics, '\n')}
                    emptyLabel={t('review.sinSemantica')}
                  />
                  <ReferenceList
                    title={t('review.fuentesTitulo')}
                    references={parseReferenceLines(draft.protocolReferences)}
                    emptyLabel={t('review.sinFuentes')}
                  />
                </div>
              ) : null}

              <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#152520]">{t('next.titulo')}</p>
                  <p className="mt-1 text-sm text-[#4a7068]">
                    {wizardStep === 'review'
                      ? t('next.review')
                      : t('next.paso')}
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
                    {t('nav.anterior')}
                  </Button>
                  {wizardStep !== 'review' ? (
                    <Button
                      type="button"
                      className="rounded-xl bg-[#152520] text-xs text-white hover:bg-[#243732]"
                      onClick={goToNextStep}
                    >
                      {t('nav.siguiente')}
                      <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-[#f8faf8] p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4a7068]">
                  {t('wizard.estadoTitulo')}
                </p>
                <p className="mt-2 text-sm font-semibold text-[#152520]">
                  {t(currentStep.label)}
                </p>
                <p className="mt-1 text-sm text-[#4a7068]">{t(currentStep.description)}</p>
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
                          <p className="text-xs font-semibold text-[#152520]">{t(step.label)}</p>
                          <p className="mt-0.5 text-[11px] text-[#4a7068]">{t(step.description)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4a7068]">
                  {t('resumen.ejecutivo')}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  {reviewMetrics.map((item) => (
                    <SummaryCard key={item.label} label={item.label} value={item.value} note={item.note} />
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4a7068]">
                  {t('acciones.titulo')}
                </p>
                <div className="mt-4 space-y-2">
                  <Button
                    className="w-full rounded-xl bg-[#152520] text-xs text-white hover:bg-[#243732]"
                    onClick={saveProgram}
                    disabled={saving || publishing}
                  >
                    {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                    {t('accion.guardarBorrador')}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full rounded-xl text-xs"
                    onClick={publishProgram}
                    disabled={!draft._id || saving || publishing}
                  >
                    {publishing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                    {t('accion.publicarVersion')}
                  </Button>
                </div>
                <p className="mt-3 text-xs leading-6 text-[#4a7068]">
                  {t('acciones.nota')}
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
    protocolTitle: program.protocol?.title ?? '',
    protocolSummary: program.protocol?.summary ?? '',
    protocolAlignment: program.protocol?.alignment ?? '',
    protocolLastReview: program.protocol?.lastReview ?? '',
    protocolSemantics: joinList(program.protocol?.semantics, '\n'),
    protocolReferences: serializeReferenceLines(program.protocol?.references),
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
    protocolTitle: '',
    protocolSummary: '',
    protocolAlignment: '',
    protocolLastReview: '',
    protocolSemantics: '',
    protocolReferences: '',
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
    protocol: {
      title: draft.protocolTitle.trim(),
      summary: draft.protocolSummary.trim(),
      alignment: draft.protocolAlignment.trim(),
      lastReview: draft.protocolLastReview.trim(),
      semantics: splitList(draft.protocolSemantics, '\n'),
      references: parseReferenceLines(draft.protocolReferences),
    },
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

function parseReferenceLines(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((line) => {
      const [labelPart, urlPart] = line.includes('|') ? line.split('|') : [line, line]
      const label = labelPart.trim()
      const url = (urlPart ?? labelPart).trim()
      return { label, url, source: label.includes('·') ? label.split('·')[0].trim() : undefined }
    })
    .filter((item) => item.label && item.url)
}

function serializeReferenceLines(
  items?: Array<{ label: string; url: string }>,
) {
  return (items ?? [])
    .map((item) => `${item.label} | ${item.url}`)
    .join('\n')
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

function ReferenceList({
  title,
  references,
  emptyLabel,
}: {
  title: string
  references: Array<{ label: string; url: string }>
  emptyLabel: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4a7068]">{title}</p>
      <div className="mt-3 space-y-2">
        {references.length > 0 ? (
          references.map((item) => (
            <a
              key={`${item.label}-${item.url}`}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-2xl border border-slate-200 bg-[#fbfcfb] px-4 py-3 transition hover:border-[#7b3fa0]/20 hover:bg-[#faf6fd]"
            >
              <p className="text-sm font-semibold text-[#152520]">{item.label}</p>
              <p className="mt-1 break-all text-xs text-[#4a7068]">{item.url}</p>
            </a>
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
