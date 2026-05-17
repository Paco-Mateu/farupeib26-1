'use client'

import { Calendar, Clock, FlaskConical, Info, Loader2, Mic, Monitor, Users, Video, VideoOff, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  WorkspaceEmptyState,
  WorkspaceErrorState,
  WorkspaceLoadingState,
} from '@/components/pkpd/pro/workspace-state'
import { fetchJson } from '@/lib/fetch-json'

type SessionCase = {
  caseId: string
  title: string
  centerName: string
  priority: string
  pipelineStage: string
}

type SessionItem = {
  sessionId: string
  title: string
  date: string
  duration: string
  participants: string[]
  casesCount: number
  status: 'scheduled' | 'live' | 'done'
  caseIds?: string[]
  cases?: SessionCase[]
  minutes?: string
}

type SessionsResponse = {
  items: SessionItem[]
  total: number
}

const STATUS_META: Record<
  SessionItem['status'],
  { dot: string; pill: string; label: string; border: string }
> = {
  live: {
    dot: 'bg-emerald-500',
    pill: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300',
    label: 'En directo',
    border: '#8dc63f',
  },
  scheduled: {
    dot: 'bg-[#7b3fa0]',
    pill: 'bg-purple-50 text-purple-700',
    label: 'Programada',
    border: '#7b3fa0',
  },
  done: {
    dot: 'bg-slate-400',
    pill: 'bg-slate-100 text-slate-500',
    label: 'Completada',
    border: '#cbd5e1',
  },
}

const TILE_COLORS = ['#8dc63f', '#7b3fa0', '#3b82f6', '#f59e0b']

