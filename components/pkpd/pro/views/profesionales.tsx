'use client'

import {
  Activity,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  Search,
  ShieldCheck,
  Stethoscope,
  Users2,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import {
  WorkspaceEmptyState,
  WorkspaceErrorState,
  WorkspaceLoadingState,
} from '@/components/pkpd/pro/workspace-state'
import { Button } from '@/components/ui/button'
import type {
  Center,
  Professional,
  ProfessionalApproval,
  Role,
} from '@/components/pkpd/pro/xarxa-types'
import { fetchJson } from '@/lib/fetch-json'

// ── brand color palette ───────────────────────────────────────────────────────
const BRAND_GREEN  = '#8dc63f'
const BRAND_PURPLE = '#7b3fa0'

const STATUS_SOLID: Record<string, string> = {
  Activo:    'bg-emerald-600 text-white',
  Inactivo:  'bg-slate-400 text-white',
  Pendiente: 'bg-amber-500 text-white',
}

const ROLE_BORDER: Record<string, string> = {
  'Farmacéutico':  'border-l-[#8dc63f]',
  'Farmacéutica':  'border-l-[#8dc63f]',
  'Médico':        'border-l-[#7b3fa0]',
  'Médica':        'border-l-[#7b3fa0]',
  'Enfermero':     'border-l-blue-500',
  'Enfermera':     'border-l-blue-500',
  'Biólogo':       'border-l-cyan-500',
  'Bióloga':       'border-l-cyan-500',
}

function roleColor(roleLabel: string): string {
  const word = roleLabel.split(' ')[0]
  return ROLE_BORDER[word] ?? 'border-l-slate-300'
}

const CENTER_TYPE_BADGE: Record<string, string> = {
  'Hospital Universitario': 'bg-purple-600 text-white',
  'Hospital Comarcal':      'bg-blue-600 text-white',
  'Hospital General':       'bg-indigo-600 text-white',
  'CAP':                    'bg-teal-600 text-white',
  'Clínica':                'bg-cyan-600 text-white',
}

type Tab = 'profesionales' | 'pendientes' | 'centros' | 'roles'

type DirectoryPayload = {
  centers?: Center[]
  professionals?: Professional[]
  roles?: Role[]
  pendingApprovals?: ProfessionalApproval[]
}

export function Profesionales() {
  const [tab, setTab] = useState<Tab>('profesionales')
  const [centers, setCenters] = useState<Center[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [pendingApprovals, setPendingApprovals] = useState<ProfessionalApproval[]>([])
  const [search, setSearch] = useState('')
  const [centerFilter, setCenterFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [assignmentDrafts, setAssignmentDrafts] = useState<Record<string, { roleId: string; centerId: string }>>({})
  const [approvalDrafts, setApprovalDrafts] = useState<Record<string, { roleId: string; centerId: string }>>({})

  async function loadDirectory() {
    setLoading(true)
    setError(null)
    try {
      const payload = await fetchJson<DirectoryPayload>('/api/xarxa/professionals')
      setCenters(payload.centers ?? [])
      setProfessionals(payload.professionals ?? [])
      setRoles(payload.roles ?? [])
      setPendingApprovals(payload.pendingApprovals ?? [])
      setAssignmentDrafts(
        Object.fromEntries(
          (payload.professionals ?? []).map((p) => [p._id, { roleId: p.roleId ?? '', centerId: p.centerId }])
        )
      )
      setApprovalDrafts(
        Object.fromEntries(
          (payload.pendingApprovals ?? []).map((a) => [a._id, { roleId: a.requestedRoleId, centerId: a.requestedCenterId }])
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se ha podido cargar el directorio de red.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadDirectory() }, [])

  const filteredProfessionals = useMemo(() => {
    const q = search.trim().toLowerCase()
    return professionals.filter((p) => {
      if (centerFilter && p.centerId !== centerFilter) return false
      if (roleFilter && p.roleId !== roleFilter) return false
      if (statusFilter && p.status !== statusFilter) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        p.roleLabel.toLowerCase().includes(q) ||
        p.centerName?.toLowerCase().includes(q) ||
        p.specialties?.join(' ').toLowerCase().includes(q)
      )
    })
  }, [centerFilter, professionals, roleFilter, search, statusFilter])

  const filteredApprovals = useMemo(() => {
    const q = search.trim().toLowerCase()
    return pendingApprovals.filter((a) => {
      if (centerFilter && a.requestedCenterId !== centerFilter) return false
      if (roleFilter && a.requestedRoleId !== roleFilter) return false
      if (!q) return true
      return (
        a.name.toLowerCase().includes(q) ||
        a.requestedRoleLabel.toLowerCase().includes(q) ||
        a.requestedCenterName.toLowerCase().includes(q)
      )
    })
  }, [centerFilter, pendingApprovals, roleFilter, search])

  async function saveProfessional(id: string) {
    const draft = assignmentDrafts[id]
    if (!draft) return
    setBusyKey(`pro:${id}`)
    setNotice(null)
    setError(null)
    try {
      const updated = await fetchJson<Professional>(`/api/xarxa/professionals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: draft.roleId || undefined, centerId: draft.centerId || undefined }),
      })
      setProfessionals((cur) => cur.map((p) => (p._id === id ? updated : p)))
      setNotice(`Actualizado: ${updated.name}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se ha podido actualizar el profesional.')
    } finally {
      setBusyKey(null)
    }
  }

  async function approveProfessional(requestId: string) {
    const draft = approvalDrafts[requestId]
    if (!draft) return
    setBusyKey(`approval:${requestId}`)
    setNotice(null)
    setError(null)
    try {
      const approved = await fetchJson<Professional>(
        `/api/xarxa/professionals/approvals/${requestId}/approve`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roleId: draft.roleId || undefined, centerId: draft.centerId || undefined }),
        }
      )
      setPendingApprovals((cur) => cur.filter((a) => a._id !== requestId))
      setProfessionals((cur) => [approved, ...cur])
      setAssignmentDrafts((cur) => ({ ...cur, [approved._id]: { roleId: approved.roleId ?? '', centerId: approved.centerId } }))
      setNotice(`Incorporado a la red: ${approved.name}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se ha podido aprobar el acceso.')
    } finally {
      setBusyKey(null)
    }
  }

  if (loading) {
    return <WorkspaceLoadingState title="Cargando red de profesionales…" detail="Preparando directorio, centros y solicitudes de acceso." />
  }
  if (error && professionals.length === 0 && centers.length === 0) {
    return <WorkspaceErrorState title="No se ha podido cargar el directorio." detail={error} onRetry={() => void loadDirectory()} />
  }

  const TABS: Array<{ id: Tab; label: string; count: number; color: string }> = [
    { id: 'profesionales', label: 'Directorio',  count: professionals.length,    color: BRAND_GREEN  },
    { id: 'pendientes',    label: 'Solicitudes',  count: pendingApprovals.length, color: '#f59e0b'    },
    { id: 'centros',       label: 'Centros',      count: centers.length,          color: BRAND_PURPLE },
    { id: 'roles',         label: 'Roles',        count: roles.length,            color: '#3b82f6'    },
  ]

  return (
    <div className="flex h-full flex-col">

      {/* ── page header ───────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-slate-200 bg-white">

        {/* title row */}
        <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `linear-gradient(135deg, ${BRAND_GREEN} 0%, ${BRAND_PURPLE} 100%)` }}>
              <Users2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Red de profesionales</h2>
              <p className="text-xs text-slate-500">Crohn PK/PD · Directorio, centros y gobierno de acceso</p>
            </div>
          </div>

          {/* KPI pills */}
          <div className="flex items-center gap-2">
            <KpiPill value={professionals.filter((p) => p.status === 'Activo').length} label="Activos" color={BRAND_GREEN} />
            <KpiPill value={centers.length} label="Centros" color={BRAND_PURPLE} />
            {pendingApprovals.length > 0 && (
              <KpiPill value={pendingApprovals.length} label="Pendientes" color="#f59e0b" />
            )}
          </div>
        </div>

        {/* filter bar */}
        <div className="flex flex-wrap items-center gap-2 px-6 pb-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar nombre, hospital, especialidad…"
              className="w-64 bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <select
            value={centerFilter}
            onChange={(e) => setCenterFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none"
          >
            <option value="">Todos los centros</option>
            {centers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none"
          >
            <option value="">Todos los roles</option>
            {roles.map((r) => <option key={r._id} value={r._id}>{r.label}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none"
          >
            <option value="">Todos los estados</option>
            <option value="Activo">Activo</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>

        {/* tabs */}
        <div className="flex gap-0 px-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
                tab === t.id ? 'border-current' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
              style={tab === t.id ? { color: t.color, borderColor: t.color } : {}}
            >
              {t.label}
              <span
                className="rounded px-1.5 py-0.5 text-[9px] font-bold text-white"
                style={{ backgroundColor: tab === t.id ? t.color : '#94a3b8' }}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* banners */}
        {notice && (
          <div className="mx-6 mb-3 flex items-center gap-2 rounded-lg border-l-4 border-emerald-500 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> {notice}
          </div>
        )}
        {error && (
          <div className="mx-6 mb-3 rounded-lg border-l-4 border-rose-500 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        )}
      </div>

      {/* ── content ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-slate-50 px-6 py-5">

        {/* ── Directorio ─────────────────────────────────────────────── */}
        {tab === 'profesionales' && (
          filteredProfessionals.length === 0
            ? <WorkspaceEmptyState title="No hay profesionales con estos filtros." detail="Amplía la búsqueda o quita algún filtro activo." />
            : <div className="grid gap-3 xl:grid-cols-2">
                {filteredProfessionals.map((p) => {
                  const draft = assignmentDrafts[p._id] ?? { roleId: p.roleId ?? '', centerId: p.centerId }
                  const isBusy = busyKey === `pro:${p._id}`
                  const initials = p.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
                  return (
                    <div
                      key={p._id}
                      className={`overflow-hidden rounded-xl border border-slate-200 bg-white border-l-4 ${roleColor(p.roleLabel)}`}
                    >
                      {/* card header */}
                      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                          style={{ backgroundColor: p.roleLabel.toLowerCase().includes('farmac') ? BRAND_GREEN : BRAND_PURPLE }}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="text-sm font-bold text-slate-900">{p.name}</p>
                            <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${STATUS_SOLID[p.status] ?? 'bg-slate-400 text-white'}`}>
                              {p.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-slate-500">{p.roleLabel}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{p.centerName}</span>
                            {p.availability && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{p.availability}</span>}
                          </div>
                        </div>
                        {/* metrics */}
                        <div className="flex shrink-0 gap-2">
                          <MiniMetric label="Activos" value={String(p.activeCases ?? 0)} color={BRAND_GREEN} />
                          <MiniMetric label="Cerrados" value={String(p.validatedCases ?? 0)} color={BRAND_PURPLE} />
                          {p.responseTimeLabel && <MiniMetric label="Respuesta" value={p.responseTimeLabel} color="#3b82f6" />}
                        </div>
                      </div>

                      {/* expertise tags */}
                      {(p.expertise ?? p.specialties ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-1 px-4 pb-3">
                          {(p.expertise ?? p.specialties ?? []).map((tag, i) => (
                            <span
                              key={tag}
                              className="rounded px-2 py-0.5 text-[10px] font-medium text-white"
                              style={{ backgroundColor: i % 2 === 0 ? BRAND_GREEN : BRAND_PURPLE, opacity: 0.85 }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* assignment controls */}
                      <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <select
                            value={draft.roleId}
                            onChange={(e) => setAssignmentDrafts((cur) => ({ ...cur, [p._id]: { ...draft, roleId: e.target.value } }))}
                            className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none"
                          >
                            {roles.map((r) => <option key={r._id} value={r._id}>{r.label}</option>)}
                          </select>
                          <select
                            value={draft.centerId}
                            onChange={(e) => setAssignmentDrafts((cur) => ({ ...cur, [p._id]: { ...draft, centerId: e.target.value } }))}
                            className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none"
                          >
                            {centers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                          </select>
                          <Button
                            size="sm"
                            className="shrink-0 rounded-lg text-xs text-white"
                            style={{ backgroundColor: BRAND_GREEN }}
                            disabled={isBusy}
                            onClick={() => void saveProfessional(p._id)}
                          >
                            {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Guardar'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
        )}

        {/* ── Solicitudes ────────────────────────────────────────────── */}
        {tab === 'pendientes' && (
          filteredApprovals.length === 0
            ? <WorkspaceEmptyState title="No hay solicitudes pendientes." detail="Las nuevas solicitudes de acceso aparecerán aquí." />
            : <div className="space-y-3">
                {filteredApprovals.map((item) => {
                  const draft = approvalDrafts[item._id] ?? { roleId: item.requestedRoleId, centerId: item.requestedCenterId }
                  const isBusy = busyKey === `approval:${item._id}`
                  return (
                    <div key={item._id} className="overflow-hidden rounded-xl border border-amber-200 bg-white border-l-4 border-l-amber-500">
                      <div className="flex items-start gap-4 px-5 py-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                          <ShieldCheck className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-bold text-slate-900">{item.name}</p>
                            <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-white">PENDIENTE</span>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {item.requestedRoleLabel} · {item.requestedCenterName} · Solicitado: {item.requestedDate}
                          </p>
                          <p className="mt-2 text-xs leading-relaxed text-slate-700">{item.requestReason}</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {item.specialties.map((s) => (
                              <span key={s} className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">{s}</span>
                            ))}
                          </div>
                        </div>
                        <div className="w-60 shrink-0 space-y-2">
                          <select
                            value={draft.roleId}
                            onChange={(e) => setApprovalDrafts((cur) => ({ ...cur, [item._id]: { ...draft, roleId: e.target.value } }))}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none"
                          >
                            {roles.map((r) => <option key={r._id} value={r._id}>{r.label}</option>)}
                          </select>
                          <select
                            value={draft.centerId}
                            onChange={(e) => setApprovalDrafts((cur) => ({ ...cur, [item._id]: { ...draft, centerId: e.target.value } }))}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none"
                          >
                            {centers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                          </select>
                          <Button
                            size="sm"
                            className="w-full rounded-lg text-xs text-white"
                            style={{ backgroundColor: BRAND_GREEN }}
                            disabled={isBusy}
                            onClick={() => void approveProfessional(item._id)}
                          >
                            {isBusy
                              ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                            Aprobar e incorporar
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
        )}

        {/* ── Centros ────────────────────────────────────────────────── */}
        {tab === 'centros' && (
          centers.length === 0
            ? <WorkspaceEmptyState title="No hay centros registrados." detail="Cuando la red tenga centros activos aparecerán aquí." />
            : <div className="grid gap-3 xl:grid-cols-2">
                {centers.map((center) => {
                  const centerPros = professionals.filter((p) => p.centerId === center._id)
                  const active = centerPros.filter((p) => p.status === 'Activo').length
                  return (
                    <div key={center._id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                      {/* colored header band */}
                      <div
                        className="flex items-center justify-between gap-4 px-5 py-4"
                        style={{ background: `linear-gradient(135deg, ${BRAND_GREEN}18 0%, ${BRAND_PURPLE}18 100%)` }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                            style={{ backgroundColor: BRAND_PURPLE }}
                          >
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{center.name}</p>
                            <div className="mt-0.5 flex items-center gap-2">
                              <span
                                className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${CENTER_TYPE_BADGE[center.type] ?? 'bg-slate-500 text-white'}`}
                              >
                                {center.type?.toUpperCase() ?? 'HOSPITAL'}
                              </span>
                              <span className="flex items-center gap-0.5 text-xs text-slate-500">
                                <MapPin className="h-3 w-3" />{center.city}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span
                          className={`rounded px-2 py-0.5 text-[9px] font-bold ${STATUS_SOLID[center.status] ?? 'bg-slate-400 text-white'}`}
                        >
                          {center.status?.toUpperCase()}
                        </span>
                      </div>

                      {/* stats row */}
                      <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100">
                        <StatCell label="Total" value={String(centerPros.length)} />
                        <StatCell label="Activos" value={String(active)} highlight={active > 0} color={BRAND_GREEN} />
                        <StatCell label="Programas" value={String((center.programs ?? []).length)} color={BRAND_PURPLE} />
                      </div>

                      {/* programs + professionals */}
                      <div className="px-5 py-3">
                        {(center.programs ?? []).length > 0 && (
                          <div className="mb-3 flex flex-wrap gap-1">
                            {center.programs.map((prog) => (
                              <span key={prog} className="rounded bg-[#8dc63f]/15 px-2 py-0.5 text-[10px] font-semibold text-[#5a7820]">
                                {prog}
                              </span>
                            ))}
                          </div>
                        )}
                        {centerPros.length > 0 && (
                          <div className="space-y-1.5">
                            {centerPros.slice(0, 4).map((p) => (
                              <div key={p._id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[9px] font-bold text-white"
                                    style={{ backgroundColor: p.roleLabel.toLowerCase().includes('farmac') ? BRAND_GREEN : BRAND_PURPLE }}
                                  >
                                    {p.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                                  </div>
                                  <span className="text-xs font-medium text-slate-700">{p.name}</span>
                                </div>
                                <span className="text-[10px] text-slate-500">{p.roleLabel}</span>
                              </div>
                            ))}
                            {centerPros.length > 4 && (
                              <p className="text-center text-[10px] text-slate-400">+{centerPros.length - 4} más</p>
                            )}
                          </div>
                        )}
                        {center.demoNote && (
                          <p className="mt-2 text-[11px] italic text-slate-400">{center.demoNote}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
        )}

        {/* ── Roles ──────────────────────────────────────────────────── */}
        {tab === 'roles' && (
          roles.length === 0
            ? <WorkspaceEmptyState title="No hay roles configurados." detail="Los perfiles de acceso y permisos aparecerán aquí." />
            : <div className="grid gap-3 xl:grid-cols-2">
                {roles.map((role, idx) => (
                  <div key={role._id} className="overflow-hidden rounded-xl border border-slate-200 bg-white border-l-4"
                    style={{ borderLeftColor: idx % 2 === 0 ? BRAND_GREEN : BRAND_PURPLE }}>
                    <div className="flex items-start justify-between gap-4 px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
                          style={{ backgroundColor: idx % 2 === 0 ? BRAND_GREEN : BRAND_PURPLE }}
                        >
                          <Stethoscope className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{role.label}</p>
                          <p className="text-xs text-slate-500">Ámbito: {role.scope}</p>
                        </div>
                      </div>
                      <span
                        className="rounded px-2 py-1 text-xs font-bold text-white"
                        style={{ backgroundColor: idx % 2 === 0 ? BRAND_GREEN : BRAND_PURPLE }}
                      >
                        {role.permissions.length} permisos
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 border-t border-slate-100 bg-slate-50 px-5 py-3">
                      {role.permissions.map((perm) => (
                        <span key={perm} className="flex items-center gap-1 rounded bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          <Activity className="h-2.5 w-2.5" style={{ color: idx % 2 === 0 ? BRAND_GREEN : BRAND_PURPLE }} />
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
        )}
      </div>
    </div>
  )
}

// ── helper components ─────────────────────────────────────────────────────────

function KpiPill({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5">
      <span className="text-base font-bold" style={{ color }}>{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  )
}

function MiniMetric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-center">
      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-sm font-bold" style={{ color }}>{value}</p>
    </div>
  )
}

function StatCell({ label, value, highlight, color }: { label: string; value: string; highlight?: boolean; color?: string }) {
  return (
    <div className="px-4 py-3 text-center">
      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-xl font-bold" style={highlight && color ? { color } : { color: '#334155' }}>{value}</p>
    </div>
  )
}
