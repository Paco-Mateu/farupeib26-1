// Copy for components/pkpd/pro/mobile-shell.tsx
// es values are verbatim copies of the on-screen copy; ca is the Catalan translation.

import type { XarxaStringModule } from './index'

export const strings = {
  es: {
    // LlmExecutionRail
    'rail.step.1': 'Releyendo determinantes y contexto clínico',
    'rail.step.2': 'Reconstruyendo interpretación PK/PD',
    'rail.step.3': 'Preparando recomendación trazable',
    'rail.step.4': 'Actualizando borrador de nota HCE',
    'rail.headline': 'Actualizando el paquete del caso',
    'rail.output':
      'Análisis PK/PD completado. Patrón identificado. Borrador de recomendación preparado para revisión farmacéutica.',
    'rail.agents': 'Agentes en ejecución',
    'rail.output.label': 'Salida de Agentes',

    // AutomationPanel
    'panel.agents.working': 'Agentes trabajando',
    'panel.metric.agentes': 'Agentes',
    'panel.metric.borradores': 'Borradores',
    'panel.metric.tareas': 'Tareas',
    'panel.open': 'Abrir caso completo',

    // Bottom navigation
    'tab.casos': 'Casos',
    'tab.bandeja': 'Bandeja',
    'tab.red': 'Red',
    'tab.sesiones': 'Sesiones',
    'tab.informes': 'Informes',

    // MobileCasoCard
    'card.automation.working': 'Agentes trabajando…',
    'card.automation.borrad': 'borrad.',
    'card.automation.tarea': 'tarea',
    'card.automation.tareas': 'tareas',

    // MobileCasosList
    'list.requieren': 'Requieren acción',
    'list.incompletos': 'Incompletos',
    'list.search.placeholder': 'Buscar paciente o título…',
    'list.empty': 'Sin casos para mostrar',
    'fab.nuevo.title': 'Nuevo caso',

    // MobileMas
    'mas.section.red': 'Red clínica',
    'mas.profesionales': 'Red de profesionales',
    'mas.sesiones': 'Sesiones de red',
    'mas.section.analitica': 'Analítica',
    'mas.informes': 'Informes y actividad',
    'mas.section.admin': 'Administración',
    'mas.agentes': 'Agentes IA',
    'mas.config': 'Config.',
    'mas.footer': 'Xarxa PK/PD Intelligence Hub · v0.1',

    // MobileShell top-bar titles
    'title.casos': 'Casos PK/PD',
    'title.bandeja': 'Bandeja IA',
    'title.sesiones': 'Sesiones',
    'title.mas': 'Xarxa PK/PD',
    'title.profesionales': 'Red de profesionales',
    'title.reporting': 'Informes',
    'title.agentes': 'Agentes IA',
    'title.nuevo': 'Nuevo caso',

    // MobileShell
    'shell.error.caso': 'No se pudo cargar el caso',
  },
  ca: {
    // LlmExecutionRail
    'rail.step.1': 'Rellegint determinants i context clínic',
    'rail.step.2': 'Reconstruint la interpretació PK/PD',
    'rail.step.3': 'Preparant una recomanació traçable',
    'rail.step.4': "Actualitzant l'esborrany de la nota d'HCE",
    'rail.headline': 'Actualitzant el paquet del cas',
    'rail.output':
      'Anàlisi PK/PD completat. Patró identificat. Esborrany de recomanació preparat per a la revisió farmacèutica.',
    'rail.agents': 'Agents en execució',
    'rail.output.label': "Sortida d'agents",

    // AutomationPanel
    'panel.agents.working': 'Agents treballant',
    'panel.metric.agentes': 'Agents',
    'panel.metric.borradores': 'Esborranys',
    'panel.metric.tareas': 'Tasques',
    'panel.open': "Obrir el cas complet",

    // Bottom navigation
    'tab.casos': 'Casos',
    'tab.bandeja': 'Safata',
    'tab.red': 'Xarxa',
    'tab.sesiones': 'Sessions',
    'tab.informes': 'Informes',

    // MobileCasoCard
    'card.automation.working': 'Agents treballant…',
    'card.automation.borrad': 'esborr.',
    'card.automation.tarea': 'tasca',
    'card.automation.tareas': 'tasques',

    // MobileCasosList
    'list.requieren': 'Requereixen acció',
    'list.incompletos': 'Incomplets',
    'list.search.placeholder': 'Cercar pacient o títol…',
    'list.empty': 'Sense casos per mostrar',
    'fab.nuevo.title': 'Cas nou',

    // MobileMas
    'mas.section.red': 'Xarxa clínica',
    'mas.profesionales': 'Xarxa de professionals',
    'mas.sesiones': 'Sessions de xarxa',
    'mas.section.analitica': 'Analítica',
    'mas.informes': 'Informes i activitat',
    'mas.section.admin': 'Administració',
    'mas.agentes': 'Agents IA',
    'mas.config': 'Config.',
    'mas.footer': 'Xarxa PK/PD Intelligence Hub · v0.1',

    // MobileShell top-bar titles
    'title.casos': 'Casos PK/PD',
    'title.bandeja': 'Safata IA',
    'title.sesiones': 'Sessions',
    'title.mas': 'Xarxa PK/PD',
    'title.profesionales': 'Xarxa de professionals',
    'title.reporting': 'Informes',
    'title.agentes': 'Agents IA',
    'title.nuevo': 'Cas nou',

    // MobileShell
    'shell.error.caso': "No s'ha pogut carregar el cas",
  },
} satisfies XarxaStringModule
