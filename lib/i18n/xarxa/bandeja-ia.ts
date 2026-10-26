// Copy for components/pkpd/pro/views/bandeja-ia.tsx
// es values are verbatim copies of the on-screen copy; ca is the Catalan translation.

import type { XarxaStringModule } from './index'

export const strings = {
  es: {
    // Extraction category legend
    'cat.paciente.label': 'Paciente',
    'cat.paciente.section': 'Paciente y perfil',
    'cat.medicacion.label': 'Medicación',
    'cat.medicacion.section': 'Tratamiento',
    'cat.determinante.label': 'Determinante',
    'cat.determinante.section': 'Determinantes y biomarcadores',
    'cat.contexto.label': 'Contexto',
    'cat.contexto.section': 'Contexto clínico',

    // Agent status badge
    'status.pending': 'En cola',
    'status.processing': 'Procesando',
    'status.ready': 'Listo para crear caso',
    'status.error': 'Error de extracción',
    'status.created': 'Caso creado',

    // Case creation agent steps
    'create.step.1': 'Creando caso clínico',
    'create.step.2': 'Validando completitud del caso',
    'create.step.3': 'Preparando tareas iniciales',
    'create.step.4': 'Caso listo para abrir',

    // Processing panel
    'processing.draft': 'Borrador en curso',
    'processing.waiting': 'Esperando primeros campos estructurados…',

    // Pending panel
    'pending.title': 'Solicitud pendiente',

    // Ready panel
    'ready.legend': 'Leyenda de extracción',
    'ready.draft.count': 'Borrador estructurado — {count} campos',
    'ready.unavailable': 'Extracción no disponible aún.',
    'ready.structured.notice':
      '✓ La solicitud ya está estructurada. El siguiente paso es crear el caso para lanzar la validación clínica.',

    // Created panel
    'created.success': 'Caso creado con éxito',
    'created.caseId': 'Case ID',
    'created.open': 'Abrir Case Cockpit',

    // Error panel
    'error.title': 'Error en la extracción',
    'error.retry.hint': 'Puedes reintentar el procesamiento desde el panel principal.',

    // Structured field labels
    'field.patientCode': 'Paciente',
    'field.drug': 'Fármaco',
    'field.indication': 'Indicación',
    'field.weight': 'Peso',
    'field.recentDose': 'Última administración',
    'field.levelResult': 'Nivel detectado',
    'field.requestType': 'Tipo de consulta',
    'field.currentDose': 'Dosis actual',
    'field.interval': 'Intervalo',
    'field.route': 'Vía',
    'field.crp': 'PCR',
    'field.calprotectin': 'Calprotectina',
    'field.antibodies': 'Anticuerpos',
    'field.phenotype': 'Fenotipo',
    'field.activity': 'Actividad',
    'field.sex': 'Sexo',
    'field.age': 'Edad',

    // View-level copy
    'error.load': 'No se ha podido cargar la bandeja IA.',
    'error.generate': 'No se ha podido generar la solicitud.',
    'error.process': 'No se ha podido procesar la solicitud.',
    'error.delete': 'No se ha podido eliminar la solicitud.',
    'error.create': 'No se ha podido crear el caso desde la solicitud.',
    'notice.create':
      'Revisa y confirma los campos estructurados por los Agentes antes de continuar con la validación clínica del caso.',
    'notice.open':
      'Este caso se creó desde email. Revisa y confirma los datos estructurados por los Agentes antes de seguir.',
    'loading.title': 'Cargando bandeja IA…',
    'loading.detail': 'Preparando solicitudes entrantes y extracción estructurada.',
    'empty.title': 'No hay solicitudes pendientes en la bandeja IA.',
    'empty.detail': 'Puedes generar una solicitud simulada por email y estructurarla antes de crear el caso.',
    'action.generate': 'Generar solicitud por email',
    'list.title': 'Solicitudes recibidas',
    'list.refresh.aria': 'Actualizar bandeja',
    'delete.label': 'Eliminar solicitud',
    'delete.description':
      'Se eliminará esta solicitud de la bandeja IA. Esta acción limpia el correo entrante, pero no afecta a casos ya creados.',
    'cancel': 'Cancelar',
    'action.process': 'Estructurar con Agentes',
    'action.create': 'Crear caso',
    'action.open': 'Abrir caso',
    'email.original': 'Email original',
    'email.from': 'De',
    'email.subject': 'Asunto',
    'email.date': 'Fecha',
    'meta.requester': 'Solicitante',
    'meta.program': 'Programa',
    'meta.program.suggested': 'Programa sugerido',
    'meta.extraction': 'Extracción IA',
    'meta.extraction.ready': 'Lista',
    'meta.extraction.created': 'Generado',
    'meta.extraction.pending': 'Pendiente',
    'meta.extraction.ready.long': 'Lista para crear caso',
    'meta.extraction.processing.long': 'Estructurando borrador',
    'meta.extraction.created.long': 'Caso ya generado',
    'meta.extraction.pending.long': 'Pendiente de estructurar',
    'draft.title': 'Borrador estructurado',
  },
  ca: {
    // Extraction category legend
    'cat.paciente.label': 'Pacient',
    'cat.paciente.section': 'Pacient i perfil',
    'cat.medicacion.label': 'Medicació',
    'cat.medicacion.section': 'Tractament',
    'cat.determinante.label': 'Determinant',
    'cat.determinante.section': 'Determinants i biomarcadors',
    'cat.contexto.label': 'Context',
    'cat.contexto.section': 'Context clínic',

    // Agent status badge
    'status.pending': 'En cua',
    'status.processing': 'Processant',
    'status.ready': 'Llest per crear el cas',
    'status.error': "Error d'extracció",
    'status.created': 'Cas creat',

    // Case creation agent steps
    'create.step.1': 'Creant el cas clínic',
    'create.step.2': 'Validant la completesa del cas',
    'create.step.3': 'Preparant les tasques inicials',
    'create.step.4': 'Cas llest per obrir',

    // Processing panel
    'processing.draft': 'Esborrany en curs',
    'processing.waiting': 'Esperant els primers camps estructurats…',

    // Pending panel
    'pending.title': 'Sol·licitud pendent',

    // Ready panel
    'ready.legend': "Llegenda de l'extracció",
    'ready.draft.count': 'Esborrany estructurat — {count} camps',
    'ready.unavailable': 'Encara no hi ha extracció disponible.',
    'ready.structured.notice':
      '✓ La sol·licitud ja està estructurada. El següent pas és crear el cas per llançar la validació clínica.',

    // Created panel
    'created.success': 'Cas creat amb èxit',
    'created.caseId': 'Identificador del cas',
    'created.open': 'Obrir el Case Cockpit',

    // Error panel
    'error.title': "Error en l'extracció",
    'error.retry.hint': 'Pots reintentar el processament des del tauler principal.',

    // Structured field labels
    'field.patientCode': 'Pacient',
    'field.drug': 'Fàrmac',
    'field.indication': 'Indicació',
    'field.weight': 'Pes',
    'field.recentDose': 'Última administració',
    'field.levelResult': 'Nivell detectat',
    'field.requestType': 'Tipus de consulta',
    'field.currentDose': 'Dosi actual',
    'field.interval': 'Interval',
    'field.route': 'Via',
    'field.crp': 'PCR',
    'field.calprotectin': 'Calprotectina',
    'field.antibodies': 'Anticossos',
    'field.phenotype': 'Fenotip',
    'field.activity': 'Activitat',
    'field.sex': 'Sexe',
    'field.age': 'Edat',

    // View-level copy
    'error.load': "No s'ha pogut carregar la bústia IA.",
    'error.generate': "No s'ha pogut generar la sol·licitud.",
    'error.process': "No s'ha pogut processar la sol·licitud.",
    'error.delete': "No s'ha pogut eliminar la sol·licitud.",
    'error.create': "No s'ha pogut crear el cas a partir de la sol·licitud.",
    'notice.create':
      'Revisa i confirma els camps estructurats pels Agents abans de continuar amb la validació clínica del cas.',
    'notice.open':
      "Aquest cas es va crear des d'un correu electrònic. Revisa i confirma les dades estructurades pels Agents abans de continuar.",
    'loading.title': 'Carregant la bústia IA…',
    'loading.detail': "Preparant les sol·licituds entrants i l'extracció estructurada.",
    'empty.title': 'No hi ha sol·licituds pendents a la bústia IA.',
    'empty.detail': 'Pots generar una sol·licitud simulada per correu electrònic i estructurar-la abans de crear el cas.',
    'action.generate': 'Generar sol·licitud per correu electrònic',
    'list.title': 'Sol·licituds rebudes',
    'list.refresh.aria': 'Actualitzar la bústia',
    'delete.label': 'Eliminar la sol·licitud',
    'delete.description':
      "S'eliminarà aquesta sol·licitud de la bústia IA. Aquesta acció neteja el correu entrant, però no afecta els casos ja creats.",
    'cancel': 'Cancel·lar',
    'action.process': 'Estructurar amb els Agents',
    'action.create': 'Crear el cas',
    'action.open': 'Obrir el cas',
    'email.original': 'Correu original',
    'email.from': 'De',
    'email.subject': 'Assumpte',
    'email.date': 'Data',
    'meta.requester': 'Sol·licitant',
    'meta.program': 'Programa',
    'meta.program.suggested': 'Programa suggerit',
    'meta.extraction': 'Extracció IA',
    'meta.extraction.ready': 'Llista',
    'meta.extraction.created': 'Generat',
    'meta.extraction.pending': 'Pendent',
    'meta.extraction.ready.long': 'Llista per crear el cas',
    'meta.extraction.processing.long': "Estructurant l'esborrany",
    'meta.extraction.created.long': 'Cas ja generat',
    'meta.extraction.pending.long': "Pendent d'estructurar",
    'draft.title': 'Esborrany estructurat',
  },
} satisfies XarxaStringModule
