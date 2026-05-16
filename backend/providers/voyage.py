from __future__ import annotations

from voyageai import Client

from backend.config import settings


class VoyageConfigurationError(Exception):
    """Raised when the Voyage client is not configured correctly."""


class VoyagePlatformClient:
    """Thin wrapper for Voyage embeddings and rerank."""

    def __init__(self) -> None:
        if not settings.voyage_api_key:
            raise VoyageConfigurationError("Missing VOYAGE_API_KEY.")
        self._client = Client(api_key=settings.voyage_api_key)

    @staticmethod
    def has_api_key() -> bool:
        return bool(settings.voyage_api_key)

    @staticmethod
    def embeddings_are_configured() -> bool:
        return bool(settings.voyage_api_key and settings.voyage_embedding_model)

    @staticmethod
    def rerank_is_configured() -> bool:
        return bool(settings.voyage_api_key and settings.voyage_rerank_model)

    def validate_runtime(self) -> dict[str, object]:
        embeddings = self.embed(texts=["voyage health check"], input_type="document")
        rerank = self.rerank(
            query="voyage health check",
            documents=["voyage health check document", "irrelevant sample"],
            top_k=1,
        )

        top_result = rerank["results"][0] if rerank["results"] else None

        return {
            "ok": True,
            "provider": "voyage",
            "embeddings": {
                "model": embeddings["model"],
                "dimensions": embeddings["dimensions"],
                "count": len(embeddings["embeddings"]),
            },
            "rerank": {
                "model": rerank["model"],
                "count": len(rerank["results"]),
                "topResult": top_result,
            },
        }

    def embed(
        self,
        *,
        texts: list[str],
        model: str | None = None,
        input_type: str | None = None,
        output_dimension: int | None = None,
    ) -> dict[str, object]:
        selected_model = model or settings.voyage_embedding_model
        if not selected_model:
            raise VoyageConfigurationError("Missing VOYAGE_EMBEDDING_MODEL.")

        embed_kwargs = {
            "texts": texts,
            "model": selected_model,
            "input_type": input_type,
        }

        if output_dimension is not None:
            try:
                response = self._client.embed(
                    **embed_kwargs,
                    output_dimension=output_dimension,
                )
            except TypeError:
                response = self._client.embed(**embed_kwargs)
        else:
            response = self._client.embed(**embed_kwargs)
        embeddings = list(getattr(response, "embeddings", []))

        return {
            "provider": "voyage",
            "model": selected_model,
            "embeddings": embeddings,
            "dimensions": len(embeddings[0]) if embeddings else 0,
            "totalTokens": getattr(response, "total_tokens", None),
        }

    def rerank(
        self,
        *,
        query: str,
        documents: list[str],
        model: str | None = None,
        top_k: int | None = None,
    ) -> dict[str, object]:
        selected_model = model or settings.voyage_rerank_model
        if not selected_model:
            raise VoyageConfigurationError("Missing VOYAGE_RERANK_MODEL.")

        response = self._client.rerank(
            query=query,
            documents=documents,
            model=selected_model,
            top_k=top_k,
        )
        results = [
            {
                "index": item.index,
                "document": item.document,
                "relevanceScore": item.relevance_score,
            }
            for item in getattr(response, "results", [])
        ]

        return {
            "provider": "voyage",
            "model": selected_model,
            "results": results,
            "totalTokens": getattr(response, "total_tokens", None),
        }
