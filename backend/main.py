from urllib.parse import urlsplit

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.config import settings
from backend.db.mongo import MongoConnectionError
from backend.routes.ai import router as ai_router
from backend.routes.health import router as health_router
from backend.routes.kit import router as kit_router
from backend.routes.xarxa import router as xarxa_router

app = FastAPI(
    title="Xarxa PK/PD API",
    description="Clinical PK/PD collaboration network — Crohn PK/PD prototype.",
    version="1.0.0",
)


def _origin(url: str) -> str | None:
    parts = urlsplit(url)
    return f"{parts.scheme}://{parts.netloc}" if parts.netloc else None


def _allowed_origins() -> list[str]:
    origins = {
        _origin(settings.resolved_public_demo_url),
        _origin(settings.resolved_public_demo_url_portal),
        _origin(settings.resolved_public_demo_url_app),
    }
    for port in (3001, 3002, 3003):
        origins.update({f"http://localhost:{port}", f"http://127.0.0.1:{port}"})
    return sorted(origin for origin in origins if origin)


app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in (health_router, kit_router, ai_router, xarxa_router):
    app.include_router(router)


@app.exception_handler(MongoConnectionError)
async def handle_mongo_connection_error(_, exc: MongoConnectionError):
    return JSONResponse(
        status_code=503,
        content={
            "error": "mongo_connection_error",
            "detail": str(exc),
        },
    )
