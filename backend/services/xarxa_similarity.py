"""Similar-case retrieval over the network's case memory using Atlas
Vector Search.

Each case gets a ``summaryEmbedding`` (OpenAI text-embedding-3-small) of its
clinical summary, PK/PD interpretation and recommendation. A knamanBeta
$vectorSearch finds the network's most similar past cases — the "el
conocimiento viaja, no el paciente" feature: what other centres decided in
comparable situations.
"""

from __future__ import annotations

from typing import Any

from pymongo.errors import OperationFailure

from backend.db.mongo import get_database
from backend.providers import OpenAIConfigurationError, OpenAIPlatformClient
from backend.services.xarxa_repository import _col, _ensure_xarxa_indexes, _now_iso

VECTOR_INDEX_NAME = "xarxa-cases-vector"
EMBEDDING_FIELD = "summaryEmbedding"
MAX_BACKFILL = 50


def _case_text(case: dict[str, Any]) -> str:
    parts = [
        str(case.get("title") or ""),
        str(case.get("clinicalSummary") or ""),
        str((case.get("diseaseContext") or {}).get("diagnosis") or ""),
        str((case.get("therapyContext") or {}).get("currentDrug") or ""),
        str((case.get("pkpdInterpretation") or {}).get("summary") or ""),
        str((case.get("recommendation") or {}).get("text") or ""),
    ]
    return " ".join(part for part in parts if part.strip())[:4000]


def _embed_texts(texts: list[str]) -> list[list[float]]:
    client = OpenAIPlatformClient()
    response = client.embed(texts=texts)
    return response["embeddings"]  # type: ignore[return-value]


def _ensure_vector_index(collection, dimensions: int) -> None:
    existing = {}
    try:
        for index in collection.list_search_indexes():
            existing[index["name"]] = index
    except OperationFailure:
        pass  # index enumeration may be restricted; creation attempt will tell

    if VECTOR_INDEX_NAME in existing:
        status = existing[VECTOR_INDEX_NAME].get("status") or existing[VECTOR_INDEX_NAME].get("latestDefinition", {})
        if existing[VECTOR_INDEX_NAME].get("status") == "BUILDING":
            raise ValueError(
                "El índice vectorial de Atlas todavía se está construyendo; reintenta en un minuto."
            )
        return

    collection.create_search_index(
        {
            "name": VECTOR_INDEX_NAME,
            "type": "vectorSearch",
            "definition": {
                "fields": [
                    {
                        "path": EMBEDDING_FIELD,
                        "type": "vector",
                        "numDimensions": dimensions,
                        "similarity": "cosine",
                    }
                ]
            },
        }
    )
    raise ValueError(
        "Índice vectorial de Atlas creado; la primera construcción tarda alrededor de un minuto. Vuelve a ejecutar la búsqueda."
    )


def ensure_case_embeddings() -> int:
    """Backfill embeddings for cases that lack one. Returns count embedded."""
    cases = list(_col("xarxa_cases").find({EMBEDDING_FIELD: {"$exists": False}}, {"_id": 0}).limit(MAX_BACKFILL))
    if not cases:
        return 0
    embeddings = _embed_texts([_case_text(case) for case in cases])
    for case, embedding in zip(cases, embeddings):
        _col("xarxa_cases").update_one(
            {"caseId": case["caseId"]},
            {"$set": {EMBEDDING_FIELD: embedding, "summaryEmbeddingModel": "text-embedding-3-small", "summaryEmbeddingAt": _now_iso()}},
        )
    return len(cases)


def find_similar_cases(case_id: str, k: int = 5) -> dict[str, Any]:
    _ensure_xarxa_indexes()
    case = _col("xarxa_cases").find_one(_case_query_any(case_id), {"_id": 0})
    if not case:
        raise ValueError(f"Case not found: {case_id}")

    ensure_case_embeddings()
    target_text = _case_text(case)
    if not target_text.strip():
        raise ValueError("El caso no tiene contenido clínico suficiente para buscar casos similares.")

    target_embedding = _embed_texts([target_text])[0]
    _col("xarxa_cases").update_one(
        {"caseId": case["caseId"]},
        {"$set": {EMBEDDING_FIELD: target_embedding, "summaryEmbeddingAt": _now_iso()}},
    )
    _ensure_vector_index(_col("xarxa_cases"), len(target_embedding))

    try:
        results = list(
            _col("xarxa_cases").aggregate(
                [
                    {
                        "$vectorSearch": {
                            "index": VECTOR_INDEX_NAME,
                            "path": EMBEDDING_FIELD,
                            "queryVector": target_embedding,
                            "numCandidates": max(100, k * 10),
                            "limit": k + 1,
                        }
                    },
                    {
                        "$project": {
                            "_id": 0,
                            "caseId": 1,
                            "title": 1,
                            "centerName": 1,
                            "caseType": 1,
                            "pipelineStage": 1,
                            "patientCode": 1,
                            "recommendation": {"text": "$recommendation.text", "status": "$recommendation.status"},
                            "score": {"$meta": "vectorSearchScore"},
                        }
                    },
                ]
            )
        )
    except OperationFailure as exc:
        raise ValueError(f"Atlas Vector Search no está disponible: {exc}") from exc

    similar = [item for item in results if item.get("caseId") != case["caseId"]][:k]
    return {
        "caseId": case["caseId"],
        "items": similar,
        "total": len(similar),
        "note": "Búsqueda semántica sobre el historial de la red (Atlas Vector Search). La similitud no implica validez clínica.",
    }


def _case_query_any(case_id: str) -> dict[str, Any]:
    return {"$or": [{"caseId": case_id}, {"_id": case_id}]}
