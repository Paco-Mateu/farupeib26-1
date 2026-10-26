'use client'

import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Mail,
  RefreshCw,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useXarxaT } from '@/components/i18n/use-xarxa-strings'
import { Button } from '@/components/ui/button'
import { ActionConfirmDialog } from '@/components/ui/action-confirm-dialog'
import {
  WorkspaceEmptyState,
  WorkspaceErrorState,
  WorkspaceLoadingState,
} from '@/components/pkpd/pro/workspace-state'
import type { InboxItem, InboxStepStatus } from '@/components/pkpd/pro/xarxa-types'
import { PersonAvatar } from '@/components/pkpd/pro/person-avatar'
import { fetchJson } from '@/lib/fetch-json'

type BandejaIaProps = {
  onCaseCreated?: (
    caseId: string,
    options?: {
      source?: 'inbox' | 'wizard'
      initialTab?: 'resumen' | 'datos' | 'analisis' | 'recomendacion' | 'actividad'
      openEditor?: boolean
      notice?: string
    },
  ) => void | Promise<void>
  mobile?: boolean
}

type InboxResponse = {
  items: InboxItem[]
  total: number
}

type CreateCaseResponse = {
  item: InboxItem
  case: { caseId: string }
}

type StructuredField = {
  key: string
  label: string
  value: string
  category: ExtractionCategory
}

type ExtractionCategory = 'paciente' | 'medicacion' | 'determinante' | 'contexto'

const EXTRACTION_CATEGORY_META: Record<
  ExtractionCategory,
  { labelKey: string; mark: string; chip: string; sectionKey: string }
> = {
  paciente: {
    labelKey: 'cat.paciente.label',
    mark: 'bg-sky-50 text-sky-800 ring-1 ring-sky-200',
    chip: 'bg-sky-100 text-sky-700',
    sectionKey: 'cat.paciente.section',
  },
  medicacion: {
    labelKey: 'cat.medicacion.label',
    mark: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200',
    chip: 'bg-emerald-100 text-emerald-700',
    sectionKey: 'cat.medicacion.section',
  },
  determinante: {
    labelKey: 'cat.determinante.label',
    mark: 'bg-amber-50 text-amber-900 ring-1 ring-amber-200',
    chip: 'bg-amber-100 text-amber-800',
    sectionKey: 'cat.determinante.section',
  },
  contexto: {
    labelKey: 'cat.contexto.label',
    mark: 'bg-rose-50 text-rose-800 ring-1 ring-rose-200',
    chip: 'bg-rose-100 text-rose-700',
    sectionKey: 'cat.contexto.section',
  },
}

const EXTRACTION_FIELD_CATEGORIES: Record<string, ExtractionCategory> = {
  patientCode: 'paciente',
  sex: 'paciente',
  age: 'paciente',
  weight: 'paciente',
  drug: 'medicacion',
  currentDose: 'medicacion',
  recentDose: 'medicacion',
  interval: 'medicacion',
  route: 'medicacion',
  levelResult: 'determinante',
  crp: 'determinante',
  calprotectin: 'determinante',
  antibodies: 'determinante',
  indication: 'contexto',
  requestType: 'contexto',
  phenotype: 'contexto',
  activity: 'contexto',
}

