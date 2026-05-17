'use client'

import { Bot, ChevronDown, ChevronRight, FilePlus, Loader2, Search, SlidersHorizontal, Sparkles, WandSparkles, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import type { CasoResumen, Professional } from '@/components/pkpd/pro/xarxa-types'
import { PRIORITY_STYLE, STAGE_LABEL, STAGE_STYLE, SEVERITY_STYLE } from '@/components/pkpd/pro/xarxa-types'
import { Button } from '@/components/ui/button'
import { fetchJson } from '@/lib/fetch-json'

const KPI_FILTERS: Record<string, string> = {
  'Casos activos': '',
  'Nuevos hoy': '',
  'Pendientes de determinantes': 'Pendiente de determinantes',
  'Listos para revisión': 'Revisión farmacéutica',
  'Con gaps críticos': '__gaps_criticos__',
  'Seguimiento vencido': '__seguimiento_vencido__',
}

// Per-KPI accent: [number color, border color, active bg]
const KPI_ACCENT: Record<string, [string, string, string]> = {
  'Casos activos':               ['text-[#8dc63f]',  'border-[#8dc63f]/30',  'bg-[#8dc63f]/8'],
  'Nuevos hoy':                  ['text-[#7b3fa0]',  'border-[#7b3fa0]/30',  'bg-[#7b3fa0]/8'],
  'Pendientes de determinantes': ['text-[#e8501e]',  'border-[#e8501e]/30',  'bg-[#e8501e]/8'],
  'Listos para revisión':        ['text-[#2a6fd4]',  'border-[#2a6fd4]/30',  'bg-[#2a6fd4]/8'],
  'Con gaps críticos':           ['text-[#c43a08]',  'border-[#c43a08]/30',  'bg-[#c43a08]/8'],
  'Seguimiento vencido':         ['text-[#e8981e]',  'border-[#e8981e]/30',  'bg-[#e8981e]/8'],
}

const QUICK_CHIPS = [
  'Nuevos',
  'Incompletos',
  'Pendiente laboratorio',
  'Listos para revisar',
  'Para sesión',
  'Seguimiento 4 semanas',
  'Cerrados',
]

const SAVED_VIEWS = [
  { id: 'urgentes', label: 'Mis urgentes' },
  { id: 'pendientes', label: 'Pendientes de datos' },
  { id: 'sesion', label: 'Para sesión' },
  { id: 'seguimiento', label: 'En seguimiento' },
] as const

type SavedView = (typeof SAVED_VIEWS)[number]['id'] | ''

type BulkActionResponse = {
  items: CasoResumen[]
  total: number
}

const DEMO_ACTOR = {
  actorName: 'Farmacéutico referente',
  actorRole: 'Farmacéutico experto',
  actorCenter: 'H.U. Bellvitge',
  actorType: 'human',
} as const

type Props = {
  casos: CasoResumen[]
  kpis: Array<{ label: string; value: number }>
  onOpenCaso: (caseId: string) => void
  onNuevoCaso: () => void
  onCasesChanged?: () => Promise<void> | void
}

export function CasosPkpd({ casos, kpis, onOpenCaso, onNuevoCaso, onCasesChanged }: Props) {
  const [search, setSearch] = useState('')
  const [activeStage, setActiveStage] = useState<string>('')
  const [activePriority, setActivePriority] = useState<string>('')
  const [activeCenter, setActiveCenter] = useState<string>('')
  const [activeChip, setActiveChip] = useState<string>('')
  const [savedView, setSavedView] = useState<SavedView>('')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loadingProfessionals, setLoadingProfessionals] = useState(true)
  const [bulkAssigneeId, setBulkAssigneeId] = useState('')
  const [bulkPriority, setBulkPriority] = useState('Alta')
  const [rowAssignee, setRowAssignee] = useState<Record<string, string>>({})
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionNotice, setActionNotice] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadProfessionals() {
      setLoadingProfessionals(true)
      try {
        const payload = await fetchJson<{ professionals?: Professional[] }>('/api/xarxa/professionals')
        if (cancelled) return
        setProfessionals(payload.professionals ?? [])
      } catch {
        if (cancelled) return
        setProfessionals([])
      } finally {
        if (!cancelled) setLoadingProfessionals(false)
      }
    }

    void loadProfessionals()

    return () => {
      cancelled = true
    }
  }, [])

  const pharmacistOptions = useMemo(
    () =>
      professionals.filter(
        (professional) =>
          professional.status === 'Activo' && professional.roleLabel.toLowerCase().includes('farmacéutico')
      ),
    [professionals]
  )

  const centerOptions = useMemo(
    () => Array.from(new Set(casos.map((caso) => caso.centerName))).sort(),
    [casos]
  )

  function matchesChip(caso: CasoResumen, chip: string) {
    switch (chip) {
      case 'Nuevos':
        return ['Solicitud recibida', 'Caso creado por IA'].includes(caso.pipelineStage)
      case 'Incompletos':
      case 'Pendiente laboratorio':
        return ['Datos incompletos', 'Pendiente de determinantes'].includes(caso.pipelineStage)
      case 'Listos para revisar':
        return ['Determinantes recibidos', 'Revisión farmacéutica'].includes(caso.pipelineStage)
      case 'Para sesión':
        return caso.pipelineStage === 'Discusión en red'
      case 'Seguimiento 4 semanas':
        return caso.pipelineStage === 'Seguimiento 4 semanas'
      case 'Cerrados':
        return caso.pipelineStage === 'Cerrado con resultado'
      default:
        return true
    }
  }

  function applySavedView(nextView: SavedView) {
    setSavedView((current) => (current === nextView ? '' : nextView))
  }

  function matchesSavedView(caso: CasoResumen) {
    switch (savedView) {
      case 'urgentes':
        return ['Alta', 'Urgente'].includes(caso.priority)
      case 'pendientes':
        return ['Datos incompletos', 'Pendiente de determinantes'].includes(caso.pipelineStage)
      case 'sesion':
        return caso.pipelineStage === 'Discusión en red'
      case 'seguimiento':
        return ['Seguimiento 4 semanas', 'Seguimiento 8 semanas'].includes(caso.pipelineStage)
      default:
        return true
    }
  }

  function assigneeNameById(professionalId: string) {
    return pharmacistOptions.find((item) => item._id === professionalId)?.name ?? ''
  }

  async function runCaseAction(action: string, caseIds: string[], extra: Record<string, string> = {}, successMessage?: string) {
    if (caseIds.length === 0) return
    setBusyAction(`${action}:${caseIds.join(',')}`)
    setActionError(null)
    setActionNotice(null)
    try {
      await fetchJson<BulkActionResponse>('/api/xarxa/cases/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseIds,
          action,
          ...DEMO_ACTOR,
          ...extra,
        }),
      })
      setActionNotice(successMessage ?? 'La acción se ha aplicado correctamente.')
      setSelectedCaseIds([])
      await onCasesChanged?.()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'No se ha podido aplicar la acción sobre la cola.')
    } finally {
      setBusyAction(null)
    }
  }

  async function orchestrateCase(caseId: string) {
    setBusyAction(`orchestrate:${caseId}`)
    setActionError(null)
    setActionNotice(null)
    try {
      await fetchJson<CasoResumen>(`/api/xarxa/cases/${caseId}/orchestrate`, {
        method: 'POST',
      })
      setActionNotice(`La preparación IA de demostración ha dejado listo el paquete automático para ${caseId}.`)
      await onCasesChanged?.()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'No se ha podido preparar el caso con IA.')
    } finally {
      setBusyAction(null)
    }
  }

  const filtered = casos.filter((c) => {
    if (activeStage === '__gaps_criticos__') {
      return c.gaps?.some((g) => g.severity === 'Crítico')
    }
    if (activeStage && c.pipelineStage !== activeStage) return false
    if (activePriority && c.priority !== activePriority) return false
    if (activeCenter && c.centerName !== activeCenter) return false
    if (activeChip && !matchesChip(c, activeChip)) return false
    if (!matchesSavedView(c)) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        c.caseId.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.patientCode.toLowerCase().includes(q) ||
        c.centerName.toLowerCase().includes(q) ||
        c.requesterName.toLowerCase().includes(q) ||
        c.pipelineStage.toLowerCase().includes(q) ||
        c.caseType.toLowerCase().includes(q)
      )
    }
    return true
  })

  function toggleSelection(caseId: string) {
    setSelectedCaseIds((current) =>
      current.includes(caseId) ? current.filter((item) => item !== caseId) : [...current, caseId]
    )
  }

  function toggleAllVisible() {
    if (filtered.length === 0) return
    const allVisibleIds = filtered.map((item) => item.caseId)
    const allSelected = allVisibleIds.every((item) => selectedCaseIds.includes(item))
    setSelectedCaseIds((current) =>
      allSelected ? current.filter((item) => !allVisibleIds.includes(item)) : Array.from(new Set([...current, ...allVisibleIds]))
    )
  }

  const visibleSelected = filtered.filter((item) => selectedCaseIds.includes(item.caseId)).length
  const allVisibleSelected = filtered.length > 0 && visibleSelected === filtered.length
  const chipCounts = Object.fromEntries(
    QUICK_CHIPS.map((chip) => [chip, casos.filter((caso) => matchesChip(caso, chip)).length])
  ) as Record<string, number>
  const automationTotals = useMemo(
    () => ({
      steps: filtered.reduce((sum, caso) => sum + (caso.automationSummary?.stepsCompleted ?? 0), 0),
      drafts: filtered.reduce((sum, caso) => sum + (caso.automationSummary?.draftsReady ?? 0), 0),
      tasks: filtered.reduce((sum, caso) => sum + (caso.automationSummary?.tasksCreated ?? 0), 0),
      casesReady: filtered.filter((caso) => (caso.automationSummary?.stepsCompleted ?? 0) > 0).length,
    }),
    [filtered]
  )

  return (
    <div className="flex h-full flex-col">
      {/* KPI bar */}
      <div className="shrink-0 border-b border-slate-100 bg-white px-6 py-3">
        <div className="flex flex-wrap gap-3">
          {kpis.map((k) => {
            const stageFilter = KPI_FILTERS[k.label] ?? ''
            const active = activeStage === stageFilter && stageFilter !== ''
            const [numCls, borderCls, activeBg] = KPI_ACCENT[k.label] ?? ['text-[#152520]', 'border-slate-200', 'bg-slate-50']
            return (
              <button
                key={k.label}
                onClick={() => setActiveStage(active ? '' : stageFilter)}
                className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm transition ${
                  active
                    ? `${borderCls} ${activeBg} shadow-sm`
                    : 'border-slate-200 bg-white text-[#4a7068] hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className={`text-2xl font-bold ${numCls}`}>{k.value}</span>
                <span className="max-w-[80px] text-left text-[11px] leading-tight text-[#4a7068]">{k.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Filter bar */}
      <div className="shrink-0 border-b border-slate-100 bg-white px-6 py-3">
        {actionError ? (
          <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError}
          </div>
        ) : null}
        {actionNotice ? (
          <div className="mb-3 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-[#5a7820]">
            {actionNotice}
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm">
            <Search className="h-3.5 w-3.5 text-[#4a7068]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por caso, paciente, centro, fármaco o profesional..."
              className="w-64 bg-transparent text-sm text-[#152520] outline-none placeholder:text-slate-400"
            />
            {search && (
              <button onClick={() => setSearch('')}>
                <X className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600" />
              </button>
            )}
          </div>

          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 rounded-xl text-xs"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtros
          </Button>

          <div className="mx-1 h-5 w-px bg-slate-200" />

          {['Alta', 'Media', 'Baja'].map((p) => (
            <button
              key={p}
              onClick={() => setActivePriority(activePriority === p ? '' : p)}
              className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition ${
                activePriority === p
                  ? (PRIORITY_STYLE[p] ?? 'bg-slate-100 text-slate-700 ring-slate-200')
                  : 'bg-white text-slate-500 ring-slate-200 hover:ring-slate-300'
              }`}
            >
              {p}
            </button>
          ))}

          <select
            value={activeCenter}
            onChange={(event) => setActiveCenter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-[#152520] outline-none"
          >
            <option value="">Todos los centros</option>
            {centerOptions.map((center) => (
              <option key={center} value={center}>
                {center}
              </option>
            ))}
          </select>

          <div className="ml-auto">
            <Button
              size="sm"
              className="gap-1.5 rounded-xl bg-[#8dc63f] text-xs text-white hover:bg-[#9fd44e]"
              onClick={onNuevoCaso}
            >
              <FilePlus className="h-3.5 w-3.5" />
              Nuevo caso
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-3 space-y-3">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4a7068]">
                Vistas guardadas
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SAVED_VIEWS.map((view) => (
                  <button
                    key={view.id}
                    onClick={() => applySavedView(view.id)}
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      savedView === view.id
                        ? 'border-[#8dc63f]/40 bg-teal-50 text-[#5a7820]'
                        : 'border-slate-200 bg-slate-50 text-[#4a7068] hover:border-[#8dc63f]/40 hover:bg-teal-50 hover:text-[#5a7820]'
                    }`}
                  >
                    {view.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => setActiveChip((current) => (current === chip ? '' : chip))}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  activeChip === chip
                    ? 'border-[#8dc63f]/40 bg-teal-50 text-[#5a7820]'
                    : 'border-slate-200 bg-slate-50 text-[#4a7068] hover:border-[#8dc63f]/40 hover:bg-teal-50 hover:text-[#5a7820]'
                }`}
              >
                {chip} <span className="ml-1 text-[10px] opacity-70">{chipCounts[chip]}</span>
              </button>
            ))}
            </div>
          </div>
        )}

        <div className="mt-3 rounded-2xl border border-[#8dc63f]/20 bg-[#edf7f6] px-4 py-3">
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#8dc63f] shadow-sm">
              <WandSparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#152520]">Trabajo automático ya visible en la cola</p>
              <p className="mt-1 text-xs text-[#4a7068]">
                La IA no solo clasifica: también prepara resúmenes, detecta gaps, crea tareas y deja borradores listos para validar.
              </p>
            </div>
            <div className="grid min-w-[320px] gap-2 sm:grid-cols-4">
              <QueueAutomationPill label="Casos preparados" value={String(automationTotals.casesReady)} />
              <QueueAutomationPill label="Pasos IA" value={String(automationTotals.steps)} />
              <QueueAutomationPill label="Borradores" value={String(automationTotals.drafts)} />
              <QueueAutomationPill label="Tareas creadas" value={String(automationTotals.tasks)} />
            </div>
          </div>
        </div>
      </div>

      {selectedCaseIds.length > 0 ? (
        <div className="shrink-0 border-b border-slate-100 bg-[#f8faf9] px-6 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-[#152520]">
              {selectedCaseIds.length} {selectedCaseIds.length === 1 ? 'caso seleccionado' : 'casos seleccionados'}
            </span>
            <select
              value={bulkAssigneeId}
              onChange={(event) => setBulkAssigneeId(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-[#152520] outline-none"
            >
              <option value="">Asignar a farmacéutico…</option>
              {pharmacistOptions.map((professional) => (
                <option key={professional._id} value={professional._id}>
                  {professional.name}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl text-xs"
              disabled={!bulkAssigneeId || busyAction !== null}
              onClick={() =>
                void runCaseAction(
                  'assign',
                  selectedCaseIds,
                  {
                    assignedTo: bulkAssigneeId,
                    assignedName: assigneeNameById(bulkAssigneeId),
                  },
                  'Los casos seleccionados se han asignado.'
                )
              }
            >
              {busyAction?.startsWith('assign:') ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Asignar responsable
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl text-xs"
              disabled={busyAction !== null}
              onClick={() =>
                void runCaseAction(
                  'request_data',
                  selectedCaseIds,
                  {},
                  'Se ha solicitado completar datos para los casos seleccionados.'
                )
              }
            >
              Solicitar datos
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl text-xs"
              disabled={busyAction !== null}
              onClick={() =>
                void runCaseAction(
                  'send_session',
                  selectedCaseIds,
                  {},
                  'Los casos seleccionados se han enviado a sesión de red.'
                )
              }
            >
              Enviar a sesión
            </Button>
            <select
              value={bulkPriority}
              onChange={(event) => setBulkPriority(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-[#152520] outline-none"
            >
              {['Alta', 'Media', 'Baja'].map((priority) => (
                <option key={priority} value={priority}>
                  Prioridad {priority}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl text-xs"
              disabled={busyAction !== null}
              onClick={() =>
                void runCaseAction(
                  'set_priority',
                  selectedCaseIds,
                  { priority: bulkPriority },
                  'La prioridad de los casos seleccionados se ha actualizado.'
                )
              }
            >
              Cambiar prioridad
            </Button>
          </div>
        </div>
      ) : null}

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="min-w-full text-left">
          <thead className="sticky top-0 z-10 border-b border-slate-100 bg-white">
            <tr className="text-[10px] uppercase tracking-[0.16em] text-[#4a7068]">
              <th className="px-4 py-3 font-medium">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleAllVisible}
                  className="h-4 w-4 rounded border-slate-300 text-[#8dc63f] focus:ring-[#8dc63f]"
                />
              </th>
              <th className="px-5 py-3 font-medium">Caso</th>
              <th className="px-4 py-3 font-medium">Paciente</th>
              <th className="px-4 py-3 font-medium">Centro</th>
              <th className="px-4 py-3 font-medium">Solicitante</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Origen</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Prioridad</th>
              <th className="px-4 py-3 font-medium">Gaps</th>
              <th className="px-4 py-3 font-medium">Siguiente paso</th>
              <th className="px-4 py-3 font-medium">Actualizado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={12} className="px-5 py-16 text-center text-sm text-[#4a7068]">
                  No hay casos con estos filtros.
                  <span className="block mt-1 text-xs text-slate-400">Prueba a ampliar el rango o quitar algún filtro.</span>
                </td>
              </tr>
            )}
            {filtered.map((caso) => {
              const isExpanded = expandedRow === caso.caseId
              const criticalGaps = caso.gaps?.filter((g) => g.severity === 'Crítico').length ?? 0
              const totalGaps = caso.gaps?.length ?? 0
              return (
                <>
                  <tr
                    key={caso.caseId}
                    onClick={() => onOpenCaso(caso.caseId)}
                    className={`cursor-pointer transition hover:bg-slate-50 ${isExpanded ? 'bg-teal-50/40' : ''}`}
                  >
                    <td
                      className="px-4 py-3.5"
                      onClick={(event) => {
                        event.stopPropagation()
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCaseIds.includes(caso.caseId)}
                        onChange={() => toggleSelection(caso.caseId)}
                        className="h-4 w-4 rounded border-slate-300 text-[#8dc63f] focus:ring-[#8dc63f]"
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          className="text-slate-400 hover:text-slate-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            setExpandedRow(isExpanded ? null : caso.caseId)
                          }}
                        >
                          {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        </button>
                        <div>
                          <p className="text-xs font-semibold text-[#8dc63f]">{caso.caseId}</p>
                          <p className="max-w-[180px] truncate text-sm font-medium text-[#152520]">{caso.title}</p>
                          {(caso.automationSummary?.highlights?.length ?? 0) > 0 ? (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {caso.automationSummary?.highlights?.slice(0, 2).map((highlight) => (
                                <span
                                  key={highlight}
                                  className="rounded-full bg-[#edf7f6] px-2 py-0.5 text-[10px] font-medium text-[#1a6860]"
                                >
                                  {highlight}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-[#4a7068]">{caso.patientCode}</td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-medium text-[#152520]">{caso.centerName}</p>
                      <p className="text-xs text-[#4a7068]">{caso.specialty}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-[#152520]">{caso.requesterName}</p>
                      <p className="text-xs text-[#4a7068]">{caso.assignedName}</p>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-[#4a7068]">{caso.caseType}</td>
                    <td className="px-4 py-3.5 text-xs text-[#4a7068]">{caso.entrySource}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STAGE_STYLE[caso.pipelineStage] ?? 'bg-slate-100 text-slate-600'}`}>
                        {STAGE_LABEL[caso.pipelineStage] ?? caso.pipelineStage}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${PRIORITY_STYLE[caso.priority] ?? 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'}`}>
                        {caso.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {totalGaps > 0 && (
                        <div className="flex items-center gap-1">
                          {criticalGaps > 0 && (
                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 ring-1 ring-red-200">
                              {criticalGaps} crítico
                            </span>
                          )}
                          <span className="text-xs text-[#4a7068]">{totalGaps} total</span>
                        </div>
                      )}
                    </td>
                    <td className="max-w-[160px] px-4 py-3.5 text-xs text-[#4a7068]">{caso.nextAction}</td>
                    <td className="px-4 py-3.5 text-xs text-[#4a7068]">
                      {new Date(caso.updatedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr key={`${caso.caseId}-expanded`} className="bg-teal-50/30">
                      <td colSpan={12} className="px-8 py-4">
                        <div className="flex flex-wrap items-start gap-6">
                          <div className="min-w-[220px] flex-1">
                            <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-[#4a7068]">Resumen clínico</p>
                            <p className="text-sm leading-6 text-[#152520]">
                              {(caso as any).clinicalSummary || 'Ver caso completo para más detalles.'}
                            </p>
                          </div>
                          <div className="min-w-[240px] rounded-2xl border border-[#8dc63f]/20 bg-white p-4">
                            <div className="mb-2 flex items-center gap-2">
                              <Bot className="h-4 w-4 text-[#8dc63f]" />
                              <p className="text-[10px] uppercase tracking-[0.16em] text-[#4a7068]">
                                Trabajo IA ya hecho
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-[#152520]">
                              {caso.automationSummary?.headline ?? 'Caso estructurado para revisión humana.'}
                            </p>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <QueueAutomationMini label="Pasos" value={String(caso.automationSummary?.stepsCompleted ?? 0)} />
                              <QueueAutomationMini label="Tareas IA" value={String(caso.automationSummary?.tasksCreated ?? 0)} />
                              <QueueAutomationMini label="Pendientes" value={String(caso.automationSummary?.pendingTasks ?? 0)} />
                              <QueueAutomationMini label="Borradores" value={String(caso.automationSummary?.draftsReady ?? 0)} />
                            </div>
                            {(caso.automationSummary?.highlights?.length ?? 0) > 0 ? (
                              <div className="mt-3 space-y-1.5">
                                {caso.automationSummary?.highlights?.slice(0, 3).map((highlight) => (
                                  <div key={highlight} className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-[11px] text-[#152520]">
                                    {highlight}
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                          {caso.gaps?.length > 0 && (
                            <div className="min-w-[200px]">
                              <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-[#4a7068]">Gaps principales</p>
                              <div className="space-y-1">
                                {caso.gaps.slice(0, 3).map((g, i) => (
                                  <div key={i} className="flex items-start gap-2 text-xs">
                                    <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${SEVERITY_STYLE[g.severity] ?? 'bg-slate-100 text-slate-600'}`}>
                                      {g.severity}
                                    </span>
                                    <span className="text-[#4a7068]">{g.label}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="flex shrink-0 flex-wrap gap-2 self-end">
                            <Button
                              size="sm"
                              className="rounded-xl bg-[#8dc63f] text-xs text-white hover:bg-[#9fd44e]"
                              onClick={(e) => {
                                e.stopPropagation()
                                onOpenCaso(caso.caseId)
                              }}
                            >
                              Abrir caso
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl text-xs"
                              disabled={busyAction !== null}
                              onClick={(event) => {
                                event.stopPropagation()
                                void orchestrateCase(caso.caseId)
                              }}
                            >
                              Preparar con IA demo
                            </Button>
                            <select
                              value={rowAssignee[caso.caseId] ?? ''}
                              onChange={(event) =>
                                setRowAssignee((current) => ({
                                  ...current,
                                  [caso.caseId]: event.target.value,
                                }))
                              }
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-[#152520] outline-none"
                            >
                              <option value="">
                                {loadingProfessionals ? 'Cargando responsables…' : 'Asignar a farmacéutico…'}
                              </option>
                              {pharmacistOptions.map((professional) => (
                                <option key={professional._id} value={professional._id}>
                                  {professional.name}
                                </option>
                              ))}
                            </select>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl text-xs"
                              disabled={!rowAssignee[caso.caseId] || busyAction !== null}
                              onClick={(event) => {
                                event.stopPropagation()
                                void runCaseAction(
                                  'assign',
                                  [caso.caseId],
                                  {
                                    assignedTo: rowAssignee[caso.caseId],
                                    assignedName: assigneeNameById(rowAssignee[caso.caseId]),
                                  },
                                  `El caso ${caso.caseId} se ha asignado.`
                                )
                              }}
                            >
                              Asignar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl text-xs"
                              disabled={busyAction !== null}
                              onClick={(event) => {
                                event.stopPropagation()
                                void runCaseAction(
                                  'request_data',
                                  [caso.caseId],
                                  {},
                                  `Se ha solicitado completar datos para ${caso.caseId}.`
                                )
                              }}
                            >
                              Solicitar datos
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl text-xs"
                              disabled={busyAction !== null}
                              onClick={(event) => {
                                event.stopPropagation()
                                void runCaseAction(
                                  'send_session',
                                  [caso.caseId],
                                  {},
                                  `El caso ${caso.caseId} se ha enviado a sesión de red.`
                                )
                              }}
                            >
                              Marcar para sesión
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="shrink-0 border-t border-slate-100 bg-white px-6 py-2.5 text-xs text-[#4a7068]">
        {filtered.length} {filtered.length === 1 ? 'caso' : 'casos'} · {visibleSelected} seleccionados visibles · Programa: <span className="font-medium text-[#152520]">Crohn PK/PD</span>
      </div>
    </div>
  )
}

function QueueAutomationPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/70 bg-white px-3 py-2 shadow-sm">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#4a7068]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#152520]">{value}</p>
    </div>
  )
}

function QueueAutomationMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-[#f8faf9] px-2.5 py-2">
      <p className="text-[10px] uppercase tracking-[0.12em] text-[#4a7068]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#152520]">{value}</p>
    </div>
  )
}
