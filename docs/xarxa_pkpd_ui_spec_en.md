# Xarxa PK/PD Intelligence Hub, Product and UI Specification

**Version:** 0.1, art-of-possible prototype  
**Primary active program:** `Crohn PK/PD`  
**Future-ready scope:** extensible to additional diseases, specialties, medicines, determinants, workflows, agents, and centers.  
**Language rule:** the requirements are written in English. Every user-facing label, case title, sample notification, status, role, button, filter, chart title, table title, and clinical example must be displayed in Spanish in the product.

---

## 1. Product intent

The prototype should demonstrate a modern clinical decision-support workspace where a collaborative PK/PD network can manage cases, transform email or structured form requests into standardized clinical cases, orchestrate AI agents, identify data gaps, create tasks, support PK/PD interpretation, prepare human-reviewed recommendations, generate draft clinical notes for the electronic health record, and capture follow-up outcomes for network learning.

The product should not look like a calculator. It should look like a clean, modern, governed clinical operations platform.

The core narrative:

> `Crohn PK/PD` is the first configured clinical program. The platform is designed so administrators can later create and activate additional programs.

Public contextual basis for the seed data: Hospital Universitario de Bellvitge is used as the reference center for the demo environment. Public sources describe Bellvitge as a high-complexity hospital, and the ICS Metropolitana Sud context includes Bellvitge, Hospital de Viladecans, and primary-care centers. The seed data is synthetic and should not be represented as official staff, official activity, or official network membership.

---

## 2. Design principles

### 2.1 Visual style

The interface should be:

- Minimal, bright, and clinical.
- Structured but not dense.
- Card-based, with generous spacing.
- Strongly status-driven.
- Optimized for expert users who need speed, traceability, and confidence.
- Mobile-friendly for quick validations and task updates, with full desktop depth for case analysis.

Recommended visual language:

- White or very light gray workspace background.
- Floating cards with subtle shadows.
- Thin dividers.
- Rounded corners.
- Compact but legible tables.
- Sticky filters and sticky action bars.
- Soft micro-animations for agent work.
- Clear iconography for state, source, confidence, and risk.
- Avoid heavy decorative UI.

### 2.2 Interaction model

The interface should behave like a clinical cockpit:

- The user can always see the case status, next step, responsible role, and blocking gaps.
- The user can distinguish human-confirmed information from AI-extracted information.
- The user can move from overview to detail without losing context.
- Agent suggestions must always be reviewable, explainable, and editable.
- Every AI action must leave a trace.

### 2.3 Human-in-the-loop rule

The prototype must make it explicit that agents assist, but professionals validate.

User-facing text examples:

- `Requiere validación farmacéutica`
- `Borrador generado por IA`
- `Confirmado por profesional`
- `No se puede concluir con los datos actuales`
- `Revisión humana obligatoria`

---

## 3. Global navigation

### 3.1 Main menu

User-facing menu labels must be in Spanish:

1. `Casos PK/PD`
2. `Bandeja IA`
3. `Sesiones de red`
4. `Reporting`
5. `Profesionales y centros`
6. `Agentes IA`
7. `Admin clínico`
8. `Configuración`

Optional secondary items:

- `Biblioteca de protocolos`
- `Formularios`
- `Determinantes`
- `Auditoría`

### 3.2 Header

The global header should include:

- Product name: `Xarxa PK/PD`
- Active program selector: `Programa: Crohn PK/PD`
- Center selector: `Centro: Todos los centros`
- Date range selector: `Últimos 30 días`
- Search box: `Buscar caso, paciente, profesional o centro...`
- Notification icon with counter.
- User avatar with role.

### 3.3 Command palette

A keyboard-first command palette should be available with `Cmd/Ctrl + K`.

User-facing placeholder:

- `Buscar acciones, casos, centros o profesionales...`

Example commands:

- `Crear caso PK/PD`
- `Abrir bandeja IA`
- `Ver casos pendientes de determinantes`
- `Crear nuevo programa clínico`
- `Preparar sesión de red`
- `Generar informe de actividad`

---

## 4. Dashboard and table-first case management

## 4.1 Page: `Casos PK/PD`

This is the main operational screen. It should be the default landing page for most expert users.

