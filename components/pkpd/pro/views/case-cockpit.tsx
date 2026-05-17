'use client'

import {
  Activity, AlertTriangle, ArrowLeft, BookOpen, Bot, CheckCircle2, ChevronDown,
  Clock, ClipboardEdit, Droplet, Eye, FileText, FlaskConical, LayoutDashboard,
  MessageCircle, MessageSquareText, Microscope, PencilLine, Pill, Plus, RefreshCw,
  Save, Shield, Sparkles, Stethoscope, TrendingUp, Users, X, Zap,
} from 'lucide-react'
import React, { useEffect, useState } from 'react'

import { PkpdSimulationChart } from '@/components/pkpd/pro/charts/pkpd-simulation-chart'
import { TimelineLaneOverview } from '@/components/pkpd/pro/charts/timeline-lane-overview'
import type { CasoCompleto } from '@/components/pkpd/pro/xarxa-types'
import { PIPELINE_STAGES, PRIORITY_STYLE, SEVERITY_STYLE, STAGE_STYLE } from '@/components/pkpd/pro/xarxa-types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { fetchJson } from '@/lib/fetch-json'

type Tab =
  | 'resumen' | 'datos' | 'analisis' | 'recomendacion' | 'actividad'

const TABS: Array<{ id: Tab; label: string; icon: React.ElementType }> = [
  { id: 'resumen',       label: 'Resumen y Gaps',       icon: LayoutDashboard },
  { id: 'datos',         label: 'Datos',                icon: FlaskConical },
  { id: 'analisis',      label: 'Análisis y Sim.',      icon: TrendingUp },
  { id: 'recomendacion', label: 'Recomendación',        icon: MessageSquareText },
  { id: 'actividad',     label: 'Actividad',            icon: Clock },
]

const LANE_COLORS: Record<string, string> = {
  Clínica: 'bg-violet-100 text-violet-700',
  Tratamiento: 'bg-blue-100 text-blue-700',
  Laboratorio: 'bg-teal-100 text-teal-700',
  Administración: 'bg-slate-100 text-slate-600',
  Decisiones: 'bg-amber-100 text-amber-700',
  Tareas: 'bg-orange-100 text-orange-700',
}

const LANE_DOT_RING: Record<string, string> = {
  Clínica:        'ring-violet-300',
  Tratamiento:    'ring-blue-300',
  Laboratorio:    'ring-teal-300',
  Administración: 'ring-slate-300',
  Decisiones:     'ring-amber-300',
  Tareas:         'ring-orange-300',
}

const RECOMMENDATION_STATUS: Record<string, { style: string; label: string }> = {
  'Borrador IA': { style: 'bg-slate-100 text-slate-600', label: 'Borrador generado por IA' },
  'Editado por farmacia': { style: 'bg-blue-50 text-blue-700', label: 'Editado por farmacia' },
  'Pendiente de revisión médica': { style: 'bg-amber-50 text-amber-700', label: 'Pendiente de revisión médica' },
  Validado: { style: 'bg-green-50 text-green-700', label: 'Validado' },
  Rechazado: { style: 'bg-red-50 text-red-700', label: 'Rechazado' },
}

const NOTE_STATUS: Record<string, { style: string }> = {
  Borrador: { style: 'bg-slate-100 text-slate-600' },
  'Informe generado': { style: 'bg-teal-50 text-teal-700' },
  'Pendiente de co-validación': { style: 'bg-amber-50 text-amber-700' },
  Validado: { style: 'bg-green-50 text-green-700' },
  'Registrado en HCE': { style: 'bg-emerald-50 text-emerald-700' },
}

const DEMO_ACTOR = {
  actorName: 'Farmacéutico referente',
  actorRole: 'Farmacéutico experto',
  actorCenter: 'H.U. Bellvitge',
  actorType: 'human',
} as const

type Props = {
  caso: CasoCompleto
  onBack: () => void
  onCaseUpdated?: (caso: CasoCompleto) => void | Promise<void>
}

