# Xarxa PK/PD Delivery Plan

Version: 0.1  
Scope: From styled prototype to working PK/PD case-management product  
Primary program: `Crohn PK/PD`  
Language rule: all user-facing product copy is Spanish

## 1. Product North Star

The product should feel like a governed clinical workbench where a network of professionals manages PK/PD cases with AI assistance and human validation.

The unit of work is the case.

Every screen must help the user answer four questions immediately:

1. Where is the case in the workflow?
2. What is missing or blocked?
3. Who owns the next step?
4. What did AI do that a human must validate?

The product should not feel like:

- a calculator
- a marketing demo
- a static dashboard
- a long scrolling prototype

It should feel like:

- operational
- clinical
- auditable
- fast
- human-led

## 2. UX Architecture Decisions

These are the core UI decisions we should commit to before further implementation.

### 2.1 Page hierarchy

- `Casos PK/PD` is the default landing page.
- `Case Cockpit` is a full-page workspace opened from queue rows.
- `Nuevo caso` is a full-page wizard, not a small modal.
- `Editar datos`, `corregir extraccion IA`, `revisar recomendacion`, and `anadir determinantes` open in a large right-side clinical sheet.
- Small confirmation modals are used only for short actions like `Cerrar caso`, `Marcar resuelta`, or `Enviar recordatorio`.

### 2.2 Layout patterns

- Table-first queue for operational screens.
- Sticky header in the case cockpit.
- Sticky filters on queue pages.
- Sticky action rail on cockpit pages.
- Tabbed cockpit, never long stacked content.
- Side drawers for trace detail, task detail, and case preview.
- Right-side operational panel inside the cockpit.

### 2.3 Human + IA presence

- AI output is visible, but never presented as final.
- Human-confirmed fields and AI-extracted fields must always look different.
- Every agent action creates a visible trace.
- Recommendation, HCE note, and protocol outputs always show:
  - source
  - version
  - timestamp
  - validation state
  - assumptions
  - limitations

## 3. Target Human + IA Workflow

This is the workflow the whole build should serve.

### 3.1 Intake and case creation

1. Request enters from email, normalized form, mobile, or internal referral.
2. `Agente de ingesta` identifies likely program, patient code, center, drug, and reason.
3. `Agente de gaps` detects missing determinants, inconsistent timing, or missing context.
4. Human reviewer confirms the draft, edits extraction if needed, and creates the case.

### 3.2 Case completion and interpretation

5. Pharmacy or local team completes the missing clinical data.
6. Tasks are created for nursing, lab, digestology, pharmacy, or reference review.
7. `Agente PK/PD` produces an explainable assessment package.
8. `Agente de recomendacion` drafts options and a professional recommendation draft.

### 3.3 Validation and closure

9. Pharmacy validates or edits the interpretation.
10. Medical reviewer validates, rejects, or escalates.
11. `Agente de informe HCE` prepares the draft clinical note.
12. Human validation is completed before any note is marked ready for HCE.
13. Follow-up at 4 and 8 weeks is tracked.
14. `Agente de aprendizaje` determines whether the case becomes reusable network knowledge.

## 4. Target Product Modules

The application should stabilize around these modules.

### 4.1 Main navigation

- `Casos PK/PD`
- `Bandeja IA`
- `Sesiones de red`
- `Reporting`
- `Profesionales y centros`
- `Agentes IA`
- `Admin clinico`
- `Configuracion`

### 4.2 Optional secondary modules

- `Biblioteca de protocolos`
- `Formularios`
- `Determinantes`
- `Auditoria`

## 5. Current Codebase Map

These are the main current files that need to be evolved, not replaced blindly.

### 5.1 Frontend shell

- `components/pkpd/pro/xarxa-pro.tsx`
- `components/pkpd/pro/xarxa-types.ts`

### 5.2 Main views

- `components/pkpd/pro/views/casos-pkpd.tsx`
- `components/pkpd/pro/views/case-cockpit.tsx`
- `components/pkpd/pro/views/nuevo-caso-modal.tsx`
- `components/pkpd/pro/views/bandeja-ia.tsx`
- `components/pkpd/pro/views/sesiones.tsx`
- `components/pkpd/pro/views/reporting.tsx`
- `components/pkpd/pro/views/profesionales.tsx`
- `components/pkpd/pro/views/agentes-ia.tsx`
- `components/pkpd/pro/views/admin-clinico.tsx`
- `components/pkpd/pro/views/configuracion.tsx`

