'use client'

import { Loader2, Plus, Save, X } from 'lucide-react'
import type * as React from 'react'

import { useXarxaT } from '@/components/i18n/use-xarxa-strings'
import type { CasoCompleto, FieldReviewMeta } from '@/components/pkpd/pro/xarxa-types'
import { SAMPLE_TYPES } from '@/components/pkpd/pro/xarxa-types'
import { Button } from '@/components/ui/button'
import { getDraftFieldReviewMeta, toDatetimeLocalInput } from './derive'
import {
  LabeledInput, LabeledSelect, ReviewMiniMetric, ReviewStatusInline, ReviewedInput, ReviewedTextarea,
} from './field-review'
import { sheetInputCls } from './shared'
import type { CaseEditorDraft, CaseOutcomeDraft } from './shared'

export function buildEditorDraft(caso: CasoCompleto): CaseEditorDraft {
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
      sampleDateTime: toDatetimeLocalInput(item.sampleDateTime ?? null),
      sampleType: item.sampleType ?? '',
      interpretation: item.interpretation ?? '',
    })),
  }
}

export function CloseOutcomeSheet({
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
  const t = useXarxaT('cockpit-review')

  function setField<K extends keyof CaseOutcomeDraft>(field: K, value: CaseOutcomeDraft[K]) {
    onChange((current) => ({ ...current, [field]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/25 backdrop-blur-[1px]">
      <div className="flex h-full w-full max-w-[620px] flex-col overflow-hidden bg-white shadow-[0_30px_90px_rgba(15,30,28,0.2)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b3fa0]">{t('close.kicker')}</p>
            <h3 className="mt-1 text-xl font-semibold text-[#152520]">{t('close.title')}</h3>
            <p className="mt-1 text-sm text-[#4a7068]">
              {t('close.desc')}
            </p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <LabeledSelect
              label={t('close.label.recommendation')}
              value={draft.recommendationAccepted}
              onChange={(value) => setField('recommendationAccepted', value)}
              options={['', 'Aceptada íntegramente', 'Aceptada con ajustes', 'No aceptada', 'Pendiente de confirmar']}
            />
            <LabeledSelect
              label={t('close.label.response')}
              value={draft.clinicalResponse}
              onChange={(value) => setField('clinicalResponse', value)}
              options={['', 'Mejora clara', 'Mejora parcial', 'Sin cambios', 'Empeoramiento', 'Pendiente de seguimiento']}
            />
            <LabeledSelect
              label={t('close.label.decision')}
              value={draft.treatmentDecision}
              onChange={(value) => setField('treatmentDecision', value)}
              options={['', 'Mantener', 'Optimizar dosis', 'Acortar intervalo', 'Cambiar fármaco', 'Desintensificar', 'Repetir determinantes']}
            />
            <LabeledSelect
              label={t('close.label.adverse')}
              value={draft.adverseEvents}
              onChange={(value) => setField('adverseEvents', value)}
              options={['', 'Ninguno relevante', 'Leves', 'Moderados', 'Graves', 'Pendiente de revisar']}
            />
          </div>

          <div className="mt-4">
            <LabeledInput
              label={t('close.label.learning')}
              value={draft.networkLearning}
              onChange={(value) => setField('networkLearning', value)}
              placeholder={t('close.placeholder.learning')}
            />
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-[#152520]">{t('close.label.summary')}</label>
            <textarea
              className={`${sheetInputCls} min-h-[150px] resize-none`}
              value={draft.summary}
              onChange={(event) => setField('summary', event.target.value)}
              placeholder={t('close.placeholder.summary')}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
          <p className="text-xs text-[#4a7068]">{t('close.notice')}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onClose}>
              {t('close.cancel')}
            </Button>
            <Button size="sm" className="rounded-xl bg-[#7b3fa0] text-xs text-white hover:bg-[#6a3490]" onClick={onSave} disabled={saving}>
              {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              {t('close.save')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CaseEditorSheet({
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
  const t = useXarxaT('cockpit-review')

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
          sampleDateTime: '',
          sampleType: '',
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b3fa0]">{t('editor.kicker')}</p>
            <h3 className="mt-1 text-xl font-semibold text-[#152520]">{t('editor.title')}</h3>
            <p className="mt-1 text-sm text-[#4a7068]">
              {t('editor.desc')}
            </p>
            {entrySource === 'Email' ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#7b3fa0]/10 px-2.5 py-1 text-[10px] font-semibold text-[#7b3fa0]">
                  {t('editor.chip.prefilled')}
                </span>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
                  {t('editor.chip.review')}
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
                <ReviewMiniMetric label={t('editor.metric.agentes')} value={String(llmCount)} tone="llm" />
                <ReviewMiniMetric label={t('editor.metric.pendientes')} value={String(pendingCount)} tone="pending" />
                <ReviewMiniMetric label={t('editor.metric.confirmados')} value={String(confirmedCount)} tone="confirmed" />
                <ReviewMiniMetric label={t('editor.metric.editados')} value={String(editedCount)} tone="edited" />
              </div>
            ) : null}

            {entrySource === 'Email' && emailOriginal ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <p className="mb-3 text-sm font-semibold text-[#152520]">{t('editor.email.title')}</p>
                <p className="mb-3 text-xs leading-6 text-[#4a7068]">
                  {t('editor.email.desc')}
                </p>
                <div className="max-h-[220px] overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-[#152520]">
                    {emailOriginal}
                  </pre>
                </div>
              </div>
            ) : null}

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-sm font-semibold text-[#152520]">{t('editor.section.summary')}</p>
              <div className="space-y-4">
                <div>
                  <ReviewedInput
                    label={t('editor.label.title')}
                    value={draft.title}
                    onChange={(value) => setReviewedField('title', value, 'title')}
                    review={getDraftFieldReviewMeta(draft.fieldReview, 'title')}
                    onConfirm={() => setFieldReviewState('title', 'confirmed')}
                    onPending={() => setFieldReviewState('title', 'pending')}
                  />
                </div>
                <div>
                  <ReviewedTextarea
                    label={t('editor.label.clinicalSummary')}
                    value={draft.clinicalSummary}
                    onChange={(value) => setReviewedField('clinicalSummary', value, 'clinicalSummary')}
                    review={getDraftFieldReviewMeta(draft.fieldReview, 'clinicalSummary')}
                    onConfirm={() => setFieldReviewState('clinicalSummary', 'confirmed')}
                    onPending={() => setFieldReviewState('clinicalSummary', 'pending')}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#152520]">{t('editor.label.nextAction')}</label>
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
                <p className="mb-3 text-sm font-semibold text-[#152520]">{t('editor.section.patient')}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ReviewedInput label={t('editor.label.age')} value={draft.age} onChange={(value) => setReviewedField('age', value, 'patientProfile.age')} review={getDraftFieldReviewMeta(draft.fieldReview, 'patientProfile.age')} onConfirm={() => setFieldReviewState('patientProfile.age', 'confirmed')} onPending={() => setFieldReviewState('patientProfile.age', 'pending')} />
                  <ReviewedInput label={t('editor.label.sex')} value={draft.sex} onChange={(value) => setReviewedField('sex', value, 'patientProfile.sex')} review={getDraftFieldReviewMeta(draft.fieldReview, 'patientProfile.sex')} onConfirm={() => setFieldReviewState('patientProfile.sex', 'confirmed')} onPending={() => setFieldReviewState('patientProfile.sex', 'pending')} />
                  <ReviewedInput label={t('editor.label.weight')} value={draft.weightKg} onChange={(value) => setReviewedField('weightKg', value, 'patientProfile.weightKg')} review={getDraftFieldReviewMeta(draft.fieldReview, 'patientProfile.weightKg')} onConfirm={() => setFieldReviewState('patientProfile.weightKg', 'confirmed')} onPending={() => setFieldReviewState('patientProfile.weightKg', 'pending')} />
                  <LabeledInput label={t('editor.label.height')} value={draft.heightCm} onChange={(value) => setField('heightCm', value)} />
                </div>
                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium text-[#152520]">{t('editor.label.specialPopulation')}</label>
                  <input
                    className={sheetInputCls}
                    value={draft.specialPopulation}
                    onChange={(event) => setField('specialPopulation', event.target.value)}
                    placeholder={t('editor.placeholder.specialPopulation')}
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <p className="mb-3 text-sm font-semibold text-[#152520]">{t('editor.section.disease')}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <LabeledInput label={t('editor.label.diagnosis')} value={draft.diagnosis} onChange={(value) => setField('diagnosis', value)} />
                  <ReviewedInput label={t('editor.label.phenotype')} value={draft.phenotype} onChange={(value) => setReviewedField('phenotype', value, 'diseaseContext.phenotype')} review={getDraftFieldReviewMeta(draft.fieldReview, 'diseaseContext.phenotype')} onConfirm={() => setFieldReviewState('diseaseContext.phenotype', 'confirmed')} onPending={() => setFieldReviewState('diseaseContext.phenotype', 'pending')} />
                  <ReviewedInput label={t('editor.label.activity')} value={draft.activity} onChange={(value) => setReviewedField('activity', value, 'diseaseContext.activity')} review={getDraftFieldReviewMeta(draft.fieldReview, 'diseaseContext.activity')} onConfirm={() => setFieldReviewState('diseaseContext.activity', 'confirmed')} onPending={() => setFieldReviewState('diseaseContext.activity', 'pending')} />
                  <LabeledInput label={t('editor.label.extraintestinal')} value={draft.extraintestinal} onChange={(value) => setField('extraintestinal', value)} />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-sm font-semibold text-[#152520]">{t('editor.section.therapy')}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <ReviewedInput label={t('editor.label.currentDrug')} value={draft.currentDrug} onChange={(value) => setReviewedField('currentDrug', value, 'therapyContext.currentDrug')} review={getDraftFieldReviewMeta(draft.fieldReview, 'therapyContext.currentDrug')} onConfirm={() => setFieldReviewState('therapyContext.currentDrug', 'confirmed')} onPending={() => setFieldReviewState('therapyContext.currentDrug', 'pending')} />
                <ReviewedInput label={t('editor.label.currentDose')} value={draft.currentDose} onChange={(value) => setReviewedField('currentDose', value, 'therapyContext.currentDose')} review={getDraftFieldReviewMeta(draft.fieldReview, 'therapyContext.currentDose')} onConfirm={() => setFieldReviewState('therapyContext.currentDose', 'confirmed')} onPending={() => setFieldReviewState('therapyContext.currentDose', 'pending')} />
                <ReviewedInput label={t('editor.label.interval')} value={draft.interval} onChange={(value) => setReviewedField('interval', value, 'therapyContext.interval')} review={getDraftFieldReviewMeta(draft.fieldReview, 'therapyContext.interval')} onConfirm={() => setFieldReviewState('therapyContext.interval', 'confirmed')} onPending={() => setFieldReviewState('therapyContext.interval', 'pending')} />
                <ReviewedInput label={t('editor.label.route')} value={draft.route} onChange={(value) => setReviewedField('route', value, 'therapyContext.route')} review={getDraftFieldReviewMeta(draft.fieldReview, 'therapyContext.route')} onConfirm={() => setFieldReviewState('therapyContext.route', 'confirmed')} onPending={() => setFieldReviewState('therapyContext.route', 'pending')} />
                <div className="sm:col-span-2">
                  <LabeledInput label={t('editor.label.previousTherapies')} value={draft.previousTherapies} onChange={(value) => setField('previousTherapies', value)} />
                </div>
                <div className="sm:col-span-2">
                  <LabeledInput label={t('editor.label.adherence')} value={draft.adherence} onChange={(value) => setField('adherence', value)} />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#152520]">{t('editor.section.determinants')}</p>
                  <p className="text-xs text-[#4a7068]">{t('editor.determinants.desc')}</p>
                </div>
                <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={addDeterminant}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  {t('editor.add')}
                </Button>
              </div>
              <div className="space-y-4">
                {draft.labDeterminants.map((item, index) => (
                  <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[#152520]">{item.label || t('editor.newDeterminant')}</p>
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
                          {t('editor.remove')}
                        </button>
                      ) : null}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <LabeledInput label={t('editor.det.label')} value={item.label} onChange={(value) => updateDeterminant(item.id, 'label', value, `labDeterminants.${index}`)} />
                      <LabeledInput label={t('editor.det.value')} value={item.value} onChange={(value) => updateDeterminant(item.id, 'value', value, `labDeterminants.${index}`)} />
                      <LabeledInput label={t('editor.det.unit')} value={item.unit} onChange={(value) => updateDeterminant(item.id, 'unit', value, `labDeterminants.${index}`)} />
                      <LabeledInput label={t('editor.det.status')} value={item.status} onChange={(value) => updateDeterminant(item.id, 'status', value, `labDeterminants.${index}`)} />
                      <LabeledInput label={t('editor.det.source')} value={item.source} onChange={(value) => updateDeterminant(item.id, 'source', value, `labDeterminants.${index}`)} />
                      <LabeledInput label={t('editor.det.relation')} value={item.relationToDose} onChange={(value) => updateDeterminant(item.id, 'relationToDose', value, `labDeterminants.${index}`)} />
                      <div>
                        <label className="mb-1 block text-xs font-medium text-[#4a7068]">{t('editor.det.sampleDateTime')}</label>
                        <input
                          type="datetime-local"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-[#152520] outline-none focus:border-[#7b3fa0]"
                          value={item.sampleDateTime}
                          onChange={(event) => updateDeterminant(item.id, 'sampleDateTime', event.target.value, `labDeterminants.${index}`)}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-[#4a7068]">{t('editor.det.sampleType')}</label>
                        <select
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-[#152520] outline-none focus:border-[#7b3fa0]"
                          value={item.sampleType}
                          onChange={(event) => updateDeterminant(item.id, 'sampleType', event.target.value, `labDeterminants.${index}`)}
                        >
                          <option value="">{t('editor.det.sampleType.empty')}</option>
                          {SAMPLE_TYPES.map((sampleType) => (
                            <option key={sampleType} value={sampleType}>{sampleType}</option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <LabeledInput label={t('editor.det.interpretation')} value={item.interpretation} onChange={(value) => updateDeterminant(item.id, 'interpretation', value, `labDeterminants.${index}`)} />
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
          <p className="text-xs text-[#4a7068]">{t('editor.footer.notice')}</p>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl text-sm" onClick={onClose}>
              {t('editor.cancel')}
            </Button>
            <Button className="rounded-xl bg-[#7b3fa0] text-sm text-white hover:bg-[#6a3490]" onClick={onSave} disabled={saving}>
              {saving ? <Save className="mr-2 h-4 w-4 animate-pulse" /> : <Save className="mr-2 h-4 w-4" />}
              {t('editor.save')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
