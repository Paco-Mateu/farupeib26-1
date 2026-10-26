// Copy for components/pkpd/pro/views/reporting.tsx
// es values are verbatim copies of the on-screen copy; ca is the Catalan translation.

import type { XarxaStringModule } from './index'

export const strings = {
  es: {
    'error.cargar': 'No se ha podido cargar el reporting.',
    'header.titulo': 'Informes y actividad',
    'header.programa': 'Programa: Crohn PK/PD',
    'loading.titulo': 'Cargando reporting de la red…',
    'loading.detalle': 'Preparando KPIs, actividad y distribución de casos.',
    'empty.titulo': 'Todavía no hay actividad suficiente.',
    'empty.detalle':
      'Cuando el programa genere casos y seguimiento, aquí aparecerán los indicadores de red.',
    'empty.recargar': 'Recargar',
    'deck.modulos': 'Módulos con automatización',
    'deck.cobertura.etapa': 'Cobertura de Agentes por etapa',
    'deck.salidas': 'Salidas generadas por Agentes',
    'deck.centros': 'Centros con mayor actividad de Agentes',
    'insight.casos':
      'La mayor concentración de casos está en «{label}» con {value} caso(s).',
    'insight.gap':
      'El gap más repetido ahora es «{label}» y aparece en {value} caso(s).',
    'insight.modulo':
      'La automatización se concentra sobre todo en {label} ({value} ejecuciones).',
    'insight.centro':
      '{label} es el centro con mayor actividad asistida por LLM en este período.',
    'resumen.titulo': 'Resumen ejecutivo',
    'resumen.subtitulo': 'Dónde actúa la red y dónde están ayudando más los Agentes',
    'resumen.lectura':
      'Lectura rápida para coordinación: carga activa, cobertura asistida y puntos donde conviene intervenir antes.',
    'kpi.pasos': 'Pasos de Agentes',
    'kpi.pasos.nota': 'Ejecuciones registradas',
    'kpi.casos': 'Casos preparados',
    'kpi.casos.nota': 'Casos asistidos por Agentes',
    'kpi.borradores': 'Borradores',
    'kpi.borradores.nota': 'Recomendaciones, notas e invitaciones',
    'kpi.cobertura': 'Cobertura',
    'kpi.cobertura.nota': 'Casos activos con apoyo de Agentes',
    'resumen.vacio':
      'Todavía no hay suficiente actividad como para generar lectura ejecutiva en este período.',
    'cobertura.vacio': 'Sin señales de Agentes con los filtros actuales.',
  },
  ca: {
    'error.cargar': "No s'ha pogut carregar el reporting.",
    'header.titulo': 'Informes i activitat',
    'header.programa': 'Programa: Crohn PK/PD',
    'loading.titulo': 'Carregant el reporting de la xarxa…',
    'loading.detalle': 'Preparant KPIs, activitat i distribució de casos.',
    'empty.titulo': 'Encara no hi ha prou activitat.',
    'empty.detalle':
      'Quan el programa generi casos i seguiment, aquí apareixeran els indicadors de xarxa.',
    'empty.recargar': 'Recarregar',
    'deck.modulos': 'Mòduls amb automatització',
    'deck.cobertura.etapa': "Cobertura d'agents per etapa",
    'deck.salidas': 'Sortides generades pels agents',
    'deck.centros': "Centres amb més activitat d'agents",
    'insight.casos':
      'La major concentració de casos és a «{label}» amb {value} cas(os).',
    'insight.gap':
      'El gap més repetit ara és «{label}» i apareix en {value} cas(os).',
    'insight.modulo':
      "L'automatització es concentra sobretot en {label} ({value} execucions).",
    'insight.centro':
      '{label} és el centre amb més activitat assistida per LLM en aquest període.',
    'resumen.titulo': 'Resum executiu',
    'resumen.subtitulo': 'On actua la xarxa i on estan ajudant més els agents',
    'resumen.lectura':
      'Lectura ràpida per a coordinació: càrrega activa, cobertura assistida i punts on convé intervenir abans.',
    'kpi.pasos': 'Passos dels agents',
    'kpi.pasos.nota': 'Execucions registrades',
    'kpi.casos': 'Casos preparats',
    'kpi.casos.nota': 'Casos assistits pels agents',
    'kpi.borradores': 'Esborranys',
    'kpi.borradores.nota': 'Recomanacions, notes i invitacions',
    'kpi.cobertura': 'Cobertura',
    'kpi.cobertura.nota': 'Casos actius amb suport dels agents',
    'resumen.vacio':
      'Encara no hi ha prou activitat per generar una lectura executiva en aquest període.',
    'cobertura.vacio': "Sense senyals d'agents amb els filtres actuals.",
  },
} satisfies XarxaStringModule
