from backend.config import settings


def get_parallel_runtime_manifest() -> dict[str, object]:
    return {
        "slot": settings.project_slot,
        "appName": settings.app_name,
        "projectName": settings.resolved_project_name,
        "backendPort": settings.resolved_backend_port,
        "frontendPort": settings.resolved_frontend_port,
        "databaseName": settings.resolved_database_name,
        "publicDemoUrl": settings.resolved_public_demo_url,
        "publicDemoUrlPortal": settings.resolved_public_demo_url_portal,
        "publicDemoUrlApp": settings.resolved_public_demo_url_app,
    }


def get_openai_runtime_status() -> dict[str, object]:
    if not settings.openai_api_key:
        return {
            "configured": False,
            "ready": False,
            "reason": "Missing OPENAI_API_KEY.",
            "chatModel": settings.openai_chat_model,
            "embeddingModel": settings.openai_embedding_model,
            "chatReady": False,
            "embeddingsReady": False,
            "validationMode": "configuration",
            "liveValidated": False,
            "liveEndpoint": "/api/health/openai",
        }

    chat_ready = bool(settings.openai_chat_model)
    embeddings_ready = bool(settings.openai_embedding_model)

    return {
        "configured": True,
        "ready": chat_ready and embeddings_ready,
        "reason": "OpenAI API key and default models are configured. Use /api/health/openai or npm run openai:check for a live API validation.",
        "chatModel": settings.openai_chat_model,
        "embeddingModel": settings.openai_embedding_model,
        "chatReady": chat_ready,
        "embeddingsReady": embeddings_ready,
        "validationMode": "configuration",
        "liveValidated": False,
        "liveEndpoint": "/api/health/openai",
    }


def get_voyage_runtime_status() -> dict[str, object]:
    if not settings.voyage_api_key:
        return {
            "configured": False,
            "ready": False,
            "reason": "Missing VOYAGE_API_KEY.",
            "embeddingModel": settings.voyage_embedding_model,
            "rerankModel": settings.voyage_rerank_model,
            "embeddingsReady": False,
            "rerankReady": False,
            "validationMode": "configuration",
            "liveValidated": False,
            "liveEndpoint": "/api/health/voyage",
        }

    embeddings_ready = bool(settings.voyage_embedding_model)
    rerank_ready = bool(settings.voyage_rerank_model)

    return {
        "configured": True,
        "ready": embeddings_ready and rerank_ready,
        "reason": "Voyage API key and default models are configured. Use /api/health/voyage or npm run voyage:check for a live API validation.",
        "embeddingModel": settings.voyage_embedding_model,
        "rerankModel": settings.voyage_rerank_model,
        "embeddingsReady": embeddings_ready,
        "rerankReady": rerank_ready,
        "validationMode": "configuration",
        "liveValidated": False,
        "liveEndpoint": "/api/health/voyage",
    }
