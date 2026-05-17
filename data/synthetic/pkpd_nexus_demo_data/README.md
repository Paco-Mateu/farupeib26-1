# PK/PD Nexus AI Demo Data Pack

Generated on 2026-05-16 for an art-of-the-possible demo.

## Important safety note

All clinical content in this pack is synthetic and for software demonstration only.
It must not be used for diagnosis, prescribing, dosing, clinical decision-making, or patient care.

## Included files

- `drug_dictionary.json`: curated synthetic drug dictionary for PK/PD demo.
- `observation_dictionary.json`: synthetic lab/observation dictionary.
- `unit_dictionary.json`: UCUM-oriented unit dictionary for demo.
- `synthetic_pkpd_cases.json`: 80 active/simulated PK/PD cases.
- `synthetic_hospital_protocols.json`: 6 synthetic hospital reference protocols.
- `official_drug_information_manifest.json`: source manifest and placeholder document extracts. Replace with official EMA/AEMPS/DailyMed/openFDA content.
- `historical_expert_reviewed_cases.json`: 58 synthetic historical cases.
- `expert_interventions.json`: validated synthetic intervention records.
- `retrieval_chunks.json`: chunks for deterministic + semantic retrieval demos.
- `knowledge_products.json`: generated semantic knowledge-product examples.
- `hospitals.json`, `users.json`, `patients.json`: network, users and synthetic patient context.
- `mongo_import_and_indexes.js`: MongoDB indexes.
- `demo_queries.js`: simple MongoDB demo queries.

## Suggested MongoDB collections

- `hospitals`
- `users`
- `patients`
- `drug_dictionary`
- `observation_dictionary`
- `unit_dictionary`
- `protocols`
- `pkpd_cases`
- `historical_cases`
- `expert_interventions`
- `official_drug_information_manifest`
- `retrieval_chunks`
- `knowledge_products`

## Import example

```bash
DB=pkpd_nexus_demo
mongoimport --db $DB --collection hospitals --file hospitals.json --jsonArray
mongoimport --db $DB --collection users --file users.json --jsonArray
mongoimport --db $DB --collection patients --file patients.json --jsonArray
mongoimport --db $DB --collection drug_dictionary --file drug_dictionary.json --jsonArray
mongoimport --db $DB --collection observation_dictionary --file observation_dictionary.json --jsonArray
mongoimport --db $DB --collection unit_dictionary --file unit_dictionary.json --jsonArray
mongoimport --db $DB --collection protocols --file synthetic_hospital_protocols.json --jsonArray
mongoimport --db $DB --collection pkpd_cases --file synthetic_pkpd_cases.json --jsonArray
mongoimport --db $DB --collection historical_cases --file historical_expert_reviewed_cases.json --jsonArray
mongoimport --db $DB --collection expert_interventions --file expert_interventions.json --jsonArray
mongoimport --db $DB --collection official_drug_information_manifest --file official_drug_information_manifest.json --jsonArray
mongoimport --db $DB --collection retrieval_chunks --file retrieval_chunks.json --jsonArray
mongoimport --db $DB --collection knowledge_products --file knowledge_products.json --jsonArray
mongosh < mongo_import_and_indexes.js
```

## Hero cases

- `PKPD-2026-HERO-INFLIXIMAB`: biologic case aligned with the reference slide.
- `PKPD-2026-HERO-VANCOMYCIN`: classic antibiotic PK safety case.

## Retrieval pattern

Recommended demo sequence:

1. Deterministic filter by `drugName`, `therapeuticArea`, `metadata.approved`, `status`.
2. Atlas Search / keyword search over `chunkText`.
3. Vector Search over `embedding`, after replacing mock vectors with real embeddings.
4. LLM generation using only retrieved chunks.
5. Save output in `knowledge_products`.
6. Require expert validation for clinical-facing content.
