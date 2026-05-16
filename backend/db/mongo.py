from typing import Optional

from pymongo import MongoClient
from pymongo.database import Database
from pymongo.errors import PyMongoError

from backend.config import settings

_mongo_client: Optional[MongoClient] = None
_external_clients: dict[str, MongoClient] = {}


class MongoConnectionError(Exception):
    """Raised when the backend cannot connect to MongoDB."""


def get_client() -> MongoClient:
    global _mongo_client

    if not settings.mongodb_uri:
        raise MongoConnectionError(
            "MongoDB is not configured. Set MONGODB_URI or MONGODB_ATLAS_URI before starting the API."
        )

    if _mongo_client is None:
        try:
            candidate = MongoClient(
                settings.mongodb_uri,
                appname=settings.app_name,
                serverSelectionTimeoutMS=8000,
            )
            candidate.admin.command("ping")
            _mongo_client = candidate
        except PyMongoError as exc:
            raise MongoConnectionError(f"Backend could not connect to MongoDB: {exc}") from exc

    return _mongo_client


def get_database(name: Optional[str] = None) -> Database:
    return get_client()[name or settings.resolved_database_name]


def ping_database() -> bool:
    try:
        get_client().admin.command("ping")
        return True
    except Exception:
        return False


def get_external_client(uri: str, *, cache_key: str) -> MongoClient:
    cached = _external_clients.get(cache_key)
    if cached is not None:
        return cached

    try:
        candidate = MongoClient(
            uri,
            appname=f"{settings.app_name}-{cache_key}",
            serverSelectionTimeoutMS=8000,
        )
        candidate.admin.command("ping")
        _external_clients[cache_key] = candidate
        return candidate
    except PyMongoError as exc:
        raise MongoConnectionError(f"Backend could not connect to external MongoDB '{cache_key}': {exc}") from exc


def get_synthea_fhir_database() -> Database:
    if not settings.has_synthea_fhir:
        raise MongoConnectionError(
            "Synthea FHIR MongoDB is not configured. Set "
            "SYNTHEA_BREAST_CANCER_FHIR_MONGODB_CONNECTION_STRING and "
            "SYNTHEA_BREAST_CANCER_FHIR_MONGODB_DB before using PK/PD FHIR features."
        )

    return get_external_client(
        settings.synthea_breast_cancer_fhir_mongodb_connection_string or "",
        cache_key="synthea-fhir",
    )[settings.synthea_breast_cancer_fhir_mongodb_db or ""]


def ping_synthea_fhir_database() -> bool:
    try:
        get_synthea_fhir_database().command("ping")
        return True
    except Exception:
        return False
