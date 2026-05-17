from __future__ import annotations

import json
from pathlib import Path

from backend.db.mongo import get_database
from backend.services.xarxa_repository import reset_xarxa_runtime_state

_SEED_FILE = Path(__file__).resolve().parents[2] / "docs" / "xarxa_pkpd_seed_data_es.json"

_XARXA_COLLECTIONS = [
    "xarxa_cases",
    "xarxa_centers",
    "xarxa_professionals",
    "xarxa_agents",
    "xarxa_programs",
    "xarxa_tasks",
    "xarxa_events",
    "xarxa_recommendations",
    "xarxa_notes",
    "xarxa_followups",
    "xarxa_agent_runs",
    "xarxa_forms",
    "xarxa_roles",
    "xarxa_specialties",
    "xarxa_inbox_requests",
    "xarxa_sessions",
    "xarxa_professional_requests",
]

# Old collections from previous prototype — dropped on reseed
_LEGACY_COLLECTIONS = [
    "pkpd_cases", "pkpd_hospitals", "pkpd_patients", "pkpd_protocols",
    "pkpd_network", "pkpd_agents", "pkpd_professionals", "pkpd_knowledge",
]

_seeded = False


def seed_xarxa_demo(force: bool = False) -> dict:
    global _seeded
    if _seeded and not force:
        return {"status": "already_seeded"}

    db = get_database()
    reset_xarxa_runtime_state()

    # Drop legacy collections
    for col in _LEGACY_COLLECTIONS:
        db.drop_collection(col)

    # Drop xarxa collections for clean reseed
    for col in _XARXA_COLLECTIONS:
        db.drop_collection(col)

    if not _SEED_FILE.exists():
        return {"status": "error", "detail": f"Seed file not found: {_SEED_FILE}"}

    with open(_SEED_FILE, encoding="utf-8") as f:
        data = json.load(f)

    inserted: dict[str, int] = {}

    def _insert(collection: str, docs: list[dict]) -> None:
        if docs:
            db[collection].insert_many(docs)
            inserted[collection] = len(docs)

    _insert("xarxa_specialties", data.get("specialties", []))
    _insert("xarxa_roles", data.get("roles", []))
    _insert("xarxa_centers", data.get("centers", []))
    _insert("xarxa_professionals", data.get("professionals", []))
    _insert("xarxa_programs", data.get("clinicalPrograms", []))
    _insert("xarxa_agents", data.get("agents", []))
    _insert("xarxa_forms", data.get("forms", []))
    _insert("xarxa_cases", data.get("cases", []))
    _insert("xarxa_tasks", data.get("tasks", []))
    _insert("xarxa_events", data.get("caseEvents", []))
    _insert("xarxa_recommendations", data.get("recommendations", []))
    _insert("xarxa_notes", data.get("clinicalNotes", []))
    _insert("xarxa_followups", data.get("followUps", []))
    _insert("xarxa_agent_runs", data.get("agentRuns", []))

    # Store reporting seed as a single doc
    reporting = data.get("reportingSeed")
    if reporting:
        db["xarxa_reporting"].drop()
        db["xarxa_reporting"].insert_one(reporting)
        inserted["xarxa_reporting"] = 1

    _seeded = True
    return {"status": "seeded", "inserted": inserted}
