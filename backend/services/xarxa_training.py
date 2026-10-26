"""Training requests (UC-03) of the Xarxa PK/PD network.

Mirrors the network's "Formulari sol·licitud de formació": any centre's
hospital pharmacist can request a training session or monographic review for
the fortnightly meetings; the HUB schedules and delivers it.
"""

from __future__ import annotations

from typing import Any

from backend.db.mongo import get_database
from backend.services.xarxa_repository import (
    _append_event,
    _cache_invalidate,
    _col,
    _ensure_xarxa_indexes,
    _extract_actor,
    _now_iso,
)

TRAINING_COLLECTION = "xarxa_training_requests"
TRAINING_STATUSES = ("Propuesta", "Programada", "Impartida", "Rechazada")


def list_xarxa_training_requests(status: str | None = None) -> list[dict[str, Any]]:
    _ensure_xarxa_indexes()
    query = {"status": status} if status else {}
    docs = list(_col(TRAINING_COLLECTION).find(query, {"_id": 0}).sort("createdAt", -1))
    return docs


def create_xarxa_training_request(payload: dict[str, Any]) -> dict[str, Any]:
    """Create a training request from the normalized form (UC-03)."""
    _ensure_xarxa_indexes()
    title = (payload.get("title") or "").strip()
    if not title:
        raise ValueError("El título de la solicitud de formación es obligatorio.")
    if not (payload.get("justification") or "").strip():
        raise ValueError("La justificación de la necesidad formativa es obligatoria.")

    actor = _extract_actor(payload)
    now = _now_iso()
    sequence = _col(TRAINING_COLLECTION).count_documents({}) + 1
    doc = {
        "requestId": f"FORM-{now[:4]}-{sequence:03d}",
        "title": title,
        "type": payload.get("type", "Formación"),
        "drugDisease": (payload.get("drugDisease") or "").strip(),
        "justification": payload["justification"].strip(),
        "currentSituation": (payload.get("currentSituation") or "").strip(),
        "expectedImpact": (payload.get("expectedImpact") or "").strip(),
        "bibliography": (payload.get("bibliography") or "").strip(),
        "proposedDate": payload.get("proposedDate"),
        "requesterName": payload.get("requesterName") or actor["name"],
        "requesterCollegiate": (payload.get("requesterCollegiate") or "").strip(),
        "centerId": payload.get("centerId", ""),
        "centerName": payload.get("centerName", ""),
        "status": "Propuesta",
        "createdAt": now,
        "updatedAt": now,
    }
    _col(TRAINING_COLLECTION).insert_one(doc | {"_id": doc["requestId"]})
    _cache_invalidate("training")
    return doc


def update_xarxa_training_request(request_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    """Update status / scheduling of a training request (HUB action)."""
    _ensure_xarxa_indexes()
    status = payload.get("status")
    if status and status not in TRAINING_STATUSES:
        raise ValueError(f"Estado no válido: {status}. Valores: {', '.join(TRAINING_STATUSES)}")

    fields: dict[str, Any] = {"updatedAt": _now_iso()}
    if status:
        fields["status"] = status
    if payload.get("scheduledDate"):
        fields["scheduledDate"] = payload["scheduledDate"]
    if payload.get("sessionTitle"):
        fields["sessionTitle"] = payload["sessionTitle"]

    result = _col(TRAINING_COLLECTION).find_one_and_update(
        {"requestId": request_id},
        {"$set": fields},
        return_document=True,
        projection={"_id": 0},
    )
    if not result:
        raise ValueError(f"Training request not found: {request_id}")

    if status:
        _cache_invalidate("training", "sessions")
    return result
