'use client'

import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Bell,
  Bot,
  Building2,
  ChevronDown,
  ChevronRight,
  ClipboardEdit,
  Cog,
  ExternalLink,
  FilePlus,
  Inbox,
  LayoutDashboard,
  Loader2,
  Search,
  Sparkles,
  TrendingUp,
  UserRound,
  Users2,
  Video,
  X,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { AgentesIa } from '@/components/pkpd/pro/views/agentes-ia'
import { BandejaIa } from '@/components/pkpd/pro/views/bandeja-ia'
import { CaseCockpit, type CaseCockpitLaunchPreset } from '@/components/pkpd/pro/views/case-cockpit'
import { NuevoCasoWizard } from '@/components/pkpd/pro/views/nuevo-caso-wizard'
import { Profesionales } from '@/components/pkpd/pro/views/profesionales'
import { Reporting } from '@/components/pkpd/pro/views/reporting'
import { Sesiones } from '@/components/pkpd/pro/views/sesiones'
import type { AutomationSummary, CasoCompleto, CasoResumen } from '@/components/pkpd/pro/xarxa-types'
import {
  PRIORITY_STYLE,
  STAGE_LABEL,
  STAGE_STYLE,
} from '@/components/pkpd/pro/xarxa-types'
import { fetchJson } from '@/lib/fetch-json'

// ── Types ─────────────────────────────────────────────────────────────────────

type MobileTab =
  | 'casos' | 'bandeja' | 'sesiones' | 'mas'
  | 'profesionales' | 'reporting' | 'agentes' | 'nuevo'

// ── Helpers ───────────────────────────────────────────────────────────────────

function priorityBorder(priority: string): string {
  switch (priority) {
    case 'Urgente': return 'border-l-red-700'
    case 'Alta':    return 'border-l-rose-500'
    case 'Media':   return 'border-l-amber-500'
    case 'Baja':    return 'border-l-emerald-500'
    default:        return 'border-l-slate-300'
  }
}

function LoadingSpinner() {
  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-[#7b3fa0]" />
    </div>
  )
}

function SectionEmpty({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7b3fa0]/10">
        <Icon className="h-6 w-6 text-[#7b3fa0]" />
      </div>
      <p className="text-sm text-[#4a7068]">{label}</p>
    </div>
  )
}

// ── LLM Execution Rail (mirrors CaseLlmExecutionRail + AgentLlmStream) ────────

const AGENT_STEPS = [
  'Releyendo determinantes y contexto clínico',
  'Reconstruyendo interpretación PK/PD',
  'Preparando recomendación trazable',
  'Actualizando borrador de nota HCE',
]