### Page goal

Allow the network to view, filter, prioritize, open, and manage all PK/PD cases.

### Top KPI cards

Display compact KPI cards above the table:

1. `Casos activos`
2. `Nuevos hoy`
3. `Pendientes de determinantes`
4. `Listos para revisión`
5. `Con gaps críticos`
6. `Seguimiento vencido`

Each card should be clickable and apply the relevant filter.

### Primary filters

Use a modern filter bar with chips, saved views, and a collapsible advanced filter panel.

User-facing filters:

- `Especialidad`
- `Programa clínico`
- `Centro`
- `Profesional solicitante`
- `Farmacéutico asignado`
- `Tipo de caso`
- `Estado`
- `Fecha de entrada`
- `Prioridad`
- `Origen`
- `Fármaco`
- `Gaps`
- `Determinantes`
- `Seguimiento`
- `Resultado`

Quick filter chips:

- `Nuevos`
- `Incompletos`
- `Pendiente laboratorio`
- `Listos para revisar`
- `Para sesión`
- `Seguimiento 4 semanas`
- `Seguimiento 8 semanas`
- `Cerrados`

### Search

Search box placeholder:

- `Buscar por caso, paciente, centro, fármaco o profesional...`

Search must support:

- Case ID.
- Synthetic patient code.
- Center.
- Professional.
- Drug.
- Clinical case type.
- Status.

### Table columns

Recommended columns:

| Column key | User-facing label | Notes |
|---|---|---|
| `caseId` | `Caso` | Case ID and compact avatar. |
| `patientCode` | `Paciente` | Synthetic or anonymized patient code. |
| `specialty` | `Especialidad` | Example: `Digestivo`. |
| `program` | `Programa` | Example: `Crohn PK/PD`. |
| `center` | `Centro` | Center name. |
| `requester` | `Solicitante` | Professional who requested review. |
| `assignedPharmacist` | `Farmacéutico asignado` | Assigned reviewer. |
| `caseType` | `Tipo` | `Debutante`, `Pérdida de respuesta`, etc. |
| `entrySource` | `Origen` | `Email`, `Formulario normalizado`, `App móvil`. |
| `pipelineStage` | `Estado` | Visual pill and progress bar. |
| `priority` | `Prioridad` | Low/medium/high/urgent. |
| `gapsCount` | `Gaps` | Number plus severity. |
| `nextAction` | `Siguiente paso` | Short action. |
| `updatedAt` | `Actualizado` | Date and freshness indicator. |

### Row expansion

Each row should support inline expansion showing:

- Short clinical summary.
- Top three gaps.
- Next action.
- Agent last activity.
- Buttons: `Abrir caso`, `Asignar`, `Solicitar datos`, `Marcar para sesión`.

### Bulk actions

When rows are selected:

- `Asignar responsable`
- `Cambiar prioridad`
- `Marcar para sesión`
- `Enviar recordatorio`
- `Exportar selección`

### Empty states

Example text:

- `No hay casos con estos filtros.`
- `Prueba a ampliar el rango de fechas o quitar algún filtro.`

---

## 5. Pipeline representation

### 5.1 Pipeline stages

Every case must have one active pipeline stage and a list of completed stages.

User-facing pipeline labels:

1. `Solicitud recibida`
2. `Caso creado por IA`
3. `Datos incompletos`
4. `Pendiente de determinantes`
5. `Determinantes recibidos`
6. `Análisis PK/PD generado`
7. `Revisión farmacéutica`
8. `Revisión médica`
9. `Discusión en red`
10. `Informe generado`
11. `Informe validado`
12. `Registrado en HCE`
13. `Seguimiento 4 semanas`
14. `Seguimiento 8 semanas`
15. `Cerrado con resultado`

### 5.2 Pipeline UI patterns

Use three complementary patterns:

1. Compact table pill: `Análisis PK/PD generado`.
2. Horizontal stepper in the case cockpit.
3. Kanban board in task and operations views.

### 5.3 Next-step card

Every case should display a prominent next-step card.

Example:

- Title: `Siguiente paso`
- Text: `Confirmar si la muestra corresponde a nivel valle.`
- Owner: `Enfermería EII`
- Due date: `Hoy`
- Action buttons: `Solicitar confirmación`, `Marcar resuelto`, `Reasignar`

---

## 6. Page: `Bandeja IA`

### Page goal

Show incoming unstructured requests and AI-transformed cases.

### Sections

1. `Solicitudes recibidas`
2. `Casos creados por IA`
3. `Requieren revisión`
4. `Errores o ambigüedades`

### Table columns

- `Origen`
- `Remitente`
- `Centro`
- `Asunto`
- `Paciente`
- `Programa sugerido`
- `Tipo sugerido`
- `Confianza IA`
- `Gaps detectados`
- `Acción`

### Email preview panel

Left side: original request.  
Right side: structured extraction.

User-facing labels:

- `Email original`
- `Extracción IA`
- `Datos detectados`
- `Datos faltantes`
- `Crear caso`
- `Descartar`
- `Editar antes de crear`

### Agent animation

When processing a new email:

- Show animated status: `Leyendo solicitud...`
- Then: `Identificando programa clínico...`
- Then: `Extrayendo datos del caso...`
- Then: `Detectando gaps...`
- Then: `Caso preparado para revisión`

Use subtle shimmer, progress dots, and an animated agent activity rail. Avoid distracting motion.

---

## 7. Case Cockpit

The `Case Cockpit` is not a standalone menu page. It is the detailed view opened from `Casos PK/PD`, `Bandeja IA`, `Sesiones de red`, or `Reporting`.

### 7.1 Global case header

The case header must remain sticky.

Elements:

- Case ID: `PKPD-2026-0002`
- Title: `Pérdida de respuesta secundaria con exposición baja`
- Patient code: `Paciente P-1048`
- Program: `Crohn PK/PD`
- Center: `Hospital Universitario de Bellvitge`
- Case type: `Pérdida de respuesta`
- Priority pill: `Alta`
- Pipeline pill: `Análisis PK/PD generado`
- Next step: `Revisión farmacéutica`
- Assigned professional.
- Buttons: `Guardar`, `Solicitar datos`, `Generar informe`, `Marcar para sesión`, `Cerrar caso`

### 7.2 Case cockpit tabs

User-facing tabs:

1. `Resumen`
2. `Timeline`
3. `Datos y determinantes`
4. `Gaps y tareas`
5. `Análisis PK/PD`
6. `Simulación`
7. `Recomendación`
8. `Informe HCE`
9. `Aprendizaje`
10. `Auditoría`

---

## 8. Case Cockpit tab details

## 8.1 Tab: `Resumen`

### Content blocks

1. `Resumen IA`
2. `Motivo de consulta`
3. `Datos clave`
4. `Estado del caso`
5. `Gaps críticos`
6. `Hipótesis principal`
7. `Siguiente paso`

### Example user-facing content

`Paciente con enfermedad de Crohn en tratamiento biológico, con sospecha de pérdida de respuesta secundaria. Existen biomarcadores inflamatorios elevados. La interpretación PK/PD requiere confirmar que la muestra corresponde a nivel valle.`

### Cards

- `Completitud del caso`
- `Interpretabilidad PK/PD`
- `Riesgo clínico-operativo`
- `Confianza IA`

Example values:

- `Completitud del caso: 72%`
- `Interpretabilidad PK/PD: Media`
- `Riesgo clínico-operativo: Alto`
- `Confianza IA: 81%`

## 8.2 Tab: `Timeline`

### Purpose

Show the clinical story as an interactive timeline.

### Timeline lanes

Use a multi-lane horizontal timeline with zoom.

User-facing lane labels:

1. `Clínica`
2. `Tratamiento`
3. `Laboratorio`
4. `Administración`
5. `Decisiones`
6. `Tareas`

### Timeline event types

- `Diagnóstico`
- `Inicio de tratamiento`
- `Cambio de dosis`
- `Administración`
- `Extracción`
- `Determinante recibido`
- `Síntomas`
- `Endoscopia`
- `Decisión`
- `Informe`
- `Seguimiento`

### Timeline visual models

The prototype should support at least three representations:

#### A. Horizontal clinical swimlane

Best for case review. Events appear on lanes by type. Each event card can be expanded.

