// PK/PD Nexus AI demo import + indexes.
// Replace DB name if needed.
use pkpd_nexus_demo;

db.hospitals.deleteMany({});
db.users.deleteMany({});
db.patients.deleteMany({});
db.drug_dictionary.deleteMany({});
db.observation_dictionary.deleteMany({});
db.unit_dictionary.deleteMany({});
db.protocols.deleteMany({});
db.pkpd_cases.deleteMany({});
db.historical_cases.deleteMany({});
db.expert_interventions.deleteMany({});
db.official_drug_information_manifest.deleteMany({});
db.retrieval_chunks.deleteMany({});
db.knowledge_products.deleteMany({});

// Import JSON first with mongoimport, then run this file for indexes.
// Example:
// mongoimport --db pkpd_nexus_demo --collection hospitals --file hospitals.json --jsonArray
// mongoimport --db pkpd_nexus_demo --collection pkpd_cases --file synthetic_pkpd_cases.json --jsonArray

db.pkpd_cases.createIndex({ networkId: 1, status: 1, priority: 1 });
db.pkpd_cases.createIndex({ originHospitalId: 1, status: 1 });
db.pkpd_cases.createIndex({ drugName: 1, therapeuticArea: 1 });
db.pkpd_cases.createIndex({ patientId: 1, createdAt: -1 });
db.pkpd_cases.createIndex({ riskSignals: 1 });

db.protocols.createIndex({ drugName: 1, status: 1, hospitalId: 1 });
db.retrieval_chunks.createIndex({ sourceType: 1, drugName: 1, therapeuticArea: 1, "metadata.approved": 1 });
db.knowledge_products.createIndex({ caseId: 1, type: 1, version: -1 });
db.expert_interventions.createIndex({ caseId: 1, status: 1 });

db.hospitals.createIndex({ networkId: 1, role: 1 });
db.drug_dictionary.createIndex({ normalizedName: 1 });
db.observation_dictionary.createIndex({ category: 1 });

print("Indexes created for pkpd_nexus_demo.");
