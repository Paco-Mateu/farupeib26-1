"""Terminology reference data for the Xarxa PK/PD network.

Loads the clinical reference sheets provided by Hospital de Bellvitge
(converted to JSON by scripts/import_bellvitge_terminology.py):

- ``xarxa_pathology_scores``: disease-activity score definitions per IMID
  diagnosis (which variables to capture for each disease and how).
- ``xarxa_drug_lab_panels``: lab monitoring panel per biologic substance,
  including which test is the drug trough level and which presentations
  (brand / biosimilar / form) share the panel.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from pymongo import ReplaceOne

from backend.db.mongo import get_database

_TERMINOLOGY_DIR = Path(__file__).resolve().parents[2] / "data" / "processed"

PATHOLOGY_COLLECTION = "xarxa_pathology_scores"
DRUG_PANEL_COLLECTION = "xarxa_drug_lab_panels"

_loaded = False


def _load_json(filename: str) -> list[dict[str, Any]]:
    path = _TERMINOLOGY_DIR / filename
    if not path.exists():
        raise FileNotFoundError(f"Terminology file not found: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def ensure_xarxa_terminology(force: bool = False) -> dict[str, int]:
    """Idempotently load the terminology collections from data/processed."""
    global _loaded
    if _loaded and not force:
        return {}

    db = get_database()
    if force:
        db[PATHOLOGY_COLLECTION].drop()
        db[DRUG_PANEL_COLLECTION].drop()

    counts: dict[str, int] = {}
    for collection, key_field, filename in (
        (PATHOLOGY_COLLECTION, "code", "xarxa_pathology_scores.json"),
        (DRUG_PANEL_COLLECTION, "substance", "xarxa_drug_lab_panels.json"),
    ):
        documents = _load_json(filename)
        if not documents:
            counts[collection] = 0
            continue
        db[collection].create_index(key_field, unique=True)
        db[collection].bulk_write(
            [ReplaceOne({key_field: document[key_field]}, document, upsert=True) for document in documents]
        )
        counts[collection] = len(documents)

    _loaded = True
    return counts


def list_xarxa_pathology_scores() -> list[dict[str, Any]]:
    ensure_xarxa_terminology()
    db = get_database()
    return [
        {**doc, "_id": str(doc["_id"])}
        for doc in db[PATHOLOGY_COLLECTION].find({}, sort=[("code", 1)])
    ]


def list_xarxa_drug_panels(substance: str | None = None) -> list[dict[str, Any]]:
    ensure_xarxa_terminology()
    db = get_database()
    query = {"substance": substance.lower()} if substance else {}
    return [
        {**doc, "_id": str(doc["_id"])}
        for doc in db[DRUG_PANEL_COLLECTION].find(query, sort=[("substance", 1)])
    ]