### 5.3 Backend

- `backend/routes/xarxa.py`
- `backend/services/xarxa_repository.py`
- `backend/services/xarxa_seed.py`

## 6. Data Model Expansion Plan

The current model is a useful seed, but too shallow for the workflow.

### 6.1 Keep and evolve

- `xarxa_cases`
- `xarxa_tasks`
- `xarxa_events`
- `xarxa_recommendations`
- `xarxa_notes`
- `xarxa_followups`
- `xarxa_agent_runs`
- `xarxa_reporting`
- `xarxa_centers`
- `xarxa_professionals`
- `xarxa_roles`
- `xarxa_programs`
- `xarxa_agents`

### 6.2 Add

- `xarxa_inbox_requests`
- `xarxa_protocols`
- `xarxa_determinants`
- `xarxa_forms`
- `xarxa_sessions`
- `xarxa_session_votes`
- `xarxa_session_minutes`
- `xarxa_audit_log`
- `xarxa_settings`
- `xarxa_saved_filters`

### 6.3 Extend case document

Add these fields to `xarxa_cases`:

- `title`
- `programId`
- `specialtyId`
- `entrySource`
- `requesterId`
- `assignedPharmacistId`
- `assignedMedicalReviewerId`
- `pipelineStage`
- `completedStages`
- `nextAction`
- `caseMode`
- `caseType`
- `patient`
- `diseaseContext`
- `therapyContext`
- `labDeterminants`
- `biomarkers`
- `safetyContext`
- `gaps`
- `taskSummary`
- `pkpdInterpretation`
- `simulation`
- `recommendationSummary`
- `clinicalNoteSummary`
- `followUpSummary`
- `board`
- `auditSummary`

### 6.4 Patient subdocument

Do not store PHI. Use only synthetic demographics:

```json
{
  "patientCode": "P-1048",
  "age": 34,
  "sex": "Varon",
  "weightKg": 71,
  "heightCm": 175,
  "specialPopulation": ["Inmunosuprimido"]
}
```

### 6.5 Determinant subdocument

```json
{
  "determinantId": "det-adalimumab-level",
  "label": "Concentracion serica de adalimumab",
  "type": "drug_concentration",
  "value": 3.1,
  "unit": "ug/mL",
  "sampleDateTime": "2026-05-10T08:12:00+02:00",
  "relationToDose": "Valle confirmado",
  "status": "Confirmado",
  "source": "Laboratorio",
  "interpretation": "Baja exposicion",
  "confidence": "Alta"
}
```

### 6.6 Agent run subdocument

```json
{
  "runId": "run-00021",
  "caseId": "PKPD-2026-0002",
  "agentId": "agent-pkpd",
  "agentLabel": "Agente PK/PD",
  "version": "0.8.0",
  "status": "Completado",
  "triggeredBy": "pro-farm-001",
  "inputSummary": ["determinantes confirmados", "contexto clinico", "protocolo Crohn v1.2"],
  "outputs": ["analisis_pkpd"],
  "qualityChecks": ["schema_valid", "sources_present", "human_validation_required"],
  "timestamp": "2026-05-17T09:10:00+02:00"
}
```

## 7. API Roadmap

The backend must evolve from read-only demo APIs to full workflow APIs.

### 7.1 Cases

- `GET /api/xarxa/cases`
- `POST /api/xarxa/cases`
- `GET /api/xarxa/cases/{caseId}`
- `PATCH /api/xarxa/cases/{caseId}`
- `POST /api/xarxa/cases/{caseId}/assign`
- `POST /api/xarxa/cases/{caseId}/stage`
- `POST /api/xarxa/cases/{caseId}/mark-for-session`
- `POST /api/xarxa/cases/{caseId}/close`

### 7.2 Determinants and data completion

