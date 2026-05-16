from __future__ import annotations

from collections import Counter
from datetime import UTC, datetime
import re
from typing import Any

from pymongo import DESCENDING

from backend.db.mongo import get_database
from backend.services.pkpd_fhir import build_fhir_patient_context
from backend.services.pkpd_seed import (
    PKPD_COLLECTIONS,
    PKPD_NETWORK_ID,
    ensure_pkpd_demo_dataset,
    summarize_case_mix,
)


ACTIVE_CASE_STATUSES = {"urgent_review", "pending_reference_review", "local_review"}
HISTORICAL_CASE_STATUSES = {"validated", "resolved", "closed"}


def _collection(key: str):
    return get_database()[PKPD_COLLECTIONS[key]]


def _priority_rank(value: str | None) -> int:
    mapping = {"high": 0, "medium": 1, "low": 2}
    return mapping.get(str(value or "").strip().lower(), 9)


def _status_rank(value: str | None) -> int:
    mapping = {
        "urgent_review": 0,
        "pending_reference_review": 1,
        "local_review": 2,
        "validated": 3,
        "resolved": 4,
        "closed": 5,
    }
    return mapping.get(str(value or "").strip().lower(), 9)


def _tokens(*values: Any) -> set[str]:
    raw = " ".join(str(value or "") for value in values if value is not None).lower()
    return {token for token in re.findall(r"[a-z0-9][a-z0-9_/-]+", raw) if len(token) > 2}


def _iso_to_dt(value: str | None) -> datetime:
    token = str(value or "").strip()
    if not token:
        return datetime(1970, 1, 1, tzinfo=UTC)
    if token.endswith("Z"):
        token = token.replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(token)
    except ValueError:
        return datetime(1970, 1, 1, tzinfo=UTC)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=UTC)
    return parsed.astimezone(UTC)


def bootstrap_pkpd_demo() -> dict[str, Any]:
    return ensure_pkpd_demo_dataset()


def list_cases(*, limit: int = 18, include_historical: bool = True) -> list[dict[str, Any]]:
    ensure_pkpd_demo_dataset()
    rows = list(_collection("cases").find({}).limit(max(1, min(limit * 6, 240))))
    if not include_historical:
        rows = [row for row in rows if row.get("status") in ACTIVE_CASE_STATUSES]
    rows.sort(
        key=lambda row: (
            _priority_rank(row.get("priority")),
            _status_rank(row.get("status")),
            -_iso_to_dt(row.get("updatedAt")).timestamp(),
            row.get("sortOrder") or 0,
        )
    )
    return rows[: max(1, min(limit, 100))]


def get_case(case_id: str) -> dict[str, Any] | None:
    ensure_pkpd_demo_dataset()
    return _collection("cases").find_one({"_id": case_id})


def get_protocol_match(case: dict[str, Any]) -> dict[str, Any]:
    protocol = _collection("protocols").find_one(
        {"_id": case.get("protocolId")}
    ) or _collection("protocols").find_one(
        {"drugName": case.get("drugName"), "status": "active"},
        sort=[("version", DESCENDING)],
    )

    if not protocol:
        return {"protocol": None, "topChunks": [], "matchedTerms": []}

    case_terms = _tokens(
        case.get("drugName"),
        case.get("therapeuticArea"),
        case.get("caseReason"),
        " ".join(case.get("riskSignals") or []),
        " ".join((case.get("ai") or {}).get("missingData") or []),
    )

    candidates = list(
        _collection("retrieval_chunks").find(
            {"sourceId": protocol["_id"], "metadata.approved": True}
        )
    )
    scored = []
    for row in candidates:
        chunk_terms = _tokens(row.get("chunkText"), row.get("metadata", {}).get("section"))
        overlap = sorted(case_terms & chunk_terms)
        score = len(overlap) * 10
        if row.get("metadata", {}).get("variant") == "Reference escalation":
            score += 6
        if row.get("metadata", {}).get("variant") == "Deterministic signal":
            score += 4
        scored.append(
            {
                "chunkId": row["_id"],
                "section": row.get("metadata", {}).get("section"),
                "variant": row.get("metadata", {}).get("variant"),
                "chunkText": row.get("chunkText"),
                "matchedTerms": overlap[:8],
                "score": score,
            }
        )
    scored.sort(key=lambda item: (-item["score"], item["section"] or ""))
    top_chunks = scored[:4]
    matched_terms = sorted({term for item in top_chunks for term in item.get("matchedTerms") or []})
    return {"protocol": protocol, "topChunks": top_chunks, "matchedTerms": matched_terms}


def get_similar_cases(case: dict[str, Any], *, limit: int = 5) -> list[dict[str, Any]]:
    query = {
        "_id": {"$ne": case["_id"]},
        "status": {"$in": list(HISTORICAL_CASE_STATUSES)},
        "$or": [
            {"drugName": case.get("drugName")},
            {"therapeuticArea": case.get("therapeuticArea")},
        ],
    }
    candidates = list(_collection("cases").find(query).limit(80))
    case_signals = set(case.get("riskSignals") or [])
    case_terms = _tokens(case.get("caseReason"), case.get("impactStory"), " ".join(case_signals))
    scored: list[dict[str, Any]] = []

    for row in candidates:
        score = 0
        if row.get("drugName") == case.get("drugName"):
            score += 45
        if row.get("therapeuticArea") == case.get("therapeuticArea"):
            score += 12
        overlap = sorted(case_signals & set(row.get("riskSignals") or []))
        score += len(overlap) * 14
        row_terms = _tokens(row.get("caseReason"), row.get("impactStory"), " ".join(row.get("riskSignals") or []))
        lexical_overlap = len(case_terms & row_terms)
        score += lexical_overlap * 3
        if row.get("priority") == case.get("priority"):
            score += 4

        scored.append(
            {
                "_id": row["_id"],
                "drugName": row.get("drugName"),
                "priority": row.get("priority"),
                "status": row.get("status"),
                "originHospitalId": row.get("originHospitalId"),
                "patientSnapshot": row.get("patientSnapshot"),
                "summary": (row.get("ai") or {}).get("caseSummary"),
                "riskSignals": row.get("riskSignals") or [],
                "matchedSignals": overlap,
                "score": score,
            }
        )
    scored.sort(key=lambda item: (-item["score"], item["_id"]))
    return scored[: max(1, min(limit, 12))]


