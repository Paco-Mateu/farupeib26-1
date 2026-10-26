// Copy for components/pkpd/pro/views/cockpit/tab-resumen.tsx and tab-timeline.tsx
// es values are verbatim copies of the on-screen copy; ca is the Catalan translation.

import type { XarxaStringModule } from './index'

export const strings = {
  es: {
    // tab-resumen: stage focus card
    'foco.etiqueta': 'Foco de la etapa',
    'stage.datos.title': 'Completar el contexto clínico antes de seguir avanzando',
    'stage.datos.detail': 'En esta etapa conviene validar tratamiento, determinantes, relación con la dosis y campos sugeridos por Agentes.',
    'cta.datos': 'Datos',
    'stage.analisis.title': 'Contrastar interpretación, escenarios y recomendación',
    'stage.analisis.detail': 'El caso ya está preparado para revisar el análisis PK/PD, discutir escenarios y validar la recomendación clínica.',
    'cta.recomendacion': 'Recomendación',
    'stage.informe.title': 'Cerrar el circuito documental y confirmar trazabilidad',
    'stage.informe.detail': 'La prioridad ahora es revisar el informe HCE, enviarlo al registro adecuado y dejar el seguimiento planificado.',
    'cta.informe': 'Informe',
    'stage.default.title': 'Leer el estado del caso y preparar el seguimiento',
    'stage.default.detail': 'En esta fase interesa revisar resultado, seguimiento y trazabilidad final del caso dentro de la red.',
    'cta.actividad': 'Actividad',
    'foco.cta.abrir': 'Abrir {label}',
    'foco.cta.ir': 'Ir a {label}',
    'action.confirmar': 'Confirmar',
    'action.solicitarDatos': 'Solicitar datos',
    // tab-resumen: clinical summary card
    'resumen.titulo': 'Resumen clínico',
    // tab-resumen: stage actions
    'action.editarDatos': 'Editar datos',
    'action.eliminar': 'Eliminar',
    'action.generarInforme': 'Generar informe con Agentes',
    'action.editar': 'Editar',
    'action.cerrarCaso': 'Cerrar caso',
    'action.cerrar': 'Cerrar',
    'action.agentesTrabajando': 'Agentes trabajando…',
    'action.actualizarAgentes': 'Actualizar con Agentes',
    'action.informe': 'Informe',
    'action.sesionRed': 'Sesión de red',
    // tab-timeline: focus panel
    'timeline.foco.etiqueta': 'Foco actual',
    'timeline.foco.lane': 'Leyendo solo la pista «{lane}»',
    'timeline.foco.completa': 'Vista completa del recorrido del caso',
    'timeline.foco.ayuda.lane': 'Úsalo para revisar una sola dimensión clínica sin ruido del resto del caso.',
    'timeline.foco.ayuda.completa': 'Empieza por el conjunto y después baja a la pista que quieras validar con más detalle.',
    'timeline.ultimo.hito': 'Último hito',
    'timeline.ultimo.hito.vacio': 'Todavía no hay eventos registrados en esta vista.',
    // tab-timeline: lane filter chips
    'timeline.chips.todas': 'Todas las pistas',
    // tab-timeline: event list
    'timeline.eventos.count': '{count} eventos',
    'timeline.badge.agentes': 'Agentes',
    'timeline.vacio.pista': 'No hay eventos en esta pista.',
  },
  ca: {
    // tab-resumen: stage focus card
    'foco.etiqueta': "Focus de l'etapa",
    'stage.datos.title': 'Completar el context clínic abans de continuar avançant',
    'stage.datos.detail': 'En aquesta etapa convé validar el tractament, els determinants, la relació amb la dosi i els camps suggerits pels Agents.',
    'cta.datos': 'Dades',
    'stage.analisis.title': 'Contrastar la interpretació, els escenaris i la recomanació',
    'stage.analisis.detail': "El cas ja està preparat per revisar l'anàlisi PK/PD, discutir escenaris i validar la recomanació clínica.",
    'cta.recomendacion': 'Recomanació',
    'stage.informe.title': 'Tancar el circuit documental i confirmar la traçabilitat',
    'stage.informe.detail': "Ara la prioritat és revisar l'informe HCE, enviar-lo al registre adequat i deixar el seguiment planificat.",
    'cta.informe': 'Informe',
    'stage.default.title': "Llegir l'estat del cas i preparar el seguiment",
    'stage.default.detail': 'En aquesta fase interessa revisar el resultat, el seguiment i la traçabilitat final del cas dins de la xarxa.',
    'cta.actividad': 'Activitat',
    'foco.cta.abrir': 'Obrir {label}',
    'foco.cta.ir': 'Anar a {label}',
    'action.confirmar': 'Confirmar',
    'action.solicitarDatos': 'Sol·licitar dades',
    // tab-resumen: clinical summary card
    'resumen.titulo': 'Resum clínic',
    // tab-resumen: stage actions
    'action.editarDatos': 'Editar dades',
    'action.eliminar': 'Eliminar',
    'action.generarInforme': 'Generar informe amb Agents',
    'action.editar': 'Editar',
    'action.cerrarCaso': 'Tancar cas',
    'action.cerrar': 'Tancar',
    'action.agentesTrabajando': 'Agents treballant…',
    'action.actualizarAgentes': 'Actualitzar amb Agents',
    'action.informe': 'Informe',
    'action.sesionRed': 'Sessió de xarxa',
    // tab-timeline: focus panel
    'timeline.foco.etiqueta': 'Focus actual',
    'timeline.foco.lane': 'Llegint només la pista «{lane}»',
    'timeline.foco.completa': 'Vista completa del recorregut del cas',
    'timeline.foco.ayuda.lane': 'Fes-la servir per revisar una sola dimensió clínica sense soroll de la resta del cas.',
    'timeline.foco.ayuda.completa': 'Comença pel conjunt i després baixa a la pista que vulguis validar amb més detall.',
    'timeline.ultimo.hito': 'Última fita',
    'timeline.ultimo.hito.vacio': 'Encara no hi ha esdeveniments registrats en aquesta vista.',
    // tab-timeline: lane filter chips
    'timeline.chips.todas': 'Totes les pistes',
    // tab-timeline: event list
    'timeline.eventos.count': '{count} esdeveniments',
    'timeline.badge.agentes': 'Agents',
    'timeline.vacio.pista': 'No hi ha esdeveniments en aquesta pista.',
  },
} satisfies XarxaStringModule