- `POST /api/xarxa/cases/{caseId}/determinants`
- `PATCH /api/xarxa/cases/{caseId}/determinants/{determinantId}`
- `POST /api/xarxa/cases/{caseId}/completeness-check`
- `POST /api/xarxa/cases/{caseId}/request-data`

### 7.3 Tasks

- `GET /api/xarxa/tasks`
- `POST /api/xarxa/tasks`
- `PATCH /api/xarxa/tasks/{taskId}`
- `POST /api/xarxa/tasks/{taskId}/resolve`
- `POST /api/xarxa/tasks/{taskId}/reassign`

### 7.4 PK/PD and recommendation

- `POST /api/xarxa/cases/{caseId}/run-pkpd`
- `POST /api/xarxa/cases/{caseId}/run-simulation`
- `POST /api/xarxa/cases/{caseId}/draft-recommendation`
- `PATCH /api/xarxa/cases/{caseId}/recommendation`
- `POST /api/xarxa/cases/{caseId}/send-to-medical-review`
- `POST /api/xarxa/cases/{caseId}/send-to-session`

### 7.5 HCE note

- `POST /api/xarxa/cases/{caseId}/draft-note`
- `PATCH /api/xarxa/cases/{caseId}/note`
- `POST /api/xarxa/cases/{caseId}/approve-note`
- `POST /api/xarxa/cases/{caseId}/send-to-hce`

### 7.6 IA inbox

- `GET /api/xarxa/inbox`
- `GET /api/xarxa/inbox/{requestId}`
- `POST /api/xarxa/inbox/{requestId}/extract`
- `POST /api/xarxa/inbox/{requestId}/create-case`
- `POST /api/xarxa/inbox/{requestId}/discard`

### 7.7 Sessions

- `GET /api/xarxa/sessions`
- `POST /api/xarxa/sessions`
- `GET /api/xarxa/sessions/{sessionId}`
- `POST /api/xarxa/sessions/{sessionId}/add-case`
- `POST /api/xarxa/sessions/{sessionId}/remove-case`
- `POST /api/xarxa/sessions/{sessionId}/vote`
- `POST /api/xarxa/sessions/{sessionId}/generate-minutes`

### 7.8 Reporting

- `GET /api/xarxa/reporting/overview`
- `GET /api/xarxa/reporting/activity`
- `GET /api/xarxa/reporting/bottlenecks`
- `GET /api/xarxa/reporting/learning`

### 7.9 Admin and settings

- `GET /api/xarxa/programs`
- `POST /api/xarxa/programs`
- `PATCH /api/xarxa/programs/{programId}`
- `GET /api/xarxa/forms`
- `GET /api/xarxa/determinants`
- `GET /api/xarxa/settings`
- `PATCH /api/xarxa/settings`

## 8. Frontend Refactor Plan

### 8.1 `components/pkpd/pro/xarxa-pro.tsx`

Refactor into:

- shell only
- route-aware loading states
- contextual top bar
- unified error handling
- true section-level lazy loading

Add:

- program selector
- center selector
- date range selector
- global search
- notification badge
- user role menu
- command palette trigger

### 8.2 `components/pkpd/pro/views/casos-pkpd.tsx`

Upgrade to:

- queue tabs
- real advanced filters
- saved filters
- bulk actions
- row selection
- right-side preview drawer
- clickable KPI filters
- fast server-driven filtering

### 8.3 Replace `nuevo-caso-modal.tsx`

Replace with:

- `nuevo-caso-wizard.tsx`
- page-level flow instead of modal

Wizard steps:

1. `Trigger`
2. `Paciente`
3. `Tratamiento`
4. `Determinantes`
5. `Completitud`
6. `Enviar`

### 8.4 `case-cockpit.tsx`

Keep the tabbed structure, but add:

- real sticky case header
- right-side operational panel
- persistent action bar
- editable forms in side sheets
- task mutations
- recommendation mutations
- note mutations
- follow-up mutations
- trace drawer

### 8.5 `bandeja-ia.tsx`

Replace static demo emails with:

- inbox list
- live extraction state
- original message panel
- editable structured extraction panel
- create-case action
- discard action
- ambiguity handling

### 8.6 `agentes-ia.tsx`

Upgrade to:

- card-based registry
- filters and search
- detail tabs
- trace explorer
- quality incidents
- version history

