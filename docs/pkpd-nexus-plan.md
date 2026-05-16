# PK/PD Nexus AI Plan

## Product position

`PK/PD Nexus AI` is a collaborative intelligence platform for Bellvitge’s PK/PD hospital network.

The message is:

- deterministic triage first
- semantic retrieval second
- LLM drafting last
- expert validation always

This is not a diagnostic engine and not an autonomous prescribing tool.
It is a clinical operations and knowledge system.

## Demo storyline

1. Open `/pro` as the network command center.
2. Show the 10-center collaboration, impact KPIs, and the active queue.
3. Open a high-priority infliximab or vancomycin case.
4. Show the synthetic PK/PD timeline plus the real FHIR backbone context.
5. Retrieve the trusted protocol excerpts.
6. Compare similar validated cases.
7. Use the copilot to generate an expert-review summary and intervention draft.
8. Jump to `/app` to show the on-call pharmacist view and the safe patient companion.
9. Close on the idea that each validated case becomes a reusable knowledge product.

## Current MVP scope

### Data layer

- `pkpd_networks`
- `pkpd_hospitals`
- `pkpd_patients`
- `pkpd_cases`
- `pkpd_protocols`
- `pkpd_retrieval_chunks`
- `pkpd_knowledge_products`
- `pkpd_expert_interventions`

The seed pipeline uses:

- the existing `proto1` database for the PK/PD demo objects
- the existing Synthea breast-cancer FHIR database for real patient context

### Backend endpoints

- `POST /api/pkpd/bootstrap`
- `GET /api/network/kpis`
- `GET /api/cases`
- `GET /api/cases/:id`
- `GET /api/cases/:id/protocol`
- `GET /api/cases/:id/similar`
- `POST /api/cases/:id/summarize`
- `POST /api/cases/:id/draft-intervention`
- `GET /api/health`
- `GET /api/health/pkpd`

### Frontend experiences

- `/`
  - project pitch
  - QR code
  - backbone health indicators
  - scope and story cards
- `/pro`
  - network command center
  - intelligent queue
  - case workspace
  - FHIR context
  - protocol retrieval
  - similar cases
  - copilot panel
  - semantic knowledge products
- `/app`
  - mobile pharmacist alert stack
  - patient reminder and symptom-routing flow
  - trust model panels

## What creates the wow effect

- Bellvitge-branded command center instead of a generic dashboard
- the reference-center / satellite-hospital network map
- a real-looking PK/PD queue with deterministic explanations
- a case workspace that merges synthetic PK/PD events with real FHIR context
- protocol retrieval shown as bounded evidence, not internet search
- a copilot that produces expert-review artifacts, not freeform advice
- a second mobile experience that makes the network feel operational

## Immediate next build steps

### High-value product steps

1. Add a protocol comparison view between local and reference guidance.
2. Add a bi-weekly meeting summary generator.
3. Add a network learning-object library page.
4. Add one especially polished hero case with richer dose history and collaboration comments.

### Data steps

1. Add richer synthetic PK/PD signals per drug family.
2. Add explicit local-protocol variations per satellite hospital.
3. Add more historical validated interventions for stronger similar-case retrieval.

### UX polish steps

1. Replace remaining placeholder image tags with optimized Next image components if desired.
2. Add lightweight motion to queue transitions and case selection.
3. Add a stronger brand treatment for Bellvitge + PK/PD Nexus AI naming.

## Operator commands

```bash
npm run demo:seed
npm run demo:start
npm run demo:stop
```

## Safety and governance

- OpenAI is used for drafting only.
- Protocol and similar-case context are retrieved before generation.
- Draft outputs are framed for expert validation.
- Patient-facing flows remain conservative and non-diagnostic.
