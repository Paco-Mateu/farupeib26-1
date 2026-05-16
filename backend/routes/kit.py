from fastapi import APIRouter

from backend.services.workkit import get_workkit_manifest

router = APIRouter(prefix="/api", tags=["kit"])


@router.get("/kit")
async def read_workkit():
    return get_workkit_manifest()