### 8.7 `profesionales.tsx`

Upgrade to:

- `Centros`
- `Profesionales`
- `Roles`
- `Equipos`
- `Actividad`

Add:

- search
- filters
- approvals
- role assignment
- availability
- case ownership and stats

### 8.8 `sesiones.tsx`

Upgrade to:

- next session
- agenda
- proposed cases
- voting
- minutes
- teaching cases

### 8.9 `reporting.tsx`

Replace demo constants with live aggregates and filters.

### 8.10 `admin-clinico.tsx`

Turn into configurable clinical-program management with:

- overview table
- tabs by program
- create-program wizard
- governance states
- determinants/forms/workflow configuration

## 9. Screen-Level UX Rules

### 9.1 New case

Use full-page wizard.

Why:

- high cognitive load
- many structured fields
- better progress visibility
- room for AI completeness and gap feedback

### 9.2 Edit clinical data

Use large right-side sheet.

Why:

- preserves case context
- avoids navigation break
- good for quick corrections

### 9.3 Recommendation and HCE note

Use full-page tab inside cockpit.

Why:

- high accountability
- needs evidence, comments, and approval

### 9.4 Trace detail

Use right-side drawer.

Why:

- quick review without leaving the case

## 10. Delivery Phases

### Phase 0. Runtime integrity

Goal: every menu loads, every section renders, and no view is wired to dead endpoints.

Tasks:

- migrate `/app` to `/api/xarxa/*`
- fix `/pro` retry and load-state logic
- add per-view loading states
- add per-view empty states
- add per-view error boundaries
- remove dead legacy references

Definition of done:

- `/pro` and `/app` both load without console errors
- every menu item renders content
- retry actions work

### Phase 1. Backend workflow foundation

Goal: make the data contract support the real workflow.

Tasks:

- expand collections
- add missing APIs
- add mutation handlers
- persist task, note, recommendation, and follow-up changes
- create audit events on every mutation

Definition of done:

- every major user action maps to a server mutation
- audit log records all case transitions

### Phase 2. Queue and cockpit foundation

Goal: make the work queue and cockpit the operational center.

Tasks:

- finish queue tabs
- finish advanced filters
- add saved filters
- add row preview drawer
- add bulk actions
- wire cockpit action buttons
- add right-side operational panel

Definition of done:

- user can open the app and work cases without encountering static buttons

### Phase 3. Intake and completeness workflow

Goal: make case entry strong and impressive.

Tasks:

- replace modal with wizard
- build IA inbox review flow
- build completeness check
- build gap creation and task generation
- expose human correction UI for extracted fields

Definition of done:

- user can convert an email or structured request into a reviewed case

### Phase 4. PK/PD interpretation workflow

Goal: make the case clinically meaningful without pretending to prescribe.

Tasks:

- run PK/PD assessment API
- separate analysis from recommendation
- add simulation scenarios
- add evidence blocks
- show assumptions and limitations

Definition of done:

- user sees explainable assessment package and human validation path

### Phase 5. Recommendation, HCE, and follow-up

Goal: complete the case lifecycle.

Tasks:

- recommendation validation workflow
- HCE note draft/edit/approve flow
- HCE send simulation
- follow-up scheduling
- follow-up capture at 4 and 8 weeks

Definition of done:

- a case can travel from intake to validated HCE draft to follow-up

### Phase 6. Governance and network operations

Goal: make the network dimensions credible.

Tasks:

- sessions workflow
- professionals approvals
- agent governance center
- admin clinical-program configurability
- reporting and learning views

Definition of done:

- the product feels like a scalable network platform, not a single-program demo

## 11. Day-by-Day Execution Plan

This is the recommended build order for the next ten working days.

### Day 1

- fix runtime loading issues in `/pro`
- migrate `/app` to Xarxa APIs
- add shared loading, empty, and error components
- enforce Spanish default in shell

Primary files:

- `components/pkpd/pro/xarxa-pro.tsx`
- `components/pkpd/app/mobile-experience.tsx`
- `app/layout.tsx`
- `lib/i18n.ts`

### Day 2

- expand backend case APIs
- add task, stage, assignment, and audit mutations
- normalize case payload shape

