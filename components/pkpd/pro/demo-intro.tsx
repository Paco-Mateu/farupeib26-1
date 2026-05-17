import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  Building2,
  ClipboardList,
  FilePenLine,
  Microscope,
  ShieldCheck,
  Stethoscope,
  Users2,
} from 'lucide-react'

const DEMO_STEPS = [
  {
    step: '01',
    title: 'Entrar por Bandeja IA',
    description:
      'Parte de un email clínico realista, deja que la IA lo lea, extraiga los datos útiles y detecte los gaps antes de que el equipo empiece a revisar.',
    href: '/?vista=bandeja',
    action: 'Abrir Bandeja IA',
  },
  {
    step: '02',
    title: 'Crear y abrir el caso',
    description:
      'Convierte la solicitud en un caso PK/PD vivo, con timeline, determinantes, tareas y trazas de agentes listas para validación humana.',
    href: '/?vista=casos',
    action: 'Ir a Casos PK/PD',
  },
  {
    step: '03',
    title: 'Orquestar el paquete clínico',
    description:
      'Haz visible cómo la plataforma prepara interpretación PK/PD, borrador de recomendación y borrador HCE sin quitar control al farmacéutico.',
    href: '/?vista=casos',
    action: 'Ver Case Cockpit',
  },
  {
    step: '04',
    title: 'Enseñar gobierno e impacto',
    description:
      'Cierra la demo en Agentes IA e Informes para mostrar trazabilidad, ahorro operativo y aprendizaje de red.',
    href: '/?vista=agentes',
    action: 'Abrir Agentes IA',
  },
]

const DIFFERENTIATORS = [
  {
    icon: ClipboardList,
    title: 'Gestión estructurada de casos',
    text: 'Cada consulta PK/PD deja de ser un email suelto y pasa a ser un caso trazable, asignable y revisable.',
  },
  {
    icon: Bot,
    title: 'Agentes IA supervisados',
    text: 'La IA lee, estructura, detecta gaps, prepara tareas, redacta borradores y deja una traza completa para revisión humana.',
  },
  {
    icon: Users2,
    title: 'Colaboración clínica real',
    text: 'Farmacia Hospitalaria, Digestivo, Enfermería y Laboratorio trabajan sobre el mismo objeto clínico y el mismo workflow.',
  },
  {
    icon: BrainCircuit,
    title: 'Inteligencia PK/PD aplicada',
    text: 'La plataforma no se presenta como calculadora; se presenta como capa operativa para decisiones complejas de exposición, respuesta y seguimiento.',
  },
]

const QUESTIONS = [
  '¿El paciente está recibiendo suficiente exposición?',
  '¿Faltan determinantes críticos antes de emitir una recomendación segura?',
  '¿Tiene sentido optimizar dosis, cambiar intervalo, cambiar mecanismo o simplemente confirmar el tratamiento?',
  '¿Qué debe quedar documentado en la historia clínica electrónica?',
  '¿Qué puede aprender la red a partir de este caso?',
]

