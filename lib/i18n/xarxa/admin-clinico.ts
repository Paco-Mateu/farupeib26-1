// Copy for components/pkpd/pro/views/admin-clinico.tsx
// es values are verbatim copies of the on-screen copy; ca is the Catalan translation.

import type { XarxaStringModule } from './index'

export const strings = {
  es: {
    // Wizard steps
    'wizard.basics.label': 'Base clínica',
    'wizard.basics.description': 'Nombre, especialidad, estado y versión del programa.',
    'wizard.scope.label': 'Alcance',
    'wizard.scope.description': 'Indicaciones, tipos de caso y política de compartición.',
    'wizard.therapy.label': 'Terapia y determinantes',
    'wizard.therapy.description': 'Fármacos y variables clínicas que alimentan el circuito.',
    'wizard.workflow.label': 'Workflow',
    'wizard.workflow.description': 'Etapas del pipeline y formularios asociados al programa.',
    'wizard.review.label': 'Revisión final',
    'wizard.review.description': 'Resumen listo para guardar o publicar en red.',

    // Notices and errors
    'notice.nuevoPrograma': 'Nuevo programa clínico en edición. Puedes configurarlo y guardarlo como borrador.',
    'notice.guardado': 'Configuración clínica guardada correctamente.',
    'notice.creado': 'Programa clínico creado como borrador.',
    'notice.publicado': 'Programa publicado con nueva versión. Ya puede usarse como circuito clínico activo.',
    'error.cargarConfig': 'No se ha podido cargar la configuración clínica.',
    'error.guardar': 'No se ha podido guardar el programa clínico.',
    'error.publicar': 'No se ha podido publicar el programa clínico.',
    'error.titulo': 'No se ha podido cargar Admin clínico.',

    // Loading and empty states
    'loading.titulo': 'Cargando administración clínica…',
    'loading.detalle': 'Recuperando programas, formularios y configuración del workflow.',
    'empty.titulo': 'No hay programas clínicos configurados.',
    'empty.detalle': 'Crea un programa base para activar un circuito PK/PD o ampliar la plataforma a nuevas especialidades.',
    'empty.accion': 'Crear programa clínico',

    // Header
    'header.badge': 'Admin clínico',
    'header.titulo': 'Configuración de programas clínicos',
    'header.subtitulo':
      'Cada programa define el circuito completo: especialidad, enfermedades, fármacos, determinantes, tipos de caso y reglas de compartición entre centros.',

    // Summary cards
    'summary.activos': 'Programas activos',
    'summary.activos.nota': 'Circuitos listos para uso',
    'summary.borradores': 'Borradores',
    'summary.borradores.nota': 'Expansiones en preparación',
    'summary.especialidades': 'Especialidades',
    'summary.especialidades.nota': 'Áreas clínicas configurables',
    'summary.formularios': 'Formularios',
    'summary.formularios.nota': 'Entradas estructuradas disponibles',

    // Program list
    'lista.titulo': 'Programas clínicos',
    'lista.subtitulo': 'Base activa + expansión multi-especialidad',
    'lista.nuevo': 'Nuevo programa',

    // Panel header
    'panel.titulo': 'Configuración del programa',
    'panel.sinNombre': 'Nuevo programa clínico',
    'panel.subtitulo': 'Configura el alcance clínico y el flujo de trabajo con un recorrido paso a paso.',
    'accion.guardarCambios': 'Guardar cambios',
    'accion.publicarVersion': 'Publicar versión',

    // Wizard navigation
    'wizard.paso': 'Paso {current} de {total}',
    'nav.anterior': 'Anterior',
    'nav.siguiente': 'Siguiente paso',

    // Review metrics
    'label.indicaciones': 'Indicaciones',
    'metric.indicaciones.nota': 'Enfermedades o situaciones clínicas cubiertas',
    'label.tiposCaso': 'Tipos de caso',
    'metric.tiposCaso.nota': 'Escenarios configurados en el circuito',
    'label.farmacos': 'Fármacos',
    'metric.farmacos.nota': 'Terapias contempladas por el programa',
    'label.determinantes': 'Determinantes',
    'metric.determinantes.nota': 'Variables PK/PD y biomarcadores utilizados',
    'metric.etapas.label': 'Etapas',
    'metric.etapas.nota': 'Pasos del pipeline clínico y operativo',
    'metric.formularios.label': 'Formularios',
    'metric.formularios.nota': 'Entradas estructuradas asociadas al programa',
    'metric.fuentes.label': 'Fuentes',
    'metric.fuentes.nota': 'Referencias documentales enlazadas al programa',

    // Basics step
    'basics.titulo': 'Identidad y gobierno del programa',
    'basics.subtitulo': 'Define cómo se presentará este circuito dentro de la red y en qué estado de gobierno se encuentra.',
    'label.programa': 'Programa',
    'label.especialidad': 'Especialidad',
    'label.estado': 'Estado',
    'label.version': 'Versión',
    'label.tituloProtocolo': 'Título del protocolo',
    'label.ultimaRevision': 'Última revisión',
    'label.resumen': 'Resumen protocolario',
    'hint.resumen': 'Qué cubre este protocolo y cómo debe usarse dentro del circuito.',

    // Scope step
    'scope.titulo': 'Alcance clínico y compartición',
    'scope.subtitulo':
      'Describe qué enfermedad cubre el programa, qué tipos de caso va a recibir y cómo comparte conocimiento con la red.',
    'label.enfermedades': 'Enfermedades o indicaciones',
    'hint.enfermedades': 'Una por línea o separadas por coma.',
    'hint.tiposCaso': 'Debutante, pérdida de respuesta, cambio, desintensificación…',
    'label.politica': 'Política de compartición',
    'hint.politica': 'Define cómo comparte conocimiento este programa dentro de la red.',
    'label.alineamiento': 'Alineamiento y gobierno',
    'hint.alineamiento':
      'Ejemplo: alineado con protocolo local y fuentes SEFH / literatura, con validación farmacéutica y médica obligatoria.',

    // Therapy step
    'therapy.titulo': 'Terapias, determinantes y biomarcadores',
    'therapy.subtitulo':
      'Configura la base farmacoterapéutica y analítica que luego utilizarán los casos, formularios y agentes IA.',
    'hint.farmacos': 'Ejemplo: infliximab, adalimumab, ustekinumab.',
    'hint.determinantes': 'Determinantes PK/PD y biomarcadores utilizados en el circuito.',
    'label.semantica': 'Semántica clínica',
    'hint.semantica': 'Una categoría por línea. Se usará para que el cockpit hable con el mismo lenguaje que el protocolo.',

    // Workflow step
    'workflowStep.titulo': 'Workflow clínico y formularios asociados',
    'workflowStep.subtitulo':
      'Ajusta el pipeline y revisa qué formularios ya están preparados para soportar este programa en producción.',
    'label.workflowClinico': 'Workflow clínico',
    'hint.workflowClinico': 'Define aquí las etapas del pipeline. Una etapa por línea.',
    'formularios.titulo': 'Formularios asociados',
    'formularios.secciones': '{count} secciones configuradas',
    'formularios.vacio':
      'No hay formularios asociados todavía. Puedes seguir editando el circuito y añadir formularios en una siguiente iteración.',
    'label.fuentes': 'Fuentes y referencias',
    'hint.fuentes': 'Una por línea con formato: Etiqueta | URL',

    // Review step
    'review.titulo': 'Revisión final antes de guardar o publicar',
    'review.subtitulo':
      'Verifica el resumen del circuito. Esta vista es la que deja claro que Crohn es el primer programa activo, pero no el único posible.',
    'review.sinNombre': 'Sin nombre todavía',
    'review.pendienteDefinir': 'Pendiente de definir',
    'review.sinVersion': 'Sin versión',
    'review.sinIndicaciones': 'Sin indicaciones configuradas',
    'review.sinTiposCaso': 'Sin tipos de caso configurados',
    'review.sinTerapias': 'Sin terapias configuradas',
    'review.sinDeterminantes': 'Sin determinantes configurados',
    'review.etapasTitulo': 'Etapas del workflow',
    'review.sinEtapas': 'No se han definido etapas todavía.',
    'review.sinFormularios': 'No hay formularios asociados a este programa.',
    'review.sinPolitica': 'Sin política de compartición definida',
    'review.protocoloActivo': 'Protocolo activo',
    'review.sinTituloProtocolo': 'Sin título protocolario definido',
    'review.sinFechaRevision': 'Sin fecha de revisión',
    'review.alineamiento': 'Alineamiento',
    'review.sinAlineamiento': 'Sin marco de alineamiento definido',
    'review.sinResumen': 'Sin resumen protocolario',
    'review.sinSemantica': 'No se ha definido semántica clínica todavía.',
    'review.fuentesTitulo': 'Fuentes documentales',
    'review.sinFuentes': 'No hay referencias enlazadas todavía.',

    // Next movement panel
    'next.titulo': 'Siguiente movimiento recomendado',
    'next.review': 'Guardar el borrador o publicar una nueva versión para que el circuito quede listo para la red.',
    'next.paso': 'Completa este paso y avanza para dejar el programa listo para operar de forma multi-especialidad.',

    // Right sidebar
    'wizard.estadoTitulo': 'Estado del wizard',
    'resumen.ejecutivo': 'Resumen ejecutivo',
    'acciones.titulo': 'Acciones',
    'accion.guardarBorrador': 'Guardar borrador',
    'acciones.nota':
      'Este asistente permite configurar nuevas especialidades y circuitos clínicos sin necesidad de desarrollo adicional.',
  },
  ca: {
    // Wizard steps
    'wizard.basics.label': 'Base clínica',
    'wizard.basics.description': 'Nom, especialitat, estat i versió del programa.',
    'wizard.scope.label': 'Abast',
    'wizard.scope.description': 'Indicacions, tipus de cas i política de compartició.',
    'wizard.therapy.label': 'Teràpia i determinants',
    'wizard.therapy.description': 'Fàrmacs i variables clíniques que alimenten el circuit.',
    'wizard.workflow.label': 'Flux de treball',
    'wizard.workflow.description': 'Etapes del pipeline i formularis associats al programa.',
    'wizard.review.label': 'Revisió final',
    'wizard.review.description': 'Resum llest per desar o publicar a la xarxa.',

    // Notices and errors
    'notice.nuevoPrograma': 'Nou programa clínic en edició. El pots configurar i desar com a esborrany.',
    'notice.guardado': 'Configuració clínica desada correctament.',
    'notice.creado': 'Programa clínic creat com a esborrany.',
    'notice.publicado': 'Programa publicat amb una versió nova. Ja es pot fer servir com a circuit clínic actiu.',
    'error.cargarConfig': 'No s’ha pogut carregar la configuració clínica.',
    'error.guardar': 'No s’ha pogut desar el programa clínic.',
    'error.publicar': 'No s’ha pogut publicar el programa clínic.',
    'error.titulo': 'No s’ha pogut carregar Admin clínic.',

    // Loading and empty states
    'loading.titulo': 'Carregant l’administració clínica…',
    'loading.detalle': 'Recuperant programes, formularis i configuració del flux de treball.',
    'empty.titulo': 'No hi ha programes clínics configurats.',
    'empty.detalle': 'Crea un programa base per activar un circuit PK/PD o ampliar la plataforma a noves especialitats.',
    'empty.accion': 'Crear programa clínic',

    // Header
    'header.badge': 'Admin clínic',
    'header.titulo': 'Configuració de programes clínics',
    'header.subtitulo':
      'Cada programa defineix el circuit complet: especialitat, malalties, fàrmacs, determinants, tipus de cas i regles de compartició entre centres.',

    // Summary cards
    'summary.activos': 'Programes actius',
    'summary.activos.nota': 'Circuits llestos per fer servir',
    'summary.borradores': 'Esborranys',
    'summary.borradores.nota': 'Expansions en preparació',
    'summary.especialidades': 'Especialitats',
    'summary.especialidades.nota': 'Àrees clíniques configurables',
    'summary.formularios': 'Formularis',
    'summary.formularios.nota': 'Entrades estructurades disponibles',

    // Program list
    'lista.titulo': 'Programes clínics',
    'lista.subtitulo': 'Base activa + expansió multi-especialitat',
    'lista.nuevo': 'Nou programa',

    // Panel header
    'panel.titulo': 'Configuració del programa',
    'panel.sinNombre': 'Nou programa clínic',
    'panel.subtitulo': 'Configura l’abast clínic i el flux de treball amb un recorregut pas a pas.',
    'accion.guardarCambios': 'Desa els canvis',
    'accion.publicarVersion': 'Publica la versió',

    // Wizard navigation
    'wizard.paso': 'Pas {current} de {total}',
    'nav.anterior': 'Anterior',
    'nav.siguiente': 'Pas següent',

    // Review metrics
    'label.indicaciones': 'Indicacions',
    'metric.indicaciones.nota': 'Malalties o situacions clíniques cobertes',
    'label.tiposCaso': 'Tipus de cas',
    'metric.tiposCaso.nota': 'Escenaris configurats al circuit',
    'label.farmacos': 'Fàrmacs',
    'metric.farmacos.nota': 'Teràpies contemplades pel programa',
    'label.determinantes': 'Determinants',
    'metric.determinantes.nota': 'Variables PK/PD i biomarcadors utilitzats',
    'metric.etapas.label': 'Etapes',
    'metric.etapas.nota': 'Passos del pipeline clínic i operatiu',
    'metric.formularios.label': 'Formularis',
    'metric.formularios.nota': 'Entrades estructurades associades al programa',
    'metric.fuentes.label': 'Fonts',
    'metric.fuentes.nota': 'Referències documentals enllaçades al programa',

    // Basics step
    'basics.titulo': 'Identitat i govern del programa',
    'basics.subtitulo': 'Defineix com es presentarà aquest circuit dins de la xarxa i en quin estat de govern es troba.',
    'label.programa': 'Programa',
    'label.especialidad': 'Especialitat',
    'label.estado': 'Estat',
    'label.version': 'Versió',
    'label.tituloProtocolo': 'Títol del protocol',
    'label.ultimaRevision': 'Última revisió',
    'label.resumen': 'Resum protocol·lari',
    'hint.resumen': 'Què cobreix aquest protocol i com s’ha de fer servir dins del circuit.',

    // Scope step
    'scope.titulo': 'Abast clínic i compartició',
    'scope.subtitulo':
      'Describeix quina malaltia cobreix el programa, quins tipus de cas rebrà i com comparteix coneixement amb la xarxa.',
    'label.enfermedades': 'Malalties o indicacions',
    'hint.enfermedades': 'Una per línia o separades per coma.',
    'hint.tiposCaso': 'Debut, pèrdua de resposta, canvi, desintensificació…',
    'label.politica': 'Política de compartició',
    'hint.politica': 'Defineix com comparteix coneixement aquest programa dins de la xarxa.',
    'label.alineamiento': 'Alineament i govern',
    'hint.alineamiento':
      'Exemple: alineat amb protocol local i fonts SEFH / literatura, amb validació farmacèutica i mèdica obligatòria.',

    // Therapy step
    'therapy.titulo': 'Teràpies, determinants i biomarcadors',
    'therapy.subtitulo':
      'Configura la base farmacoterapèutica i analítica que després faran servir els casos, els formularis i els agents IA.',
    'hint.farmacos': 'Exemple: infliximab, adalimumab, ustekinumab.',
    'hint.determinantes': 'Determinants PK/PD i biomarcadors utilitzats al circuit.',
    'label.semantica': 'Semàntica clínica',
    'hint.semantica': 'Una categoria per línia. S’usarà perquè el cockpit parli amb el mateix llenguatge que el protocol.',

    // Workflow step
    'workflowStep.titulo': 'Flux de treball clínic i formularis associats',
    'workflowStep.subtitulo':
      'Ajusta el pipeline i revisa quins formularis ja estan preparats per donar suport a aquest programa en producció.',
    'label.workflowClinico': 'Flux de treball clínic',
    'hint.workflowClinico': 'Defineix aquí les etapes del pipeline. Una etapa per línia.',
    'formularios.titulo': 'Formularis associats',
    'formularios.secciones': '{count} seccions configurades',
    'formularios.vacio':
      'Encara no hi ha formularis associats. Pots seguir editant el circuit i afegir-hi formularis en una iteració següent.',
    'label.fuentes': 'Fonts i referències',
    'hint.fuentes': 'Una per línia amb format: Etiqueta | URL',

    // Review step
    'review.titulo': 'Revisió final abans de desar o publicar',
    'review.subtitulo':
      'Verifica el resum del circuit. Aquesta vista és la que deixa clar que Crohn és el primer programa actiu, però no l’únic possible.',
    'review.sinNombre': 'Sense nom encara',
    'review.pendienteDefinir': 'Pendent de definir',
    'review.sinVersion': 'Sense versió',
    'review.sinIndicaciones': 'Sense indicacions configurades',
    'review.sinTiposCaso': 'Sense tipus de cas configurats',
    'review.sinTerapias': 'Sense teràpies configurades',
    'review.sinDeterminantes': 'Sense determinants configurats',
    'review.etapasTitulo': 'Etapes del flux de treball',
    'review.sinEtapas': 'Encara no s’han definit etapes.',
    'review.sinFormularios': 'No hi ha formularis associats a aquest programa.',
    'review.sinPolitica': 'Sense política de compartició definida',
    'review.protocoloActivo': 'Protocol actiu',
    'review.sinTituloProtocolo': 'Sense títol protocol·lari definit',
    'review.sinFechaRevision': 'Sense data de revisió',
    'review.alineamiento': 'Alineament',
    'review.sinAlineamiento': 'Sense marc d’alineament definit',
    'review.sinResumen': 'Sense resum protocol·lari',
    'review.sinSemantica': 'Encara no s’ha definit la semàntica clínica.',
    'review.fuentesTitulo': 'Fonts documentals',
    'review.sinFuentes': 'Encara no hi ha referències enllaçades.',

    // Next movement panel
    'next.titulo': 'Següent moviment recomanat',
    'next.review': 'Desa l’esborrany o publica una versió nova perquè el circuit quedi llest per a la xarxa.',
    'next.paso': 'Completa aquest pas i avança per deixar el programa llest per operar de forma multi-especialitat.',

    // Right sidebar
    'wizard.estadoTitulo': 'Estat de l’assistent',
    'resumen.ejecutivo': 'Resum executiu',
    'acciones.titulo': 'Accions',
    'accion.guardarBorrador': 'Desa l’esborrany',
    'acciones.nota':
      'Aquest assistent permet configurar noves especialitats i circuits clínics sense necessitat de desenvolupament addicional.',
  },
} satisfies XarxaStringModule
