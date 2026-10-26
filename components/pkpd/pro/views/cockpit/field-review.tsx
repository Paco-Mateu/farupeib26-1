'use client'

import { CircleHelp, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useXarxaT } from '@/components/i18n/use-xarxa-strings'
import type { FieldReviewMeta } from '@/components/pkpd/pro/xarxa-types'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { humanizeFieldLabel } from './derive'
import { sheetInputCls } from './shared'
import type { MedicationHistoryEntry } from './shared'

export function reviewStatusTone(meta: FieldReviewMeta) {
  if (meta.state === 'confirmed') return 'bg-emerald-50 text-emerald-700'
  if (meta.state === 'edited') return 'bg-sky-50 text-sky-700'
  return 'bg-amber-50 text-amber-700'
}

export function reviewStatusLabel(meta: FieldReviewMeta) {
  if (meta.state === 'confirmed') return 'review.status.confirmed'
  if (meta.state === 'edited') return 'review.status.edited'
  return 'review.status.pending'
}

export function reviewStatusSymbol(meta: FieldReviewMeta) {
  if (meta.state === 'confirmed') return '✓'
  if (meta.state === 'edited') return '✎'
  return '○'
}

export function reviewOriginLabel(meta: FieldReviewMeta) {
  return meta.origin === 'llm' ? 'review.origin.llm' : 'review.origin.manual'
}

export function reviewTraceLabel(meta: FieldReviewMeta) {
  if (meta.sourceLabel) return meta.sourceLabel
  return meta.origin === 'llm' ? 'review.trace.llm' : 'review.trace.manual'
}