#### B. Vertical narrative timeline

Best for mobile and clinician reading. Events are displayed chronologically with icons and agent annotations.

#### C. PK/PD overlay timeline

Best for pharmacokinetic interpretation. Treatment doses, samples, and drug levels are aligned to show whether a level can be interpreted as trough.

### Agent insights on timeline

Agent annotations should appear as small callouts:

- `La muestra no parece coincidir con el valle.`
- `La calprotectina aumenta tras espaciar el intervalo.`
- `Existe discrepancia entre la dosis del email y la registrada.`
- `El seguimiento de 8 semanas está vencido.`

## 8.3 Tab: `Datos y determinantes`

### Layout

Use an editable form with sections, not a long flat form.

Sections:

1. `Paciente`
2. `Enfermedad`
3. `Tratamiento actual`
4. `Tratamientos previos`
5. `Determinantes PK/PD`
6. `Biomarcadores`
7. `Seguridad`
8. `Datos administrativos`

### Field status icons

Each field should display a source and validation state:

- `Confirmado`
- `Extraído por IA`
- `Pendiente de validar`
- `Faltante`
- `Conflictivo`
- `Obsoleto`

Suggested visual mapping:

- `Confirmado`: check circle.
- `Extraído por IA`: sparkle icon.
- `Pendiente de validar`: clock icon.
- `Faltante`: empty circle or alert icon.
- `Conflictivo`: warning triangle.
- `Obsoleto`: hourglass or faded clock.

### Editable controls

Use modern controls:

- Autocomplete selectors.
- Date/time pickers.
- Unit-aware numeric fields.
- Inline validation.
- Conditional field reveal.
- Toggle chips.
- Drug selector with route and interval.
- Lab determinant cards.

Example field labels:

- `Peso actual`
- `Fecha de última administración`
- `Hora de última administración`
- `Fecha de extracción`
- `Hora de extracción`
- `Concentración sérica del fármaco`
- `Anticuerpos anti-fármaco`
- `PCR`
- `Calprotectina fecal`
- `Albúmina`
- `Fármaco actual`
- `Dosis actual`
- `Intervalo actual`
- `Vía de administración`
- `Adherencia referida`

## 8.4 Tab: `Gaps y tareas`

### Purpose

Show what prevents the case from being interpretable or actionable.

### Gap table columns

- `Gap`
- `Impacto`
- `Responsable sugerido`
- `Estado`
- `Fecha límite`
- `Acción`

### Gap severity labels

- `Crítico`
- `Importante`
- `Informativo`

### Task statuses

- `Pendiente`
- `En curso`
- `Bloqueada`
- `Resuelta`
- `Cancelada`

### Task actions

- `Asignar`
- `Enviar recordatorio`
- `Marcar resuelta`
- `Reabrir`
- `Añadir comentario`

## 8.5 Tab: `Análisis PK/PD`

### Purpose

Present a structured, explainable PK/PD interpretation.

### Blocks

1. `Patrón sugerido`
2. `Datos utilizados`
3. `Datos excluidos`
4. `Supuestos`
5. `Limitaciones`
6. `Opciones clínicas`
7. `Evidencia y protocolo`

### Possible pattern labels

- `Baja exposición sin inmunogenicidad documentada`
- `Baja exposición con anticuerpos anti-fármaco positivos`
- `Exposición adecuada con actividad inflamatoria`
- `Exposición alta con remisión clínica`
- `Datos insuficientes para interpretación`
- `Muestra no interpretable`
- `Posible problema de adherencia`
- `Posible fallo farmacodinámico`

### Confidence display

Show confidence as a segmented bar, not a single magic number.

Dimensions:

- `Calidad de datos`
- `Coherencia temporal`
- `Concordancia clínica`
- `Completitud de determinantes`
- `Consenso del protocolo`

## 8.6 Tab: `Simulación`

### Purpose

Compare scenarios. For the art-of-possible prototype, the simulation can be seeded or mocked, but the UI must separate calculation from natural-language explanation.

### Required visual elements

- Concentration-over-time curve.
- Dosing markers.
- Sample marker.
- Target zone band.
- Scenario comparison cards.
- Assumptions drawer.

