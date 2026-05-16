from pathlib import Path

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT_DIR = Path(__file__).resolve().parents[2]


def _normalize_public_url(value: str | None) -> str | None:
    if value is None:
        return None

    normalized = value.strip()
    if not normalized:
        return None

    if normalized.startswith(("http://", "https://")):
        return normalized.rstrip("/")

    return f"https://{normalized.lstrip('/')}".rstrip("/")


class Settings(BaseSettings):
    project_slot: int = Field(
        default=1,
        validation_alias=AliasChoices("PROJECT_SLOT", "APP_SLOT", "PROTOTYPE_SLOT"),
    )
    app_name: str = Field(default="proto1", validation_alias=AliasChoices("APP_NAME"))
    app_env: str = Field(default="development", validation_alias=AliasChoices("APP_ENV", "NODE_ENV"))
    project_name: str | None = Field(
        default=None,
        validation_alias=AliasChoices("PROJECT_NAME", "NEXT_PUBLIC_PROJECT_NAME"),
    )
    backend_port: int | None = Field(
        default=None,
        validation_alias=AliasChoices("BACKEND_PORT", "API_PORT"),
    )
    frontend_port: int | None = Field(
        default=None,
        validation_alias=AliasChoices("FRONTEND_PORT", "PORT", "NEXT_PORT"),
    )
    public_demo_url: str | None = Field(
        default=None,
        validation_alias=AliasChoices("PUBLIC_DEMO_URL", "NEXT_PUBLIC_DEMO_URL"),
    )
    public_demo_url_portal: str | None = Field(
        default=None,
        validation_alias=AliasChoices("PUBLIC_DEMO_URL_PORTAL", "NEXT_PUBLIC_DEMO_URL_PORTAL"),
    )
    public_demo_url_app: str | None = Field(
        default=None,
        validation_alias=AliasChoices("PUBLIC_DEMO_URL_APP", "NEXT_PUBLIC_DEMO_URL_APP"),
    )
    waitlist_headline: str = Field(
        default="We are building this prototype live today.",
        validation_alias=AliasChoices("WAITLIST_HEADLINE", "NEXT_PUBLIC_WAITLIST_HEADLINE"),
    )
    waitlist_message: str = Field(
        default="This is the blank canvas. Come back in two hours and this page should tell a different story.",
        validation_alias=AliasChoices("WAITLIST_MESSAGE", "NEXT_PUBLIC_WAITLIST_MESSAGE"),
    )

    mongodb_uri: str | None = Field(
        default=None,
        validation_alias=AliasChoices("MONGODB_URI", "MONGODB_ATLAS_URI"),
    )
    database_name: str | None = Field(
        default=None,
        validation_alias=AliasChoices("DATABASE_NAME", "MONGODB_DATABASE"),
    )

    openai_api_key: str | None = Field(
        default=None,
        validation_alias=AliasChoices("OPENAI_API_KEY"),
    )
    openai_chat_model: str = Field(
        default="gpt-4.1-mini",
        validation_alias=AliasChoices("OPENAI_CHAT_MODEL", "OPENAI_MODEL", "OPENAI_COMPLETIONS_MODEL"),
    )
    openai_embedding_model: str = Field(
        default="text-embedding-3-small",
        validation_alias=AliasChoices("OPENAI_EMBEDDING_MODEL"),
    )
    voyage_api_key_name: str | None = Field(
        default=None,
        validation_alias=AliasChoices("VOYAGE_API_KEY_NAME"),
    )
    voyage_api_key: str | None = Field(
        default=None,
        validation_alias=AliasChoices("VOYAGE_API_KEY"),
    )
    voyage_embedding_model: str = Field(
        default="voyage-4-lite",
        validation_alias=AliasChoices("VOYAGE_EMBEDDING_MODEL"),
    )
    voyage_rerank_model: str = Field(
        default="rerank-2.5-lite",
        validation_alias=AliasChoices("VOYAGE_RERANK_MODEL"),
    )

    model_config = SettingsConfigDict(
        env_file=(str(ROOT_DIR / ".env.local"), str(ROOT_DIR / ".env")),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def has_mongo(self) -> bool:
        return bool(self.mongodb_uri)

    @property
    def has_openai(self) -> bool:
        return bool(self.openai_api_key)

    @property
    def has_voyage(self) -> bool:
        return bool(self.voyage_api_key)

    @property
    def resolved_backend_port(self) -> int:
        return self.backend_port or (8000 + self.project_slot)

    @property
    def resolved_frontend_port(self) -> int:
        return self.frontend_port or (3000 + self.project_slot)

    @property
    def resolved_project_name(self) -> str:
        return self.project_name or self.app_name

    @property
    def resolved_database_name(self) -> str:
        return self.database_name or self.app_name

    @property
    def resolved_public_demo_url(self) -> str:
        normalized = _normalize_public_url(self.public_demo_url)
        if normalized:
            return normalized
        return f"http://localhost:{self.resolved_frontend_port}"

    @property
    def resolved_public_demo_url_portal(self) -> str:
        normalized = _normalize_public_url(self.public_demo_url_portal)
        if normalized:
            return normalized
        return f"{self.resolved_public_demo_url}/pro"

    @property
    def resolved_public_demo_url_app(self) -> str:
        normalized = _normalize_public_url(self.public_demo_url_app)
        if normalized:
            return normalized
        return f"{self.resolved_public_demo_url}/app"


settings = Settings()