function LlmExecutionRail({ headline = 'Actualizando el paquete del caso' }: { headline?: string }) {
  const [activeStep, setActiveStep] = useState(0)
  const [visibleChars, setVisibleChars] = useState(0)
  const outputText = 'Análisis PK/PD completado. Patrón identificado. Borrador de recomendación preparado para revisión farmacéutica.'

  useEffect(() => {
    setActiveStep(0)
    const timer = window.setInterval(() => {
      setActiveStep(s => (s + 1) % AGENT_STEPS.length)
    }, 900)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    setVisibleChars(0)
    const timer = window.setInterval(() => {
      setVisibleChars(n => n >= outputText.length ? n : n + 3)
    }, 22)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="rounded-2xl border border-[#7b3fa0]/20 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#7b3fa0]/10">
          <Bot className="h-4 w-4 text-[#7b3fa0]" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7b3fa0]">Agentes en ejecución</p>
          <p className="text-xs font-semibold text-[#152520]">{headline}</p>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        {AGENT_STEPS.map((step, i) => {
          const isDone = i < activeStep
          const isRunning = i === activeStep
          return (
            <div
              key={step}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] transition-all ${
                isRunning
                  ? 'border-[#7b3fa0]/20 bg-[#faf6fd] text-[#7b3fa0]'
                  : isDone
                    ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                    : 'border-slate-100 bg-slate-50 text-slate-400'
              }`}
            >
              {isDone
                ? <Sparkles className="h-3.5 w-3.5 shrink-0" />
                : isRunning
                  ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                  : <div className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-slate-200" />
              }
              <span className={isRunning ? 'font-semibold' : ''}>{step}</span>
            </div>
          )
        })}
      </div>

      {/* Typewriter output */}
      <div className="mt-3 rounded-xl border border-slate-100 bg-[#faf9ff] p-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#4a7068]">Salida de Agentes</p>
        <p className="mt-1.5 min-h-[40px] text-xs leading-5 text-[#152520]">
          {outputText.slice(0, visibleChars)}
          {visibleChars < outputText.length && (
            <span className="animate-pulse text-[#7b3fa0]">▍</span>
          )}
        </p>
      </div>
    </div>
  )
}

// ── Automation Summary Panel ──────────────────────────────────────────────────

function AutomationPanel({
  automation,
  caseId,
  orchestrating,
  onOrchestrate,
  onOpenCase,
}: {
  automation: AutomationSummary | null | undefined
  caseId: string
  orchestrating: boolean
  onOrchestrate: () => void
  onOpenCase: () => void
}) {
  return (
    <div className="border-t border-[#7b3fa0]/10 bg-[#faf9ff] px-4 py-4 space-y-3">
      {/* Agent metrics */}
      {automation && (
        <div className="rounded-2xl border border-[#7b3fa0]/15 bg-white p-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#7b3fa0]/10">
              <Bot className="h-3.5 w-3.5 text-[#7b3fa0]" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7b3fa0]">Agentes trabajando</p>
              <p className="text-xs font-semibold text-[#152520]">{automation.headline}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Agentes',    value: automation.agentsInvolved?.length ?? 0 },
              { label: 'Borradores', value: automation.draftsReady ?? 0 },
              { label: 'Tareas',     value: automation.pendingTasks ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-[#faf6fd] px-2.5 py-2 text-center">
                <p className="text-[9px] uppercase tracking-[0.1em] text-[#4a7068]">{label}</p>
                <p className="mt-0.5 text-sm font-bold text-[#7b3fa0]">{value}</p>
              </div>
            ))}
          </div>
          {(automation.highlights ?? []).length > 0 && (
            <div className="mt-2 space-y-1">
              {automation.highlights.slice(0, 2).map((h, i) => (
                <div key={i} className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] text-[#152520]">
                  {h}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* LLM animation when running */}
      {orchestrating && <LlmExecutionRail />}

      <button
        onClick={onOpenCase}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7b3fa0] py-3 text-sm font-semibold text-white transition active:scale-95"
      >
        <ExternalLink className="h-4 w-4" />
        Abrir caso completo
      </button>
    </div>
  )
}

// ── Top Bar ───────────────────────────────────────────────────────────────────

function MobileTopBar({
  title,
  bandejaCount,
  showBack,
  onBack,
}: {
  title: string
  bandejaCount: number
  showBack?: boolean
  onBack?: () => void
}) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4">
      {showBack ? (
        <button
          onClick={onBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f1f3f5] text-[#152520] transition active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      ) : (
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: 'linear-gradient(135deg, #8dc63f 50%, #7b3fa0 50%)' }}
        >
          <Activity className="h-4 w-4 text-white" />
        </div>
      )}
      <span className="flex-1 truncate text-sm font-semibold text-[#152520]">{title}</span>
      <div className="relative">
        <button className="flex h-9 w-9 items-center justify-center rounded-xl text-[#4a7068] transition hover:bg-[#f1f3f5]">
          <Bell className="h-4 w-4" />
        </button>
        {bandejaCount > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#e8501e]" />
        )}
      </div>
    </header>
  )
}

// ── Bottom Navigation ─────────────────────────────────────────────────────────

const BOTTOM_TABS: Array<{ id: MobileTab; label: string; icon: React.ElementType }> = [
  { id: 'casos',         label: 'Casos',    icon: LayoutDashboard },
  { id: 'bandeja',       label: 'Bandeja',  icon: Inbox },
  { id: 'profesionales', label: 'Red',      icon: Users2 },
  { id: 'sesiones',      label: 'Sesiones', icon: Video },
  { id: 'reporting',     label: 'Informes', icon: BarChart3 },
]

const PRIMARY_TABS: MobileTab[] = ['casos', 'bandeja', 'profesionales', 'sesiones', 'reporting']

function MobileBottomNav({
  active,
  onNavigate,
  bandejaCount,
}: {
  active: MobileTab
  onNavigate: (tab: MobileTab) => void
  bandejaCount: number
}) {
  const activeRoot: MobileTab = PRIMARY_TABS.includes(active) ? active : 'mas'

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 flex h-16 items-stretch border-t border-slate-200 bg-white"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {BOTTOM_TABS.map(({ id, label, icon: Icon }) => {
        const isActive = activeRoot === id
        return (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className="relative flex flex-1 flex-col items-center justify-center gap-0.5 transition active:scale-95"
          >
            <div className="relative">
              <Icon className={`h-5 w-5 transition ${isActive ? 'text-[#7b3fa0]' : 'text-[#4a7068]'}`} />
              {id === 'bandeja' && bandejaCount > 0 && (
                <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e8501e] px-1 text-[9px] font-bold text-white">
                  {bandejaCount > 9 ? '9+' : bandejaCount}
                </span>
              )}
            </div>
            <span className={`text-[10px] font-medium transition ${isActive ? 'text-[#7b3fa0]' : 'text-[#4a7068]'}`}>
              {label}
            </span>
            {isActive && (
              <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-t-full bg-[#7b3fa0]" />
            )}
          </button>
        )
      })}
    </nav>
  )
}

// ── Mobile Cases List (card layout — better than table on mobile) ──────────────

function MobileCasoCard({
  caso,
  expanded,
  orchestrating,
  onOpen,
  onToggleExpand,
  onOrchestrate,
}: {
  caso: CasoResumen
  expanded: boolean
  orchestrating: boolean
  onOpen: (id: string) => void
  onToggleExpand: (id: string) => void
  onOrchestrate: (id: string) => void
}) {
  const stage = STAGE_LABEL[caso.pipelineStage] ?? caso.pipelineStage
  const stageStyle = STAGE_STYLE[caso.pipelineStage] ?? 'bg-slate-400 text-white'
  const border = priorityBorder(caso.priority)
  const gapCritico = caso.gaps?.some(g => g.severity === 'Crítico')
  const hasAutomation = !!caso.automationSummary

  return (
    <div className={`border-b border-slate-100 bg-white border-l-4 ${border}`}>
      {/* Main card row */}
      <button
        onClick={() => onOpen(caso.caseId)}
        className="w-full px-4 py-4 text-left transition active:bg-[#faf6fd]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-[#7b3fa0]/10 px-1.5 py-0.5 text-[11px] font-bold text-[#7b3fa0]">
                {caso.patientCode}
              </span>
              {gapCritico && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-500" />}
            </div>
            <p className="mt-1 line-clamp-1 text-sm font-semibold text-[#152520]">{caso.title}</p>
            {caso.nextAction && (
              <p className="mt-0.5 line-clamp-1 text-xs text-[#4a7068]">→ {caso.nextAction}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${stageStyle}`}>{stage}</span>
              {caso.centerName && <span className="text-[10px] text-[#4a7068]">{caso.centerName}</span>}
            </div>
          </div>
          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] text-[#4a7068]">{caso.assignedName}</span>
          <span className="text-[10px] text-slate-400">
            {caso.updatedAt
              ? new Date(caso.updatedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
              : ''}
          </span>
        </div>
      </button>

      {/* Automation badge row — mirrors desktop casos-pkpd.tsx line 610-617 */}
      {hasAutomation && (
        <button
          onClick={() => onToggleExpand(caso.caseId)}
          className="flex w-full items-center gap-2 border-t border-[#7b3fa0]/8 bg-[#faf9ff] px-4 py-2.5 transition active:bg-[#f3edfa]"
        >
          <Bot className={`h-3.5 w-3.5 shrink-0 ${orchestrating ? 'animate-pulse' : ''} text-[#7b3fa0]`} />
          <span className="flex-1 text-left text-[11px] text-[#4a7068]">
            {orchestrating
              ? 'Agentes trabajando…'
              : `${caso.automationSummary!.draftsReady} borrad. · ${caso.automationSummary!.pendingTasks} tarea${caso.automationSummary!.pendingTasks === 1 ? '' : 's'}`
            }
          </span>
          <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-[#7b3fa0]/60 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      )}

      {/* Expanded automation panel */}
      {hasAutomation && expanded && (
        <AutomationPanel
          automation={caso.automationSummary}
          caseId={caso.caseId}
          orchestrating={orchestrating}
          onOrchestrate={() => onOrchestrate(caso.caseId)}
          onOpenCase={() => onOpen(caso.caseId)}
        />
      )}
    </div>
  )
}

function MobileCasosList({
  casos,
  loading,
  onOpen,
  onNuevo,
  onCasosChanged,
}: {
  casos: CasoResumen[]
  loading: boolean
  onOpen: (id: string) => void
  onNuevo: () => void
  onCasosChanged: () => Promise<void>
}) {
  const [search, setSearch] = useState('')
  const [expandedAutomationId, setExpandedAutomationId] = useState<string | null>(null)
  const [orchestratingId, setOrchestratingId] = useState<string | null>(null)

  const filtered = casos.filter(c =>
    !search ||
    c.patientCode.toLowerCase().includes(search.toLowerCase()) ||
    c.title.toLowerCase().includes(search.toLowerCase())
  )

  const ACTION_STAGES = ['Revisión farmacéutica', 'Revisión médica', 'Informe generado']
  const urgentes = casos.filter(c => ACTION_STAGES.includes(c.pipelineStage)).length
  const incompletos = casos.filter(c =>
    ['Datos incompletos', 'Pendiente de determinantes'].includes(c.pipelineStage)
  ).length

  async function orchestrateCase(caseId: string) {
    setOrchestratingId(caseId)
    try {
      await fetchJson(`/api/xarxa/cases/${caseId}/orchestrate`, { method: 'POST' })
      await onCasosChanged()
    } catch { /* silent */ }
    finally { setOrchestratingId(null) }
  }

  function toggleExpand(caseId: string) {
    setExpandedAutomationId(prev => (prev === caseId ? null : caseId))
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="flex flex-col">
      {/* Triage strip */}
      <div className="grid grid-cols-2 gap-2 border-b border-slate-100 bg-[#f9f9f9] p-3">
        <div className="flex items-center gap-2.5 rounded-2xl bg-white px-3 py-2.5 shadow-sm">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#7b3fa0]/10">
            <ClipboardEdit className="h-4 w-4 text-[#7b3fa0]" />
          </div>
          <div>
            <p className="text-[11px] text-[#4a7068]">Requieren acción</p>
            <p className="text-lg font-bold text-[#7b3fa0]">{urgentes}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-2xl bg-white px-3 py-2.5 shadow-sm">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <p className="text-[11px] text-[#4a7068]">Incompletos</p>
            <p className="text-lg font-bold text-amber-600">{incompletos}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="border-b border-slate-100 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2 rounded-xl bg-[#f1f3f5] px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-[#4a7068]" />
          <input
            type="text"
            placeholder="Buscar paciente o título…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[#152520] outline-none placeholder:text-[#4a7068]/60"
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <X className="h-3.5 w-3.5 text-[#4a7068]" />
            </button>
          )}
        </div>
      </div>

      {/* Case cards */}
      {filtered.length === 0
        ? <SectionEmpty icon={LayoutDashboard} label="Sin casos para mostrar" />
        : filtered.map(c => (
            <MobileCasoCard
              key={c.caseId}
              caso={c}
              expanded={expandedAutomationId === c.caseId}
              orchestrating={orchestratingId === c.caseId}
              onOpen={onOpen}
              onToggleExpand={toggleExpand}
              onOrchestrate={id => void orchestrateCase(id)}
            />
          ))
      }

      {/* FAB — new case */}
      <button
        onClick={onNuevo}
        className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#7b3fa0] shadow-lg transition active:scale-95"
        style={{ boxShadow: '0 4px 20px rgba(123,63,160,0.35)' }}
        title="Nuevo caso"
      >
        <FilePlus className="h-6 w-6 text-white" />
      </button>
    </div>
  )
}

// ── Más ───────────────────────────────────────────────────────────────────────

function MobileMas({ onNavigateTo }: { onNavigateTo: (tab: MobileTab) => void }) {
  const sections = [
    {
      label: 'Red clínica',
      items: [
        { label: 'Red de profesionales', icon: Users2,   tab: 'profesionales' as MobileTab },
        { label: 'Sesiones de red',          icon: Video,    tab: 'sesiones'      as MobileTab },
      ],
    },
    {
      label: 'Analítica',
      items: [
        { label: 'Informes y actividad', icon: BarChart3, tab: 'reporting' as MobileTab },
      ],
    },
    {
      label: 'Administración',
      items: [
        { label: 'Agentes IA',  icon: Bot,       tab: 'agentes' as MobileTab },
        { label: 'Config.',     icon: Cog,       tab: null as unknown as MobileTab },
      ],
    },
  ]

  return (
    <div className="px-4 py-4 space-y-4">
      {sections.map(section => (
        <div key={section.label}>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#4a7068]">{section.label}</p>
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
            {section.items.map(({ label, icon: Icon, tab }, i) => (
              <button
                key={label}
                onClick={() => tab && onNavigateTo(tab)}
                className={`flex w-full items-center gap-3 px-4 py-4 text-left transition active:bg-[#faf6fd] ${i > 0 ? 'border-t border-slate-50' : ''} ${!tab ? 'opacity-40' : ''}`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7b3fa0]/10">
                  <Icon className="h-4 w-4 text-[#7b3fa0]" />
                </div>
                <span className="flex-1 text-sm font-medium text-[#152520]">{label}</span>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="mt-2 text-center text-[11px] text-slate-400">Xarxa PK/PD Intelligence Hub · v0.1</p>
    </div>
  )
}

// ── Main MobileShell export ───────────────────────────────────────────────────

export function MobileShell() {
  const [activeTab, setActiveTab] = useState<MobileTab>('casos')

  // Case drill-in state
  const [openCaseId, setOpenCaseId]   = useState<string | null>(null)
  const [openCase, setOpenCase]       = useState<CasoCompleto | null>(null)
  const [caseLoading, setCaseLoading] = useState(false)
  const [caseLaunchPreset, setCaseLaunchPreset] = useState<CaseCockpitLaunchPreset | null>(null)

  // Cases list data (only these needed — other views fetch their own)
  const [casos, setCasos]           = useState<CasoResumen[]>([])
  const [casosLoading, setCasosLoading] = useState(true)
  const [inboxPending, setInboxPending] = useState(0)

  const loadCasos = useCallback(async () => {
    setCasosLoading(true)
    try {
      const data = await fetchJson<{ items?: CasoResumen[] }>('/api/xarxa/cases')
      setCasos(data.items ?? [])
    } catch { /* silent */ }
    finally { setCasosLoading(false) }
  }, [])

  // Light inbox badge count
  useEffect(() => {
    fetchJson<{ items?: Array<{ agentStatus: string }> }>('/api/xarxa/inbox')
      .then(d => setInboxPending(
        (d.items ?? []).filter(i => i.agentStatus === 'pending' || i.agentStatus === 'ready').length
      ))
      .catch(() => {})
  }, [])

  useEffect(() => { void loadCasos() }, [loadCasos])

  // Case detail load
  useEffect(() => {
    if (!openCaseId) { setOpenCase(null); return }
    let cancelled = false
    setCaseLoading(true)
    fetchJson<CasoCompleto>(`/api/xarxa/cases/${openCaseId}`)
      .then(data => { if (!cancelled) { setOpenCase(data); setCaseLoading(false) } })
      .catch(() => { if (!cancelled) setCaseLoading(false) })
    return () => { cancelled = true }
  }, [openCaseId])

  function handleOpenCase(id: string) {
    setOpenCaseId(id)
  }

  function handleOpenCaseWithPreset(id: string, preset?: Omit<CaseCockpitLaunchPreset, 'caseId'>) {
    if (preset) {
      setCaseLaunchPreset({ caseId: id, ...preset })
    } else {
      setCaseLaunchPreset(null)
    }
    setOpenCaseId(id)
  }

  function handleBackFromCockpit() {
    setOpenCaseId(null)
    setOpenCase(null)
    setCaseLaunchPreset(null)
    void loadCasos()
  }

  // When a case is opened from Bandeja/Sesiones, switch to casos tab then open cockpit
  function handleCaseFromOtherView(
    caseId: string,
    options?: Omit<CaseCockpitLaunchPreset, 'caseId'>,
  ) {
    setActiveTab('casos')
    handleOpenCaseWithPreset(caseId, options)
  }

  // Secondary tab titles (shown in top bar)
  const TITLE_MAP: Partial<Record<MobileTab, string>> = {
    casos:         'Casos PK/PD',
    bandeja:       'Bandeja IA',
    sesiones:      'Sesiones',
    mas:           'Xarxa PK/PD',
    profesionales: 'Red de profesionales',
    reporting:     'Informes',
    agentes:       'Agentes IA',
    nuevo:         'Nuevo caso',
  }

  const SECONDARY_TABS: MobileTab[] = ['agentes']

  // Whether the current view is a full-height desktop component (manages its own scroll)
  const isDesktopView = openCaseId || activeTab === 'bandeja' || activeTab === 'sesiones' ||
    activeTab === 'profesionales' || activeTab === 'reporting' || activeTab === 'agentes' ||
    activeTab === 'nuevo'

  // Show top bar only on mobile-native views and secondary pages
  const showTopBar = !openCaseId && activeTab !== 'nuevo'

  // Show bottom nav only on primary tabs (not in secondary views or case drill-in)
  const showBottomNav = !openCaseId && PRIMARY_TABS.includes(activeTab)

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#f9f9f9] lg:hidden">
      {showTopBar && (
        <MobileTopBar
          title={TITLE_MAP[activeTab] ?? 'PK/PD'}
          bandejaCount={inboxPending}
          showBack={SECONDARY_TABS.includes(activeTab)}
          onBack={() => setActiveTab('casos')}
        />
      )}

      {/* Main area — overflow-hidden so desktop components can own their scroll */}
      <main className={`flex-1 overflow-hidden ${showBottomNav ? 'pb-16' : ''}`}>
        {/* ── Case Cockpit (full desktop component) ── */}
        {openCaseId && (
          caseLoading ? (
            <LoadingSpinner />
          ) : openCase ? (
            <CaseCockpit
              caso={openCase}
              onBack={handleBackFromCockpit}
              launchPreset={caseLaunchPreset ?? undefined}
              onLaunchPresetConsumed={() => setCaseLaunchPreset(null)}
              onCaseUpdated={async updatedCase => {
                setOpenCase(updatedCase)
                await loadCasos()
              }}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2">
              <AlertTriangle className="h-8 w-8 text-amber-400" />
              <p className="text-sm text-[#4a7068]">No se pudo cargar el caso</p>
            </div>
          )
        )}

        {/* ── Primary mobile-native views ── */}
        {!openCaseId && activeTab === 'casos' && (
          <div className="h-full overflow-y-auto">
            <MobileCasosList
              casos={casos}
              loading={casosLoading}
              onOpen={id => handleOpenCaseWithPreset(id)}
              onNuevo={() => setActiveTab('nuevo')}
              onCasosChanged={loadCasos}
            />
          </div>
        )}

        {/* ── Bandeja IA (mobile master-detail layout) ── */}
        {!openCaseId && activeTab === 'bandeja' && (
          <div className="h-full overflow-hidden">
            <BandejaIa mobile onCaseCreated={handleCaseFromOtherView} />
          </div>
        )}

        {/* ── Sesiones (full desktop component) ── */}
        {!openCaseId && activeTab === 'sesiones' && (
          <Sesiones onOpenCaso={handleCaseFromOtherView} />
        )}

        {/* ── Más (mobile-native menu) ── */}
        {!openCaseId && activeTab === 'mas' && (
          <div className="h-full overflow-y-auto">
            <MobileMas onNavigateTo={setActiveTab} />
          </div>
        )}

        {/* ── Profesionales (full desktop component) ── */}
        {!openCaseId && activeTab === 'profesionales' && (
          <Profesionales />
        )}

        {/* ── Reporting (full desktop component) ── */}
        {!openCaseId && activeTab === 'reporting' && (
          <Reporting />
        )}

        {/* ── Agentes IA (full desktop component) ── */}
        {!openCaseId && activeTab === 'agentes' && (
          <AgentesIa />
        )}

        {/* ── Nuevo caso wizard (full desktop component) ── */}
        {!openCaseId && activeTab === 'nuevo' && (
          <NuevoCasoWizard
            onCancel={() => setActiveTab('casos')}
            onCreated={caseId => {
              setActiveTab('casos')
              handleOpenCaseWithPreset(caseId)
            }}
          />
        )}
      </main>

      {showBottomNav && (
        <MobileBottomNav
          active={activeTab}
          onNavigate={tab => {
            // Navigating away from secondary tabs goes back via top bar back button
            // but bottom nav always sets a primary tab
            setActiveTab(tab)
          }}
          bandejaCount={inboxPending}
        />
      )}
    </div>
  )
}
