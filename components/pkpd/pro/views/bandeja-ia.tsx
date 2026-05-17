'use client'

import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Loader2,
  Mail,
  RefreshCw,
  Sparkles,
  WandSparkles,
  Zap,
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
    processing: { label: 'Procesando', className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
    ready: { label: 'Listo para crear caso', className: 'bg-[#f0f7e3] text-[#5a7820] ring-1 ring-[#8dc63f]/30' },
    error: { label: 'Error de extracción', className: 'bg-red-50 text-red-700 ring-1 ring-red-200' },
    created: { label: 'Caso creado', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  }
  const variant = map[status]
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${variant.className}`}>
      {variant.label}
    </span>
  )
}

function StepDot({ state }: { state: FlowStepState }) {
  if (state === 'done') return <CheckCircle2 className="h-5 w-5 text-[#8dc63f]" />
  if (state === 'current')
    return (
      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#7b3fa0]">
        <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
      </div>
    )
  return <div className="h-5 w-5 rounded-full border-2 border-slate-200 bg-white" />
}

function HorizontalStepper({
  processState,
  createState,
  openState,
}: {
  processState: FlowStepState
  createState: FlowStepState
  openState: FlowStepState
}) {
  const steps = [
    { label: 'Procesar email', state: processState },
    { label: 'Crear caso', state: createState },
    { label: 'Abrir cockpit', state: openState },
  ]
  return (
    <div className="flex items-center">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <StepDot state={step.state} />
            <span
              className={`text-[9px] font-semibold ${
                step.state === 'current'
                  ? 'text-[#7b3fa0]'
                  : step.state === 'done'
                    ? 'text-[#5a7820]'
                    : 'text-slate-300'
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`mx-2 mb-4 h-0.5 w-12 rounded-full ${
                steps[i + 1].state !== 'locked' ? 'bg-[#8dc63f]' : 'bg-slate-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function AgentThinkingPanel({ steps }: { steps: Array<{ label: string; status: InboxStepStatus }> }) {
  return (
    <div className="overflow-hidden rounded-xl bg-slate-900">
      {/* Terminal chrome */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 bg-slate-800 px-4 py-2.5">
        <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
        <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
        <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
        <span className="ml-2 font-mono text-[10px] text-slate-400">agente-pkpd · extracción clínica supervisada</span>
      </div>

      {/* Steps */}
      <div className="space-y-2.5 p-4 font-mono">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 text-xs transition-all duration-300 ${
              step.status === 'pending' ? 'opacity-20' : 'opacity-100'
            }`}
          >
            <span className="mt-0.5 shrink-0">
              {step.status === 'done' ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
              ) : step.status === 'running' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
              ) : (
                <div className="h-3.5 w-3.5 rounded-full border border-slate-700" />
              )}
            </span>
            <span
              className={`leading-relaxed ${
                step.status === 'done'
                  ? 'text-green-300'
                  : step.status === 'running'
                    ? 'font-medium text-amber-200'
                    : 'text-slate-600'
              }`}
            >
              {step.label}
              {step.status === 'running' && (
                <span className="ml-1 text-amber-400">
                  <span className="inline-block animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                  <span className="inline-block animate-bounce" style={{ animationDelay: '120ms' }}>.</span>
                  <span className="inline-block animate-bounce" style={{ animationDelay: '240ms' }}>.</span>
                </span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Thinking footer */}
      <div className="flex items-center gap-2 border-t border-slate-800 px-4 py-2.5">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8dc63f]"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
        <span className="font-mono text-[9px] text-slate-500">
          IA supervisada · revisión humana obligatoria al finalizar
        </span>
      </div>
    </div>
  )
}

