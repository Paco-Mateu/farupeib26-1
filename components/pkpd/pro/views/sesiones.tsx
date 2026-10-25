'use client'

import { Bot, Calendar, ChevronRight, ClipboardEdit, Clock, FlaskConical, Loader2, Mic, Monitor, Save, Sparkles, Users, Video, VideoOff, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  WorkspaceEmptyState,
  WorkspaceErrorState,
  WorkspaceLoadingState,
} from '@/components/pkpd/pro/workspace-state'
import { fetchJson } from '@/lib/fetch-json'

const DEMO_ACTOR = {
  name: 'Farmacéutico referente',
  role: 'Farmacéutico experto',
  center: 'H.U. Bellvitge',
  type: 'human',
}

type SessionCase = {
  caseId: string
  title: string
  centerName: string
  priority: string
  pipelineStage: string
}

type SessionConsensus = {
  decision: string
  dose?: string | null
  interval?: string | null
  nextControl?: string | null
  notes?: string | null
  agreedBy?: string
  agreedAt?: string
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
  minutesEditedBy?: string | null
  minutesEditedAt?: string | null
  consensus?: Record<string, SessionConsensus>
  proposalReason?: string
  inviteDraft?: string
  agendaHighlights?: string[]
  automationSource?: string
  automationUpdatedAt?: string | null
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

function LlmExecutionRail({
  title,
  steps,
}: {
  title: string
  steps: string[]
}) {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    setActiveStep(0)
    const timer = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % steps.length)
    }, 900)
    return () => window.clearInterval(timer)
  }, [steps])

  return (
    <div className="rounded-xl border border-[#7b3fa0]/20 bg-[#faf6fd] p-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#7b3fa0]/10">
          <Bot className="h-4 w-4 text-[#7b3fa0]" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7b3fa0]">Agentes en ejecución</p>
          <p className="text-sm font-semibold text-[#152520]">{title}</p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {steps.map((step, index) => {
          const isDone = index < activeStep
          const isRunning = index === activeStep
          return (
            <div
              key={step}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition ${
                isRunning
                  ? 'border-[#7b3fa0]/20 bg-white text-[#7b3fa0]'
                  : isDone
                    ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                    : 'border-slate-100 bg-slate-50 text-slate-400'
              }`}
            >
              {isDone ? (
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
              ) : isRunning ? (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
              ) : (
                <div className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-slate-200" />
              )}
              <span className={isRunning ? 'font-semibold' : ''}>{step}</span>
            </div>
          )
        })}
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
  const [notice, setNotice] = useState<string | null>(null)
  const [focusSessionId, setFocusSessionId] = useState<string | null>(null)
  const [minutesDrafts, setMinutesDrafts] = useState<Record<string, string>>({})
  const [consensusDrafts, setConsensusDrafts] = useState<Record<string, { decision: string; dose: string; interval: string; nextControl: string; notes: string }>>({})

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
    setNotice(null)
    try {
      await fetchJson<SessionItem>('/api/xarxa/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      await loadSessions()
      setNotice('Sesión manual creada.')
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'No se ha podido crear la sesión.')
    } finally {
      setBusyKey(null)
    }
  }

  async function proposeSession() {
    setBusyKey('propose')
    setError(null)
    setNotice(null)
    try {
      const [session] = await Promise.all([
        fetchJson<SessionItem>('/api/xarxa/sessions/propose', { method: 'POST' }),
        new Promise((resolve) => window.setTimeout(resolve, 1500)),
      ])
      await loadSessions()
      setFocusSessionId(session.sessionId)
      setNotice('Los Agentes han propuesto una nueva sesión de red con agenda inicial y justificación clínica.')
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'No se ha podido proponer la sesión.')
    } finally {
      setBusyKey(null)
    }
  }

  async function generateInvite(sessionId: string) {
    setBusyKey(`invite:${sessionId}`)
    setError(null)
    setNotice(null)
    try {
      const [session] = await Promise.all([
        fetchJson<SessionItem>(`/api/xarxa/sessions/${encodeURIComponent(sessionId)}/invite`, { method: 'POST' }),
        new Promise((resolve) => window.setTimeout(resolve, 1300)),
      ])
      await loadSessions()
      setFocusSessionId(session.sessionId)
      setNotice('Los Agentes han preparado el borrador de invitación para la sesión.')
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'No se ha podido preparar la invitación.')
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

  function consensusKey(sessionId: string, caseId: string) {
    return `${sessionId}:${caseId}`
  }

  function consensusDraftFor(sessionId: string, caseId: string) {
    const key = consensusKey(sessionId, caseId)
    return (
      consensusDrafts[key] ?? {
        decision: '',
        dose: '',
        interval: '',
        nextControl: '',
        notes: '',
      }
    )
  }

  function setConsensusDraft(sessionId: string, caseId: string, field: string, value: string) {
    const key = consensusKey(sessionId, caseId)
    setConsensusDrafts((current) => ({
      ...current,
      [key]: { ...consensusDraftFor(sessionId, caseId), [field]: value },
    }))
  }

  async function saveConsensus(sessionId: string, caseId: string) {
    setBusyKey(`consensus:${sessionId}:${caseId}`)
    setError(null)
    setNotice(null)
    try {
      const draft = consensusDraftFor(sessionId, caseId)
      await fetchJson<SessionItem>(
        `/api/xarxa/sessions/${encodeURIComponent(sessionId)}/consensus/${encodeURIComponent(caseId)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...DEMO_ACTOR, ...draft, decision: draft.decision || 'Consenso alcanzado' }),
        }
      )
      await loadSessions()
      setNotice(`Consenso registrado para ${caseId} y notificado en el expediente del caso.`)
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'No se ha podido registrar el consenso.')
    } finally {
      setBusyKey(null)
    }
  }

  async function generateMinutes(sessionId: string) {
    setBusyKey(`acta:${sessionId}`)
    setError(null)
    setNotice(null)
    try {
      const session = await fetchJson<SessionItem>(
        `/api/xarxa/sessions/${encodeURIComponent(sessionId)}/minutes/generate`,
        { method: 'POST' }
      )
      await loadSessions()
      setMinutesDrafts((current) => ({ ...current, [sessionId]: session.minutes ?? '' }))
      setFocusSessionId(sessionId)
      setNotice('Borrador de acta generado a partir de la agenda y los consensos. Requiere revisión humana.')
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'No se ha podido generar el acta.')
    } finally {
      setBusyKey(null)
    }
  }

  async function saveMinutes(sessionId: string) {
    setBusyKey(`minutes:${sessionId}`)
    setError(null)
    setNotice(null)
    try {
      const minutes = minutesDrafts[sessionId] ?? ''
      await fetchJson<SessionItem>(
        `/api/xarxa/sessions/${encodeURIComponent(sessionId)}/minutes`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...DEMO_ACTOR, minutes }),
        }
      )
      await loadSessions()
      setNotice('Acta validada y registrada por el profesional.')
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'No se ha podido guardar el acta.')
    } finally {
      setBusyKey(null)
    }
  }

  const activeLlmRail = useMemo(() => {
    if (busyKey === 'propose') {
      return {
        title: 'Propuesta quincenal de sesión de red',
        steps: [
          'Analizando casos con valor clínico y docente',
          'Priorizando centros y patrones a discutir',
          'Proponiendo fecha y agenda inicial',
          'Preparando la sesión para revisión humana',
        ],
      }
    }
    if (busyKey?.startsWith('invite:')) {
      return {
        title: 'Preparación de invitación y agenda',
        steps: [
          'Leyendo agenda propuesta',
          'Consolidando participantes y centros',
          'Redactando invitación de red',
          'Dejando borrador listo para validar',
        ],
      }
    }
    return null
  }, [busyKey])

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
        actionLabel="Proponer sesión con Agentes"
        onAction={() => void proposeSession()}
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
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 rounded-xl text-xs"
              onClick={() => void createSession()}
              disabled={busyKey === 'create' || !!busyKey}
            >
              {busyKey === 'create' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Video className="h-3.5 w-3.5" />
              )}
              Nueva sesión manual
            </Button>
            <Button
              size="sm"
              className="gap-1.5 rounded-xl bg-[#7b3fa0] text-xs text-white hover:bg-[#6a3490]"
              onClick={() => void proposeSession()}
              disabled={!!busyKey}
            >
              {busyKey === 'propose' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Bot className="h-3.5 w-3.5" />
              )}
              Proponer sesión con Agentes
            </Button>
          </div>
        </div>
        {activeLlmRail ? (
          <div className="mt-4">
            <LlmExecutionRail title={activeLlmRail.title} steps={activeLlmRail.steps} />
          </div>
        ) : null}
        {notice ? (
          <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            {notice}
          </div>
        ) : null}
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
                className={`overflow-hidden rounded-xl border bg-white shadow-sm transition hover:shadow ${
                  focusSessionId === session.sessionId
                    ? 'border-[#7b3fa0]/30 ring-2 ring-[#7b3fa0]/10'
                    : 'border-slate-100'
                }`}
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
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 rounded-xl text-xs"
                          onClick={() => void generateInvite(session.sessionId)}
                          disabled={!!busyKey}
                        >
                          {busyKey === `invite:${session.sessionId}` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Bot className="h-3.5 w-3.5" />
                          )}
                          Invitación con Agentes
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

                {busyKey === `invite:${session.sessionId}` ? (
                  <div className="border-t border-slate-100 px-5 py-4">
                    <LlmExecutionRail
                      title="Agentes redactando invitación y agenda"
                      steps={[
                        'Revisando casos incluidos',
                        'Agrupando participantes de la red',
                        'Redactando el mensaje de invitación',
                        'Dejando borrador listo para validar',
                      ]}
                    />
                  </div>
                ) : null}

                {session.proposalReason ? (
                  <div className="border-t border-slate-100 px-5 py-4">
                    <div className="rounded-xl border border-[#7b3fa0]/15 bg-[#faf6fd] px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-[#7b3fa0]" />
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7b3fa0]">
                          Propuesta de Agentes
                        </p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[#152520]">{session.proposalReason}</p>
                      {(session.agendaHighlights ?? []).length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(session.agendaHighlights ?? []).map((highlight) => (
                            <span key={highlight} className="rounded-full border border-white bg-white px-2.5 py-1 text-[10px] text-[#4a7068] shadow-sm">
                              {highlight}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}

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
                      {(session.cases ?? []).map((caso) => {
                        const savedConsensus = session.consensus?.[caso.caseId]
                        const draft = consensusDraftFor(session.sessionId, caso.caseId)
                        const consensusBusy = busyKey === `consensus:${session.sessionId}:${caso.caseId}`
                        return (
                          <div
                            key={caso.caseId}
                            className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-[#152520]">{caso.caseId}</p>
                                <p className="truncate text-xs text-[#4a7068]">{caso.title}</p>
                                <p className="text-[10px] text-[#4a7068]">
                                  {caso.centerName} · {caso.pipelineStage}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-1.5">
                                {onOpenCaso ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-xl text-xs"
                                    onClick={() => onOpenCaso(caso.caseId)}
                                  >
                                    Abrir caso
                                  </Button>
                                ) : null}
                              </div>
                            </div>

                            {savedConsensus ? (
                              <div className="mt-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
                                <span className="font-semibold">Consenso:</span> {savedConsensus.decision}
                                {savedConsensus.dose ? ` · Pauta: ${savedConsensus.dose}` : ''}
                                {savedConsensus.interval ? ` · Intervalo: ${savedConsensus.interval}` : ''}
                                {savedConsensus.nextControl ? ` · Próximo control: ${savedConsensus.nextControl}` : ''}
                                {savedConsensus.agreedBy ? ` — ${savedConsensus.agreedBy}` : ''}
                              </div>
                            ) : session.status !== 'done' ? (
                              <div className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#4a7068]">
                                  Registrar consenso de la comisión (UC-05)
                                </p>
                                <div className="grid gap-2 md:grid-cols-2">
                                  <input
                                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-[#7b3fa0]"
                                    placeholder="Decisión (p. ej. Intensificar a q5 semanas)"
                                    value={draft.decision}
                                    onChange={(event) => setConsensusDraft(session.sessionId, caso.caseId, 'decision', event.target.value)}
                                  />
                                  <input
                                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-[#7b3fa0]"
                                    placeholder="Pauta (p. ej. 90 mg)"
                                    value={draft.dose}
                                    onChange={(event) => setConsensusDraft(session.sessionId, caso.caseId, 'dose', event.target.value)}
                                  />
                                  <input
                                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-[#7b3fa0]"
                                    placeholder="Intervalo (p. ej. cada 5 semanas)"
                                    value={draft.interval}
                                    onChange={(event) => setConsensusDraft(session.sessionId, caso.caseId, 'interval', event.target.value)}
                                  />
                                  <input
                                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-[#7b3fa0]"
                                    placeholder="Próximo control"
                                    value={draft.nextControl}
                                    onChange={(event) => setConsensusDraft(session.sessionId, caso.caseId, 'nextControl', event.target.value)}
                                  />
                                </div>
                                <div className="mt-2 flex items-center justify-between gap-2">
                                  <input
                                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-[#7b3fa0]"
                                    placeholder="Notas del debate (opcional)"
                                    value={draft.notes}
                                    onChange={(event) => setConsensusDraft(session.sessionId, caso.caseId, 'notes', event.target.value)}
                                  />
                                  <Button
                                    size="sm"
                                    className="ml-2 shrink-0 rounded-xl bg-[#7b3fa0] text-xs text-white hover:bg-[#6a3490]"
                                    onClick={() => void saveConsensus(session.sessionId, caso.caseId)}
                                    disabled={!!busyKey || !draft.decision.trim()}
                                  >
                                    {consensusBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ClipboardEdit className="h-3.5 w-3.5" />}
                                    Registrar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-2 rounded-lg bg-slate-100 px-3 py-2 text-[11px] text-slate-500">
                                Sin consenso registrado en el acta.
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {session.inviteDraft ? (
                  <div className="border-t border-slate-100 px-5 py-4">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ChevronRight className="h-4 w-4 text-[#7b3fa0]" />
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#4a7068]">
                          Invitación preparada por Agentes
                        </p>
                      </div>
                      <pre className="mt-2 whitespace-pre-wrap font-sans text-xs leading-6 text-[#152520]">
                        {session.inviteDraft}
                      </pre>
                    </div>
                  </div>
                ) : null}

                {/* Acta: draft with agents, editable by humans */}
                {session.status !== 'scheduled' && (
                  <div className="border-t border-slate-100 px-5 pb-4 pt-3">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#4a7068]">
                        Acta de la sesión {session.minutesEditedBy ? '· validada por humanos' : session.minutes ? '· borrador pendiente de validación' : ''}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl text-xs"
                          onClick={() => void generateMinutes(session.sessionId)}
                          disabled={!!busyKey}
                        >
                          {busyKey === `acta:${session.sessionId}` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Bot className="h-3.5 w-3.5" />
                          )}
                          Borrador con Agentes
                        </Button>
                        <Button
                          size="sm"
                          className="rounded-xl bg-[#7b3fa0] text-xs text-white hover:bg-[#6a3490]"
                          onClick={() => void saveMinutes(session.sessionId)}
                          disabled={!!busyKey || !(minutesDrafts[session.sessionId] ?? session.minutes ?? '').trim()}
                        >
                          {busyKey === `minutes:${session.sessionId}` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Save className="h-3.5 w-3.5" />
                          )}
                          Validar acta
                        </Button>
                      </div>
                    </div>
                    <textarea
                      className="min-h-[180px] w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 font-mono text-xs leading-6 text-[#152520] outline-none transition focus:border-[#7b3fa0]"
                      placeholder="El acta se generará a partir de la agenda y los consensos registrados. También puede redactarse a mano."
                      value={minutesDrafts[session.sessionId] ?? session.minutes ?? ''}
                      onChange={(event) =>
                        setMinutesDrafts((current) => ({ ...current, [session.sessionId]: event.target.value }))
                      }
                    />
                    {session.minutesEditedBy ? (
                      <p className="mt-1.5 text-[10px] text-[#4a7068]">
                        Acta editada por {session.minutesEditedBy}
                        {session.minutesEditedAt ? ` · ${new Date(session.minutesEditedAt).toLocaleString('es-ES')}` : ''}
                      </p>
                    ) : null}
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