def get_network_kpis() -> dict[str, Any]:
    ensure_pkpd_demo_dataset()
    network = _collection("networks").find_one({"_id": PKPD_NETWORK_ID}) or {}
    hospitals = list(_collection("hospitals").find({"networkId": PKPD_NETWORK_ID}))
    cases = list(_collection("cases").find({"networkId": PKPD_NETWORK_ID}))
    interventions = list(_collection("expert_interventions").find({"networkId": PKPD_NETWORK_ID}))
    case_mix = summarize_case_mix(cases)

    cases_by_hospital = Counter(case.get("originHospitalId") for case in cases)
    critical_by_hospital = Counter(
        case.get("originHospitalId") for case in cases if case.get("priority") == "high" and case.get("status") in ACTIVE_CASE_STATUSES
    )
    pending_by_hospital = Counter(
        case.get("originHospitalId") for case in cases if case.get("status") in {"urgent_review", "pending_reference_review"}
    )

    hospital_nodes = []
    for hospital in hospitals:
        hospital_nodes.append(
            {
                "_id": hospital["_id"],
                "name": hospital["name"],
                "role": hospital.get("role"),
                "city": hospital.get("city"),
                "geo": hospital.get("geo"),
                "activeCases": cases_by_hospital[hospital["_id"]] if hospital.get("role") != "reference_center" else len(cases),
                "criticalCases": critical_by_hospital[hospital["_id"]],
                "pendingExpertReviews": pending_by_hospital[hospital["_id"]],
                "responseTimeHours": hospital.get("responseTimeHours"),
            }
        )

    queue = list_cases(limit=8, include_historical=False)
    return {
        "network": network,
        "metrics": {
            "centers": network.get("story", {}).get("centers", len(hospitals)),
            "directInterventions": network.get("story", {}).get("directInterventions", len(interventions)),
            "activeCases": len([case for case in cases if case.get("status") in ACTIVE_CASE_STATUSES]),
            "criticalCases": len([case for case in cases if case.get("priority") == "high" and case.get("status") in ACTIVE_CASE_STATUSES]),
            "pendingExpertReviews": len([case for case in cases if case.get("status") in {"urgent_review", "pending_reference_review"}]),
            "averageResponseHours": round(sum(h.get("responseTimeHours", 0) for h in hospitals) / max(len(hospitals), 1), 1),
            "medicalTeamRequestsShare": network.get("story", {}).get("requestShareByMedicalTeams", 72),
            "caseMix": case_mix,
        },
        "hospitals": hospital_nodes,
        "queuePreview": [
            {
                "_id": row["_id"],
                "priority": row.get("priority"),
                "hospitalId": row.get("originHospitalId"),
                "drugName": row.get("drugName"),
                "reason": row.get("caseReason"),
                "status": row.get("status"),
            }
            for row in queue
        ],
    }


def get_case_workspace(case_id: str) -> dict[str, Any] | None:
    case = get_case(case_id)
    if case is None:
        return None

    patient = _collection("patients").find_one({"_id": case.get("patientId")})
    hospital = _collection("hospitals").find_one({"_id": case.get("originHospitalId")})
    reference_hospital = _collection("hospitals").find_one({"_id": case.get("referenceHospitalId")})
    protocol_match = get_protocol_match(case)
    similar_cases = get_similar_cases(case)
    expert_interventions = list(
        _collection("expert_interventions").find({"caseId": case_id}).sort("createdAt", -1).limit(4)
    )
    knowledge_products = list(
        _collection("knowledge_products").find({"caseId": case_id}).sort("type", 1).limit(12)
    )
    fhir_context = build_fhir_patient_context(case.get("syntheaPatientRef"))

    return {
        "case": case,
        "patient": patient,
        "originHospital": hospital,
        "referenceHospital": reference_hospital,
        "protocolMatch": protocol_match,
        "similarCases": similar_cases,
        "expertInterventions": expert_interventions,
        "knowledgeProducts": knowledge_products,
        "fhirContext": fhir_context,
    }


def upsert_knowledge_product(
    *,
    case_id: str,
    product_type: str,
    content: dict[str, Any],
    status: str = "draft",
    generated_by: str = "llm",
) -> dict[str, Any]:
    ensure_pkpd_demo_dataset()
    document = {
        "_id": f"KP-{case_id}-{product_type.upper()}-LIVE",
        "caseId": case_id,
        "networkId": PKPD_NETWORK_ID,
        "type": product_type,
        "version": 1,
        "status": status,
        "generatedBy": generated_by,
        "validatedBy": None,
        "content": content,
        "createdAt": datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
    }
    _collection("knowledge_products").replace_one({"_id": document["_id"]}, document, upsert=True)
    return document
