from fastapi import APIRouter, HTTPException

from backend.config import settings
from backend.db import ping_database
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


@router.get("/health")
async def health():
    mongo_connected = ping_database() if settings.has_mongo else False
    openai = get_openai_runtime_status()
    voyage = get_voyage_runtime_status()
    runtime = get_parallel_runtime_manifest()

    return {
        "service": "Prototype Sprint Kit API",
        "version": "0.2.0",
        "environment": settings.app_env,
        "runtime": runtime,
        "providers": {
            "mongo": {
                "configured": settings.has_mongo,
                "connected": mongo_connected,
                "database": settings.resolved_database_name,
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
