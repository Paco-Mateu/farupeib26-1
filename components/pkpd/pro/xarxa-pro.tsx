'use client'

import {
  Activity,
  BarChart3,
  Bell,
  Bot,
  BookOpenCheck,
  Building2,
  CalendarRange,
  ChevronDown,
  Cog,
  FilePlus2,
  FolderCog,
  Inbox,
  LayoutDashboard,
  LogOut,
  Monitor,
  Search,
  ShieldCheck,
  TriangleAlert,
  UserRound,
  Users2,
  Video,
  X,
} from 'lucide-react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  type ElementType,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import type {
  Agent,
  CasoCompleto,
  CasoResumen,
  Center,
  ClinicalForm,
  InboxItem,
  Professional,
  ProfessionalApproval,
  Program,
  Vista,
} from '@/components/pkpd/pro/xarxa-types'
import {
  WorkspaceErrorState,
  WorkspaceLoadingState,
} from '@/components/pkpd/pro/workspace-state'
import { AdminClinico } from '@/components/pkpd/pro/views/admin-clinico'
import { AgentesIa } from '@/components/pkpd/pro/views/agentes-ia'
import { BandejaIa } from '@/components/pkpd/pro/views/bandeja-ia'
import { CaseCockpit, type CaseCockpitLaunchPreset } from '@/components/pkpd/pro/views/case-cockpit'
import { CasosPkpd, CasesQueueSkeleton } from '@/components/pkpd/pro/views/casos-pkpd'
import { Configuracion } from '@/components/pkpd/pro/views/configuracion'
import { NuevoCasoWizard } from '@/components/pkpd/pro/views/nuevo-caso-wizard'
import { Profesionales } from '@/components/pkpd/pro/views/profesionales'
import { Reporting } from '@/components/pkpd/pro/views/reporting'
import { Sesiones } from '@/components/pkpd/pro/views/sesiones'
import { MobileShell } from '@/components/pkpd/pro/mobile-shell'
import { PersonAvatar } from '@/components/pkpd/pro/person-avatar'
import { fetchJson } from '@/lib/fetch-json'

// Demo-only: in production this comes from the authenticated session
const DEMO_CURRENT_USER = {
  name: 'Farmacéutico referente',
  shortName: 'Farmacia referente',
  center: 'H.U. Bellvitge',
  centerShort: 'Bellvitge',
  avatarUrl: '/avatars/farmaceutico-referente.jpg',
} as const

type NavItem = {
  vista: Vista
  label: string
  icon: ElementType
}

type SessionItem = {
  sessionId: string
  title: string
  status: 'scheduled' | 'live' | 'done'
  date: string
  casesCount: number
  participants: string[]
}

type HeaderMetric = {
  label: string
  value: string | number
  tone?: 'default' | 'accent' | 'warning' | 'danger'
}

type ShellNotification = {
  id: string
  title: string
  detail: string
  vista: Vista
  icon: ElementType
}

type PaletteItem = {
  id: string
  label: string
  description: string
  meta?: string
  icon: ElementType
  onSelect: () => void
}

type PaletteSection = {
  label: string
  items: PaletteItem[]
}

const MAIN_NAV: NavItem[] = [
  { vista: 'casos', label: 'Casos PK/PD', icon: LayoutDashboard },
  { vista: 'bandeja', label: 'Bandeja IA', icon: Inbox },
  { vista: 'profesionales', label: 'Red de profesionales', icon: Users2 },
  { vista: 'sesiones', label: 'Sesiones de red', icon: Video },
  { vista: 'reporting', label: 'Informes y actividad', icon: BarChart3 },
]

const ADMIN_NAV: NavItem[] = [
  { vista: 'agentes', label: 'Agentes IA', icon: Bot },
  { vista: 'admin', label: 'Programas', icon: ShieldCheck },
  { vista: 'config', label: 'Configuración', icon: Cog },
]

const NAV: NavItem[] = [...MAIN_NAV, ...ADMIN_NAV]
const ADMIN_VISTAS: Vista[] = ['agentes', 'admin', 'config']
const VALID_VISTAS: Vista[] = [
  'casos',
  'nuevo',
  'bandeja',
  'sesiones',
  'reporting',
  'profesionales',
  'agentes',
  'admin',
  'config',
]

function metricToneClass(tone: HeaderMetric['tone']) {
  switch (tone) {
    case 'accent':
      return 'border-[#7b3fa0]/20 bg-[#7b3fa0]/8 text-[#7b3fa0]'
    case 'warning':
      return 'border-amber-200 bg-amber-50 text-amber-700'
    case 'danger':
      return 'border-red-200 bg-red-50 text-red-700'
    default:
      return 'border-slate-200 bg-white text-[#152520]'
  }
}