export function CaseCockpit({ caso, onBack, onCaseUpdated }: Props) {
  const [currentCase, setCurrentCase] = useState(caso)
  const [activeTab, setActiveTab] = useState<Tab>('resumen')
  const [recText, setRecText] = useState(caso.recommendation?.text ?? '')
  const [noteText, setNoteText] = useState(caso.clinicalNote?.text ?? '')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorSaving, setEditorSaving] = useState(false)
  const [editorError, setEditorError] = useState<string | null>(null)
  const [editorDraft, setEditorDraft] = useState(() => buildEditorDraft(caso))
  const [actionBusy, setActionBusy] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionNotice, setActionNotice] = useState<string | null>(null)

  useEffect(() => {
    setCurrentCase(caso)
    setRecText(caso.recommendation?.text ?? '')
    setNoteText(caso.clinicalNote?.text ?? '')
    setEditorDraft(buildEditorDraft(caso))
  }, [caso])

  const stageIndex = PIPELINE_STAGES.findIndex((s) => s === currentCase.pipelineStage)
  const criticalGaps = currentCase.gaps?.filter((g) => g.severity === 'Crítico') ?? []
  const totalGaps = currentCase.gaps?.length ?? 0

  function openEditor() {
    setEditorDraft(buildEditorDraft(currentCase))
    setEditorError(null)
    setEditorOpen(true)
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
        ? ` La etapa ha cambiado de «${currentCase.pipelineStage}» a «${updated.pipelineStage}».`
        : ''
      setActionNotice(`${successMessage}${stageMessage}`)
      await onCaseUpdated?.(updated)
      return updated
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'No se ha podido completar la acción solicitada.')
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
          clinicalSummary: editorDraft.clinicalSummary,
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
            interpretation: item.interpretation || null,
          })),
        }),
      })

      setCurrentCase(updated)
      setRecText(updated.recommendation?.text ?? '')
      const stageChanged = updated.pipelineStage !== currentCase.pipelineStage
      setActionNotice(
        stageChanged
          ? `Los datos clínicos se han guardado y la etapa ha cambiado de «${currentCase.pipelineStage}» a «${updated.pipelineStage}» tras reevaluar gaps y determinantes.`
          : 'Los datos clínicos se han guardado y el workflow se ha reevaluado.'
      )
      await onCaseUpdated?.(updated)
      setEditorOpen(false)
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : 'No se han podido guardar los cambios clínicos.')
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
      'Se ha generado un borrador de informe HCE.',
    )
  }

  async function orchestrateCase() {
    setActiveTab('resumen')
    return runCaseMutation(
      'orchestrate',
      `/api/xarxa/cases/${currentCase.caseId}/orchestrate`,
      { method: 'POST' },
      'El sistema ha preparado el paquete automático del caso para validación humana.',
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

  function openPrintableNote() {
    void (async () => {
      setActionBusy('note:pdf')
      setActionError(null)
      setActionNotice(null)

      try {
        const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')
        const noteBody = noteText || currentCase.clinicalNote?.text || 'Sin contenido disponible.'
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
          `${currentCase.caseId} · Informe HCE`,
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

        addSectionTitle('Estado del informe')
        addWrappedText(currentCase.clinicalNote?.status || 'Borrador', { size: 11, gapAfter: 18 })

        addSectionTitle('Texto del informe')
        addWrappedText(noteBody, { size: 11, gapAfter: 18 })

        addSectionTitle('Aviso')
        addWrappedText(
          'Documento generado desde Xarxa PK/PD Intelligence Hub. Requiere validación profesional antes de registro definitivo en HCE.',
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
        setActionNotice('Se ha descargado el informe HCE en PDF.')
      } catch (error) {
        setActionError(
          error instanceof Error
            ? error.message
            : 'No se ha podido generar el PDF del informe.'
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
        'Se ha activado la solicitud de datos para este gap.',
      )
      return
    }

    await transitionCase(
      {
        pipelineStage: 'Datos incompletos',
        nextAction: 'Solicitar datos al centro solicitante',
        eventLabel: `Gap marcado para completar: ${gapLabel}`,
      },
      'El caso queda pendiente de completar datos.',
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
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex-1 min-w-0">
            <button
              onClick={onBack}
              className="mb-2 flex items-center gap-1.5 text-xs text-[#4a7068] hover:text-[#7b3fa0]"
            >
              <ArrowLeft className="h-3 w-3" /> Volver a casos
            </button>
            <div className="flex flex-wrap items-center gap-2">
	              <span className="text-xs font-semibold text-[#7b3fa0]">{currentCase.caseId}</span>
	              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${PRIORITY_STYLE[currentCase.priority] ?? 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'}`}>
	                {currentCase.priority}
	              </span>
	              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${STAGE_STYLE[currentCase.pipelineStage] ?? 'bg-slate-100 text-slate-600'}`}>
	                {currentCase.pipelineStage}
	              </span>
	              <Badge className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] text-slate-600">{currentCase.caseType}</Badge>
	            </div>
	            <h2 className="mt-1 text-xl font-semibold text-[#152520]">{currentCase.title}</h2>
	            <p className="mt-0.5 text-sm text-[#4a7068]">
	              {currentCase.patientCode}
                {currentCase.patientProfile?.age ? ` · ${currentCase.patientProfile.age}a` : ''}
                {currentCase.patientProfile?.sex ? ` · ${currentCase.patientProfile.sex}` : ''}
                {' · '}
                {currentCase.centerName} · Solicitante: {currentCase.requesterName}
	            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[#4a7068]"><span className="font-medium text-[#152520]">Siguiente paso:</span> {currentCase.nextAction}</span>
              {criticalGaps.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 ring-1 ring-red-200">
                  <AlertTriangle className="h-3 w-3" />
                  {criticalGaps.length} crítico{criticalGaps.length > 1 ? 's' : ''}
                </span>
              )}
              {totalGaps > criticalGaps.length && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
                  {totalGaps - criticalGaps.length} gap{totalGaps - criticalGaps.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <StageActions
              caso={currentCase}
              actionBusy={actionBusy}
              onOrchestrate={() => void orchestrateCase()}
              onEdit={openEditor}
              onGenerateNote={() => void generateNoteDraft()}
              onRequestData={() =>
                void transitionCase(
                  { pipelineStage: 'Datos incompletos', nextAction: 'Completar determinantes pendientes', eventLabel: 'Se solicita completar datos clínicos y determinantes' },
                  'El caso se ha devuelto para completar datos.',
                )
              }
              onMarkSession={() =>
                void transitionCase(
                  { pipelineStage: 'Discusión en red', nextAction: 'Preparar resumen para sesión de red', eventLabel: 'Caso marcado para sesión de red' },
                  'El caso se ha marcado para sesión de red.',
                )
              }
              onClose={() =>
                void transitionCase(
                  { pipelineStage: 'Cerrado con resultado', nextAction: 'Caso cerrado', eventLabel: 'Caso cerrado manualmente' },
                  'El caso se ha cerrado en el flujo demo.',
                )
              }
            />
          </div>
        </div>
      </div>

      {/* Tabs + content + pipeline panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left column: tabs + scrollable content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-slate-200 bg-white px-6">
            <div className="flex overflow-x-auto">
              {TABS.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-semibold tracking-wide transition ${
                      isActive
                        ? 'border-[#7b3fa0] text-[#7b3fa0]'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
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
                    onConfirm={() =>
                      void transitionCase(
                        {
                          pipelineStage: 'Determinantes recibidos',
                          nextAction: 'Revisión farmacéutica',
                          eventLabel: 'Caso confirmado para revisión farmacéutica',
                        },
                        'El caso ha avanzado a revisión farmacéutica.',
                      )
                    }
                    onRequestData={() =>
                      void transitionCase(
                        {
                          pipelineStage: 'Datos incompletos',
                          nextAction: 'Completar determinantes críticos',
                          eventLabel: 'Se han solicitado datos adicionales para la revisión',
                        },
                        'Se han solicitado datos adicionales para el caso.',
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
                        'La tarea se ha marcado como resuelta.',
                      )
                    }
                    onStartTask={(taskId) =>
                      void updateTask(
                        taskId,
                        { status: 'En curso', eventLabel: 'Tarea puesta en curso' },
                        'La tarea queda en curso.',
                      )
                    }
                  />
                </>
              )}
              {activeTab === 'datos' && <TabDatos caso={currentCase} onEdit={openEditor} />}
              {activeTab === 'analisis' && (
                <>
                  <TabAnalisis caso={currentCase} />
                  <div className="my-6 border-t border-slate-100" />
                  <TabSimulacion caso={currentCase} />
                </>
              )}
              {activeTab === 'recomendacion' && (
                <>
                <TabRecomendacion
                  caso={currentCase}
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
                      'La recomendación se ha guardado como borrador revisado.',
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
                      'La recomendación queda pendiente de más datos.',
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
                      'La recomendación se ha enviado a revisión médica.',
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
                      'La recomendación se ha escalado a la sesión de red.',
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
                      'La recomendación se ha marcado como rechazada.',
                    )
                  }
                />
                <div className="my-6 border-t border-slate-100" />
                <TabInforme
                  caso={currentCase}
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
                      'Se han guardado los cambios del informe.',
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
                      'El informe se ha enviado a co-validación.',
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
                      'El informe se ha marcado como registrado en HCE.',
                    )
                  }
                  onExportPdf={openPrintableNote}
                />
                </>
              )}
              {activeTab === 'actividad' && (
                <>
                  <TabTimeline caso={currentCase} />
                  <div className="my-6 border-t border-slate-100" />
                  <TabAprendizaje
                    caso={currentCase}
                    busyKey={actionBusy}
                    onRegisterFollowUp={(label, dueDate) =>
                      void saveFollowUp(
                        {
                          label,
                          status: 'Programado',
                          dueDate,
                          pipelineStage: label,
                          nextAction: `Esperar ${label.toLowerCase()}`,
                          eventLabel: `${label} programado`,
                        },
                        `Se ha programado ${label.toLowerCase()}.`,
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
                        `${label} se ha marcado como completado.`,
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
          activeTab={activeTab}
          onJump={setActiveTab}
          actionBusy={actionBusy}
        />
      </div>

      {editorOpen ? (
        <CaseEditorSheet
          draft={editorDraft}
          onChange={setEditorDraft}
          onClose={() => setEditorOpen(false)}
          onSave={saveEditor}
          saving={editorSaving}
          error={editorError}
        />
      ) : null}
	    </div>
	  )
}

// ── Tab: Resumen ─────────────────────────────────────────────────────────────

function TabResumen({
  caso,
  onConfirm,
  onRequestData,
}: {
  caso: CasoCompleto
  onConfirm: () => void
  onRequestData: () => void
}) {
  const completeness = Math.round(
    ((caso.labDeterminants?.filter((d) => d.status === 'Confirmado').length ?? 0) /
      Math.max(caso.labDeterminants?.length ?? 1, 1)) * 100
  )
  return (
    <div className="space-y-5">
      {/* Summary card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#4a7068]">Resumen clínico</p>
          </div>
          <Sparkles className="h-5 w-5 shrink-0 text-[#7b3fa0]" />
        </div>
        <p className="mt-3 text-sm leading-7 text-[#152520]">{caso.clinicalSummary}</p>
      </div>

      {/* Status cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatusCard label="Completitud del caso" value={`${completeness}%`} note="Determinantes confirmados" color="teal" />
        <StatusCard label="Interpretabilidad PK/PD" value={caso.pkpdInterpretation?.confidence ?? '—'} note="Basada en datos disponibles" color="blue" />
        <StatusCard
          label="Riesgo clínico-operativo"
          value={caso.priority === 'Alta' ? 'Alto' : caso.priority === 'Media' ? 'Medio' : 'Bajo'}
          note={`Prioridad ${caso.priority}`}
          color={caso.priority === 'Alta' ? 'red' : 'amber'}
        />
        <StatusCard label="Gaps detectados" value={String(caso.gaps?.length ?? 0)} note={`${caso.gaps?.filter((g) => g.severity === 'Crítico').length ?? 0} críticos`} color="orange" />
      </div>

      {/* Critical gaps + next step */}
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        {(caso.gaps?.filter((g) => g.severity === 'Crítico') ?? []).length > 0 && (
          <div className="rounded-xl border border-red-100 bg-red-50/60 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-red-700">Gaps críticos</p>
            <div className="mt-3 space-y-2">
              {caso.gaps?.filter((g) => g.severity === 'Crítico').map((g, i) => (
                <p key={i} className="text-sm text-red-800">· {g.label}</p>
              ))}
            </div>
          </div>
        )}
        <div className="rounded-xl border border-[#7b3fa0]/20 bg-slate-50 p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#4a7068]">Siguiente paso</p>
          <p className="mt-2 text-base font-semibold text-[#152520]">{caso.nextAction}</p>
          {caso.tasks?.[0] && (
            <div className="mt-3 rounded-xl border border-[#7b3fa0]/20 bg-white px-3 py-2">
              <p className="text-xs text-[#4a7068]">Tarea pendiente: <span className="font-medium text-[#152520]">{caso.tasks[0].title}</span></p>
              <p className="text-xs text-[#4a7068]">Responsable: {caso.tasks[0].ownerRole}</p>
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <Button size="sm" className="rounded-xl bg-[#7b3fa0] text-xs text-white hover:bg-[#6a3490]" onClick={onConfirm}>Confirmar</Button>
            <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onRequestData}>Solicitar datos</Button>
          </div>
        </div>
      </div>

      {/* Agent runs */}
      {(caso.agentRuns ?? []).length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="h-4 w-4 text-[#7b3fa0]" />
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#4a7068]">Actividad de agentes</p>
          </div>
          <div className="space-y-2">
            {(caso.agentRuns ?? []).map((run, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
                <span className="shrink-0 rounded-full bg-[#7b3fa0]/10 px-2 py-0.5 text-[10px] text-[#7b3fa0]">{run.agent}</span>
                <span className="text-[#152520]">{run.message}</span>
                <span className="ml-auto shrink-0 text-xs text-slate-400">{new Date(run.timestamp).toLocaleDateString('es-ES')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatusCard({ label, value, note, color }: { label: string; value: string; note: string; color: string }) {
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

function StageActions({
  caso,
  actionBusy,
  onOrchestrate,
  onEdit,
  onGenerateNote,
  onRequestData,
  onMarkSession,
  onClose,
}: {
  caso: CasoCompleto
  actionBusy: string | null
  onOrchestrate: () => void
  onEdit: () => void
  onGenerateNote: () => void
  onRequestData: () => void
  onMarkSession: () => void
  onClose: () => void
}) {
  const stage = caso.pipelineStage

  const earlyStages = ['Solicitud recibida', 'Caso creado por IA', 'Datos incompletos', 'Pendiente de determinantes', 'Determinantes recibidos']
  const analysisStages = ['Análisis PK/PD generado', 'Revisión farmacéutica']
  const reviewStages = ['Revisión médica', 'Discusión en red']
  const reportStages = ['Informe generado', 'Informe validado']
  const closedStages = ['Registrado en HCE', 'Seguimiento 4 semanas', 'Seguimiento 8 semanas', 'Cerrado con resultado']

  if (closedStages.includes(stage)) {
    return (
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onEdit}>
          <PencilLine className="mr-1.5 h-3.5 w-3.5" /> Editar datos
        </Button>
      </div>
    )
  }

  if (reportStages.includes(stage)) {
    return (
      <div className="flex gap-2">
        <Button size="sm" className="rounded-xl bg-[#7b3fa0] text-xs text-white hover:bg-[#6a3490]" onClick={onGenerateNote} disabled={actionBusy === 'note:generate'}>
          <FileText className="mr-1.5 h-3.5 w-3.5" /> Generar informe
        </Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onEdit}>
          <PencilLine className="mr-1.5 h-3.5 w-3.5" /> Editar
        </Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs text-slate-500" onClick={onClose}>Cerrar caso</Button>
      </div>
    )
  }

  if (reviewStages.includes(stage)) {
    return (
      <div className="flex gap-2">
        <Button size="sm" className="rounded-xl bg-[#7b3fa0] text-xs text-white hover:bg-[#6c348f]" onClick={onOrchestrate} disabled={actionBusy === 'orchestrate'}>
          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          {actionBusy === 'orchestrate' ? 'Actualizando…' : 'Actualizar paquete'}
        </Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onGenerateNote} disabled={actionBusy === 'note:generate'}>
          <FileText className="mr-1.5 h-3.5 w-3.5" /> Informe
        </Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs text-slate-500" onClick={onClose}>Cerrar</Button>
      </div>
    )
  }

  if (analysisStages.includes(stage)) {
    return (
      <div className="flex gap-2">
        <Button size="sm" className="rounded-xl bg-[#7b3fa0] text-xs text-white hover:bg-[#6c348f]" onClick={onOrchestrate} disabled={actionBusy === 'orchestrate'}>
          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          {actionBusy === 'orchestrate' ? 'Actualizando…' : 'Actualizar paquete'}
        </Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onEdit}>
          <PencilLine className="mr-1.5 h-3.5 w-3.5" /> Editar datos
        </Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onMarkSession}>Sesión de red</Button>
      </div>
    )
  }

  // earlyStages + fallback
  return (
    <div className="flex gap-2">
      <Button size="sm" className="rounded-xl bg-[#7b3fa0] text-xs text-white hover:bg-[#6c348f]" onClick={onOrchestrate} disabled={actionBusy === 'orchestrate'}>
        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
        {actionBusy === 'orchestrate' ? 'Actualizando…' : 'Actualizar paquete'}
      </Button>
      <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onEdit}>
        <PencilLine className="mr-1.5 h-3.5 w-3.5" /> Editar datos
      </Button>
      <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onRequestData}>Solicitar datos</Button>
    </div>
  )
}

// ── Tab: Timeline (swim lanes) ────────────────────────────────────────────────

const LANE_ORDER = ['Clínica', 'Tratamiento', 'Laboratorio', 'Decisiones', 'Tareas', 'Administración']

const LANE_ICON_COMPONENT: Record<string, React.ElementType> = {
  Clínica:        Stethoscope,
  Tratamiento:    Pill,
  Laboratorio:    FlaskConical,
  Decisiones:     Zap,
  Tareas:         CheckCircle2,
  Administración: ClipboardEdit,
}

const LANE_DOT_ICON_COLOR: Record<string, string> = {
  Clínica:        'text-violet-500',
  Tratamiento:    'text-blue-500',
  Laboratorio:    'text-teal-500',
  Decisiones:     'text-amber-500',
  Tareas:         'text-orange-500',
  Administración: 'text-slate-400',
}

const EVENT_TYPE_ICON_COMPONENT: Record<string, React.ElementType> = {
  'Solicitud':             FileText,
  'Estado':                RefreshCw,
  'Recomendación':         MessageCircle,
  'Informe':               FileText,
  'Informe HCE':           FileText,
  'Inicio de tratamiento': Pill,
  'Determinante recibido': FlaskConical,
  'Seguimiento':           Eye,
  'Análisis':              TrendingUp,
  'Biomarcador':           Microscope,
  'Diagnóstico':           Stethoscope,
  'Extracción':            Droplet,
  'Sesión':                Users,
  'Administración':        ClipboardEdit,
}

function TabTimeline({ caso }: { caso: CasoCompleto }) {
  const [activeLane, setActiveLane] = useState<string | null>(null)
  const sorted = [...(caso.timeline ?? [])].sort((a, b) => a.date.localeCompare(b.date))
  const presentLanes = LANE_ORDER.filter((l) => sorted.some((e) => e.lane === l))
  const filtered = activeLane ? sorted.filter((e) => e.lane === activeLane) : sorted

  const agentLanes = new Set(['Decisiones', 'Tareas'])
  const groupedByDay = filtered.reduce<Array<{ day: string; items: typeof filtered }>>((groups, event) => {
    const day = new Date(event.date).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    const existing = groups.find((group) => group.day === day)
    if (existing) {
      existing.items.push(event)
      return groups
    }
    groups.push({ day, items: [event] })
    return groups
  }, [])
  const latestEvent = filtered[filtered.length - 1]

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_320px]">
        <TimelineLaneOverview timeline={sorted} />
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#4a7068]">Foco actual</p>
          <p className="mt-1 text-sm font-semibold text-[#152520]">
            {activeLane ? `Leyendo solo la pista «${activeLane}»` : 'Vista completa del recorrido del caso'}
          </p>
          <p className="mt-2 text-sm leading-6 text-[#4a7068]">
            {activeLane
              ? 'Úsalo para revisar una sola dimensión clínica sin ruido del resto del caso.'
              : 'Empieza por el conjunto y después baja a la pista que quieras validar con más detalle.'}
          </p>

          <div className="mt-4 rounded-2xl border border-slate-100 bg-[#f8faf9] p-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#4a7068]">Último hito</p>
            {latestEvent ? (
              <>
                <p className="mt-1 text-sm font-semibold text-[#152520]">{latestEvent.label}</p>
                <p className="mt-1 text-xs text-[#4a7068]">
                  {latestEvent.lane} · {new Date(latestEvent.date).toLocaleString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-[#4a7068]">Todavía no hay eventos registrados en esta vista.</p>
            )}
          </div>
        </div>
      </div>

      {/* Lane filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveLane(null)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            activeLane === null
              ? 'bg-slate-800 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Todas las pistas
        </button>
        {presentLanes.map((lane) => (
          <button
            key={lane}
            onClick={() => setActiveLane(activeLane === lane ? null : lane)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
              activeLane === lane
                ? `${LANE_COLORS[lane] ?? 'bg-slate-100 text-slate-600'} ring-2 ring-offset-1`
                : `${LANE_COLORS[lane] ?? 'bg-slate-100 text-slate-600'} opacity-60 hover:opacity-100`
            }`}
          >
            {(() => { const LI = LANE_ICON_COMPONENT[lane]; return LI ? <LI className="h-3 w-3" /> : null })()}
            {lane}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-5">
        {groupedByDay.map((group) => (
          <div key={group.day} className="rounded-2xl border border-slate-100 bg-[#fbfcfb] p-4">
            <div className="mb-3 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <p className="text-sm font-semibold capitalize text-[#152520]">{group.day}</p>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] text-[#4a7068]">
                {group.items.length} eventos
              </span>
            </div>

            <div className="relative">
              <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-slate-200" />
              <div className="space-y-2">
                {group.items.map((event, i) => {
                  const isAgent = agentLanes.has(event.lane)
                  return (
                    <div key={`${group.day}-${i}`} className="relative flex items-start gap-4 pl-[60px]">
                      {(() => {
                        const DotIcon = EVENT_TYPE_ICON_COMPONENT[event.type] ?? LANE_ICON_COMPONENT[event.lane] ?? Activity
                        const dotColor = LANE_DOT_ICON_COLOR[event.lane] ?? 'text-slate-400'
                        return (
                          <div className={`absolute left-[4px] top-[10px] flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white shadow-md ring-2 ${LANE_DOT_RING[event.lane] ?? 'ring-slate-200'}`}>
                            <DotIcon className={`h-4 w-4 ${dotColor}`} />
                          </div>
                        )
                      })()}

                      <div
                        className={`flex-1 rounded-xl border px-4 py-3 ${
                          isAgent ? 'border-[#7b3fa0]/20 bg-[#faf6fd]' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${LANE_COLORS[event.lane] ?? 'bg-slate-100 text-slate-600'}`}>
                              {event.lane}
                            </span>
                            {isAgent && (
                              <span className="rounded-full bg-[#7b3fa0]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#7b3fa0]">IA</span>
                            )}
                            <span className="text-[10px] text-slate-400">{event.type}</span>
                          </div>
                          <span className="shrink-0 text-[10px] text-slate-400">
                            {new Date(event.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-medium text-[#152520]">{event.label}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-6 text-center text-sm text-slate-400">No hay eventos en esta pista.</p>
      )}
    </div>
  )
}

// ── Tab: Datos y determinantes ────────────────────────────────────────────────

function TabDatos({ caso, onEdit }: { caso: CasoCompleto; onEdit: () => void }) {
  const statusIcon: Record<string, string> = {
    Confirmado: '✓',
    'Extraído por IA': '✦',
    Pendiente: '○',
    Faltante: '○',
    Conflictivo: '⚠',
  }
  const statusStyle: Record<string, string> = {
    Confirmado: 'text-green-700 bg-green-50',
    'Extraído por IA': 'text-[#7b3fa0] bg-teal-50',
    Pendiente: 'text-amber-700 bg-amber-50',
    Faltante: 'text-slate-500 bg-slate-100',
    Conflictivo: 'text-red-700 bg-red-50',
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button size="sm" className="rounded-xl bg-[#7b3fa0] text-xs text-white hover:bg-[#6a3490]" onClick={onEdit}>
          <PencilLine className="mr-1.5 h-3.5 w-3.5" />
          Abrir editor
        </Button>
      </div>

      {/* Patient context */}
      <Section title="Paciente" icon={Users}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <InfoField label="Código" value={caso.patientCode} />
          <InfoField label="Edad" value={caso.patientProfile?.age != null ? String(caso.patientProfile.age) : '—'} />
          <InfoField label="Sexo" value={caso.patientProfile?.sex || '—'} />
          <InfoField label="Peso" value={caso.patientProfile?.weightKg != null ? `${caso.patientProfile.weightKg} kg` : '—'} />
          <InfoField label="Altura" value={caso.patientProfile?.heightCm != null ? `${caso.patientProfile.heightCm} cm` : '—'} />
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
      <Section title="Enfermedad" icon={Activity}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(caso.diseaseContext ?? {}).map(([k, v]) => (
            <InfoField key={k} label={k} value={String(v)} />
          ))}
        </div>
      </Section>

      {/* Therapy context */}
      <Section title="Tratamiento actual" icon={Shield}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(caso.therapyContext ?? {}).map(([k, v]) => (
            <InfoField key={k} label={k} value={v != null ? String(v) : '—'} />
          ))}
        </div>
      </Section>

      {/* Lab determinants */}
      <Section title="Determinantes PK/PD" icon={FlaskConical}>
        <div className="grid gap-3 lg:grid-cols-2">
          {(caso.labDeterminants ?? []).map((det, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-[#152520]">{det.label}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyle[det.status] ?? 'bg-slate-100 text-slate-600'}`}>
                  {statusIcon[det.status] ?? ''} {det.status}
                </span>
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
              <p className="mt-1 text-[10px] text-slate-400">Fuente: {det.source}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-slate-400 italic">✦ Extraído por IA · ✓ Confirmado por profesional · ○ Pendiente de validar</p>
      </Section>
    </div>
  )
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#4a7068]">{humanizeFieldLabel(label)}</p>
      <p className="mt-0.5 text-sm font-medium text-[#152520]">{value}</p>
    </div>
  )
}

// ── Tab: Gaps y tareas ────────────────────────────────────────────────────────

function TabGaps({
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
  const taskStatusStyle: Record<string, string> = {
    Pendiente: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    'En curso': 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    Resuelta: 'bg-green-50 text-green-700 ring-1 ring-green-200',
    Bloqueada: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  }

  const GAP_CARD: Record<string, { border: string; bg: string; icon: string; badge: string }> = {
    Crítico:    { border: 'border-red-200',    bg: 'bg-red-50',    icon: 'text-red-500',    badge: 'bg-red-600 text-white' },
    Importante: { border: 'border-amber-200',  bg: 'bg-amber-50',  icon: 'text-amber-500',  badge: 'bg-amber-500 text-white' },
    Informativo:{ border: 'border-blue-200',   bg: 'bg-blue-50',   icon: 'text-blue-500',   badge: 'bg-blue-500 text-white' },
  }

  const orderedGaps = [...(caso.gaps ?? [])].sort((a, b) => {
    const order = { Crítico: 0, Importante: 1, Informativo: 2 }
    return (order[a.severity as keyof typeof order] ?? 3) - (order[b.severity as keyof typeof order] ?? 3)
  })

  return (
    <div className="space-y-5">
      <Section title="Gaps detectados" icon={AlertTriangle}>
        {orderedGaps.length === 0 ? (
          <p className="text-sm text-[#4a7068]">No se han detectado gaps en este caso.</p>
        ) : (
          <div className="space-y-2">
            {orderedGaps.map((gap, i) => {
              const style = GAP_CARD[gap.severity] ?? { border: 'border-slate-200', bg: 'bg-white', icon: 'text-slate-400', badge: 'bg-slate-100 text-slate-600' }
              const isCritical = gap.severity === 'Crítico'
              return (
                <div key={i} className={`flex items-start gap-3 rounded-xl border ${style.border} ${style.bg} px-4 py-3`}>
                  <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${style.icon} ${isCritical ? 'animate-pulse' : ''}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.badge}`}>
                        {gap.severity}
                      </span>
                      <p className="text-sm font-semibold text-[#152520]">{gap.label}</p>
                    </div>
                    <p className="mt-1 text-xs text-[#4a7068]">{gap.status}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 rounded-xl text-xs"
                    onClick={() => onRequestGap(gap.label)}
                    disabled={busyKey !== null}
                  >
                    Solicitar
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </Section>

      <Section title="Tareas" icon={ClipboardEdit}>
        <div className="space-y-3">
          {(caso.tasks ?? []).map((task, i) => {
            const isResolved = task.status === 'Resuelta'
            const isInProgress = task.status === 'En curso'
            return (
              <div key={i} className={`flex items-start gap-4 rounded-xl border p-4 ${isResolved ? 'border-green-100 bg-green-50/40' : 'border-slate-200 bg-white'}`}>
                <div className="mt-0.5 shrink-0">
                  {isResolved ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : isInProgress ? (
                    <Activity className="h-5 w-5 text-blue-500" />
                  ) : (
                    <ClipboardEdit className="h-5 w-5 text-amber-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`font-medium ${isResolved ? 'text-slate-400 line-through' : 'text-[#152520]'}`}>{task.title}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${taskStatusStyle[task.status] ?? 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'}`}>
                      {task.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#4a7068]">
                    Responsable: <span className="font-medium">{task.ownerRole}</span>
                    {task.dueDate && <> · Fecha límite: {new Date(task.dueDate).toLocaleDateString('es-ES')}</>}
                    {task.createdBy && <> · Creado por: {task.createdBy}</>}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    className="rounded-xl bg-emerald-600 text-xs text-white hover:bg-emerald-700"
                    onClick={() => onResolveTask(task.taskId)}
                    disabled={isResolved || busyKey !== null}
                  >
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                    Resuelta
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl text-xs"
                    onClick={() => onStartTask(task.taskId)}
                    disabled={isInProgress || busyKey !== null}
                  >
                    En curso
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </Section>
    </div>
  )
}

// ── Tab: Análisis PK/PD ───────────────────────────────────────────────────────

function TabAnalisis({ caso }: { caso: CasoCompleto }) {
  const interpretation = caso.pkpdInterpretation
  const det = caso.labDeterminants ?? []
  const confirmed = det.filter((d) => d.status === 'Confirmado').length
  const total = det.length || 1
  const completeness = Math.round((confirmed / total) * 100)
  const confidenceDimensions = [
    { label: 'Completitud de determinantes', pct: completeness },
    { label: 'Interpretabilidad PK/PD', pct: interpretation?.confidence === 'Alta' ? 90 : interpretation?.confidence === 'Media' ? 65 : 40 },
    { label: 'Coherencia de datos', pct: Math.min(100, completeness + 10) },
  ]

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[#7b3fa0]/20 bg-slate-50 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#4a7068]">Patrón sugerido</p>
            <p className="mt-1 text-xl font-semibold text-[#152520]">{interpretation?.pattern ?? '—'}</p>
          </div>
          <TrendingUp className="h-6 w-6 shrink-0 text-[#7b3fa0]" />
        </div>
        <p className="mt-3 text-sm leading-7 text-[#152520]">{interpretation?.summary}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Confianza del análisis" icon={Shield}>
          <div className="space-y-3">
            {confidenceDimensions.map((dim) => (
              <div key={dim.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#152520]">{dim.label}</span>
                  <span className="text-[#4a7068]">{dim.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100">
                  <div className="h-1.5 rounded-full bg-[#7b3fa0]" style={{ width: `${dim.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Datos utilizados" icon={FlaskConical}>
          <div className="space-y-2">
            {(caso.labDeterminants ?? []).filter((d) => d.status === 'Confirmado').map((d, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-slate-100 bg-[#f8faf9] px-3 py-2 text-sm">
                <span className="text-[#4a7068]">{d.label}</span>
                <span className="font-semibold text-[#152520]">{String(d.value)} {d.unit ?? ''}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {det.filter((d) => d.status !== 'Confirmado').length > 0 && (
        <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-amber-700">Datos pendientes de confirmar</p>
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

function TabSimulacion({
  caso,
}: {
  caso: CasoCompleto
}) {
  return (
    <PkpdSimulationChart caso={caso} preferredScenario={caso.simulation?.preferredScenario ?? null} />
  )
}

// ── Tab: Recomendación ────────────────────────────────────────────────────────

function TabRecomendacion({
  caso,
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
  recText: string
  onRecChange: (v: string) => void
  busy: boolean
  onAcceptDraft: () => void
  onRequestData: () => void
  onSendDigestivo: () => void
  onSendSession: () => void
  onReject: () => void
}) {
  const rec = caso.recommendation
  const statusInfo = RECOMMENDATION_STATUS[rec?.status ?? ''] ?? { style: 'bg-slate-100 text-slate-600', label: rec?.status }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusInfo.style}`}>{statusInfo.label}</span>
      </div>

      <Section title="Propuesta del sistema" icon={Sparkles}>
        <textarea
          value={recText}
          onChange={(e) => onRecChange(e.target.value)}
          rows={5}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#152520] outline-none focus:border-[#7b3fa0]/40 focus:bg-white"
        />
      </Section>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" className="rounded-xl bg-[#7b3fa0] text-xs text-white hover:bg-[#6a3490]" onClick={onAcceptDraft} disabled={busy}>Aceptar como borrador</Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onRequestData} disabled={busy}>Solicitar más datos</Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onSendDigestivo} disabled={busy}>Enviar a digestivo</Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onSendSession} disabled={busy}>Enviar a sesión de red</Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs text-red-600 hover:bg-red-50" onClick={onReject} disabled={busy}>Rechazar y justificar</Button>
      </div>

      {(caso.gaps ?? []).filter((g) => g.status === 'Pendiente').length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-800">
          <p className="font-semibold">Datos pendientes antes de validar</p>
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

function TabInforme({
  caso,
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
  noteText: string
  onNoteChange: (value: string) => void
  busy: boolean
  onGenerateDraft: () => void
  onSaveDraft: () => void
  onRequestCovalidation: () => void
  onSendToEhr: () => void
  onExportPdf: () => void
}) {
  const note = caso.clinicalNote
  const statusInfo = NOTE_STATUS[note?.status ?? ''] ?? { style: 'bg-slate-100 text-slate-600' }

  const sections = [
    { label: 'Motivo de consulta', value: caso.caseType },
    { label: 'Fármaco y pauta', value: `${(caso.therapyContext as any)?.currentDrug ?? '—'} ${(caso.therapyContext as any)?.currentDose ?? ''} ${(caso.therapyContext as any)?.interval ?? ''}`.trim() },
    { label: 'Patrón PK/PD', value: caso.pkpdInterpretation?.pattern ?? '—' },
    { label: 'Farmacéutico validador', value: caso.assignedName },
    { label: 'Versión del protocolo', value: 'Crohn PK/PD v1.0' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusInfo.style}`}>{note?.status ?? 'Borrador'}</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => <InfoField key={s.label} label={s.label} value={s.value} />)}
      </div>

      <Section title="Texto del informe" icon={FileText}>
        <textarea
          value={noteText}
          onChange={(e) => onNoteChange(e.target.value)}
          rows={8}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#152520] outline-none focus:border-[#7b3fa0]/40 focus:bg-white"
        />
      </Section>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" className="rounded-xl bg-[#7b3fa0] text-xs text-white hover:bg-[#6a3490]" onClick={onGenerateDraft} disabled={busy}>
          <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Generar borrador automático
        </Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onSaveDraft} disabled={busy}>Guardar borrador</Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onExportPdf}>Descargar PDF</Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={onRequestCovalidation} disabled={busy}>Solicitar co-validación</Button>
        <Button size="sm" className="ml-auto rounded-xl bg-slate-900 text-xs text-white hover:bg-slate-800" onClick={onSendToEhr} disabled={busy}>Enviar a HCE</Button>
      </div>
    </div>
  )
}

// ── Tab: Aprendizaje ──────────────────────────────────────────────────────────

function TabAprendizaje({
  caso,
  busyKey,
  onRegisterFollowUp,
  onCompleteFollowUp,
  nextFollowupDate,
}: {
  caso: CasoCompleto
  busyKey: string | null
  onRegisterFollowUp: (label: string, dueDate: string) => void
  onCompleteFollowUp: (label: string) => void
  nextFollowupDate: (days: number) => string
}) {
  return (
    <div className="space-y-5">
      <Section title="Seguimiento programado" icon={Clock}>
        <div className="grid gap-3 sm:grid-cols-2">
          {(caso.followUps ?? []).map((fu, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
	              <p className="font-medium text-[#152520]">{fu.label}</p>
	              <p className="mt-1 text-xs text-[#4a7068]">Estado: {fu.status}</p>
	              {fu.dueDate && <p className="mt-1 text-xs text-[#7b3fa0]">Fecha: {new Date(fu.dueDate).toLocaleDateString('es-ES')}</p>}
	              <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 w-full rounded-xl text-xs"
                  onClick={() => onCompleteFollowUp(fu.label)}
                  disabled={busyKey !== null || fu.status === 'Completado'}
                >
                  {fu.status === 'Completado' ? 'Seguimiento completado' : 'Registrar seguimiento'}
                </Button>
	            </div>
	          ))}
	          {(caso.followUps ?? []).length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4">
	            <p className="text-sm text-[#4a7068]">No hay seguimientos programados.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl text-xs"
                    onClick={() => onRegisterFollowUp('Seguimiento 4 semanas', nextFollowupDate(28))}
                    disabled={busyKey !== null}
                  >
                    Programar 4 semanas
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl text-xs"
                    onClick={() => onRegisterFollowUp('Seguimiento 8 semanas', nextFollowupDate(56))}
                    disabled={busyKey !== null}
                  >
                    Programar 8 semanas
                  </Button>
                </div>
              </div>
	          )}
	        </div>
      </Section>

      <Section title="Resultado y aprendizaje" icon={TrendingUp}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
	          {['Respuesta clínica', 'Respuesta bioquímica', 'Resultado PK/PD'].map((label) => (
	            <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
	              <p className="text-[10px] uppercase tracking-[0.14em] text-[#4a7068]">{label}</p>
	              <p className="mt-2 text-sm text-[#152520]">
                  {(caso.followUps ?? []).some((item) => item.status === 'Completado')
                    ? 'Ya existe seguimiento completado. El equipo puede usar este resultado para cierre y aprendizaje de red.'
                    : 'Se documentará cuando el seguimiento clínico esté completado y validado por el equipo.'}
                </p>
	            </div>
	          ))}
	        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {['Caso docente', 'Caso recurrente', 'Nuevo patrón', 'Revisión de protocolo sugerida'].map((tag) => (
            <span key={tag} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-[#4a7068]">
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-[#7b3fa0]/20 bg-slate-50 px-4 py-3">
          <p className="text-sm font-medium text-[#152520]">Aprendizaje de red</p>
          <p className="mt-1 text-[11px] leading-6 text-[#4a7068]">
            El caso pasa a aprendizaje compartido cuando hay seguimiento clínico completado, recomendación validada y cierre del circuito con trazabilidad profesional.
          </p>
        </div>
      </Section>
    </div>
  )
}

// ── Stage metadata ────────────────────────────────────────────────────────────

const STAGE_DOT: Record<string, string> = {
  'Solicitud recibida':          '#64748b',
  'Caso creado por IA':          '#7c3aed',
  'Datos incompletos':           '#e8981e',
  'Pendiente de determinantes':  '#e8501e',
  'Determinantes recibidos':     '#ca8a04',
  'Análisis PK/PD generado':     '#2563eb',
  'Revisión farmacéutica':       '#7b3fa0',
  'Revisión médica':             '#9333ea',
  'Discusión en red':            '#4f46e5',
  'Informe generado':            '#8dc63f',
  'Informe validado':            '#16a34a',
  'Registrado en HCE':           '#059669',
  'Seguimiento 4 semanas':       '#0891b2',
  'Seguimiento 8 semanas':       '#0284c7',
  'Cerrado con resultado':       '#6b7280',
}

const STAGE_DESC: Record<string, string> = {
  'Solicitud recibida':          'Solicitud registrada y pendiente de asignación al programa.',
  'Caso creado por IA':          'El agente IA ha estructurado el caso y asignado tipo de consulta.',
  'Datos incompletos':           'El farmacéutico ha detectado datos clínicos o analíticos pendientes.',
  'Pendiente de determinantes':  'Se aguardan niveles plasmáticos o resultados de laboratorio.',
  'Determinantes recibidos':     'Resultados analíticos disponibles para análisis PK/PD.',
  'Análisis PK/PD generado':     'El agente ha calculado parámetros PK y generado la interpretación.',
  'Revisión farmacéutica':       'El farmacéutico referente revisa el análisis y elabora recomendación.',
  'Revisión médica':             'El médico solicitante revisa y valida la recomendación.',
  'Discusión en red':            'El caso se presenta en sesión colaborativa con otros centros.',
  'Informe generado':            'La recomendación formal está redactada y pendiente de validación.',
  'Informe validado':            'El informe ha sido validado por farmacia y medicina.',
  'Registrado en HCE':           'La recomendación se ha integrado en la historia clínica electrónica.',
  'Seguimiento 4 semanas':       'Revisión intermedia: valoración de respuesta a los 30 días.',
  'Seguimiento 8 semanas':       'Revisión final: consolidación del resultado clínico.',
  'Cerrado con resultado':       'Caso cerrado con documentación del resultado clínico.',
}

// ── Pipeline Panel (unified single scroll) ───────────────────────────────────

function PipelinePanel({
  caso,
  activeTab,
  onJump,
  actionBusy,
}: {
  caso: CasoCompleto
  activeTab: Tab
  onJump: (tab: Tab) => void
  actionBusy: string | null
}) {
  const stageIndex = PIPELINE_STAGES.findIndex((s) => s === caso.pipelineStage)
  const [expandedStage, setExpandedStage] = useState<string | null>(caso.pipelineStage)
  const [block1Open, setBlock1Open] = useState(true)
  const [block2Open, setBlock2Open] = useState(true)
  const pendingTasks = (caso.tasks ?? []).filter((t) => t.status !== 'Resuelta')
  const pendingFollowUps = (caso.followUps ?? []).filter((followUp) => followUp.status !== 'Completado')
  const approvalItems = [
    caso.recommendation?.status !== 'Validado' ? 'Recomendación pendiente de validar' : null,
    caso.clinicalNote?.status !== 'Registrado en HCE' ? 'Informe HCE no registrado' : null,
    pendingTasks.length > 0 ? `${pendingTasks.length} tarea${pendingTasks.length > 1 ? 's' : ''} abierta${pendingTasks.length > 1 ? 's' : ''}` : null,
    pendingFollowUps.length > 0 ? `${pendingFollowUps.length} seguimiento${pendingFollowUps.length > 1 ? 's' : ''} pendiente${pendingFollowUps.length > 1 ? 's' : ''}` : null,
  ].filter(Boolean) as string[]

  useEffect(() => {
    setExpandedStage(caso.pipelineStage)
  }, [caso.pipelineStage])

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-l border-slate-200 bg-[#f1f3f5]">

      {/* ── Block 1: Pipeline stages (independently scrollable) ── */}
      <div className={`flex flex-col border-b-2 border-[#7b3fa0]/20 ${block1Open ? 'flex-1 min-h-0' : 'shrink-0'}`}>
        <button
          onClick={() => setBlock1Open((v) => !v)}
          className="flex w-full items-center justify-between gap-2 bg-[#7b3fa0]/8 px-3 py-2.5 text-left hover:bg-[#7b3fa0]/12 transition"
        >
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-[#7b3fa0]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#7b3fa0]">Flujo del caso</span>
          </div>
          <ChevronDown className={`h-3.5 w-3.5 text-[#7b3fa0] transition-transform ${block1Open ? '' : '-rotate-90'}`} />
        </button>
        {block1Open && (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-3 space-y-3">

        {/* Siguiente paso callout */}
        <div className="rounded-xl border border-[#7b3fa0]/20 bg-white px-3 py-3 shadow-sm">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#7b3fa0]">Siguiente paso</p>
          <p className="mt-1 text-sm font-bold text-slate-900">{caso.nextAction}</p>
          {actionBusy && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-[#7b3fa0]">
              <Sparkles className="h-3 w-3 animate-pulse" />
              Actualizando workflow…
            </div>
          )}
        </div>

        {/* Pipeline stages */}
        <div>
          <p className="mb-2 px-1 text-[9px] font-bold uppercase tracking-widest text-slate-400">
            Flujo del caso
          </p>
          <div className="relative">
            <div className="absolute bottom-2 left-[15px] top-2 w-0.5 bg-slate-200" />
            <div className="space-y-0.5">
              {PIPELINE_STAGES.map((stage, i) => {
                const isDone = i < stageIndex
                const isActive = i === stageIndex
                const isPending = i > stageIndex
                const isExpanded = expandedStage === stage
                const dot = STAGE_DOT[stage] ?? '#64748b'
                const stageEvents = (caso.timeline ?? []).filter((e) =>
                  e.label.toLowerCase().includes(stage.toLowerCase().split(' ').slice(0, 2).join(' '))
                )

                return (
                  <div key={stage}>
                    <button
                      onClick={() => setExpandedStage(isExpanded ? null : stage)}
                      disabled={isPending}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition ${
                        isActive
                          ? 'bg-white shadow-sm ring-1 ring-slate-200'
                          : isPending
                            ? 'cursor-default'
                            : 'hover:bg-white'
                      }`}
                    >
                      <div
                        className="relative z-10 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: isPending ? '#e2e8f0' : dot }}
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        ) : isActive ? (
                          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-slate-300" />
                        )}
                      </div>
                      <span
                        className={`flex-1 truncate text-xs ${
                          isActive ? 'font-bold text-slate-900' : isDone ? 'font-medium text-slate-500' : 'text-slate-300'
                        }`}
                      >
                        {stage}
                      </span>
                      {isActive && (
                        <span
                          className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold text-white"
                          style={{ backgroundColor: dot }}
                        >
                          ▶ AHORA
                        </span>
                      )}
                    </button>

                    {isExpanded && !isPending && (
                      <div
                        className="mb-1 ml-9 overflow-hidden rounded-lg border-l-4 bg-white p-2.5"
                        style={{ borderColor: dot }}
                      >
                        <p className="text-[11px] leading-relaxed text-slate-500">{STAGE_DESC[stage]}</p>
                        {stageEvents.length > 0 && (
                          <div className="mt-2 space-y-1.5">
                            {stageEvents.slice(0, 3).map((e, j) => (
                              <div key={j} className="flex items-start gap-1.5">
                                <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold ${LANE_COLORS[e.lane] ?? 'bg-slate-100 text-slate-600'}`}>
                                  {e.lane}
                                </span>
                                <span className="text-[11px] font-medium text-slate-700">{e.label}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {isActive && pendingTasks.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {pendingTasks.slice(0, 2).map((t) => (
                              <div key={t.taskId} className="rounded border border-slate-200 bg-slate-50 px-2 py-1.5">
                                <p className="text-[11px] font-semibold text-slate-800">{t.title}</p>
                                <p className="text-[10px] text-slate-500">{t.ownerRole}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        </div>
        )}
      </div>

      {/* ── Block 2: Context (independently scrollable) ── */}
      <div className={`flex flex-col ${block2Open ? 'flex-1 min-h-0' : 'shrink-0'}`}>
        <button
          onClick={() => setBlock2Open((v) => !v)}
          className="flex w-full items-center justify-between gap-2 bg-[#7b3fa0]/10 px-3 py-2.5 text-left hover:bg-[#7b3fa0]/15 transition"
        >
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-[#7b3fa0]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#7b3fa0]">Contexto y acciones</span>
          </div>
          <ChevronDown className={`h-3.5 w-3.5 text-[#7b3fa0] transition-transform ${block2Open ? '' : '-rotate-90'}`} />
        </button>
        {block2Open && (
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-3 space-y-3">

        {/* People */}
        <div className="flex items-start gap-2">
          <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#7b3fa0]" />
          <div className="min-w-0 text-xs">
            <p className="font-semibold text-slate-800">{caso.requesterName}</p>
            <p className="text-slate-400">Solicitante · {caso.centerName}</p>
            <p className="mt-1.5 font-semibold text-slate-800">{caso.assignedName}</p>
            <p className="text-slate-400">Farmacia responsable</p>
          </div>
        </div>

        {/* Approvals needed */}
        {approvalItems.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-amber-600">Pendiente de validar</p>
            {approvalItems.map((item) => (
              <div key={item} className="rounded-lg border-l-4 border-amber-400 bg-amber-50 px-2.5 py-1.5 text-[11px] font-medium text-amber-800">
                {item}
              </div>
            ))}
          </div>
        )}

        {pendingFollowUps.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-cyan-700">Seguimiento visible</p>
            {pendingFollowUps.slice(0, 2).map((item) => (
              <div key={item.label} className="rounded-lg border-l-4 border-cyan-400 bg-cyan-50 px-2.5 py-1.5 text-[11px] font-medium text-cyan-800">
                {item.label}
                {item.dueDate ? ` · ${new Date(item.dueDate).toLocaleDateString('es-ES')}` : ''}
              </div>
            ))}
          </div>
        )}

        {/* Quick-jump tabs */}
        <div>
          <p className="mb-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">Ir a sección</p>
          <div className="grid grid-cols-2 gap-1">
            {([
              { tab: 'resumen' as Tab, label: 'Resumen' },
              { tab: 'analisis' as Tab, label: 'Análisis' },
              { tab: 'recomendacion' as Tab, label: 'Recom.' },
              { tab: 'actividad' as Tab, label: 'Actividad' },
            ] as const).map((item) => (
              <button
                key={item.tab}
                onClick={() => onJump(item.tab)}
                className={`rounded-lg px-2 py-1.5 text-[11px] font-medium transition ${
                  activeTab === item.tab
                    ? 'bg-[#7b3fa0] text-white'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

      </div>
        )}
      </div>

    </aside>
  )
}

// ── Tab: Auditoría ────────────────────────────────────────────────────────────

function TabAuditoria({ caso }: { caso: CasoCompleto }) {
  const auditEvents = [
    { event: 'Caso creado', timestamp: caso.createdAt, actor: caso.requesterName },
    ...((caso.timeline ?? [])
      .filter((event) => event.lane === 'Decisiones' || event.lane === 'Tareas')
      .map((event) => ({
        event: event.label,
        timestamp: event.date,
        actor: [((event as any).actorName ?? event.lane), ((event as any).actorRole ?? null), ((event as any).actorCenter ?? null)]
          .filter(Boolean)
          .join(' · '),
      }))),
    ...(caso.agentRuns ?? []).map((run) => ({
      event: `${run.agent}: ${run.message}`,
      timestamp: run.timestamp,
      actor: run.agent,
    })),
    { event: 'Última actualización', timestamp: caso.updatedAt, actor: caso.assignedName },
  ].sort((a, b) => a.timestamp.localeCompare(b.timestamp))

  return (
    <div className="space-y-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-[#4a7068]">Registro de auditoría · {caso.caseId}</p>
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <table className="min-w-full text-left">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-[0.16em] text-[#4a7068]">
            <tr>
              <th className="px-4 py-3 font-medium">Evento</th>
              <th className="px-4 py-3 font-medium">Actor</th>
              <th className="px-4 py-3 font-medium">Fecha y hora</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {auditEvents.map((ev, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm text-[#152520]">{ev.event}</td>
                <td className="px-4 py-3 text-sm text-[#4a7068]">{ev.actor}</td>
                <td className="px-4 py-3 text-xs text-slate-400">
                  {new Date(ev.timestamp).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Activity; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#7b3fa0]" />
        <p className="text-[10px] uppercase tracking-[0.18em] text-[#4a7068]">{title}</p>
      </div>
      {children}
    </div>
  )
}

type CaseEditorDraft = {
  clinicalSummary: string
  nextAction: string
  age: string
  sex: string
  weightKg: string
  heightCm: string
  specialPopulation: string
  diagnosis: string
  phenotype: string
  activity: string
  extraintestinal: string
  currentDrug: string
  currentDose: string
  interval: string
  route: string
  previousTherapies: string
  adherence: string
  labDeterminants: Array<{
    id: string
    label: string
    value: string
    unit: string
    status: string
    source: string
    relationToDose: string
    interpretation: string
  }>
}

function buildEditorDraft(caso: CasoCompleto): CaseEditorDraft {
  const disease = caso.diseaseContext as Record<string, any>
  const therapy = caso.therapyContext as Record<string, any>

  return {
    clinicalSummary: caso.clinicalSummary ?? '',
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
      interpretation: item.interpretation ?? '',
    })),
  }
}

function parseCommaList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function humanizeFieldLabel(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim()
}

const sheetInputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#152520] outline-none transition placeholder:text-slate-400 focus:border-[#7b3fa0] focus:ring-2 focus:ring-[#7b3fa0]/15'

function CaseEditorSheet({
  draft,
  onChange,
  onClose,
  onSave,
  saving,
  error,
}: {
  draft: CaseEditorDraft
  onChange: React.Dispatch<React.SetStateAction<CaseEditorDraft>>
  onClose: () => void
  onSave: () => void
  saving: boolean
  error: string | null
}) {
  function setField<K extends keyof CaseEditorDraft>(field: K, value: CaseEditorDraft[K]) {
    onChange((current) => ({ ...current, [field]: value }))
  }

  function updateDeterminant(id: string, field: keyof CaseEditorDraft['labDeterminants'][number], value: string) {
    onChange((current) => ({
      ...current,
      labDeterminants: current.labDeterminants.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
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

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/25 backdrop-blur-[1px]">
      <div className="flex h-full w-full max-w-[760px] flex-col overflow-hidden bg-white shadow-[0_30px_90px_rgba(15,30,28,0.2)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b3fa0]">Editor clínico lateral</p>
            <h3 className="mt-1 text-xl font-semibold text-[#152520]">Actualizar datos, tratamiento y determinantes</h3>
            <p className="mt-1 text-sm text-[#4a7068]">
              Mantén el caso visible y edita la información clave sin salir del cockpit.
            </p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-sm font-semibold text-[#152520]">Resumen y siguiente paso</p>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#152520]">Resumen clínico</label>
                  <textarea
                    rows={5}
                    className={`${sheetInputCls} resize-none`}
                    value={draft.clinicalSummary}
                    onChange={(event) => setField('clinicalSummary', event.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#152520]">Siguiente paso</label>
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
                <p className="mb-3 text-sm font-semibold text-[#152520]">Paciente</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <LabeledInput label="Edad" value={draft.age} onChange={(value) => setField('age', value)} />
                  <LabeledInput label="Sexo" value={draft.sex} onChange={(value) => setField('sex', value)} />
                  <LabeledInput label="Peso (kg)" value={draft.weightKg} onChange={(value) => setField('weightKg', value)} />
                  <LabeledInput label="Altura (cm)" value={draft.heightCm} onChange={(value) => setField('heightCm', value)} />
                </div>
                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium text-[#152520]">Población especial</label>
                  <input
                    className={sheetInputCls}
                    value={draft.specialPopulation}
                    onChange={(event) => setField('specialPopulation', event.target.value)}
                    placeholder="Inmunosuprimido, Geriátrico…"
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <p className="mb-3 text-sm font-semibold text-[#152520]">Enfermedad</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <LabeledInput label="Diagnóstico" value={draft.diagnosis} onChange={(value) => setField('diagnosis', value)} />
                  <LabeledInput label="Fenotipo" value={draft.phenotype} onChange={(value) => setField('phenotype', value)} />
                  <LabeledInput label="Actividad" value={draft.activity} onChange={(value) => setField('activity', value)} />
                  <LabeledInput label="Manifestaciones extraintestinales" value={draft.extraintestinal} onChange={(value) => setField('extraintestinal', value)} />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-sm font-semibold text-[#152520]">Tratamiento actual</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <LabeledInput label="Fármaco actual" value={draft.currentDrug} onChange={(value) => setField('currentDrug', value)} />
                <LabeledInput label="Dosis actual" value={draft.currentDose} onChange={(value) => setField('currentDose', value)} />
                <LabeledInput label="Intervalo" value={draft.interval} onChange={(value) => setField('interval', value)} />
                <LabeledInput label="Vía" value={draft.route} onChange={(value) => setField('route', value)} />
                <div className="sm:col-span-2">
                  <LabeledInput label="Tratamientos previos" value={draft.previousTherapies} onChange={(value) => setField('previousTherapies', value)} />
                </div>
                <div className="sm:col-span-2">
                  <LabeledInput label="Adherencia" value={draft.adherence} onChange={(value) => setField('adherence', value)} />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#152520]">Determinantes PK/PD</p>
                  <p className="text-xs text-[#4a7068]">Corrige o completa los determinantes en un panel amplio y contextual.</p>
                </div>
                <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={addDeterminant}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Añadir
                </Button>
              </div>
              <div className="space-y-4">
                {draft.labDeterminants.map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-medium text-[#152520]">{item.label || 'Nuevo determinante'}</p>
                      {draft.labDeterminants.length > 1 ? (
                        <button onClick={() => removeDeterminant(item.id)} className="text-xs text-red-600 hover:text-red-700">
                          Eliminar
                        </button>
                      ) : null}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <LabeledInput label="Nombre" value={item.label} onChange={(value) => updateDeterminant(item.id, 'label', value)} />
                      <LabeledInput label="Valor" value={item.value} onChange={(value) => updateDeterminant(item.id, 'value', value)} />
                      <LabeledInput label="Unidad" value={item.unit} onChange={(value) => updateDeterminant(item.id, 'unit', value)} />
                      <LabeledInput label="Estado" value={item.status} onChange={(value) => updateDeterminant(item.id, 'status', value)} />
                      <LabeledInput label="Fuente" value={item.source} onChange={(value) => updateDeterminant(item.id, 'source', value)} />
                      <LabeledInput label="Relación con la dosis" value={item.relationToDose} onChange={(value) => updateDeterminant(item.id, 'relationToDose', value)} />
                      <div className="sm:col-span-2">
                        <LabeledInput label="Interpretación" value={item.interpretation} onChange={(value) => updateDeterminant(item.id, 'interpretation', value)} />
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
          <p className="text-xs text-[#4a7068]">Los cambios se guardan sobre el caso activo y quedan reflejados en la actualización del expediente.</p>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl text-sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button className="rounded-xl bg-[#7b3fa0] text-sm text-white hover:bg-[#6a3490]" onClick={onSave} disabled={saving}>
              {saving ? <Save className="mr-2 h-4 w-4 animate-pulse" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar cambios
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function LabeledInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#152520]">{label}</label>
      <input className={sheetInputCls} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
