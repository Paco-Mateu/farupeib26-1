from typing import Optional

from pymongo import MongoClient
from pymongo.database import Database
from pymongo.errors import PyMongoError

from backend.config import settings

_mongo_client: Optional[MongoClient] = None


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