function Sidebar({
  active,
  onNavigate,
  bandejaCount,
  onOpenIntro,
  onPreviewAction,
}: {
  active: Vista
  onNavigate: (v: Vista) => void
  bandejaCount: number
  onOpenIntro: () => void
  onPreviewAction: (message: string) => void
}) {
  const isAdminVista = ADMIN_VISTAS.includes(active)
  const [adminOpen, setAdminOpen] = useState(isAdminVista)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (isAdminVista) setAdminOpen(true)
  }, [isAdminVista])

  function renderNavItem({ vista, label, icon: Icon }: NavItem) {
    const isActive = active === vista
    return (
      <li key={vista}>
        <button
          title={collapsed ? label : undefined}
          onClick={() => onNavigate(vista)}
          className={`relative flex w-full items-center rounded-xl px-2.5 py-2 text-sm transition ${
            collapsed ? 'justify-center' : 'gap-2.5'
          } ${
            isActive
              ? 'bg-white font-semibold text-[#152520] shadow-sm'
              : 'text-[#4a7068] hover:bg-white/70 hover:text-[#152520]'
          }`}
        >
          <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#7b3fa0]' : 'text-[#4a7068]'}`} />
          {!collapsed && <span className="truncate">{label}</span>}
          {!collapsed && vista === 'bandeja' && bandejaCount > 0 ? (
            <span className="ml-auto rounded-full bg-[#e8501e] px-1.5 py-0.5 text-[10px] font-bold text-white">
              {bandejaCount}
            </span>
          ) : null}
          {collapsed && vista === 'bandeja' && bandejaCount > 0 ? (
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#e8501e]" />
          ) : null}
        </button>
      </li>
    )
  }

  return (
    <aside
      className={`relative flex h-full shrink-0 flex-col border-r border-slate-200 bg-[#f1f3f5] transition-all duration-200 ${
        collapsed ? 'w-14' : 'w-56'
      }`}
    >
      <div
        className={`flex items-center border-b border-slate-100 ${
          collapsed ? 'justify-center px-3 py-4' : 'px-4 py-3'
        }`}
      >
        {collapsed ? (
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: 'linear-gradient(135deg, #8dc63f 50%, #7b3fa0 50%)' }}
          >
            <Activity className="h-4 w-4 text-white" />
          </div>
        ) : (
          <div className="min-w-0 flex-1">
            <Image src="/brand/xarxapkpd.png" alt="Xarxa PK/PD" width={144} height={32} className="h-8 w-auto" />
            <p className="mt-0.5 text-[10px] text-[#4a7068]">Crohn PK/PD</p>
          </div>
        )}
      </div>

      <button
        onClick={() => setCollapsed((value) => !value)}
        className="absolute -right-3 top-[52px] z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-[#4a7068] shadow-sm transition hover:text-[#152520]"
        title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
      >
        <ChevronDown className={`h-3 w-3 transition-transform ${collapsed ? '-rotate-90' : 'rotate-90'}`} />
      </button>

      <nav className="flex-1 overflow-y-auto px-1.5 py-3">
        <ul className="space-y-0.5">{MAIN_NAV.map((item) => renderNavItem(item))}</ul>

        <div className="mt-4">
          {collapsed ? (
            <div className="mb-1 h-px bg-slate-100" />
          ) : (
            <button
              onClick={() => setAdminOpen((value) => !value)}
              className="flex w-full items-center gap-1 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7b3fa0] transition hover:text-[#6b30a0]"
            >
              <span className="flex-1 text-left">Admin</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${adminOpen ? 'rotate-180' : ''}`} />
            </button>
          )}
          {(adminOpen || collapsed) ? <ul className="space-y-0.5">{ADMIN_NAV.map((item) => renderNavItem(item))}</ul> : null}
        </div>
      </nav>

      <div className="border-t border-slate-100 px-2 py-3">
        {collapsed ? (
          <div className="mb-2 flex justify-center">
            <button
              onClick={onOpenIntro}
              title="Intro de la demo"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-[#4a7068] transition hover:border-slate-300 hover:bg-white hover:text-[#152520]"
            >
              <BookOpenCheck className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenIntro}
            className="mb-3 flex w-full items-start gap-2 rounded-2xl border border-slate-300/60 bg-white/80 px-3 py-3 text-left transition hover:bg-white"
          >
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#7b3fa0]/10 text-[#7b3fa0]">
              <BookOpenCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-[#152520]">Intro de la demo</p>
              <p className="mt-1 text-[10px] leading-5 text-[#4a7068]">
                Explicación de negocio, recorrido recomendado y propuesta de valor.
              </p>
            </div>
          </button>
        )}

        <div className={collapsed ? 'flex justify-center' : 'px-1'}>
        {collapsed ? (
          <PersonAvatar name={DEMO_CURRENT_USER.name} avatarUrl={DEMO_CURRENT_USER.avatarUrl} size="sm" />
        ) : (
          <div className="flex items-center gap-2">
            <PersonAvatar name={DEMO_CURRENT_USER.name} avatarUrl={DEMO_CURRENT_USER.avatarUrl} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium text-[#152520]">{DEMO_CURRENT_USER.name}</p>
              <p className="truncate text-[10px] text-[#4a7068]">{DEMO_CURRENT_USER.center}</p>
            </div>
            <button
              onClick={() => onPreviewAction('La gestión completa de sesión y salida del usuario sigue en vista previa dentro de la demo.')}
              className="text-[#4a7068]/40 hover:text-[#4a7068]"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        </div>
      </div>
    </aside>
  )
}

function MetricPill({ metric }: { metric: HeaderMetric }) {
  return (
    <div
      className={`rounded-2xl border px-3 py-2 shadow-sm transition ${metricToneClass(metric.tone)}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] opacity-70">
        {metric.label}
      </p>
      <p className="mt-1 text-sm font-semibold">{metric.value}</p>
    </div>
  )
}

