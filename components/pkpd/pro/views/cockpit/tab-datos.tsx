'use client'

import {
  Activity, AlertTriangle, ClipboardEdit, FlaskConical, Mail, PencilLine, Pill, Shield, Users,
} from 'lucide-react'
import { useState } from 'react'

import { useXarxaT } from '@/components/i18n/use-xarxa-strings'
import type { CasoCompleto, FieldReviewMeta } from '@/components/pkpd/pro/xarxa-types'
import { Button } from '@/components/ui/button'
import { GapSeverityDonut } from './charts'
import { deriveMedicationHistory, formatSampleDateTime, getFieldReviewMeta } from './derive'
import {
  FieldStatusHelpTrigger, InfoField, ReviewMiniMetric, TherapyTimeline,
  reviewOriginLabel, reviewStatusLabel, reviewStatusSymbol, reviewStatusTone, reviewTraceLabel,
} from './field-review'
import { Section } from './tab-auditoria'

export function TabDatos({
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
  const t = useXarxaT('cockpit-tabs-clinical')
  const tReview = useXarxaT('cockpit-review')
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
          {t('datos.abrirEditor')}
        </Button>
      </div>

      <Section title={t('datos.section.origen')} icon={Mail}>
        <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-3">
            {caso.entrySource === 'Email' ? (
              <div className="grid gap-2 sm:grid-cols-4">
                <ReviewMiniMetric label={t('datos.metric.agentes')} value={String(llmCount)} tone="llm" />
                <ReviewMiniMetric label={t('datos.metric.pendientes')} value={String(pendingCount)} tone="pending" />
                <ReviewMiniMetric label={t('datos.metric.confirmados')} value={String(confirmedCount)} tone="confirmed" />
                <ReviewMiniMetric label={t('datos.metric.editados')} value={String(editedCount)} tone="edited" />
              </div>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoField label={t('datos.campo.origen')} value={caso.entrySource || '—'} />
              <InfoField
                label={t('datos.campo.tratamientoEntrada')}
                value={caso.entrySource === 'Email' ? t('datos.valor.emailAgentes') : t('datos.valor.formulario')}
              />
            </div>
            {caso.entrySource === 'Email' ? (
              <div className="rounded-xl border border-[#7b3fa0]/15 bg-[#faf6fd] px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7b3fa0]">
                  {t('datos.evidencia.titulo')}
                </p>
                <p className="mt-1 text-xs leading-6 text-[#4a7068]">
                  {t('datos.evidencia.texto')}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4a7068]">
                  {t('datos.solicitud.titulo')}
                </p>
                <p className="mt-1 text-xs leading-6 text-[#4a7068]">
                  {t('datos.solicitud.texto')}
                </p>
              </div>
            )}
          </div>

          {caso.entrySource === 'Email' && caso.emailOriginal ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4a7068]">
                {t('datos.emailOriginal')}
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
      <Section title={t('datos.section.paciente')} icon={Users}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <InfoField label={t('datos.campo.codigo')} value={caso.patientCode} />
          <InfoField
            label={t('datos.campo.edad')}
            value={caso.patientProfile?.age != null ? String(caso.patientProfile.age) : '—'}
            review={getFieldReviewMeta(caso, 'patientProfile.age')}
          />
          <InfoField
            label={t('datos.campo.sexo')}
            value={caso.patientProfile?.sex || '—'}
            review={getFieldReviewMeta(caso, 'patientProfile.sex')}
          />
          <InfoField
            label={t('datos.campo.peso')}
            value={caso.patientProfile?.weightKg != null ? `${caso.patientProfile.weightKg} kg` : '—'}
            review={getFieldReviewMeta(caso, 'patientProfile.weightKg')}
          />
          <InfoField
            label={t('datos.campo.altura')}
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
      <Section title={t('datos.section.enfermedad')} icon={Activity}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(caso.diseaseContext ?? {}).map(([k, v]) => (
            <InfoField key={k} label={k} value={String(v)} review={getFieldReviewMeta(caso, `diseaseContext.${k}`)} />
          ))}
        </div>
      </Section>

      {/* Therapy context */}
      <Section title={t('datos.section.tratamientoActual')} icon={Shield}>
        <div className="space-y-4">
          {/* Current therapy fields */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <InfoField
              label={t('datos.campo.farmacoActual')}
              value={String((caso.therapyContext as any)?.currentDrug ?? '—')}
              review={getFieldReviewMeta(caso, 'therapyContext.currentDrug')}
            />
            <InfoField
              label={t('datos.campo.dosisActual')}
              value={String((caso.therapyContext as any)?.currentDose ?? '—')}
              review={getFieldReviewMeta(caso, 'therapyContext.currentDose')}
            />
            <InfoField
              label={t('datos.campo.intervalo')}
              value={String((caso.therapyContext as any)?.interval ?? '—')}
              review={getFieldReviewMeta(caso, 'therapyContext.interval')}
            />
            <InfoField
              label={t('datos.campo.via')}
              value={String((caso.therapyContext as any)?.route ?? '—')}
              review={getFieldReviewMeta(caso, 'therapyContext.route')}
            />
            <InfoField
              label={t('datos.campo.ultimaAdmin')}
              value={String((caso.therapyContext as any)?.lastAdministration ?? '—')}
              review={getFieldReviewMeta(caso, 'therapyContext.lastAdministration')}
            />
          </div>
          {String((caso.therapyContext as any)?.previousTherapies ?? '').trim() ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#4a7068]">{t('datos.tratamientosPrevios')}</p>
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
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#4a7068]">{t('datos.evolucionPauta')}</p>
                <p className="mt-0.5 text-sm font-semibold text-[#152520]">{t('datos.tocaDetalle')}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] text-[#4a7068]">
                {t('datos.registros').replaceAll('{n}', String(medicationHistory.length))}
              </span>
            </div>
            <TherapyTimeline entries={medicationHistory} />
          </div>
        </div>
      </Section>

      {/* Dose administrations (timed schema) */}
      {(caso.doses?.length ?? 0) > 0 ? (
        <Section title={t('datos.section.administraciones')} icon={Pill}>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] uppercase tracking-[0.08em] text-[#4a7068]">
                  <th className="px-4 py-2.5 font-semibold">{t('datos.tabla.fecha')}</th>
                  <th className="px-4 py-2.5 font-semibold">{t('datos.tabla.dosis')}</th>
                  <th className="px-4 py-2.5 font-semibold">{t('datos.tabla.via')}</th>
                  <th className="px-4 py-2.5 font-semibold">{t('datos.tabla.peso')}</th>
                  <th className="px-4 py-2.5 font-semibold">{t('datos.tabla.fase')}</th>
                  <th className="px-4 py-2.5 font-semibold">{t('datos.tabla.notas')}</th>
                </tr>
              </thead>
              <tbody>
                {caso.doses!.map((dose, index) => (
                  <tr key={index} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-4 py-2.5 font-medium text-[#152520]">
                      {dose.administeredAt ? formatSampleDateTime(dose.administeredAt) : t('datos.pendienteFecha')}
                    </td>
                    <td className="px-4 py-2.5 text-[#152520]">{dose.doseAmount ?? '—'} {dose.unit ?? ''}</td>
                    <td className="px-4 py-2.5 text-slate-600">{dose.route ?? '—'}</td>
                    <td className="px-4 py-2.5 text-slate-600">{dose.weightKg != null ? `${dose.weightKg} kg` : '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${dose.phase === 'Induccion' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                        {dose.phase === 'Induccion' ? t('datos.fase.induccion') : t('datos.fase.mantenimiento')}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-600">{dose.notes ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      ) : null}

      {/* Lab determinants */}
      <Section title={t('datos.section.determinantes')} icon={FlaskConical}>
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
                      {t('datos.review.estado')}{tReview(reviewStatusLabel(review))}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-700">
                      {t('datos.review.origen')}{tReview(reviewOriginLabel(review))}
                    </span>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-medium ${statusStyle[det.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {t('datos.review.dato')}{det.status}
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
                      {t('datos.review.confirmar')}
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateDeterminantReview(`labDeterminants.${i}`, 'pending')}
                      disabled={busyKey !== null}
                      className="rounded-full border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-700 transition hover:bg-amber-50 disabled:opacity-50"
                    >
                      {t('datos.review.marcarPendiente')}
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
              {(det.sampleDateTime || det.sampleType) && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {det.sampleDateTime && (
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-700">
                      {t('datos.extraccion')}{formatSampleDateTime(det.sampleDateTime)}
                    </span>
                  )}
                  {det.sampleType && (
                    <span className="rounded-full bg-[#7b3fa0]/10 px-2 py-1 text-[10px] font-medium text-[#7b3fa0]">
                      {t('datos.muestra')}{det.sampleType}
                    </span>
                  )}
                </div>
              )}
              <div className="mt-2 space-y-1">
                <p className="text-[10px] text-slate-500">
                  <span className="font-semibold text-slate-600">{t('datos.fuente')}</span> {det.source}
                </p>
                <p className="text-[10px] text-slate-500">
                  <span className="font-semibold text-slate-600">{t('datos.trazabilidad')}</span> {tReview(reviewTraceLabel(review))}
                </p>
              </div>
            </div>
          )})}
        </div>
      </Section>
    </div>
  )
}

// ── Tab: Gaps y tareas ────────────────────────────────────────────────────────

export function TabGaps({
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
  const t = useXarxaT('cockpit-tabs-clinical')
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
    { id: 'Pendiente', label: 'gaps.col.pendiente', header: 'bg-amber-50 text-amber-700 border-amber-200' },
    { id: 'En curso',  label: 'gaps.col.enCurso',  header: 'bg-blue-50 text-blue-700 border-blue-200' },
    { id: 'Resuelta',  label: 'gaps.col.resuelta',  header: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ]
  const SEVERITY_KEYS: Record<string, string> = {
    Crítico: 'gaps.severity.critico',
    Importante: 'gaps.severity.importante',
    Informativo: 'gaps.severity.informativo',
  }
  const ACTOR_KEYS: Record<string, string> = {
    Farmacia: 'gaps.actor.farmacia',
    Laboratorio: 'gaps.actor.laboratorio',
    Médico: 'gaps.actor.medico',
    Enfermería: 'gaps.actor.enfermeria',
    Otros: 'gaps.actor.otros',
  }

  return (
    <div className="space-y-5">
      {/* 3. Gaps with donut filter */}
      <Section title={t('datos.section.gaps')} icon={AlertTriangle}>
        {allGaps.length === 0 ? (
          <p className="text-sm text-[#4a7068]">{t('datos.gaps.vacio')}</p>
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
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.badge}`}>{t(SEVERITY_KEYS[gap.severity] ?? gap.severity)}</span>
                        <p className="text-sm font-semibold text-[#152520]">{gap.label}</p>
                      </div>
                      <p className="mt-1 text-xs text-[#4a7068]">{gap.status}</p>
                    </div>
                    <Button size="sm" variant="outline" className="shrink-0 rounded-xl text-xs"
                      onClick={() => onRequestGap(gap.label)} disabled={busyKey !== null}>
                      {t('datos.gaps.solicitar')}
                    </Button>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </Section>

      {/* 4. Kanban task board */}
      <Section title={t('datos.section.tareas')} icon={ClipboardEdit}>
        {tasks.length === 0 ? (
          <p className="text-sm text-[#4a7068]">{t('datos.tareas.vacio')}</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {COLS.map(col => {
              const colTasks = tasks.filter(task => task.status === col.id)
              return (
                <div key={col.id} className="flex flex-col gap-2">
                  <div className={`flex items-center justify-between rounded-xl border px-3 py-2 ${col.header}`}>
                    <span className="text-[10px] font-bold uppercase tracking-wide">{t(col.label)}</span>
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
                          <span className="text-[10px] text-slate-400">{t(ACTOR_KEYS[actorKey] ?? actorKey)}</span>
                          {task.dueDate && !isResolved && (
                            <span className="text-[10px] text-slate-400">{new Date(task.dueDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
                          )}
                        </div>
                        {!isResolved && (
                          <div className="mt-2 flex gap-1">
                            <Button size="sm" className="h-6 flex-1 rounded-lg bg-emerald-600 px-2 text-[10px] text-white hover:bg-emerald-700"
                              onClick={() => onResolveTask(task.taskId)} disabled={busyKey !== null}>
                              {t('gaps.col.resuelta')}
                            </Button>
                            {col.id === 'Pendiente' && (
                              <Button size="sm" variant="outline" className="h-6 flex-1 rounded-lg px-2 text-[10px]"
                                onClick={() => onStartTask(task.taskId)} disabled={busyKey !== null}>
                                {t('gaps.col.enCurso')}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {colTasks.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-[10px] text-slate-300">
                      {t('gaps.sinTareas')}
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
