'use client'

import { BookOpen, Clock, FileText, FlaskConical, Shield, Sparkles, TrendingUp } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { PkpdSimulationChart } from '@/components/pkpd/pro/charts/pkpd-simulation-chart'
import { deriveProtocolSemanticFrame, getProgramProtocol } from '@/components/pkpd/pro/protocol-guidance'
import { useXarxaT } from '@/components/i18n/use-xarxa-strings'
import type { CasoCompleto, FollowUpPlan, Program } from '@/components/pkpd/pro/xarxa-types'
import { Button } from '@/components/ui/button'
import { OutcomeCard, FollowUpPatternButton, FollowUpStatusPill, ProtocolFrameCard } from './cards'
import { ConfidenceRadar, FollowUpTimelineRuler, LabBulletChart } from './charts'
import { buildFollowUpDraft, deriveDrugLine, deriveTrough, pkpdStatus } from './derive'
import { InfoField, LabeledInput, LabeledSelect } from './field-review'
import { NOTE_STATUS, RECOMMENDATION_STATUS, sheetInputCls } from './shared'
import type { FollowUpDraft } from './shared'
import { Section } from './tab-auditoria'

export function TabAnalisis({ caso, program }: { caso: CasoCompleto; program?: Program | null }) {
  const t = useXarxaT('cockpit-tabs-clinical')
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
          <p className="font-semibold">{t('analisis.confianzaBaja.titulo')}</p>
          <p className="mt-1 leading-6">
            {t('analisis.confianzaBaja.texto')}
          </p>
        </div>
      ) : null}
      <div className="rounded-xl border border-[#7b3fa0]/20 bg-slate-50 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#4a7068]">{t('analisis.patronSugerido')}</p>
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
        <Section title={t('analisis.section.confianza')} icon={Shield}>
          <ConfidenceRadar completeness={completeness} confidence={interpretation?.confidence ?? ''} />
        </Section>

        <Section title={t('analisis.section.datos')} icon={FlaskConical}>
          <LabBulletChart determinants={(caso.labDeterminants ?? []).filter((d) => d.status === 'Confirmado')} />
        </Section>
      </div>

      {det.filter((d) => d.status !== 'Confirmado').length > 0 && (
        <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-amber-700">{t('analisis.datosPendientes')}</p>
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

export function TabSimulacion({
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

export function TabRecomendacion({
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
  const t = useXarxaT('cockpit-tabs-clinical')
  const tCore = useXarxaT('cockpit-core')
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
          <p className="font-semibold">{t('recomendacion.lecturaCauta.titulo')}</p>
          <p className="mt-1 leading-6">
            {t('recomendacion.lecturaCauta.texto')}
          </p>
        </div>
      ) : null}
      {/* Clinical context frame */}
      <div className={`rounded-xl border ${status.border} ${status.bg} px-4 py-3`}>
        <p className="text-[10px] uppercase tracking-[0.14em] text-[#4a7068]">{t('recomendacion.contexto.titulo')}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
          <span><span className="text-[#4a7068]">{t('recomendacion.contexto.paciente')}</span> <span className="font-semibold text-[#152520]">{caso.patientCode}</span></span>
          <span><span className="text-[#4a7068]">{t('recomendacion.contexto.tratamiento')}</span> <span className="font-semibold text-[#152520]">{drugLine}</span></span>
          {trough && <span><span className="text-[#4a7068]">{t('recomendacion.contexto.valle')}</span> <span className={`font-bold ${status.color}`}>{trough.value} {trough.unit}</span></span>}
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${status.border} ${status.color} bg-white`}>{tCore(status.label)}</span>
        </div>
      </div>

      <ProtocolFrameCard protocol={protocol} frame={semanticFrame} compact />

      <div className="flex items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusInfo.style}`}>{tCore(statusInfo.label ?? '')}</span>
      </div>

      <Section title={t('recomendacion.section.propuesta')} icon={Sparkles}>
        <textarea
          value={recText}
          onChange={(e) => onRecChange(e.target.value)}
          rows={5}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#152520] outline-none focus:border-[#7b3fa0]/40 focus:bg-white"
        />
      </Section>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" className="rounded-xl bg-[#7b3fa0] text-xs text-white hover:bg-[#6a3490]" onClick={onAcceptDraft} disabled={busy}>{t('recomendacion.boton.aceptarBorrador')}</Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onRequestData} disabled={busy}>{t('recomendacion.boton.solicitarDatos')}</Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onSendDigestivo} disabled={busy}>{t('recomendacion.boton.enviarDigestivo')}</Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onSendSession} disabled={busy}>{t('recomendacion.boton.enviarSesion')}</Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs text-red-600 hover:bg-red-50" onClick={onReject} disabled={busy}>{t('recomendacion.boton.rechazar')}</Button>
      </div>

      {(caso.gaps ?? []).filter((g) => g.status === 'Pendiente').length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-800">
          <p className="font-semibold">{t('recomendacion.datosPendientes')}</p>
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

export function TabInforme({
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
  const t = useXarxaT('cockpit-tabs-clinical')
  const note = caso.clinicalNote
  const protocol = getProgramProtocol(program)
  const statusInfo = NOTE_STATUS[note?.status ?? ''] ?? { style: 'bg-slate-100 text-slate-600' }

  const sections = [
    { label: t('informe.campo.motivo'), value: caso.caseType },
    { label: t('informe.campo.farmacoPauta'), value: `${(caso.therapyContext as any)?.currentDrug ?? '—'} ${(caso.therapyContext as any)?.currentDose ?? ''} ${(caso.therapyContext as any)?.interval ?? ''}`.trim() },
    { label: t('informe.campo.patron'), value: caso.pkpdInterpretation?.pattern ?? '—' },
    { label: t('informe.campo.farmaceutico'), value: caso.assignedName },
    { label: t('informe.campo.versionProtocolo'), value: `${protocol?.title ?? t('informe.protocolo.activo')} ${program?.version ?? ''}`.trim() },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusInfo.style}`}>{note?.status ?? t('informe.estado.borrador')}</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => <InfoField key={s.label} label={s.label} value={s.value} />)}
      </div>

      <ProtocolFrameCard protocol={protocol} compact />

      <Section title={t('informe.section.texto')} icon={FileText}>
        <textarea
          value={noteText}
          onChange={(e) => onNoteChange(e.target.value)}
          rows={8}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#152520] outline-none focus:border-[#7b3fa0]/40 focus:bg-white"
        />
      </Section>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" className="rounded-xl bg-[#7b3fa0] text-xs text-white hover:bg-[#6a3490]" onClick={onGenerateDraft} disabled={busy}>
          <Sparkles className="mr-1.5 h-3.5 w-3.5" /> {t('informe.boton.generar')}
        </Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onSaveDraft} disabled={busy}>{t('informe.boton.guardar')}</Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onExportPdf}>{t('informe.boton.descargarPdf')}</Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onRequestCovalidation} disabled={busy}>{t('informe.boton.covalidacio')}</Button>
        <Button size="sm" className="ml-auto rounded-xl bg-slate-900 text-xs text-white hover:bg-slate-800" onClick={onSendToEhr} disabled={busy}>{t('informe.boton.enviarHce')}</Button>
      </div>
    </div>
  )
}

// ── Tab: Aprendizaje ──────────────────────────────────────────────────────────

export function TabAprendizaje({
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
  const t = useXarxaT('cockpit-tabs-clinical')
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
      <Section title={t('aprendizaje.section.outcome')} icon={BookOpen}>
        {outcome ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <OutcomeCard label={t('aprendizaje.outcome.recomendacionAceptada')} value={outcome.recommendationAccepted || '—'} />
            <OutcomeCard label={t('aprendizaje.outcome.respuestaClinica')} value={outcome.clinicalResponse || '—'} />
            <OutcomeCard label={t('aprendizaje.outcome.decisionTerapeutica')} value={outcome.treatmentDecision || '—'} />
            <OutcomeCard label={t('aprendizaje.outcome.eventosAdversos')} value={outcome.adverseEvents || '—'} />
            <OutcomeCard label={t('aprendizaje.aprendizajeRed')} value={outcome.networkLearning || '—'} />
            <OutcomeCard label={t('aprendizaje.outcome.resumenCierre')} value={outcome.summary || '—'} long />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-[#4a7068]">
            {t('aprendizaje.outcome.vacio')}
          </div>
        )}
      </Section>

      <FollowUpTimelineRuler followUps={followUps} />

      <Section title={t('aprendizaje.section.seguimiento')} icon={Clock}>
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
                        <span>{t('aprendizaje.fecha')}{fu.dueDate ? new Date(fu.dueDate).toLocaleDateString('es-ES') : t('aprendizaje.fechaPendiente')}</span>
                        {fu.intervalDays ? <span>{t('aprendizaje.intervalo').replaceAll('{n}', String(fu.intervalDays))}</span> : null}
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
                        {t('aprendizaje.boton.editarPlan')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl text-xs"
                        onClick={() => onCompleteFollowUp(fu.label)}
                        disabled={busyKey !== null || fu.status === 'Completado'}
                      >
                        {fu.status === 'Completado' ? t('aprendizaje.boton.seguimientoCompletado') : t('aprendizaje.boton.registrarSeguimiento')}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-5 text-sm text-[#4a7068]">
                {t('aprendizaje.seguimientos.vacio')}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#4a7068]">{t('aprendizaje.planificador.titulo')}</p>
                <h3 className="mt-1 text-lg font-semibold text-[#152520]">
                  {editingLabel ? t('aprendizaje.planificador.editar') : t('aprendizaje.planificador.definir')}
                </h3>
                <p className="mt-1 text-sm leading-6 text-[#4a7068]">
                  {t('aprendizaje.planificador.descripcion')}
                </p>
              </div>
              {editingLabel ? (
                <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={resetPlanner}>
                  {t('aprendizaje.planificador.nuevoPlan')}
                </Button>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <FollowUpPatternButton
                label={t('patron.lab.label')}
                detail={t('patron.lab.detalle')}
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
                label={t('patron.clinica.label')}
                detail={t('patron.clinica.detalle')}
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
                label={t('patron.outcome.label')}
                detail={t('patron.outcome.detalle')}
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
                label={t('aprendizaje.campo.etiqueta')}
                value={plannerDraft.label}
                onChange={(value) => setPlannerDraft((current) => ({ ...current, label: value }))}
                placeholder={t('aprendizaje.campo.etiqueta.placeholder')}
                disabled={Boolean(editingLabel)}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <LabeledSelect
                  label={t('aprendizaje.campo.tipoControl')}
                  value={plannerDraft.controlType}
                  onChange={(value) => setPlannerDraft((current) => ({ ...current, controlType: value }))}
                  options={['Laboratorio', 'Visita clínica', 'Outcome / cierre', 'Revisión PK/PD', 'Co-validación', 'Personalizado']}
                />
                <LabeledInput
                  label={t('aprendizaje.campo.fechaObjetivo')}
                  type="date"
                  value={plannerDraft.dueDate}
                  onChange={(value) => setPlannerDraft((current) => ({ ...current, dueDate: value }))}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <LabeledInput
                  label={t('aprendizaje.campo.intervaloDias')}
                  type="number"
                  value={plannerDraft.intervalDays}
                  onChange={(value) => setPlannerDraft((current) => ({ ...current, intervalDays: value }))}
                  placeholder="14"
                />
                <LabeledSelect
                  label={t('aprendizaje.campo.estadoPlan')}
                  value={plannerDraft.status}
                  onChange={(value) => setPlannerDraft((current) => ({ ...current, status: value }))}
                  options={['Programado', 'Pendiente', 'Completado']}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#152520]">{t('aprendizaje.campo.motivo')}</label>
                <textarea
                  className={`${sheetInputCls} min-h-[120px] resize-none`}
                  value={plannerDraft.rationale}
                  onChange={(event) => setPlannerDraft((current) => ({ ...current, rationale: event.target.value }))}
                  placeholder={t('aprendizaje.campo.motivo.placeholder')}
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
                {t('aprendizaje.boton.guardarPlan')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl text-xs"
                onClick={resetPlanner}
                disabled={busyKey !== null}
              >
                {t('aprendizaje.boton.limpiar')}
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <Section title={t('aprendizaje.section.resultado')} icon={TrendingUp}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
	          {['aprendizaje.outcome.respuestaClinica', 'aprendizaje.resultado.respuestaBioquimica', 'aprendizaje.resultado.resultadoPkpd'].map((label) => (
	            <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
	              <p className="text-[10px] uppercase tracking-[0.14em] text-[#4a7068]">{t(label)}</p>
	              <p className="mt-2 text-sm text-[#152520]">
                  {(caso.followUps ?? []).some((item) => item.status === 'Completado')
                    ? t('aprendizaje.resultado.conSeguimiento')
                    : t('aprendizaje.resultado.sinSeguimiento')}
                </p>
	            </div>
	          ))}
	        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {['aprendizaje.tag.casoDocente', 'aprendizaje.tag.casoRecurrente', 'aprendizaje.tag.nuevoPatron', 'aprendizaje.tag.revisionProtocolo'].map((tag) => (
            <span key={tag} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-[#4a7068]">
              {t(tag)}
            </span>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-[#7b3fa0]/20 bg-slate-50 px-4 py-3">
          <p className="text-sm font-medium text-[#152520]">{t('aprendizaje.aprendizajeRed')}</p>
          <p className="mt-1 text-[11px] leading-6 text-[#4a7068]">
            {t('aprendizaje.aprendizajeRed.texto')}
          </p>
        </div>
      </Section>
    </div>
  )
}
