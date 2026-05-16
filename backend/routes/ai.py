from fastapi import APIRouter, HTTPException

from backend.providers import (
    OpenAIConfigurationError,
    OpenAIPlatformClient,
    VoyageConfigurationError,
    VoyagePlatformClient,
)
from backend.schemas.ai import ChatRequest, EmbeddingRequest, RerankRequest

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/chat")
async def chat_with_openai(payload: ChatRequest):
    try:
        client = OpenAIPlatformClient()
        return client.chat(
            messages=[message.model_dump() for message in payload.messages],
            system_prompt=payload.system_prompt,
            max_tokens=payload.max_tokens,
            temperature=payload.temperature,
        )
    except OpenAIConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"OpenAI request failed: {exc}") from exc


@router.post("/openai-check")
async def check_openai():
    try:
        client = OpenAIPlatformClient()
        return client.validate_runtime()
    except OpenAIConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"OpenAI runtime validation failed: {exc}") from exc


@router.post("/embed")
async def embed_with_openai(payload: EmbeddingRequest):
    try:
        if payload.provider == "voyage":
            client = VoyagePlatformClient()
            return client.embed(
                texts=payload.texts,
                model=payload.model,
                input_type=payload.input_type,
                output_dimension=payload.output_dimension,
            )

        client = OpenAIPlatformClient()
        return client.embed(texts=payload.texts, model=payload.model)
    except OpenAIConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except VoyageConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Embeddings request failed: {exc}") from exc


@router.post("/voyage-check")
async def check_voyage():
    try:
        client = VoyagePlatformClient()
        return client.validate_runtime()
    except VoyageConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Voyage runtime validation failed: {exc}") from exc


@router.post("/rerank")
async def rerank_with_voyage(payload: RerankRequest):
    try:
        client = VoyagePlatformClient()
        return client.rerank(
            query=payload.query,
            documents=payload.documents,
            model=payload.model,
            top_k=payload.top_k,
        )
    except VoyageConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Voyage rerank request failed: {exc}") from exc
