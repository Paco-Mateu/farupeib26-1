'use client'

import { AlertTriangle, FileText, Loader2, PencilLine, Sparkles, Trash2 } from 'lucide-react'

import { useXarxaT } from '@/components/i18n/use-xarxa-strings'
import type { CasoCompleto } from '@/components/pkpd/pro/xarxa-types'
import { Button } from '@/components/ui/button'
import { CaseHealthRadar, TherapeuticWindowGauge } from './charts'
import { deriveDrugLine, deriveTrough, pkpdStatus } from './derive'
import type { Tab } from './shared'

export function TabResumen({
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
  const t = useXarxaT('cockpit-tabs-overview')
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
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#7b3fa0]">{t('foco.etiqueta')}</p>
            <p className="mt-1.5 text-lg font-semibold text-[#152520]">{t(focus.title)}</p>
            <p className="mt-1 text-sm leading-6 text-[#4a7068]">{t(focus.detail)}</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenTab(focus.tab)}
            className="rounded-full border border-[#7b3fa0]/20 bg-white px-3 py-1.5 text-xs font-semibold text-[#7b3fa0] transition hover:bg-[#f3ebfa]"
          >
            {t('foco.cta.abrir').replaceAll('{label}', t(focus.ctaLabel))}
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
          <Button size="sm" className="rounded-xl bg-[#7b3fa0] text-xs text-white hover:bg-[#6a3490]" onClick={onConfirm}>{t('action.confirmar')}</Button>
          <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onRequestData}>{t('action.solicitarDatos')}</Button>
          <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => onOpenTab(focus.tab)}>
            {t('foco.cta.ir').replaceAll('{label}', t(focus.ctaLabel))}
          </Button>
        </div>
      </div>

      {/* Summary card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#4a7068]">{t('resumen.titulo')}</p>
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

export function stageFocus(stage: string): {
  title: string
  detail: string
  tab: Tab
  ctaLabel: string
} {
  if (['Solicitud recibida', 'Caso creado por IA', 'Datos incompletos', 'Pendiente de determinantes', 'Determinantes recibidos'].includes(stage)) {
    return {
      title: 'stage.datos.title',
      detail: 'stage.datos.detail',
      tab: 'datos',
      ctaLabel: 'cta.datos',
    }
  }
  if (['Análisis PK/PD generado', 'Revisión farmacéutica', 'Revisión médica', 'Discusión en red'].includes(stage)) {
    return {
      title: 'stage.analisis.title',
      detail: 'stage.analisis.detail',
      tab: 'recomendacion',
      ctaLabel: 'cta.recomendacion',
    }
  }
  if (['Informe generado', 'Informe validado', 'Registrado en HCE'].includes(stage)) {
    return {
      title: 'stage.informe.title',
      detail: 'stage.informe.detail',
      tab: 'recomendacion',
      ctaLabel: 'cta.informe',
    }
  }
  return {
    title: 'stage.default.title',
    detail: 'stage.default.detail',
    tab: 'actividad',
    ctaLabel: 'cta.actividad',
  }
}

export function StatusCard({ label, value, note, color }: { label: string; value: string; note: string; color: string }) {
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

export function StageActions({
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
  const t = useXarxaT('cockpit-tabs-overview')
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
          <PencilLine className="mr-1.5 h-3.5 w-3.5" /> {t('action.editarDatos')}
        </Button>
        {canDelete ? (
          <Button size="sm" variant="outline" className="rounded-xl border-red-200 text-xs text-red-700 hover:bg-red-50" onClick={onDelete} disabled={actionBusy === 'delete'}>
            {actionBusy === 'delete' ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-1.5 h-3.5 w-3.5" />}
            {t('action.eliminar')}
          </Button>
        ) : null}
      </div>
    )
  }

  if (reportStages.includes(stage)) {
    return (
      <div className="flex gap-2">
        <Button size="sm" className="rounded-xl bg-[#7b3fa0] text-xs text-white hover:bg-[#6a3490]" onClick={onGenerateNote} disabled={actionBusy === 'note:generate'}>
          <FileText className="mr-1.5 h-3.5 w-3.5" /> {t('action.generarInforme')}
        </Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onEdit}>
          <PencilLine className="mr-1.5 h-3.5 w-3.5" /> {t('action.editar')}
        </Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs text-slate-500" onClick={onClose}>{t('action.cerrarCaso')}</Button>
        {canDelete ? (
          <Button size="sm" variant="outline" className="rounded-xl border-red-200 text-xs text-red-700 hover:bg-red-50" onClick={onDelete} disabled={actionBusy === 'delete'}>
            {actionBusy === 'delete' ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-1.5 h-3.5 w-3.5" />}
            {t('action.eliminar')}
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
          {actionBusy === 'orchestrate' ? t('action.agentesTrabajando') : t('action.actualizarAgentes')}
        </Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onGenerateNote} disabled={actionBusy === 'note:generate'}>
          <FileText className="mr-1.5 h-3.5 w-3.5" /> {t('action.informe')}
        </Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs text-slate-500" onClick={onClose}>{t('action.cerrar')}</Button>
        {canDelete ? (
          <Button size="sm" variant="outline" className="rounded-xl border-red-200 text-xs text-red-700 hover:bg-red-50" onClick={onDelete} disabled={actionBusy === 'delete'}>
            {actionBusy === 'delete' ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-1.5 h-3.5 w-3.5" />}
            {t('action.eliminar')}
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
          {actionBusy === 'orchestrate' ? t('action.agentesTrabajando') : t('action.actualizarAgentes')}
        </Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onEdit}>
          <PencilLine className="mr-1.5 h-3.5 w-3.5" /> {t('action.editarDatos')}
        </Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onMarkSession}>{t('action.sesionRed')}</Button>
        {canDelete ? (
          <Button size="sm" variant="outline" className="rounded-xl border-red-200 text-xs text-red-700 hover:bg-red-50" onClick={onDelete} disabled={actionBusy === 'delete'}>
            {actionBusy === 'delete' ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-1.5 h-3.5 w-3.5" />}
            {t('action.eliminar')}
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
        {actionBusy === 'orchestrate' ? t('action.agentesTrabajando') : t('action.actualizarAgentes')}
      </Button>
      <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onEdit}>
        <PencilLine className="mr-1.5 h-3.5 w-3.5" /> Editar datos
      </Button>
      <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onRequestData}>{t('action.solicitarDatos')}</Button>
      {canDelete ? (
        <Button size="sm" variant="outline" className="rounded-xl border-red-200 text-xs text-red-700 hover:bg-red-50" onClick={onDelete} disabled={actionBusy === 'delete'}>
          {actionBusy === 'delete' ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Trash2 className="mr-1.5 h-3.5 w-3.5" />}
          Eliminar
        </Button>
      ) : null}
    </div>
  )
}