function AgentStatusBadge({ status }: { status: InboxItem['agentStatus'] }) {
  const t = useXarxaT('bandeja-ia')
  const map: Record<InboxItem['agentStatus'], { labelKey: string; className: string }> = {
    pending: { labelKey: 'status.pending', className: 'bg-slate-100 text-slate-500' },
    processing: { labelKey: 'status.processing', className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
    ready: { labelKey: 'status.ready', className: 'bg-[#faf6fd] text-[#7b3fa0] ring-1 ring-[#7b3fa0]/30' },
    error: { labelKey: 'status.error', className: 'bg-red-50 text-red-700 ring-1 ring-red-200' },
    created: { labelKey: 'status.created', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  }
  const variant = map[status]
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${variant.className}`}>
      {t(variant.labelKey)}
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

function AgentCreateCasePanel() {
  const t = useXarxaT('bandeja-ia')
  return (
    <AgentThinkingPanel
      steps={[
        { label: t('create.step.1'), status: 'done' },
        { label: t('create.step.2'), status: 'running' },
        { label: t('create.step.3'), status: 'pending' },
        { label: t('create.step.4'), status: 'pending' },
      ]}
    />
  )
}

function ProcessingPanel({
  steps,
  extraction,
}: {
  steps: Array<{ label: string; status: InboxStepStatus }>
  extraction?: InboxItem['extraction']
}) {
  const t = useXarxaT('bandeja-ia')
  const fields = getStructuredFields(extraction)

  return (
    <div className="space-y-4">
      <AgentThinkingPanel steps={steps} />
      <div className="rounded-xl border border-[#7b3fa0]/15 bg-[#faf6fd] p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4a7068]">{t('processing.draft')}</p>
        {fields.length > 0 ? (
          <div className="mt-2 space-y-2">
            {fields.slice(0, 8).map((field) => (
              <div
                key={field.key}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/70 bg-white/80 px-2.5 py-2 text-xs shadow-sm"
              >
                <span className="text-[#7b3fa0]">{t(field.label)}</span>
                <span className="font-semibold text-[#152520]">{field.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-100 bg-white/70 px-3 py-2 text-xs text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#7b3fa0]" />
            {t('processing.waiting')}
          </div>
        )}
      </div>
    </div>
  )
}

function PendingPanel() {
  const t = useXarxaT('bandeja-ia')
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100">
        <Sparkles className="h-5 w-5 text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-500">{t('pending.title')}</p>
    </div>
  )
}

function ReadyPanel({
  extraction,
  activeFieldKey,
  onFieldClick,
}: {
  extraction: InboxItem['extraction']
  activeFieldKey: string | null
  onFieldClick: (field: StructuredField) => void
}) {
  const t = useXarxaT('bandeja-ia')
  const extractedFields = getStructuredFields(extraction)
  const groupedFields = extractedFields.reduce<Record<string, typeof extractedFields>>((groups, field) => {
    const group = EXTRACTION_CATEGORY_META[field.category].sectionKey
    groups[group] = groups[group] ?? []
    groups[group].push(field)
    return groups
  }, {})

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4a7068]">{t('ready.legend')}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.entries(EXTRACTION_CATEGORY_META) as Array<[ExtractionCategory, (typeof EXTRACTION_CATEGORY_META)[ExtractionCategory]]>).map(([key, meta]) => (
            <span key={key} className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${meta.chip}`}>
              {t(meta.labelKey)}
            </span>
          ))}
        </div>
      </div>

      {/* Extracted data */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-[#7b3fa0]" />
          <p className="text-xs font-semibold text-[#152520]">
            {t('ready.draft.count').replaceAll('{count}', String(extractedFields.length))}
          </p>
        </div>
        <div className="overflow-hidden rounded-xl border border-[#7b3fa0]/20 bg-[#faf6fd]">
          {extraction && extractedFields.length > 0 ? (
            <div className="divide-y divide-[#8dc63f]/10">
              {Object.entries(groupedFields).map(([groupLabel, fields]) => (
                <div key={groupLabel} className="px-3 py-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4a7068]">{t(groupLabel)}</p>
                  <dl className="space-y-2">
                    {fields.map((field) => (
                      <button
                        key={field.key}
                        type="button"
                        onClick={() => onFieldClick(field)}
                        className={`grid w-full grid-cols-[96px_1fr] gap-2 rounded-xl px-2 py-2 text-left text-xs transition ${
                          activeFieldKey === field.key
                            ? 'bg-white ring-1 ring-[#7b3fa0]/30 shadow-sm'
                            : 'hover:bg-white/80'
                        }`}
                      >
                        <dt className="text-[#7b3fa0]">{t(field.label)}</dt>
                        <dd className="font-semibold text-[#152520]">{field.value}</dd>
                      </button>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-3 py-3 text-xs text-[#4a7068]">{t('ready.unavailable')}</p>
          )}
        </div>
      </div>
      <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700">
        {t('ready.structured.notice')}
      </div>
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
  const t = useXarxaT('bandeja-ia')
  if (!item.createdCaseId) return null
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#152520]">{t('created.success')}</p>
          <p className="text-xs text-[#4a7068]">{item.createdCaseId}</p>
        </div>
      </div>
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
        <p className="text-xs text-slate-500">{t('created.caseId')}</p>
        <p className="mt-0.5 text-base font-bold text-[#152520]">{item.createdCaseId}</p>
        {onOpen && (
          <Button
            size="sm"
            className="mt-3 w-full gap-1.5 rounded-xl bg-[#7b3fa0] text-xs text-white hover:bg-[#6a3490]"
            onClick={() => onOpen(item.createdCaseId!)}
          >
            {t('created.open')}
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
  activeFieldKey,
  onFieldClick,
  createBusy,
  processingExtraction,
}: {
  item: InboxItem
  onOpen?: (caseId: string) => void
  activeFieldKey: string | null
  onFieldClick: (field: StructuredField) => void
  createBusy: boolean
  processingExtraction?: InboxItem['extraction']
}) {
  const t = useXarxaT('bandeja-ia')
  if (createBusy) {
    return <AgentCreateCasePanel />
  }
  if (item.agentStatus === 'processing') {
    return <ProcessingPanel steps={item.agentSteps} extraction={processingExtraction} />
  }
  if (item.agentStatus === 'ready') {
    return <ReadyPanel extraction={item.extraction} activeFieldKey={activeFieldKey} onFieldClick={onFieldClick} />
  }
  if (item.agentStatus === 'created') {
    return <CreatedPanel item={item} onOpen={onOpen} />
  }
  if (item.agentStatus === 'error') {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <p className="text-sm font-semibold text-red-800">{t('error.title')}</p>
        </div>
        <div className="space-y-1.5">
          {item.agentSteps.map((step) => (
            <div key={step.label} className="flex items-center gap-2 text-xs text-red-700">
              <div className={`h-2 w-2 rounded-full shrink-0 ${step.status === 'done' ? 'bg-green-400' : 'bg-red-400'}`} />
              {step.label}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-red-600">{t('error.retry.hint')}</p>
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

function renderHighlightedEmail(
  body: string,
  fields: StructuredField[],
  activeFieldKey: string | null = null,
) {
  if (fields.length === 0) return body

  const terms = fields
    .map((field) => ({ key: field.key, value: field.value, category: field.category }))
    .filter((field) => field.value.length >= 3)

  const uniqueTerms = Array.from(
    new Map(terms.map((item) => [item.value.toLowerCase(), item])).values(),
  ).sort((a, b) => b.value.length - a.value.length)

  if (uniqueTerms.length === 0) return body

  const matcher = new RegExp(`(${uniqueTerms.map((term) => escapeRegExp(term.value)).join('|')})`, 'gi')
  const parts = body.split(matcher)

  return parts.map((part, index) => {
    const matched = uniqueTerms.find((term) => term.value.toLowerCase() === part.toLowerCase())
    if (!matched) return part

    return (
      <mark
        key={`${part}-${index}`}
        data-field-key={matched.key}
        data-field-value={matched.value.toLowerCase()}
        className={`rounded-md px-1.5 py-0.5 font-medium transition ${
          EXTRACTION_CATEGORY_META[matched.category].mark
        } ${activeFieldKey === matched.key ? 'ring-2 ring-[#152520]/20 ring-offset-1 shadow-sm' : ''}`}
      >
        {part}
      </mark>
    )
  })
}

function getStructuredFields(extraction?: InboxItem['extraction']) {
  if (!extraction) return [] as StructuredField[]

  const labelKeys: Record<string, string> = {
    patientCode: 'field.patientCode',
    drug: 'field.drug',
    indication: 'field.indication',
    weight: 'field.weight',
    recentDose: 'field.recentDose',
    levelResult: 'field.levelResult',
    requestType: 'field.requestType',
    currentDose: 'field.currentDose',
    interval: 'field.interval',
    route: 'field.route',
    crp: 'field.crp',
    calprotectin: 'field.calprotectin',
    antibodies: 'field.antibodies',
    phenotype: 'field.phenotype',
    activity: 'field.activity',
    sex: 'field.sex',
    age: 'field.age',
  }

  return Object.entries(labelKeys)
    .map(([key, labelKey]) => {
      const value = extraction[key as keyof typeof extraction]
      if (value === null || value === undefined || value === '') return null
      return {
        key,
        label: labelKey,
        value: String(value),
        category: EXTRACTION_FIELD_CATEGORIES[key] ?? 'contexto',
      }
    })
    .filter(Boolean) as StructuredField[]
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function BandejaIa({ onCaseCreated, mobile = false }: BandejaIaProps) {
  const t = useXarxaT('bandeja-ia')
  const [items, setItems] = useState<InboxItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [busyAction, setBusyAction] = useState<'refresh' | 'generate' | 'process' | 'create' | 'delete' | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [streamedFieldKeys, setStreamedFieldKeys] = useState<string[]>([])
  const [activeFieldKey, setActiveFieldKey] = useState<string | null>(null)
  const emailBodyRef = useRef<HTMLDivElement | null>(null)

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
      setError(loadError instanceof Error ? loadError.message : t('error.load'))
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

  useEffect(() => {
    setActiveFieldKey(null)
    if (selected?.agentStatus !== 'processing') {
      setStreamedFieldKeys([])
    }
  }, [selected?._id, selected?.agentStatus])

  useEffect(() => {
    if (!selected?.extraction || selected.agentStatus !== 'processing') return
    const fields = getStructuredFields(selected.extraction)
    if (fields.length === 0) return

    setStreamedFieldKeys([])
    let cancelled = false
    const timers = fields.map((field, index) =>
      window.setTimeout(() => {
        if (cancelled) return
        setStreamedFieldKeys((current) => (current.includes(field.key) ? current : [...current, field.key]))
      }, 220 + index * 130),
    )

    return () => {
      cancelled = true
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [selected?._id, selected?.agentStatus, selected?.extraction])

  const visibleExtraction = useMemo(() => {
    if (!selected?.extraction) return undefined
    if (selected.agentStatus === 'ready' || selected.agentStatus === 'created') {
      return selected.extraction
    }
    if (selected.agentStatus === 'processing') {
      return Object.fromEntries(
        Object.entries(selected.extraction).filter(([key]) => streamedFieldKeys.includes(key)),
      ) as InboxItem['extraction']
    }
    return undefined
  }, [selected, streamedFieldKeys])

  const visibleFields = useMemo(() => getStructuredFields(visibleExtraction), [visibleExtraction])

  function focusStructuredField(field: StructuredField) {
    setActiveFieldKey(field.key)
    window.requestAnimationFrame(() => {
      const root = emailBodyRef.current
      const target = root?.querySelector<HTMLElement>(`[data-field-key="${field.key}"]`)
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  async function generateInboxItem() {
    setError(null)
    setBusyAction('generate')
    try {
      const item = await fetchJson<InboxItem>('/api/xarxa/inbox/generate', { method: 'POST' })
      setItems((current) => [item, ...current])
      setSelectedId(item._id)
      setStatus('ready')
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : t('error.generate'))
    } finally {
      setBusyAction(null)
    }
  }

  async function processSelectedItem() {
    if (!selected) return
    setError(null)
    setBusyAction('process')
    setItems((current) =>
      current.map((entry) =>
        entry._id === selected._id
          ? { ...entry, agentStatus: 'processing', agentSteps: entry.agentSteps.map((step, index) => ({
              ...step,
              status: index < 1 ? 'done' : index === 1 ? 'running' : 'pending',
            })) }
          : entry,
      ),
    )
    try {
      const [item] = await Promise.all([
        fetchJson<InboxItem>(`/api/xarxa/inbox/${selected._id}/process`, { method: 'POST' }),
        new Promise((resolve) => window.setTimeout(resolve, 1300)),
      ])
      setItems((current) => current.map((entry) => (entry._id === item._id ? item : entry)))
      setSelectedId(item._id)
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : t('error.process'))
    } finally {
      setBusyAction(null)
    }
  }

  async function deleteSelectedItem() {
    if (!selected) return
    setError(null)
    setBusyAction('delete')
    const selectedIndex = items.findIndex((item) => item._id === selected._id)
    try {
      await fetchJson<{ ok: boolean }>(`/api/xarxa/inbox/${selected._id}`, { method: 'DELETE' })
      const nextItems = items.filter((item) => item._id !== selected._id)
      setItems(nextItems)
      const fallback = nextItems[selectedIndex] ?? nextItems[selectedIndex - 1] ?? nextItems[0] ?? null
      setSelectedId(fallback?._id ?? null)
      setDeleteConfirmOpen(false)
      if (mobile) setMobileDetailOpen(false)
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : t('error.delete'))
    } finally {
      setBusyAction(null)
    }
  }

  async function createCaseFromSelectedItem() {
    if (!selected) return
    setError(null)
    setBusyAction('create')
    try {
      const [response] = await Promise.all([
        fetchJson<CreateCaseResponse>(`/api/xarxa/inbox/${selected._id}/create-case`, { method: 'POST' }),
        new Promise((resolve) => window.setTimeout(resolve, 1200)),
      ])
      setItems((current) =>
        current.map((entry) => (entry._id === response.item._id ? response.item : entry))
      )
      setSelectedId(response.item._id)
      await onCaseCreated?.(response.case.caseId, {
        source: 'inbox',
        initialTab: 'datos',
        openEditor: true,
        notice: t('notice.create'),
      })
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : t('error.create'))
    } finally {
      setBusyAction(null)
    }
  }

  if (status === 'loading' && items.length === 0) {
    return (
      <WorkspaceLoadingState
        title={t('loading.title')}
        detail={t('loading.detail')}
      />
    )
  }

  if (status === 'error' && items.length === 0) {
    return (
      <WorkspaceErrorState
        title={t('error.load')}
        detail={error ?? undefined}
        onRetry={() => void loadInbox()}
      />
    )
  }

  if (items.length === 0 || !selected) {
    return (
      <WorkspaceEmptyState
        title={t('empty.title')}
        detail={t('empty.detail')}
        actionLabel={t('action.generate')}
        onAction={() => void generateInboxItem()}
      />
    )
  }

  const canProcess = selected.agentStatus === 'pending' || selected.agentStatus === 'processing' || selected.agentStatus === 'error'
  const canCreate = selected.agentStatus === 'ready'
  const canOpenCase = selected.agentStatus === 'created' && selected.createdCaseId

  // ── Mobile: list view ──────────────────────────────────────────────────────
  if (mobile && !mobileDetailOpen) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="shrink-0 border-b border-slate-100 bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#4a7068]" />
              <span className="text-sm font-semibold text-[#152520]">{t('list.title')}</span>
              <span className="rounded-full bg-[#7b3fa0] px-1.5 py-0.5 text-[10px] font-bold text-white">{items.length}</span>
            </div>
            <button
              className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
              onClick={() => { setBusyAction('refresh'); void loadInbox().finally(() => setBusyAction(null)) }}
              aria-label={t('list.refresh.aria')}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${busyAction === 'refresh' ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="mt-3">
            <Button
              size="sm"
              variant="outline"
              className="h-9 w-full justify-start gap-1.5 rounded-xl border-[#7b3fa0]/45 text-xs text-[#7b3fa0] hover:bg-[#faf6fd] hover:text-[#7b3fa0]"
              onClick={() => void generateInboxItem()}
              disabled={busyAction !== null}
            >
              {busyAction === 'generate' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {t('action.generate')}
            </Button>
          </div>
        </div>
        <ul className="flex-1 divide-y divide-slate-50 overflow-y-auto">
          {items.map((item) => (
            <li key={item._id}>
              <button
                onClick={() => { setSelectedId(item._id); setMobileDetailOpen(true) }}
                className="w-full px-4 py-3.5 text-left transition hover:bg-slate-50 active:bg-[#faf6fd]"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-xs font-semibold text-[#152520]">{item.centerName}</p>
                  <span className="shrink-0 text-[10px] text-[#4a7068]">{formatReceivedAt(item.receivedAt)}</span>
                </div>
                <p className="mt-0.5 truncate text-xs text-[#152520]">{item.subject}</p>
                <span className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-[#4a7068]">
                  <PersonAvatar name={item.requesterName ?? ''} size="xs" />
                  {item.requesterName}
                </span>
                <div className="mt-1.5 flex items-center gap-2">
                  <AgentStatusBadge status={item.agentStatus} />
                  {item.createdCaseId ? <span className="text-[10px] text-[#4a7068]">{item.createdCaseId}</span> : null}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  // ── Mobile: detail view ────────────────────────────────────────────────────
  if (mobile && mobileDetailOpen && selected) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        {/* Back header */}
        <div className="shrink-0 flex items-center gap-3 border-b border-slate-100 bg-white px-4 py-3">
          <button
            onClick={() => setMobileDetailOpen(false)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f1f3f5] text-[#152520] transition active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <p className="flex-1 truncate text-sm font-semibold text-[#152520]">{selected.subject}</p>
          <button
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-50 hover:text-red-600"
            onClick={() => setDeleteConfirmOpen(true)}
            disabled={busyAction !== null}
            aria-label={t('delete.label')}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <ActionConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title={t('delete.label')}
          description={t('delete.description')}
          confirmLabel={t('delete.label')}
          cancelLabel={t('cancel')}
          tone="danger"
          icon={<Trash2 className="h-5 w-5" />}
          confirmBusy={busyAction === 'delete'}
          onConfirm={() => void deleteSelectedItem()}
        />

        {/* Meta row */}
        <div className="shrink-0 border-b border-slate-100 bg-white px-4 py-2">
          <div className="flex items-center gap-2 flex-wrap">
            <AgentStatusBadge status={selected.agentStatus} />
            <p className="text-[11px] text-[#4a7068]">
              {selected.from} · {formatReceivedAt(selected.receivedAt)} · {selected.centerName}
              {selected.programSuggestion ? ` · ${selected.programSuggestion}${selected.confidence ? ` · IA ${selected.confidence}%` : ''}` : ''}
            </p>
          </div>
        </div>

        {/* Action bar */}
        <div className="shrink-0 border-b border-slate-100 bg-white px-4 py-3 space-y-2">
          <Button
            className="h-9 w-full gap-1.5 rounded-xl bg-[#7b3fa0] text-xs font-semibold text-white hover:bg-[#6a3490]"
            onClick={() => void processSelectedItem()}
            disabled={!canProcess || busyAction !== null}
          >
            {busyAction === 'process' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bot className="h-3.5 w-3.5" />}
            {t('action.process')}
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant={canCreate ? 'default' : 'outline'}
              className={`h-9 gap-1.5 rounded-xl text-xs font-semibold ${canCreate ? 'bg-emerald-600 text-white hover:bg-emerald-700' : ''}`}
              onClick={() => void createCaseFromSelectedItem()}
              disabled={!canCreate || busyAction !== null}
            >
              {busyAction === 'create' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronRight className="h-3.5 w-3.5" />}
              {t('action.create')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9 gap-1.5 rounded-xl text-xs font-semibold"
              onClick={() => { if (selected.createdCaseId) void onCaseCreated?.(selected.createdCaseId) }}
              disabled={!canOpenCase || busyAction !== null}
            >
              <ChevronRight className="h-3.5 w-3.5" />
              {t('action.open')}
            </Button>
          </div>
          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
          )}
        </div>

        {/* Scrollable body: email + structured panel stacked */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {/* Email original */}
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#4a7068]">{t('email.original')}</p>
            <div ref={emailBodyRef} className="overflow-hidden rounded-xl border border-slate-200 bg-[#f8f7f4] shadow-sm">
              {/* Email header */}
              <div className="border-b border-slate-200 bg-white px-4 py-3 space-y-0.5">
                <div className="flex items-baseline gap-2">
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#4a7068] w-10">{t('email.from')}</span>
                  <span className="text-xs font-medium text-[#152520]">{selected.from}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#4a7068] w-10">{t('email.subject')}</span>
                  <span className="text-xs text-[#4a7068] truncate">{selected.subject}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#4a7068] w-10">{t('email.date')}</span>
                  <span className="text-[10px] text-[#4a7068]">{formatReceivedAt(selected.receivedAt)}</span>
                </div>
              </div>
              {/* Body */}
              <pre className="whitespace-pre-wrap px-4 py-4 font-mono text-[12.5px] leading-7 text-[#1e1e1e]">
                {renderHighlightedEmail(selected.body, visibleFields, activeFieldKey)}
              </pre>
            </div>
            {visibleFields.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {(Object.entries(EXTRACTION_CATEGORY_META) as Array<[ExtractionCategory, (typeof EXTRACTION_CATEGORY_META)[ExtractionCategory]]>).map(([key, meta]) => (
                  <span key={key} className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${meta.chip}`}>{t(meta.labelKey)}</span>
                ))}
              </div>
            )}
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.12em] text-[#4a7068]">{t('meta.requester')}</p>
                <span className="mt-1 flex items-center gap-1.5">
                  <PersonAvatar name={selected.requesterName ?? ''} size="xs" />
                  <span className="text-xs font-semibold text-[#152520]">{selected.requesterName}</span>
                </span>
                <p className="text-[10px] text-[#4a7068]">{selected.centerName}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.12em] text-[#4a7068]">{t('meta.program')}</p>
                <p className="mt-0.5 text-xs font-semibold text-[#152520]">{selected.programSuggestion ?? 'Crohn PK/PD'}</p>
                <p className="text-[10px] text-[#4a7068]">{selected.caseTypeSuggestion ?? 'Consulta PK/PD'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.12em] text-[#4a7068]">{t('meta.extraction')}</p>
                <p className="mt-0.5 text-xs font-semibold text-[#152520]">{visibleFields.length || '—'}</p>
                <p className="text-[10px] text-[#4a7068]">
                  {selected.agentStatus === 'ready' ? t('meta.extraction.ready') : selected.agentStatus === 'processing' ? t('status.processing') : selected.agentStatus === 'created' ? t('meta.extraction.created') : t('meta.extraction.pending')}
                </p>
              </div>
            </div>
          </div>

          {/* Borrador estructurado */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#7b3fa0]">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <p className="text-sm font-semibold text-[#152520]">{t('draft.title')}</p>
            </div>
            <ContextPanel
              item={selected}
              onOpen={(caseId) => void onCaseCreated?.(caseId)}
              activeFieldKey={activeFieldKey}
              onFieldClick={focusStructuredField}
              createBusy={busyAction === 'create'}
              processingExtraction={visibleExtraction}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left: email list ────────────────────────────────── */}
      <div className="flex w-72 shrink-0 flex-col border-r border-slate-100 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#4a7068]" />
              <span className="text-sm font-semibold text-[#152520]">{t('list.title')}</span>
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
              aria-label={t('list.refresh.aria')}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${busyAction === 'refresh' ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="mt-3 space-y-2">
            <Button
              size="sm"
              variant="outline"
              className="h-9 w-full justify-start gap-1.5 rounded-xl border-[#7b3fa0]/45 text-xs text-[#7b3fa0] hover:bg-[#faf6fd] hover:text-[#7b3fa0]"
              onClick={() => void generateInboxItem()}
              disabled={busyAction !== null}
            >
              {busyAction === 'generate' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {t('action.generate')}
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
                <span className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-[#4a7068]">
                  <PersonAvatar name={item.requesterName ?? ''} size="xs" />
                  {item.requesterName}
                </span>
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
            <div className="flex items-center gap-2">
              <AgentStatusBadge status={selected.agentStatus} />
              <button
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-50 hover:text-red-600"
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={busyAction !== null}
                aria-label={t('delete.label')}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
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
              {t('action.process')}
            </Button>
            <Button
              size="sm"
              variant={canCreate ? 'default' : 'outline'}
              className={`h-8 gap-1.5 rounded-xl px-3 text-xs font-semibold ${canCreate ? 'bg-emerald-600 text-white hover:bg-emerald-700' : ''}`}
              onClick={() => void createCaseFromSelectedItem()}
              disabled={!canCreate || busyAction !== null}
            >
              {busyAction === 'create' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronRight className="h-3.5 w-3.5" />}
              {t('action.create')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 rounded-xl px-3 text-xs font-semibold"
              onClick={() => {
                if (selected.createdCaseId) {
                  void onCaseCreated?.(selected.createdCaseId, {
                    source: 'inbox',
                    initialTab: 'datos',
                    openEditor: true,
                    notice: t('notice.open'),
                  })
                }
              }}
              disabled={!canOpenCase || busyAction !== null}
            >
              <ChevronRight className="h-3.5 w-3.5" />
              {t('action.open')}
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
              {t('email.original')}
            </p>
            <div ref={emailBodyRef} className="overflow-hidden rounded-xl border border-slate-200 bg-[#f8f7f4] shadow-sm">
              {/* Email header */}
              <div className="border-b border-slate-200 bg-white px-5 py-3.5 space-y-1">
                <div className="flex items-baseline gap-3">
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#4a7068] w-12">{t('email.from')}</span>
                  <span className="text-xs font-medium text-[#152520]">{selected.from}</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#4a7068] w-12">{t('email.subject')}</span>
                  <span className="text-xs text-[#4a7068]">{selected.subject}</span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#4a7068] w-12">{t('email.date')}</span>
                  <span className="text-[10px] text-[#4a7068]">{formatReceivedAt(selected.receivedAt)}</span>
                </div>
              </div>
              {/* Body */}
              <pre className="whitespace-pre-wrap px-5 py-5 font-mono text-[12.5px] leading-7 text-[#1e1e1e]">
                {renderHighlightedEmail(selected.body, visibleFields, activeFieldKey)}
              </pre>
            </div>
            {visibleFields.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {(Object.entries(EXTRACTION_CATEGORY_META) as Array<[ExtractionCategory, (typeof EXTRACTION_CATEGORY_META)[ExtractionCategory]]>).map(([key, meta]) => (
                  <span key={key} className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${meta.chip}`}>
                    {t(meta.labelKey)}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {/* Context panel */}
          <div className="w-[320px] shrink-0 overflow-y-auto bg-[#f8f9fa] px-5 py-5">
            {/* Meta summary */}
            <div className="mb-4 space-y-2">
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#4a7068]">{t('meta.requester')}</p>
                <p className="mt-1 text-xs font-semibold text-[#152520]">{selected.requesterName}</p>
                <p className="text-[10px] text-[#4a7068]">{selected.centerName}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#4a7068]">{t('meta.program.suggested')}</p>
                <p className="mt-1 text-xs font-semibold text-[#152520]">{selected.programSuggestion ?? 'Crohn PK/PD'}</p>
                <p className="text-[10px] text-[#4a7068]">{selected.caseTypeSuggestion ?? 'Consulta PK/PD'}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#4a7068]">{t('meta.extraction')}</p>
                <p className="mt-1 text-xs font-semibold text-[#152520]">{visibleFields.length || '—'}</p>
                <p className="text-[10px] text-[#4a7068]">
                  {selected.agentStatus === 'ready'
                    ? t('meta.extraction.ready.long')
                    : selected.agentStatus === 'processing'
                      ? t('meta.extraction.processing.long')
                      : selected.agentStatus === 'created'
                        ? t('meta.extraction.created.long')
                        : t('meta.extraction.pending.long')}
                </p>
              </div>
            </div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#7b3fa0]">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <p className="text-sm font-semibold text-[#152520]">{t('draft.title')}</p>
            </div>
            <ContextPanel
              item={selected}
              onOpen={onCaseCreated}
              activeFieldKey={activeFieldKey}
              onFieldClick={focusStructuredField}
              createBusy={busyAction === 'create'}
              processingExtraction={visibleExtraction}
            />
          </div>
        </div>
      </div>

      <ActionConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Eliminar solicitud"
        description="Se eliminará esta solicitud de la bandeja IA. Esta acción limpia el correo entrante, pero no afecta a casos ya creados."
        confirmLabel="Eliminar solicitud"
        cancelLabel="Cancelar"
        tone="danger"
        icon={<Trash2 className="h-5 w-5" />}
        confirmBusy={busyAction === 'delete'}
        onConfirm={() => void deleteSelectedItem()}
      />
    </div>
  )
}
