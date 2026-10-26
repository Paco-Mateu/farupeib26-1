// Copy for components/pkpd/pro/views/cockpit/{derive,shared,cards}.tsx
// es values are verbatim copies of the on-screen copy; ca is the Catalan translation.

import type { XarxaStringModule } from './index'

export const strings = {
  es: {
    // pkpdStatus (derive.ts) — label keys resolved at the render sites
    'pkpd.status.infraexposicion': 'Infraexposición',
    'pkpd.status.sobreexposicion': 'Sobreexposición',
    'pkpd.status.en-rango': 'En rango',

    // PkpdRulesCard
    'pkpd.rules.error': 'No se han podido ejecutar las reglas PK/PD.',
    'pkpd.rules.kicker': 'Motor de reglas empíricas de la red',
    'pkpd.rules.title': 'Evaluación determinista de exposición (soporte a la decisión)',
    'pkpd.rules.run': 'Ejecutar reglas PK/PD',
    'pkpd.rules.drug': 'Fármaco:',
    'pkpd.rules.target': 'Objetivo:',
    'pkpd.rules.observed': 'Observado:',
    'pkpd.rules.inTarget': 'En objetivo',
    'pkpd.rules.outOfTarget': 'Fuera de objetivo',
    'pkpd.rules.draftLabel': 'Borrador para el profesional:',
    'pkpd.rules.source': 'Fuente:',

    // BayesMipdCard
    'bayes.error': 'No se ha podido ejecutar la estimación bayesiana.',
    'bayes.kicker': 'MIPD · estimación bayesiana MAP (prototipo)',
    'bayes.title': 'Aclaramiento individual y comparación de pautas',
    'bayes.run': 'Ejecutar estimación',
    'bayes.cl': 'CL individual: {value} L/día',
    'bayes.cl.relative': '{pct}% del poblacional ({value} L/día)',
    'bayes.levels': '{levels} nivel(es) · {doses} dosis temporizadas',
    'bayes.th.maintenance': 'Pauta de mantenimiento',
    'bayes.th.cmin': 'Cmin previsto',
    'bayes.th.auc': 'AUC semanal (mg·h/L)',
    'bayes.th.route': 'Vía',
    'bayes.equivalence.prefix': 'Equivalencia:',
    'bayes.equivalence.note': 'Exposición semanal equivalente ({auc} mg·h/L): {regimens}',
    'bayes.finalNote': 'La decisión final corresponde al comité clínico.',

    // SimilarCasesCard
    'similar.error': 'No se han podido buscar casos similares.',
    'similar.kicker': 'Memoria de la red · Atlas Vector Search',
    'similar.title': 'Casos similares resueltos por la red',
    'similar.search': 'Buscar casos similares',
    'similar.empty': 'No hay casos lo bastante parecidos en la memoria de la red.',
    'similar.score': 'similitud {score}',
    'similar.decision': 'Decisión de la red: {text}',

    // UrgentSlaChip
    'urgent.resolved': 'Circuito urgente resuelto',
    'urgent.noDeadline': 'Circuito urgente · sin fecha límite registrada',
    'urgent.breached': 'Fuera de plazo del circuito urgente (<24-48 h)',
    'urgent.pending': 'Circuito urgente · respuesta en {time}',

    // ClinicalIdentityBar
    'identity.treatment': 'Tratamiento',
    'identity.trough': 'Concentración (valle)',
    'identity.confidence': '· Confianza {value}',
    'identity.age': '{age} años',

    // ProtocolFrameCard
    'protocol.frameKicker': 'Marco de decisión',
    'protocol.active': 'Protocolo activo',
    'protocol.activeClinical': 'Protocolo clínico activo',
    'protocol.lastReview': 'Última revisión: {date}',
    'protocol.references': 'Fuentes',

    // STAGE_DESC (cards.tsx) — keyed by pipeline stage
    'stage.solicitudRecibida': 'Solicitud registrada y pendiente de asignación al programa.',
    'stage.casoCreadoIa': 'El agente IA ha estructurado el caso y asignado tipo de consulta.',
    'stage.datosIncompletos': 'El farmacéutico ha detectado datos clínicos o analíticos pendientes.',
    'stage.pendienteDeterminantes': 'Se aguardan niveles plasmáticos o resultados de laboratorio.',
    'stage.determinantesRecibidos': 'Resultados analíticos disponibles para análisis PK/PD.',
    'stage.analisisPkpd': 'El agente ha calculado parámetros PK y generado la interpretación.',
    'stage.revisionFarmaceutica': 'El farmacéutico referente revisa el análisis y elabora recomendación.',
    'stage.revisionMedica': 'El médico solicitante revisa y valida la recomendación.',
    'stage.discusionRed': 'El caso se presenta en sesión colaborativa con otros centros.',
    'stage.informeGenerado': 'La recomendación formal está redactada y pendiente de validación.',
    'stage.informeValidado': 'El informe ha sido validado por farmacia y medicina.',
    'stage.registradoHce': 'La recomendación se ha integrado en la historia clínica electrónica.',
    'stage.seguimiento4': 'Revisión intermedia: valoración de respuesta a los 30 días.',
    'stage.seguimiento8': 'Revisión final: consolidación del resultado clínico.',
    'stage.cerradoResultado': 'Caso cerrado con documentación del resultado clínico.',

    // PipelinePanel
    'pipeline.header': 'Flujo del caso',
    'pipeline.nextStep': 'Siguiente paso',
    'pipeline.updating': 'Actualizando workflow…',
    'pipeline.now': '▶ AHORA',
    'pipeline.contextHeader': 'Contexto y acciones',
    'pipeline.requester': 'Solicitante · {center}',
    'pipeline.pharmacyOwner': 'Farmacia responsable',
    'pipeline.pendingValidation': 'Pendiente de validar',
    'pipeline.followUpsVisible': 'Seguimiento visible',
    'pipeline.approval.recPending': 'Recomendación pendiente de validar',
    'pipeline.approval.noteNotRegistered': 'Informe HCE no registrado',
    'pipeline.approval.task': '1 tarea abierta',
    'pipeline.approval.tasks': '{count} tareas abiertas',
    'pipeline.approval.followUp': '1 seguimiento pendiente',
    'pipeline.approval.followUps': '{count} seguimientos pendientes',
    'flow.orchestrate.title': 'Agentes trabajando sobre el caso',
    'flow.orchestrate.step1': 'Validando completitud clínica',
    'flow.orchestrate.step2': 'Preparando interpretación PK/PD',
    'flow.orchestrate.step3': 'Redactando recomendación',
    'flow.orchestrate.step4': 'Preparando nota HCE',
    'flow.note.title': 'Agente de informe HCE trabajando',
    'flow.note.step1': 'Leyendo contexto validado',
    'flow.note.step2': 'Componiendo borrador clínico',
    'flow.note.step3': 'Preparando salida para revisión',

    // RECOMMENDATION_STATUS labels rendered via tCore in tab-analisis
    // (map keys are backend statuses; labels are the display strings)
    'Borrador preparado por Agentes': 'Borrador preparado por Agentes',
    'Editado por farmacia': 'Editado por farmacia',
    'Pendiente de revisión médica': 'Pendiente de revisión médica',
    'Validado': 'Validado',
    'Rechazado': 'Rechazado',
  },
  ca: {
    // pkpdStatus (derive.ts)
    'pkpd.status.infraexposicion': 'Infraexposició',
    'pkpd.status.sobreexposicion': 'Sobreexposició',
    'pkpd.status.en-rango': 'Dins del rang',

    // PkpdRulesCard
    'pkpd.rules.error': "No s'han pogut executar les regles PK/PD.",
    'pkpd.rules.kicker': 'Motor de regles empíriques de la xarxa',
    'pkpd.rules.title': "Avaluació determinista de l'exposició (suport a la decisió)",
    'pkpd.rules.run': 'Executar regles PK/PD',
    'pkpd.rules.drug': 'Fàrmac:',
    'pkpd.rules.target': 'Objectiu:',
    'pkpd.rules.observed': 'Observat:',
    'pkpd.rules.inTarget': "Dins de l'objectiu",
    'pkpd.rules.outOfTarget': "Fora de l'objectiu",
    'pkpd.rules.draftLabel': 'Esborrany per al professional:',
    'pkpd.rules.source': 'Font:',

    // BayesMipdCard
    'bayes.error': "No s'ha pogut executar l'estimació bayesiana.",
    'bayes.kicker': 'MIPD · estimació bayesiana MAP (prototip)',
    'bayes.title': 'Aclarament individual i comparació de pauta',
    'bayes.run': "Executar l'estimació",
    'bayes.cl': 'CL individual: {value} L/dia',
    'bayes.cl.relative': '{pct}% del poblacional ({value} L/dia)',
    'bayes.levels': '{levels} nivell(s) · {doses} dosis temporitzades',
    'bayes.th.maintenance': 'Pauta de manteniment',
    'bayes.th.cmin': 'Cmin previst',
    'bayes.th.auc': 'AUC setmanal (mg·h/L)',
    'bayes.th.route': 'Via',
    'bayes.equivalence.prefix': 'Equivalència:',
    'bayes.equivalence.note': 'Exposició setmanal equivalent ({auc} mg·h/L): {regimens}',
    'bayes.finalNote': 'La decisió final correspon al comitè clínic.',

    // SimilarCasesCard
    'similar.error': "No s'han pogut cercar casos similars.",
    'similar.kicker': 'Memòria de la xarxa · Atlas Vector Search',
    'similar.title': 'Casos similars resolts per la xarxa',
    'similar.search': 'Cercar casos similars',
    'similar.empty': 'No hi ha casos prou semblants a la memòria de la xarxa.',
    'similar.score': 'similitud {score}',
    'similar.decision': 'Decisió de la xarxa: {text}',

    // UrgentSlaChip
    'urgent.resolved': 'Circuit urgent resolt',
    'urgent.noDeadline': 'Circuit urgent · sense data límit registrada',
    'urgent.breached': 'Fora de termini del circuit urgent (<24-48 h)',
    'urgent.pending': 'Circuit urgent · resposta en {time}',

    // ClinicalIdentityBar
    'identity.treatment': 'Tractament',
    'identity.trough': 'Concentració (vall)',
    'identity.confidence': '· Confiança {value}',
    'identity.age': '{age} anys',

    // ProtocolFrameCard
    'protocol.frameKicker': 'Marc de decisió',
    'protocol.active': 'Protocol actiu',
    'protocol.activeClinical': 'Protocol clínic actiu',
    'protocol.lastReview': 'Última revisió: {date}',
    'protocol.references': 'Fonts',

    // STAGE_DESC (cards.tsx)
    'stage.solicitudRecibida': "Sol·licitud registrada i pendent d'assignació al programa.",
    'stage.casoCreadoIa': "L'agent IA ha estructurat el cas i assignat el tipus de consulta.",
    'stage.datosIncompletos': 'El farmacèutic ha detectat dades clíniques o analítiques pendents.',
    'stage.pendienteDeterminantes': "S'esperen nivells plasmàtics o resultats de laboratori.",
    'stage.determinantesRecibidos': "Resultats analítics disponibles per a l'anàlisi PK/PD.",
    'stage.analisisPkpd': "L'agent ha calculat paràmetres PK i generat la interpretació.",
    'stage.revisionFarmaceutica': "El farmacèutic referent revisa l'anàlisi i elabora la recomanació.",
    'stage.revisionMedica': 'El metge sol·licitant revisa i valida la recomanació.',
    'stage.discusionRed': 'El cas es presenta en una sessió col·laborativa amb altres centres.',
    'stage.informeGenerado': 'La recomanació formal està redactada i pendent de validació.',
    'stage.informeValidado': "L'informe ha estat validat per farmàcia i medicina.",
    'stage.registradoHce': "La recomanació s'ha integrat a la història clínica electrònica.",
    'stage.seguimiento4': 'Revisió intermèdia: valoració de la resposta als 30 dies.',
    'stage.seguimiento8': 'Revisió final: consolidació del resultat clínic.',
    'stage.cerradoResultado': 'Cas tancat amb documentació del resultat clínic.',

    // PipelinePanel
    'pipeline.header': 'Flux del cas',
    'pipeline.nextStep': 'Següent pas',
    'pipeline.updating': 'Actualitzant el workflow…',
    'pipeline.now': '▶ ARA',
    'pipeline.contextHeader': 'Context i accions',
    'pipeline.requester': 'Sol·licitant · {center}',
    'pipeline.pharmacyOwner': 'Farmàcia responsable',
    'pipeline.pendingValidation': 'Pendent de validar',
    'pipeline.followUpsVisible': 'Seguiment visible',
    'pipeline.approval.recPending': 'Recomanació pendent de validar',
    'pipeline.approval.noteNotRegistered': 'Informe HCE no registrat',
    'pipeline.approval.task': '1 tasca oberta',
    'pipeline.approval.tasks': '{count} tasques obertes',
    'pipeline.approval.followUp': '1 seguiment pendent',
    'pipeline.approval.followUps': '{count} seguiments pendents',
    'flow.orchestrate.title': 'Agents treballant sobre el cas',
    'flow.orchestrate.step1': 'Validant la completesa clínica',
    'flow.orchestrate.step2': 'Preparant la interpretació PK/PD',
    'flow.orchestrate.step3': 'Redactant la recomanació',
    'flow.orchestrate.step4': 'Preparant la nota HCE',
    'flow.note.title': "Agent d'informe HCE treballant",
    'flow.note.step1': "Llegint el context validat",
    'flow.note.step2': "Componint l'esborrany clínic",
    'flow.note.step3': 'Preparant la sortida per a revisió',

    // RECOMMENDATION_STATUS labels
    'Borrador preparado por Agentes': 'Esborrany preparat pels Agents',
    'Editado por farmacia': 'Editat per farmàcia',
    'Pendiente de revisión médica': 'Pendent de revisió mèdica',
    'Validado': 'Validat',
    'Rechazado': 'Rebutjat',
  },
} satisfies XarxaStringModule
