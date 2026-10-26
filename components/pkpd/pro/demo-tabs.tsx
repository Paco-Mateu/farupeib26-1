'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Database,
  FileText,
  GitMerge,
  Layers,
  Lock,
  MessageCircle,
  Sparkles,
  TrendingUp,
  Users2,
  Zap,
} from 'lucide-react'

import { useXarxaT } from '@/components/i18n/use-xarxa-strings'

const DEMO_HIGHLIGHTS = [
  {
    icon: Bot,
    tag: 'demo.highlight.entry.tag',
    title: 'demo.highlight.entry.title',
    text: 'demo.highlight.entry.text',
  },
  {
    icon: Users2,
    tag: 'demo.highlight.collab.tag',
    title: 'demo.highlight.collab.title',
    text: 'demo.highlight.collab.text',
  },
  {
    icon: FileText,
    tag: 'demo.highlight.trace.tag',
    title: 'demo.highlight.trace.title',
    text: 'demo.highlight.trace.text',
  },
]

const DEMO_STEPS = [
  {
    title: 'demo.step.inbox.title',
    description: 'demo.step.inbox.description',
    href: '/?vista=bandeja',
    action: 'demo.step.inbox.action',
  },
  {
    title: 'demo.step.queue.title',
    description: 'demo.step.queue.description',
    href: '/?vista=casos',
    action: 'demo.step.queue.action',
  },
  {
    title: 'demo.step.cockpit.title',
    description: 'demo.step.cockpit.description',
    href: '/?vista=casos',
    action: 'demo.step.cockpit.action',
  },
  {
    title: 'demo.step.validation.title',
    description: 'demo.step.validation.description',
    href: '/?vista=casos',
    action: 'demo.step.validation.action',
  },
  {
    title: 'demo.step.closure.title',
    description: 'demo.step.closure.description',
    href: '/?vista=reporting',
    action: 'demo.step.closure.action',
  },
]

const WORKFLOW_POINTS = [
  { icon: Bot,    text: 'demo.workflow.email' },
  { icon: Layers, text: 'demo.workflow.cockpit' },
  { icon: Zap,    text: 'demo.workflow.traced' },
]

const PROTOTYPE_NOTES = [
  'demo.prototype.notProduct',
  'demo.prototype.vision',
  'demo.prototype.grow',
]

type TabId = 'highlights' | 'journey' | 'positioning' | 'nextsteps'

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'highlights',  label: 'demo.tab.highlights' },
  { id: 'journey',     label: 'demo.tab.journey' },
  { id: 'positioning', label: 'demo.tab.positioning' },
  { id: 'nextsteps',   label: 'demo.tab.nextsteps' },
]

