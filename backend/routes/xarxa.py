from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Any

from backend.services.xarxa_seed import seed_xarxa_demo
from backend.services.xarxa_repository import (
    approve_xarxa_professional_request,
    bulk_act_on_xarxa_cases,
    create_xarxa_program,
    create_xarxa_case,
    create_xarxa_case_from_inbox,
    create_xarxa_session,
    generate_xarxa_case_from_random_email,
    generate_xarxa_inbox_item,
    generate_xarxa_note,
    get_xarxa_case,
    get_xarxa_kpis,
    list_xarxa_agents,
    list_xarxa_cases,
    list_xarxa_centers,
    list_xarxa_forms,
    list_xarxa_inbox,
    list_xarxa_professional_requests,
    list_xarxa_professionals,
    list_xarxa_programs,
    list_xarxa_roles,
    list_xarxa_sessions,
    orchestrate_xarxa_case,
    process_xarxa_inbox_item,
    publish_xarxa_program,
    save_xarxa_followup,
    save_xarxa_note,
    save_xarxa_recommendation,
    transition_xarxa_case,
    update_xarxa_professional,
    update_xarxa_program,
    update_xarxa_session_status,
    update_xarxa_case,
    update_xarxa_task,
)


class PatientProfilePayload(BaseModel):
    age: int | None = None
    sex: str | None = None
    weightKg: float | None = None
    heightCm: float | None = None
    specialPopulation: list[str] = []


class DeterminantPayload(BaseModel):
    label: str
    value: str | float | int | None = None
    unit: str | None = None
    status: str = "Pendiente de validar"
    source: str = "Formulario"
    relationToDose: str | None = None
    interpretation: str | None = None


class CreateCaseRequest(BaseModel):
    patientCode: str
    requesterId: str | None = None
    requesterName: str
    centerName: str
    centerId: str
    title: str | None = None
    specialty: str = "Digestivo"
    caseType: str
    priority: str = "Media"
    entrySource: str = "Formulario web"
    clinicalContext: str = ""
    programId: str = "prog-crohn"
    pipelineStage: str = "Solicitud recibida"
    nextAction: str | None = None
    patientProfile: PatientProfilePayload | None = None
    diseaseContext: dict[str, Any] = {}
    therapyContext: dict[str, Any] = {}
    labDeterminants: list[DeterminantPayload] = []
    recommendation: dict[str, Any] | None = None
    clinicalNote: dict[str, Any] | None = None


class UpdateCaseRequest(BaseModel):
    title: str | None = None
    clinicalSummary: str | None = None
    nextAction: str | None = None
    pipelineStage: str | None = None
    priority: str | None = None
    caseType: str | None = None
    patientProfile: PatientProfilePayload | None = None
    diseaseContext: dict[str, Any] | None = None
    therapyContext: dict[str, Any] | None = None
    labDeterminants: list[DeterminantPayload] | None = None


class TransitionCaseRequest(BaseModel):
    pipelineStage: str | None = None
    nextAction: str | None = None
    priority: str | None = None
    assignedTo: str | None = None
    assignedName: str | None = None
    eventLabel: str
    lane: str = "Decisiones"
    type: str = "Estado"


class UpdateTaskRequest(BaseModel):
    status: str | None = None
    ownerRole: str | None = None
    ownerId: str | None = None
    dueDate: str | None = None
    title: str | None = None
    priority: str | None = None
    eventLabel: str | None = None


class RecommendationUpdateRequest(BaseModel):
    status: str
    text: str
    pipelineStage: str | None = None
    nextAction: str | None = None
    eventLabel: str | None = None


class ClinicalNoteUpdateRequest(BaseModel):
    status: str | None = None
    text: str | None = None
    pipelineStage: str | None = None
    nextAction: str | None = None
    eventLabel: str | None = None


class FollowUpUpdateRequest(BaseModel):
    label: str
    status: str
    dueDate: str | None = None
    pipelineStage: str | None = None
    nextAction: str | None = None
    eventLabel: str | None = None


class CreateSessionRequest(BaseModel):
    title: str | None = None
    date: str | None = None


class BulkCaseActionRequest(BaseModel):
    caseIds: list[str]
    action: str
    assignedTo: str | None = None
    assignedName: str | None = None
    priority: str | None = None


class ApproveProfessionalRequest(BaseModel):
    roleId: str | None = None
    centerId: str | None = None


class UpdateProfessionalRequest(BaseModel):
    roleId: str | None = None
    centerId: str | None = None
    status: str | None = None


class ProgramPayload(BaseModel):
    label: str | None = None
    specialty: str | None = None
    status: str | None = None
    version: str | None = None
    conditions: list[str] | None = None
    drugs: list[str] | None = None
    determinants: list[str] | None = None
    caseTypes: list[str] | None = None
    workflowStages: list[str] | None = None
    sharingPolicy: str | None = None

router = APIRouter(prefix="/api/xarxa", tags=["xarxa"])


@router.post("/seed")
async def seed_demo(force: bool = False):
    return seed_xarxa_demo(force=force)


@router.get("/kpis")
async def read_kpis(
    center: str | None = Query(default=None),
    program: str | None = Query(default=None),
    days: int | None = Query(default=None),
):
    return get_xarxa_kpis(center_id=center, program_id=program, days=days)


