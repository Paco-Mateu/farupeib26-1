import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  Award,
  Bot,
  BrainCircuit,
  Building2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Lightbulb,
  Microscope,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users2,
} from 'lucide-react'

const DIFFERENTIATORS = [
  {
    icon: Stethoscope,
    title: 'No es una calculadora',
    text:
      'Es una plataforma de soporte a la decisión farmacoterapéutica para escenarios complejos donde exposición, respuesta, biomarcadores, determinantes, historia terapéutica y criterio clínico deben analizarse de forma conjunta.',
  },
  {
    icon: ClipboardCheck,
    title: 'No es solo un gestor de casos',
    text:
      'Cada caso se convierte en un objeto clínico vivo, con timeline, determinantes, gaps, actividad de agentes, tareas, interpretación PK/PD, recomendación, informe y seguimiento.',
  },
  {
    icon: ShieldCheck,
    title: 'No es un chatbot aislado',
    text:
      'Los agentes IA trabajan dentro de un workflow clínico gobernado. Todo lo que generan queda trazado, revisable y sujeto a validación humana obligatoria.',
  },
  {
    icon: Building2,
    title: 'Sí es una plataforma de red',
    text:
      'El valor no está solo en resolver mejor un caso individual. El valor está en que distintos hospitales y profesionales puedan compartir conocimiento, aprender de casos validados y mejorar la práctica clínica de forma descentralizada.',
  },
]

const CAPABILITIES = [
  {
    icon: Users2,
    title: 'Inteligencia clínica colaborativa',
    text:
      'Farmacia Hospitalaria, Digestivo, Enfermería y Laboratorio trabajan sobre el mismo caso, con una visión compartida del contexto clínico, los determinantes, las tareas pendientes y el siguiente paso recomendado.',
  },
  {
    icon: BrainCircuit,
    title: 'Farmacia como consultoría experta',
    text:
      'La plataforma eleva el rol del farmacéutico hospitalario, ayudándole a aportar criterio especializado en decisiones terapéuticas complejas, no solo en validación o dispensación.',
  },
  {
    icon: Bot,
    title: 'Agentes IA supervisados',
    text:
      'La IA prepara el trabajo: lee, estructura, detecta gaps, genera tareas, ayuda a interpretar el caso y redacta borradores. El profesional revisa, ajusta, valida y decide.',
  },
  {
    icon: GraduationCap,
    title: 'Conocimiento descentralizado de red',
    text:
      'Cada hospital mantiene su contexto y su operativa, pero la red puede aprender de casos anonimizados, patrones clínicos, decisiones revisadas y resultados de seguimiento.',
  },
  {
    icon: Microscope,
    title: 'Inteligencia PK/PD aplicada',
    text:
      'La plataforma ayuda a responder preguntas críticas sobre exposición, respuesta, inmunogenicidad, optimización, cambio terapéutico, ratificación o desintensificación.',
  },
  {
    icon: FileText,
    title: 'Trazabilidad y gobierno clínico',
    text:
      'Cada dato, recomendación, tarea, validación e informe queda registrado con su fuente, estado, versión de protocolo y profesional responsable.',
  },
]

const DEMO_STEPS = [
  {
    step: '01',
    title: 'Entrar por Bandeja IA',
    description:
      'Parte de una solicitud clínica realista. La IA identifica el tipo de caso, extrae información útil, detecta gaps y propone las primeras tareas antes de que el equipo clínico empiece la revisión.',
    href: '/?vista=bandeja',
    action: 'Abrir Bandeja IA',
  },
  {
    step: '02',
    title: 'Crear y abrir el caso',
    description:
      'La solicitud se convierte en un caso PK/PD estructurado, con timeline, determinantes, estado del pipeline, profesionales implicados y trazas de agentes listas para validación humana.',
    href: '/?vista=casos',
    action: 'Ir a Casos PK/PD',
  },
  {
    step: '03',
    title: 'Revisar el Case Cockpit',
    description:
      'El equipo trabaja sobre una visión única del caso: datos clínicos, tratamiento, laboratorio, gaps, tareas, interpretación PK/PD, escenarios posibles, recomendación e informe HCE.',
    href: '/?vista=casos',
    action: 'Ver Case Cockpit',
  },
  {
    step: '04',
    title: 'Validar la recomendación',
    description:
      'El farmacéutico revisa la interpretación preparada por los agentes, ajusta el razonamiento si es necesario y genera una recomendación farmacoterapéutica trazable para discusión o registro clínico.',
    href: '/?vista=casos',
    action: 'Revisar recomendación',
  },
  {
    step: '05',
    title: 'Cerrar el ciclo de aprendizaje',
    description:
      'El caso queda vinculado a seguimiento, outcomes y aprendizaje de red. La plataforma no termina en la recomendación: acompaña el resultado y convierte cada caso validado en conocimiento compartible.',
    href: '/?vista=reporting',
    action: 'Abrir Informes y aprendizaje',
  },
]

