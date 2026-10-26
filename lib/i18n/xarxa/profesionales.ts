// Copy for components/pkpd/pro/views/profesionales.tsx
// es values are verbatim copies of the on-screen copy; ca is the Catalan translation.

import type { XarxaStringModule } from './index'

export const strings = {
  es: {
    'loading.title': 'Cargando red de profesionales…',
    'loading.detail': 'Preparando directorio, centros y solicitudes de acceso.',
    'error.cargar': 'No se ha podido cargar el directorio de red.',
    'error.cargar.title': 'No se ha podido cargar el directorio.',
    'error.actualizar': 'No se ha podido actualizar el profesional.',
    'error.aprobar': 'No se ha podido aprobar el acceso.',
    'notice.actualizado': 'Actualizado: {name}',
    'notice.incorporado': 'Incorporado a la red: {name}',

    'header.title': 'Red de profesionales',
    'header.subtitle': 'Crohn PK/PD · Directorio, centros y gobierno de acceso',
    'kpi.activos': 'Activos',
    'kpi.centros': 'Centros',
    'kpi.pendientes': 'Pendientes',

    'filtro.buscar.placeholder': 'Buscar nombre, hospital, especialidad…',
    'filtro.todos.centros': 'Todos los centros',
    'filtro.todos.roles': 'Todos los roles',
    'filtro.todos.estados': 'Todos los estados',
    'estado.activo': 'Activo',
    'estado.pendiente': 'Pendiente',
    'estado.inactivo': 'Inactivo',

    'tab.directorio': 'Directorio',
    'tab.solicitudes': 'Solicitudes',
    'tab.centros': 'Centros',
    'tab.roles': 'Roles',

    'empty.directorio.title': 'No hay profesionales con estos filtros.',
    'empty.directorio.detail': 'Amplía la búsqueda o quita algún filtro activo.',
    'empty.solicitudes.title': 'No hay solicitudes pendientes.',
    'empty.solicitudes.detail': 'Las nuevas solicitudes de acceso aparecerán aquí.',
    'empty.centros.title': 'No hay centros registrados.',
    'empty.centros.detail': 'Cuando la red tenga centros activos aparecerán aquí.',
    'empty.roles.title': 'No hay roles configurados.',
    'empty.roles.detail': 'Los perfiles de acceso y permisos aparecerán aquí.',

    'tile.casos': 'Casos activos',
    'tile.cerrados': 'Cerrados',
    'tile.respuesta': 'Respuesta',
    'sin.programa': 'Sin programa asignado',

    'badge.pendiente': 'Pendiente',
    'solicitado': 'Solicitado: {date}',
    'aprobar.incorporar': 'Aprobar e incorporar',

    'fallback.hospital': 'Hospital',
    'stat.total': 'Total',
    'stat.activos': 'Activos',
    'stat.programas': 'Programas',
    'centros.mas': '+{n} más',

    'roles.ambito': 'Ámbito: {scope}',
    'roles.permisos': 'permisos',

    'panel.perfil': 'Perfil y acceso',
    'panel.actividad': 'Actividad en la red',
    'panel.tiempo.respuesta': 'Tiempo de respuesta',
    'panel.centro': 'Centro',
    'panel.especialidades': 'Especialidades',
    'panel.editar': 'Editar asignación',
    'panel.rol': 'Rol',
    'guardar': 'Guardar cambios',
  },
  ca: {
    'loading.title': 'Carregant la xarxa de professionals…',
    'loading.detail': "Preparant el directori, els centres i les sol·licituds d'accés.",
    'error.cargar': "No s'ha pogut carregar el directori de xarxa.",
    'error.cargar.title': "No s'ha pogut carregar el directori.",
    'error.actualizar': "No s'ha pogut actualitzar el professional.",
    'error.aprobar': "No s'ha pogut aprovar l'accés.",
    'notice.actualizado': 'Actualitzat: {name}',
    'notice.incorporado': 'Incorporat a la xarxa: {name}',

    'header.title': 'Xarxa de professionals',
    'header.subtitle': "Crohn PK/PD · Directori, centres i governança d'accés",
    'kpi.activos': 'Actius',
    'kpi.centros': 'Centres',
    'kpi.pendientes': 'Pendents',

    'filtro.buscar.placeholder': 'Cerca nom, hospital, especialitat…',
    'filtro.todos.centros': 'Tots els centres',
    'filtro.todos.roles': 'Tots els rols',
    'filtro.todos.estados': 'Tots els estats',
    'estado.activo': 'Actiu',
    'estado.pendiente': 'Pendent',
    'estado.inactivo': 'Inactiu',

    'tab.directorio': 'Directori',
    'tab.solicitudes': 'Sol·licituds',
    'tab.centros': 'Centres',
    'tab.roles': 'Rols',

    'empty.directorio.title': 'No hi ha professionals amb aquests filtres.',
    'empty.directorio.detail': 'Amplia la cerca o treu algun filtre actiu.',
    'empty.solicitudes.title': 'No hi ha sol·licituds pendents.',
    'empty.solicitudes.detail': "Les noves sol·licituds d'accés apareixeran aquí.",
    'empty.centros.title': 'No hi ha centres registrats.',
    'empty.centros.detail': 'Quan la xarxa tingui centres actius apareixeran aquí.',
    'empty.roles.title': 'No hi ha rols configurats.',
    'empty.roles.detail': "Els perfils d'accés i permisos apareixeran aquí.",

    'tile.casos': 'Casos actius',
    'tile.cerrados': 'Tancats',
    'tile.respuesta': 'Resposta',
    'sin.programa': 'Sense programa assignat',

    'badge.pendiente': 'Pendent',
    'solicitado': 'Sol·licitat: {date}',
    'aprobar.incorporar': 'Aprovar i incorporar',

    'fallback.hospital': 'Hospital',
    'stat.total': 'Total',
    'stat.activos': 'Actius',
    'stat.programas': 'Programes',
    'centros.mas': '+{n} més',

    'roles.ambito': 'Àmbit: {scope}',
    'roles.permisos': 'permisos',

    'panel.perfil': 'Perfil i accés',
    'panel.actividad': 'Activitat a la xarxa',
    'panel.tiempo.respuesta': 'Temps de resposta',
    'panel.centro': 'Centre',
    'panel.especialidades': 'Especialitats',
    'panel.editar': "Edita l'assignació",
    'panel.rol': 'Rol',
    'guardar': 'Desa els canvis',
  },
} satisfies XarxaStringModule
