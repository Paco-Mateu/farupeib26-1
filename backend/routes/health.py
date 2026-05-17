from fastapi import APIRouter, HTTPException

from backend.config import settings
from backend.db import ping_database
from backend.db.mongo import get_database, ping_synthea_fhir_database
from backend.providers import (
    OpenAIConfigurationError,
    OpenAIPlatformClient,
    VoyageConfigurationError,
    VoyagePlatformClient,
)
from backend.services.runtime_config import (
    get_openai_runtime_status,
    get_parallel_runtime_manifest,
    get_voyage_runtime_status,
)

router = APIRouter(prefix="/api", tags=["health"])


XARXA_COLLECTIONS = ["xarxa_cases", "xarxa_centers", "xarxa_professionals", "xarxa_agents"]


def _xarxa_dataset_status() -> dict[str, object]:
    try:
        db = get_database()
        collection_counts = {col: db[col].estimated_document_count() for col in XARXA_COLLECTIONS}
        ready = collection_counts.get("xarxa_cases", 0) > 0
        return {
            "configured": settings.has_mongo,
            "ready": ready,
            "collections": collection_counts,
        }
    except Exception as exc:
        return {
            "configured": settings.has_mongo,
            "ready": False,
            "collections": {},
            "error": str(exc),
        }


@router.get("/health")
async def health():
    mongo_connected = ping_database() if settings.has_mongo else False
    openai = get_openai_runtime_status()
    voyage = get_voyage_runtime_status()
    runtime = get_parallel_runtime_manifest()
    xarxa_dataset = _xarxa_dataset_status()

    return {
        "service": "Xarxa PK/PD API",
        "version": "1.0.0",
        "environment": settings.app_env,
        "runtime": runtime,
        "providers": {
            "mongo": {
                "configured": settings.has_mongo,
                "connected": mongo_connected,
                "database": settings.resolved_database_name,
            },
            "syntheaFhir": {
                "configured": settings.has_synthea_fhir,
                "connected": ping_synthea_fhir_database() if settings.has_synthea_fhir else False,
                "database": settings.synthea_breast_cancer_fhir_mongodb_db,
                "collection": settings.synthea_breast_cancer_fhir_resources_collection,
            },
            "openai": {
                "configured": openai["configured"],
                "ready": openai["ready"],
                "reason": openai["reason"],
                "chatModel": openai["chatModel"],
                "embeddingModel": openai["embeddingModel"],
                "chatReady": openai["chatReady"],
                "embeddingsReady": openai["embeddingsReady"],
                "validationMode": openai["validationMode"],
                "liveValidated": openai["liveValidated"],
                "liveEndpoint": openai["liveEndpoint"],
            },
            "voyage": {
                "configured": voyage["configured"],
                "ready": voyage["ready"],
                "reason": voyage["reason"],
                "embeddingModel": voyage["embeddingModel"],
                "rerankModel": voyage["rerankModel"],
                "embeddingsReady": voyage["embeddingsReady"],
                "rerankReady": voyage["rerankReady"],
                "validationMode": voyage["validationMode"],
                "liveValidated": voyage["liveValidated"],
                "liveEndpoint": voyage["liveEndpoint"],
            },
        },
        "datasets": {
            "xarxa": xarxa_dataset,
        },
    }


@router.get("/health/openai")
async def openai_health():
    try:
        client = OpenAIPlatformClient()
        return client.validate_runtime()
    except OpenAIConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"OpenAI runtime validation failed: {exc}") from exc


@router.get("/health/voyage")
async def voyage_health():
    try:
        client = VoyagePlatformClient()
        return client.validate_runtime()
    except VoyageConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Voyage runtime validation failed: {exc}") from exc


@router.get("/health/xarxa")
async def xarxa_health():
    return _xarxa_dataset_status()
