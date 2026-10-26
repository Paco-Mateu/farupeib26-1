'use client'

import { AlertTriangle, ArrowLeft, Trash2 } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

import type { CasoCompleto, FieldReviewMeta, Program } from '@/components/pkpd/pro/xarxa-types'
import { PIPELINE_STAGES } from '@/components/pkpd/pro/xarxa-types'
import { PersonAvatar } from '@/components/pkpd/pro/person-avatar'
import { useXarxaT } from '@/components/i18n/use-xarxa-strings'
import { ActionConfirmDialog } from '@/components/ui/action-confirm-dialog'
import { fetchJson } from '@/lib/fetch-json'
import { BayesMipdCard, ClinicalIdentityBar, PipelinePanel, PkpdRulesCard, SimilarCasesCard } from './cockpit/cards'
import { buildOutcomeDraft, getFieldReviewMeta, parseCommaList } from './cockpit/derive'
import { buildEditorDraft, CaseEditorSheet, CloseOutcomeSheet } from './cockpit/sheets'
import { StageActions, TabResumen } from './cockpit/tab-resumen'
import { TabAuditoria } from './cockpit/tab-auditoria'
import { TabAnalisis, TabAprendizaje, TabInforme, TabRecomendacion, TabSimulacion } from './cockpit/tab-analisis'
import { TabDatos, TabGaps } from './cockpit/tab-datos'
import { TabTimeline } from './cockpit/tab-timeline'
import { DEMO_ACTOR, TABS } from './cockpit/shared'
import type { Props, Tab } from './cockpit/shared'

export type { CaseCockpitLaunchPreset } from './cockpit/shared'

