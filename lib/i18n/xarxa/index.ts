// Xarxa workspace string registry.
//
// One module per view under lib/i18n/xarxa/<namespace>.ts, each exporting:
//
//   export const strings = {
//     es: { 'key': 'texto' },      // source of truth (current UI copy, verbatim)
//     ca: { 'key': 'text' },      // Catalan; keys missing here fall back to es
//   } satisfies XarxaStringModule
//
// Views consume it with the hook:
//
//   const t = useXarxaT('<namespace>')
//   t('key')
//
// es keys are verbatim copies of today's on-screen copy; ca is a real
// translation (Bellvitge network terminology). The registry assembles every
// module; getXarxaStrings resolves per language with es fallback. Some
// dictionaries also key raw Spanish status strings (e.g. RECOMMENDATION_STATUS
// labels) so backend values passed through t() resolve in ca.

import type { Language } from '@/lib/i18n'

import { strings as adminClinico } from './admin-clinico'
import { strings as agentesIa } from './agentes-ia'
import { strings as bandejaIa } from './bandeja-ia'
import { strings as casosPkpd } from './casos-pkpd'
import { strings as chartsReporting } from './charts-reporting'
import { strings as chartsSimulation } from './charts-simulation'
import { strings as chartsTimeline } from './charts-timeline'
import { strings as cockpitCore } from './cockpit-core'
import { strings as cockpitReview } from './cockpit-review'
import { strings as cockpitRoot } from './cockpit-root'
import { strings as cockpitTabsClinical } from './cockpit-tabs-clinical'
import { strings as cockpitTabsOverview } from './cockpit-tabs-overview'
import { strings as configuracion } from './configuracion'
import { strings as demoIntro } from './demo-intro'
import { strings as mobileShell } from './mobile-shell'
import { strings as nuevoCasoWizard } from './nuevo-caso-wizard'
import { strings as profesionales } from './profesionales'
import { strings as reporting } from './reporting'
import { strings as sesiones } from './sesiones'
import { strings as workspaceState } from './workspace-state'
import { strings as xarxaPro } from './xarxa-pro'

export type XarxaStringModule = {
  es: Record<string, string>
  ca?: Record<string, string>
}

export const XARXA_STRING_MODULES: Record<string, XarxaStringModule> = {
  'admin-clinico': adminClinico,
  'agentes-ia': agentesIa,
  'bandeja-ia': bandejaIa,
  'casos-pkpd': casosPkpd,
  'charts-reporting': chartsReporting,
  'charts-simulation': chartsSimulation,
  'charts-timeline': chartsTimeline,
  'cockpit-core': cockpitCore,
  'cockpit-review': cockpitReview,
  'cockpit-root': cockpitRoot,
  'cockpit-tabs-clinical': cockpitTabsClinical,
  'cockpit-tabs-overview': cockpitTabsOverview,
  configuracion,
  'demo-intro': demoIntro,
  'mobile-shell': mobileShell,
  'nuevo-caso-wizard': nuevoCasoWizard,
  profesionales,
  reporting,
  sesiones,
  'workspace-state': workspaceState,
  'xarxa-pro': xarxaPro,
}

export function getXarxaStrings(namespace: string, language: Language): Record<string, string> {
  const mod = XARXA_STRING_MODULES[namespace]
  if (!mod) return {}
  if (language === 'ca' && mod.ca) return { ...mod.es, ...mod.ca }
  return mod.es
}
