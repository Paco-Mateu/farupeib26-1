'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Award } from 'lucide-react'

import { useXarxaT } from '@/components/i18n/use-xarxa-strings'
import { DemoTabs } from '@/components/pkpd/pro/demo-tabs'

export function DemoIntro() {
  const t = useXarxaT('demo-intro')

  return (
    <main className="min-h-screen bg-white text-[#152520]">
      {/* Clinical disclaimer */}
      <div className="border-b border-amber-200 bg-amber-50 px-6 py-3">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs leading-relaxed text-amber-800">
            <strong>{t('intro.disclaimer.label')}</strong> {t('intro.disclaimer.body')}<strong>{t('intro.disclaimer.strong')}</strong>{t('intro.disclaimer.tail')}
          </p>
        </div>
      </div>

      {/* Nav bar */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-wrap items-center gap-3">
            <Image src="/brand/xarxapkpd.png" alt="Xarxa PK/PD" width={180} height={42} style={{ width: 'auto', height: '42px' }} />
            <span className="rounded-full bg-[#f3ebfa] px-3 py-1 text-xs font-semibold text-[#7b3fa0]">
              {t('intro.badge')}
            </span>
          </div>
        </div>
      </section>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="max-w-5xl text-4xl font-semibold tracking-tight text-[#152520]">
              {t('intro.h1')}
            </h1>
            <p className="mt-5 max-w-4xl text-base leading-8 text-[#4a7068]">
              {t('intro.story.a')}<em>{t('intro.story.project')}</em>{t('intro.story.b')}
            </p>
            <p className="mt-4 max-w-4xl text-base leading-8 text-[#4a7068]">
              {t('intro.ai.a')}<strong className="text-[#152520]">{t('intro.ai.strong')}</strong>
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/?vista=bandeja"
                className="inline-flex items-center rounded-2xl bg-[#7b3fa0] px-5 py-3 text-sm font-semibold text-white! shadow-sm transition hover:bg-[#6a3490]"
              >
                {t('intro.cta.demo')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/?vista=casos"
                className="inline-flex items-center rounded-2xl border border-[#7b3fa0] bg-white px-5 py-3 text-sm font-semibold text-[#7b3fa0] transition hover:border-[#6a3490] hover:bg-[#faf6fd] hover:text-[#6a3490]"
              >
                {t('intro.cta.queue')}
              </Link>
            </div>
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 lg:hidden">
              {t('intro.mobile.note')}
            </div>
          </div>

          {/* Origin card */}
          <div className="overflow-hidden rounded-[32px] border border-[#7b3fa0]/15 bg-[#faf6fd] shadow-sm">
            <a
              href="https://www.farupeib.com/es/jornada-anual-farupeib/programa/2026"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block"
            >
              <Image
                src="/brand/Jornades-FARUPEIB_14-05.png"
                alt={t('intro.alt.jornades')}
                width={800}
                height={400}
                className="h-40 w-full object-cover transition group-hover:brightness-90"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                <span className="rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                  {t('intro.ver.programa')}
                </span>
              </div>
            </a>
            <div className="p-8">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-[#7b3fa0]" />
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b3fa0]">
                  {t('intro.origin.kicker')}
                </p>
              </div>
              <p className="mt-4 text-sm leading-7 text-[#4a7068]">
                {t('intro.origin.a')}<strong className="text-[#152520]">{t('intro.origin.activity')}</strong>{t('intro.origin.b')}<strong className="text-[#152520]">{t('intro.origin.jornada')}</strong>{t('intro.origin.c')}
              </p>
              <p className="mt-3 text-sm leading-7 text-[#4a7068]">
                {t('intro.origin.project.a')}<strong className="text-[#152520]">{t('intro.origin.project.name')}</strong>{t('intro.origin.project.b')}<strong className="text-[#152520]">{t('intro.origin.project.leader')}</strong>{t('intro.origin.project.c')}
              </p>
              <div className="mt-4 rounded-2xl border border-[#7b3fa0]/10 bg-white p-4 shadow-sm">
                <Image
                  src="/brand/logo.png"
                  alt="Hospital Universitari de Bellvitge"
                  width={960}
                  height={211}
                  style={{ width: '100%', height: 'auto', maxWidth: '230px' }}
                />
              </div>
              <p className="mt-4 text-sm leading-7 text-[#4a7068]">
                {t('intro.credit.a')}<strong className="text-[#152520]">Francesc Mateu, Field CTO, Healthcare at MongoDB</strong>{t('intro.credit.b')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs section */}
      <section className="mx-auto max-w-7xl px-6 pb-14">
        <div className="overflow-hidden rounded-[32px] border border-[#7b3fa0]/20 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#7b3fa0]/15 bg-[#faf6fd] px-8 py-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b3fa0]">
                {t('intro.explore.kicker')}
              </p>
              <h2 className="mt-1.5 text-2xl font-semibold text-[#152520]">
                {t('intro.explore.title')}
              </h2>
            </div>
            <Link
              href="/?vista=bandeja"
              className="inline-flex items-center rounded-2xl bg-[#7b3fa0] px-4 py-2.5 text-sm font-semibold text-white! transition hover:bg-[#6a3490]"
            >
              {t('intro.explore.cta')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          {/* Interactive tabs — client component */}
          <DemoTabs />
        </div>
      </section>
    </main>
  )
}