User-facing chart labels:

- `Exposición estimada`
- `Dosis actual`
- `Muestra`
- `Zona objetivo`
- `Escenario actual`
- `Escenario propuesto`

### Scenario cards

Examples:

- `Mantener dosis`
- `Acortar intervalo`
- `Aumentar dosis`
- `Cambiar mecanismo`
- `Repetir determinantes`
- `Desintensificar`

Each card should contain:

- Expected outcome.
- Risk.
- Uncertainty.
- Data required.
- Action button: `Comparar`.

## 8.7 Tab: `Recomendación`

### Purpose

Show the AI-prepared recommendation and human validation workflow.

### Sections

1. `Propuesta del sistema`
2. `Justificación`
3. `Alternativas`
4. `Datos pendientes`
5. `Decisión profesional`
6. `Comentarios`

### Buttons

- `Aceptar como borrador`
- `Editar recomendación`
- `Solicitar más datos`
- `Enviar a digestivo`
- `Enviar a sesión de red`
- `Rechazar y justificar`

### Validation status

- `Borrador IA`
- `Editado por farmacia`
- `Pendiente de revisión médica`
- `Validado`
- `Rechazado`

## 8.8 Tab: `Informe HCE`

### Purpose

Prepare the final note for the electronic health record.

### Required sections

- `Motivo de consulta`
- `Datos revisados`
- `Determinantes PK/PD`
- `Interpretación`
- `Recomendación`
- `Plan de seguimiento`
- `Profesional validador`
- `Versión del protocolo`

### Buttons

- `Generar borrador`
- `Copiar informe`
- `Exportar PDF`
- `Enviar a HCE`
- `Solicitar co-validación`

## 8.9 Tab: `Aprendizaje`

### Purpose

Close the learning loop.

### Sections

- `Seguimiento 4 semanas`
- `Seguimiento 8 semanas`
- `Resultado clínico`
- `Resultado bioquímico`
- `Resultado PK/PD`
- `Lección aprendida`
- `Apto para aprendizaje de red`

### Learning labels

- `Caso docente`
- `Caso recurrente`
- `Caso discordante`
- `Nuevo patrón`
- `Revisión de protocolo sugerida`

## 8.10 Tab: `Auditoría`

### Purpose

Show traceability.

### Audit event labels

- `Caso creado`
- `Dato extraído por IA`
- `Dato confirmado`
- `Gap detectado`
- `Tarea asignada`
- `Análisis generado`
- `Recomendación editada`
- `Informe validado`
- `Caso cerrado`

---

## 9. Page: `Sesiones de red`

### Page goal

Prepare and run collaborative review sessions.

### Main views

- `Próxima sesión`
- `Casos propuestos`
- `Agenda`
- `Votación`
- `Acta`
- `Casos docentes`

### Case selection criteria

The system should suggest cases for session based on:

- High uncertainty.
- Conflicting data.
- Unusual pattern.
- Disagreement between professionals.
- Need for protocol review.
- Strong teaching value.
- Outcome available after follow-up.

### User-facing actions

- `Añadir a sesión`
- `Quitar de sesión`
- `Preparar resumen`
- `Iniciar votación`
- `Generar acta`
- `Marcar como caso docente`

---

## 10. Page: `Reporting`

### Page goal

Show activity, bottlenecks, outcome capture, and network learning.

### Filters

- `Centro`
- `Programa clínico`
- `Especialidad`
- `Fármaco`
- `Tipo de caso`
- `Estado`
- `Fecha`
- `Profesional`
- `Resultado`

### Dashboard sections

#### Operational activity

Charts:

- `Casos por centro`
- `Casos por tipo`
- `Casos por estado`
- `Tiempo hasta recomendación`
- `Gaps más frecuentes`
- `Determinantes pendientes`

#### Clinical-operational patterns

Charts:

- `Patrones PK/PD`
- `Recomendaciones emitidas`
- `Cambios de tratamiento propuestos`
- `Optimizaciones propuestas`
- `Desintensificaciones propuestas`

#### Learning and network

Charts:

- `Casos discutidos en red`
- `Casos docentes generados`
- `Seguimientos cerrados`
- `Variabilidad entre centros`
- `Protocolos revisados`

