'use client'

import { Bot, Calendar, ChevronRight, ClipboardEdit, Clock, FlaskConical, Loader2, Mic, Monitor, Plus, Save, Sparkles, Users, Video, VideoOff, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { useXarxaT } from '@/components/i18n/use-xarxa-strings'
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
    label: 'status.live',
    border: '#8dc63f',
  },
  scheduled: {
    dot: 'bg-[#7b3fa0]',
    pill: 'bg-purple-50 text-purple-700',
    label: 'status.scheduled',
    border: '#7b3fa0',
  },
  done: {
    dot: 'bg-slate-400',
    pill: 'bg-slate-100 text-slate-500',
    label: 'status.done',
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
  const t = useXarxaT('sesiones')
  const tiles = [...participants.slice(0, 4)]
  while (tiles.length < 2) tiles.push(t('mock.moderador'))

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
          <p className="text-sm font-medium text-slate-200">{t('mock.sesion.no.iniciada')}</p>
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
  const t = useXarxaT('sesiones')
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
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7b3fa0]">{t('rail.agentes.ejecucion')}</p>
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
  const t = useXarxaT('sesiones')
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
      setError(loadError instanceof Error ? loadError.message : t('error.cargar.sesiones'))
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
      setNotice(t('notice.sesion.creada'))
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : t('error.crear.sesion'))
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
      setNotice(t('notice.sesion.propuesta'))
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : t('error.proponer.sesion'))
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
      setNotice(t('notice.invitacion.preparada'))
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : t('error.preparar.invitacion'))
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
      setError(actionError instanceof Error ? actionError.message : t('error.actualizar.sesion'))
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
      setNotice(t('notice.consenso.registrado').replaceAll('{caseId}', caseId))
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : t('error.registrar.consenso'))
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
      setNotice(t('notice.acta.borrador'))
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : t('error.generar.acta'))
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
      setNotice(t('notice.acta.validada'))
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : t('error.guardar.acta'))
    } finally {
      setBusyKey(null)
    }
  }

  const activeLlmRail = useMemo(() => {
    if (busyKey === 'propose') {
      return {
        title: 'rail.propuesta.title',
        steps: [
          'rail.propuesta.step1',
          'rail.propuesta.step2',
          'rail.propuesta.step3',
          'rail.propuesta.step4',
        ],
      }
    }
    if (busyKey?.startsWith('invite:')) {
      return {
        title: 'rail.invitacion.title',
        steps: [
          'rail.invitacion.step1',
          'rail.invitacion.step2',
          'rail.invitacion.step3',
          'rail.invitacion.step4',
        ],
      }
    }
    return null
  }, [busyKey])

  if (loading && items.length === 0) {
    return (
      <WorkspaceLoadingState
        title={t('loading.title')}
        detail={t('loading.detail')}
      />
    )
  }

  if (error && items.length === 0) {
    return (
      <WorkspaceErrorState
        title={t('error.title')}
        detail={error}
        onRetry={() => void loadSessions()}
      />
    )
  }

  if (items.length === 0) {
    return (
      <WorkspaceEmptyState
        title={t('empty.title')}
        detail={t('empty.detail')}
        actionLabel={t('empty.action')}
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
              <h2 className="text-sm font-semibold text-[#152520]">{t('header.title')}</h2>
            </div>
            <p className="text-xs text-[#4a7068]">
              {t('header.subtitle')}
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
              {t('header.nueva.manual')}
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
              {t('header.proponer.agentes')}
            </Button>
          </div>
        </div>
        {activeLlmRail ? (
          <div className="mt-4">
            <LlmExecutionRail
              title={t(activeLlmRail.title)}
              steps={activeLlmRail.steps.map((key) => t(key))}
            />
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
                          {t(meta.label)}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                          {t(session.casesCount !== 1 ? 'count.caso.many' : 'count.caso.one').replaceAll('{count}', String(session.casesCount))}
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
                          {t(session.participants.length !== 1 ? 'count.centro.many' : 'count.centro.one').replaceAll('{count}', String(session.participants.length))}
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
                          {t('accion.iniciar')}
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
                          {t('accion.invitacion.agentes')}
                        </Button>
                      )}
                      {isScheduled && (
                        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px] text-slate-400">
                          <VideoOff className="h-3 w-3" />
                          {t('estado.sala.no.iniciada')}
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
                            {t('accion.cerrar')}
                          </Button>
                          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px] text-slate-400">
                            <Video className="h-3 w-3" />
                            {t('estado.sala.activa')}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {busyKey === `invite:${session.sessionId}` ? (
                  <div className="border-t border-slate-100 px-5 py-4">
                    <LlmExecutionRail
                      title={t('rail.invitacion.inline.title')}
                      steps={[
                        t('rail.invitacion.inline.step1'),
                        t('rail.invitacion.inline.step2'),
                        t('rail.invitacion.inline.step3'),
                        t('rail.invitacion.inline.step4'),
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
                          {t('label.propuesta.agentes')}
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
                      {t('label.sala.videoconferencia')}
                    </p>
                    <MockVideoGrid participants={session.participants} />
                  </div>
                )}

                {/* Cases in agenda */}
                {(session.cases ?? []).length > 0 && (
                  <div className="border-t border-slate-100 px-5 pb-4 pt-3">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#4a7068]">
                      {t('label.casos.agenda')}
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
                                    {t('accion.abrir.caso')}
                                  </Button>
                                ) : null}
                              </div>
                            </div>

                            {savedConsensus ? (
                              <div className="mt-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
                                <span className="font-semibold">{t('consenso.label')}</span> {savedConsensus.decision}
                                {savedConsensus.dose ? `${t('consenso.pauta')}${savedConsensus.dose}` : ''}
                                {savedConsensus.interval ? `${t('consenso.intervalo')}${savedConsensus.interval}` : ''}
                                {savedConsensus.nextControl ? `${t('consenso.proximo.control')}${savedConsensus.nextControl}` : ''}
                                {savedConsensus.agreedBy ? ` — ${savedConsensus.agreedBy}` : ''}
                              </div>
                            ) : session.status !== 'done' ? (
                              <div className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#4a7068]">
                                  {t('consenso.form.title')}
                                </p>
                                <div className="grid gap-2 md:grid-cols-2">
                                  <input
                                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-[#7b3fa0]"
                                    placeholder={t('consenso.placeholder.decision')}
                                    value={draft.decision}
                                    onChange={(event) => setConsensusDraft(session.sessionId, caso.caseId, 'decision', event.target.value)}
                                  />
                                  <input
                                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-[#7b3fa0]"
                                    placeholder={t('consenso.placeholder.pauta')}
                                    value={draft.dose}
                                    onChange={(event) => setConsensusDraft(session.sessionId, caso.caseId, 'dose', event.target.value)}
                                  />
                                  <input
                                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-[#7b3fa0]"
                                    placeholder={t('consenso.placeholder.intervalo')}
                                    value={draft.interval}
                                    onChange={(event) => setConsensusDraft(session.sessionId, caso.caseId, 'interval', event.target.value)}
                                  />
                                  <input
                                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-[#7b3fa0]"
                                    placeholder={t('consenso.placeholder.proximo.control')}
                                    value={draft.nextControl}
                                    onChange={(event) => setConsensusDraft(session.sessionId, caso.caseId, 'nextControl', event.target.value)}
                                  />
                                </div>
                                <div className="mt-2 flex items-center justify-between gap-2">
                                  <input
                                    className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-[#7b3fa0]"
                                    placeholder={t('consenso.placeholder.notas')}
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
                                    {t('consenso.registrar')}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-2 rounded-lg bg-slate-100 px-3 py-2 text-[11px] text-slate-500">
                                {t('consenso.sin.registro')}
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
                          {t('label.invitacion.preparada')}
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
                        {t('acta.title')} {session.minutesEditedBy ? t('acta.validada') : session.minutes ? t('acta.borrador.pendiente') : ''}
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
                          {t('acta.borrador.agentes')}
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
                          {t('acta.validar')}
                        </Button>
                      </div>
                    </div>
                    <textarea
                      className="min-h-[180px] w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 font-mono text-xs leading-6 text-[#152520] outline-none transition focus:border-[#7b3fa0]"
                      placeholder={t('acta.placeholder')}
                      value={minutesDrafts[session.sessionId] ?? session.minutes ?? ''}
                      onChange={(event) =>
                        setMinutesDrafts((current) => ({ ...current, [session.sessionId]: event.target.value }))
                      }
                    />
                    {session.minutesEditedBy ? (
                      <p className="mt-1.5 text-[10px] text-[#4a7068]">
                        {t('acta.editada.por').replaceAll('{name}', session.minutesEditedBy)}
                        {session.minutesEditedAt ? ` · ${new Date(session.minutesEditedAt).toLocaleString('es-ES')}` : ''}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* UC-03: network training requests */}
        <TrainingRequestsSection />
      </div>
    </div>
  )
}

type TrainingRequest = {
  requestId: string
  title: string
  type: string
  drugDisease?: string
  justification: string
  currentSituation?: string
  expectedImpact?: string
  bibliography?: string
  proposedDate?: string
  scheduledDate?: string
  requesterName: string
  requesterCollegiate?: string
  centerName: string
  status: string
}

const TRAINING_STATUS_STYLE: Record<string, string> = {
  Propuesta: 'bg-purple-50 text-purple-700',
  Programada: 'bg-blue-50 text-blue-700',
  Impartida: 'bg-emerald-50 text-emerald-700',
  Rechazada: 'bg-slate-100 text-slate-500',
}

function TrainingRequestsSection() {
  const t = useXarxaT('sesiones')
  const [items, setItems] = useState<TrainingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [draft, setDraft] = useState({ title: '', drugDisease: '', justification: '', currentSituation: '', expectedImpact: '', bibliography: '', proposedDate: '', centerName: '', requesterName: '', requesterCollegiate: '' })

  async function load() {
    setLoading(true)
    try {
      const response = await fetchJson<{ items: TrainingRequest[] }>('/api/xarxa/training-requests')
      setItems(response.items ?? [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('training.error.cargar'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function submit() {
    setCreating(true)
    setError(null)
    setNotice(null)
    try {
      await fetchJson('/api/xarxa/training-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      setDraft({ title: '', drugDisease: '', justification: '', currentSituation: '', expectedImpact: '', bibliography: '', proposedDate: '', centerName: draft.centerName, requesterName: draft.requesterName, requesterCollegiate: draft.requesterCollegiate })
      setShowForm(false)
      await load()
      setNotice(t('training.notice.registrada'))
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t('training.error.registrar'))
    } finally {
      setCreating(false)
    }
  }

  async function updateStatus(requestId: string, status: string) {
    setBusyKey(`${status}:${requestId}`)
    setError(null)
    try {
      await fetchJson(`/api/xarxa/training-requests/${encodeURIComponent(requestId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, scheduledDate: status === 'Programada' ? new Date().toISOString().slice(0, 10) : undefined }),
      })
      await load()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : t('training.error.actualizar'))
    } finally {
      setBusyKey(null)
    }
  }

  const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-[#152520] outline-none transition placeholder:text-slate-400 focus:border-[#7b3fa0]'

  return (
    <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#152520]">{t('training.title')}</p>
          <p className="text-xs text-[#4a7068]">{t('training.subtitle')}</p>
        </div>
        <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => setShowForm((current) => !current)}>
          <Plus className={`mr-1.5 h-3.5 w-3.5 ${showForm ? 'rotate-45' : ''}`} />
          {showForm ? t('training.cerrar.formulario') : t('training.nueva.solicitud')}
        </Button>
      </div>

      {notice ? <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{notice}</p> : null}
      {error ? <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{error}</p> : null}

      {showForm ? (
        <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <input className={inputCls} placeholder={t('training.placeholder.titulo')} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            <input className={inputCls} placeholder={t('training.placeholder.farmaco')} value={draft.drugDisease} onChange={(e) => setDraft({ ...draft, drugDisease: e.target.value })} />
            <input className={inputCls} placeholder={t('training.placeholder.centro')} value={draft.centerName} onChange={(e) => setDraft({ ...draft, centerName: e.target.value })} />
            <input className={inputCls} placeholder={t('training.placeholder.fecha')} value={draft.proposedDate} onChange={(e) => setDraft({ ...draft, proposedDate: e.target.value })} />
            <input className={inputCls} placeholder={t('training.placeholder.solicitante')} value={draft.requesterName} onChange={(e) => setDraft({ ...draft, requesterName: e.target.value })} />
            <input className={inputCls} placeholder={t('training.placeholder.colegiado')} value={draft.requesterCollegiate} onChange={(e) => setDraft({ ...draft, requesterCollegiate: e.target.value })} />
          </div>
          <textarea className={`${inputCls} min-h-[70px]`} placeholder={t('training.placeholder.justificacion')} value={draft.justification} onChange={(e) => setDraft({ ...draft, justification: e.target.value })} />
          <div className="grid gap-3 md:grid-cols-2">
            <textarea className={`${inputCls} min-h-[60px]`} placeholder={t('training.placeholder.situacion')} value={draft.currentSituation} onChange={(e) => setDraft({ ...draft, currentSituation: e.target.value })} />
            <textarea className={`${inputCls} min-h-[60px]`} placeholder={t('training.placeholder.impacto')} value={draft.expectedImpact} onChange={(e) => setDraft({ ...draft, expectedImpact: e.target.value })} />
          </div>
          <textarea className={`${inputCls} min-h-[50px]`} placeholder={t('training.placeholder.bibliografia')} value={draft.bibliography} onChange={(e) => setDraft({ ...draft, bibliography: e.target.value })} />
          <Button size="sm" className="rounded-xl bg-[#7b3fa0] text-xs text-white hover:bg-[#6a3490]" onClick={() => void submit()} disabled={creating || !draft.title.trim() || !draft.justification.trim()}>
            {creating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
            {t('training.registrar')}
          </Button>
        </div>
      ) : null}

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-xs text-[#4a7068]"><Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('training.cargando')}</div>
      ) : items.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-[#4a7068]">
          {t('training.vacio')}
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {items.map((item) => (
            <div key={item.requestId} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#152520]">{item.title}</p>
                  <p className="mt-0.5 text-[11px] text-[#4a7068]">
                    {item.requestId} · {item.type} · {item.centerName} · {item.requesterName}
                    {item.requesterCollegiate ? t('training.col').replaceAll('{num}', item.requesterCollegiate) : ''}
                    {item.proposedDate ? t('training.fecha.propuesta').replaceAll('{date}', item.proposedDate) : ''}
                  </p>
                  <p className="mt-1 text-xs text-[#4a7068]">{item.justification}</p>
                  {item.expectedImpact ? <p className="mt-1 text-[11px] text-slate-500">{t('training.impacto.esperado').replaceAll('{impact}', item.expectedImpact)}</p> : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${TRAINING_STATUS_STYLE[item.status] ?? 'bg-slate-100 text-slate-600'}`}>
                    {item.status}
                  </span>
                  {item.status === 'Propuesta' ? (
                    <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => void updateStatus(item.requestId, 'Programada')} disabled={!!busyKey}>
                      {busyKey === `Programada:${item.requestId}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Calendar className="h-3.5 w-3.5" />}
                      {t('training.programar')}
                    </Button>
                  ) : null}
                  {item.status === 'Programada' ? (
                    <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => void updateStatus(item.requestId, 'Impartida')} disabled={!!busyKey}>
                      {busyKey === `Impartida:${item.requestId}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      {t('training.marcar.impartida')}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
