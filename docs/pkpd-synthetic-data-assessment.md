# PK/PD Synthetic Data Assessment

Assessment date: 2026-05-16

Directory reviewed:

- [data/synthetic/pkpd_nexus_demo_data](/Users/francesc.mateu/Documents/GitHub/farupeib26-1/data/synthetic/pkpd_nexus_demo_data)

## Recommendation

Do not replace the current seeded demo dataset with this pack.

Use the current FHIR-backed seed as the primary runtime dataset and selectively reuse parts of this pack only where they add value without breaking the existing prototype.

## Why the current seed is stronger for the live demo

- The current seed is already wired to the existing Bellvitge-focused UI and repository logic.
- It uses the shared FHIR MongoDB backbone and denormalizes patient context for faster workspace rendering.
- It includes local protocol variants per satellite hospital, which powers the `local vs reference protocol` comparison already shown in `/pro`.
- It includes richer retrieval metadata used by the current deterministic scoring logic.

Current runtime seed characteristics:

- 80 cases
- 70 protocols
- 1,124 retrieval chunks
- 40 FHIR-backed patients
- statuses aligned with the current queue logic

## What is useful in the provided pack

- `official_drug_information_manifest.json`
  Good placeholder for future integration of official EMA/AEMPS/DailyMed/openFDA evidence.
- `drug_dictionary.json`, `observation_dictionary.json`, `unit_dictionary.json`
  Useful later for filters, forms, structured extraction, or terminology normalization.
- `users.json`
  Could help if we want richer expert identities in collaboration threads.
- `README.md`, `demo_queries.js`, `mongo_import_and_indexes.js`
  Useful as supporting reference material.

## What makes it a poor drop-in replacement

- Case schema mismatch:
  The current app expects fields such as `patientSnapshot`, `protocolId`, `syntheaPatientRef`, `priorityFactors`, `semanticQuery`, `impactStory`, and `storyFlags`. These are missing from the provided active-case file.
- Status mismatch:
  The pack uses statuses such as `new`, `in_local_review`, `awaiting_missing_data`, and `closed_validated`, while the current UI logic expects `urgent_review`, `pending_reference_review`, `local_review`, `validated`, `resolved`, and `closed`.
- Historical-case split:
  Historical cases live in a separate file, while the current prototype intentionally uses one case collection with status-based active vs historical behavior.
- Protocol gap:
  The pack has only 6 reference protocols and no local satellite variants, which would weaken one of the best existing screens.
- Retrieval gap:
  The pack has 96 retrieval chunks and no `metadata.variant` labeling, while the current retrieval heuristics already use richer chunk variants.
- FHIR linkage gap:
  The pack does not include `syntheaPatientRef`, so it would not connect cleanly to the shared breast-cancer FHIR dataset already powering the workspace.

## Quality notes

- The overall package is well organized and useful as source material.
- One visible inconsistency exists in the infliximab hero case:
  `riskSignals` and summary imply positive anti-drug antibodies, while the timeline antibody event is `negative`.

## Practical plan

1. Keep the current seeded dataset as the default.
2. Reuse only selected supporting assets from this pack if we need them.
3. If we want to ingest any of its cases later, build a transformer rather than importing them directly.