export function DemoIntro() {
  return (
    <main className="min-h-screen bg-[#f7faf9] text-[#152520]">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center gap-3">
            <Image src="/brand/xarxapkpd.png" alt="Xarxa PK/PD" width={180} height={40} className="h-10 w-auto" />
            <span className="rounded-full bg-[#f1f8e6] px-3 py-1 text-xs font-semibold text-[#5a7820]">
              Programa activo: Crohn PK/PD
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-[#edf7f6] px-3 py-1 text-xs font-semibold text-[#1a6860]">
                Plataforma colaborativa de inteligencia clínica
              </span>
              <span className="rounded-full bg-[#f6f0fb] px-3 py-1 text-xs font-semibold text-[#7b3fa0]">
                Farmacia Hospitalaria + Digestivo + Enfermería + Laboratorio
              </span>
            </div>

            <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-[#152520]">
              Xarxa PK/PD Intelligence Hub convierte solicitudes fragmentadas en farmacoterapia de precisión colaborativa.
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-8 text-[#4a7068]">
              Esta demo presenta una plataforma clínica para optimización terapéutica basada en PK/PD. Empieza con Crohn como primer programa activo y está diseñada para crecer hacia nuevas especialidades, enfermedades, fármacos, determinantes, workflows y protocolos clínicos configurables.
            </p>

            <p className="mt-4 max-w-3xl text-base leading-8 text-[#4a7068]">
              La IA no sustituye el juicio experto. La IA lee solicitudes, estructura casos, detecta gaps, crea tareas, prepara interpretación PK/PD, redacta borradores de recomendación y genera notas HCE. La decisión final sigue siendo del profesional sanitario.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/?vista=bandeja"
                className="inline-flex items-center rounded-2xl bg-[#8dc63f] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#9fd44e]"
              >
                Iniciar demo guiada
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/?vista=casos"
                className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-[#152520] transition hover:border-slate-300 hover:bg-slate-50"
              >
                Entrar en la cola de casos
              </Link>
            </div>
          </div>

          <div className="rounded-[32px] border border-[#8dc63f]/20 bg-[#f0f7e3] p-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5a7820]">
              Qué hace especial esta demo
            </p>
            <div className="mt-5 space-y-4">
              <InfoRow icon={Stethoscope} title="No es una calculadora">
                Es una capa operativa para decisiones complejas de inicio, optimización, pérdida de respuesta, cambio de medicación, ratificación y desintensificación.
              </InfoRow>
              <InfoRow icon={Microscope} title="No es solo un gestor de casos">
                Cada caso vive como un objeto clínico con timeline, determinantes, gaps, actividad de agentes, recomendación y seguimiento.
              </InfoRow>
              <InfoRow icon={ShieldCheck} title="No es un chatbot aislado">
                Todo lo generado por IA queda auditado, revisable y sujeto a validación humana obligatoria.
              </InfoRow>
              <InfoRow icon={Building2} title="Sí es una plataforma de red">
                El valor no es solo resolver un caso. El valor es que la red aprenda y mejore a partir de cada caso validado.
              </InfoRow>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <div className="grid gap-4 lg:grid-cols-4">
          {DIFFERENTIATORS.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf7f6] text-[#1a6860]">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-base font-semibold text-[#152520]">{title}</h2>
              <p className="mt-2 text-sm leading-7 text-[#4a7068]">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4a7068]">
                Recorrido recomendado de la demo
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[#152520]">
                Guion para enseñar automatización, validación humana y aprendizaje de red
              </h2>
            </div>
            <Link
              href="/?vista=bandeja"
              className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-[#152520] transition hover:border-slate-300 hover:bg-white lg:inline-flex"
            >
              Entrar en la demo
            </Link>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {DEMO_STEPS.map((step) => (
              <Link
                key={step.step}
                href={step.href}
                className="group rounded-3xl border border-slate-200 bg-[#fbfcfb] p-6 transition hover:-translate-y-0.5 hover:border-[#8dc63f]/30 hover:bg-white hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-2xl bg-[#152520] px-3 py-1 text-xs font-semibold text-white">
                    Paso {step.step}
                  </span>
                  <ArrowRight className="h-4 w-4 text-[#4a7068] transition group-hover:text-[#8dc63f]" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[#152520]">{step.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[#4a7068]">{step.description}</p>
                <div className="mt-5 inline-flex rounded-2xl bg-[#f1f8e6] px-3 py-2 text-sm font-semibold text-[#5a7820]">
                  {step.action}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-14">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4a7068]">
              Narrativa de apertura
            </p>
            <p className="mt-4 text-base leading-8 text-[#4a7068]">
              Imagina que Digestivo envía un correo a Farmacia Hospitalaria para revisar un paciente con Crohn y sospecha de pérdida de respuesta a un biológico. Hoy esa solicitud puede llegar incompleta. Con Xarxa PK/PD, ese correo se convierte en un caso estructurado: la IA identifica el tipo de caso, detecta datos faltantes, crea tareas, valida si los determinantes son interpretables, prepara una interpretación PK/PD y deja un borrador para que el farmacéutico lo revise.
            </p>
            <p className="mt-4 text-base leading-8 text-[#4a7068]">
              El profesional sigue siendo el experto. La plataforma elimina fricción, mejora consistencia y convierte cada caso en una oportunidad de aprendizaje para toda la red.
            </p>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4a7068]">
              Preguntas que ayuda a responder
            </p>
            <div className="mt-5 space-y-3">
              {QUESTIONS.map((question) => (
                <div key={question} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-[#152520]">
                  {question}
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-[#8dc63f]/20 bg-[#f0f7e3] p-4">
              <p className="text-sm font-semibold text-[#152520]">
                Posicionamiento
              </p>
              <p className="mt-2 text-sm leading-7 text-[#4a7068]">
                Xarxa PK/PD Intelligence Hub es una plataforma colaborativa de inteligencia de casos que ayuda a equipos hospitalarios multidisciplinares a optimizar terapias complejas mediante workflows PK/PD estructurados, validación humana y aprendizaje de red.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function InfoRow({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Bot
  title: string
  children: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/80 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf7f6] text-[#1a6860]">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[#152520]">{title}</p>
        <p className="mt-1 text-sm leading-7 text-[#4a7068]">{children}</p>
      </div>
    </div>
  )
}