Primary files:

- `backend/routes/xarxa.py`
- `backend/services/xarxa_repository.py`
- `backend/services/xarxa_seed.py`

### Day 3

- refactor `Casos PK/PD` into real queue
- add queue tabs, advanced filters, row selection, saved views
- add preview drawer and bulk actions

Primary files:

- `components/pkpd/pro/views/casos-pkpd.tsx`
- `components/pkpd/pro/xarxa-types.ts`

### Day 4

- replace `nuevo-caso-modal.tsx` with `nuevo-caso-wizard.tsx`
- implement full-page wizard route/state
- persist draft cases and completeness output

Primary files:

- `components/pkpd/pro/views/nuevo-caso-modal.tsx`
- `components/pkpd/pro/xarxa-pro.tsx`
- `backend/routes/xarxa.py`
- `backend/services/xarxa_repository.py`

### Day 5

- wire case cockpit actions to backend
- add right-side operational panel
- add editable side sheets for data correction

Primary files:

- `components/pkpd/pro/views/case-cockpit.tsx`
- new sheet components under `components/pkpd/pro/views/`

### Day 6

- make `Bandeja IA` real
- add inbox requests data and extraction flow
- create editable extraction review panel

Primary files:

- `components/pkpd/pro/views/bandeja-ia.tsx`
- `backend/routes/xarxa.py`
- `backend/services/xarxa_repository.py`

### Day 7

- implement real PK/PD assessment, scenario, and recommendation interactions
- add evidence panel and trace source details

Primary files:

- `components/pkpd/pro/views/case-cockpit.tsx`
- `backend/routes/ai.py`
- `backend/routes/xarxa.py`

### Day 8

- build HCE draft workflow and follow-up capture
- add note approval and send-to-HCE simulation

Primary files:

- `components/pkpd/pro/views/case-cockpit.tsx`
- `backend/services/xarxa_repository.py`

### Day 9

- replace mock `Agentes IA`, `Sesiones`, and `Reporting` data
- connect live metrics and live traces

Primary files:

- `components/pkpd/pro/views/agentes-ia.tsx`
- `components/pkpd/pro/views/sesiones.tsx`
- `components/pkpd/pro/views/reporting.tsx`

### Day 10

- finish `Profesionales y centros` and `Admin clinico`
- add command palette
- finish Spanish copy cleanup
- final polish and accessibility pass

Primary files:

- `components/pkpd/pro/views/profesionales.tsx`
- `components/pkpd/pro/views/admin-clinico.tsx`
- shell/header components

## 12. Parallel Workstreams

If multiple agents or developers work in parallel, split by responsibility and avoid overlap.

### Workstream A. Shell and queue

Owns:

- `xarxa-pro.tsx`
- `casos-pkpd.tsx`
- shared loading/error states

### Workstream B. Intake and inbox

Owns:

- `nuevo-caso-wizard`
- `bandeja-ia.tsx`
- inbox backend APIs

### Workstream C. Case cockpit

Owns:

- `case-cockpit.tsx`
- task/gap/recommendation/note flows

### Workstream D. Governance and network

Owns:

- `agentes-ia.tsx`
- `profesionales.tsx`
- `sesiones.tsx`
- `admin-clinico.tsx`

### Workstream E. Reporting and analytics

Owns:

- `reporting.tsx`
- backend reporting aggregates

## 13. Acceptance Gates

### Gate 1. Product shell

- every menu loads
- Spanish is the default
- mobile uses live Xarxa data

### Gate 2. Case lifecycle

- a case can be created, completed, assessed, validated, and moved to HCE draft

### Gate 3. Human + IA credibility

- AI outputs show traces
- human validation is explicit
- audit is visible

### Gate 4. Network credibility

- sessions, professionals, agents, and reporting are live enough to support the demo story

## 14. Immediate Next Step

The next implementation pass should focus on `Phase 0` and `Phase 1` only.

Do not add more visual blocks before these are done:

1. fix all runtime loading and retry issues
2. migrate all dead API usage to Xarxa
3. expand backend mutations
4. make queue and cockpit actions persistent

This keeps the product moving from demo shell to working platform in the shortest path.
