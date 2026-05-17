'use client'

import {
  Activity,
  Building2,
  CheckCircle2,
  Clock,
  FolderOpen,
  Loader2,
  MapPin,
  Search,
  Settings2,
  ShieldCheck,
  Stethoscope,
  Users2,
  X,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import {
  WorkspaceEmptyState,
  WorkspaceErrorState,
  WorkspaceLoadingState,
} from '@/components/pkpd/pro/workspace-state'
import { PersonAvatar } from '@/components/pkpd/pro/person-avatar'
import { Button } from '@/components/ui/button'
import type {
  Center,
  Professional,
  ProfessionalApproval,
  Role,
} from '@/components/pkpd/pro/xarxa-types'
import { fetchJson } from '@/lib/fetch-json'

const BRAND_GREEN  = '#8dc63f'
const BRAND_PURPLE = '#7b3fa0'

const STATUS_SOLID: Record<string, string> = {
  Activo:    'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
  Inactivo:  'bg-slate-100 text-slate-500',
  Pendiente: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
}

const CENTER_TYPE_BADGE: Record<string, string> = {
  'Hospital Universitario': 'bg-purple-100 text-purple-700',
  'Hospital Comarcal':      'bg-blue-100 text-blue-700',
  'Hospital General':       'bg-indigo-100 text-indigo-700',
  'CAP':                    'bg-teal-100 text-teal-700',
  'Clínica':                'bg-cyan-100 text-cyan-700',
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
  const [selectedProId, setSelectedProId] = useState<string | null>(null)

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
        (p.centerName?.toLowerCase().includes(q) ?? false) ||
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
      setSelectedProId(null)
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

  const selectedPro = selectedProId ? professionals.find((p) => p._id === selectedProId) ?? null : null
  const selectedDraft = selectedProId ? (assignmentDrafts[selectedProId] ?? null) : null

  const TABS: Array<{ id: Tab; label: string; count: number }> = [
    { id: 'profesionales', label: 'Directorio',  count: professionals.length    },
    { id: 'pendientes',    label: 'Solicitudes',  count: pendingApprovals.length },
    { id: 'centros',       label: 'Centros',      count: centers.length          },
    { id: 'roles',         label: 'Roles',        count: roles.length            },
  ]

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main column */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Page header */}
        <div className="shrink-0 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#8dc63f] to-[#7b3fa0]">
                <Users2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Red de profesionales</h2>
                <p className="text-xs text-slate-500">Crohn PK/PD · Directorio, centros y gobierno de acceso</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <KpiPill value={professionals.filter((p) => p.status === 'Activo').length} label="Activos" color={BRAND_GREEN} />
              <KpiPill value={centers.length} label="Centros" color={BRAND_PURPLE} />
              {pendingApprovals.length > 0 && (
                <KpiPill value={pendingApprovals.length} label="Pendientes" color="#f59e0b" />
              )}
            </div>
          </div>

          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-2 px-6 pb-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar nombre, hospital, especialidad…"
                className="w-56 bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
                  <XCircle className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <select value={centerFilter} onChange={(e) => setCenterFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none">
              <option value="">Todos los centros</option>
              {centers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none">
              <option value="">Todos los roles</option>
              {roles.map((r) => <option key={r._id} value={r._id}>{r.label}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none">
              <option value="">Todos los estados</option>
              <option value="Activo">Activo</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 px-6">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
                  tab === t.id
                    ? 'border-[#7b3fa0] text-[#7b3fa0]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {t.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white ${tab === t.id ? 'bg-[#7b3fa0]' : 'bg-slate-300'}`}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          {/* Notices */}
          {notice && (
            <div className="mx-6 mb-3 flex items-center gap-2 rounded-xl border-l-4 border-emerald-500 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> {notice}
              <button className="ml-auto" onClick={() => setNotice(null)}><X className="h-3.5 w-3.5" /></button>
            </div>
          )}
          {error && (
            <div className="mx-6 mb-3 rounded-xl border-l-4 border-rose-500 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-[#f8f9fa] px-6 py-5">

          {/* ── Directorio ─────────────────────────────────────────────── */}
          {tab === 'profesionales' && (
            filteredProfessionals.length === 0
              ? <WorkspaceEmptyState title="No hay profesionales con estos filtros." detail="Amplía la búsqueda o quita algún filtro activo." />
              : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredProfessionals.map((p) => (
                    <button
                      key={p._id}
                      onClick={() => setSelectedProId(p._id === selectedProId ? null : p._id)}
                      className={`group text-left overflow-hidden rounded-2xl border bg-white transition hover:shadow-md ${
                        selectedProId === p._id ? 'border-[#7b3fa0]/40 ring-2 ring-[#7b3fa0]/20' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Card body */}
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <PersonAvatar name={p.name} avatarUrl={p.avatarUrl} size="lg" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-1">
                              <p className="text-sm font-semibold text-[#152520] leading-snug">{p.name}</p>
                              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${STATUS_SOLID[p.status] ?? 'bg-slate-100 text-slate-500'}`}>
                                {p.status}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-[#4a7068]">{p.roleLabel}</p>
                            <div className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-500">
                              <Building2 className="h-3 w-3 shrink-0" />
                              <span className="truncate">{p.centerName}</span>
                            </div>
                            {p.availability && (
                              <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                                <Clock className="h-3 w-3 shrink-0" />
                                {p.availability}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Activity metrics */}
                        <div className="mt-3 grid grid-cols-3 gap-1.5">
                          <ActivityTile label="Casos activos" value={p.activeCases ?? 0} color={BRAND_GREEN} />
                          <ActivityTile label="Cerrados" value={p.validatedCases ?? 0} color={BRAND_PURPLE} />
                          <ActivityTile label="Respuesta" value={p.responseTimeLabel ?? '—'} color="#64748b" isText />
                        </div>

                        {/* Specialty tags */}
                        {(p.expertise ?? p.specialties ?? []).length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {(p.expertise ?? p.specialties ?? []).slice(0, 3).map((tag) => (
                              <span key={tag} className="rounded-full bg-[#7b3fa0]/10 px-2 py-0.5 text-[10px] font-medium text-[#7b3fa0]">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Edit hint */}
                      <div className={`border-t px-4 py-2 flex items-center justify-between transition ${
                        selectedProId === p._id ? 'border-[#7b3fa0]/20 bg-[#faf6fd]' : 'border-slate-100 bg-slate-50 group-hover:bg-slate-100'
                      }`}>
                        <span className="text-[10px] text-slate-400">
                          {p.programs?.join(' · ') || 'Sin programa asignado'}
                        </span>
                        <Settings2 className={`h-3.5 w-3.5 transition ${
                          selectedProId === p._id ? 'text-[#7b3fa0]' : 'text-slate-300 group-hover:text-slate-500'
                        }`} />
                      </div>
                    </button>
                  ))}
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
                      <div key={item._id} className="overflow-hidden rounded-2xl border border-amber-200 bg-white">
                        <div className="flex items-start gap-4 px-5 py-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
                            <ShieldCheck className="h-6 w-6 text-amber-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-bold text-slate-900">{item.name}</p>
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">Pendiente</span>
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {item.requestedRoleLabel} · {item.requestedCenterName}
                              {item.requestedDate ? ` · Solicitado: ${item.requestedDate}` : ''}
                            </p>
                            <p className="mt-2 text-xs leading-relaxed text-slate-700">{item.requestReason}</p>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {item.specialties.map((s) => (
                                <span key={s} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{s}</span>
                              ))}
                            </div>
                          </div>
                          <div className="w-56 shrink-0 space-y-2">
                            <select value={draft.roleId}
                              onChange={(e) => setApprovalDrafts((cur) => ({ ...cur, [item._id]: { ...draft, roleId: e.target.value } }))}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none">
                              {roles.map((r) => <option key={r._id} value={r._id}>{r.label}</option>)}
                            </select>
                            <select value={draft.centerId}
                              onChange={(e) => setApprovalDrafts((cur) => ({ ...cur, [item._id]: { ...draft, centerId: e.target.value } }))}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none">
                              {centers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                            <Button size="sm" className="w-full rounded-xl bg-[#8dc63f] text-xs text-white hover:bg-[#7ab534]"
                              disabled={isBusy} onClick={() => void approveProfessional(item._id)}>
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
                      <div key={center._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <div className="flex items-center justify-between gap-4 px-5 py-4 bg-gradient-to-r from-[#8dc63f]/8 to-[#7b3fa0]/8">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7b3fa0] text-white">
                              <Building2 className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{center.name}</p>
                              <div className="mt-0.5 flex items-center gap-2">
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${CENTER_TYPE_BADGE[center.type] ?? 'bg-slate-100 text-slate-600'}`}>
                                  {center.type ?? 'Hospital'}
                                </span>
                                <span className="flex items-center gap-0.5 text-xs text-slate-500">
                                  <MapPin className="h-3 w-3" />{center.city}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100">
                          <StatCell label="Total" value={String(centerPros.length)} />
                          <StatCell label="Activos" value={String(active)} highlight={active > 0} color={BRAND_GREEN} />
                          <StatCell label="Programas" value={String((center.programs ?? []).length)} color={BRAND_PURPLE} />
                        </div>
                        {(center.programs ?? []).length > 0 && (
                          <div className="flex flex-wrap gap-1 border-t border-slate-100 px-5 py-3">
                            {center.programs.map((prog) => (
                              <span key={prog} className="rounded-full bg-[#7b3fa0]/10 px-2 py-0.5 text-[10px] font-semibold text-[#7b3fa0]">
                                {prog}
                              </span>
                            ))}
                          </div>
                        )}
                        {centerPros.length > 0 && (
                          <div className="space-y-1.5 px-5 pb-4">
                            {centerPros.slice(0, 4).map((p) => (
                              <div key={p._id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <PersonAvatar name={p.name} avatarUrl={p.avatarUrl} size="xs" />
                                  <span className="text-xs font-medium text-slate-700">{p.name}</span>
                                </div>
                                <span className="text-[10px] text-slate-400">{p.roleLabel}</span>
                              </div>
                            ))}
                            {centerPros.length > 4 && (
                              <p className="text-center text-[10px] text-slate-400">+{centerPros.length - 4} más</p>
                            )}
                          </div>
                        )}
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
                    <div key={role._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <div className="flex items-start justify-between gap-4 px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
                            style={{ backgroundColor: idx % 2 === 0 ? BRAND_GREEN : BRAND_PURPLE }}>
                            <Stethoscope className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{role.label}</p>
                            <p className="text-xs text-slate-500">Ámbito: {role.scope}</p>
                          </div>
                        </div>
                        <span className="rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                          style={{ backgroundColor: idx % 2 === 0 ? BRAND_GREEN : BRAND_PURPLE }}>
                          {role.permissions.length} permisos
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 border-t border-slate-100 bg-slate-50 px-5 py-3">
                        {role.permissions.map((perm) => (
                          <span key={perm} className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600">
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

      {/* ── Edit panel (right drawer) ───────────────────────────────── */}
      {selectedPro && selectedDraft && (
        <div className="w-[320px] shrink-0 border-l border-slate-200 bg-white flex flex-col overflow-hidden">
          {/* Panel header */}
          <div className="shrink-0 flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <p className="text-sm font-semibold text-[#152520]">Perfil y acceso</p>
            <button onClick={() => setSelectedProId(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
            {/* Profile card */}
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-[#faf6fd] px-4 py-5 text-center">
              <PersonAvatar name={selectedPro.name} avatarUrl={selectedPro.avatarUrl} size="xl" />
              <div>
                <p className="text-base font-semibold text-[#152520]">{selectedPro.name}</p>
                <p className="text-sm text-[#7b3fa0]">{selectedPro.roleLabel}</p>
                <span className={`mt-1.5 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${STATUS_SOLID[selectedPro.status] ?? 'bg-slate-100 text-slate-500'}`}>
                  {selectedPro.status}
                </span>
              </div>
            </div>

            {/* Activity metrics */}
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4a7068]">Actividad en la red</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center">
                  <FolderOpen className="mx-auto mb-1 h-4 w-4 text-[#8dc63f]" />
                  <p className="text-xl font-bold text-[#152520]">{selectedPro.activeCases ?? 0}</p>
                  <p className="text-[10px] text-slate-500">Casos activos</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center">
                  <CheckCircle2 className="mx-auto mb-1 h-4 w-4 text-[#7b3fa0]" />
                  <p className="text-xl font-bold text-[#152520]">{selectedPro.validatedCases ?? 0}</p>
                  <p className="text-[10px] text-slate-500">Cerrados</p>
                </div>
              </div>
              {selectedPro.responseTimeLabel && (
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs font-semibold text-[#152520]">{selectedPro.responseTimeLabel}</p>
                    <p className="text-[10px] text-slate-400">Tiempo de respuesta</p>
                  </div>
                </div>
              )}
            </div>

            {/* Hospital */}
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4a7068]">Centro</p>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                <p className="text-xs font-medium text-[#152520]">{selectedPro.centerName}</p>
              </div>
            </div>

            {/* Specialties */}
            {(selectedPro.expertise ?? selectedPro.specialties ?? []).length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4a7068]">Especialidades</p>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedPro.expertise ?? selectedPro.specialties ?? []).map((tag) => (
                    <span key={tag} className="rounded-full bg-[#7b3fa0]/10 px-2.5 py-1 text-[10px] font-medium text-[#7b3fa0]">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Edit controls */}
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4a7068]">Editar asignación</p>
              <div className="space-y-2">
                <div>
                  <p className="mb-1 text-[10px] text-slate-500">Rol</p>
                  <select value={selectedDraft.roleId}
                    onChange={(e) => setAssignmentDrafts((cur) => ({ ...cur, [selectedPro._id]: { ...selectedDraft, roleId: e.target.value } }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#7b3fa0]/40 focus:ring-2 focus:ring-[#7b3fa0]/15">
                    {roles.map((r) => <option key={r._id} value={r._id}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <p className="mb-1 text-[10px] text-slate-500">Centro</p>
                  <select value={selectedDraft.centerId}
                    onChange={(e) => setAssignmentDrafts((cur) => ({ ...cur, [selectedPro._id]: { ...selectedDraft, centerId: e.target.value } }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#7b3fa0]/40 focus:ring-2 focus:ring-[#7b3fa0]/15">
                    {centers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Save footer */}
          <div className="shrink-0 border-t border-slate-100 px-5 py-4">
            <Button
              className="w-full rounded-xl bg-[#7b3fa0] text-sm text-white hover:bg-[#6a3490]"
              disabled={busyKey === `pro:${selectedPro._id}`}
              onClick={() => void saveProfessional(selectedPro._id)}
            >
              {busyKey === `pro:${selectedPro._id}`
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Guardar cambios
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── helpers ───────────────────────────────────────────────────────────────────

function ActivityTile({ label, value, color, isText }: { label: string; value: number | string; color: string; isText?: boolean }) {
  return (
    <div className="rounded-xl bg-slate-50 px-2 py-2 text-center">
      <p className={`${isText ? 'text-xs' : 'text-base'} font-bold`} style={{ color }}>
        {isText ? value : String(value)}
      </p>
      <p className="text-[9px] text-slate-400 leading-tight mt-0.5">{label}</p>
    </div>
  )
}

function KpiPill({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5">
      <span className="text-base font-bold" style={{ color }}>{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
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