### Visualizations

Use:

- Bar charts.
- Line charts.
- Donut charts only for simple proportions.
- Heatmap for center-stage bottlenecks.
- Funnel chart for pipeline progression.
- Timeline chart for case volume over time.

---

## 11. Page: `Profesionales y centros`

### Page goal

Manage centers, teams, roles, and activity.

### Tabs

- `Centros`
- `Profesionales`
- `Roles`
- `Equipos`
- `Actividad`

### Centers table columns

- `Centro`
- `Tipo`
- `Territorio`
- `Estado`
- `Programas activos`
- `Casos activos`
- `Profesionales`
- `Última actividad`

### Professionals table columns

- `Profesional`
- `Rol`
- `Centro`
- `Especialidad`
- `Programas`
- `Casos asignados`
- `Estado`

### Role labels

- `Administrador de red`
- `Coordinador de programa`
- `Farmacéutico experto`
- `Digestólogo`
- `Enfermería EII`
- `Laboratorio`
- `Residente`
- `Observador docente`

---

## 12. Page: `Agentes IA`

### Page goal

Show what agents do, their status, activity, limits, and audit trace.

### Agent cards

Cards should display:

- Agent name.
- Status.
- Program.
- Main function.
- Last run.
- Success rate for the demo.
- Human validation requirement.

User-facing agent names:

- `Agente de ingesta`
- `Agente de gaps`
- `Agente de laboratorio`
- `Agente PK/PD`
- `Agente de recomendación`
- `Agente de informe HCE`
- `Agente de sesión`
- `Agente de aprendizaje`

### Agent detail view

Tabs:

- `Actividad`
- `Capacidades`
- `Límites`
- `Fuentes`
- `Validación humana`
- `Auditoría`

Important user-facing constraints:

- `No firma recomendaciones.`
- `No modifica tratamientos.`
- `No escribe en HCE sin validación.`
- `Requiere revisión humana obligatoria.`

### Agent animation model

When an agent acts inside a case:

- Show small animated token in the case header: `Agente de gaps trabajando...`
- Show progress messages in an activity rail.
- Use a subtle pulse next to newly detected gaps.
- Use a slide-in task card when a task is created.
- Use a sparkle marker only for AI-generated draft content.
- Avoid animated avatars that look childish.

---

## 13. Page: `Admin clínico`

### Page goal

Demonstrate that the product is configured for Crohn now, but can add more programs in the future.

### Admin landing table

Columns:

- `Programa`
- `Especialidad`
- `Estado`
- `Centros`
- `Casos`
- `Versión`
- `Última revisión`
- `Acciones`

Seed rows:

- `Crohn PK/PD`, `Digestivo`, `Activo`
- `Colitis ulcerosa PK/PD`, `Digestivo`, `Borrador`
- `Biológicos en reumatología`, `Reumatología`, `Borrador`
- `TDM antibióticos`, `Infecciosas`, `Borrador`

### Admin detail for `Crohn PK/PD`

Tabs:

1. `Resumen`
2. `Enfermedades`
3. `Fármacos`
4. `Determinantes`
5. `Formularios`
6. `Workflow`
7. `Agentes`
8. `Informes`
9. `Compartición`
10. `Versiones`

### Create program wizard

User-facing steps:

1. `Tipo de programa`
2. `Especialidad`
3. `Enfermedad o indicación`
4. `Fármacos`
5. `Determinantes`
6. `Formularios`
7. `Workflow`
8. `Agentes`
9. `Revisión y publicación`

Buttons:

- `Guardar borrador`
- `Continuar`
- `Publicar programa`
- `Cancelar`

### Governance states

- `Borrador`
- `En revisión clínica`
- `Validado por comité`
- `Activo`
- `Retirado`
- `Archivado`

---

## 14. Page: `Configuración`

### Page goal

Global settings for environment, notifications, integration simulation, appearance, and audit.

Sections:

- `Preferencias de usuario`
- `Notificaciones`
- `Integraciones`
- `Seguridad`
- `Auditoría`
- `Tema visual`
- `Entorno demo`

Integration labels for prototype:

