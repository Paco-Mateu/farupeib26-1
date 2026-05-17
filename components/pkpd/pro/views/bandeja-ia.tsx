'use client'

import {
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Loader2,
  Mail,
  RefreshCw,
  Sparkles,
  WandSparkles,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  WorkspaceEmptyState,
  WorkspaceErrorState,
  WorkspaceLoadingState,
} from '@/components/pkpd/pro/workspace-state'
import type { InboxItem, InboxStepStatus } from '@/components/pkpd/pro/xarxa-types'
import { fetchJson } from '@/lib/fetch-json'

type BandejaIaProps = {
  onCaseCreated?: (caseId: string) => void | Promise<void>
}

type InboxResponse = {
  items: InboxItem[]
  total: number
}

type CreateCaseResponse = {
  item: InboxItem
  case: { caseId: string }
}

type FlowStepState = 'done' | 'current' | 'locked'

function AgentStatusBadge({ status }: { status: InboxItem['agentStatus'] }) {
  const map: Record<InboxItem['agentStatus'], { label: string; className: string }> = {
    pending: { label: 'En cola', className: 'bg-slate-100 text-slate-500' },
    processing: {
      label: 'Procesando',
      className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    },
    ready: {
      label: 'Listo para crear caso',
      className: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200',
    },
    error: {
      label: 'Error de extracción',
      className: 'bg-red-50 text-red-700 ring-1 ring-red-200',
    },
    created: {
      label: 'Caso creado',
      className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    },
  }

  const variant = map[status]
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${variant.className}`}>
      {variant.label}
    </span>
  )
}

function StepIcon({ status }: { status: InboxStepStatus }) {
  if (status === 'done') return <CheckCircle2 className="h-3.5 w-3.5 text-[#8dc63f]" />
  if (status === 'running') return <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
  return <Clock3 className="h-3.5 w-3.5 text-slate-300" />
}

function formatReceivedAt(value: string) {
  return new Date(value).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function buildInboxAutomationSummary(item: InboxItem) {
  const completedSteps = item.agentSteps.filter((step) => step.status === 'done').length
  const extractedFields = Object.values(item.extraction ?? {}).filter(Boolean).length
  const gapsDetected = item.detectedGaps?.length ?? 0
  const estimatedMinutesSaved = Math.max(5, completedSteps * 3 + extractedFields + gapsDetected * 2)
  const highlights = [
    extractedFields > 0 ? `${extractedFields} datos clínicos ya estructurados` : null,
    gapsDetected > 0 ? `${gapsDetected} gaps detectados antes de crear el caso` : 'Sin gaps críticos detectados',
    item.agentStatus === 'ready' || item.agentStatus === 'created'
      ? 'Caso listo para pasar a revisión humana'
      : 'La IA sigue preparando el caso para revisión',
  ].filter(Boolean) as string[]

  return {
    completedSteps,
    extractedFields,
    gapsDetected,
    estimatedMinutesSaved,
    highlights,
  }
}

export function BandejaIa({ onCaseCreated }: BandejaIaProps) {
  const [items, setItems] = useState<InboxItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [busyAction, setBusyAction] = useState<'refresh' | 'generate' | 'generate-case' | 'process' | 'create' | null>(null)

  async function loadInbox() {
    setStatus('loading')
    setError(null)

    try {
      const response = await fetchJson<InboxResponse>('/api/xarxa/inbox')
      setItems(response.items ?? [])
      setSelectedId((current) => current ?? response.items?.[0]?._id ?? null)
      setStatus('ready')
    } catch (loadError) {
      setStatus('error')
      setError(loadError instanceof Error ? loadError.message : 'No se ha podido cargar la bandeja IA.')
    }
  }

  useEffect(() => {
    void loadInbox()
  }, [])

  const selected = useMemo(
    () => items.find((item) => item._id === selectedId) ?? items[0] ?? null,
    [items, selectedId]
  )

  useEffect(() => {
    if (!selected && items[0]) {
      setSelectedId(items[0]._id)
    }
  }, [items, selected])

  async function generateInboxItem() {
    setError(null)
    setBusyAction('generate')
    try {
      const item = await fetchJson<InboxItem>('/api/xarxa/inbox/generate', { method: 'POST' })
      setItems((current) => [item, ...current])
      setSelectedId(item._id)
      setStatus('ready')
      setError(null)
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'No se ha podido generar la solicitud.')
    } finally {
      setBusyAction(null)
    }
  }

  async function generateRandomCase() {
    setError(null)
    setBusyAction('generate-case')
    try {
      const response = await fetchJson<CreateCaseResponse>('/api/xarxa/inbox/generate-case', {
        method: 'POST',
      })
      setItems((current) => [response.item, ...current.filter((item) => item._id !== response.item._id)])
      setSelectedId(response.item._id)
      await onCaseCreated?.(response.case.caseId)
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'No se ha podido generar el caso.')
    } finally {
      setBusyAction(null)
    }
  }

  async function processSelectedItem() {
    if (!selected) return
    setError(null)
    setBusyAction('process')
    try {
      const item = await fetchJson<InboxItem>(`/api/xarxa/inbox/${selected._id}/process`, {
        method: 'POST',
      })
      setItems((current) => current.map((entry) => (entry._id === item._id ? item : entry)))
      setSelectedId(item._id)
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'No se ha podido procesar la solicitud.')
    } finally {
      setBusyAction(null)
    }
  }

  async function createCaseFromSelectedItem() {
    if (!selected) return
    setError(null)
    setBusyAction('create')
    try {
      const response = await fetchJson<CreateCaseResponse>(`/api/xarxa/inbox/${selected._id}/create-case`, {
        method: 'POST',
      })
      setItems((current) =>
        current.map((entry) => (entry._id === response.item._id ? response.item : entry))
      )
      setSelectedId(response.item._id)
      await onCaseCreated?.(response.case.caseId)
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'No se ha podido crear el caso desde la solicitud.')
    } finally {
      setBusyAction(null)
    }
  }

  if (status === 'loading' && items.length === 0) {
    return (
      <WorkspaceLoadingState
        title="Cargando bandeja IA…"
        detail="Preparando solicitudes entrantes y extracción estructurada."
      />
    )
  }

  if (status === 'error' && items.length === 0) {
    return (
      <WorkspaceErrorState
        title="No se ha podido cargar la bandeja IA."
        detail={error ?? undefined}
        onRetry={() => void loadInbox()}
      />
    )
  }

  if (items.length === 0 || !selected) {
    return (
      <WorkspaceEmptyState
        title="No hay solicitudes pendientes en la bandeja IA."
        detail="Puedes generar una solicitud simulada por email y convertirla en un nuevo caso PK/PD."
        actionLabel="Generar solicitud aleatoria"
        onAction={() => void generateInboxItem()}
      />
    )
  }

  const canProcess = selected.agentStatus === 'pending' || selected.agentStatus === 'processing' || selected.agentStatus === 'error'
  const canCreate = selected.agentStatus === 'ready'
  const canOpenCase = selected.agentStatus === 'created' && selected.createdCaseId
  const automation = buildInboxAutomationSummary(selected)
  const processState: FlowStepState = canProcess ? 'current' : 'done'
  const createState: FlowStepState = canOpenCase ? 'done' : canCreate ? 'current' : 'locked'
  const openState: FlowStepState = canOpenCase ? 'current' : 'locked'
  const nextAction = canProcess
    ? {
        title: 'Paso 1. Procesar solicitud',
        detail: 'La IA debe terminar de estructurar el correo, sugerir el programa y detectar gaps antes de crear el caso.',
        label: 'Procesar email y extraer datos',
        action: () => void processSelectedItem(),
        busy: busyAction === 'process',
      }
    : canCreate
      ? {
          title: 'Paso 2. Crear caso clínico',
          detail: 'La extracción ya está preparada. Ahora conviértela en un caso PK/PD con tareas, prioridades y trazas auditables.',
          label: 'Crear caso PK/PD',
          action: () => void createCaseFromSelectedItem(),
          busy: busyAction === 'create',
        }
      : canOpenCase
        ? {
            title: 'Paso 3. Abrir el Case Cockpit',
            detail: 'El caso ya existe. Ábrelo para completar determinantes, validar el paquete IA y continuar el circuito clínico.',
            label: 'Abrir caso',
            action: () => {
              if (selected.createdCaseId) void onCaseCreated?.(selected.createdCaseId)
            },
            busy: false,
          }
        : {
            title: 'Solicitud en preparación',
            detail: 'Selecciona una solicitud o genera una nueva entrada para comenzar la demo.',
            label: 'Generar solicitud',
            action: () => void generateInboxItem(),
            busy: busyAction === 'generate',
          }

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex w-80 shrink-0 flex-col border-r border-slate-100 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#4a7068]" />
              <span className="text-sm font-semibold text-[#152520]">Solicitudes recibidas</span>
              <span className="rounded-full bg-[#8dc63f] px-1.5 py-0.5 text-[10px] font-bold text-white">
                {items.length}
              </span>
            </div>
            <button
              className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
              onClick={() => {
                setBusyAction('refresh')
                void loadInbox().finally(() => setBusyAction(null))
              }}
              aria-label="Actualizar bandeja"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${busyAction === 'refresh' ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="mt-3 space-y-2">
            <Button
              size="sm"
              variant="outline"
              className="h-11 w-full justify-start rounded-2xl text-sm"
              onClick={() => void generateInboxItem()}
              disabled={busyAction !== null}
            >
              {busyAction === 'generate' ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
              Generar solicitud
            </Button>
            <Button
              size="sm"
              className="h-11 w-full justify-start rounded-2xl bg-[#8dc63f] text-sm text-white hover:bg-[#9fd44e]"
              onClick={() => void generateRandomCase()}
              disabled={busyAction !== null}
            >
              {busyAction === 'generate-case' ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <WandSparkles className="mr-1.5 h-3.5 w-3.5" />}
              Generar caso aleatorio
            </Button>
          </div>
        </div>

        <ul className="flex-1 divide-y divide-slate-50 overflow-y-auto">
          {items.map((item) => (
            <li key={item._id}>
              <button
                onClick={() => setSelectedId(item._id)}
                className={`w-full px-4 py-3 text-left transition hover:bg-slate-50 ${
                  selected._id === item._id ? 'bg-teal-50/40' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-xs font-semibold text-[#152520]">{item.centerName}</p>
                  <span className="shrink-0 text-[10px] text-[#4a7068]">{formatReceivedAt(item.receivedAt)}</span>
                </div>
                <p className="mt-0.5 truncate text-xs text-[#152520]">{item.subject}</p>
                <p className="mt-1 truncate text-[11px] text-[#4a7068]">{item.requesterName}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <AgentStatusBadge status={item.agentStatus} />
                  {item.createdCaseId ? (
                    <span className="text-[10px] text-[#4a7068]">{item.createdCaseId}</span>
                  ) : null}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="border-b border-slate-100 bg-white px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#152520]">{selected.subject}</p>
              <p className="mt-0.5 text-xs text-[#4a7068]">
                De: {selected.from} · {formatReceivedAt(selected.receivedAt)} · {selected.centerName}
              </p>
              <p className="mt-1 text-xs text-[#4a7068]">
                Programa sugerido: {selected.programSuggestion ?? 'Crohn PK/PD'} · Tipo sugerido: {selected.caseTypeSuggestion ?? 'Consulta PK/PD'} · Confianza IA: {selected.confidence ?? '—'}%
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#edf7f6] px-2.5 py-1 text-[11px] font-medium text-[#1a6860]">
                  {automation.completedSteps} pasos automáticos completados
                </span>
                <span className="rounded-full bg-[#f1f8e6] px-2.5 py-1 text-[11px] font-medium text-[#5a7820]">
                  {automation.estimatedMinutesSaved} min manuales evitados
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  {automation.extractedFields} campos estructurados
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <AgentStatusBadge status={selected.agentStatus} />
            </div>
          </div>
          <div className="mt-4 rounded-3xl border border-[#8dc63f]/20 bg-[#f0f7e3] p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5a7820]">
                  Siguiente acción recomendada
                </p>
                <p className="mt-2 text-lg font-semibold text-[#152520]">{nextAction.title}</p>
                <p className="mt-1 max-w-3xl text-sm leading-7 text-[#4a7068]">{nextAction.detail}</p>
              </div>
              <Button
                size="lg"
                className="h-12 rounded-2xl bg-[#8dc63f] px-5 text-sm font-semibold text-white hover:bg-[#9fd44e]"
                onClick={nextAction.action}
                disabled={busyAction !== null}
              >
                {nextAction.busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ChevronRight className="mr-2 h-4 w-4" />}
                {nextAction.label}
              </Button>
            </div>
            <div className="mt-4 grid gap-3 xl:grid-cols-3">
              <FlowStepCard
                step="1"
                title="Procesar email"
                description="Leer la solicitud, identificar programa, extraer datos y detectar gaps."
                state={processState}
                actionLabel="Procesar"
                onAction={canProcess ? () => void processSelectedItem() : undefined}
                busy={busyAction === 'process'}
              />
              <FlowStepCard
                step="2"
                title="Crear caso"
                description="Convertir la extracción en un caso PK/PD con prioridades, tareas y trazas."
                state={createState}
                actionLabel="Crear caso"
                onAction={canCreate ? () => void createCaseFromSelectedItem() : undefined}
                busy={busyAction === 'create'}
              />
              <FlowStepCard
                step="3"
                title="Abrir caso"
                description="Entrar en el Case Cockpit para validar determinantes y continuar el workflow."
                state={openState}
                actionLabel="Abrir"
                onAction={
                  canOpenCase
                    ? () => {
                        if (selected.createdCaseId) void onCaseCreated?.(selected.createdCaseId)
                      }
                    : undefined
                }
              />
            </div>
          </div>
          {error ? (
            <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto border-r border-slate-100 px-6 py-5">
            <div className="mb-4 rounded-2xl border border-[#8dc63f]/20 bg-[#edf7f6] p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#8dc63f] shadow-sm">
                  <WandSparkles className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#152520]">Trabajo automático ya completado antes de crear el caso</p>
                  <p className="mt-1 text-xs text-[#4a7068]">
                    La plataforma ya ha leído la solicitud, ha estructurado la información útil y ha detectado qué faltará validar antes de la revisión farmacéutica.
                  </p>
                  <div className="mt-3 grid gap-2 md:grid-cols-3">
                    <AutomationStatCard label="Pasos IA completados" value={String(automation.completedSteps)} note="Del correo al borrador estructurado" />
                    <AutomationStatCard label="Datos estructurados" value={String(automation.extractedFields)} note="Campos clínicos ya preparados" />
                    <AutomationStatCard label="Tiempo evitado" value={`${automation.estimatedMinutesSaved} min`} note="Trabajo manual ahorrado" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#4a7068]">Solicitante</p>
                <p className="mt-2 text-sm font-semibold text-[#152520]">{selected.requesterName}</p>
                <p className="text-xs text-[#4a7068]">{selected.centerName}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#4a7068]">Programa sugerido</p>
                <p className="mt-2 text-sm font-semibold text-[#152520]">{selected.programSuggestion ?? 'Crohn PK/PD'}</p>
                <p className="text-xs text-[#4a7068]">{selected.caseTypeSuggestion ?? 'Consulta PK/PD'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#4a7068]">Estado de la extracción</p>
                <p className="mt-2 text-sm font-semibold text-[#152520]">{selected.detectedGaps?.length ?? 0} gaps detectados</p>
                <p className="text-xs text-[#4a7068]">El caso no pasa a revisión hasta validar esta extracción.</p>
              </div>
            </div>

            <p className="mb-3 text-[10px] uppercase tracking-[0.16em] text-[#4a7068]">Email original</p>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-[#152520]">
                {selected.body}
              </pre>
            </div>
          </div>

          <div className="flex w-[360px] shrink-0 flex-col overflow-y-auto bg-[#f8faf9] px-5 py-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#8dc63f]">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#152520]">Extracción IA supervisada</p>
                <p className="text-xs text-[#4a7068]">Trazabilidad visible antes de crear el caso.</p>
              </div>
            </div>

            <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#4a7068]">
                Actividad del agente
              </p>
              <div className="space-y-2.5">
                {selected.agentSteps.map((step) => (
                  <div key={step.label} className="flex items-center gap-2.5">
                    <StepIcon status={step.status} />
                    <span
                      className={`text-xs ${
                        step.status === 'pending' ? 'text-slate-400' : 'text-[#152520]'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#4a7068]">
                Qué automatiza aquí la plataforma
              </p>
              <div className="space-y-2">
                {automation.highlights.map((highlight) => (
                  <div key={highlight} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-[#152520]">
                    {highlight}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-[#4a7068]">
                Al crear el caso, estos hallazgos se transforman automáticamente en tareas, prioridades y trazas auditables.
              </p>
            </div>

            <div className="mb-5 rounded-2xl border border-teal-100 bg-teal-50/40 p-4">
              <div className="mb-3 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#8dc63f]" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8dc63f]">
                  Datos detectados
                </p>
              </div>
              {selected.extraction ? (
                <dl className="space-y-2">
                  {Object.entries({
                    Paciente: selected.extraction.patientCode,
                    Fármaco: selected.extraction.drug,
                    Indicación: selected.extraction.indication,
                    Dosis: selected.extraction.currentDose,
                    Intervalo: selected.extraction.interval,
                    'Última administración': selected.extraction.recentDose,
                    Nivel: selected.extraction.levelResult,
                    PCR: selected.extraction.crp,
                    Calprotectina: selected.extraction.calprotectin,
                    Anticuerpos: selected.extraction.antibodies,
                  }).map(([label, value]) => (
                    <div key={label} className="grid grid-cols-[112px_1fr] gap-2 text-xs">
                      <dt className="text-[#4a7068]">{label}</dt>
                      <dd className="font-medium text-[#152520]">{value || 'No detectado'}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-[#4a7068]">La extracción estructurada aparecerá cuando el agente termine el análisis.</p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#4a7068]">
                Gaps detectados
              </p>
              <div className="space-y-2">
                {(selected.detectedGaps ?? []).map((gap) => (
                  <div
                    key={gap}
                    className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800"
                  >
                    {gap}
                  </div>
                ))}
                {(selected.detectedGaps ?? []).length === 0 ? (
                  <p className="text-sm text-[#4a7068]">No hay gaps detectados en la solicitud actual.</p>
                ) : null}
              </div>
              <p className="mt-3 text-[11px] text-[#4a7068]">
                La creación del caso conserva estos gaps como tareas de revisión humana.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AutomationStatCard({
  label,
  value,
  note,
}: {
  label: string
  value: string
  note: string
}) {
  return (
    <div className="rounded-xl border border-white/70 bg-white px-3 py-3 shadow-sm">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#4a7068]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[#152520]">{value}</p>
      <p className="mt-1 text-[11px] text-[#4a7068]">{note}</p>
    </div>
  )
}

function FlowStepCard({
  step,
  title,
  description,
  state,
  actionLabel,
  onAction,
  busy = false,
}: {
  step: string
  title: string
  description: string
  state: FlowStepState
  actionLabel: string
  onAction?: () => void
  busy?: boolean
}) {
  const styles =
    state === 'current'
      ? 'border-[#8dc63f]/30 bg-white shadow-sm'
      : state === 'done'
        ? 'border-teal-200 bg-teal-50/40'
        : 'border-slate-200 bg-slate-50/80'

  return (
    <div className={`rounded-2xl border p-4 ${styles}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-xl bg-[#152520] px-2.5 py-1 text-[11px] font-semibold text-white">
            Paso {step}
          </span>
          {state === 'done' ? (
            <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
              Completado
            </span>
          ) : state === 'current' ? (
            <span className="rounded-full bg-[#f1f8e6] px-2 py-0.5 text-[10px] font-semibold text-[#5a7820]">
              Acción actual
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              Bloqueado
            </span>
          )}
        </div>
        {state === 'done' ? (
          <CheckCircle2 className="h-4 w-4 text-teal-500" />
        ) : state === 'current' && busy ? (
          <Loader2 className="h-4 w-4 animate-spin text-[#8dc63f]" />
        ) : (
          <Clock3 className={`h-4 w-4 ${state === 'locked' ? 'text-slate-300' : 'text-amber-500'}`} />
        )}
      </div>

      <p className="mt-4 text-sm font-semibold text-[#152520]">{title}</p>
      <p className="mt-1 text-xs leading-6 text-[#4a7068]">{description}</p>

      <Button
        size="sm"
        variant={state === 'current' ? 'default' : 'outline'}
        className={`mt-4 h-10 w-full rounded-xl text-xs ${
          state === 'current'
            ? 'bg-[#152520] text-white hover:bg-[#243732]'
            : 'bg-white text-[#152520]'
        }`}
        disabled={!onAction || busy}
        onClick={onAction}
      >
        {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
        {actionLabel}
      </Button>
    </div>
  )
}
