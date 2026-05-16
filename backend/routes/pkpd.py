from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from backend.services.pkpd_ai import draft_intervention_note, generate_case_summary
from backend.services.pkpd_repository import (
    bootstrap_pkpd_demo,
    get_case,
    get_case_workspace,
    get_network_kpis,
    get_protocol_match,
    get_similar_cases,
    list_cases,
)


router = APIRouter(prefix="/api", tags=["pkpd"])


@router.post("/pkpd/bootstrap")
async def bootstrap_demo_dataset():
    return bootstrap_pkpd_demo()


@router.get("/network/kpis")
async def read_network_kpis():
    return get_network_kpis()


@router.get("/cases")
async def read_cases(
    limit: int = Query(default=18, ge=1, le=100),
    include_historical: bool = Query(default=True),
):
    return {
        "items": list_cases(limit=limit, include_historical=include_historical),
        "limit": limit,
        "includeHistorical": include_historical,
    }


@router.get("/cases/{case_id}")
async def read_case_workspace(case_id: str):
    workspace = get_case_workspace(case_id)
    if workspace is None:
        raise HTTPException(status_code=404, detail=f"Case {case_id} was not found.")
    return workspace


@router.get("/cases/{case_id}/protocol")
async def read_case_protocol(case_id: str):
    case = get_case(case_id)
    if case is None:
        raise HTTPException(status_code=404, detail=f"Case {case_id} was not found.")
    return get_protocol_match(case)


@router.get("/cases/{case_id}/similar")
async def read_similar_cases(case_id: str, limit: int = Query(default=5, ge=1, le=12)):
    case = get_case(case_id)
    if case is None:
        raise HTTPException(status_code=404, detail=f"Case {case_id} was not found.")
    return {"items": get_similar_cases(case, limit=limit)}


@router.post("/cases/{case_id}/summarize")
async def summarize_case(case_id: str):
    try:
        return generate_case_summary(case_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/cases/{case_id}/draft-intervention")
async def draft_case_intervention(case_id: str):
    try:
        return draft_intervention_note(case_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
