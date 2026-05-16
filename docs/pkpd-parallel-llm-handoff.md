# PK/PD Nexus AI Parallel LLM Handoff

## Goal

Give another LLM a clean, no-overlap lane that increases demo quality without conflicting with the current implementation pass.

## Current Ownership

These files are already being actively changed in the main lane and should be treated as read-only for the parallel lane:

- `backend/services/pkpd_fhir.py`
- `backend/services/pkpd_seed.py`
- `backend/services/pkpd_repository.py`
- `components/pkpd/pro/mission-control.tsx`
- `components/pkpd/app/mobile-experience.tsx`

## Recommended Parallel Lane

### Lane A: Evidence-aware Copilot Contracts

Own these files:

- `backend/services/pkpd_ai.py`
- `backend/schemas/ai.py`
- `prompts/` for any PK/PD prompt templates you add
- optionally new helper modules under `backend/services/` if needed

Do not modify:

- `backend/services/pkpd_fhir.py`
- `backend/services/pkpd_seed.py`
- `backend/services/pkpd_repository.py`
- frontend files under `components/pkpd/**`

## Lane A Requirements

Build a grounded copilot contract that returns structured evidence, not just free text.

### Required features

- Add a structured summary response model for:
  - `summary`
  - `priorityExplanation`
  - `missingDataChecklist`
  - `protocolEvidence`
  - `similarCaseEvidence`
  - `safetyBanner`
- Make the copilot explicitly cite which protocol chunks and similar cases were used.
- Preserve the current safe fallback behavior when OpenAI is unavailable.
- Keep all output phrased as review support, not prescribing advice.

### Acceptance criteria

- `POST /api/cases/{id}/summarize` returns structured fields plus the existing human-readable summary text.
- `POST /api/cases/{id}/draft-intervention` returns a structured note object plus the draft note text.
- The response includes enough metadata for the frontend to show evidence chips or inline provenance later.
- If OpenAI is unavailable, the deterministic fallback still returns the same structured contract shape.

## Optional Parallel Lanes

### Lane B: Route-level drilldown

Own:

- new files under `app/pro/**`
- new files under `app/app/**`
- new components under `components/pkpd/pro/**` or `components/pkpd/app/**` that do not modify the current shells

Goal:

- Create a dedicated hero-case detail route that deepens the workspace without editing the existing mission-control shell.

### Lane C: Demo storytelling and pitch

Own:

- `docs/`
- landing-page copy only if coordinated later

Goal:

- Produce the 10-minute demo script, talk track, and final pitch framing.

## Suggested Prompt For Another LLM

`You are working on PK/PD Nexus AI in /Users/francesc.mateu/Documents/GitHub/farupeib26-1. Own only backend/services/pkpd_ai.py, backend/schemas/ai.py, prompts/, and any new helper modules you need. Do not edit backend/services/pkpd_fhir.py, backend/services/pkpd_seed.py, backend/services/pkpd_repository.py, or any files under components/pkpd/. Implement an evidence-aware structured copilot contract for summarize and draft-intervention, keep deterministic fallbacks, and preserve the safety framing that clinicians decide.`

## Integration Notes

- The current workspace payload already includes:
  - `case`
  - `protocolMatch`
  - `similarCases`
  - `validatedPrecedents`
  - `knowledgeProducts`
  - `fhirContext`
- The frontend is already positioned to display richer grounded output once the AI contract becomes structured.
