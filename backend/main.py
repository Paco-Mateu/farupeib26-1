from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
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