const QUESTIONS = [
  '¿El paciente tiene una exposición adecuada al tratamiento?',
  '¿La pérdida de respuesta parece relacionada con baja exposición, inmunogenicidad o posible fallo farmacodinámico?',
  '¿Faltan determinantes críticos antes de emitir una recomendación segura?',
  '¿Tiene sentido optimizar dosis, cambiar intervalo, cambiar mecanismo, confirmar tratamiento o plantear desintensificación?',
  '¿Qué tareas debe realizar cada profesional para completar el caso?',
  '¿Qué debe quedar documentado en la historia clínica electrónica?',
  '¿Qué puede aprender la red a partir de este caso validado?',
]

const TAGLINES = [
  'Inteligencia colaborativa para farmacoterapia de precisión.',
  'Donde cada caso PK/PD se convierte en conocimiento de red.',
  'Farmacia Hospitalaria como motor de decisión clínica avanzada.',
]

const WHY_NOW = [
  {
    icon: BrainCircuit,
    title: 'La complejidad terapéutica exige más',
    text: 'Las decisiones sobre biológicos en Crohn requieren integrar exposición, respuesta, biomarcadores, inmunogenicidad e historia terapéutica. No puede resolverse con una calculadora ni con un correo.',
  },
  {
    icon: Stethoscope,
    title: 'Farmacia está evolucionando',
    text: 'El farmacéutico hospitalario está asumiendo un rol más consultivo, más clínico y más presente en la toma de decisiones. La plataforma amplifica ese papel de forma estructurada y trazable.',
  },
  {
    icon: Lightbulb,
    title: 'La IA hace posible lo que antes no era viable',
    text: 'La IA generativa y los agentes inteligentes permiten estructurar casos, detectar gaps, coordinar tareas y preparar interpretaciones en el tiempo real de la práctica clínica, sin aumentar la carga administrativa.',
  },
]

