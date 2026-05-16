from __future__ import annotations

from typing import Iterable

from openai import OpenAI

from backend.config import settings


class OpenAIConfigurationError(Exception):
    """Raised when the OpenAI client is not configured correctly."""


class OpenAIPlatformClient:
    """Thin wrapper for OpenAI chat/completions and embeddings."""

    def __init__(self) -> None:
        if not settings.openai_api_key:
            raise OpenAIConfigurationError("Missing OPENAI_API_KEY.")
        self._client = OpenAI(api_key=settings.openai_api_key)

    @staticmethod
    def has_api_key() -> bool:
        return bool(settings.openai_api_key)

    @staticmethod
    def chat_is_configured() -> bool:
        return bool(settings.openai_api_key and settings.openai_chat_model)

    @staticmethod
    def embeddings_are_configured() -> bool:
        return bool(settings.openai_api_key and settings.openai_embedding_model)

    @staticmethod
    def _build_messages(
        messages: Iterable[dict[str, str]],
        system_prompt: str | None = None,
    ) -> list[dict[str, str]]:
        payload: list[dict[str, str]] = []
        if system_prompt:
            payload.append({"role": "system", "content": system_prompt})
        for message in messages:
            payload.append({"role": message["role"], "content": message["content"]})
        return payload

    def validate_runtime(self) -> dict[str, object]:
        chat = self.chat(
            messages=[{"role": "user", "content": "Reply with READY only."}],
            max_tokens=12,
            temperature=0.0,
        )
        embeddings = self.embed(texts=["openai health check"])

        return {
            "ok": True,
            "provider": "openai",
            "chat": {
                "model": chat["model"],
                "text": chat["text"],
                "usage": chat["usage"],
                "finishReason": chat["finishReason"],
            },
            "embeddings": {
                "model": embeddings["model"],
                "dimensions": embeddings["dimensions"],
                "count": len(embeddings["embeddings"]),
            },
        }

    def chat(
        self,
        *,
        messages: Iterable[dict[str, str]],
        system_prompt: str | None = None,
        max_tokens: int = 700,
        temperature: float = 0.2,
        model: str | None = None,
    ) -> dict[str, object]:
        selected_model = model or settings.openai_chat_model
        if not selected_model:
            raise OpenAIConfigurationError("Missing OPENAI_CHAT_MODEL.")

        response = self._client.chat.completions.create(
            model=selected_model,
            messages=self._build_messages(messages, system_prompt),
            temperature=temperature,
            max_completion_tokens=max_tokens,
            store=False,
        )

        choice = response.choices[0]
        usage = response.usage
        text = choice.message.content or ""

        return {
            "provider": "openai",
            "model": selected_model,
            "text": text,
            "usage": {
                "inputTokens": getattr(usage, "prompt_tokens", None),
                "outputTokens": getattr(usage, "completion_tokens", None),
                "totalTokens": getattr(usage, "total_tokens", None),
            },
            "finishReason": choice.finish_reason,
        }

    def embed(
        self,
        *,
        texts: list[str],
        model: str | None = None,
    ) -> dict[str, object]:
        selected_model = model or settings.openai_embedding_model
        if not selected_model:
            raise OpenAIConfigurationError("Missing OPENAI_EMBEDDING_MODEL.")

        response = self._client.embeddings.create(
            model=selected_model,
            input=texts,
        )
        embeddings = [item.embedding for item in response.data]

        return {
            "provider": "openai",
            "model": selected_model,
            "embeddings": embeddings,
            "dimensions": len(embeddings[0]) if embeddings else 0,
        }