function DesktopOnlyNotice() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f7faf9] px-5 py-8 lg:hidden">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7b3fa0]/10 text-[#7b3fa0]">
            <Monitor className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold text-[#152520]">Demo interactiva disponible en escritorio</h1>
          <p className="mt-3 text-sm leading-7 text-[#4a7068]">
            Desde el móvil puedes revisar la introducción de la plataforma, pero la demo operativa de
            Bandeja IA, Case Cockpit, agentes y reporting está preparada para una experiencia de escritorio.
          </p>
          <p className="mt-3 text-sm leading-7 text-[#4a7068]">
            Para iniciar la demo completa, abre Xarxa PK/PD Intelligence Hub desde un ordenador.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-2xl bg-[#7b3fa0] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#6a3490]"
            >
              Ver intro de la demo
            </a>
            <p className="text-center text-[11px] text-[#4a7068]">
              La experiencia interactiva se activa automáticamente en pantallas de escritorio.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function TopHeader({
  vistaLabel,
  programs,
  selectedProgramId,
  onOpenPalette,
  notifications,
  notificationsOpen,
  onToggleNotifications,
  onNavigateNotification,
  notificationContainerRef,
}: {
  vistaLabel: string
  programs: Program[]
  selectedProgramId: string
  onOpenPalette: () => void
  notifications: ShellNotification[]
  notificationsOpen: boolean
  onToggleNotifications: () => void
  onNavigateNotification: (vista: Vista) => void
  notificationContainerRef: RefObject<HTMLDivElement>
}) {
  const activeProgramLabel =
    programs.find((program) => program._id === selectedProgramId)?.label
    ?? programs.find((program) => program.status === 'Activo')?.label
    ?? 'Crohn PK/PD'

  return (
    <header className="shrink-0 border-b border-slate-100 bg-white">
      <div className="flex items-center justify-between gap-4 px-5 py-3">
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-[#152520]">{vistaLabel}</h1>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          <div className="hidden min-w-[240px] max-w-md flex-1 lg:block">
            <button
              onClick={onOpenPalette}
              className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm text-[#4a7068] transition hover:border-slate-300 hover:bg-white"
            >
              <Search className="h-4 w-4 text-[#4a7068]" />
              <span className="flex-1 truncate">Buscar caso, paciente, profesional o centro…</span>
              <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                ⌘K
              </span>
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-[#152520]">
            {activeProgramLabel}
          </div>

          <button
            onClick={onOpenPalette}
            className="rounded-xl border border-slate-200 p-2 text-[#4a7068] transition hover:bg-slate-50 lg:hidden"
            title="Buscar"
          >
            <Search className="h-4 w-4" />
          </button>

          <div className="relative" ref={notificationContainerRef}>
            <button
              onClick={onToggleNotifications}
              className="relative rounded-xl border border-slate-200 p-2 text-[#4a7068] transition hover:bg-slate-50"
              title="Notificaciones"
            >
              <Bell className="h-4 w-4" />
              {notifications.length > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#e8501e] px-1 text-[10px] font-bold text-white">
                  {notifications.length}
                </span>
              ) : null}
            </button>

            {notificationsOpen ? (
              <div className="absolute right-0 z-30 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                <div className="border-b border-slate-100 px-2 pb-2">
                  <p className="text-sm font-semibold text-[#152520]">Notificaciones operativas</p>
                  <p className="text-xs text-[#4a7068]">Pendientes que requieren atención humana o coordinación de red.</p>
                </div>
                <div className="max-h-[26rem] space-y-1 overflow-y-auto px-1 py-2">
                  {notifications.length > 0 ? (
                    notifications.map((item) => {
                      const Icon = item.icon
                      return (
                        <button
                          key={item.id}
                          onClick={() => onNavigateNotification(item.vista)}
                          className="w-full rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-left transition hover:border-slate-200 hover:bg-white"
                        >
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[#7b3fa0]">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-[#152520]">{item.title}</p>
                              <p className="mt-0.5 text-[11px] text-[#4a7068]">{item.detail}</p>
                            </div>
                          </div>
                        </button>
                      )
                    })
                  ) : (
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-4 text-xs text-[#4a7068]">
                      No hay alertas críticas en este momento.
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

    </header>
  )
}

function CommandPalette({
  open,
  query,
  sections,
  onQueryChange,
  onClose,
}: {
  open: boolean
  query: string
  sections: PaletteSection[]
  onQueryChange: (value: string) => void
  onClose: () => void
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const flatItems = sections.flatMap((section) => section.items)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (!open) return
    setActiveIndex(0)
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    setActiveIndex(0)
  }, [query, sections])

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (flatItems.length === 0) return
      setActiveIndex((current) => (current + 1) % flatItems.length)
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (flatItems.length === 0) return
      setActiveIndex((current) => (current - 1 + flatItems.length) % flatItems.length)
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      flatItems[activeIndex]?.onSelect()
      onClose()
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    }
  }

  if (!open) return null

  let renderedIndex = -1

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-20">
      <button
        type="button"
        aria-label="Cerrar buscador"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px]"
      />

      <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
          <Search className="h-4 w-4 text-[#4a7068]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar acciones, casos, centros o profesionales…"
            className="flex-1 bg-transparent text-sm text-[#152520] outline-none placeholder:text-slate-400"
          />
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#4a7068] transition hover:bg-slate-100"
            title="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-3">
          {sections.length > 0 ? (
            <div className="space-y-4">
              {sections.map((section) => (
                <div key={section.label}>
                  <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4a7068]">
                    {section.label}
                  </p>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      renderedIndex += 1
                      const isActive = renderedIndex === activeIndex
                      const Icon = item.icon
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            item.onSelect()
                            onClose()
                          }}
                          className={`flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition ${
                            isActive ? 'bg-[#faf6fd]' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#7b3fa0] shadow-sm">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-semibold text-[#152520]">{item.label}</p>
                              {item.meta ? (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                                  {item.meta}
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-0.5 text-xs text-[#4a7068]">{item.description}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
              <p className="text-sm font-semibold text-[#152520]">Sin resultados</p>
              <p className="mt-1 text-xs text-[#4a7068]">
                Prueba con un caso, un profesional, un centro o una acción del circuito.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function XarraPro() {
  const router = useRouter()
  const params = useSearchParams()

  const rawVista = params.get('vista') as Vista | null
  const activeVista: Vista = VALID_VISTAS.includes(rawVista as Vista) ? (rawVista as Vista) : 'casos'

  const [casos, setCasos] = useState<CasoResumen[]>([])
  const [kpis, setKpis] = useState<Array<{ label: string; value: number }>>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [forms, setForms] = useState<ClinicalForm[]>([])
  const [centers, setCenters] = useState<Center[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [pendingApprovals, setPendingApprovals] = useState<ProfessionalApproval[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([])
  const [selectedProgramId, setSelectedProgramId] = useState('')
  const [selectedCenterId, setSelectedCenterId] = useState('')
  const [caseDateRangeDays, setCaseDateRangeDays] = useState(30)
  const [openCaseId, setOpenCaseId] = useState<string | null>(null)
  const [openCase, setOpenCase] = useState<CasoCompleto | null>(null)
  const [caseLaunchPreset, setCaseLaunchPreset] = useState<CaseCockpitLaunchPreset | null>(null)
  const [shellStatus, setShellStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [queueStatus, setQueueStatus] = useState<'idle' | 'loading' | 'refreshing' | 'ready' | 'error'>('idle')
  const [queueError, setQueueError] = useState<string | null>(null)
  const [caseStatus, setCaseStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [caseError, setCaseError] = useState<string | null>(null)
  const [caseReloadKey, setCaseReloadKey] = useState(0)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteQuery, setPaletteQuery] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [shellNotice, setShellNotice] = useState<string | null>(null)
  const [programFilterReady, setProgramFilterReady] = useState(false)

  const notificationContainerRef = useRef<HTMLDivElement>(null)
  const queueRequestRef = useRef(0)

  async function loadShellContext() {
    setShellStatus('loading')

    try {
      const payload = await fetchJson<{
        professionals?: Professional[]
        centers?: Center[]
        roles?: Array<{ _id: string; label: string }>
        pendingApprovals?: ProfessionalApproval[]
        programs?: Program[]
        forms?: ClinicalForm[]
        agents?: Agent[]
        sessions?: SessionItem[]
        inboxItems?: InboxItem[]
      }>('/api/xarxa/shell-context')

      setProfessionals(payload.professionals ?? [])
      setCenters(payload.centers ?? [])
      setPendingApprovals(payload.pendingApprovals ?? [])
      setPrograms(payload.programs ?? [])
      setForms(payload.forms ?? [])
      setAgents(payload.agents ?? [])
      setSessions(payload.sessions ?? [])
      setInboxItems(payload.inboxItems ?? [])
      setShellStatus('ready')
      return
    } catch {
      // Fallback for local dev servers that have not reloaded the consolidated endpoint yet.
    }

    const [professionalsResult, programsResult, agentsResult, sessionsResult, inboxResult] =
      await Promise.allSettled([
        fetchJson<{
          professionals?: Professional[]
          centers?: Center[]
          pendingApprovals?: ProfessionalApproval[]
        }>('/api/xarxa/professionals', { timeoutMs: 9000 }),
        fetchJson<{ items?: Program[]; forms?: ClinicalForm[] }>('/api/xarxa/programs', { timeoutMs: 9000 }),
        fetchJson<{ items?: Agent[] }>('/api/xarxa/agents', { timeoutMs: 9000 }),
        fetchJson<{ items?: SessionItem[] }>('/api/xarxa/sessions', { timeoutMs: 9000 }),
        fetchJson<{ items?: InboxItem[] }>('/api/xarxa/inbox', { timeoutMs: 9000 }),
      ])

    let successCount = 0

    if (professionalsResult.status === 'fulfilled') {
      setProfessionals(professionalsResult.value.professionals ?? [])
      setCenters(professionalsResult.value.centers ?? [])
      setPendingApprovals(professionalsResult.value.pendingApprovals ?? [])
      successCount += 1
    }

    if (programsResult.status === 'fulfilled') {
      setPrograms(programsResult.value.items ?? [])
      setForms(programsResult.value.forms ?? [])
      successCount += 1
    }

    if (agentsResult.status === 'fulfilled') {
      setAgents(agentsResult.value.items ?? [])
      successCount += 1
    }

    if (sessionsResult.status === 'fulfilled') {
      setSessions(sessionsResult.value.items ?? [])
      successCount += 1
    }

    if (inboxResult.status === 'fulfilled') {
      setInboxItems(inboxResult.value.items ?? [])
      successCount += 1
    }

    setShellStatus(successCount > 0 ? 'ready' : 'error')
  }

  const loadQueue = useCallback(async () => {
    const requestId = ++queueRequestRef.current
    setQueueStatus((current) => (current === 'idle' ? 'loading' : 'refreshing'))
    setQueueError(null)

    try {
      const query = new URLSearchParams()
      if (selectedCenterId) query.set('center', selectedCenterId)
      if (selectedProgramId) query.set('program', selectedProgramId)
      if (caseDateRangeDays > 0) query.set('days', String(caseDateRangeDays))

      const suffix = query.toString() ? `?${query.toString()}` : ''
      const kpisRequest = fetchJson<{ kpis?: Array<{ label: string; value: number }> }>(
        `/api/xarxa/kpis${suffix}`,
        { timeoutMs: 9000 }
      )
        .then((kpisData) => {
          if (queueRequestRef.current !== requestId) return
          setKpis(kpisData.kpis ?? [])
        })
        .catch(() => {
          // Keep previous KPI snapshot if the metrics request fails or arrives late.
        })

      const casesData = await fetchJson<{ items?: CasoResumen[] }>(`/api/xarxa/cases${suffix}`, {
        timeoutMs: 9000,
      })

      if (queueRequestRef.current !== requestId) return
      setCasos(casesData.items ?? [])
      setQueueStatus('ready')
      void kpisRequest
    } catch (error) {
      if (queueRequestRef.current !== requestId) return
      setQueueStatus('error')
      setQueueError(
        error instanceof Error ? error.message : 'No se ha podido cargar la cola de casos.'
      )
    }
  }, [caseDateRangeDays, selectedCenterId, selectedProgramId])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadShellContext()
    }, 120)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (programs.length === 0) {
      if (shellStatus === 'ready' || shellStatus === 'error') {
        setProgramFilterReady(true)
      }
      return
    }

    if (programs.some((program) => program._id === selectedProgramId)) {
      setProgramFilterReady(true)
      return
    }

    const preferred =
      programs.find((program) => program._id === 'prog-crohn-pkpd') ??
      programs.find((program) => program._id === 'prog-crohn') ??
      programs.find((program) => program.label.toLowerCase().includes('crohn')) ??
      programs.find((program) => program.status === 'Activo') ??
      programs[0]

    if (preferred?._id && preferred._id !== selectedProgramId) {
      setSelectedProgramId(preferred._id)
      return
    }

    setProgramFilterReady(true)
  }, [programs, selectedProgramId, shellStatus])

  useEffect(() => {
    if (!programFilterReady) return
    void loadQueue()
  }, [loadQueue, programFilterReady])

  useEffect(() => {
    if (!openCaseId) {
      setOpenCase(null)
      setCaseStatus('idle')
      setCaseError(null)
      return
    }

    let cancelled = false

    async function loadCase(caseId: string) {
      setCaseStatus('loading')
      setCaseError(null)

      try {
        const data = await fetchJson<CasoCompleto>(`/api/xarxa/cases/${caseId}`)
        if (cancelled) return
        setOpenCase(data)
        setCaseStatus('ready')
      } catch (error) {
        if (cancelled) return
        setOpenCase(null)
        setCaseStatus('error')
        setCaseError(error instanceof Error ? error.message : 'No se ha podido cargar el caso.')
      }
    }

    void loadCase(openCaseId)

    return () => {
      cancelled = true
    }
  }, [openCaseId, caseReloadKey])

  useEffect(() => {
    function handleGlobalKeydown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setNotificationsOpen(false)
        setPaletteOpen(true)
      }
      if (event.key === 'Escape') {
        setNotificationsOpen(false)
      }
    }

    window.addEventListener('keydown', handleGlobalKeydown)
    return () => window.removeEventListener('keydown', handleGlobalKeydown)
  }, [])

  useEffect(() => {
    if (!notificationsOpen) return

    function handleOutsideClick(event: MouseEvent) {
      if (
        notificationContainerRef.current &&
        !notificationContainerRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [notificationsOpen])

  const navigate = useCallback((vista: Vista) => {
    router.push(`/?vista=${vista}`)
    setCaseLaunchPreset(null)
    setOpenCaseId(null)
    setOpenCase(null)
    setCaseStatus('idle')
    setCaseError(null)
    setNotificationsOpen(false)
  }, [router])

  const openIntro = useCallback(() => {
    router.push('/')
    setCaseLaunchPreset(null)
    setOpenCaseId(null)
    setOpenCase(null)
    setCaseStatus('idle')
    setCaseError(null)
    setNotificationsOpen(false)
  }, [router])

  function openPalette(initialQuery = '') {
    setNotificationsOpen(false)
    setPaletteQuery(initialQuery)
    setPaletteOpen(true)
  }

  function closePalette() {
    setPaletteOpen(false)
    setPaletteQuery('')
  }

  const vistaLabel = NAV.find((item) => item.vista === activeVista)?.label ?? 'Casos PK/PD'
  const readyInboxCount = inboxItems.filter((item) => item.agentStatus === 'ready').length
  const processingInboxCount = inboxItems.filter((item) => item.agentStatus === 'processing').length
  const createdInboxCount = inboxItems.filter((item) => item.agentStatus === 'created').length
  const criticalCasesCount = casos.filter(
    (caso) =>
      caso.priority === 'Urgente' ||
      caso.gaps.some((gap) => gap.severity === 'Crítico' && gap.status !== 'Resuelta')
  ).length
  const readyForReviewCount = casos.filter((caso) =>
    ['Análisis PK/PD generado', 'Revisión farmacéutica', 'Revisión médica'].includes(
      caso.pipelineStage
    )
  ).length
  const liveSessionsCount = sessions.filter((session) => session.status === 'live').length
  const scheduledSessionsCount = sessions.filter((session) => session.status === 'scheduled').length
  const activeProfessionalsCount = professionals.filter(
    (professional) => professional.status === 'Activo'
  ).length
  const activeAgentsCount = agents.filter((agent) => agent.status === 'Activo').length
  const agentsWithHumanValidation = agents.filter((agent) => agent.requiresHumanValidation).length
  const recentAgentRunsCount = agents.reduce(
    (total, agent) => total + (agent.recentRuns?.length ?? 0),
    0
  )
  const activeProgramsCount = programs.filter((program) => program.status === 'Activo').length
  const draftProgramsCount = programs.filter((program) =>
    program.status.toLowerCase().includes('borrador')
  ).length
  const bandejaCount = inboxItems.filter(
    (item) => item.agentStatus !== 'created' && item.agentStatus !== 'error'
  ).length

  const headerMetrics = useMemo<HeaderMetric[]>(() => {
    if (activeVista === 'casos') {
      return kpis.length > 0
        ? kpis.slice(0, 4).map((item, index) => ({
            label: item.label,
            value: item.value,
            tone: index === 2 ? 'warning' : 'default',
          }))
        : [
            { label: 'Casos activos', value: casos.length, tone: 'accent' },
            { label: 'Listos para revisión', value: readyForReviewCount, tone: 'accent' },
            { label: 'Gaps críticos', value: criticalCasesCount, tone: criticalCasesCount > 0 ? 'danger' : 'default' },
            { label: 'Seguimiento pendiente', value: casos.filter((item) => item.pipelineStage.includes('Seguimiento')).length, tone: 'warning' },
          ]
    }

    if (activeVista === 'bandeja') {
      return [
        { label: 'Solicitudes listas', value: readyInboxCount, tone: 'accent' },
        { label: 'En procesamiento', value: processingInboxCount, tone: 'warning' },
        { label: 'Casos creados', value: createdInboxCount, tone: 'default' },
        {
          label: 'Borradores estructurados',
          value: inboxItems.filter(item => item.agentStatus === 'ready' || item.agentStatus === 'created').length,
          tone: 'default',
        },
      ]
    }

    if (activeVista === 'sesiones') {
      return [
        { label: 'Sesiones activas', value: liveSessionsCount, tone: liveSessionsCount > 0 ? 'accent' : 'default' },
        { label: 'Programadas', value: scheduledSessionsCount, tone: 'default' },
        { label: 'Casos en agenda', value: sessions.reduce((sum, session) => sum + session.casesCount, 0), tone: 'warning' },
        { label: 'Centros participantes', value: new Set(sessions.flatMap((session) => session.participants)).size, tone: 'default' },
      ]
    }

    if (activeVista === 'reporting') {
      return (kpis.length > 0
        ? kpis.slice(0, 4).map((item, index) => ({
            label: item.label,
            value: item.value,
            tone: index === 0 ? 'accent' : 'default',
          }))
        : [{ label: 'Casos activos', value: casos.length, tone: 'accent' }]) as HeaderMetric[]
    }

    if (activeVista === 'profesionales') {
      return [
        { label: 'Profesionales activos', value: activeProfessionalsCount, tone: 'accent' },
        { label: 'Centros operativos', value: centers.filter((center) => center.status === 'Activo').length, tone: 'default' },
        { label: 'Pendientes de acceso', value: pendingApprovals.length, tone: pendingApprovals.length > 0 ? 'warning' : 'default' },
        { label: 'Farmacia experta', value: professionals.filter((professional) => professional.roleLabel === 'Farmacéutico experto').length, tone: 'default' },
      ]
    }

    if (activeVista === 'agentes') {
      return [
        { label: 'Agentes activos', value: activeAgentsCount, tone: 'accent' },
        { label: 'Validación humana', value: agentsWithHumanValidation, tone: 'warning' },
        { label: 'Ejecuciones recientes', value: recentAgentRunsCount, tone: 'default' },
        { label: 'Incidencias', value: agents.reduce((sum, agent) => sum + (agent.recentRuns?.filter((run) => run.status === 'Error').length ?? 0), 0), tone: 'danger' },
      ]
    }

    if (activeVista === 'admin') {
      return [
        { label: 'Programas activos', value: activeProgramsCount, tone: 'accent' },
        { label: 'Borradores', value: draftProgramsCount, tone: 'warning' },
        { label: 'Formularios', value: forms.length, tone: 'default' },
        { label: 'Especialidades', value: new Set(programs.map((program) => program.specialty)).size, tone: 'default' },
      ]
    }

    if (activeVista === 'config') {
      return [
        { label: 'Centros conectados', value: centers.length, tone: 'default' },
        { label: 'Agentes configurados', value: agents.length, tone: 'accent' },
        { label: 'Programas disponibles', value: programs.length, tone: 'default' },
        { label: 'Sesiones trazables', value: sessions.length, tone: 'warning' },
      ]
    }

    return [
      { label: 'Programa activo', value: programs.find((program) => program._id === selectedProgramId)?.label ?? 'Crohn PK/PD', tone: 'accent' },
      { label: 'Centro', value: centers.find((center) => center._id === selectedCenterId)?.name ?? 'Todos los centros', tone: 'default' },
      { label: 'Solicitudes en cola', value: bandejaCount, tone: 'warning' },
      { label: 'Casos activos', value: casos.length, tone: 'default' },
    ]
  }, [
    activeAgentsCount,
    activeProfessionalsCount,
    activeProgramsCount,
    activeVista,
    agents,
    agentsWithHumanValidation,
    bandejaCount,
    casos,
    centers,
    createdInboxCount,
    criticalCasesCount,
    draftProgramsCount,
    forms.length,
    inboxItems,
    kpis,
    liveSessionsCount,
    pendingApprovals.length,
    processingInboxCount,
    programs,
    readyForReviewCount,
    readyInboxCount,
    recentAgentRunsCount,
    scheduledSessionsCount,
    selectedCenterId,
    selectedProgramId,
    sessions,
    professionals,
  ])

  const notifications = useMemo<ShellNotification[]>(() => {
    const items: ShellNotification[] = []

    if (pendingApprovals.length > 0) {
      items.push({
        id: 'pending-approvals',
        title: `${pendingApprovals.length} acceso${pendingApprovals.length === 1 ? '' : 's'} pendiente${pendingApprovals.length === 1 ? '' : 's'}`,
        detail: 'Requieren validación de rol y centro antes de incorporarse a la red.',
        vista: 'profesionales',
        icon: Users2,
      })
    }

    if (readyInboxCount > 0 || processingInboxCount > 0) {
      items.push({
        id: 'inbox-ready',
        title: `${readyInboxCount} solicitudes listas y ${processingInboxCount} en procesamiento`,
        detail: 'La bandeja IA tiene nuevas solicitudes para revisar o convertir en caso.',
        vista: 'bandeja',
        icon: Inbox,
      })
    }

    if (criticalCasesCount > 0) {
      items.push({
        id: 'critical-cases',
        title: `${criticalCasesCount} casos con riesgo o gaps críticos`,
        detail: 'Conviene revisar la cola operativa y reasignar prioridades si hace falta.',
        vista: 'casos',
        icon: TriangleAlert,
      })
    }

    if (liveSessionsCount > 0) {
      items.push({
        id: 'live-sessions',
        title: `${liveSessionsCount} sesión${liveSessionsCount === 1 ? '' : 'es'} de red en marcha`,
        detail: 'Hay discusión colaborativa activa con casos pendientes de resolución.',
        vista: 'sesiones',
        icon: Video,
      })
    }

    if (agents.some((agent) => agent.recentRuns?.some((run) => run.status === 'Error'))) {
      items.push({
        id: 'agent-incidents',
        title: 'Se han detectado incidencias recientes en agentes',
        detail: 'Revisa trazas, límites y resultados antes de confiar en el borrador automatizado.',
        vista: 'agentes',
        icon: Bot,
      })
    }

    return items.slice(0, 5)
  }, [agents, criticalCasesCount, liveSessionsCount, pendingApprovals.length, processingInboxCount, readyInboxCount])

  const paletteSections = useMemo<PaletteSection[]>(() => {
    const query = paletteQuery.trim().toLowerCase()

    const actionItems: PaletteItem[] = [
      {
        id: 'action-new-case',
        label: 'Crear nuevo caso',
        description: 'Abrir el asistente para registrar un nuevo caso clínico.',
        icon: FilePlus2,
        onSelect: () => navigate('nuevo'),
      },
      {
        id: 'action-open-inbox',
        label: 'Abrir Bandeja IA',
        description: 'Revisar emails entrantes y estructurarlos antes de crear el caso.',
        icon: Inbox,
        onSelect: () => navigate('bandeja'),
      },
      {
        id: 'action-open-sessions',
        label: 'Preparar sesión de red',
        description: 'Consultar agenda, casos en discusión y sesiones próximas.',
        icon: Video,
        onSelect: () => navigate('sesiones'),
      },
      {
        id: 'action-open-reporting',
        label: 'Generar informe de actividad',
        description: 'Abrir reporting operativo y aprendizaje de red.',
        icon: BarChart3,
        onSelect: () => navigate('reporting'),
      },
      {
        id: 'action-open-admin',
        label: 'Configurar programa clínico',
        description: 'Entrar en Programas para revisar programas, formularios y workflow.',
        icon: FolderCog,
        onSelect: () => navigate('admin'),
      },
    ].filter((item) =>
      query
        ? `${item.label} ${item.description}`.toLowerCase().includes(query)
        : true
    )

    const caseItems = [...casos]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .filter((caso) => {
        if (!query) return true
        const haystack = [
          caso.caseId,
          caso.patientCode,
          caso.title,
          caso.centerName,
          caso.requesterName,
          caso.assignedName,
          caso.pipelineStage,
          caso.priority,
        ]
          .join(' ')
          .toLowerCase()
        return haystack.includes(query)
      })
      .slice(0, query ? 8 : 5)
      .map<PaletteItem>((caso) => ({
        id: `case:${caso.caseId}`,
        label: caso.caseId,
        description: `${caso.title} · ${caso.patientCode} · ${caso.centerName}`,
        meta: caso.priority,
        icon: LayoutDashboard,
        onSelect: () => {
          router.push('/?vista=casos')
          setCaseLaunchPreset(null)
          setOpenCaseId(caso.caseId)
        },
      }))

    const professionalItems = professionals
      .filter((professional) => {
        if (!query) return false
        const haystack = [
          professional.name,
          professional.roleLabel,
          professional.centerName,
          professional.specialties?.join(' '),
        ]
          .join(' ')
          .toLowerCase()
        return haystack.includes(query)
      })
      .slice(0, 6)
      .map<PaletteItem>((professional) => ({
        id: `professional:${professional._id}`,
        label: professional.name,
        description: `${professional.roleLabel} · ${professional.centerName ?? 'Centro no indicado'}`,
        meta: professional.status,
        icon: UserRound,
        onSelect: () => navigate('profesionales'),
      }))

    const centerAndProgramItems = [
      ...centers
        .filter((center) => {
          if (!query) return false
          return `${center.name} ${center.city} ${center.territory}`.toLowerCase().includes(query)
        })
        .map<PaletteItem>((center) => ({
          id: `center:${center._id}`,
          label: center.name,
          description: `${center.city} · ${center.type}`,
          meta: 'Centro',
          icon: Building2,
          onSelect: () => {
            setSelectedCenterId(center._id)
            navigate('casos')
          },
        })),
      ...programs
        .filter((program) => {
          if (!query) return false
          return `${program.label} ${program.specialty} ${program.status}`.toLowerCase().includes(query)
        })
        .map<PaletteItem>((program) => ({
          id: `program:${program._id}`,
          label: program.label,
          description: `${program.specialty} · ${program.status}`,
          meta: 'Programa',
          icon: FolderCog,
          onSelect: () => {
            setSelectedProgramId(program._id)
            navigate('casos')
          },
        })),
    ].slice(0, 6)

    const sections: PaletteSection[] = []

    if (actionItems.length > 0) sections.push({ label: 'Acciones', items: actionItems })
    if (caseItems.length > 0) sections.push({ label: 'Casos', items: caseItems })
    if (professionalItems.length > 0) {
      sections.push({ label: 'Profesionales', items: professionalItems })
    }
    if (centerAndProgramItems.length > 0) {
      sections.push({ label: 'Centros y programas', items: centerAndProgramItems })
    }

    return sections
  }, [casos, centers, navigate, paletteQuery, professionals, programs, router])

  function renderView() {
    if (openCaseId) {
      if (caseStatus === 'loading' || caseStatus === 'idle') {
        return (
          <WorkspaceLoadingState
            title="Cargando caso…"
            detail="Estamos preparando el cockpit clínico y la trazabilidad del caso."
          />
        )
      }
      if (caseStatus === 'error') {
        return (
          <WorkspaceErrorState
            title="No se ha podido abrir el caso."
            detail={caseError ?? undefined}
            onRetry={() => setCaseReloadKey((value) => value + 1)}
          />
        )
      }
      if (!openCase) {
        return (
          <WorkspaceLoadingState
            title="Preparando caso…"
            detail="Estamos recuperando los datos clínicos y la trazabilidad."
          />
        )
      }
        return (
          <CaseCockpit
            caso={openCase}
            program={programs.find((program) => program._id === openCase.programId) ?? null}
            launchPreset={caseLaunchPreset?.caseId === openCase.caseId ? caseLaunchPreset : undefined}
            onLaunchPresetConsumed={() => setCaseLaunchPreset(null)}
            onCaseUpdated={handleCaseUpdated}
          onCaseDeleted={handleCaseDeleted}
          onBack={() => {
            setCaseLaunchPreset(null)
            setOpenCaseId(null)
            setOpenCase(null)
            setCaseStatus('idle')
            setCaseError(null)
          }}
        />
      )
    }

    switch (activeVista) {
      case 'casos':
        if ((!programFilterReady || queueStatus === 'loading') && casos.length === 0) {
          return <CasesQueueSkeleton />
        }
        if (queueStatus === 'error' && casos.length === 0) {
          return (
            <WorkspaceErrorState
              title="No se ha podido cargar la cola de casos."
              detail={queueError ?? undefined}
              onRetry={() => void loadQueue()}
            />
          )
        }
        return (
          <CasosPkpd
            casos={casos}
            kpis={kpis}
            dateRangeDays={caseDateRangeDays}
            onDateRangeChange={setCaseDateRangeDays}
            professionals={professionals}
            loadingProfessionals={shellStatus === 'loading' && professionals.length === 0}
            isRefreshing={queueStatus === 'refreshing'}
            onOpenCaso={(id) => {
              setCaseLaunchPreset(null)
              setOpenCaseId(id)
            }}
            onNuevoCaso={() => navigate('nuevo')}
            onCasesChanged={loadQueue}
          />
        )
      case 'nuevo':
        return (
          <NuevoCasoWizard
            onCancel={() => navigate('casos')}
            onCreated={handleCaseCreated}
          />
        )
      case 'bandeja':
        return <BandejaIa onCaseCreated={handleCaseCreated} />
      case 'sesiones':
        return <Sesiones onOpenCaso={(id) => {
          setCaseLaunchPreset(null)
          setOpenCaseId(id)
        }} />
      case 'reporting':
        return (
          <Reporting
            centerId={selectedCenterId}
            programId={selectedProgramId}
          />
        )
      case 'profesionales':
        return <Profesionales />
      case 'agentes':
        return <AgentesIa />
      case 'admin':
        return <AdminClinico />
      case 'config':
        return <Configuracion />
      default:
        return null
    }
  }

  async function handleCaseCreated(
    caseId: string,
    options?: Omit<CaseCockpitLaunchPreset, 'caseId'>,
  ) {
    router.push('/?vista=casos')
    if (caseId) {
      if (options) {
        setCaseLaunchPreset({ caseId, ...options })
      } else {
        setCaseLaunchPreset(null)
      }
      setOpenCaseId(caseId)
    }
    try {
      await Promise.all([loadQueue(), loadShellContext()])
    } catch {
      // Keep the current snapshots if the background refresh fails.
    }
  }

  async function handleCaseUpdated(updatedCase: CasoCompleto) {
    setOpenCase(updatedCase)
    setCasos((current) =>
      current.map((item) =>
        item.caseId === updatedCase.caseId
          ? {
              ...item,
              demoSeedTag: updatedCase.demoSeedTag,
              demoLocked: updatedCase.demoLocked,
              deletable: updatedCase.deletable,
              title: updatedCase.title,
              patientCode: updatedCase.patientCode,
              centerName: updatedCase.centerName,
              requesterName: updatedCase.requesterName,
              assignedTo: updatedCase.assignedTo,
              assignedName: updatedCase.assignedName,
              caseType: updatedCase.caseType,
              entrySource: updatedCase.entrySource,
              priority: updatedCase.priority,
              pipelineStage: updatedCase.pipelineStage,
              nextAction: updatedCase.nextAction,
              updatedAt: updatedCase.updatedAt,
              gaps: updatedCase.gaps,
              tasks: updatedCase.tasks,
            }
          : item
      )
    )
    try {
      await Promise.all([loadQueue(), loadShellContext()])
    } catch {
      // Keep the optimistic snapshots if the background refresh fails.
    }
  }

  async function handleCaseDeleted(caseId: string) {
    setCaseLaunchPreset(null)
    setOpenCaseId(null)
    setOpenCase(null)
    setCaseStatus('idle')
    setCaseError(null)
    setCasos((current) => current.filter((item) => item.caseId !== caseId))
    try {
      await Promise.all([loadQueue(), loadShellContext()])
    } catch {
      // Keep the current snapshots if the background refresh fails.
    }
  }

  return (
    <>
      <MobileShell />
      <div className="hidden h-screen overflow-hidden bg-white lg:flex">
      <Sidebar
        active={activeVista}
        onNavigate={navigate}
        bandejaCount={bandejaCount}
        onOpenIntro={openIntro}
        onPreviewAction={setShellNotice}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {!openCaseId ? (
          <TopHeader
            vistaLabel={vistaLabel}
            programs={programs}
            selectedProgramId={selectedProgramId}
            onOpenPalette={() => openPalette()}
            notifications={notifications}
            notificationsOpen={notificationsOpen}
            onToggleNotifications={() => setNotificationsOpen((value) => !value)}
            onNavigateNotification={(vista) => {
              setNotificationsOpen(false)
              navigate(vista)
            }}
            notificationContainerRef={notificationContainerRef}
          />
        ) : null}

        <main className="flex flex-1 flex-col overflow-hidden">
          {shellNotice ? (
            <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-800">
              {shellNotice}
            </div>
          ) : null}
          <div className="min-h-0 flex-1 overflow-hidden">{renderView()}</div>
        </main>
      </div>

      <CommandPalette
        open={paletteOpen}
        query={paletteQuery}
        sections={paletteSections}
        onQueryChange={setPaletteQuery}
        onClose={closePalette}
      />
      </div>
    </>
  )
}
