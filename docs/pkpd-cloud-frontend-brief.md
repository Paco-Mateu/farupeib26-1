# PK/PD Nexus AI Cloud Frontend Brief

This document is the no-overlap handoff for the parallel cloud track.

## Goal

Build the "wow" frontend for `PK/PD Nexus AI` while the local track finishes:

- backend data model
- MongoDB seed/load logic
- FHIR-linked patient context
- deterministic retrieval
- AI draft endpoints

The product message is:

`This is not a chatbot. This is a collaborative clinical intelligence network.`

## Ownership Split

### Cloud owns

- `components/pkpd/pro/**`
- `components/pkpd/app/**`
- `app/pro/page.tsx`
- `app/app/page.tsx`
- optional subroutes under `app/pro/**` and `app/app/**` to avoid dead links
- frontend dependency additions in `package.json`
- visual polish in `app/globals.css` only for new PK/PD-specific utility classes

### Local owns

- `backend/**`
- `api/index.py`
- `scripts/**`
- MongoDB schema and seed logic
- FHIR integration
- provider integration
- health checks
- deployment validation
- landing page and cross-app wiring

### Do not touch from cloud

- `backend/**`
- `scripts/**`
- `api/index.py`
- `.env*`
- Vercel scripts or deployment scripts

## Frontend Scope

### Desktop `/pro`

Build a mission-control experience with:

- network command center
- Bellvitge as the reference node in the center
- 9 satellite hospitals around it
- KPI cards from the real project story
- intelligent case queue
- selected case workspace
- copilot side panel
- protocol retrieval panel
- similar-case panel

### Mobile `/app`

Build two stacked experiences inside the same mobile shell:

- pharmacist/on-call experience
- conservative patient-facing experience

The mobile route should feel like a polished product, not a placeholder.

## Recommended Libraries

These are the best-value additions for speed and visual impact.

### Strong recommendation

- `@xyflow/react`
  Use for the network graph and the center-to-satellite command-center visualization.

- `recharts`
  Use for compact timelines, exposure trends, biomarker mini-charts, and KPI sparklines.

### Already present

- `framer-motion`
- `lucide-react`
- `shadcn`

### Avoid unless truly necessary

- `d3` directly
- `cytoscape`
- any heavy 3D or canvas engine

The goal is fast, clean, impressive, and stable.

## Visual Direction

Use the Bellvitge slide as inspiration, but make it feel premium and productized:

- warm clinical ivory background
- teal / emerald infrastructure accents
- coral / amber signal color for urgency
- strong serif + modern sans pairing is already available
- central glowing network map
- layered cards with subtle gradients
- very clear hierarchy

This should look like:

- clinical operations
- AI product
- executive demo

Not like:

- admin dashboard boilerplate
- generic chatbot wrapper

## API Contract To Target

The frontend should target these endpoints.

### `POST /api/pkpd/bootstrap`

Bootstraps the dataset if the collections are empty.

### `GET /api/network/kpis`

Use for:

- top KPI strip
- network nodes
- queue preview

Expected shape:

```json
{
  "network": {
    "_id": "CAT-PKPD-NET",
    "name": "PK/PD Nexus AI",
    "referenceHospitalName": "Bellvitge University Hospital",
    "story": {
      "centers": 10,
      "directInterventions": 119,
      "operationalSince": "2025-05-01",
      "requestShareByMedicalTeams": 72,
      "drugHighlights": []
    }
  },
  "metrics": {
    "activeCases": 0,
    "criticalCases": 0,
    "pendingExpertReviews": 0,
    "averageResponseHours": 0,
    "caseMix": {}
  },
  "hospitals": [],
  "queuePreview": []
}
```

### `GET /api/cases?limit=18`

Use for:

- intelligent queue
- mobile alert list

Each case will include:

- `_id`
- `priority`
- `status`
- `drugName`
- `caseReason`
- `originHospitalId`
- `patientSnapshot`
- `riskSignals`
- `ai.caseSummary`

### `GET /api/cases/{id}`

Primary case workspace payload.

Expected top-level keys:

- `case`
- `patient`
- `originHospital`
- `referenceHospital`
- `protocolMatch`
- `similarCases`
- `expertInterventions`
- `knowledgeProducts`
- `fhirContext`

### `GET /api/cases/{id}/protocol`

Use when the protocol panel is isolated or lazy-loaded.

### `GET /api/cases/{id}/similar`

Use when the similar-case bundle is isolated or lazy-loaded.

### `POST /api/cases/{id}/summarize`

Copilot action.

Use for:

- expert-review summary card
- one-click review packet draft

### `POST /api/cases/{id}/draft-intervention`

Copilot action.

Use for:

- draft intervention note
- documentation panel

## Acceptance Criteria

### Desktop

- `/pro` opens on a compelling command center, not a blank dashboard
- the Bellvitge reference hospital is visually central
- the queue and workspace are visible without navigation
- at least one selected hero case feels detailed and credible
- protocol and similar-case cards are clearly grounded
- the copilot panel visually distinguishes AI draft from validated decision

### Mobile

- `/app` feels like a real mobile product
- pharmacist alerts are fast to scan
- patient reminders are safe and conservative
- no wording implies autonomous diagnosis or prescribing

### UX safety

- always frame AI as draft, support, summary, or retrieval
- never frame AI as final decision-maker
- use labels like `Draft`, `Grounded`, `Pending expert validation`

## Hero Stories To Design Around

### Hero case 1

- `Infliximab`
- low trough
- positive anti-drug antibodies
- elevated inflammatory signal
- Bellvitge review required

### Hero case 2

- `Vancomycin`
- high level
- renal decline
- urgent safety review

### Hero case 3

- `Tacrolimus`
- high variability
- longitudinal monitoring story

## Nice-To-Haves If Time Allows

- animated node pulses for critical centers
- protocol match confidence ribbon
- timeline mini-chart for synthetic dose/level events
- "Network learning object" card styling
- slide-in copilot drawer on mobile

## Avoid

- hardcoding backend data into the frontend
- touching provider logic
- inventing clinical actions not tied to retrieved protocol
- building generic chat UI as the main experience

## Suggested Component Split

- `components/pkpd/pro/mission-control.tsx`
- `components/pkpd/pro/network-graph.tsx`
- `components/pkpd/pro/case-queue.tsx`
- `components/pkpd/pro/case-workspace.tsx`
- `components/pkpd/pro/copilot-panel.tsx`
- `components/pkpd/app/mobile-hub.tsx`
- `components/pkpd/app/pharmacist-panel.tsx`
- `components/pkpd/app/patient-panel.tsx`

## Final Reminder

The strongest demo line is:

`Deterministic retrieval first. Semantic retrieval second. LLM last.`

The frontend should make that architecture feel trustworthy and exciting.