@router.get("/cases")
async def read_cases(
    stage: str | None = Query(default=None),
    priority: str | None = Query(default=None),
    center: str | None = Query(default=None),
    program: str | None = Query(default=None),
    search: str | None = Query(default=None),
    days: int | None = Query(default=None),
):
    cases = list_xarxa_cases(
        stage=stage,
        priority=priority,
        center=center,
        program=program,
        search=search,
        days=days,
    )
    return {"items": cases, "total": len(cases)}


@router.post("/cases")
async def create_case(body: CreateCaseRequest):
    case = create_xarxa_case(body.model_dump())
    return case


@router.post("/cases/bulk-action")
async def post_bulk_case_action(body: BulkCaseActionRequest):
    try:
        items = bulk_act_on_xarxa_cases(
            case_ids=body.caseIds,
            action=body.action,
            assigned_to=body.assignedTo,
            assigned_name=body.assignedName,
            priority=body.priority,
        )
        return {"items": items, "total": len(items)}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/cases/{case_id}")
async def read_case(case_id: str):
    try:
        return get_xarxa_case(case_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.patch("/cases/{case_id}")
async def patch_case(case_id: str, body: UpdateCaseRequest):
    try:
        return update_xarxa_case(case_id, body.model_dump(exclude_none=True))
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/cases/{case_id}/transition")
async def transition_case(case_id: str, body: TransitionCaseRequest):
    try:
        return transition_xarxa_case(case_id, body.model_dump(exclude_none=True))
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/cases/{case_id}/orchestrate")
async def post_orchestrate_case(case_id: str):
    try:
        return orchestrate_xarxa_case(case_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.patch("/cases/{case_id}/tasks/{task_id}")
async def patch_task(case_id: str, task_id: str, body: UpdateTaskRequest):
    try:
        return update_xarxa_task(case_id, task_id, body.model_dump(exclude_none=True))
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.put("/cases/{case_id}/recommendation")
async def put_recommendation(case_id: str, body: RecommendationUpdateRequest):
    try:
        return save_xarxa_recommendation(case_id, body.model_dump(exclude_none=True))
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.put("/cases/{case_id}/note")
async def put_note(case_id: str, body: ClinicalNoteUpdateRequest):
    try:
        return save_xarxa_note(case_id, body.model_dump(exclude_none=True))
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/cases/{case_id}/note/generate")
async def post_generate_note(case_id: str):
    try:
        return generate_xarxa_note(case_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.put("/cases/{case_id}/followup")
async def put_followup(case_id: str, body: FollowUpUpdateRequest):
    try:
        return save_xarxa_followup(case_id, body.model_dump(exclude_none=True))
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/inbox")
async def read_inbox():
    items = list_xarxa_inbox()
    return {"items": items, "total": len(items)}


@router.post("/inbox/generate")
async def post_generate_inbox():
    return generate_xarxa_inbox_item(status="ready")


@router.post("/inbox/generate-case")
async def post_generate_case_from_random_email():
    return generate_xarxa_case_from_random_email()


@router.post("/inbox/{item_id}/process")
async def post_process_inbox(item_id: str):
    try:
        return process_xarxa_inbox_item(item_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/inbox/{item_id}/create-case")
async def post_create_case_from_inbox(item_id: str):
    try:
        return create_xarxa_case_from_inbox(item_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/professionals")
async def read_professionals():
    return {
        "professionals": list_xarxa_professionals(),
        "centers": list_xarxa_centers(),
        "roles": list_xarxa_roles(),
        "pendingApprovals": list_xarxa_professional_requests(),
    }


@router.post("/professionals/approvals/{request_id}/approve")
async def post_approve_professional(request_id: str, body: ApproveProfessionalRequest):
    try:
        item = approve_xarxa_professional_request(
            request_id=request_id,
            role_id=body.roleId,
            center_id=body.centerId,
        )
        return item
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.patch("/professionals/{professional_id}")
async def patch_professional(professional_id: str, body: UpdateProfessionalRequest):
    try:
        return update_xarxa_professional(
            professional_id=professional_id,
            role_id=body.roleId,
            center_id=body.centerId,
            status=body.status,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/agents")
async def read_agents():
    return {"items": list_xarxa_agents()}


@router.get("/programs")
async def read_programs():
    return {"items": list_xarxa_programs(), "forms": list_xarxa_forms()}


@router.post("/programs")
async def post_program(body: ProgramPayload):
    try:
        return create_xarxa_program(body.model_dump(exclude_none=True))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.patch("/programs/{program_id}")
async def patch_program(program_id: str, body: ProgramPayload):
    try:
        return update_xarxa_program(program_id, body.model_dump(exclude_none=True))
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/programs/{program_id}/publish")
async def post_publish_program(program_id: str):
    try:
        return publish_xarxa_program(program_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/roles")
async def read_roles():
    return {"items": list_xarxa_roles()}


@router.get("/sessions")
async def read_sessions():
    items = list_xarxa_sessions()
    return {"items": items, "total": len(items)}


@router.post("/sessions")
async def post_create_session(body: CreateSessionRequest):
    return create_xarxa_session(title=body.title, date=body.date)


@router.post("/sessions/{session_id}/start")
async def post_start_session(session_id: str):
    try:
        return update_xarxa_session_status(session_id, "live")
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/sessions/{session_id}/complete")
async def post_complete_session(session_id: str):
    try:
        return update_xarxa_session_status(session_id, "done")
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
