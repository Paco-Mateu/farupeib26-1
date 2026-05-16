# PK/PD Nexus AI Execution Plan

## Outcome

Build a demo-ready clinical intelligence platform for Bellvitge's collaborative PK/PD network.

Core message:

`This is not a chatbot. This is a collaborative clinical intelligence network.`

Safety message:

`AI drafts, retrieves, summarizes, and explains. Clinicians decide.`

## Reality Anchors

- Bellvitge is the reference center in the story.
- The network story uses 10 collaborating centers, 119 direct interventions, and operations since May 2025.
- The product must feel grounded in hospital pharmacy, therapeutic drug monitoring, and expert validation rather than autonomous recommendation.
- The shared FHIR backbone comes from the existing Synthea breast-oncology MongoDB dataset, enriched with synthetic PK/PD monitoring events.

## Current Build Status

- Full-stack routes already exist for `/`, `/pro`, `/app`, and the PK/PD API.
- MongoDB-backed demo collections already exist for hospitals, patients, cases, protocols, retrieval chunks, knowledge products, and expert interventions.
- The desktop mission-control experience is already present and has been upgraded to use active cases only, richer FHIR context, validated precedents, and better knowledge-product storytelling.
- The mobile experience is already present and has been upgraded into explicit pharmacist and patient profiles.
- The FHIR linker now prioritizes breast-oncology patients and surfaces oncology-specific procedures, therapies, and context.

## Build Priorities

1. Make the hero cases credible.
2. Make the Bellvitge collaboration story obvious in the first 15 seconds.
3. Show deterministic prioritization before any LLM output.
4. Show grounded retrieval before any free-form generation.
5. Show how validated expert decisions become reusable network knowledge.

## Workstreams

### 1. Clinical backbone

- Use the shared FHIR dataset as the longitudinal EHR backbone.
- Prioritize breast-oncology patient records for the demo.
- Surface oncology-relevant conditions, procedures, therapies, and a clinically meaningful lab subset.

### 2. Demo dataset

- Keep 10 hospitals with Bellvitge in the center.
- Keep 80 PK/PD cases across biologics, antibiotics, antifungals, antiepileptics, and immunosuppressants.
- Interleave the seeded queue so the live alert stack is not dominated by a single drug.
- Keep at least one strong infliximab hero case and one vancomycin hero case.

### 3. Retrieval and copilot

- Deterministic filters first.
- Trusted subset retrieval second.
- LLM drafting last.
- Store drafts as knowledge products.
- Require explicit expert validation positioning in every clinically sensitive output.

### 4. Desktop experience

- Network command center with Bellvitge at the center.
- Active queue only.
- Deep case workspace with patient context, PK/PD signals, protocol evidence, similar cases, validated precedents, and semantic knowledge products.
- Copilot output visually distinguished from validated decisions.

### 5. Mobile experience

- Pharmacist profile for alerts, review, and escalation.
- Patient profile for reminders, structured symptom capture, and safe routing.
- Explicitly avoid diagnostic language.

## Immediate Next Steps

1. Validate the reseeded dataset against the updated FHIR prioritization logic.
2. Tighten copilot outputs with explicit grounding structure and evidence linkage.
3. Add a route-level hero-case drilldown if time remains.
4. Add a short demo script and final pitch overlay if presentation polish is needed.

## Risks

- The external FHIR MongoDB is a runtime dependency for the strongest version of the demo.
- Retrieval is still mostly heuristic unless a second lane upgrades it to structured evidence contracts or embeddings.
- The mobile action buttons are demo actions, not workflow mutations.

## Demo Order

1. Start on `/pro`.
2. Open the network story and KPI strip.
3. Show the active queue and explain deterministic prioritization.
4. Open the infliximab hero case.
5. Show the oncology-backed FHIR context.
6. Show protocol retrieval and validated precedents.
7. Run the copilot summary or intervention draft.
8. Show semantic knowledge products.
9. Switch to `/app` and show pharmacist then patient views.