function tileInitials(name: string): string {
  const words = name.split(' ').filter((w) => /^[A-ZÁÉÍÓÚ]/i.test(w))
  return words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

function MockVideoGrid({ participants }: { participants: string[] }) {
  const tiles = [...participants.slice(0, 4)]
  while (tiles.length < 2) tiles.push('Moderador')

  return (
    <div className="relative overflow-hidden rounded-xl bg-slate-900" style={{ aspectRatio: '16/7' }}>
      <div className="grid h-full grid-cols-2 gap-1 p-1">
        {tiles.slice(0, 4).map((name, i) => (
          <div
            key={i}
            className="flex items-center justify-center rounded-lg"
            style={{ backgroundColor: TILE_COLORS[i % TILE_COLORS.length] + '18' }}
          >
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shadow"
                style={{ backgroundColor: TILE_COLORS[i % TILE_COLORS.length] }}
              >
                {tileInitials(name)}
              </div>
              <span className="max-w-[100px] truncate text-center text-[9px] text-slate-400">{name}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Not-started overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px]">
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-slate-800/70 px-6 py-5 text-center shadow-xl">
          <VideoOff className="h-7 w-7 text-slate-400" />
          <p className="text-sm font-medium text-slate-200">Sesión no iniciada</p>
        </div>
      </div>

      {/* Controls bar */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 bg-slate-900/60 px-4 py-2.5">
        {[Mic, Video, Monitor].map((Icon, i) => (
          <button key={i} className="rounded-full bg-slate-700 p-1.5 opacity-60 hover:opacity-100 transition">
            <Icon className="h-3.5 w-3.5 text-slate-300" />
          </button>
        ))}
        <button className="rounded-full bg-red-700/70 p-1.5 hover:bg-red-700 transition">
          <X className="h-3.5 w-3.5 text-white" />
        </button>
      </div>
    </div>
  )
}

type SesionesProps = {
  onOpenCaso?: (caseId: string) => void
}

export function Sesiones({ onOpenCaso }: SesionesProps) {
  const [items, setItems] = useState<SessionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyKey, setBusyKey] = useState<string | null>(null)

  async function loadSessions() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetchJson<SessionsResponse>('/api/xarxa/sessions')
      setItems(response.items ?? [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se han podido cargar las sesiones.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSessions()
  }, [])

  async function createSession() {
    setBusyKey('create')
    try {
      await fetchJson<SessionItem>('/api/xarxa/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      await loadSessions()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'No se ha podido crear la sesión.')
    } finally {
      setBusyKey(null)
    }
  }

  async function updateSessionStatus(sessionId: string, target: 'live' | 'done') {
    setBusyKey(`${target}:${sessionId}`)
    try {
      const match = items.find((item) => item.sessionId === sessionId)
      if (!match) return
      const endpoint = target === 'live' ? 'start' : 'complete'
      await fetchJson<SessionItem>(
        `/api/xarxa/sessions/${encodeURIComponent(match.sessionId)}/${endpoint}`,
        { method: 'POST' }
      )
      await loadSessions()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'No se ha podido actualizar la sesión.')
    } finally {
      setBusyKey(null)
    }
  }

  if (loading && items.length === 0) {
    return (
      <WorkspaceLoadingState
        title="Cargando sesiones de red…"
        detail="Recuperando agenda colaborativa y casos preparados para discusión."
      />
    )
  }

  if (error && items.length === 0) {
    return (
      <WorkspaceErrorState
        title="No se han podido cargar las sesiones de red."
        detail={error}
        onRetry={() => void loadSessions()}
      />
    )
  }

  if (items.length === 0) {
    return (
      <WorkspaceEmptyState
        title="No hay sesiones de red preparadas."
        detail="Cuando los casos se escalen para discusión colaborativa aparecerán aquí."
        actionLabel="Crear sesión"
        onAction={() => void createSession()}
      />
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Page header */}
      <div className="shrink-0 border-b border-slate-100 bg-white px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-[#152520]">Sesiones de red</h2>
            </div>
            <p className="text-xs text-[#4a7068]">
              Agenda colaborativa para casos con incertidumbre clínica o pendientes de discusión compartida.
            </p>
          </div>
          <Button
            size="sm"
            className="gap-1.5 rounded-xl bg-[#7b3fa0] text-xs text-white hover:bg-[#6a3490]"
            onClick={() => void createSession()}
            disabled={busyKey === 'create'}
          >
            {busyKey === 'create' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Video className="h-3.5 w-3.5" />
            )}
            Nueva sesión
          </Button>
        </div>
        {error ? (
          <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        ) : null}
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="space-y-4">
          {items.map((session) => {
            const meta = STATUS_META[session.status]
            const isLive = session.status === 'live'
            const isScheduled = session.status === 'scheduled'

            return (
              <div
                key={session.sessionId}
                className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition hover:shadow"
                style={{ borderLeftColor: meta.border, borderLeftWidth: 4 }}
              >
                {/* Card header */}
                <div className="px-5 pt-4 pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      {/* Status + count pills */}
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${meta.pill}`}>
                          {isLive ? (
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            </span>
                          ) : (
                            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                          )}
                          {meta.label}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                          {session.casesCount} caso{session.casesCount !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Title */}
                      <p className="text-sm font-semibold text-[#152520]">{session.title}</p>

                      {/* Metadata row */}
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-[#4a7068]">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(session.date).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(session.date).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          · {session.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {session.participants.length} centro{session.participants.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Participants */}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {session.participants.map((p) => (
                          <span
                            key={p}
                            className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      {isScheduled && (
                        <Button
                          size="sm"
                          className="gap-1.5 rounded-xl bg-[#7b3fa0] text-xs text-white hover:bg-[#6a3490]"
                          onClick={() => void updateSessionStatus(session.sessionId, 'live')}
                          disabled={!!busyKey}
                        >
                          {busyKey === `live:${session.sessionId}` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Video className="h-3.5 w-3.5" />
                          )}
                          Iniciar sesión
                        </Button>
                      )}
                      {isScheduled && (
                        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px] text-slate-400">
                          <VideoOff className="h-3 w-3" />
                          Sala no iniciada
                        </div>
                      )}
                      {isLive && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 rounded-xl text-xs"
                            onClick={() => void updateSessionStatus(session.sessionId, 'done')}
                            disabled={!!busyKey}
                          >
                            {busyKey === `done:${session.sessionId}` ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : null}
                            Cerrar sesión
                          </Button>
                          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px] text-slate-400">
                            <Video className="h-3 w-3" />
                            Sala activa
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Live session: mock video grid */}
                {isLive && (
                  <div className="border-t border-slate-100 px-5 pb-4 pt-3">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#4a7068]">
                      Sala de videoconferencia
                    </p>
                    <MockVideoGrid participants={session.participants} />
                  </div>
                )}

                {/* Cases in agenda */}
                {(session.cases ?? []).length > 0 && (
                  <div className="border-t border-slate-100 px-5 pb-4 pt-3">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#4a7068]">
                      Casos en agenda
                    </p>
                    <div className="space-y-2">
                      {(session.cases ?? []).map((caso) => (
                        <div
                          key={caso.caseId}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#152520]">{caso.caseId}</p>
                            <p className="truncate text-xs text-[#4a7068]">{caso.title}</p>
                            <p className="text-[10px] text-[#4a7068]">
                              {caso.centerName} · {caso.pipelineStage}
                            </p>
                          </div>
                          {onOpenCaso ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="shrink-0 rounded-xl text-xs"
                              onClick={() => onOpenCaso(caso.caseId)}
                            >
                              Abrir caso
                            </Button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Done session: minutes */}
                {session.status === 'done' && session.minutes && (
                  <div className="border-t border-slate-100 px-5 pb-4 pt-3">
                    <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4a7068]" />
                      <p className="text-xs text-[#4a7068]">{session.minutes}</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
