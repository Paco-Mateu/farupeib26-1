// Copy for components/pkpd/pro/demo-intro.tsx and components/pkpd/pro/demo-tabs.tsx
// es values are verbatim copies of the on-screen copy; ca is the Catalan translation.

import type { XarxaStringModule } from './index'

export const strings = {
  es: {
    'intro.disclaimer.label': 'Aviso importante:',
    'intro.disclaimer.body':
      'Este prototipo ha sido desarrollado exclusivamente para demostrar las capacidades actuales de la IA en el desarrollo acelerado de aplicaciones. El contenido clínico — workflows, interpretaciones PK/PD, recomendaciones y datos — puede contener errores y ',
    'intro.disclaimer.strong': 'no ha sido diseñado ni validado para uso clínico real',
    'intro.disclaimer.tail': '. No debe utilizarse para tomar decisiones terapéuticas.',
    'intro.badge': 'Plataforma colaborativa de inteligencia clínica PK/PD',
    'intro.h1':
      'Xarxa PK/PD es una plataforma colaborativa donde cada caso de optimización terapéutica se convierte en conocimiento compartido, trazable y aumentado por IA.',
    'intro.story.a': 'Nace del proyecto ',
    'intro.story.project': '"Cómo innovar en PK/PD desde la Farmacia Hospitalaria"',
    'intro.story.b':
      ', liderado por la Dra. María Badia desde 2025 en el Hospital Universitari de Bellvitge, presentado en la 10ª Jornada FARUPEIB y construido como prototipo conceptual para explorar cómo la IA generativa puede convertir una visión clínica en una experiencia digital tangible.',
    'intro.ai.a':
      'La IA estructura, detecta gaps y prepara borradores. El farmacéutico hospitalario revisa, ajusta, valida y decide. ',
    'intro.ai.strong': 'La decisión final siempre permanece en manos del equipo clínico.',
    'intro.cta.demo': 'Iniciar demo guiada',
    'intro.cta.queue': 'Entrar en la cola de casos',
    'intro.mobile.note':
      'La demo interactiva está pensada para escritorio. Desde móvil puedes revisar esta introducción y abrir el entorno completo más tarde en un ordenador.',
    'intro.alt.jornades': '10ª Jornadas FARUPEIB Lazareto — Illa Llatzeret, Menorca',
    'intro.ver.programa': 'Ver programa FARUPEIB 2026 ↗',
    'intro.origin.kicker': 'Origen del prototipo',
    'intro.origin.a': 'Este prototipo surge de la actividad ',
    'intro.origin.activity': 'Networking Lazareto, Proyectos de Innovación',
    'intro.origin.b': ', celebrada en el marco de la ',
    'intro.origin.jornada': '10ª Jornada FARUPEIB',
    'intro.origin.c': '.',
    'intro.origin.project.a': 'El proyecto ',
    'intro.origin.project.name': '"Cómo innovar en PK/PD desde la Farmacia Hospitalaria"',
    'intro.origin.project.b': ', liderado por la ',
    'intro.origin.project.leader': 'Dra. María Badia, Jefa del Servicio de Farmacia del Hospital Universitari de Bellvitge',
    'intro.origin.project.c': ', fue seleccionado como proyecto ganador.',
    'intro.credit.a': 'Prototipo desarrollado por ',
    'intro.credit.b': '.',
    'intro.explore.kicker': 'Explorar la demo',
    'intro.explore.title': 'Todo lo que verás, cuando lo necesites',
    'intro.explore.cta': 'Entrar en la demo',
    'demo.tab.highlights': 'Qué verás',
    'demo.tab.journey': 'Recorrido',
    'demo.tab.positioning': 'Posicionamiento',
    'demo.tab.nextsteps': 'Próximos pasos',
    'demo.highlight.entry.tag': 'Entrada inteligente',
    'demo.highlight.entry.title': 'Del email al caso estructurado',
    'demo.highlight.entry.text':
      'Un correo clínico se convierte automáticamente en un caso revisable, con campos sugeridos, highlights y validación humana antes de entrar al pipeline.',
    'demo.highlight.collab.tag': 'Colaboración multidisciplinar',
    'demo.highlight.collab.title': 'Un caso, varios especialistas',
    'demo.highlight.collab.text':
      'Farmacia, Digestivo, Enfermería y Laboratorio trabajan sobre el mismo caso con un siguiente paso compartido, trazas de agentes y decisiones documentadas.',
    'demo.highlight.trace.tag': 'Trazabilidad total',
    'demo.highlight.trace.title': 'Cada decisión queda registrada',
    'demo.highlight.trace.text':
      'Recomendación, borrador HCE, tareas y outcome quedan trazados como conocimiento reutilizable — no solo para el caso, sino para toda la red.',
    'demo.highlights.kicker': 'Tres capacidades clave',
    'demo.highlights.title': 'Lo que diferencia esta plataforma de una lista de tareas clínicas',
    'demo.cta.try': 'Probar la demo',
    'demo.journey.kicker': 'Flujo de trabajo',
    'demo.journey.title': 'Cinco pasos, desde el email hasta el cierre del caso',
    'demo.step.inbox.title': 'Bandeja IA',
    'demo.step.inbox.description':
      'Parte de una solicitud clínica realista. La IA identifica el tipo de caso, extrae información útil, detecta gaps y propone las primeras tareas antes de que el equipo empiece.',
    'demo.step.inbox.action': 'Abrir Bandeja IA',
    'demo.step.queue.title': 'Cola de casos PK/PD',
    'demo.step.queue.description':
      'La solicitud se convierte en un caso estructurado con timeline, determinantes, estado del pipeline, profesionales implicados y trazas de agentes listos para validación.',
    'demo.step.queue.action': 'Ir a Casos PK/PD',
    'demo.step.cockpit.title': 'Case Cockpit',
    'demo.step.cockpit.description':
      'El equipo trabaja sobre una visión única: datos clínicos, tratamiento, laboratorio, gaps, tareas, interpretación PK/PD, escenarios posibles, recomendación e informe HCE.',
    'demo.step.cockpit.action': 'Ver Case Cockpit',
    'demo.step.validation.title': 'Validación de la recomendación',
    'demo.step.validation.description':
      'El farmacéutico revisa la interpretación preparada por los agentes, ajusta el razonamiento si es necesario y genera una recomendación farmacoterapéutica trazable.',
    'demo.step.validation.action': 'Revisar recomendación',
    'demo.step.closure.title': 'Cierre del ciclo de aprendizaje',
    'demo.step.closure.description':
      'El caso queda vinculado a seguimiento, outcomes y aprendizaje de red. La plataforma acompaña el resultado y convierte cada caso validado en conocimiento compartible.',
    'demo.step.closure.action': 'Abrir Informes y aprendizaje',
    'demo.value.kicker': 'Propuesta de valor',
    'demo.value.text':
      'Xarxa PK/PD Intelligence Hub es una plataforma colaborativa de inteligencia clínica que ayuda a equipos hospitalarios multidisciplinares a optimizar terapias complejas mediante workflows PK/PD estructurados, agentes IA supervisados, validación humana y aprendizaje descentralizado de red.',
    'demo.workflow.kicker': 'Flujo de trabajo',
    'demo.workflow.email': 'El email se estructura con LLM y se revisa antes de crear el caso.',
    'demo.workflow.cockpit': 'El caso pasa a un cockpit clínico con validación humana campo a campo.',
    'demo.workflow.traced': 'La recomendación, la nota HCE y el outcome quedan trazados como conocimiento de red.',
    'demo.about.kicker': 'Sobre el prototipo',
    'demo.prototype.notProduct': 'No es un producto final. Es una demostración de posibilidades.',
    'demo.prototype.vision': 'Convierte una visión clínica en una experiencia tangible y compartible.',
    'demo.prototype.grow': 'Está pensado para crecer desde Crohn PK/PD hacia nuevos circuitos y especialidades.',
    'demo.context.kicker': 'Contexto importante',
    'demo.context.a': 'Este prototipo demuestra ',
    'demo.context.strong': 'posibilidades',
    'demo.context.b':
      ', no está preparado para producción. Llegar ahí requiere trabajo en dos dimensiones paralelas: infraestructura profesional y nuevas capacidades clínicas.',
    'demo.production.kicker': 'Para ir a producción',
    'demo.prod.auth.title': 'Autenticación y acceso',
    'demo.prod.auth.text':
      'Identidad federada con los sistemas hospitalarios, roles clínicos, SSO y auditoría de acceso conforme a normativa sanitaria.',
    'demo.prod.multitenant.title': 'Multi-tenancy y centros',
    'demo.prod.multitenant.text':
      'Aislamiento de datos por hospital y programa terapéutico, con gobernanza por red y posibilidad de compartir conocimiento de forma controlada.',
    'demo.prod.security.title': 'Seguridad y cumplimiento',
    'demo.prod.security.text':
      'Cifrado en tránsito y en reposo, trazabilidad de agentes IA, cumplimiento RGPD/LOPDGDD y preparación para certificación como producto sanitario.',
    'demo.knowledge.kicker': 'De casos a conocimiento',
    'demo.knowledge.text':
      'Cada caso validado es un dato estructurado. La visión es convertir esta colección en una base de conocimiento clínico consultable: a través de un copiloto conversacional y a través de consultas estructuradas sobre cohortes, efectos y patrones terapéuticos.',
    'demo.next.kicker': 'Próximas capacidades',
    'demo.cap.cohorts.title': 'Aprendizaje sobre cohortes',
    'demo.cap.cohorts.text':
      'Identificar patrones entre pacientes con perfiles similares: qué fármacos funcionan mejor, en qué rangos de dosis, con qué respuestas clínicas. La red aprende de sí misma.',
    'demo.cap.effects.title': 'Aprendizaje sobre efectos',
    'demo.cap.effects.text':
      'Correlacionar niveles PK/PD con outcomes reales: respuesta clínica, eventos adversos, tiempo hasta remisión. Cada cierre de caso alimenta el modelo de conocimiento.',
    'demo.cap.integration.title': 'Integración con sistemas',
    'demo.cap.integration.text':
      'Conectar con HIS, LIS y HCE de forma síncrona (determinantes en tiempo real) o asíncrona (importación por batch), según las posibilidades de cada centro.',
    'demo.cap.cocreation.title': 'Interacción y co-creación',
    'demo.cap.cocreation.text':
      'Posibilidades de opinión, preguntas y protocolos por programa terapéutico. Conversaciones entre especialistas, decisiones compartidas y co-creación de guías clínicas sobre los datos reales de la red.',
  },
  ca: {
    'intro.disclaimer.label': 'Avís important:',
    'intro.disclaimer.body':
      "Aquest prototip s'ha desenvolupat exclusivament per demostrar les capacitats actuals de la IA en el desenvolupament accelerat d'aplicacions. El contingut clínic — fluxos de treball, interpretacions PK/PD, recomanacions i dades — pot contenir errors i ",
    'intro.disclaimer.strong': 'no ha estat dissenyat ni validat per a ús clínic real',
    'intro.disclaimer.tail': ". No s'ha d'utilitzar per prendre decisions terapèutiques.",
    'intro.badge': "Plataforma col·laborativa d'intel·ligència clínica PK/PD",
    'intro.h1':
      "Xarxa PK/PD és una plataforma col·laborativa on cada cas d'optimització terapèutica es converteix en coneixement compartit, traçable i augmentat per IA.",
    'intro.story.a': 'Neix del projecte ',
    'intro.story.project': '"Com innovar en PK/PD des de la Farmàcia Hospitalària"',
    'intro.story.b':
      ", liderat per la Dra. María Badia des del 2025 a l'Hospital Universitari de Bellvitge, presentat a la 10a Jornada FARUPEIB i construït com a prototip conceptual per explorar com la IA generativa pot convertir una visió clínica en una experiència digital tangible.",
    'intro.ai.a':
      'La IA estructure, detecta gaps i prepara esborranys. El farmacèutic hospitalari revisa, ajusta, valida i decideix. ',
    'intro.ai.strong': "La decisió final sempre queda en mans de l'equip clínic.",
    'intro.cta.demo': 'Inicia la demo guiada',
    'intro.cta.queue': 'Entra a la cua de casos',
    'intro.mobile.note':
      "La demo interactiva està pensada per a escriptori. Des del mòbil pots revisar aquesta introducció i obrir l'entorn complet més tard en un ordinador.",
    'intro.alt.jornades': '10a Jornades FARUPEIB Lazareto — Illa Llatzeret, Menorca',
    'intro.ver.programa': 'Veure el programa FARUPEIB 2026 ↗',
    'intro.origin.kicker': 'Origen del prototip',
    'intro.origin.a': "Aquest prototip sorgeix de l'activitat ",
    'intro.origin.activity': "Networking Lazareto, Projectes d'Innovació",
    'intro.origin.b': ', celebrada en el marc de la ',
    'intro.origin.jornada': '10a Jornada FARUPEIB',
    'intro.origin.c': '.',
    'intro.origin.project.a': 'El projecte ',
    'intro.origin.project.name': '"Com innovar en PK/PD des de la Farmàcia Hospitalària"',
    'intro.origin.project.b': ', liderat per la ',
    'intro.origin.project.leader': "Dra. María Badia, Cap del Servei de Farmàcia de l'Hospital Universitari de Bellvitge",
    'intro.origin.project.c': ', va ser seleccionat com a projecte guanyador.',
    'intro.credit.a': 'Prototip desenvolupat per ',
    'intro.credit.b': '.',
    'intro.explore.kicker': 'Explora la demo',
    'intro.explore.title': 'Tot el que veuràs, quan ho necessitis',
    'intro.explore.cta': 'Entra a la demo',
    'demo.tab.highlights': 'Què veuràs',
    'demo.tab.journey': 'Recorregut',
    'demo.tab.positioning': 'Posicionament',
    'demo.tab.nextsteps': 'Propers passos',
    'demo.highlight.entry.tag': 'Entrada intel·ligent',
    'demo.highlight.entry.title': "Del correu al cas estructurat",
    'demo.highlight.entry.text':
      "Un correu clínic es converteix automàticament en un cas revisable, amb camps suggerits, highlights i validació humana abans d'entrar al pipeline.",
    'demo.highlight.collab.tag': 'Col·laboració multidisciplinar',
    'demo.highlight.collab.title': 'Un cas, diversos especialistes',
    'demo.highlight.collab.text':
      "Farmàcia, Digestiu, Infermeria i Laboratori treballen sobre el mateix cas amb un següent pas compartit, traçes d'agents i decisions documentades.",
    'demo.highlight.trace.tag': 'Traçabilitat total',
    'demo.highlight.trace.title': 'Cada decisió queda registrada',
    'demo.highlight.trace.text':
      'Recomanació, esborrany HCE, tasques i outcome queden traçats com a coneixement reutilitzable — no només per al cas, sinó per a tota la xarxa.',
    'demo.highlights.kicker': 'Tres capacitats clau',
    "demo.highlights.title": "El que diferencia aquesta plataforma d'una llista de tasques clíniques",
    'demo.cta.try': 'Prova la demo',
    'demo.journey.kicker': 'Flux de treball',
    'demo.journey.title': "Cinc passos, des del correu fins al tancament del cas",
    'demo.step.inbox.title': 'Bandeja IA',
    'demo.step.inbox.description':
      "Parteix d'una sol·licitud clínica realista. La IA identifica el tipus de cas, extreu informació útil, detecta gaps i proposa les primeres tasques abans que l'equip comenci.",
    'demo.step.inbox.action': 'Obre la Bandeja IA',
    'demo.step.queue.title': 'Cua de casos PK/PD',
    'demo.step.queue.description':
      "La sol·licitud es converteix en un cas estructurat amb línia temporal, determinants, estat del pipeline, professionals implicats i traçes d'agents a punt per a la validació.",
    'demo.step.queue.action': 'Vés a Casos PK/PD',
    'demo.step.cockpit.title': 'Case Cockpit',
    'demo.step.cockpit.description':
      "L'equip treballa sobre una visió única: dades clíniques, tractament, laboratori, gaps, tasques, interpretació PK/PD, escenaris possibles, recomanació i informe HCE.",
    'demo.step.cockpit.action': 'Veure el Case Cockpit',
    'demo.step.validation.title': 'Validació de la recomanació',
    'demo.step.validation.description':
      'El farmacèutic revisa la interpretació preparada pels agents, ajusta el raonament si cal i genera una recomanació farmacoterapèutica traçable.',
    'demo.step.validation.action': 'Revisa la recomanació',
    "demo.step.closure.title": "Tancament del cicle d'aprenentatge",
    'demo.step.closure.description':
      "El cas queda vinculat al seguiment, als outcomes i a l'aprenentatge de xarxa. La plataforma acompanya el resultat i converteix cada cas validat en coneixement compartible.",
    'demo.step.closure.action': "Obre Informes i aprenentatge",
    'demo.value.kicker': 'Proposta de valor',
    'demo.value.text':
      "Xarxa PK/PD Intelligence Hub és una plataforma col·laborativa d'intel·ligència clínica que ajuda equips hospitalaris multidisciplinars a optimitzar teràpies complexes mitjançant fluxos de treball PK/PD estructurats, agents IA supervisats, validació humana i aprenentatge descentralitzat de xarxa.",
    'demo.workflow.kicker': 'Flux de treball',
    "demo.workflow.email": "El correu s'estructura amb LLM i es revisa abans de crear el cas.",
    'demo.workflow.cockpit': 'El cas passa a un cockpit clínic amb validació humana camp a camp.',
    'demo.workflow.traced': "La recomanació, la nota HCE i l'outcome queden traçats com a coneixement de xarxa.",
    'demo.about.kicker': 'Sobre el prototip',
    'demo.prototype.notProduct': 'No és un producte final. És una demostració de possibilitats.',
    'demo.prototype.vision': "Converteix una visió clínica en una experiència tangible i compartible.",
    'demo.prototype.grow': 'Està pensat per créixer des del Crohn PK/PD cap a nous circuits i especialitats.',
    'demo.context.kicker': 'Context important',
    'demo.context.a': 'Aquest prototip demostra ',
    'demo.context.strong': 'possibilitats',
    'demo.context.b':
      ", no està preparat per a producció. Arribar-hi requereix treball en dues dimensions paral·leles: infraestructura professional i noves capacitats clíniques.",
    'demo.production.kicker': 'Per anar a producció',
    'demo.prod.auth.title': 'Autenticació i accés',
    'demo.prod.auth.text':
      "Identitat federada amb els sistemes hospitalaris, rols clínics, SSO i auditoria d'accés conforme a la normativa sanitària.",
    'demo.prod.multitenant.title': 'Multi-tenancy i centres',
    'demo.prod.multitenant.text':
      "Aïllament de dades per hospital i programa terapèutic, amb governança per xarxa i possibilitat de compartir coneixement de forma controlada.",
    'demo.prod.security.title': 'Seguretat i compliment',
    'demo.prod.security.text':
      "Xifratge en trànsit i en repòs, traçabilitat d'agents IA, compliment del RGPD/LOPDGDD i preparació per a la certificació com a producte sanitari.",
    'demo.knowledge.kicker': 'De casos a coneixement',
    'demo.knowledge.text':
      "Cada cas validat és una dada estructurada. La visió és convertir aquesta col·lecció en una base de coneixement clínic consultable: a través d'un copiloto conversacional i a través de consultes estructurades sobre cohortes, efectes i patrons terapèutics.",
    'demo.next.kicker': 'Properes capacitats',
    'demo.cap.cohorts.title': "Aprenentatge sobre cohortes",
    'demo.cap.cohorts.text':
      "Identificar patrons entre pacients amb perfils similars: quins fàrmacs funcionen millor, en quins rangs de dosi, amb quines respostes clíniques. La xarxa aprèn d'ella mateixa.",
    'demo.cap.effects.title': "Aprenentatge sobre efectes",
    'demo.cap.effects.text':
      'Correlacionar nivells PK/PD amb outcomes reals: resposta clínica, esdeveniments adversos, temps fins a la remissió. Cada tancament de cas alimenta el model de coneixement.',
    'demo.cap.integration.title': 'Integració amb sistemes',
    'demo.cap.integration.text':
      "Connectar amb HIS, LIS i HCE de forma síncrona (determinants en temps real) o asíncrona (importació per lots), segons les possibilitats de cada centre.",
    'demo.cap.cocreation.title': 'Interacció i co-creació',
    'demo.cap.cocreation.text':
      "Possibilitats d'opinió, preguntes i protocols per programa terapèutic. Converses entre especialistes, decisions compartides i co-creació de guies clíniques sobre les dades reals de la xarxa.",
  },
} satisfies XarxaStringModule
