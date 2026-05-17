'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  FileText,
  Layers,
  Sparkles,
  Users2,
  Zap,
} from 'lucide-react'

const DEMO_HIGHLIGHTS = [
  {
    icon: Bot,
    tag: 'Entrada inteligente',
    title: 'Del email al caso estructurado',
    text: 'Un correo clínico se convierte automáticamente en un caso revisable, con campos sugeridos, highlights y validación humana antes de entrar al pipeline.',
  },
  {
    icon: Users2,
    tag: 'Colaboración multidisciplinar',
    title: 'Un caso, varios especialistas',
    text: 'Farmacia, Digestivo, Enfermería y Laboratorio trabajan sobre el mismo caso con un siguiente paso compartido, trazas de agentes y decisiones documentadas.',
  },
  {
    icon: FileText,
    tag: 'Trazabilidad total',
    title: 'Cada decisión queda registrada',
    text: 'Recomendación, borrador HCE, tareas y outcome quedan trazados como conocimiento reutilizable — no solo para el caso, sino para toda la red.',
  },
]

const DEMO_STEPS = [
  {
    title: 'Bandeja IA',
    description:
      'Parte de una solicitud clínica realista. La IA identifica el tipo de caso, extrae información útil, detecta gaps y propone las primeras tareas antes de que el equipo empiece.',
    href: '/?vista=bandeja',
    action: 'Abrir Bandeja IA',
  },
  {
    title: 'Cola de casos PK/PD',
    description:
      'La solicitud se convierte en un caso estructurado con timeline, determinantes, estado del pipeline, profesionales implicados y trazas de agentes listos para validación.',
    href: '/?vista=casos',
    action: 'Ir a Casos PK/PD',
  },
  {
    title: 'Case Cockpit',
    description:
      'El equipo trabaja sobre una visión única: datos clínicos, tratamiento, laboratorio, gaps, tareas, interpretación PK/PD, escenarios posibles, recomendación e informe HCE.',
    href: '/?vista=casos',
    action: 'Ver Case Cockpit',
  },
  {
    title: 'Validación de la recomendación',
    description:
      'El farmacéutico revisa la interpretación preparada por los agentes, ajusta el razonamiento si es necesario y genera una recomendación farmacoterapéutica trazable.',
    href: '/?vista=casos',
    action: 'Revisar recomendación',
  },
  {
    title: 'Cierre del ciclo de aprendizaje',
    description:
      'El caso queda vinculado a seguimiento, outcomes y aprendizaje de red. La plataforma acompaña el resultado y convierte cada caso validado en conocimiento compartible.',
    href: '/?vista=reporting',
    action: 'Abrir Informes y aprendizaje',
  },
]

const WORKFLOW_POINTS = [
  { icon: Bot,    text: 'El email se estructura con LLM y se revisa antes de crear el caso.' },
  { icon: Layers, text: 'El caso pasa a un cockpit clínico con validación humana campo a campo.' },
  { icon: Zap,    text: 'La recomendación, la nota HCE y el outcome quedan trazados como conocimiento de red.' },
]

const PROTOTYPE_NOTES = [
  'No es un producto final. Es una demostración de posibilidades.',
  'Convierte una visión clínica en una experiencia tangible y compartible.',
  'Está pensado para crecer desde Crohn PK/PD hacia nuevos circuitos y especialidades.',
]

type TabId = 'highlights' | 'journey' | 'positioning'

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'highlights',  label: 'Qué verás' },
  { id: 'journey',     label: 'Recorrido' },
  { id: 'positioning', label: 'Posicionamiento' },
]

export function DemoTabs() {
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
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Qué verás ── */}
      <div className={active === 'highlights' ? 'mt-6' : 'hidden'}>
        <div className="mb-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7b3fa0]">
            Tres capacidades clave
          </p>
          <p className="mt-1 text-lg font-semibold text-[#152520]">
            Lo que diferencia esta plataforma de una lista de tareas clínicas
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
                  {tag}
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-[#152520]">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-[#4a7068]">{text}</p>
            </article>
          ))}
        </div>
        <div className="mt-5 flex justify-end">
          <Link
            href="/?vista=bandeja"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#7b3fa0] px-5 py-2.5 text-sm font-semibold text-white! transition hover:bg-[#6a3490]"
          >
            <Sparkles className="h-4 w-4" />
            Probar la demo
          </Link>
        </div>
      </div>

      {/* ── Recorrido ── */}
      <div className={active === 'journey' ? 'mt-6' : 'hidden'}>
        <div className="mb-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7b3fa0]">
            Flujo de trabajo
          </p>
          <p className="mt-1 text-lg font-semibold text-[#152520]">
            Cinco pasos, desde el email hasta el cierre del caso
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
                    <p className="font-semibold text-[#152520]">{step.title}</p>
                    <p className="mt-1 text-sm leading-6 text-[#4a7068]">{step.description}</p>
                  </div>
                  <div className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#7b3fa0]/20 bg-white px-3 py-2 text-xs font-semibold text-[#7b3fa0] transition group-hover:border-[#7b3fa0]/40 group-hover:bg-[#f3ebfa]">
                    {step.action}
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
              Propuesta de valor
            </p>
            <p className="mt-4 text-lg font-semibold leading-8">
              Xarxa PK/PD Intelligence Hub es una plataforma colaborativa de inteligencia clínica que ayuda a equipos hospitalarios multidisciplinares a optimizar terapias complejas mediante workflows PK/PD estructurados, agentes IA supervisados, validación humana y aprendizaje descentralizado de red.
            </p>
          </div>
          <div className="space-y-2.5">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7b3fa0]">Flujo de trabajo</p>
            {WORKFLOW_POINTS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3 rounded-xl border border-[#7b3fa0]/15 bg-[#faf6fd] px-4 py-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#7b3fa0]" />
                <p className="text-sm leading-6 text-[#152520]">{text}</p>
              </div>
            ))}
            <p className="mb-1 mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Sobre el prototipo</p>
            {PROTOTYPE_NOTES.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <p className="text-sm leading-6 text-[#4a7068]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