- `Email`
- `Historia clínica`
- `Laboratorio`
- `App móvil`
- `Repositorio de protocolos`

---

## 15. Mobile app specification

### Goal

The mobile app is for speed, not deep analysis.

### Mobile navigation

1. `Mis tareas`
2. `Casos`
3. `Alertas`
4. `Sesiones`
5. `Perfil`

### Mobile actions

- `Confirmar dato`
- `Responder solicitud`
- `Marcar tarea resuelta`
- `Validar borrador`
- `Añadir comentario`
- `Enviar a sesión`

### Mobile examples

For a digestologist:

- `Solicitar revisión PK/PD`
- `Responder datos pendientes`
- `Ver recomendación`

For nursing:

- `Confirmar última administración`
- `Programar extracción`
- `Registrar síntomas`

For pharmacy:

- `Revisar gaps críticos`
- `Validar informe`
- `Enviar recordatorio`

---

## 16. Data model specification

The prototype should use a flexible document-oriented model. Field names can be technical English, but every display label and seeded clinical content must be Spanish.

### 16.1 Collections / entities

Recommended collections:

- `clinicalPrograms`
- `specialties`
- `centers`
- `professionals`
- `roles`
- `agents`
- `forms`
- `cases`
- `caseEvents`
- `tasks`
- `agentRuns`
- `recommendations`
- `clinicalNotes`
- `followUps`
- `reports`
- `auditLog`

### 16.2 Core case model

```json
{
  "caseId": "PKPD-2026-0002",
  "title": "Pérdida de respuesta secundaria con exposición baja",
  "programId": "prog-crohn-pkpd",
  "specialtyId": "esp-digestivo",
  "centerId": "ctr-hub",
  "patientCode": "P-1048",
  "caseType": "Pérdida de respuesta",
  "entrySource": "Email",
  "priority": "Alta",
  "pipelineStage": "Análisis PK/PD generado",
  "nextAction": "Revisión farmacéutica",
  "assignedTo": "pro-farm-001",
  "requesterId": "pro-dig-001",
  "clinicalSummary": "...",
  "diseaseContext": {},
  "therapyContext": {},
  "labDeterminants": [],
  "biomarkers": [],
  "gaps": [],
  "tasks": [],
  "timeline": [],
  "pkpdInterpretation": {},
  "recommendations": [],
  "clinicalNote": {},
  "followUps": [],
  "audit": []
}
```

### 16.3 Determinant model

```json
{
  "determinantId": "det-adalimumab-level",
  "label": "Concentración sérica de adalimumab",
  "type": "drug_concentration",
  "unit": "µg/mL",
  "value": 3.1,
  "sampleDateTime": "2026-05-10T08:12:00+02:00",
  "relationToDose": "Valle confirmado",
  "status": "Confirmado",
  "source": "Laboratorio",
  "interpretation": "Baja exposición"
}
```

### 16.4 Task model

```json
{
  "taskId": "tsk-0001",
  "caseId": "PKPD-2026-0002",
  "title": "Confirmar fecha y hora de última administración",
  "ownerRole": "Enfermería EII",
  "ownerId": "pro-enf-001",
  "priority": "Alta",
  "status": "Pendiente",
  "dueDate": "2026-05-18",
  "createdBy": "Agente de gaps"
}
```

---

## 17. Required seed data

The prototype should be initialized with:

- 1 active clinical program: `Crohn PK/PD`.
- 3 draft future programs.
- 8 centers.
- 12 professionals.
- 8 roles.
- 8 agents.
- 3 forms.
- 5 fictitious cases.
- At least 30 timeline events.
- At least 20 tasks.
- At least 5 recommendations.
- At least 5 draft or validated HCE notes.
- At least 5 follow-up records.

Seed data files are provided separately:

- `xarxa_pkpd_seed_data_es.json`
- `xarxa_pkpd_seed_mongodb.js`

---

## 18. Five fictitious cases to seed

### Case 1

- Title: `Debutante con Crohn ileocolónico`
- Origin: `Formulario normalizado`
- Type: `Debutante`
- State: `Datos incompletos`
- Main value: shows initial-treatment readiness and missing safety data.

### Case 2

