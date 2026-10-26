'use client'

import {
  Activity, CheckCircle2, ClipboardEdit, Droplet, Eye, FileText, FlaskConical, MessageCircle, Microscope, Pill, RefreshCw, Stethoscope, TrendingUp, Users, Zap,
} from 'lucide-react'
import type * as React from 'react'
import { useState } from 'react'

import { useXarxaT } from '@/components/i18n/use-xarxa-strings'
import { TimelineLaneOverview } from '@/components/pkpd/pro/charts/timeline-lane-overview'
import type { CasoCompleto } from '@/components/pkpd/pro/xarxa-types'
import { LANE_COLORS, LANE_DOT_RING } from './shared'

export const LANE_ORDER = ['Clínica', 'Tratamiento', 'Laboratorio', 'Decisiones', 'Tareas', 'Administración']

export const LANE_ICON_COMPONENT: Record<string, React.ElementType> = {
  Clínica:        Stethoscope,
  Tratamiento:    Pill,
  Laboratorio:    FlaskConical,
  Decisiones:     Zap,
  Tareas:         CheckCircle2,
  Administración: ClipboardEdit,
}

export const LANE_DOT_ICON_COLOR: Record<string, string> = {
  Clínica:        'text-violet-500',
  Tratamiento:    'text-blue-500',
  Laboratorio:    'text-teal-500',
  Decisiones:     'text-amber-500',
  Tareas:         'text-orange-500',
  Administración: 'text-slate-400',
}

export const EVENT_TYPE_ICON_COMPONENT: Record<string, React.ElementType> = {
  'Solicitud':             FileText,
  'Estado':                RefreshCw,
  'Recomendación':         MessageCircle,
  'Informe':               FileText,
  'Informe HCE':           FileText,
  'Inicio de tratamiento': Pill,
  'Determinante recibido': FlaskConical,
  'Seguimiento':           Eye,
  'Análisis':              TrendingUp,
  'Biomarcador':           Microscope,
  'Diagnóstico':           Stethoscope,
  'Extracción':            Droplet,
  'Sesión':                Users,
  'Administración':        ClipboardEdit,
}

export function TabTimeline({ caso }: { caso: CasoCompleto }) {
  const t = useXarxaT('cockpit-tabs-overview')
  const [activeLane, setActiveLane] = useState<string | null>(null)
  const sorted = [...(caso.timeline ?? [])].sort((a, b) => a.date.localeCompare(b.date))
  const presentLanes = LANE_ORDER.filter((l) => sorted.some((e) => e.lane === l))
  const filtered = activeLane ? sorted.filter((e) => e.lane === activeLane) : sorted

  const agentLanes = new Set(['Decisiones', 'Tareas'])
  const groupedByDay = filtered.reduce<Array<{ day: string; items: typeof filtered }>>((groups, event) => {
    const day = new Date(event.date).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    const existing = groups.find((group) => group.day === day)
    if (existing) {
      existing.items.push(event)
      return groups
    }
    groups.push({ day, items: [event] })
    return groups
  }, [])
  const latestEvent = filtered[filtered.length - 1]

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_320px]">
        <TimelineLaneOverview timeline={sorted} />
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#4a7068]">{t('timeline.foco.etiqueta')}</p>
          <p className="mt-1 text-sm font-semibold text-[#152520]">
            {activeLane ? t('timeline.foco.lane').replaceAll('{lane}', activeLane) : t('timeline.foco.completa')}
          </p>
          <p className="mt-2 text-sm leading-6 text-[#4a7068]">
            {activeLane
              ? t('timeline.foco.ayuda.lane')
              : t('timeline.foco.ayuda.completa')}
          </p>

          <div className="mt-4 rounded-2xl border border-slate-100 bg-[#f8faf9] p-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#4a7068]">{t('timeline.ultimo.hito')}</p>
            {latestEvent ? (
              <>
                <p className="mt-1 text-sm font-semibold text-[#152520]">{latestEvent.label}</p>
                <p className="mt-1 text-xs text-[#4a7068]">
                  {latestEvent.lane} · {new Date(latestEvent.date).toLocaleString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-[#4a7068]">{t('timeline.ultimo.hito.vacio')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Lane filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveLane(null)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            activeLane === null
              ? 'bg-slate-800 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {t('timeline.chips.todas')}
        </button>
        {presentLanes.map((lane) => (
          <button
            key={lane}
            onClick={() => setActiveLane(activeLane === lane ? null : lane)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
              activeLane === lane
                ? `${LANE_COLORS[lane] ?? 'bg-slate-100 text-slate-600'} ring-2 ring-offset-1`
                : `${LANE_COLORS[lane] ?? 'bg-slate-100 text-slate-600'} opacity-60 hover:opacity-100`
            }`}
          >
            {(() => { const LI = LANE_ICON_COMPONENT[lane]; return LI ? <LI className="h-3 w-3" /> : null })()}
            {lane}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-5">
        {groupedByDay.map((group) => (
          <div key={group.day} className="rounded-2xl border border-slate-100 bg-[#fbfcfb] p-4">
            <div className="mb-3 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <p className="text-sm font-semibold capitalize text-[#152520]">{group.day}</p>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] text-[#4a7068]">
                {t('timeline.eventos.count').replaceAll('{count}', String(group.items.length))}
              </span>
            </div>

            <div className="relative">
              <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-slate-200" />
              <div className="space-y-2">
                {group.items.map((event, i) => {
                  const isAgent = agentLanes.has(event.lane)
                  return (
                    <div key={`${group.day}-${i}`} className="relative flex items-start gap-4 pl-[60px]">
                      {(() => {
                        const DotIcon = EVENT_TYPE_ICON_COMPONENT[event.type] ?? LANE_ICON_COMPONENT[event.lane] ?? Activity
                        const dotColor = LANE_DOT_ICON_COLOR[event.lane] ?? 'text-slate-400'
                        return (
                          <div className={`absolute left-[4px] top-[10px] flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white shadow-md ring-2 ${LANE_DOT_RING[event.lane] ?? 'ring-slate-200'}`}>
                            <DotIcon className={`h-4 w-4 ${dotColor}`} />
                          </div>
                        )
                      })()}

                      <div
                        className={`flex-1 rounded-xl border px-4 py-3 ${
                          isAgent ? 'border-[#7b3fa0]/20 bg-[#faf6fd]' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${LANE_COLORS[event.lane] ?? 'bg-slate-100 text-slate-600'}`}>
                              {event.lane}
                            </span>
                          {isAgent && (
                              <span className="rounded-full bg-[#7b3fa0]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#7b3fa0]">{t('timeline.badge.agentes')}</span>
                            )}
                            <span className="text-[10px] text-slate-400">{event.type}</span>
                          </div>
                          <span className="shrink-0 text-[10px] text-slate-400">
                            {new Date(event.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-medium text-[#152520]">{event.label}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-6 text-center text-sm text-slate-400">{t('timeline.vacio.pista')}</p>
      )}
    </div>
  )
}
