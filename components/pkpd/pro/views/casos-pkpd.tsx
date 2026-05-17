'use client'

import { AlertTriangle, ChevronDown, FilePlus, Loader2, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react'
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
  'Casos activos':               ['text-[#7b3fa0]',  'border-[#7b3fa0]/30',  'bg-[#7b3fa0]/8'],
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
  const [drawerCaseId, setDrawerCaseId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showKpis, setShowKpis] = useState(false)
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
      setActionNotice(`El paquete del caso ${caseId} se ha actualizado.`)
      await onCasesChanged?.()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'No se ha podido actualizar el paquete del caso.')
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

  const drawerCase = drawerCaseId ? filtered.find((c) => c.caseId === drawerCaseId) ?? null : null

  return (
    <div className="flex h-full flex-col">
      {/* Command bar */}
      <div className="shrink-0 border-b border-slate-100 bg-white px-5 py-2.5">
        {actionError ? (
          <div className="mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{actionError}</div>
        ) : null}
        {actionNotice ? (
          <div className="mb-2 rounded-xl border border-[#7b3fa0]/20 bg-[#faf6fd] px-3 py-2 text-xs text-[#7b3fa0]">{actionNotice}</div>
        ) : null}

        {/* Main toolbar row */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-[#4a7068]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar caso, paciente, centro…"
              className="w-52 bg-transparent text-sm text-[#152520] outline-none placeholder:text-slate-400"
            />
            {search && (
              <button onClick={() => setSearch('')}>
                <X className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600" />
              </button>
            )}
          </div>

          {/* Filters toggle */}
          <Button
            size="sm"
            variant="outline"
            className={`gap-1.5 rounded-xl text-xs ${showFilters ? 'border-[#7b3fa0]/40 bg-[#faf6fd] text-[#7b3fa0]' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtros
          </Button>

          <div className="h-4 w-px bg-slate-200" />

          {/* Priority quick chips */}
          {['Alta', 'Media', 'Baja'].map((p) => (
            <button
              key={p}
              onClick={() => setActivePriority(activePriority === p ? '' : p)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition ${
                activePriority === p
                  ? (PRIORITY_STYLE[p] ?? 'bg-slate-100 text-slate-700 ring-slate-200')
                  : 'bg-white text-slate-500 ring-slate-200 hover:ring-slate-300'
              }`}
            >
              {p}
            </button>
          ))}

          {/* Center filter */}
          <select
            value={activeCenter}
            onChange={(e) => setActiveCenter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-[#152520] outline-none"
          >
            <option value="">Todos los centros</option>
            {centerOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* KPI toggle */}
          <button
            onClick={() => setShowKpis((v) => !v)}
            className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs transition ${
              showKpis ? 'border-slate-300 bg-slate-100 text-slate-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Métricas
          </button>

          <div className="ml-auto">
            <Button
              size="sm"
              className="gap-1.5 rounded-xl bg-[#7b3fa0] text-xs text-white hover:bg-[#6a3490]"
              onClick={onNuevoCaso}
            >
              <FilePlus className="h-3.5 w-3.5" />
              Nuevo caso
            </Button>
          </div>
        </div>

        {/* Collapsible KPI strip */}
        {showKpis && (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {kpis.map((k) => {
              const stageFilter = KPI_FILTERS[k.label] ?? ''
              const active = activeStage === stageFilter && stageFilter !== ''
              const [numCls, borderCls, activeBg] = KPI_ACCENT[k.label] ?? ['text-[#152520]', 'border-slate-200', 'bg-slate-50']
              return (
                <button
                  key={k.label}
                  onClick={() => setActiveStage(active ? '' : stageFilter)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs transition ${
                    active ? `${borderCls} ${activeBg} shadow-sm` : 'border-slate-200 bg-white text-[#4a7068] hover:bg-slate-50'
                  }`}
                >
                  <span className={`text-base font-bold ${numCls}`}>{k.value}</span>
                  <span className="max-w-[72px] text-left text-[10px] leading-tight text-[#4a7068]">{k.label}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Collapsible advanced filters */}
        {showFilters && (
          <div className="mt-2.5 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {SAVED_VIEWS.map((view) => (
                <button
                  key={view.id}
                  onClick={() => applySavedView(view.id)}
                  className={`rounded-full border px-2.5 py-1 text-xs transition ${
                    savedView === view.id
                      ? 'border-[#7b3fa0]/40 bg-[#faf6fd] text-[#7b3fa0]'
                      : 'border-slate-200 bg-slate-50 text-[#4a7068] hover:bg-[#faf6fd] hover:text-[#7b3fa0]'
                  }`}
                >
                  {view.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => setActiveChip((current) => (current === chip ? '' : chip))}
                  className={`rounded-full border px-2.5 py-1 text-xs transition ${
                    activeChip === chip
                      ? 'border-[#7b3fa0]/40 bg-[#faf6fd] text-[#7b3fa0]'
                      : 'border-slate-200 bg-slate-50 text-[#4a7068] hover:bg-[#faf6fd] hover:text-[#7b3fa0]'
                  }`}
                >
                  {chip} <span className="ml-0.5 text-[10px] opacity-60">{chipCounts[chip]}</span>
                </button>
              ))}
            </div>
          </div>
        )}
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

      {/* Table + Drawer */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <table className="min-w-full text-left">
          <thead className="sticky top-0 z-10 border-b border-slate-100 bg-white">
            <tr className="text-[10px] uppercase tracking-[0.16em] text-[#4a7068]">
              <th className="px-4 py-3 font-medium">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleAllVisible}
                  className="h-4 w-4 rounded border-slate-300 text-[#7b3fa0] focus:ring-[#7b3fa0]"
                />
              </th>
              <th className="px-5 py-3 font-medium">Caso</th>
              <th className="px-4 py-3 font-medium">Paciente</th>
              <th className="px-4 py-3 font-medium">Centro</th>
              <th className="px-4 py-3 font-medium">Solicitante</th>
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
                <td colSpan={10} className="px-5 py-16 text-center text-sm text-[#4a7068]">
                  No hay casos con estos filtros.
                  <span className="block mt-1 text-xs text-slate-400">Prueba a ampliar el rango o quitar algún filtro.</span>
                </td>
              </tr>
            )}
            {filtered.map((caso) => {
              const isSelected = drawerCaseId === caso.caseId
              const criticalGaps = caso.gaps?.filter((g) => g.severity === 'Crítico').length ?? 0
              const totalGaps = caso.gaps?.length ?? 0
              return (
                <tr
                  key={caso.caseId}
                  onClick={() => setDrawerCaseId(isSelected ? null : caso.caseId)}
                  className={`cursor-pointer transition hover:bg-slate-50 ${isSelected ? 'bg-[#7b3fa0]/8 ring-1 ring-inset ring-[#7b3fa0]/20' : ''}`}
                >
                    <td
                      className="px-4 py-3"
                      onClick={(event) => { event.stopPropagation() }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCaseIds.includes(caso.caseId)}
                        onChange={() => toggleSelection(caso.caseId)}
                        className="h-4 w-4 rounded border-slate-300 text-[#7b3fa0] focus:ring-[#7b3fa0]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-xs font-semibold text-[#7b3fa0]">{caso.caseId}</p>
                        <p className="max-w-[180px] truncate text-sm font-medium text-[#152520]">{caso.title}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-[#4a7068]">{caso.patientCode}</td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-medium text-[#152520]">{caso.centerName}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-[#152520]">{caso.requesterName}</p>
                      <p className="text-xs text-[#4a7068]">{caso.assignedName || 'Sin asignar'}</p>
                    </td>
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
                    <td className="max-w-[180px] px-4 py-3.5">
                      <span className="inline-flex max-w-full rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-[#4a7068]">
                        <span className="truncate">{caso.nextAction}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[#4a7068]">
                      {new Date(caso.updatedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </td>
                  </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Right inspector drawer */}
      {drawerCase && (
        <CaseDrawer
          caso={drawerCase}
          onOpen={() => onOpenCaso(drawerCase.caseId)}
          onClose={() => setDrawerCaseId(null)}
          onOrchestrate={() => void orchestrateCase(drawerCase.caseId)}
          onRequestData={() => void runCaseAction('request_data', [drawerCase.caseId], {}, `Se ha solicitado completar datos para ${drawerCase.caseId}.`)}
          onSendSession={() => void runCaseAction('send_session', [drawerCase.caseId], {}, `El caso ${drawerCase.caseId} se ha enviado a sesión.`)}
          pharmacistOptions={pharmacistOptions}
          loadingProfessionals={loadingProfessionals}
          rowAssignee={rowAssignee[drawerCase.caseId] ?? ''}
          onAssigneeChange={(id) => setRowAssignee((prev) => ({ ...prev, [drawerCase.caseId]: id }))}
          onAssign={() => void runCaseAction('assign', [drawerCase.caseId], { assignedTo: rowAssignee[drawerCase.caseId], assignedName: assigneeNameById(rowAssignee[drawerCase.caseId]) }, `El caso ${drawerCase.caseId} se ha asignado.`)}
          busyAction={busyAction}
        />
      )}
      </div>

      <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-2 text-xs text-[#4a7068]">
        {filtered.length} {filtered.length === 1 ? 'caso' : 'casos'} · {visibleSelected} seleccionados
        {drawerCase && <span className="ml-3 font-medium text-[#7b3fa0]">Inspector: {drawerCase.caseId}</span>}
      </div>
    </div>
  )
}

function CaseDrawer({
  caso,
  onOpen,
  onClose,
  onOrchestrate,
  onRequestData,
  onSendSession,
  pharmacistOptions,
  loadingProfessionals,
  rowAssignee,
  onAssigneeChange,
  onAssign,
  busyAction,
}: {
  caso: CasoResumen
  onOpen: () => void
  onClose: () => void
  onOrchestrate: () => void
  onRequestData: () => void
  onSendSession: () => void
  pharmacistOptions: Professional[]
  loadingProfessionals: boolean
  rowAssignee: string
  onAssigneeChange: (id: string) => void
  onAssign: () => void
  busyAction: string | null
}) {
  const criticalGaps = caso.gaps?.filter((g) => g.severity === 'Crítico') ?? []
  const otherGaps = caso.gaps?.filter((g) => g.severity !== 'Crítico') ?? []

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-slate-200 bg-white">
      {/* Drawer header */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#7b3fa0]">{caso.caseId}</p>
          <p className="truncate text-sm font-semibold text-[#152520]">{caso.title}</p>
          <p className="text-xs text-[#4a7068]">{caso.patientCode} · {caso.caseType}</p>
        </div>
        <button onClick={onClose} className="mt-0.5 shrink-0 text-slate-400 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 px-4 py-4">
        <div className="space-y-2">
          <Button
            size="sm"
            className="w-full rounded-xl bg-[#7b3fa0] text-xs text-white hover:bg-[#6a3490]"
            onClick={onOpen}
          >
            Abrir caso completo
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline" className="rounded-xl text-xs" disabled={busyAction !== null} onClick={onRequestData}>
              Solicitar datos
            </Button>
            <Button size="sm" variant="outline" className="rounded-xl text-xs" disabled={busyAction !== null} onClick={onSendSession}>
              Enviar a sesión
            </Button>
          </div>
          <Button size="sm" variant="outline" className="w-full rounded-xl text-xs" disabled={busyAction !== null} onClick={onOrchestrate}>
            Actualizar paquete
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">Estado</p>
            <span className={`mt-1 inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STAGE_STYLE[caso.pipelineStage] ?? 'bg-slate-100 text-slate-600'}`}>
              {STAGE_LABEL[caso.pipelineStage] ?? caso.pipelineStage}
            </span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">Prioridad</p>
            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${PRIORITY_STYLE[caso.priority] ?? 'bg-slate-100 text-slate-600'}`}>
              {caso.priority}
            </span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">Siguiente paso</p>
            <p className="mt-1 text-xs font-medium text-[#152520]">{caso.nextAction}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">Gaps críticos</p>
            <p className="mt-1 text-xs font-medium text-[#152520]">{criticalGaps.length}</p>
          </div>
        </div>

        {/* Gaps */}
        {caso.gaps?.length > 0 && (
          <div>
            <p className="mb-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">Gaps</p>
            <div className="space-y-1">
              {criticalGaps.map((g, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-2.5 py-1.5">
                  <AlertTriangle className="h-3 w-3 shrink-0 text-red-500" />
                  <span className="text-[11px] font-medium text-red-800">{g.label}</span>
                </div>
              ))}
              {otherGaps.slice(0, 3).map((g, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5">
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold ${SEVERITY_STYLE[g.severity] ?? 'bg-slate-100 text-slate-600'}`}>{g.severity}</span>
                  <span className="text-[11px] text-[#4a7068]">{g.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* People */}
        <div className="space-y-1 text-xs">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Responsables</p>
          <p className="text-[#152520]"><span className="text-[#4a7068]">Solicitante:</span> {caso.requesterName}</p>
          <p className="text-[#152520]"><span className="text-[#4a7068]">Farmacia:</span> {caso.assignedName || 'Sin asignar'}</p>
          <p className="text-[#4a7068]">{caso.centerName}</p>
        </div>

        {/* Assign */}
        <div className="space-y-1.5">
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Asignar responsable</p>
          <select
            value={rowAssignee}
            onChange={(e) => onAssigneeChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-[#152520] outline-none"
          >
            <option value="">{loadingProfessionals ? 'Cargando…' : 'Seleccionar farmacéutico…'}</option>
            {pharmacistOptions.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <Button
            size="sm"
            variant="outline"
            className="w-full rounded-xl text-xs"
            disabled={!rowAssignee || busyAction !== null}
            onClick={onAssign}
          >
            Asignar
          </Button>
        </div>

      </div>

      {/* Drawer actions */}
      <div className="shrink-0 border-t border-slate-100 px-4 py-3 text-[11px] text-[#4a7068]">
        {caso.centerName} · {caso.specialty}
      </div>
    </aside>
  )
}
