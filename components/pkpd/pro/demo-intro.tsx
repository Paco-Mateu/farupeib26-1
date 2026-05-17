import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Award } from 'lucide-react'

import { DemoTabs } from '@/components/pkpd/pro/demo-tabs'

export function DemoIntro() {
  return (
    <main className="min-h-screen bg-white text-[#152520]">
      {/* Clinical disclaimer */}
      <div className="border-b border-amber-200 bg-amber-50 px-6 py-3">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs leading-relaxed text-amber-800">
            <strong>Aviso importante:</strong> Este prototipo ha sido desarrollado exclusivamente para demostrar las capacidades actuales de la IA en el desarrollo acelerado de aplicaciones. El contenido clínico — workflows, interpretaciones PK/PD, recomendaciones y datos — puede contener errores y <strong>no ha sido diseñado ni validado para uso clínico real</strong>. No debe utilizarse para tomar decisiones terapéuticas.
          </p>
        </div>
      </div>

      {/* Nav bar */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-wrap items-center gap-3">
            <Image src="/brand/xarxapkpd.png" alt="Xarxa PK/PD" width={180} height={42} style={{ width: 'auto', height: '42px' }} />
            <span className="rounded-full bg-[#f3ebfa] px-3 py-1 text-xs font-semibold text-[#7b3fa0]">
              Plataforma colaborativa de inteligencia clínica PK/PD
            </span>
          </div>
        </div>
      </section>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="max-w-5xl text-4xl font-semibold tracking-tight text-[#152520]">
              Xarxa PK/PD es una plataforma colaborativa donde cada caso de optimización terapéutica se convierte en conocimiento compartido, trazable y aumentado por IA.
            </h1>
            <p className="mt-5 max-w-4xl text-base leading-8 text-[#4a7068]">
              Nace del proyecto <em>&quot;Cómo innovar en PK/PD desde la Farmacia Hospitalaria&quot;</em>, liderado por la Dra. María Badia desde 2025 en el Hospital Universitari de Bellvitge, presentado en la 10ª Jornada FARUPEIB y construido como prototipo conceptual para explorar cómo la IA generativa puede convertir una visión clínica en una experiencia digital tangible.
            </p>
            <p className="mt-4 max-w-4xl text-base leading-8 text-[#4a7068]">
              La IA estructura, detecta gaps y prepara borradores. El farmacéutico hospitalario revisa, ajusta, valida y decide. <strong className="text-[#152520]">La decisión final siempre permanece en manos del equipo clínico.</strong>
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/?vista=bandeja"
                className="inline-flex items-center rounded-2xl bg-[#7b3fa0] px-5 py-3 text-sm font-semibold text-white! shadow-sm transition hover:bg-[#6a3490]"
              >
                Iniciar demo guiada
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/?vista=casos"
                className="inline-flex items-center rounded-2xl border border-[#7b3fa0] bg-white px-5 py-3 text-sm font-semibold text-[#7b3fa0] transition hover:border-[#6a3490] hover:bg-[#faf6fd] hover:text-[#6a3490]"
              >
                Entrar en la cola de casos
              </Link>
            </div>
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 lg:hidden">
              La demo interactiva está pensada para escritorio. Desde móvil puedes revisar esta introducción y abrir el entorno completo más tarde en un ordenador.
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
                alt="10ª Jornadas FARUPEIB Lazareto — Illa Llatzeret, Menorca"
                width={800}
                height={400}
                className="h-40 w-full object-cover transition group-hover:brightness-90"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                <span className="rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                  Ver programa FARUPEIB 2026 ↗
                </span>
              </div>
            </a>
            <div className="p-8">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-[#7b3fa0]" />
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b3fa0]">
                  Origen del prototipo
                </p>
              </div>
              <p className="mt-4 text-sm leading-7 text-[#4a7068]">
                Este prototipo surge de la actividad <strong className="text-[#152520]">Networking Lazareto, Proyectos de Innovación</strong>, celebrada en el marco de la <strong className="text-[#152520]">10ª Jornada FARUPEIB</strong>.
              </p>
              <p className="mt-3 text-sm leading-7 text-[#4a7068]">
                El proyecto <strong className="text-[#152520]">&quot;Cómo innovar en PK/PD desde la Farmacia Hospitalaria&quot;</strong>, liderado por la <strong className="text-[#152520]">Dra. María Badia, Jefa del Servicio de Farmacia del Hospital Universitari de Bellvitge</strong>, fue seleccionado como proyecto ganador.
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
                Prototipo desarrollado por <strong className="text-[#152520]">Francesc Mateu, Field CTO, Healthcare at MongoDB</strong>.
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
                Explorar la demo
              </p>
              <h2 className="mt-1.5 text-2xl font-semibold text-[#152520]">
                Todo lo que verás, cuando lo necesites
              </h2>
            </div>
            <Link
              href="/?vista=bandeja"
              className="inline-flex items-center rounded-2xl bg-[#7b3fa0] px-4 py-2.5 text-sm font-semibold text-white! transition hover:bg-[#6a3490]"
            >
              Entrar en la demo
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