- Title: `Pérdida de respuesta secundaria con exposición baja`
- Origin: `Email`
- Type: `Pérdida de respuesta`
- State: `Análisis PK/PD generado`
- Main value: classic optimization case.

### Case 3

- Title: `Inmunogenicidad probable con infliximab`
- Origin: `Email`
- Type: `Cambio de medicación`
- State: `Revisión farmacéutica`
- Main value: differentiates intensification from treatment change.

### Case 4

- Title: `Actividad inflamatoria con exposición adecuada`
- Origin: `Formulario normalizado`
- Type: `Cambio de medicación`
- State: `Discusión en red`
- Main value: probable pharmacodynamic failure.

### Case 5

- Title: `Remisión con exposición alta`
- Origin: `Seguimiento programado`
- Type: `Desintensificación`
- State: `Informe generado`
- Main value: shows safety, sustainability, and follow-up logic.

---

## 19. Acceptance criteria

### General

- The user can open the app and immediately understand that `Crohn PK/PD` is active.
- The user can see that additional programs can be created in `Admin clínico`.
- The table of cases is the operational center.
- Each case has a clear pipeline state and next step.
- AI activity is visible but not intrusive.
- Every agent action is reviewable.
- Every recommendation requires human validation.

### Case table

- Filters work by center, program, status, type, professional, date, priority, and gaps.
- Search can find case IDs, patient codes, centers, professionals, drugs, and statuses.
- Rows show current state, next step, and gaps.

### Case cockpit

- All tabs are reachable.
- The case header remains visible.
- The timeline can show clinical, treatment, lab, decision, and task events.
- Gaps generate tasks.
- PK/PD interpretation shows pattern, confidence, assumptions, and limitations.
- The recommendation can be accepted, edited, rejected, or sent to session.
- The HCE note can be generated as a draft.

### Admin

- `Crohn PK/PD` is preconfigured.
- A user can start creating a new program.
- Draft future programs are visible.
- Drugs, determinants, forms, workflow, and agents are configurable.

### Reporting

- Shows activity, bottlenecks, patterns, and learning metrics.
- Filters apply across charts.

---

## 20. Suggested demo script

1. Open `Casos PK/PD`.
2. Filter by `Estado: Datos incompletos`.
3. Open `PKPD-2026-0002` from an email.
4. Show `Email original` and structured extraction in `Bandeja IA`.
5. Open `Case Cockpit`.
6. Show `Resumen`, `Timeline`, and `Datos y determinantes`.
7. Show `Gaps y tareas`, especially a missing trough confirmation.
8. Resolve one gap.
9. Show the pipeline moving to `Análisis PK/PD generado`.
10. Show `Simulación` and compare scenarios.
11. Show `Recomendación` and edit/validate the draft.
12. Generate `Informe HCE`.
13. Mark case for `Seguimiento 4 semanas`.
14. Open `Reporting` and show bottlenecks.
15. Open `Admin clínico` and show that new programs can be created.

---

## 21. Tone and writing rules for UI copy

The product should use concise Spanish UI copy. Avoid overly technical explanations unless the user opens details.

Preferred style:

- `Faltan datos críticos para interpretar el caso.`
- `La muestra no está confirmada como valle.`
- `El sistema propone revisar exposición antes de cambiar de mecanismo.`
- `Este borrador requiere validación farmacéutica.`

Avoid:

- `La IA decide...`
- `Tratamiento recomendado automáticamente...`
- `Dosis final...`
- `Cambio obligatorio...`

---

## 22. Non-functional requirements

### Performance

- Case table initial load under 2 seconds for demo dataset.
- Filters must feel instant.
- Agent animations must not block user actions.

### Accessibility

- All status colors must include text labels.
- Keyboard navigation for tables and forms.
- Tooltips for icons.
- Sufficient contrast.

### Auditability

- Every generated output must show source, timestamp, agent, model/protocol version, and validation status.

### Security posture for prototype

- Use synthetic patients only.
- Use anonymized patient codes.
- Do not store real patient identifiers.
- Clearly mark demo data as synthetic.

### Safety posture

- AI agents do not prescribe.
- AI agents do not write to the clinical record without human validation.
- AI-generated recommendations must display limitations and assumptions.