export function DemoTabs() {
  const t = useXarxaT('demo-intro')
  const [active, setActive] = useState<TabId>('highlights')

  return (
    <div className="px-6 py-6 sm:px-8 sm:py-8">

      {/* Tab bar */}
      <div className="flex gap-1 rounded-2xl bg-[#ede6f5] p-1.5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={[
              'flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition',
              active === tab.id
                ? 'bg-[#7b3fa0] text-white shadow-md'
                : 'text-[#7b3fa0]/70 hover:bg-[#7b3fa0]/10 hover:text-[#7b3fa0]',
            ].join(' ')}
          >
            {t(tab.label)}
          </button>
        ))}
      </div>

      {/* ── Qué verás ── */}
      <div className={active === 'highlights' ? 'mt-6' : 'hidden'}>
        <div className="mb-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7b3fa0]">
            {t('demo.highlights.kicker')}
          </p>
          <p className="mt-1 text-lg font-semibold text-[#152520]">
            {t('demo.highlights.title')}
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {DEMO_HIGHLIGHTS.map(({ icon: Icon, tag, title, text }) => (
            <article key={title} className="rounded-2xl border border-[#7b3fa0]/15 bg-[#faf6fd] p-6 transition hover:border-[#7b3fa0]/30 hover:shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7b3fa0] text-white shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-[#7b3fa0]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#7b3fa0]">
                  {t(tag)}
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-[#152520]">{t(title)}</h3>
              <p className="mt-2 text-sm leading-7 text-[#4a7068]">{t(text)}</p>
            </article>
          ))}
        </div>
        <div className="mt-5 flex justify-end">
          <Link
            href="/?vista=bandeja"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#7b3fa0] px-5 py-2.5 text-sm font-semibold text-white! transition hover:bg-[#6a3490]"
          >
            <Sparkles className="h-4 w-4" />
            {t('demo.cta.try')}
          </Link>
        </div>
      </div>

      {/* ── Recorrido ── */}
      <div className={active === 'journey' ? 'mt-6' : 'hidden'}>
        <div className="mb-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7b3fa0]">
            {t('demo.journey.kicker')}
          </p>
          <p className="mt-1 text-lg font-semibold text-[#152520]">
            {t('demo.journey.title')}
          </p>
        </div>
        <div className="relative">
          <div className="absolute left-10 top-0 bottom-0 hidden w-px bg-gradient-to-b from-[#7b3fa0]/20 via-[#7b3fa0] to-[#7b3fa0]/20 sm:block" />
          <div className="space-y-3">
            {DEMO_STEPS.map((step, i) => (
              <Link
                key={step.title}
                href={step.href}
                className="group flex gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-5 transition hover:border-[#7b3fa0]/25 hover:bg-[#faf6fd] hover:shadow-sm"
              >
                <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#7b3fa0] text-xs font-bold text-white shadow-sm">
                  {i + 1}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#152520]">{t(step.title)}</p>
                    <p className="mt-1 text-sm leading-6 text-[#4a7068]">{t(step.description)}</p>
                  </div>
                  <div className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#7b3fa0]/20 bg-white px-3 py-2 text-xs font-semibold text-[#7b3fa0] transition group-hover:border-[#7b3fa0]/40 group-hover:bg-[#f3ebfa]">
                    {t(step.action)}
                    <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Posicionamiento ── */}
      <div className={active === 'positioning' ? 'mt-6' : 'hidden'}>
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl bg-[#7b3fa0] p-7 text-white shadow-md">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
              {t('demo.value.kicker')}
            </p>
            <p className="mt-4 text-lg font-semibold leading-8">
              {t('demo.value.text')}
            </p>
          </div>
          <div className="space-y-2.5">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7b3fa0]">{t('demo.workflow.kicker')}</p>
            {WORKFLOW_POINTS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3 rounded-xl border border-[#7b3fa0]/15 bg-[#faf6fd] px-4 py-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#7b3fa0]" />
                <p className="text-sm leading-6 text-[#152520]">{t(text)}</p>
              </div>
            ))}
            <p className="mb-1 mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{t('demo.about.kicker')}</p>
            {PROTOTYPE_NOTES.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <p className="text-sm leading-6 text-[#4a7068]">{t(item)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Próximos pasos ── */}
      <div className={active === 'nextsteps' ? 'mt-6 space-y-6' : 'hidden'}>

        {/* Demo disclaimer */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700">{t('demo.context.kicker')}</p>
          <p className="mt-2 text-sm leading-7 text-amber-800">
            {t('demo.context.a')}<strong>{t('demo.context.strong')}</strong>{t('demo.context.b')}
          </p>
        </div>

        {/* Production requirements */}
        <div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7b3fa0]">{t('demo.production.kicker')}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: Lock,
                title: 'demo.prod.auth.title',
                text: 'demo.prod.auth.text',
              },
              {
                icon: Layers,
                title: 'demo.prod.multitenant.title',
                text: 'demo.prod.multitenant.text',
              },
              {
                icon: FileText,
                title: 'demo.prod.security.title',
                text: 'demo.prod.security.text',
              },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-200 text-slate-600">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="mt-3 text-sm font-semibold text-[#152520]">{t(title)}</p>
                <p className="mt-1.5 text-xs leading-6 text-[#4a7068]">{t(text)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Knowledge base vision */}
        <div className="rounded-2xl bg-[#7b3fa0] p-6 text-white shadow-md">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">{t('demo.knowledge.kicker')}</p>
              <p className="mt-2 text-base font-semibold leading-7">
                {t('demo.knowledge.text')}
              </p>
            </div>
          </div>
        </div>

        {/* 4 next capabilities */}
        <div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7b3fa0]">{t('demo.next.kicker')}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                icon: Users2,
                num: '01',
                title: 'demo.cap.cohorts.title',
                text: 'demo.cap.cohorts.text',
              },
              {
                icon: TrendingUp,
                num: '02',
                title: 'demo.cap.effects.title',
                text: 'demo.cap.effects.text',
              },
              {
                icon: GitMerge,
                num: '03',
                title: 'demo.cap.integration.title',
                text: 'demo.cap.integration.text',
              },
              {
                icon: MessageCircle,
                num: '04',
                title: 'demo.cap.cocreation.title',
                text: 'demo.cap.cocreation.text',
              },
            ].map(({ icon: Icon, num, title, text }) => (
              <div key={title} className="flex gap-4 rounded-2xl border border-[#7b3fa0]/15 bg-[#faf6fd] p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#7b3fa0] text-xs font-bold text-white shadow-sm">
                  {num}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-[#7b3fa0]" />
                    <p className="text-sm font-semibold text-[#152520]">{t(title)}</p>
                  </div>
                  <p className="mt-1.5 text-xs leading-6 text-[#4a7068]">{t(text)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  )
}
