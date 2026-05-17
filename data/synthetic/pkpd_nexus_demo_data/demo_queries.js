// Demo queries for PK/PD Nexus AI
use pkpd_nexus_demo;

// 1. Active high-priority queue
db.pkpd_cases.find(
  { status: { $in: ["new", "pending_reference_review", "in_local_review"] }, priority: "high" },
  { _id: 1, originHospitalId: 1, drugName: 1, caseReason: 1, riskSignals: 1, status: 1 }
).sort({ updatedAt: -1 });

// 2. Network KPI by hospital and priority
db.pkpd_cases.aggregate([
  { $group: { _id: { hospital: "$originHospitalId", priority: "$priority" }, cases: { $sum: 1 } } },
  { $sort: { "_id.hospital": 1, "_id.priority": 1 } }
]);

// 3. Deterministic retrieval candidate set before vector search
db.retrieval_chunks.find({
  drugName: "Infliximab",
  therapeuticArea: "biologics",
  "metadata.approved": true
}, { chunkText: 1, sourceType: 1, sourceId: 1, metadata: 1 });

// 4. Case timeline
db.pkpd_cases.findOne({ _id: "PKPD-2026-HERO-INFLIXIMAB" }, { timeline: 1, riskSignals: 1, ai: 1 });
