from typing import Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    system_prompt: str | None = None
    messages: list[ChatMessage] = Field(min_length=1)
    max_tokens: int = Field(default=700, ge=1, le=4096)
    temperature: float = Field(default=0.2, ge=0.0, le=1.0)


class EmbeddingRequest(BaseModel):
    provider: Literal["openai", "voyage"] = "openai"
    texts: list[str] = Field(min_length=1, max_length=1000)
    model: str | None = None
    input_type: Literal["query", "document"] | None = None
    output_dimension: int | None = Field(default=None, ge=1)


class RerankRequest(BaseModel):
    query: str = Field(min_length=1)
    documents: list[str] = Field(min_length=1, max_length=1000)
    model: str | None = None
    top_k: int | None = Field(default=None, ge=1, le=1000)