export function InfoField({ label, value, review }: { label: string; value: string; review?: FieldReviewMeta }) {
  const t = useXarxaT('cockpit-review')

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[10px] uppercase tracking-[0.14em] text-[#4a7068]">{humanizeFieldLabel(label)}</p>
        {review ? (
          <>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold ${reviewStatusTone(review)}`}>
              <span>{reviewStatusSymbol(review)}</span>
              {t('review.estado')}: {t(reviewStatusLabel(review))}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-medium text-slate-600">
              {t('review.origen')}: {t(reviewOriginLabel(review))}
            </span>
          </>
        ) : null}
      </div>
      <p className="mt-0.5 text-sm font-medium text-[#152520]">{value}</p>
      {review ? (
        <div className="mt-1.5 space-y-0.5">
          <p className="text-[10px] text-slate-500">
            <span className="font-semibold text-slate-600">{t('review.traza')}</span> {t(reviewTraceLabel(review))}
          </p>
        </div>
      ) : null}
    </div>
  )
}

export function ReviewMiniMetric({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'llm' | 'pending' | 'confirmed' | 'edited'
}) {
  const toneCls = {
    llm: 'bg-[#faf6fd] text-[#7b3fa0] border-[#7b3fa0]/15',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    edited: 'bg-sky-50 text-sky-700 border-sky-200',
  }[tone]

  return (
    <div className={`rounded-xl border px-3 py-2 ${toneCls}`}>
      <p className="text-[9px] font-semibold uppercase tracking-[0.14em]">{label}</p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  )
}

export function MiniData({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1 text-xs font-medium text-[#152520]">{value}</p>
    </div>
  )
}

export function TherapyTimeline({ entries }: { entries: MedicationHistoryEntry[] }) {
  const t = useXarxaT('cockpit-review')
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-4 text-xs text-[#4a7068]">
        {t('timeline.empty')}
      </div>
    )
  }

  const CHART_H = 96
  const NODE_R = 7
  const COL_W = 88
  const PAD_X = 48
  const PAD_TOP = 22
  const PAD_BOT = 56
  const SVG_H = CHART_H + PAD_TOP + PAD_BOT
  const SVG_W = entries.length * COL_W + PAD_X * 2

  const doseValues = entries.map(e => e.doseValue).filter((v): v is number => v !== null)
  const maxDose = doseValues.length > 0 ? Math.max(...doseValues) : 1
  const minDose = doseValues.length > 0 ? Math.min(...doseValues) : 0
  const range = maxDose - minDose || maxDose || 1

  const ys = entries.map((entry) => {
    if (entry.doseValue !== null) {
      const norm = (entry.doseValue - minDose) / range
      return PAD_TOP + CHART_H - norm * (CHART_H - NODE_R * 2) - NODE_R
    }
    return PAD_TOP + CHART_H / 2
  })
  const xs = entries.map((_, i) => PAD_X + i * COL_W + COL_W / 2)

  const CHANGE_COLOR: Record<string, string> = {
    Inicio:          '#7b3fa0',
    Intensificación: '#ef4444',
    Reducción:       '#3b82f6',
    Ratificación:    '#22c55e',
    Cambio:          '#f59e0b',
    Antecedente:     '#94a3b8',
    Seguimiento:     '#64748b',
  }

  const selected = selectedIdx !== null ? entries[selectedIdx] : null
  const selectedColor = selected ? (CHANGE_COLOR[selected.changeLabel] ?? '#64748b') : '#64748b'
  const usedLabels = Array.from(new Set(entries.map(e => e.changeLabel))).filter(l => CHANGE_COLOR[l])

  return (
    <div className="space-y-3">
      {/* Chart */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: SVG_W }}>
          <svg width={SVG_W} height={SVG_H} style={{ overflow: 'visible' }}>
            {/* Axis guide lines */}
            <line x1={PAD_X} y1={PAD_TOP} x2={SVG_W - PAD_X} y2={PAD_TOP}
              stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 3" />
            <line x1={PAD_X} y1={PAD_TOP + CHART_H} x2={SVG_W - PAD_X} y2={PAD_TOP + CHART_H}
              stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 3" />

            {/* Connecting segments — colored by dose direction */}
            {entries.slice(0, -1).map((entry, i) => {
              const next = entries[i + 1]
              let seg = '#e2e8f0'
              if (entry.doseValue !== null && next.doseValue !== null) {
                if (next.doseValue > entry.doseValue) seg = '#fca5a5'
                else if (next.doseValue < entry.doseValue) seg = '#93c5fd'
                else seg = '#bbf7d0'
              }
              return <line key={i} x1={xs[i]} y1={ys[i]} x2={xs[i + 1]} y2={ys[i + 1]}
                stroke={seg} strokeWidth="2.5" strokeLinecap="round" />
            })}

            {/* Y-axis dose labels */}
            {doseValues.length > 0 && (
              <>
                <text x={PAD_X - 8} y={PAD_TOP + 4} textAnchor="end" fontSize="9" fill="#94a3b8">{maxDose}mg</text>
                {minDose > 0 && minDose !== maxDose && (
                  <text x={PAD_X - 8} y={PAD_TOP + CHART_H} textAnchor="end" fontSize="9" fill="#94a3b8">{minDose}mg</text>
                )}
              </>
            )}

            {/* Nodes */}
            {entries.map((entry, i) => {
              const x = xs[i]; const y = ys[i]
              const color = CHANGE_COLOR[entry.changeLabel] ?? '#94a3b8'
              const isSelected = selectedIdx === i
              return (
                <g key={i} onClick={() => setSelectedIdx(isSelected ? null : i)} style={{ cursor: 'pointer' }}>
                  {(entry.isCurrent || isSelected) && (
                    <circle cx={x} cy={y} r={NODE_R + 6} fill="none" stroke={color} strokeWidth="1.5" opacity="0.35" />
                  )}
                  <circle cx={x} cy={y} r={NODE_R}
                    fill={isSelected ? color : 'white'} stroke={color} strokeWidth="2" />
                  {entry.isCurrent && !isSelected && (
                    <circle cx={x} cy={y} r={3} fill={color} />
                  )}
                  {/* Dose above node */}
                  {entry.doseText && entry.doseText !== '—' && (
                    <text x={x} y={y - NODE_R - 5}
                      textAnchor="middle" fontSize="9" fontWeight="600" fill={color}>
                      {entry.doseText}
                    </text>
                  )}
                  {/* Date below chart */}
                  <text x={x} y={PAD_TOP + CHART_H + 16}
                    textAnchor="middle" fontSize="9" fill="#94a3b8">
                    {entry.dateLabel}
                  </text>
                  {/* Change type */}
                  <text x={x} y={PAD_TOP + CHART_H + 30}
                    textAnchor="middle" fontSize="8.5" fill={color} fontWeight="500">
                    {entry.changeLabel}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      {/* Detail card — appears on click */}
      {selected && (
        <div className="rounded-xl border px-4 py-3.5 transition-all"
          style={{ borderColor: selectedColor + '40', backgroundColor: selectedColor + '08' }}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                  style={{ backgroundColor: selectedColor }}>
                  {selected.changeLabel}
                </span>
                <span className="text-[10px] text-slate-400">{selected.dateLabel}</span>
                {selected.isCurrent && (
                  <span className="rounded-full bg-[#faf6fd] px-2 py-0.5 text-[10px] font-semibold text-[#7b3fa0] ring-1 ring-[#7b3fa0]/20">
                    {t('timeline.current')}
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-sm font-semibold text-[#152520]">{selected.label}</p>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs">
                {selected.doseText && selected.doseText !== '—' && (
                  <span><span className="text-slate-400">{t('timeline.dosis')} </span><span className="font-medium text-[#152520]">{selected.doseText}</span></span>
                )}
                {selected.interval && (
                  <span><span className="text-slate-400">{t('timeline.intervalo')} </span><span className="font-medium text-[#152520]">{selected.interval}</span></span>
                )}
                {selected.route && (
                  <span><span className="text-slate-400">{t('timeline.via')} </span><span className="font-medium text-[#152520]">{selected.route}</span></span>
                )}
                {(selected.periodLabel || selected.dateLabel) && (
                  <span><span className="text-slate-400">{t('timeline.periodo')} </span><span className="font-medium text-[#152520]">{selected.periodLabel || selected.dateLabel}</span></span>
                )}
                {selected.source && (
                  <span><span className="text-slate-400">{t('timeline.fuente')} </span><span className="font-medium text-[#152520]">{selected.source}</span></span>
                )}
              </div>
            </div>
            <button onClick={() => setSelectedIdx(null)}
              className="shrink-0 rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-1.5">
        {usedLabels.map((label) => (
          <span key={label} className="flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600 ring-1 ring-slate-100">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: CHANGE_COLOR[label] }} />
            {label}
          </span>
        ))}
        <span className="flex items-center gap-2 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] text-slate-500 ring-1 ring-slate-100">
          <span className="inline-block h-1 w-4 rounded bg-red-200" /> {t('timeline.legend.up')}
          <span className="inline-block h-1 w-4 rounded bg-blue-200" /> {t('timeline.legend.down')}
          <span className="inline-block h-1 w-4 rounded bg-green-200" /> {t('timeline.legend.flat')}
        </span>
      </div>
    </div>
  )
}

export function FieldStatusHelpContent() {
  const t = useXarxaT('cockpit-review')

  return (
    <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-lg bg-slate-50 px-3 py-2">
        <p className="font-semibold text-slate-700">{t('help.estado.title')}</p>
        <p className="mt-1">{t('help.estado.desc')}</p>
      </div>
      <div className="rounded-lg bg-slate-50 px-3 py-2">
        <p className="font-semibold text-slate-700">{t('help.origen.title')}</p>
        <p className="mt-1">{t('help.origen.desc')}</p>
      </div>
      <div className="rounded-lg bg-slate-50 px-3 py-2">
        <p className="font-semibold text-slate-700">{t('help.traza.title')}</p>
        <p className="mt-1">{t('help.traza.desc')}</p>
      </div>
      <div className="rounded-lg bg-slate-50 px-3 py-2">
        <p className="font-semibold text-slate-700">{t('help.validacion.title')}</p>
        <p className="mt-1">{t('help.validacion.desc')}</p>
      </div>
    </div>
  )
}

export function FieldStatusHelpTrigger() {
  const t = useXarxaT('cockpit-review')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const media = window.matchMedia('(max-width: 1023px)')
    const sync = () => setIsMobile(media.matches)

    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="rounded-xl border-slate-200 text-slate-500"
              aria-label={t('help.trigger.aria')}
            />
          }
        >
          <CircleHelp className="h-4 w-4" />
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-[28px] bg-white">
          <SheetHeader className="pr-12">
            <SheetTitle>{t('help.title')}</SheetTitle>
            <SheetDescription>
              {t('help.desc')}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-5">
            <FieldStatusHelpContent />
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div className="group/help relative hidden lg:block">
      <button
        type="button"
        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-[#7b3fa0]"
        aria-label={t('help.trigger.aria')}
      >
        <CircleHelp className="h-4 w-4" />
      </button>
      <div className="pointer-events-none absolute left-0 top-10 z-20 w-[340px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl opacity-0 transition duration-150 group-hover/help:opacity-100 group-focus-within/help:opacity-100">
        <p className="text-sm font-semibold text-[#152520]">{t('help.title')}</p>
        <p className="mt-1 text-xs leading-5 text-[#4a7068]">
          {t('help.desc')}
        </p>
        <div className="mt-3">
          <FieldStatusHelpContent />
        </div>
      </div>
    </div>
  )
}

export function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  disabled?: boolean
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#152520]">{label}</label>
      <input
        className={sheetInputCls}
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

export function LabeledSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
}) {
  const t = useXarxaT('cockpit-review')

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[#152520]">{label}</label>
      <select className={sheetInputCls} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option || '__empty__'} value={option}>
            {option || t('select.empty')}
          </option>
        ))}
      </select>
    </div>
  )
}

export function ReviewedInput({
  label,
  value,
  onChange,
  review,
  onConfirm,
  onPending,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  review: FieldReviewMeta
  onConfirm: () => void
  onPending: () => void
}) {
  const t = useXarxaT('cockpit-review')

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm font-medium text-[#152520]">{label}</label>
        <ReviewStatusInline review={review} onConfirm={onConfirm} onPending={onPending} />
      </div>
      <input className={sheetInputCls} value={value} onChange={(event) => onChange(event.target.value)} />
      <p className="mt-1 text-[10px] text-slate-400">
        {t('review.traza')} {t(reviewTraceLabel(review))}
      </p>
    </div>
  )
}

export function ReviewedTextarea({
  label,
  value,
  onChange,
  review,
  onConfirm,
  onPending,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  review: FieldReviewMeta
  onConfirm: () => void
  onPending: () => void
}) {
  const t = useXarxaT('cockpit-review')

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm font-medium text-[#152520]">{label}</label>
        <ReviewStatusInline review={review} onConfirm={onConfirm} onPending={onPending} />
      </div>
      <textarea
        rows={5}
        className={`${sheetInputCls} resize-none`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <p className="mt-1 text-[10px] text-slate-400">
        {t('review.traza')} {t(reviewTraceLabel(review))}
      </p>
    </div>
  )
}

export function ReviewStatusInline({
  review,
  onConfirm,
  onPending,
}: {
  review: FieldReviewMeta
  onConfirm: () => void
  onPending: () => void
}) {
  const t = useXarxaT('cockpit-review')

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold ${reviewStatusTone(review)}`}>
        <span>{reviewStatusSymbol(review)}</span>
        {t('review.estado')}: {t(reviewStatusLabel(review))}
      </span>
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-medium text-slate-600">
        {t('review.origen')}: {t(reviewOriginLabel(review))}
      </span>
      {review.origin === 'llm' ? (
        <>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full border border-emerald-200 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            {t('review.action.confirm')}
          </button>
          <button
            type="button"
            onClick={onPending}
            className="rounded-full border border-amber-200 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700 transition hover:bg-amber-50"
          >
            {t('review.status.pending')}
          </button>
        </>
      ) : null}
    </div>
  )
}