function PendingPanel() {
  const actions = [
    'Identificar el programa clínico y tipo de consulta',
    'Extraer datos del paciente, pauta y determinantes',
    'Detectar gaps y datos faltantes antes del caso',
    'Asignar prioridad y centro responsable',
  ]
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#7b3fa0]/10">
          <Sparkles className="h-4 w-4 text-[#7b3fa0]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#152520]">Qué hará la IA</p>
          <p className="text-xs text-[#4a7068]">Al pulsar «Procesar email»</p>
        </div>
      </div>
      <div className="space-y-2">
        {actions.map((action) => (
          <div key={action} className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-white px-3 py-2.5">
            <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8dc63f]" />
            <p className="text-xs text-[#152520]">{action}</p>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-slate-400">
        El resultado es visible antes de crear el caso. Puedes validar o corregir la extracción.
      </p>
    </div>
  )
}

function ReadyPanel({
  extraction,
  gaps,
}: {
  extraction: InboxItem['extraction']
  gaps: string[] | undefined
}) {
  const extractedFields = extraction
    ? Object.entries({
        Paciente: extraction.patientCode,
        Fármaco: extraction.drug,
        Indicación: extraction.indication,
        'Dosis actual': extraction.currentDose,
        Intervalo: extraction.interval,
        'Nivel detectado': extraction.levelResult,
        PCR: extraction.crp,
        Calprotectina: extraction.calprotectin,
        Anticuerpos: extraction.antibodies,
      }).filter(([, v]) => v)
    : []

  return (
    <div className="space-y-4">
      {/* Extracted data */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-[#8dc63f]" />
          <p className="text-xs font-semibold text-[#152520]">
            Datos extraídos — {extractedFields.length} campos
          </p>
        </div>
        <div className="overflow-hidden rounded-xl border border-[#8dc63f]/20 bg-[#f0f7e3]">
          {extraction ? (
            <dl className="divide-y divide-[#8dc63f]/10">
              {extractedFields.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[96px_1fr] gap-2 px-3 py-2 text-xs">
                  <dt className="text-[#5a7820]">{label}</dt>
                  <dd className="font-semibold text-[#152520]">{String(value)}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="px-3 py-3 text-xs text-[#4a7068]">Extracción no disponible aún.</p>
          )}
        </div>
      </div>

      {/* Gaps */}
      {(gaps ?? []).length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <p className="text-xs font-semibold text-[#152520]">
              Gaps detectados — {gaps!.length}
            </p>
          </div>
          <div className="space-y-1.5">
            {gaps!.map((gap) => (
              <div key={gap} className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {gap}
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-slate-400">
            Estos gaps se convertirán en tareas al crear el caso.
          </p>
        </div>
      )}

      {(gaps ?? []).length === 0 && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700">
          ✓ Sin gaps críticos detectados en esta solicitud.
        </div>
      )}
    </div>
  )
}

function CreatedPanel({
  item,
  onOpen,
}: {
  item: InboxItem
  onOpen?: (caseId: string) => void
}) {
  if (!item.createdCaseId) return null
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#152520]">Caso creado con éxito</p>
          <p className="text-xs text-[#4a7068]">{item.createdCaseId}</p>
        </div>
      </div>
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
        <p className="text-xs text-slate-500">Case ID</p>
        <p className="mt-0.5 text-base font-bold text-[#152520]">{item.createdCaseId}</p>
        <p className="mt-1 text-xs text-[#4a7068]">
          El caso ya tiene tareas, prioridades y trazas generadas automáticamente.
        </p>
        {onOpen && (
          <Button
            size="sm"
            className="mt-3 w-full gap-1.5 rounded-xl bg-[#8dc63f] text-xs text-white hover:bg-[#9fd44e]"
            onClick={() => onOpen(item.createdCaseId!)}
          >
            Abrir Case Cockpit
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      <p className="text-[10px] text-slate-400">
        Revisión humana obligatoria antes de emitir recomendación clínica.
      </p>
    </div>
  )
}

function ContextPanel({
  item,
  onOpen,
}: {
  item: InboxItem
  onOpen?: (caseId: string) => void
}) {
  if (item.agentStatus === 'processing') {
    return <AgentThinkingPanel steps={item.agentSteps} />
  }
  if (item.agentStatus === 'ready') {
    return <ReadyPanel extraction={item.extraction} gaps={item.detectedGaps} />
  }
  if (item.agentStatus === 'created') {
    return <CreatedPanel item={item} onOpen={onOpen} />
  }
  if (item.agentStatus === 'error') {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <p className="text-sm font-semibold text-red-800">Error en la extracción</p>
        </div>
        <div className="space-y-1.5">
          {item.agentSteps.map((step) => (
            <div key={step.label} className="flex items-center gap-2 text-xs text-red-700">
              <div className={`h-2 w-2 rounded-full shrink-0 ${step.status === 'done' ? 'bg-green-400' : 'bg-red-400'}`} />
              {step.label}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-red-600">Puedes reintentar el procesamiento desde el panel principal.</p>
      </div>
    )
  }
  return <PendingPanel />
}

function formatReceivedAt(value: string) {
  return new Date(value).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
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
    if (!selected && items[0]) setSelectedId(items[0]._id)
  }, [items, selected])

  async function generateInboxItem() {
    setError(null)
    setBusyAction('generate')
    try {
      const item = await fetchJson<InboxItem>('/api/xarxa/inbox/generate', { method: 'POST' })
      setItems((current) => [item, ...current])
      setSelectedId(item._id)
      setStatus('ready')
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
      const response = await fetchJson<CreateCaseResponse>('/api/xarxa/inbox/generate-case', { method: 'POST' })
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
      const item = await fetchJson<InboxItem>(`/api/xarxa/inbox/${selected._id}/process`, { method: 'POST' })
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
      const response = await fetchJson<CreateCaseResponse>(`/api/xarxa/inbox/${selected._id}/create-case`, { method: 'POST' })
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
  const processState: FlowStepState = canProcess ? 'current' : 'done'
  const createState: FlowStepState = canOpenCase ? 'done' : canCreate ? 'current' : 'locked'
  const openState: FlowStepState = canOpenCase ? 'current' : 'locked'

  const nextAction = canProcess
    ? {
        step: '1 / 3',
        who: 'Agente IA',
        title: 'Procesar email y extraer datos clínicos',
        detail:
          'La IA leerá la solicitud, identificará el programa, extraerá datos del paciente y detectará gaps antes de crear el caso.',
        label: 'Procesar con IA',
        icon: Bot,
        action: () => void processSelectedItem(),
        busy: busyAction === 'process',
        color: 'bg-[#7b3fa0] hover:bg-[#6c348f]',
      }
    : canCreate
      ? {
          step: '2 / 3',
          who: 'Tú',
          title: 'Revisar extracción y crear caso PK/PD',
          detail:
            'La extracción está lista. Revisa los datos y gaps, luego crea el caso con tareas, prioridades y trazas auditables.',
          label: 'Crear caso PK/PD',
          icon: ChevronRight,
          action: () => void createCaseFromSelectedItem(),
          busy: busyAction === 'create',
          color: 'bg-[#8dc63f] hover:bg-[#9fd44e]',
        }
      : canOpenCase
        ? {
            step: '3 / 3',
            who: 'Tú',
            title: 'El caso está listo — ábrelo en el Case Cockpit',
            detail:
              'Tareas generadas, prioridades asignadas, trazas de auditoría activas. Continúa el circuito clínico desde el cockpit.',
            label: 'Abrir caso',
            icon: ChevronRight,
            action: () => {
              if (selected.createdCaseId) void onCaseCreated?.(selected.createdCaseId)
            },
            busy: false,
            color: 'bg-[#8dc63f] hover:bg-[#9fd44e]',
          }
        : {
            step: '—',
            who: 'Sistema',
            title: 'Selecciona o genera una solicitud',
            detail: 'Genera una solicitud de email simulada o selecciona una de la lista para comenzar el flujo.',
            label: 'Generar solicitud',
            icon: Sparkles,
            action: () => void generateInboxItem(),
            busy: busyAction === 'generate',
            color: 'bg-slate-700 hover:bg-slate-600',
          }

  const NextIcon = nextAction.icon

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left: email list ────────────────────────────────── */}
      <div className="flex w-72 shrink-0 flex-col border-r border-slate-100 bg-white">
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
              className="h-9 w-full justify-start gap-1.5 rounded-xl text-xs"
              onClick={() => void generateInboxItem()}
              disabled={busyAction !== null}
            >
              {busyAction === 'generate' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Generar solicitud
            </Button>
            <Button
              size="sm"
              className="h-9 w-full justify-start gap-1.5 rounded-xl bg-[#8dc63f] text-xs text-white hover:bg-[#9fd44e]"
              onClick={() => void generateRandomCase()}
              disabled={busyAction !== null}
            >
              {busyAction === 'generate-case' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <WandSparkles className="h-3.5 w-3.5" />
              )}
              Generar caso completo
            </Button>
          </div>
        </div>

        <ul className="flex-1 divide-y divide-slate-50 overflow-y-auto">
          {items.map((item) => (
            <li key={item._id}>
              <button
                onClick={() => setSelectedId(item._id)}
                className={`w-full px-4 py-3 text-left transition hover:bg-slate-50 ${
                  selected._id === item._id ? 'bg-[#f0f7e3]' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-xs font-semibold text-[#152520]">{item.centerName}</p>
                  <span className="shrink-0 text-[10px] text-[#4a7068]">{formatReceivedAt(item.receivedAt)}</span>
                </div>
                <p className="mt-0.5 truncate text-xs text-[#152520]">{item.subject}</p>
                <p className="mt-0.5 truncate text-[11px] text-[#4a7068]">{item.requesterName}</p>
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

      {/* ── Right: main panel ───────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Slim header: email meta + inline action bar */}
        <div className="shrink-0 border-b border-slate-100 bg-white px-5 py-3 space-y-2">
          {/* Row 1: subject + status */}
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm font-semibold text-[#152520]">{selected.subject}</p>
            <AgentStatusBadge status={selected.agentStatus} />
          </div>

          {/* Row 2: from / date / center / program confidence */}
          <p className="text-xs text-[#4a7068]">
            {selected.from} · {formatReceivedAt(selected.receivedAt)} · {selected.centerName}
            {selected.programSuggestion
              ? ` · ${selected.programSuggestion}${selected.confidence ? ` · IA ${selected.confidence}%` : ''}`
              : ''}
          </p>

          {/* Row 3: compact action bar — stepper + single-line CTA */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
            {/* Inline stepper */}
            <div className="flex items-center gap-1.5">
              <HorizontalStepper
                processState={processState}
                createState={createState}
                openState={openState}
              />
              <span className="ml-2 text-[10px] text-[#4a7068]">
                {nextAction.who === 'Agente IA' ? '🤖' : '👤'}{' '}
                <span className="font-medium text-[#152520]">{nextAction.title}</span>
              </span>
            </div>
            <Button
              size="sm"
              className={`h-7 shrink-0 gap-1 rounded-xl px-3 text-xs font-semibold text-white ${nextAction.color}`}
              onClick={nextAction.action}
              disabled={busyAction !== null}
            >
              {nextAction.busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <NextIcon className="h-3.5 w-3.5" />
              )}
              {nextAction.label}
            </Button>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          ) : null}
        </div>

        {/* Body: email body + context panel */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Email body */}
          <div className="flex-1 overflow-y-auto border-r border-slate-100 px-6 py-5">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[#4a7068]">
              Email original
            </p>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-[#152520]">
                {selected.body}
              </pre>
            </div>

            {/* Minimal meta below email */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#4a7068]">Solicitante</p>
                <p className="mt-1 text-xs font-semibold text-[#152520]">{selected.requesterName}</p>
                <p className="text-[10px] text-[#4a7068]">{selected.centerName}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#4a7068]">Programa sugerido</p>
                <p className="mt-1 text-xs font-semibold text-[#152520]">
                  {selected.programSuggestion ?? 'Crohn PK/PD'}
                </p>
                <p className="text-[10px] text-[#4a7068]">{selected.caseTypeSuggestion ?? 'Consulta PK/PD'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#4a7068]">Gaps detectados</p>
                <p className="mt-1 text-xs font-semibold text-[#152520]">
                  {selected.detectedGaps?.length ?? '—'}
                </p>
                <p className="text-[10px] text-[#4a7068]">
                  {(selected.detectedGaps?.length ?? 0) > 0 ? 'Requieren revisión' : 'Sin gaps críticos'}
                </p>
              </div>
            </div>
          </div>

          {/* Context panel */}
          <div className="w-[320px] shrink-0 overflow-y-auto bg-[#f8faf9] px-5 py-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#8dc63f]">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#152520]">Extracción IA</p>
                <p className="text-xs text-[#4a7068]">Supervisada · trazable · revisable</p>
              </div>
            </div>
            <ContextPanel item={selected} onOpen={onCaseCreated} />
          </div>
        </div>
      </div>
    </div>
  )
}
