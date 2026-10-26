// Copy for components/pkpd/pro/views/case-cockpit.tsx and components/pkpd/pro/views/cockpit/charts.tsx
// es values are verbatim copies of the on-screen copy; ca is the Catalan translation.

import type { XarxaStringModule } from './index'

export const strings = {
  es: {
    // Header
    'header.volver': 'Volver a casos',
    'header.critico': 'crítico',
    'header.demoProtegido': 'Demo protegido',

    // Tabs (labels kept in cockpit/shared.ts; keys chosen per tab id)
    'tab.resumen': 'Resumen',
    'tab.datos': 'Datos',
    'tab.analisis': 'Análisis',
    'tab.recomendacion': 'Recomend.',
    'tab.actividad': 'Actividad',
    'tab.flujo': 'Flujo',

    // Notices / errors
    'notice.etapaCambiada': ' La etapa ha cambiado de «{from}» a «{to}».',
    'notice.editorGuardadoEtapa':
      'Los datos clínicos se han guardado y la etapa ha cambiado de «{from}» a «{to}» tras reevaluar gaps y determinantes.',
    'notice.editorGuardado': 'Los datos clínicos se han guardado y el workflow se ha reevaluado.',
    'notice.casoEliminado': 'El caso {caseId} se ha eliminado.',
    'notice.borradorGenerado': 'Se ha generado un borrador de informe HCE.',
    'notice.orchestrate': 'El sistema ha preparado el paquete automático del caso para validación humana.',
    'notice.fieldReview': 'Se ha actualizado el estado de validación del campo.',
    'notice.pdfDescargado': 'Se ha descargado el informe HCE en PDF.',
    'notice.gapSolicitud': 'Se ha activado la solicitud de datos para este gap.',
    'notice.gapPendiente': 'El caso queda pendiente de completar datos.',
    'notice.datosDevueltos': 'El caso se ha devuelto para completar datos.',
    'notice.sesionMarcada': 'El caso se ha marcado para sesión de red.',
    'notice.farmaceutica': 'El caso ha avanzado a revisión farmacéutica.',
    'notice.datosAdicionales': 'Se han solicitado datos adicionales para el caso.',
    'notice.tareaResuelta': 'La tarea se ha marcado como resuelta.',
    'notice.tareaCurso': 'La tarea queda en curso.',
    'notice.recBorrador': 'La recomendación se ha guardado como borrador revisado.',
    'notice.recPendienteDatos': 'La recomendación queda pendiente de más datos.',
    'notice.recRevisionMedica': 'La recomendación se ha enviado a revisión médica.',
    'notice.recSesion': 'La recomendación se ha escalado a la sesión de red.',
    'notice.recRechazada': 'La recomendación se ha marcado como rechazada.',
    'notice.informeGuardado': 'Se han guardado los cambios del informe.',
    'notice.informeCovalidacion': 'El informe se ha enviado a co-validación.',
    'notice.informeHce': 'El informe se ha marcado como registrado en HCE.',
    'notice.followupProgramado': 'Se ha programado {plan}.',
    'notice.followupCompletado': '{label} se ha marcado como completado.',
    'notice.casoCerrado': 'El caso se ha cerrado y el outcome ha quedado registrado.',
    'error.accion': 'No se ha podido completar la acción solicitada.',
    'error.editorGuardar': 'No se han podido guardar los cambios clínicos.',
    'error.demoProtegido': 'Este caso de demo está protegido y no se puede eliminar.',
    'error.casoEliminar': 'No se ha podido eliminar el caso.',
    'error.pdf': 'No se ha podido generar el PDF del informe.',

    // Delete dialog
    'dialog.eliminar.title': 'Eliminar {caseId}',
    'dialog.eliminar.descripcion':
      'Se eliminarán el caso «{title}», sus tareas, timeline, recomendación, nota clínica, seguimiento y trazas de agentes asociadas.',
    'dialog.eliminar.confirmar': 'Eliminar caso',
    'dialog.cancelar': 'Cancelar',

    // Printable note (PDF)
    'pdf.titulo': '{caseId} · Informe HCE',
    'pdf.sinContenido': 'Sin contenido disponible.',
    'pdf.seccion.estado': 'Estado del informe',
    'pdf.seccion.texto': 'Texto del informe',
    'pdf.seccion.aviso': 'Aviso',
    'pdf.aviso.texto':
      'Documento generado desde Xarxa PK/PD Intelligence Hub. Requiere validación profesional antes de registro definitivo en HCE.',

    // Charts
    'chart.concentracion': 'Concentración sérica (valle)',
    'chart.objetivo': 'Objetivo',
    'chart.rangoObjetivo': '▲ {lo}–{hi} {unit} objetivo',
    'chart.saludCaso': 'Salud del caso',
    'chart.completitud': 'Completitud',
    'chart.confianza': 'Confianza PK/PD',
    'chart.sinRiesgo': 'Sin riesgo',
    'chart.gapsOk': 'Gaps ok',
    'chart.riesgo': 'Riesgo',
    'chart.alto': 'Alto',
    'chart.medio': 'Medio',
    'chart.bajo': 'Bajo',
    'chart.gaps': 'Gaps',
    'chart.gapsValor': '{count} ({critical} críticos)',
    'chart.verTodos': 'Ver todos',
    'chart.determinantes': 'Determinantes',
    'chart.interpretabilidad': 'Interpretabilidad',
    'chart.coherencia': 'Coherencia',
    'chart.cronograma': 'Cronograma de seguimiento',
    'chart.hoy': 'Hoy',
    'chart.pendiente': 'Pendiente',
    'chart.completado': 'Completado',

    // Severity names as rendered by GapSeverityDonut (values come from backend enums,
    // so the keys are the Spanish enum values themselves)
    'Crítico': 'Crítico',
    'Importante': 'Importante',
    'Informativo': 'Informativo',

    // PkpdStatus labels produced by pkpdStatus() in cockpit/derive.ts, rendered
    // in TherapeuticWindowGauge via t(status.label)
    'pkpd.status.en-rango': 'En rango',
    'pkpd.status.infraexposicion': 'Infraexposición',
    'pkpd.status.sobreexposicion': 'Sobreexposición',
  },
  ca: {
    // Header
    'header.volver': 'Tornar a casos',
    'header.critico': 'crític',
    'header.demoProtegido': 'Demo protegit',

    // Tabs
    'tab.resumen': 'Resum',
    'tab.datos': 'Dades',
    'tab.analisis': 'Anàlisi',
    'tab.recomendacion': 'Recomanació',
    'tab.actividad': 'Activitat',
    'tab.flujo': 'Flux',

    // Notices / errors
    'notice.etapaCambiada': " L'etapa ha canviat de «{from}» a «{to}».",
    'notice.editorGuardadoEtapa':
      "Les dades clíniques s'han desat i l'etapa ha canviat de «{from}» a «{to}» després de reavaluar gaps i determinants.",
    'notice.editorGuardado': "Les dades clíniques s'han desat i el workflow s'ha reavaluat.",
    'notice.casoEliminado': "El cas {caseId} s'ha eliminat.",
    'notice.borradorGenerado': "S'ha generat un esborrany d'informe HCE.",
    'notice.orchestrate': 'El sistema ha preparat el paquet automàtic del cas per a validació humana.',
    'notice.fieldReview': "S'ha actualitzat l'estat de validació del camp.",
    'notice.pdfDescargado': "S'ha descarregat l'informe HCE en PDF.",
    'notice.gapSolicitud': "S'ha activat la sol·licitud de dades per a aquest gap.",
    'notice.gapPendiente': 'El cas queda pendent de completar dades.',
    'notice.datosDevueltos': "El cas s'ha retornat per a completar dades.",
    'notice.sesionMarcada': "El cas s'ha marcat per a sessió de xarxa.",
    'notice.farmaceutica': 'El cas ha avançat a revisió farmacèutica.',
    'notice.datosAdicionales': "S'han sol·licitat dades addicionals per al cas.",
    'notice.tareaResuelta': "La tasca s'ha marcat com a resolta.",
    'notice.tareaCurso': 'La tasca queda en curs.',
    'notice.recBorrador': "La recomanació s'ha desat com a esborrany revisat.",
    'notice.recPendienteDatos': 'La recomanació queda pendent de més dades.',
    'notice.recRevisionMedica': "La recomanació s'ha enviat a revisió mèdica.",
    'notice.recSesion': "La recomanació s'ha escalat a la sessió de xarxa.",
    'notice.recRechazada': "La recomanació s'ha marcat com a rebutjada.",
    'notice.informeGuardado': "S'han desat els canvis de l'informe.",
    'notice.informeCovalidacion': "L'informe s'ha enviat a co-validació.",
    'notice.informeHce': "L'informe s'ha marcat com a registrat a la HCE.",
    'notice.followupProgramado': "S'ha programat {plan}.",
    'notice.followupCompletado': "{label} s'ha marcat com a completat.",
    'notice.casoCerrado': "El cas s'ha tancat i l'outcome ha quedat registrat.",
    'error.accion': "No s'ha pogut completar l'acció sol·licitada.",
    'error.editorGuardar': "No s'han pogut desar els canvis clínics.",
    'error.demoProtegido': 'Aquest cas de demo està protegit i no es pot eliminar.',
    'error.casoEliminar': "No s'ha pogut eliminar el cas.",
    'error.pdf': "No s'ha pogut generar el PDF de l'informe.",

    // Delete dialog
    'dialog.eliminar.title': 'Eliminar {caseId}',
    'dialog.eliminar.descripcion':
      "S'eliminaran el cas «{title}», les seves tasques, la línia temporal, la recomanació, la nota clínica, el seguiment i les traçes d'agents associades.",
    'dialog.eliminar.confirmar': 'Eliminar cas',
    'dialog.cancelar': 'Cancel·lar',

    // Printable note (PDF)
    'pdf.titulo': '{caseId} · Informe HCE',
    'pdf.sinContenido': 'Sense contingut disponible.',
    'pdf.seccion.estado': "Estat de l'informe",
    'pdf.seccion.texto': "Text de l'informe",
    'pdf.seccion.aviso': 'Avís',
    'pdf.aviso.texto':
      'Document generat des de Xarxa PK/PD Intelligence Hub. Requereix validació professional abans del registre definitiu a la HCE.',

    // Charts
    'chart.concentracion': 'Concentració sèrica (vall)',
    'chart.objetivo': 'Objectiu',
    'chart.rangoObjetivo': '▲ {lo}–{hi} {unit} objectiu',
    'chart.saludCaso': 'Salut del cas',
    'chart.completitud': 'Completesa',
    'chart.confianza': 'Confiança PK/PD',
    'chart.sinRiesgo': 'Sense risc',
    'chart.gapsOk': 'Gaps ok',
    'chart.riesgo': 'Risc',
    'chart.alto': 'Alt',
    'chart.medio': 'Mitjà',
    'chart.bajo': 'Baix',
    'chart.gaps': 'Gaps',
    'chart.gapsValor': '{count} ({critical} crítics)',
    'chart.verTodos': 'Veure-ho tot',
    'chart.determinantes': 'Determinants',
    'chart.interpretabilidad': 'Interpretabilitat',
    'chart.coherencia': 'Coherència',
    'chart.cronograma': 'Cronograma de seguiment',
    'chart.hoy': 'Avui',
    'chart.pendiente': 'Pendent',
    'chart.completado': 'Completat',

    // Severity names
    'Crítico': 'Crític',
    'Importante': 'Important',
    'Informativo': 'Informatiu',

    // PkpdStatus labels
    'pkpd.status.en-rango': 'Dins de rang',
    'pkpd.status.infraexposicion': 'Infraexposició',
    'pkpd.status.sobreexposicion': 'Sobreexposició',
  },
} satisfies XarxaStringModule
