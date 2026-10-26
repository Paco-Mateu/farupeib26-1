// Copy for components/pkpd/pro/workspace-state.tsx and the workspace Suspense fallback.
// es values are verbatim copies of the on-screen copy; ca is the Catalan translation.

import type { XarxaStringModule } from './index'

export const strings = {
  es: {
    'loading.title': 'Cargando datos…',
    'loading.workspace': 'Cargando espacio de trabajo…',
    'error.title': 'No se han podido cargar los datos.',
    'error.retry': 'Reintentar',
  },
  ca: {
    'loading.title': 'Carregant dades…',
    'loading.workspace': 'Carregant espai de treball…',
    'error.title': "No s'han pogut carregar les dades.",
    'error.retry': 'Tornar-ho a provar',
  },
} satisfies XarxaStringModule