export function CaseCockpit({
  caso,
  program,
  onBack,
  onCaseUpdated,
  onCaseDeleted,
  launchPreset,
  onLaunchPresetConsumed,
}: Props) {
  const t = useXarxaT('cockpit-root')
  const [currentCase, setCurrentCase] = useState(caso)
  const [activeTab, setActiveTab] = useState<Tab>('resumen')
  const [recText, setRecText] = useState(caso.recommendation?.text ?? '')
  const [noteText, setNoteText] = useState(caso.clinicalNote?.text ?? '')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorSaving, setEditorSaving] = useState(false)
  const [editorError, setEditorError] = useState<string | null>(null)
  const [editorDraft, setEditorDraft] = useState(() => buildEditorDraft(caso))
  const [closeOutcomeOpen, setCloseOutcomeOpen] = useState(false)
  const [closeOutcomeDraft, setCloseOutcomeDraft] = useState(() => buildOutcomeDraft(caso))
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [actionBusy, setActionBusy] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionNotice, setActionNotice] = useState<string | null>(null)
  const appliedPresetRef = useRef<string | null>(null)

  useEffect(() => {
    setCurrentCase(caso)
    setRecText(caso.recommendation?.text ?? '')
    setNoteText(caso.clinicalNote?.text ?? '')
    setEditorDraft(buildEditorDraft(caso))
    setCloseOutcomeDraft(buildOutcomeDraft(caso))
  }, [caso])

  useEffect(() => {
    if (!launchPreset || launchPreset.caseId !== caso.caseId) return

    const presetKey = JSON.stringify(launchPreset)
    if (appliedPresetRef.current === presetKey) return

    if (launchPreset.initialTab) {
      setActiveTab(launchPreset.initialTab)
    }
    if (launchPreset.notice) {
      setActionNotice(launchPreset.notice)
    }
    if (launchPreset.openEditor) {
      setEditorDraft(buildEditorDraft(caso))
      setEditorError(null)
      setEditorOpen(true)
    }

    appliedPresetRef.current = presetKey
    onLaunchPresetConsumed?.()
  }, [caso, launchPreset, onLaunchPresetConsumed])

  const stageIndex = PIPELINE_STAGES.findIndex((s) => s === currentCase.pipelineStage)
  const criticalGaps = currentCase.gaps?.filter((g) => g.severity === 'Crítico') ?? []
  const totalGaps = currentCase.gaps?.length ?? 0

  function openEditor() {
    setEditorDraft(buildEditorDraft(currentCase))
    setEditorError(null)
    setEditorOpen(true)
  }

  function openCloseOutcome() {
    setCloseOutcomeDraft(buildOutcomeDraft(currentCase))
    setCloseOutcomeOpen(true)
  }

  async function runCaseMutation(
    actionKey: string,
    input: RequestInfo | URL,
    init: RequestInit,
    successMessage: string,
  ) {
    setActionBusy(actionKey)
    setActionError(null)
    setActionNotice(null)

    try {
      const updated = await fetchJson<CasoCompleto>(input, init)
      setCurrentCase(updated)
      setRecText(updated.recommendation?.text ?? '')
      setNoteText(updated.clinicalNote?.text ?? '')
      const stageChanged = updated.pipelineStage !== currentCase.pipelineStage
      const stageMessage = stageChanged
        ? t('notice.etapaCambiada').replaceAll('{from}', String(currentCase.pipelineStage)).replaceAll('{to}', String(updated.pipelineStage))
        : ''
      setActionNotice(`${successMessage}${stageMessage}`)
      await onCaseUpdated?.(updated)
      return updated
    } catch (error) {
      setActionError(error instanceof Error ? error.message : t('error.accion'))
      return null
    } finally {
      setActionBusy(null)
    }
  }

  async function saveEditor() {
    setEditorSaving(true)
    setEditorError(null)

    try {
      const updated = await fetchJson<CasoCompleto>(`/api/xarxa/cases/${currentCase.caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...DEMO_ACTOR,
          title: editorDraft.title,
          clinicalSummary: editorDraft.clinicalSummary,
          fieldReview: editorDraft.fieldReview,
          nextAction: editorDraft.nextAction,
          patientProfile: {
            age: editorDraft.age ? Number(editorDraft.age) : null,
            sex: editorDraft.sex || null,
            weightKg: editorDraft.weightKg ? Number(editorDraft.weightKg) : null,
            heightCm: editorDraft.heightCm ? Number(editorDraft.heightCm) : null,
            specialPopulation: parseCommaList(editorDraft.specialPopulation),
          },
          diseaseContext: {
            diagnosis: editorDraft.diagnosis,
            phenotype: editorDraft.phenotype,
            activity: editorDraft.activity,
            extraintestinal: editorDraft.extraintestinal,
          },
          therapyContext: {
            currentDrug: editorDraft.currentDrug,
            currentDose: editorDraft.currentDose || null,
            interval: editorDraft.interval || null,
            route: editorDraft.route || null,
            previousTherapies: editorDraft.previousTherapies || null,
            adherence: editorDraft.adherence || null,
          },
          labDeterminants: editorDraft.labDeterminants.map((item) => ({
            label: item.label,
            value: item.value,
            unit: item.unit || null,
            status: item.status,
            source: item.source,
            relationToDose: item.relationToDose || null,
            sampleDateTime: item.sampleDateTime ? new Date(item.sampleDateTime).toISOString() : null,
            sampleType: item.sampleType || null,
            interpretation: item.interpretation || null,
          })),
        }),
      })

      setCurrentCase(updated)
      setRecText(updated.recommendation?.text ?? '')
      const stageChanged = updated.pipelineStage !== currentCase.pipelineStage
      setActionNotice(
        stageChanged
          ? t('notice.editorGuardadoEtapa').replaceAll('{from}', String(currentCase.pipelineStage)).replaceAll('{to}', String(updated.pipelineStage))
          : t('notice.editorGuardado')
      )
      await onCaseUpdated?.(updated)
      setEditorOpen(false)
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : t('error.editorGuardar'))
    } finally {
      setEditorSaving(false)
    }
  }

  async function transitionCase(body: Record<string, unknown>, successMessage: string) {
    return runCaseMutation(
      `transition:${String(body.eventLabel ?? successMessage)}`,
      `/api/xarxa/cases/${currentCase.caseId}/transition`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...DEMO_ACTOR, ...body }),
      },
      successMessage,
    )
  }

  async function deleteCurrentCase() {
    if (currentCase.demoLocked || currentCase.deletable === false) {
      setActionError(t('error.demoProtegido'))
      setActionNotice(null)
      return
    }

    setActionBusy('delete')
    setActionError(null)
    setActionNotice(null)
    try {
      await fetchJson(`/api/xarxa/cases/${currentCase.caseId}`, { method: 'DELETE' })
      setActionNotice(t('notice.casoEliminado').replaceAll('{caseId}', currentCase.caseId))
      setDeleteConfirmOpen(false)
      await onCaseDeleted?.(currentCase.caseId)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : t('error.casoEliminar'))
    } finally {
      setActionBusy(null)
    }
  }

  async function updateTask(taskId: string, body: Record<string, unknown>, successMessage: string) {
    return runCaseMutation(
      `task:${taskId}`,
      `/api/xarxa/cases/${currentCase.caseId}/tasks/${taskId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...DEMO_ACTOR, ...body }),
      },
      successMessage,
    )
  }

  async function saveRecommendation(body: Record<string, unknown>, successMessage: string) {
    return runCaseMutation(
      'recommendation',
      `/api/xarxa/cases/${currentCase.caseId}/recommendation`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...DEMO_ACTOR, ...body }),
      },
      successMessage,
    )
  }

  async function saveNote(body: Record<string, unknown>, successMessage: string) {
    return runCaseMutation(
      'note',
      `/api/xarxa/cases/${currentCase.caseId}/note`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...DEMO_ACTOR, ...body }),
      },
      successMessage,
    )
  }

  async function generateNoteDraft() {
    setActiveTab('recomendacion')
    return runCaseMutation(
      'note:generate',
      `/api/xarxa/cases/${currentCase.caseId}/note/generate`,
      { method: 'POST' },
      t('notice.borradorGenerado'),
    )
  }

  async function orchestrateCase() {
    setActiveTab('resumen')
    return runCaseMutation(
      'orchestrate',
      `/api/xarxa/cases/${currentCase.caseId}/orchestrate`,
      { method: 'POST' },
      t('notice.orchestrate'),
    )
  }

  async function saveFollowUp(body: Record<string, unknown>, successMessage: string) {
    return runCaseMutation(
      `followup:${String(body.label ?? '')}`,
      `/api/xarxa/cases/${currentCase.caseId}/followup`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...DEMO_ACTOR, ...body }),
      },
      successMessage,
    )
  }

  async function updateFieldReviewState(path: string, state: FieldReviewMeta['state']) {
    const currentReview = getFieldReviewMeta(currentCase, path)
    const nextFieldReview = {
      ...(currentCase.fieldReview ?? {}),
      [path]: {
        ...currentReview,
        state,
        sourceLabel: currentReview.sourceLabel ?? (currentReview.origin === 'llm' ? 'Extraído del email' : 'Registrado manualmente'),
      },
    }

    return runCaseMutation(
      `field-review:${path}`,
      `/api/xarxa/cases/${currentCase.caseId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...DEMO_ACTOR,
          fieldReview: nextFieldReview,
        }),
      },
      t('notice.fieldReview'),
    )
  }

  function openPrintableNote() {
    void (async () => {
      setActionBusy('note:pdf')
      setActionError(null)
      setActionNotice(null)

      try {
        const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')
        const noteBody = noteText || currentCase.clinicalNote?.text || t('pdf.sinContenido')
        const pdf = await PDFDocument.create()
        const regularFont = await pdf.embedFont(StandardFonts.Helvetica)
        const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold)
        const pageWidth = 595.28
        const pageHeight = 841.89
        const marginX = 48
        const marginBottom = 56
        const maxWidth = pageWidth - marginX * 2
        let page = pdf.addPage([pageWidth, pageHeight])
        let cursorY = 56

        const drawText = (
          text: string,
          x: number,
          y: number,
          size: number,
          font: typeof regularFont,
          color: ReturnType<typeof rgb>
        ) => {
          page.drawText(text, {
            x,
            y: pageHeight - y,
            size,
            font,
            color,
          })
        }

        const addWrappedText = (
          text: string,
          options?: { size?: number; color?: ReturnType<typeof rgb>; gapAfter?: number }
        ) => {
          const size = options?.size ?? 11
          const color = options?.color ?? rgb(21 / 255, 37 / 255, 32 / 255)
          const gapAfter = options?.gapAfter ?? 16
          const lines: string[] = []
          const paragraphs = text.split('\n')

          for (const paragraph of paragraphs) {
            const words = paragraph.split(/\s+/).filter(Boolean)
            let currentLine = ''

            if (words.length === 0) {
              lines.push('')
              continue
            }

            for (const word of words) {
              const candidate = currentLine ? `${currentLine} ${word}` : word
              if (regularFont.widthOfTextAtSize(candidate, size) <= maxWidth) {
                currentLine = candidate
              } else {
                if (currentLine) lines.push(currentLine)
                currentLine = word
              }
            }
            if (currentLine) lines.push(currentLine)
          }

          const lineHeight = size + 4
          const estimatedHeight = lines.length * lineHeight
          if (cursorY + estimatedHeight > pageHeight - marginBottom) {
            page = pdf.addPage([pageWidth, pageHeight])
            cursorY = 56
          }
          for (const line of lines) {
            drawText(line, marginX, cursorY, size, regularFont, color)
            cursorY += lineHeight
          }
          cursorY += gapAfter
        }

        const addSectionTitle = (text: string) => {
          if (cursorY > pageHeight - 96) {
            page = pdf.addPage([pageWidth, pageHeight])
            cursorY = 56
          }
          drawText(
            text.toUpperCase(),
            marginX,
            cursorY,
            10,
            boldFont,
            rgb(74 / 255, 112 / 255, 104 / 255)
          )
          cursorY += 18
        }

        drawText(
          t('pdf.titulo').replaceAll('{caseId}', currentCase.caseId),
          marginX,
          cursorY,
          18,
          boldFont,
          rgb(21 / 255, 37 / 255, 32 / 255)
        )
        cursorY += 22

        addWrappedText(
          `${currentCase.title} · ${currentCase.patientCode} · ${currentCase.centerName}`,
          { size: 10, color: rgb(74 / 255, 112 / 255, 104 / 255), gapAfter: 20 }
        )

        addSectionTitle(t('pdf.seccion.estado'))
        addWrappedText(currentCase.clinicalNote?.status || 'Borrador', { size: 11, gapAfter: 18 })

        addSectionTitle(t('pdf.seccion.texto'))
        addWrappedText(noteBody, { size: 11, gapAfter: 18 })

        addSectionTitle(t('pdf.seccion.aviso'))
        addWrappedText(
          t('pdf.aviso.texto'),
          { size: 10, color: rgb(74 / 255, 112 / 255, 104 / 255), gapAfter: 0 }
        )

        const safeCaseId = currentCase.caseId.toLowerCase().replace(/[^a-z0-9-]+/g, '-')
        const pdfBytes = await pdf.save()
        const blob = new Blob([pdfBytes], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${safeCaseId}-informe-hce.pdf`
        link.click()
        URL.revokeObjectURL(url)
        setActionNotice(t('notice.pdfDescargado'))
      } catch (error) {
        setActionError(
          error instanceof Error
            ? error.message
            : t('error.pdf')
        )
      } finally {
        setActionBusy(null)
      }
    })()
  }

  async function requestGapFollowUp(gapLabel: string) {
    const linkedTask = (currentCase.tasks ?? []).find((task) => task.title === gapLabel)
    if (linkedTask) {
      await updateTask(
        linkedTask.taskId,
        {
          status: 'En curso',
          eventLabel: `Solicitud enviada para completar: ${gapLabel}`,
        },
        t('notice.gapSolicitud'),
      )
      return
    }

    await transitionCase(
      {
        pipelineStage: 'Datos incompletos',
        nextAction: 'Solicitar datos al centro solicitante',
        eventLabel: `Gap marcado para completar: ${gapLabel}`,
      },
      t('notice.gapPendiente'),
    )
  }

  function nextFollowupDate(days: number) {
    const target = new Date()
    target.setDate(target.getDate() + days)
    return target.toISOString().slice(0, 10)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Sticky case header */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-3">
        <button
          onClick={onBack}
          className="mb-1.5 flex items-center gap-1.5 text-xs text-[#4a7068] hover:text-[#7b3fa0]"
        >
          <ArrowLeft className="h-3 w-3" /> {t('header.volver')}
        </button>
        {/* Title */}
        <h2 className="text-xl font-semibold text-[#152520] leading-snug">{currentCase.title}</h2>
        {/* Next action + gap alerts */}
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-[#7b3fa0]">{currentCase.nextAction}</span>
          {criticalGaps.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 ring-1 ring-red-200">
              <AlertTriangle className="h-3 w-3" />
              {criticalGaps.length} {t('header.critico')}{criticalGaps.length > 1 ? 's' : ''}
            </span>
          )}
          {totalGaps > criticalGaps.length && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
              {totalGaps - criticalGaps.length} gap{totalGaps - criticalGaps.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {/* Compact meta: patient + requester */}
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-[#4a7068]">
            {currentCase.patientCode}
            {currentCase.patientProfile?.age ? ` · ${currentCase.patientProfile.age}a` : ''}
            {currentCase.patientProfile?.sex ? ` · ${currentCase.patientProfile.sex}` : ''}
            {' · '}{currentCase.centerName}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-[#4a7068]">
            <PersonAvatar name={currentCase.requesterName} size="xs" />
            {currentCase.requesterName}
          </span>
          {currentCase.demoLocked || currentCase.deletable === false ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200">
              {t('header.demoProtegido')}
            </span>
          ) : null}
        </div>
      </div>

      {/* Clinical identity bar */}
      <ClinicalIdentityBar caso={currentCase} />

      {/* Tabs + content + pipeline panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left column: tabs + scrollable content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-slate-200 bg-white px-6">
            <div className="flex overflow-x-auto">
              {TABS.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                const hasCritical =
                  tab.id === 'resumen' ? criticalGaps.length > 0 :
                  tab.id === 'recomendacion' ? (
                    currentCase.recommendation?.status === 'Borrador IA' ||
                    currentCase.recommendation?.status === 'Pendiente de revisión médica'
                  ) : false
                const hasWarning =
                  tab.id === 'resumen' ? (!hasCritical && totalGaps > 0) : false
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-semibold tracking-wide transition ${tab.mobileOnly ? 'lg:hidden' : ''} ${
                      isActive
                        ? 'border-[#7b3fa0] text-[#7b3fa0]'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {t(`tab.${tab.id}`)}
                    {hasCritical && (
                      <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-red-500" />
                    )}
                    {hasWarning && (
                      <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Contextual action toolbar — sticky between tab bar and content */}
          <div className="shrink-0 border-b border-slate-100 bg-[#faf6fd]/70 px-6 py-2">
            <StageActions
              caso={currentCase}
              actionBusy={actionBusy}
              onOrchestrate={() => void orchestrateCase()}
              onEdit={openEditor}
              onGenerateNote={() => void generateNoteDraft()}
              onRequestData={() =>
                void transitionCase(
                  { pipelineStage: 'Datos incompletos', nextAction: 'Completar determinantes pendientes', eventLabel: 'Se solicita completar datos clínicos y determinantes' },
                  t('notice.datosDevueltos'),
                )
              }
              onMarkSession={() =>
                void transitionCase(
                  { pipelineStage: 'Discusión en red', nextAction: 'Preparar resumen para sesión de red', eventLabel: 'Caso marcado para sesión de red' },
                  t('notice.sesionMarcada'),
                )
              }
              onClose={openCloseOutcome}
              onDelete={() => setDeleteConfirmOpen(true)}
            />
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {actionError ? (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {actionError}
              </div>
            ) : null}
            {actionNotice ? (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-[#7b3fa0]">
                {actionNotice}
              </div>
            ) : null}
            <div className="min-w-0">
              {activeTab === 'resumen' && (
                <>
                  <TabResumen
                    caso={currentCase}
                    onOpenTab={setActiveTab}
                    onConfirm={() =>
                      void transitionCase(
                        {
                          pipelineStage: 'Determinantes recibidos',
                          nextAction: 'Revisión farmacéutica',
                          eventLabel: 'Caso confirmado para revisión farmacéutica',
                        },
                        t('notice.farmaceutica'),
                      )
                    }
                    onRequestData={() =>
                      void transitionCase(
                        {
                          pipelineStage: 'Datos incompletos',
                          nextAction: 'Completar determinantes críticos',
                          eventLabel: 'Se han solicitado datos adicionales para la revisión',
                        },
                        t('notice.datosAdicionales'),
                      )
                    }
                  />
                  <div className="my-6 border-t border-slate-100" />
                  <TabGaps
                    caso={currentCase}
                    busyKey={actionBusy}
                    onRequestGap={requestGapFollowUp}
                    onResolveTask={(taskId) =>
                      void updateTask(
                        taskId,
                        { status: 'Resuelta', eventLabel: 'Tarea marcada como resuelta' },
                        t('notice.tareaResuelta'),
                      )
                    }
                    onStartTask={(taskId) =>
                      void updateTask(
                        taskId,
                        { status: 'En curso', eventLabel: 'Tarea puesta en curso' },
                        t('notice.tareaCurso'),
                      )
                    }
                  />
                </>
              )}
              {activeTab === 'datos' && (
                <TabDatos
                  caso={currentCase}
                  onEdit={openEditor}
                  busyKey={actionBusy}
                  onUpdateDeterminantReview={(path, state) => void updateFieldReviewState(path, state)}
                />
              )}
              {activeTab === 'analisis' && (
                <>
                  <PkpdRulesCard caso={currentCase} onCaseUpdated={setCurrentCase} />
                  <div className="my-6 border-t border-slate-100" />
                  <BayesMipdCard caso={currentCase} onCaseUpdated={setCurrentCase} />
                  <div className="my-6 border-t border-slate-100" />
                  <SimilarCasesCard caso={currentCase} />
                  <div className="my-6 border-t border-slate-100" />
                  <TabAnalisis caso={currentCase} program={program} />
                  <div className="my-6 border-t border-slate-100" />
                  <TabSimulacion caso={currentCase} program={program} />
                </>
              )}
              {activeTab === 'recomendacion' && (
                <>
                <TabRecomendacion
                  caso={currentCase}
                  program={program}
                  recText={recText}
                  onRecChange={setRecText}
                  busy={actionBusy === 'recommendation'}
                  onAcceptDraft={() =>
                    void saveRecommendation(
                      {
                        status: 'Editado por farmacia',
                        text: recText,
                        pipelineStage: 'Revisión farmacéutica',
                        nextAction: 'Valorar envío a revisión médica',
                        eventLabel: 'Recomendación revisada por farmacia',
                      },
                      t('notice.recBorrador'),
                    )
                  }
                  onRequestData={() =>
                    void saveRecommendation(
                      {
                        status: currentCase.recommendation?.status ?? 'Borrador IA',
                        text: recText,
                        pipelineStage: 'Datos incompletos',
                        nextAction: 'Completar información antes de validar',
                        eventLabel: 'La recomendación se ha pausado por falta de datos',
                      },
                      t('notice.recPendienteDatos'),
                    )
                  }
                  onSendDigestivo={() =>
                    void saveRecommendation(
                      {
                        status: 'Pendiente de revisión médica',
                        text: recText,
                        pipelineStage: 'Revisión médica',
                        nextAction: 'Revisión médica del caso',
                        eventLabel: 'Recomendación enviada a revisión médica',
                      },
                      t('notice.recRevisionMedica'),
                    )
                  }
                  onSendSession={() =>
                    void saveRecommendation(
                      {
                        status: 'Pendiente de revisión médica',
                        text: recText,
                        pipelineStage: 'Discusión en red',
                        nextAction: 'Preparar discusión en red',
                        eventLabel: 'Recomendación escalada a sesión de red',
                      },
                      t('notice.recSesion'),
                    )
                  }
                  onReject={() =>
                    void saveRecommendation(
                      {
                        status: 'Rechazado',
                        text: recText,
                        nextAction: 'Reformular propuesta con validación humana',
                        eventLabel: 'Recomendación rechazada y devuelta a revisión',
                      },
                      t('notice.recRechazada'),
                    )
                  }
                />
                <div className="my-6 border-t border-slate-100" />
                <TabInforme
                  caso={currentCase}
                  program={program}
                  noteText={noteText}
                  onNoteChange={setNoteText}
                  busy={actionBusy === 'note' || actionBusy === 'note:generate'}
                  onGenerateDraft={() => void generateNoteDraft()}
                  onSaveDraft={() =>
                    void saveNote(
                      {
                        status: currentCase.clinicalNote?.status || 'Borrador',
                        text: noteText,
                        eventLabel: 'Borrador de informe guardado manualmente',
                      },
                      t('notice.informeGuardado'),
                    )
                  }
                  onRequestCovalidation={() =>
                    void saveNote(
                      {
                        status: 'Pendiente de co-validación',
                        text: noteText,
                        pipelineStage: 'Informe generado',
                        nextAction: 'Co-validación clínica del informe',
                        eventLabel: 'Informe enviado a co-validación',
                      },
                      t('notice.informeCovalidacion'),
                    )
                  }
                  onSendToEhr={() =>
                    void saveNote(
                      {
                        status: 'Registrado en HCE',
                        text: noteText,
                        pipelineStage: 'Registrado en HCE',
                        nextAction: 'Programar seguimiento a 4 semanas',
                        eventLabel: 'Informe registrado en HCE',
                      },
                      t('notice.informeHce'),
                    )
                  }
                  onExportPdf={openPrintableNote}
                />
                </>
              )}
              {activeTab === 'flujo' && (
                <div className="lg:hidden">
                  <PipelinePanel
                    caso={currentCase}
                    actionBusy={actionBusy}
                    inline
                  />
                </div>
              )}
              {activeTab === 'actividad' && (
                <>
                  <TabTimeline caso={currentCase} />
                  <div className="my-6 border-t border-slate-100" />
                  <TabAprendizaje
                    caso={currentCase}
                    busyKey={actionBusy}
                    onRegisterFollowUp={(plan) =>
                      void saveFollowUp(
                        {
                          label: plan.label,
                          status: plan.status ?? 'Programado',
                          dueDate: plan.dueDate,
                          controlType: plan.controlType,
                          rationale: plan.rationale,
                          intervalDays: plan.intervalDays,
                          pipelineStage: plan.label,
                          nextAction: `Esperar ${plan.label.toLowerCase()}`,
                          eventLabel: `${plan.label} programado`,
                        },
                        t('notice.followupProgramado').replaceAll('{plan}', plan.label.toLowerCase()),
                      )
                    }
                    onCompleteFollowUp={(label) =>
                      void saveFollowUp(
                        {
                          label,
                          status: 'Completado',
                          nextAction: 'Registrar resultado y lección aprendida',
                          eventLabel: `${label} completado`,
                        },
                        t('notice.followupCompletado').replaceAll('{label}', label),
                      )
                    }
                    nextFollowupDate={nextFollowupDate}
                  />
                  <div className="my-6 border-t border-slate-100" />
                  <TabAuditoria caso={currentCase} />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right column: pipeline panel */}
        <PipelinePanel
          caso={currentCase}
          actionBusy={actionBusy}
        />
      </div>

      {editorOpen ? (
        <CaseEditorSheet
          draft={editorDraft}
          entrySource={currentCase.entrySource}
          emailOriginal={currentCase.emailOriginal}
          onChange={setEditorDraft}
          onClose={() => setEditorOpen(false)}
          onSave={saveEditor}
          saving={editorSaving}
          error={editorError}
        />
      ) : null}

      {closeOutcomeOpen ? (
        <CloseOutcomeSheet
          draft={closeOutcomeDraft}
          saving={actionBusy === 'transition:Caso cerrado con outcome registrado'}
          onClose={() => setCloseOutcomeOpen(false)}
          onChange={setCloseOutcomeDraft}
          onSave={() =>
            void transitionCase(
              {
                pipelineStage: 'Cerrado con resultado',
                nextAction: 'Caso cerrado con outcome registrado',
                eventLabel: 'Caso cerrado con outcome registrado',
                caseOutcome: closeOutcomeDraft,
              },
              t('notice.casoCerrado'),
            ).then((updated) => {
              if (updated) setCloseOutcomeOpen(false)
            })
          }
        />
      ) : null}

      <ActionConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={t('dialog.eliminar.title').replaceAll('{caseId}', currentCase.caseId)}
        description={t('dialog.eliminar.descripcion').replaceAll('{title}', currentCase.title)}
        confirmLabel={t('dialog.eliminar.confirmar')}
        cancelLabel={t('dialog.cancelar')}
        tone="danger"
        icon={<Trash2 className="h-5 w-5" />}
        confirmBusy={actionBusy === 'delete'}
        onConfirm={() => void deleteCurrentCase()}
      />
	    </div>
	  )
}
