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

function AgentStatusBadge({ status }: { status: InboxItem['agentStatus'] }) {
  const map: Record<InboxItem['agentStatus'], { label: string; className: string }> = {
    pending: { label: 'En cola', className: 'bg-slate-100 text-slate-500' },
    processing: { label: 'Procesando', className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
    ready: { label: 'Listo para crear caso', className: 'bg-[#faf6fd] text-[#7b3fa0] ring-1 ring-[#7b3fa0]/30' },
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


function AgentThinkingPanel({ steps }: { steps: Array<{ label: string; status: InboxStepStatus }> }) {
  return (
    <div className="space-y-1.5">
      {steps.map((step, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-xs transition-all ${
            step.status === 'done'
              ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
              : step.status === 'running'
                ? 'border-[#7b3fa0]/20 bg-[#faf6fd] text-[#7b3fa0]'
                : 'border-slate-100 bg-slate-50 text-slate-400'
          }`}
        >
          <span className="shrink-0">
            {step.status === 'done' ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            ) : step.status === 'running' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#7b3fa0]" />
            ) : (
              <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-200" />
            )}
          </span>
          <span className={step.status === 'running' ? 'font-medium' : ''}>{step.label}</span>
        </div>
      ))}
    </div>
  )
}

function PendingPanel() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100">
        <Sparkles className="h-5 w-5 text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-500">Solicitud pendiente</p>
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
          <CheckCircle2 className="h-4 w-4 text-[#7b3fa0]" />
          <p className="text-xs font-semibold text-[#152520]">
            Datos extraídos — {extractedFields.length} campos
          </p>
        </div>
        <div className="overflow-hidden rounded-xl border border-[#7b3fa0]/20 bg-[#faf6fd]">
          {extraction ? (
            <dl className="divide-y divide-[#8dc63f]/10">
              {extractedFields.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[96px_1fr] gap-2 px-3 py-2 text-xs">
                  <dt className="text-[#7b3fa0]">{label}</dt>
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
        {onOpen && (
          <Button
            size="sm"
            className="mt-3 w-full gap-1.5 rounded-xl bg-[#7b3fa0] text-xs text-white hover:bg-[#6a3490]"
            onClick={() => onOpen(item.createdCaseId!)}
          >
            Abrir Case Cockpit
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
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
  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left: email list ────────────────────────────────── */}
      <div className="flex w-72 shrink-0 flex-col border-r border-slate-100 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#4a7068]" />
              <span className="text-sm font-semibold text-[#152520]">Solicitudes recibidas</span>
              <span className="rounded-full bg-[#7b3fa0] px-1.5 py-0.5 text-[10px] font-bold text-white">
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
              className="h-9 w-full justify-start gap-1.5 rounded-xl bg-[#7b3fa0] text-xs text-white hover:bg-[#6a3490]"
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
                  selected._id === item._id ? 'bg-[#faf6fd]' : ''
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

          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
            <Button
              size="sm"
              className="h-8 gap-1.5 rounded-xl bg-[#7b3fa0] px-3 text-xs font-semibold text-white hover:bg-[#6a3490]"
              onClick={() => void processSelectedItem()}
              disabled={!canProcess || busyAction !== null}
            >
              {busyAction === 'process' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bot className="h-3.5 w-3.5" />}
              Procesar email
            </Button>
            <Button
              size="sm"
              variant={canCreate ? 'default' : 'outline'}
              className={`h-8 gap-1.5 rounded-xl px-3 text-xs font-semibold ${canCreate ? 'bg-emerald-600 text-white hover:bg-emerald-700' : ''}`}
              onClick={() => void createCaseFromSelectedItem()}
              disabled={!canCreate || busyAction !== null}
            >
              {busyAction === 'create' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronRight className="h-3.5 w-3.5" />}
              Crear caso
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 rounded-xl px-3 text-xs font-semibold"
              onClick={() => {
                if (selected.createdCaseId) void onCaseCreated?.(selected.createdCaseId)
              }}
              disabled={!canOpenCase || busyAction !== null}
            >
              <ChevronRight className="h-3.5 w-3.5" />
              Abrir caso
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
          <div className="w-[320px] shrink-0 overflow-y-auto bg-white px-5 py-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#7b3fa0]">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <p className="text-sm font-semibold text-[#152520]">Extracción</p>
            </div>
            <ContextPanel item={selected} onOpen={onCaseCreated} />
          </div>
        </div>
      </div>
    </div>
  )
}