export function DemoIntro() {
  return (
    <main className="min-h-screen bg-[#f7faf9] text-[#152520]">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-wrap items-center gap-3">
            <Image src="/brand/xarxapkpd.png" alt="Xarxa PK/PD" width={180} height={40} className="h-10 w-auto" />
            <span className="rounded-full bg-[#edf7f6] px-3 py-1 text-xs font-semibold text-[#1a6860]">
              Plataforma colaborativa de inteligencia clínica PK/PD
            </span>
            <span className="rounded-full bg-[#f1f8e6] px-3 py-1 text-xs font-semibold text-[#5a7820]">
              Programa activo: Crohn PK/PD
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-[#edf7f6] px-3 py-1 text-xs font-semibold text-[#1a6860]">
                Farmacia Hospitalaria + Digestivo + Enfermería + Laboratorio
              </span>
              <span className="rounded-full bg-[#f6f0fb] px-3 py-1 text-xs font-semibold text-[#7b3fa0]">
                IA como capa de orquestación y preparación
              </span>
            </div>

            <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-[#4a7068]">
              La innovación sanitaria no empieza con la tecnología. Empieza con profesionales que identifican una necesidad real y se atreven a imaginar una forma mejor de trabajar.
            </p>

            <h1 className="mt-4 max-w-5xl text-4xl font-semibold tracking-tight text-[#152520]">
              Xarxa PK/PD Intelligence Hub materializa esa visión: una plataforma colaborativa donde cada caso de optimización terapéutica se convierte en conocimiento compartido, trazable y aumentado por IA.
            </h1>

            <p className="mt-5 max-w-4xl text-base leading-8 text-[#4a7068]">
              Nace del proyecto &quot;Cómo innovar en PK/PD desde la Farmacia Hospitalaria&quot;, liderado por la Dra. María Badia en la 10ª Jornada FARUPEIB, y desarrollado como prototipo conceptual por Francesc Mateu, Principal, Healthcare Industry Solutions at MongoDB.
            </p>

            <p className="mt-4 max-w-4xl text-base leading-8 text-[#4a7068]">
              En lugar de presentar la PK/PD como un cálculo aislado, la plataforma la convierte en una experiencia colaborativa: casos estructurados, agentes IA supervisados, tareas compartidas, interpretación PK/PD, validación humana, documentación clínica y aprendizaje de red.
            </p>

            <p className="mt-4 max-w-4xl text-base leading-8 text-[#4a7068]">
              La IA estructura, detecta gaps y prepara borradores. El farmacéutico hospitalario revisa, ajusta, valida y decide. La decisión final siempre permanece en manos del equipo clínico.
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
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 lg:hidden">
              La demo interactiva de Bandeja IA, Case Cockpit y Reporting está pensada para escritorio. Desde móvil puedes revisar esta introducción y abrir el entorno completo más tarde en un ordenador.
            </div>
          </div>

          <div className="overflow-hidden rounded-[32px] border border-[#7b3fa0]/15 bg-[#faf6fd] shadow-sm">
            <Image
              src="/brand/Jornades-FARUPEIB_14-05.png"
              alt="10ª Jornadas FARUPEIB Lazareto — Illa Llatzeret, Menorca"
              width={800}
              height={400}
              className="h-40 w-full object-cover"
            />
            <div className="p-8">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-[#7b3fa0]" />
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b3fa0]">
                Origen del prototipo
              </p>
            </div>
            <p className="mt-4 text-sm leading-7 text-[#4a7068]">
              Este prototipo surge de la actividad <strong className="text-[#152520]">Networking Lazareto, Proyectos de Innovación</strong>, celebrada en el marco de la <strong className="text-[#152520]">10ª Jornada FARUPEIB</strong>, con el patrocinio de AbbVie.
            </p>
            <p className="mt-3 text-sm leading-7 text-[#4a7068]">
              En la sesión se presentaron 14 proyectos de innovación sanitaria. El proyecto <strong className="text-[#152520]">&quot;Cómo innovar en PK/PD desde la Farmacia Hospitalaria&quot;</strong>, liderado por la{' '}
              <strong className="text-[#152520]">Dra. María Badia, Jefa del Servicio de Farmacia del Hospital Universitari de Bellvitge</strong>, fue seleccionado como proyecto ganador por su capacidad para impulsar una nueva forma de colaboración clínica en torno a la optimización terapéutica.
            </p>
            <p className="mt-3 text-sm leading-7 text-[#4a7068]">
              Como siguiente paso, <strong className="text-[#152520]">Francesc Mateu, Principal, Healthcare Industry Solutions at MongoDB</strong>, desarrolló este prototipo conceptual mostrando cómo la IA generativa, los agentes inteligentes y el desarrollo acelerado pueden convertir una visión clínica en una experiencia digital tangible.
            </p>
            <div className="mt-5 space-y-2">
              {TAGLINES.map((tagline) => (
                <div
                  key={tagline}
                  className="rounded-2xl border border-[#7b3fa0]/10 bg-white px-4 py-3 text-sm font-medium text-[#152520]"
                >
                  {tagline}
                </div>
              ))}
            </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <div className="grid gap-6 lg:grid-cols-3">
          {WHY_NOW.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf7f6] text-[#1a6860]">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-base font-semibold text-[#152520]">{title}</h2>
              <p className="mt-2 text-sm leading-7 text-[#4a7068]">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <div className="rounded-[32px] border border-[#8dc63f]/20 bg-[#f0f7e3] p-8 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#5a7820]" />
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5a7820]">
              Qué demuestra este prototipo
            </p>
          </div>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div>
              <p className="text-base leading-8 text-[#4a7068]">
                Este prototipo demuestra que una red de profesionales puede convertir la experiencia PK/PD en una plataforma colaborativa de conocimiento clínico, y que construir esa experiencia no requiere meses de desarrollo ni equipos técnicos grandes.
              </p>
              <p className="mt-4 text-base leading-8 text-[#4a7068]">
                Permite visualizar cómo una solicitud se transforma en un caso estructurado, cómo los agentes IA preparan el trabajo, cómo el farmacéutico valida y enriquece la recomendación, cómo el equipo multidisciplinar colabora sobre un mismo objeto clínico y cómo cada caso alimenta el aprendizaje de la red.
              </p>
            </div>
            <div className="space-y-3">
              {[
                'No es un producto final. Es una demostración de posibilidades.',
                'Una forma de hacer visible una visión y compartirla con equipos clínicos.',
                'Desarrollado en aproximadamente cinco horas como prototipo conceptual usando IA generativa, agentes inteligentes y desarrollo acelerado asistido por IA.',
                'La plataforma empieza con Crohn pero está diseñada para crecer a nuevas especialidades, enfermedades, fármacos y protocolos.',
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-[#8dc63f]/20 bg-white/80 px-4 py-3 text-sm leading-7 text-[#152520]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4a7068]">
            Qué hace especial esta demo
          </p>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {DIFFERENTIATORS.map(({ icon: Icon, title, text }) => (
              <InfoCard key={title} icon={Icon} title={title} text={text} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4a7068]">
            Capacidades clave
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {CAPABILITIES.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-3xl border border-slate-200 bg-[#fbfcfb] p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf7f6] text-[#1a6860]">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-base font-semibold text-[#152520]">{title}</h2>
                <p className="mt-2 text-sm leading-7 text-[#4a7068]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-10">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4a7068]">
                Recorrido recomendado de la demo
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[#152520]">
                Guion para enseñar colaboración, IA supervisada y aprendizaje de red
              </h2>
            </div>
            <Link
              href="/?vista=bandeja"
              className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-[#152520] transition hover:border-slate-300 hover:bg-white"
            >
              Entrar en la demo
            </Link>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-5">
            {DEMO_STEPS.map((step) => (
              <Link
                key={step.step}
                href={step.href}
                className="group rounded-3xl border border-slate-200 bg-[#fbfcfb] p-5 transition hover:-translate-y-0.5 hover:border-[#8dc63f]/30 hover:bg-white hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-2xl bg-[#152520] px-3 py-1 text-xs font-semibold text-white">
                    Paso {step.step}
                  </span>
                  <ArrowRight className="h-4 w-4 text-[#4a7068] transition group-hover:text-[#8dc63f]" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-[#152520]">{step.title}</h3>
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
              Imagina que un equipo de Digestivo quiere revisar un paciente con Crohn y sospecha de pérdida de respuesta a un biológico.
            </p>
            <p className="mt-4 text-base leading-8 text-[#4a7068]">
              En lugar de tratar la consulta como una petición aislada, Xarxa PK/PD Intelligence Hub la convierte en un caso clínico colaborativo. La IA identifica el contexto, estructura la información, detecta qué datos faltan, crea tareas para los profesionales adecuados, revisa si los determinantes son interpretables y prepara una primera lectura PK/PD para que Farmacia Hospitalaria pueda validarla.
            </p>
            <p className="mt-4 text-base leading-8 text-[#4a7068]">
              El farmacéutico no pierde protagonismo. Al contrario: gana una posición más visible como consultor experto en farmacoterapia de precisión.
            </p>
            <p className="mt-4 text-base leading-8 text-[#4a7068]">
              La plataforma ayuda a que cada decisión sea más estructurada, más trazable, más colaborativa y más útil para el aprendizaje de toda la red.
            </p>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4a7068]">
              Preguntas que ayuda a responder
            </p>
            <div className="mt-5 space-y-3">
              {QUESTIONS.map((question) => (
                <div
                  key={question}
                  className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm leading-7 text-[#152520]"
                >
                  {question}
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-[#8dc63f]/20 bg-[#f0f7e3] p-4">
              <p className="text-sm font-semibold text-[#152520]">Posicionamiento</p>
              <p className="mt-2 text-sm leading-7 text-[#4a7068]">
                Xarxa PK/PD Intelligence Hub es una plataforma colaborativa de inteligencia clínica que ayuda a equipos hospitalarios multidisciplinares a optimizar terapias complejas mediante workflows PK/PD estructurados, agentes IA supervisados, validación humana y aprendizaje descentralizado de red.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function InfoCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Bot
  title: string
  text: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-[#fbfcfb] p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#edf7f6] text-[#1a6860]">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[#152520]">{title}</p>
        <p className="mt-1 text-sm leading-7 text-[#4a7068]">{text}</p>
      </div>
    </div>
  )
}
