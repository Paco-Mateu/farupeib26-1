from __future__ import annotations

import copy
import hashlib
import json
import random
import re
from datetime import UTC, datetime, timedelta
from time import monotonic
from typing import Any

from backend.db.mongo import get_database
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

_professional_requests_seeded = False
_indexes_ready = False
_runtime_cache: dict[str, tuple[float, Any]] = {}

_CACHE_TTLS = {
    "cases": 5.0,
    "case": 5.0,
    "inbox": 5.0,
    "sessions": 8.0,
    "kpis": 8.0,
    "professionals": 20.0,
    "centers": 60.0,
    "requests": 20.0,
    "agents": 10.0,
    "programs": 30.0,
    "forms": 30.0,
    "roles": 60.0,
}

SYSTEM_ACTOR = {
    "name": "Sistema Xarxa PK/PD",
    "role": "Motor de workflow",
    "center": "Plataforma de demo",
    "type": "system",
}

DEFAULT_DEMO_ACTOR = {
    "name": "Farmacéutico referente",
    "role": "Farmacéutico experto",
    "center": "H.U. Bellvitge",
    "type": "human",
}

ALLOWED_STAGE_TRANSITIONS: dict[str, set[str]] = {
    "Solicitud recibida": {"Caso creado por IA", "Datos incompletos", "Pendiente de determinantes", "Determinantes recibidos"},
    "Caso creado por IA": {"Datos incompletos", "Pendiente de determinantes", "Determinantes recibidos"},
    "Datos incompletos": {"Pendiente de determinantes", "Determinantes recibidos", "Revisión farmacéutica"},
    "Pendiente de determinantes": {"Datos incompletos", "Determinantes recibidos", "Revisión farmacéutica"},
    "Determinantes recibidos": {"Datos incompletos", "Análisis PK/PD generado", "Revisión farmacéutica"},
    "Análisis PK/PD generado": {"Datos incompletos", "Revisión farmacéutica", "Revisión médica", "Discusión en red", "Informe generado"},
    "Revisión farmacéutica": {"Datos incompletos", "Revisión médica", "Discusión en red", "Informe generado"},
    "Revisión médica": {"Datos incompletos", "Discusión en red", "Informe generado"},
    "Discusión en red": {"Revisión farmacéutica", "Revisión médica", "Informe generado"},
    "Informe generado": {"Datos incompletos", "Informe validado", "Registrado en HCE"},
    "Informe validado": {"Registrado en HCE"},
    "Registrado en HCE": {"Seguimiento 4 semanas", "Seguimiento 8 semanas", "Cerrado con resultado"},
    "Seguimiento 4 semanas": {"Seguimiento 8 semanas", "Cerrado con resultado"},
    "Seguimiento 8 semanas": {"Cerrado con resultado"},
    "Cerrado con resultado": set(),
}


# ── helpers ──────────────────────────────────────────────────────────────────

def _col(name: str):
    return get_database()[name]


def _cache_key(prefix: str, payload: dict[str, Any] | None = None) -> str:
    encoded = json.dumps(_json_safe(payload or {}), sort_keys=True, ensure_ascii=False)
    return f"{prefix}:{encoded}"


def _cache_get(prefix: str, payload: dict[str, Any] | None = None) -> Any | None:
    key = _cache_key(prefix, payload)
    entry = _runtime_cache.get(key)
    if not entry:
        return None

    expires_at, value = entry
    if expires_at <= monotonic():
        _runtime_cache.pop(key, None)
        return None

    return copy.deepcopy(value)


def _cache_set(prefix: str, payload: dict[str, Any] | None, value: Any) -> Any:
    ttl = _CACHE_TTLS.get(prefix, 5.0)
    _runtime_cache[_cache_key(prefix, payload)] = (monotonic() + ttl, copy.deepcopy(value))
    return value


def _cache_invalidate(*prefixes: str) -> None:
    if not prefixes:
        _runtime_cache.clear()
        return

    for key in list(_runtime_cache.keys()):
        if any(key.startswith(f"{prefix}:") for prefix in prefixes):
            _runtime_cache.pop(key, None)


def _invalidate_case_related_cache(case_id: str | None = None) -> None:
    _cache_invalidate("cases", "case", "kpis", "agents", "sessions")


def _ensure_xarxa_indexes() -> None:
    global _indexes_ready
    if _indexes_ready:
        return

    db = get_database()
    db["xarxa_cases"].create_index("caseId", unique=True)
    db["xarxa_cases"].create_index([("updatedAt", -1)])
    db["xarxa_cases"].create_index([("createdAt", -1)])
    db["xarxa_cases"].create_index([("pipelineStage", 1), ("priority", 1)])
    db["xarxa_cases"].create_index([("centerId", 1), ("programId", 1), ("updatedAt", -1)])
    db["xarxa_cases"].create_index([("requesterId", 1)])
    db["xarxa_cases"].create_index([("assignedTo", 1)])

    db["xarxa_tasks"].create_index([("caseId", 1), ("taskId", 1)], unique=True)
    db["xarxa_events"].create_index([("caseId", 1), ("date", 1)])
    db["xarxa_recommendations"].create_index([("caseId", 1)], unique=True)
    db["xarxa_notes"].create_index([("caseId", 1)], unique=True)
    db["xarxa_followups"].create_index([("caseId", 1), ("label", 1)], unique=True)
    db["xarxa_agent_runs"].create_index([("caseId", 1), ("timestamp", -1)])
    db["xarxa_agent_runs"].create_index([("agent", 1), ("timestamp", -1)])
    db["xarxa_inbox_requests"].create_index([("receivedAt", -1)])
    db["xarxa_inbox_requests"].create_index([("agentStatus", 1), ("createdCaseId", 1)])
    db["xarxa_sessions"].create_index([("status", 1), ("date", 1)])
    db["xarxa_professionals"].create_index([("centerId", 1), ("roleId", 1), ("status", 1)])
    db["xarxa_programs"].create_index([("label", 1)])
    _indexes_ready = True


def _strip_mongo(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


def _json_safe(value: Any) -> Any:
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, list):
        return [_json_safe(item) for item in value]
    if isinstance(value, tuple):
        return [_json_safe(item) for item in value]
    if isinstance(value, dict):
        return {key: _json_safe(item) for key, item in value.items()}
    return str(value)


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def _case_query(case_id: str) -> dict[str, Any]:
    return {"$or": [{"caseId": case_id}, {"_id": case_id}]}


def _event_id(case_id: str) -> str:
    stamp = datetime.now(UTC).strftime("%Y%m%d%H%M%S%f")
    return f"{case_id}-evt-{stamp}"


def _next_sequence(name: str, start_from: int | None = None) -> int:
    seed_value = start_from if start_from is not None else 0
    counters = _col("xarxa_counters")
    if not counters.find_one({"_id": name}, {"_id": 1}):
        try:
            counters.insert_one({"_id": name, "value": seed_value})
        except DuplicateKeyError:
            pass

    result = counters.find_one_and_update(
        {"_id": name},
        {"$inc": {"value": 1}},
        return_document=ReturnDocument.AFTER,
        projection={"_id": 0, "value": 1},
    )
    return int(result["value"])


def _touch_case(case_id: str, fields: dict[str, Any] | None = None) -> dict:
    update_doc = {"updatedAt": _now_iso(), **(fields or {})}
    result = _col("xarxa_cases").find_one_and_update(
        _case_query(case_id),
        {"$set": update_doc},
        return_document=ReturnDocument.AFTER,
        projection={"_id": 0},
    )
    if not result:
        raise ValueError(f"Case not found: {case_id}")
    _invalidate_case_related_cache(case_id)
    return result


def _normalize_actor(actor: dict[str, Any] | None = None, fallback: dict[str, Any] | None = None) -> dict[str, Any]:
    base = fallback or SYSTEM_ACTOR
    payload = actor or {}
    return {
        "name": payload.get("name") or base["name"],
        "role": payload.get("role") or base["role"],
        "center": payload.get("center") or base["center"],
        "type": payload.get("type") or base.get("type", "system"),
    }


def _extract_actor(payload: dict[str, Any] | None = None, fallback: dict[str, Any] | None = None) -> dict[str, Any]:
    source = payload or {}
    actor = {
        "name": source.get("actorName"),
        "role": source.get("actorRole"),
        "center": source.get("actorCenter"),
        "type": source.get("actorType"),
    }
    return _normalize_actor(actor, fallback or DEFAULT_DEMO_ACTOR)


def _append_event(
    case_id: str,
    lane: str,
    event_type: str,
    label: str,
    actor: dict[str, Any] | None = None,
    meta: dict[str, Any] | None = None,
) -> None:
    normalized_actor = _normalize_actor(actor)
    _col("xarxa_events").insert_one(
        {
            "_id": _event_id(case_id),
            "caseId": case_id,
            "date": _now_iso(),
            "lane": lane,
            "type": event_type,
            "label": label,
            "actorName": normalized_actor["name"],
            "actorRole": normalized_actor["role"],
            "actorCenter": normalized_actor["center"],
            "actorType": normalized_actor["type"],
            "meta": meta or {},
        }
    )


def _validate_stage_transition(current_stage: str | None, next_stage: str | None) -> None:
    if not next_stage or not current_stage or current_stage == next_stage:
        return

    allowed_targets = ALLOWED_STAGE_TRANSITIONS.get(current_stage, set())
    if next_stage not in allowed_targets:
        raise ValueError(
            f"No se permite mover el caso de «{current_stage}» a «{next_stage}» sin una transición clínica válida."
        )


def _append_agent_run(case_id: str, agent: str, message: str, status: str = "Completado") -> None:
    _col("xarxa_agent_runs").insert_one(
        {
            "_id": f"{case_id.lower()}-{agent.lower().replace(' ', '-')}-{datetime.now(UTC).strftime('%Y%m%d%H%M%S%f')}",
            "caseId": case_id,
            "agent": agent,
            "status": status,
            "message": message,
            "timestamp": _now_iso(),
        }
    )


def _case_orchestration_signature(case: dict[str, Any]) -> str:
    relevant = {
        "clinicalSummary": case.get("clinicalSummary"),
        "patientProfile": case.get("patientProfile"),
        "diseaseContext": case.get("diseaseContext"),
        "therapyContext": case.get("therapyContext"),
        "labDeterminants": case.get("labDeterminants"),
        "gaps": case.get("gaps"),
        "tasks": [
            {
                "title": task.get("title"),
                "status": task.get("status"),
                "priority": task.get("priority"),
            }
            for task in case.get("tasks") or []
        ],
    }
    return hashlib.sha1(
        json.dumps(_json_safe(relevant), sort_keys=True, ensure_ascii=False).encode("utf-8")
    ).hexdigest()


def _upsert_singleton_case_doc(collection: str, case_id: str, prefix: str, payload: dict) -> None:
    safe_case_id = case_id.lower().replace("/", "-")
    existing = _col(collection).find_one({"caseId": case_id}, {"_id": 1})
    if existing:
        _col(collection).update_one({"_id": existing["_id"]}, {"$set": payload})
        return

    _col(collection).insert_one({"_id": f"{prefix}-{safe_case_id}", **payload})


def _build_automation_summary(case: dict, agent_runs: list[dict] | None = None) -> dict:
    runs = agent_runs or []
    unique_agents = []
    seen_agents: set[str] = set()
    for run in sorted(runs, key=lambda item: item.get("timestamp", ""), reverse=True):
        agent = run.get("agent")
        if not agent or agent in seen_agents:
            continue
        seen_agents.add(agent)
        unique_agents.append(agent)

    tasks = case.get("tasks") or []
    pending_tasks = [task for task in tasks if task.get("status") != "Resuelta"]
    recommendation = case.get("recommendation") or {}
    note = case.get("clinicalNote") or {}
    summary_text = case.get("clinicalSummary") or ""

    highlights: list[str] = []
    if summary_text.strip():
        highlights.append("Resumen clínico estructurado")
    if tasks:
        highlights.append(f"{len(tasks)} tareas automáticas creadas")
    if recommendation.get("text"):
        highlights.append("Borrador de recomendación preparado")
    if note.get("text"):
        highlights.append("Borrador de nota HCE preparado")
    if case.get("pkpdInterpretation", {}).get("summary"):
        highlights.append("Paquete de análisis PK/PD disponible")
    if not highlights:
        highlights.append("Caso estructurado y listo para revisión humana")

    drafts_ready = 0
    if summary_text.strip():
        drafts_ready += 1
    if recommendation.get("text"):
        drafts_ready += 1
    if note.get("text"):
        drafts_ready += 1

    if pending_tasks:
        headline = (
            "La IA ya ha preparado el caso y ha detectado qué falta antes de validar."
        )
    elif recommendation.get("text") or note.get("text"):
        headline = "La IA ya ha dejado un paquete casi listo para validación profesional."
    else:
        headline = "La IA ya ha estructurado el caso para acelerar la revisión clínica."

    return {
        "headline": headline,
        "stepsCompleted": max(len(unique_agents), drafts_ready),
        "tasksCreated": len(tasks),
        "pendingTasks": len(pending_tasks),
        "draftsReady": drafts_ready,
        "highlights": highlights[:4],
        "agentsInvolved": unique_agents,
        "lastRunAt": runs[0].get("timestamp") if runs else None,
        "hasRecommendationDraft": bool(recommendation.get("text")),
        "hasNoteDraft": bool(note.get("text")),
    }


def _derive_gaps(data: dict) -> list[dict]:
    patient = data.get("patientProfile") or {}
    therapy = data.get("therapyContext") or {}
    determinants = data.get("labDeterminants") or []

    gaps: list[dict] = []

    if not patient.get("weightKg"):
        gaps.append(
            {
                "label": "Falta peso actualizado para contextualizar la revisión PK/PD",
                "severity": "Importante",
                "status": "Pendiente",
            }
        )

    if not therapy.get("currentDrug"):
        gaps.append(
            {
                "label": "Falta registrar el fármaco actual o candidato terapéutico",
                "severity": "Crítico",
                "status": "Pendiente",
            }
        )

    if len(determinants) == 0:
        gaps.append(
            {
                "label": "Falta al menos un determinante PK/PD para iniciar la revisión",
                "severity": "Crítico",
                "status": "Pendiente",
            }
        )
    elif not any(det.get("relationToDose") for det in determinants):
        gaps.append(
            {
                "label": "No consta la relación temporal entre muestra y dosis",
                "severity": "Importante",
                "status": "Pendiente",
            }
        )

    if not data.get("clinicalContext"):
        gaps.append(
            {
                "label": "Falta resumir el motivo clínico de la consulta",
                "severity": "Informativo",
                "status": "Pendiente",
            }
        )

    return gaps


def _derive_tasks(case_id: str, gaps: list[dict]) -> list[dict]:
    tasks: list[dict] = []

    for index, gap in enumerate(gaps, start=1):
        tasks.append(
            {
                "_id": f"{case_id}-tsk-{index:02d}",
                "taskId": f"{case_id}-TSK-{index:02d}",
                "caseId": case_id,
                "title": gap["label"],
                "ownerRole": "Farmacia hospitalaria" if gap["severity"] == "Crítico" else "Equipo local",
                "priority": "Alta" if gap["severity"] == "Crítico" else "Media",
                "status": "Pendiente",
                "dueDate": _now_iso().split("T")[0],
                "createdBy": "Agente de gaps",
            }
        )

    return tasks


def _derive_case_state(stage: str | None, tasks: list[dict], fallback_next_action: str | None = None) -> tuple[str, str]:
    unresolved = [task for task in tasks if task.get("status") != "Resuelta"]
    protected_stages = {
        "Análisis PK/PD generado",
        "Revisión farmacéutica",
        "Revisión médica",
        "Discusión en red",
        "Informe generado",
        "Informe validado",
        "Registrado en HCE",
        "Seguimiento 4 semanas",
        "Seguimiento 8 semanas",
        "Cerrado con resultado",
    }

    if unresolved and stage not in protected_stages:
        return "Datos incompletos", unresolved[0]["title"]

    if unresolved and stage in protected_stages:
        return stage or "Revisión farmacéutica", "Resolver gaps detectados antes de continuar la validación"

    if not unresolved and stage in {"Solicitud recibida", "Caso creado por IA", "Datos incompletos", "Pendiente de determinantes"}:
        return "Determinantes recibidos", "Revisión farmacéutica"

    return stage or "Solicitud recibida", fallback_next_action or (unresolved[0]["title"] if unresolved else "Revisión farmacéutica")


def _sync_case_tasks(case_id: str, gaps: list[dict]) -> list[dict]:
    tasks_col = _col("xarxa_tasks")
    existing_tasks = list(tasks_col.find({"caseId": case_id}))
    existing_by_title = {task.get("title"): task for task in existing_tasks}
    gap_titles = {gap["label"] for gap in gaps}

    for task in existing_tasks:
        if task.get("title") not in gap_titles:
            tasks_col.delete_one({"_id": task["_id"]})

    synced: list[dict] = []
    for index, gap in enumerate(gaps, start=1):
        existing = existing_by_title.get(gap["label"])
        task_id = existing.get("taskId") if existing else f"{case_id}-TSK-{index:02d}"
        mongo_id = existing.get("_id") if existing else f"{case_id}-tsk-{index:02d}"
        status = existing.get("status", "Pendiente") if existing else "Pendiente"
        if status == "Resuelta":
            status = "Pendiente"

        payload = {
            "caseId": case_id,
            "taskId": task_id,
            "title": gap["label"],
            "ownerRole": existing.get("ownerRole") if existing and existing.get("ownerRole") else ("Farmacia hospitalaria" if gap["severity"] == "Crítico" else "Equipo local"),
            "ownerId": existing.get("ownerId") if existing else None,
            "priority": "Alta" if gap["severity"] == "Crítico" else "Media",
            "status": status,
            "dueDate": existing.get("dueDate") if existing and existing.get("dueDate") else _now_iso().split("T")[0],
            "createdBy": existing.get("createdBy") if existing and existing.get("createdBy") else "Agente de gaps",
            "updatedAt": _now_iso(),
        }

        tasks_col.update_one({"_id": mongo_id}, {"$set": payload}, upsert=True)
        synced.append({"_id": mongo_id, **payload})

    return synced


def _recompute_case_state(case_id: str, stage_override: str | None = None, next_action_override: str | None = None) -> dict:
    case_doc = _col("xarxa_cases").find_one(_case_query(case_id))
    if not case_doc:
        raise ValueError(f"Case not found: {case_id}")

    derived_gaps = _derive_gaps(
        {
            "patientProfile": case_doc.get("patientProfile") or {},
            "therapyContext": case_doc.get("therapyContext") or {},
            "labDeterminants": case_doc.get("labDeterminants") or [],
            "clinicalContext": case_doc.get("clinicalSummary") or "",
        }
    )
    synced_tasks = _sync_case_tasks(case_doc["caseId"], derived_gaps)
    stage, next_action = _derive_case_state(
        stage_override or case_doc.get("pipelineStage"),
        [{key: value for key, value in task.items() if key != "_id"} for task in synced_tasks],
        next_action_override or case_doc.get("nextAction"),
    )
    case_update = {
        "gaps": derived_gaps,
        "tasks": [{key: value for key, value in task.items() if key != "_id"} for task in synced_tasks],
        "pipelineStage": stage,
        "nextAction": next_action,
        "updatedAt": _now_iso(),
    }
    _col("xarxa_cases").update_one(_case_query(case_id), {"$set": case_update})
    _invalidate_case_related_cache(case_id)
    return get_xarxa_case(case_id)


def _parse_first_number(value: str | None) -> float | None:
    if not value:
        return None
    match = re.search(r"(\d+(?:[.,]\d+)?)", value)
    if not match:
        return None
    return float(match.group(1).replace(",", "."))


def _within_last_days(timestamp: str | None, days: int | None) -> bool:
    if not timestamp or not days:
        return True
    try:
        current = datetime.now(UTC)
        value = datetime.fromisoformat(timestamp)
        return value >= current - timedelta(days=days)
    except ValueError:
        return True


def _build_inbox_steps(status: str) -> list[dict[str, str]]:
    labels = [
        "Leyendo solicitud",
        "Identificando programa clínico",
        "Extrayendo datos del caso",
        "Detectando gaps",
        "Caso preparado para revisión",
    ]
    if status in {"ready", "created"}:
        return [{"label": label, "status": "done"} for label in labels]
    if status == "processing":
        return [
            {"label": labels[0], "status": "done"},
            {"label": labels[1], "status": "done"},
            {"label": labels[2], "status": "running"},
            {"label": labels[3], "status": "pending"},
            {"label": labels[4], "status": "pending"},
        ]
    if status == "error":
        return [
            {"label": labels[0], "status": "done"},
            {"label": labels[1], "status": "done"},
            {"label": labels[2], "status": "done"},
            {"label": labels[3], "status": "running"},
            {"label": labels[4], "status": "pending"},
        ]
    return [{"label": label, "status": "pending"} for label in labels]


_INBOX_EMAIL_TEMPLATES: list[dict[str, Any]] = [
    {
        "subject": "Consulta PK/PD — Infliximab con sospecha de pérdida de respuesta",
        "caseTypeSuggestion": "Pérdida de respuesta",
        "priority": "Alta",
        "extraction": {
            "drug": "Infliximab",
            "indication": "Enfermedad de Crohn ileocolónica",
            "weight": "74 kg",
            "recentDose": "Última dosis hace 8 semanas",
            "levelResult": "1.8 µg/mL",
            "requestType": "Optimización posológica",
            "currentDose": "5 mg/kg",
            "interval": "Cada 8 semanas",
            "route": "Intravenosa",
            "crp": "18 mg/L",
            "calprotectin": "420 µg/g",
            "antibodies": "Positivos a título bajo",
            "phenotype": "A2L3B1",
            "activity": "Brote moderado",
            "sex": "Varón",
            "age": 34,
        },
        "detectedGaps": [
            "Confirmar que la muestra corresponde a nivel valle.",
            "Validar fecha y hora exactas de la última administración.",
        ],
        "body_template": """Buenos días,

Solicito valoración PK/PD para paciente {patient_code} con {indication} ({phenotype}) en tratamiento con {drug} {currentDose} {route} {interval}.

Última administración: {recentDose}. Determinación disponible: {levelResult}. Anticuerpos anti-fármaco: {antibodies}. PCR: {crp}. Calprotectina: {calprotectin}. Actividad clínica actual: {activity}.

Necesitamos ayuda para decidir si procede optimización o cambio de estrategia.

Gracias,
{requester_name}""",
    },
    {
        "subject": "Adalimumab con nivel indetectable y brote moderado",
        "caseTypeSuggestion": "Pérdida de respuesta",
        "priority": "Alta",
        "extraction": {
            "drug": "Adalimumab",
            "indication": "Enfermedad de Crohn colónica",
            "weight": "62 kg",
            "recentDose": "Última dosis hace 12 días",
            "levelResult": "<1 µg/mL",
            "requestType": "Intensificación",
            "currentDose": "40 mg",
            "interval": "Cada 14 días",
            "route": "Subcutánea",
            "crp": "22 mg/L",
            "calprotectin": "510 µg/g",
            "antibodies": "No detectables",
            "phenotype": "A2L2B1",
            "activity": "Brote moderado",
            "sex": "Mujer",
            "age": 28,
        },
        "detectedGaps": [
            "Falta confirmar adherencia referida en las últimas 8 semanas.",
            "No consta albúmina reciente para contextualizar la exposición.",
        ],
        "body_template": """Hola equipo,

Os enviamos una consulta de {drug} para paciente {patient_code} con {indication}. Pauta actual: {currentDose} {route} {interval}. La última dosis fue {recentDose}.

El nivel obtenido es {levelResult}, con anticuerpos {antibodies}. PCR {crp} y calprotectina {calprotectin}. La actividad clínica se describe como {activity}.

¿Consideráis adecuada una intensificación o conviene repetir determinantes?

Un saludo,
{requester_name}""",
    },
    {
        "subject": "Ustekinumab con respuesta parcial y dudas de interpretabilidad",
        "caseTypeSuggestion": "Seguimiento",
        "priority": "Media",
        "extraction": {
            "drug": "Ustekinumab",
            "indication": "Enfermedad de Crohn",
            "weight": "81 kg",
            "recentDose": "Última dosis hace 11 semanas",
            "levelResult": "4.2 µg/mL",
            "requestType": "Seguimiento terapéutico",
            "currentDose": "90 mg",
            "interval": "Cada 12 semanas",
            "route": "Subcutánea",
            "crp": "9 mg/L",
            "calprotectin": "290 µg/g",
            "antibodies": "No aplica",
            "phenotype": "A3L3B1",
            "activity": "Respuesta parcial",
            "sex": "Varón",
            "age": 41,
        },
        "detectedGaps": [
            "Falta confirmar el objetivo clínico del seguimiento actual.",
        ],
        "body_template": """Buenas tardes,

Comparto caso {patient_code} con {indication} en tratamiento con {drug} {currentDose} {route} {interval}. Se ha recibido una determinación de {levelResult} con {activity}.

PCR: {crp}. Calprotectina: {calprotectin}. Nos gustaría revisar si el caso es interpretable con los datos actuales o si conviene completar información antes de proponer cambios.

Gracias,
{requester_name}""",
    },
    {
        "subject": "Vedolizumab con actividad persistente pese a exposición aparente",
        "caseTypeSuggestion": "Cambio de medicación",
        "priority": "Alta",
        "extraction": {
            "drug": "Vedolizumab",
            "indication": "Enfermedad de Crohn",
            "weight": "69 kg",
            "recentDose": "Última infusión hace 6 semanas",
            "levelResult": "12.4 µg/mL",
            "requestType": "Posible fallo farmacodinámico",
            "currentDose": "300 mg",
            "interval": "Cada 8 semanas",
            "route": "Intravenosa",
            "crp": "24 mg/L",
            "calprotectin": "610 µg/g",
            "antibodies": "No disponibles",
            "phenotype": "A2L3B2",
            "activity": "Actividad inflamatoria persistente",
            "sex": "Mujer",
            "age": 37,
        },
        "detectedGaps": [
            "Faltan hallazgos endoscópicos recientes para correlacionar con la actividad.",
            "Confirmar si existe corticoide concomitante al inicio del brote.",
        ],
        "body_template": """Equipo,

Necesitamos una segunda valoración para paciente {patient_code} con {indication}. Está con {drug} {currentDose} {route} {interval}; la última administración fue {recentDose}.

Tenemos exposición {levelResult}, PCR {crp} y calprotectina {calprotectin}, pero mantiene {activity}. Dudamos entre fallo farmacodinámico y necesidad de completar datos de actividad.

Quedamos pendientes de vuestra revisión.

{requester_name}""",
    },
]


def _resolve_inbox_requester() -> tuple[dict[str, Any], dict[str, Any]]:
    professionals = list(
        _col("xarxa_professionals").find(
            {"roleLabel": {"$in": ["Digestólogo", "Enfermería EII", "Farmacéutico experto"]}}
        )
    )
    if not professionals:
        professionals = list(_col("xarxa_professionals").find({}).limit(20))
    if not professionals:
        raise ValueError("No hay profesionales disponibles para generar solicitudes de inbox.")

    requester = random.choice(professionals)
    center = _col("xarxa_centers").find_one({"_id": requester.get("centerId")}) or {
        "_id": requester.get("centerId", "ctr-demo"),
        "name": "Centro no configurado",
    }
    return requester, center


def _build_inbox_item(template: dict[str, Any], status: str = "ready") -> dict[str, Any]:
    inbox_sequence = _next_sequence("inbox", start_from=_col("xarxa_inbox_requests").count_documents({}))
    patient_seed = _col("xarxa_cases").count_documents({}) + inbox_sequence + 1048
    patient_code = f"P-{patient_seed}"
    requester, center = _resolve_inbox_requester()
    extraction = {
        "patientCode": patient_code,
        **template["extraction"],
    }
    body = template["body_template"].format(
        patient_code=patient_code,
        requester_name=requester["name"],
        **extraction,
    )
    received_at = _now_iso()
    return {
        "_id": f"inbox-{inbox_sequence:04d}",
        "from": f"{requester['name'].lower().replace(' ', '.')}@demo-xarxa.cat".replace("..", "."),
        "subject": template["subject"],
        "receivedAt": received_at,
        "body": body,
        "agentStatus": status,
        "agentSteps": _build_inbox_steps(status),
        "programSuggestion": "Crohn PK/PD",
        "caseTypeSuggestion": template["caseTypeSuggestion"],
        "confidence": random.randint(78, 96),
        "detectedGaps": template.get("detectedGaps", []),
        "centerId": center["_id"],
        "centerName": center["name"],
        "requesterId": requester["_id"],
        "requesterName": requester["name"],
        "createdCaseId": None,
        "extraction": extraction,
        "priority": template.get("priority", "Media"),
    }


def _seed_xarxa_inbox_if_empty() -> None:
    if _col("xarxa_inbox_requests").count_documents({}) > 0:
        return
    defaults = [
        (_INBOX_EMAIL_TEMPLATES[2], "pending"),
        (_INBOX_EMAIL_TEMPLATES[1], "processing"),
        (_INBOX_EMAIL_TEMPLATES[0], "ready"),
    ]
    for template, status in defaults:
        _col("xarxa_inbox_requests").insert_one(_build_inbox_item(template, status))


def _gaps_from_inbox_item(item: dict[str, Any]) -> list[dict[str, str]]:
    gaps: list[dict[str, str]] = []
    for label in item.get("detectedGaps", []):
        severity = "Crítico" if "valle" in label.lower() else "Importante"
        gaps.append({"label": label, "severity": severity, "status": "Pendiente"})
    return gaps


def _agent_runs_from_inbox(item: dict[str, Any]) -> list[dict[str, str]]:
    timestamp = _now_iso()
    gaps = item.get("detectedGaps") or []
    return [
        {
            "agent": "Agente de ingesta",
            "status": "Completado",
            "message": "Correo estructurado y transformado en borrador de caso.",
            "timestamp": timestamp,
        },
        {
            "agent": "Agente de gaps",
            "status": "Completado",
            "message": f"Detectados {len(gaps)} gaps que requieren revisión humana."
            if gaps
            else "No se han detectado gaps críticos en la solicitud inicial.",
            "timestamp": timestamp,
        },
    ]


# ── cases ─────────────────────────────────────────────────────────────────────

def list_xarxa_cases(
    stage: str | None = None,
    priority: str | None = None,
    center: str | None = None,
    program: str | None = None,
    search: str | None = None,
    days: int | None = None,
) -> list[dict]:
    _ensure_xarxa_indexes()
    cache_payload = {
        "stage": stage,
        "priority": priority,
        "center": center,
        "program": program,
        "search": search,
        "days": days,
    }
    cached = _cache_get("cases", cache_payload)
    if cached is not None:
        return cached

    query: dict[str, Any] = {}
    if stage:
        query["pipelineStage"] = stage
    if priority:
        query["priority"] = priority
    if center:
        query["centerId"] = center
    if program:
        query["programId"] = program
    if search:
        query["$or"] = [
            {"caseId": {"$regex": search, "$options": "i"}},
            {"title": {"$regex": search, "$options": "i"}},
            {"patientCode": {"$regex": search, "$options": "i"}},
            {"centerName": {"$regex": search, "$options": "i"}},
            {"requesterName": {"$regex": search, "$options": "i"}},
            {"caseType": {"$regex": search, "$options": "i"}},
            {"pipelineStage": {"$regex": search, "$options": "i"}},
        ]

    projection = {
        "_id": 0,
        "caseId": 1,
        "title": 1,
        "patientCode": 1,
        "programId": 1,
        "specialty": 1,
        "centerId": 1,
        "centerName": 1,
        "requesterId": 1,
        "requesterName": 1,
        "assignedTo": 1,
        "assignedName": 1,
        "caseType": 1,
        "entrySource": 1,
        "priority": 1,
        "pipelineStage": 1,
        "nextAction": 1,
        "createdAt": 1,
        "updatedAt": 1,
        "gaps": 1,
        "tasks": 1,
    }
    docs = list(_col("xarxa_cases").find(query, projection).sort("updatedAt", -1))
    if days:
        docs = [doc for doc in docs if _within_last_days(doc.get("updatedAt") or doc.get("createdAt"), days)]

    case_ids = [doc.get("caseId") for doc in docs if doc.get("caseId")]
    runs_by_case: dict[str, list[dict]] = {}
    if case_ids:
        for run in _col("xarxa_agent_runs").find(
            {"caseId": {"$in": case_ids}},
            {"_id": 0, "caseId": 1, "agent": 1, "status": 1, "message": 1, "timestamp": 1},
        ).sort("timestamp", -1):
            runs_by_case.setdefault(run["caseId"], []).append(run)

    for doc in docs:
        doc["automationSummary"] = _build_automation_summary(
            doc,
            runs_by_case.get(doc.get("caseId", ""), []),
        )
    return _cache_set("cases", cache_payload, docs)


def create_xarxa_case(data: dict) -> dict:
    _ensure_xarxa_indexes()
    col = _col("xarxa_cases")
    sequence = _next_sequence("case", start_from=col.count_documents({}))
    case_id = f"PKPD-{datetime.now(UTC).year}-{sequence:04d}"
    drug_hint = re.search(r"(infliximab|adalimumab|ustekinumab|vedolizumab)", data.get("clinicalContext", ""), re.I)
    drug_str = f" — {drug_hint.group(0).capitalize()}" if drug_hint else ""
    title = data.get("title") or f"{data.get('caseType', 'Consulta PK/PD')}{drug_str}"
    now = _now_iso()
    gaps = data.get("gaps") or _derive_gaps(data)
    tasks = _derive_tasks(case_id, gaps)
    agent_runs = [
        {"caseId": case_id, **run}
        for run in (data.get("agentRuns") or [])
    ]
    next_action = data.get("nextAction")
    if not next_action:
        next_action = tasks[0]["title"] if tasks else "Revisión farmacéutica"

    doc = {
        "_id": f"case-{sequence:04d}",
        "caseId": case_id,
        "title": title,
        "patientCode": data["patientCode"],
        "programId": data.get("programId", "prog-crohn"),
        "specialty": data.get("specialty", "Digestivo"),
        "centerId": data["centerId"],
        "centerName": data["centerName"],
        "requesterId": data.get("requesterId", "ext"),
        "requesterName": data.get("requesterName", "No indicado"),
        "assignedTo": "",
        "assignedName": "Sin asignar",
        "caseType": data["caseType"],
        "entrySource": data.get("entrySource", "Formulario web"),
        "priority": data.get("priority", "Media"),
        "pipelineStage": data.get("pipelineStage", "Solicitud recibida"),
        "nextAction": next_action,
        "createdAt": now,
        "updatedAt": now,
        "gaps": gaps,
        "tasks": [
            {key: value for key, value in task.items() if key != "_id"} for task in tasks
        ],
        "emailOriginal": data.get("emailOriginal"),
        "clinicalSummary": data.get("clinicalContext", ""),
        "patientProfile": data.get("patientProfile", {}),
        "diseaseContext": data.get("diseaseContext", {}),
        "therapyContext": data.get("therapyContext", {}),
        "labDeterminants": data.get("labDeterminants", []),
        "timeline": data.get("timeline", []),
        "pkpdInterpretation": data.get("pkpdInterpretation", {"pattern": "", "confidence": "", "summary": ""}),
        "recommendation": data.get("recommendation", {"status": "Borrador IA", "text": ""}),
        "clinicalNote": data.get("clinicalNote", {"status": "Borrador", "text": ""}),
        "followUps": [],
        "agentRuns": agent_runs,
    }
    col.insert_one({**doc})

    if tasks:
        _col("xarxa_tasks").insert_many(tasks)
    if agent_runs:
        _col("xarxa_agent_runs").insert_many(agent_runs)

    _col("xarxa_events").insert_one(
        {
            "_id": f"{case_id}-evt-01",
            "caseId": case_id,
            "date": now,
            "lane": data.get("creationLane", "Decisiones"),
            "type": data.get("creationType", "Solicitud"),
            "label": data.get("creationEventLabel", "Caso creado desde el asistente de alta estructurada"),
            "actorName": data.get("requesterName") or DEFAULT_DEMO_ACTOR["name"],
            "actorRole": data.get("requesterRole") or "Profesional solicitante",
            "actorCenter": data.get("centerName") or DEFAULT_DEMO_ACTOR["center"],
            "actorType": "human",
            "meta": {},
        }
    )

    doc.pop("_id", None)
    doc["automationSummary"] = _build_automation_summary(doc, agent_runs)
    _invalidate_case_related_cache(case_id)
    _cache_invalidate("inbox")
    return _json_safe(doc)


def get_xarxa_case(case_id: str) -> dict:
    _ensure_xarxa_indexes()
    cached = _cache_get("case", {"caseId": case_id})
    if cached is not None:
        return cached

    # Accept both caseId ("PKPD-2026-0002") and _id ("case-0002")
    doc = _col("xarxa_cases").find_one(_case_query(case_id), {"_id": 0})
    if not doc:
        raise ValueError(f"Case not found: {case_id}")

    cid = doc["caseId"]

    # Enrich with related collections
    doc["tasks"] = list(_col("xarxa_tasks").find({"caseId": cid}, {"_id": 0}))
    doc["timeline"] = list(
        _col("xarxa_events").find({"caseId": cid}, {"_id": 0}).sort("date", 1)
    )
    rec = _col("xarxa_recommendations").find_one({"caseId": cid}, {"_id": 0})
    doc["recommendation"] = rec or doc.get("recommendation", {})
    note = _col("xarxa_notes").find_one({"caseId": cid}, {"_id": 0})
    doc["clinicalNote"] = note or doc.get("clinicalNote", {})
    doc["followUps"] = list(_col("xarxa_followups").find({"caseId": cid}, {"_id": 0}))
    doc["agentRuns"] = list(
        _col("xarxa_agent_runs").find({"caseId": cid}, {"_id": 0}).sort("timestamp", -1)
    )
    doc["automationSummary"] = _build_automation_summary(doc, doc["agentRuns"])
    return _cache_set("case", {"caseId": case_id}, doc)


def list_xarxa_inbox() -> list[dict]:
    _ensure_xarxa_indexes()
    cached = _cache_get("inbox", {})
    if cached is not None:
        return cached
    _seed_xarxa_inbox_if_empty()
    items = list(
        _col("xarxa_inbox_requests")
        .find({}, {"_id": 1, "from": 1, "subject": 1, "receivedAt": 1, "body": 1, "agentStatus": 1, "agentSteps": 1, "programSuggestion": 1, "caseTypeSuggestion": 1, "confidence": 1, "detectedGaps": 1, "centerId": 1, "centerName": 1, "requesterId": 1, "requesterName": 1, "createdCaseId": 1, "extraction": 1, "priority": 1})
        .sort("receivedAt", -1)
    )
    return _cache_set("inbox", {}, items)


def generate_xarxa_inbox_item(status: str = "ready") -> dict:
    _ensure_xarxa_indexes()
    template = random.choice(_INBOX_EMAIL_TEMPLATES)
    item = _build_inbox_item(template, status=status)
    _col("xarxa_inbox_requests").insert_one(item)
    _cache_invalidate("inbox")
    return item


def process_xarxa_inbox_item(item_id: str) -> dict:
    _ensure_xarxa_indexes()
    item = _col("xarxa_inbox_requests").find_one({"_id": item_id})
    if not item:
        raise ValueError(f"Inbox item not found: {item_id}")
    if item.get("agentStatus") in {"ready", "created"}:
        return item

    processed = _col("xarxa_inbox_requests").find_one_and_update(
        {"_id": item_id},
        {
            "$set": {
                "agentStatus": "ready",
                "agentSteps": _build_inbox_steps("ready"),
                "processedAt": _now_iso(),
                "confidence": item.get("confidence") or random.randint(80, 96),
            }
        },
        return_document=ReturnDocument.AFTER,
    )
    if not processed:
        raise ValueError(f"Inbox item not found: {item_id}")
    _cache_invalidate("inbox")
    return processed


def create_xarxa_case_from_inbox(item_id: str) -> dict:
    _ensure_xarxa_indexes()
    item = _col("xarxa_inbox_requests").find_one({"_id": item_id})
    if not item:
        raise ValueError(f"Inbox item not found: {item_id}")

    if item.get("createdCaseId"):
        return _json_safe({"item": item, "case": get_xarxa_case(item["createdCaseId"])})

    if item.get("agentStatus") not in {"ready", "created"}:
        item = process_xarxa_inbox_item(item_id)

    extraction = item.get("extraction") or {}
    if not extraction:
        raise ValueError("La solicitud no tiene extracción estructurada disponible.")

    gaps = _gaps_from_inbox_item(item)
    stage = "Datos incompletos" if gaps else "Caso creado por IA"
    next_action = gaps[0]["label"] if gaps else "Validar extracción IA y asignar revisión farmacéutica"
    case = create_xarxa_case(
        {
            "title": f"{item.get('caseTypeSuggestion', 'Consulta PK/PD')} con {extraction.get('drug', 'fármaco biológico')}",
            "patientCode": extraction.get("patientCode", f"P-{random.randint(1000, 9999)}"),
            "requesterId": item.get("requesterId"),
            "requesterName": item.get("requesterName", "Solicitante externo"),
            "centerName": item.get("centerName", "Centro no indicado"),
            "centerId": item.get("centerId", "ctr-demo"),
            "specialty": "Digestivo",
            "caseType": item.get("caseTypeSuggestion", extraction.get("requestType", "Consulta PK/PD")),
            "priority": item.get("priority", "Media"),
            "entrySource": "Email",
            "clinicalContext": item.get("body", ""),
            "programId": "prog-crohn",
            "pipelineStage": stage,
            "nextAction": next_action,
            "patientProfile": {
                "age": extraction.get("age"),
                "sex": extraction.get("sex"),
                "weightKg": _parse_first_number(extraction.get("weight")),
            },
            "diseaseContext": {
                "indication": extraction.get("indication", ""),
                "phenotype": extraction.get("phenotype", ""),
                "activity": extraction.get("activity", ""),
            },
            "therapyContext": {
                "currentDrug": extraction.get("drug"),
                "currentDose": extraction.get("currentDose"),
                "interval": extraction.get("interval"),
                "route": extraction.get("route"),
                "lastAdministration": extraction.get("recentDose"),
            },
            "labDeterminants": [
                {
                    "label": f"Concentración sérica de {extraction.get('drug', 'fármaco')}",
                    "value": extraction.get("levelResult"),
                    "unit": None,
                    "status": "Extraído por IA",
                    "source": "Email",
                    "relationToDose": "Pendiente de confirmar valle",
                    "interpretation": "Pendiente de validar",
                },
                {
                    "label": "PCR",
                    "value": extraction.get("crp"),
                    "unit": None,
                    "status": "Extraído por IA",
                    "source": "Email",
                    "relationToDose": None,
                    "interpretation": None,
                },
                {
                    "label": "Calprotectina fecal",
                    "value": extraction.get("calprotectin"),
                    "unit": None,
                    "status": "Extraído por IA",
                    "source": "Email",
                    "relationToDose": None,
                    "interpretation": None,
                },
                {
                    "label": "Anticuerpos anti-fármaco",
                    "value": extraction.get("antibodies"),
                    "unit": None,
                    "status": "Extraído por IA",
                    "source": "Email",
                    "relationToDose": None,
                    "interpretation": None,
                },
            ],
            "gaps": gaps,
            "pkpdInterpretation": {
                "pattern": "Datos preliminares extraídos por IA",
                "confidence": "Media",
                "summary": "El caso se ha estructurado desde el correo y requiere validación humana antes de emitir interpretación PK/PD.",
            },
            "recommendation": {
                "status": "Borrador IA",
                "text": "Pendiente de revisión farmacéutica tras confirmar determinantes y temporalidad de la muestra.",
            },
            "clinicalNote": {
                "status": "Borrador",
                "text": "",
            },
            "emailOriginal": item.get("body", ""),
            "agentRuns": _agent_runs_from_inbox(item),
            "creationEventLabel": "Caso creado desde Bandeja IA tras revisar solicitud por email",
        }
    )

    updated_item = _col("xarxa_inbox_requests").find_one_and_update(
        {"_id": item_id},
        {
            "$set": {
                "agentStatus": "created",
                "agentSteps": _build_inbox_steps("created"),
                "createdCaseId": case["caseId"],
                "createdAtCase": _now_iso(),
            }
        },
        return_document=ReturnDocument.AFTER,
    )
    _cache_invalidate("inbox")
    return _json_safe({"item": updated_item, "case": case})


def generate_xarxa_case_from_random_email() -> dict:
    _ensure_xarxa_indexes()
    item = generate_xarxa_inbox_item(status="ready")
    return create_xarxa_case_from_inbox(item["_id"])


def _seed_xarxa_sessions_if_empty() -> None:
    sessions = _col("xarxa_sessions")
    if sessions.count_documents({}) > 0:
        return

    now = datetime.now(UTC)
    scheduled_date = (now + timedelta(days=3)).replace(hour=10, minute=0, second=0, microsecond=0)
    done_date = (now - timedelta(days=10)).replace(hour=11, minute=0, second=0, microsecond=0)
    sessions.insert_many(
        [
            {
                "_id": "ses-proxima-red",
                "title": "Sesión de red Crohn PK/PD",
                "date": scheduled_date.isoformat(),
                "duration": "60 min",
                "participants": ["Hospital Universitario de Bellvitge"],
                "casesCount": 0,
                "status": "scheduled",
                "caseIds": [],
                "minutes": "",
            },
            {
                "_id": "ses-anterior-red",
                "title": "Sesión de red Crohn PK/PD — cierre anterior",
                "date": done_date.isoformat(),
                "duration": "75 min",
                "participants": ["Hospital Universitario de Bellvitge", "Hospital de Viladecans"],
                "casesCount": 2,
                "status": "done",
                "caseIds": [],
                "minutes": "Acta sintética disponible en entorno demo.",
            },
        ]
    )


def _attach_case_to_next_session(case_id: str) -> dict:
    _seed_xarxa_sessions_if_empty()
    session = _col("xarxa_sessions").find_one({"status": {"$in": ["scheduled", "live"]}}, sort=[("date", 1)])
    if not session:
        raise ValueError("No hay ninguna sesión de red programada. Crea una sesión antes de enviar casos a discusión.")

    case = _col("xarxa_cases").find_one(_case_query(case_id), {"caseId": 1, "title": 1, "centerName": 1})
    if not case:
        raise ValueError(f"Case not found: {case_id}")

    case_ids = list(dict.fromkeys([*(session.get("caseIds") or []), case["caseId"]]))
    participants = list(dict.fromkeys([*(session.get("participants") or []), case.get("centerName", "Centro no indicado")]))
    _col("xarxa_sessions").update_one(
        {"_id": session["_id"]},
        {
            "$set": {
                "caseIds": case_ids,
                "casesCount": len(case_ids),
                "participants": participants,
                "updatedAt": _now_iso(),
            }
        },
    )
    return list_xarxa_sessions()[0]


def list_xarxa_sessions() -> list[dict]:
    _ensure_xarxa_indexes()
    cached = _cache_get("sessions", {})
    if cached is not None:
        return cached
    _seed_xarxa_sessions_if_empty()
    sessions = list(_col("xarxa_sessions").find({}))
    cases_by_id = {
        case["caseId"]: case
        for case in _col("xarxa_cases").find({}, {"_id": 0, "caseId": 1, "title": 1, "centerName": 1, "priority": 1, "pipelineStage": 1})
    }
    for session in sessions:
        session["sessionId"] = session.pop("_id")
        session["cases"] = [cases_by_id[case_id] for case_id in session.get("caseIds", []) if case_id in cases_by_id]
        session["casesCount"] = len(session.get("caseIds", []))
    status_order = {"live": 0, "scheduled": 1, "done": 2}
    sessions.sort(key=lambda session: (status_order.get(session.get("status"), 9), session.get("date", "")))
    return _cache_set("sessions", {}, sessions)


def create_xarxa_session(title: str | None = None, date: str | None = None) -> dict:
    _ensure_xarxa_indexes()
    _seed_xarxa_sessions_if_empty()
    sequence = _next_sequence("session", start_from=_col("xarxa_sessions").count_documents({}))
    scheduled_date = date or (datetime.now(UTC) + timedelta(days=7)).replace(hour=10, minute=30, second=0, microsecond=0).isoformat()
    doc = {
        "_id": f"ses-{sequence:03d}",
        "title": title or f"Sesión de red Crohn PK/PD #{sequence}",
        "date": scheduled_date,
        "duration": "60 min",
        "participants": ["Hospital Universitario de Bellvitge"],
        "casesCount": 0,
        "status": "scheduled",
        "caseIds": [],
        "minutes": "",
        "createdAt": _now_iso(),
    }
    _col("xarxa_sessions").insert_one(doc)
    _cache_invalidate("sessions", "kpis")
    return {key: value for key, value in doc.items() if key != "_id"} | {"sessionId": doc["_id"], "cases": []}


def update_xarxa_session_status(session_id: str, status: str) -> dict:
    _ensure_xarxa_indexes()
    label = {
        "live": "Sesión iniciada",
        "done": "Sesión cerrada",
        "scheduled": "Sesión reprogramada",
    }.get(status, "Sesión actualizada")
    result = _col("xarxa_sessions").find_one_and_update(
        {"$or": [{"_id": session_id}, {"id": session_id}]},
        {"$set": {"status": status, "updatedAt": _now_iso()}},
        return_document=ReturnDocument.AFTER,
        projection={"_id": 0},
    )
    if not result:
        raise ValueError(f"Session not found: {session_id}")

    for case_id in result.get("caseIds", []):
        _append_event(case_id, "Decisiones", "Sesión", f"{label}: {result['title']}")
        _append_agent_run(case_id, "Agente de sesión", f"{label.lower()} para el caso en el circuito de red.")
    _cache_invalidate("sessions", "cases", "case", "kpis", "agents")
    updated_sessions = list_xarxa_sessions()
    for session in updated_sessions:
        if session.get("sessionId") == session_id:
            return session
    return result | {"cases": []}


def bulk_act_on_xarxa_cases(
    case_ids: list[str],
    action: str,
    assigned_to: str | None = None,
    assigned_name: str | None = None,
    priority: str | None = None,
    actor: dict[str, Any] | None = None,
) -> list[dict]:
    _ensure_xarxa_indexes()
    updated_cases: list[dict] = []
    for case_id in case_ids:
        if action == "assign":
            updated = transition_xarxa_case(
                case_id,
                {
                    "assignedTo": assigned_to,
                    "assignedName": assigned_name,
                    "eventLabel": f"Caso asignado a {assigned_name or 'responsable pendiente'}",
                    "type": "Asignación",
                    **({"actorName": actor.get("name"), "actorRole": actor.get("role"), "actorCenter": actor.get("center"), "actorType": actor.get("type")} if actor else {}),
                },
            )
        elif action == "request_data":
            updated = transition_xarxa_case(
                case_id,
                {
                    "pipelineStage": "Datos incompletos",
                    "nextAction": "Completar datos solicitados por el equipo revisor",
                    "eventLabel": "Solicitud de datos enviada desde la cola de casos",
                    "type": "Estado",
                    **({"actorName": actor.get("name"), "actorRole": actor.get("role"), "actorCenter": actor.get("center"), "actorType": actor.get("type")} if actor else {}),
                },
            )
        elif action == "send_session":
            updated = transition_xarxa_case(
                case_id,
                {
                    "pipelineStage": "Discusión en red",
                    "nextAction": "Preparar resumen para sesión de red",
                    "eventLabel": "Caso enviado a sesión de red desde la cola",
                    "type": "Estado",
                    **({"actorName": actor.get("name"), "actorRole": actor.get("role"), "actorCenter": actor.get("center"), "actorType": actor.get("type")} if actor else {}),
                },
            )
        elif action == "set_priority":
            updated = transition_xarxa_case(
                case_id,
                {
                    "priority": priority,
                    "eventLabel": f"Prioridad actualizada a {priority or 'sin definir'}",
                    "type": "Priorización",
                    **({"actorName": actor.get("name"), "actorRole": actor.get("role"), "actorCenter": actor.get("center"), "actorType": actor.get("type")} if actor else {}),
                },
            )
        elif action == "mark_review":
            updated = transition_xarxa_case(
                case_id,
                {
                    "pipelineStage": "Determinantes recibidos",
                    "nextAction": "Revisión farmacéutica",
                    "eventLabel": "Caso marcado como listo para revisión",
                    "type": "Estado",
                    **({"actorName": actor.get("name"), "actorRole": actor.get("role"), "actorCenter": actor.get("center"), "actorType": actor.get("type")} if actor else {}),
                },
            )
        else:
            raise ValueError(f"Unsupported bulk action: {action}")
        updated_cases.append(updated)
    return updated_cases


def update_xarxa_case(case_id: str, patch: dict) -> dict:
    _ensure_xarxa_indexes()
    mutable_fields = {
        "title",
        "clinicalSummary",
        "nextAction",
        "priority",
        "caseType",
        "diseaseContext",
        "therapyContext",
        "labDeterminants",
        "patientProfile",
    }

    update_doc = {key: value for key, value in patch.items() if key in mutable_fields}
    if not update_doc:
        return get_xarxa_case(case_id)

    previous_case = get_xarxa_case(case_id)
    actor = _extract_actor(patch)
    update_doc["updatedAt"] = _now_iso()
    _touch_case(case_id, update_doc)
    _append_event(
        case_id,
        "Decisiones",
        "Actualización",
        "Caso actualizado desde el editor clínico",
        actor=actor,
    )
    _append_agent_run(case_id, "Agente de gaps", "Se ha reevaluado la completitud del caso tras editar datos clínicos.")
    updated_case = _recompute_case_state(case_id)
    if updated_case.get("pipelineStage") != previous_case.get("pipelineStage"):
        _append_event(
            case_id,
            "Decisiones",
            "Workflow automático",
            (
                f"La etapa del caso se ha reajustado automáticamente de "
                f"«{previous_case.get('pipelineStage')}» a «{updated_case.get('pipelineStage')}» "
                "tras reevaluar gaps y determinantes."
            ),
            actor=SYSTEM_ACTOR,
            meta={"triggeredBy": actor},
        )
    _invalidate_case_related_cache(case_id)
    return updated_case


def transition_xarxa_case(case_id: str, patch: dict) -> dict:
    _ensure_xarxa_indexes()
    mutable_fields = {
        "pipelineStage",
        "nextAction",
        "priority",
        "assignedTo",
        "assignedName",
    }
    current_case = get_xarxa_case(case_id)
    actor = _extract_actor(patch)
    requested_stage = patch.get("pipelineStage")
    _validate_stage_transition(current_case.get("pipelineStage"), requested_stage)
    if requested_stage == "Discusión en red":
        _attach_case_to_next_session(case_id)
    update_doc = {key: value for key, value in patch.items() if key in mutable_fields and value is not None}
    _touch_case(case_id, update_doc)
    _append_event(
        case_id,
        patch.get("lane", "Decisiones"),
        patch.get("type", "Estado"),
        patch.get("eventLabel", "Caso actualizado"),
        actor=actor,
    )
    if requested_stage == "Discusión en red":
        _append_agent_run(case_id, "Agente de sesión", "Caso añadido a la próxima sesión de red para revisión colaborativa.")
    elif requested_stage == "Datos incompletos":
        _append_agent_run(case_id, "Agente de gaps", "Caso devuelto para completar determinantes y confirmar coherencia temporal.")
    updated_case = _recompute_case_state(
        case_id,
        stage_override=requested_stage,
        next_action_override=patch.get("nextAction"),
    )
    _invalidate_case_related_cache(case_id)
    return updated_case


def update_xarxa_task(case_id: str, task_id: str, patch: dict) -> dict:
    _ensure_xarxa_indexes()
    mutable_fields = {"status", "ownerRole", "ownerId", "dueDate", "title", "priority"}
    previous_case = get_xarxa_case(case_id)
    actor = _extract_actor(patch)
    update_doc = {key: value for key, value in patch.items() if key in mutable_fields and value is not None}
    update_doc["updatedAt"] = _now_iso()

    result = _col("xarxa_tasks").find_one_and_update(
        {"caseId": case_id, "$or": [{"taskId": task_id}, {"_id": task_id}]},
        {"$set": update_doc},
        return_document=ReturnDocument.AFTER,
        projection={"_id": 0},
    )
    if not result:
        raise ValueError(f"Task not found: {task_id}")

    _append_event(
        case_id,
        "Tareas",
        "Tarea actualizada",
        patch.get("eventLabel") or f"Tarea actualizada: {result['title']} ({result['status']})",
        actor=actor,
    )
    if patch.get("status") == "Resuelta":
        _append_agent_run(case_id, "Agente de gaps", "Se ha refrescado la completitud tras resolver una tarea pendiente.")
    updated_case = _recompute_case_state(case_id)
    if updated_case.get("pipelineStage") != previous_case.get("pipelineStage"):
        _append_event(
            case_id,
            "Decisiones",
            "Workflow automático",
            (
                f"La etapa del caso se ha reajustado automáticamente de "
                f"«{previous_case.get('pipelineStage')}» a «{updated_case.get('pipelineStage')}» "
                "tras actualizar tareas y gaps."
            ),
            actor=SYSTEM_ACTOR,
            meta={"triggeredBy": actor},
        )
    _invalidate_case_related_cache(case_id)
    return updated_case


def save_xarxa_recommendation(case_id: str, payload: dict) -> dict:
    _ensure_xarxa_indexes()
    case = get_xarxa_case(case_id)
    actor = _extract_actor(payload)
    recommendation = {
        "caseId": case_id,
        "status": payload.get("status") or case.get("recommendation", {}).get("status", "Borrador IA"),
        "text": payload.get("text") or case.get("recommendation", {}).get("text", ""),
        "updatedAt": _now_iso(),
    }
    _upsert_singleton_case_doc("xarxa_recommendations", case_id, "rec", recommendation)
    _touch_case(case_id, {"recommendation": recommendation})

    case_updates = {
        key: payload[key]
        for key in ("pipelineStage", "nextAction")
        if payload.get(key) is not None
    }
    if case_updates:
        _validate_stage_transition(case.get("pipelineStage"), case_updates.get("pipelineStage"))
        _touch_case(case_id, case_updates)

    _append_event(
        case_id,
        "Decisiones",
        "Recomendación",
        payload.get("eventLabel") or f"Recomendación actualizada: {recommendation['status']}",
        actor=actor,
    )
    _append_agent_run(case_id, "Agente de recomendación", f"Se ha actualizado la propuesta clínica en estado {recommendation['status']}.")
    _invalidate_case_related_cache(case_id)
    return get_xarxa_case(case_id)


def _generate_note_text(case: dict) -> str:
    therapy = case.get("therapyContext") or {}
    determinants = case.get("labDeterminants") or []
    determinant_text = ", ".join(
        f"{item.get('label')}: {item.get('value')} {item.get('unit') or ''}".strip()
        for item in determinants[:4]
        if item.get("label")
    ) or "Sin determinantes confirmados"
    recommendation = (case.get("recommendation") or {}).get("text") or "Pendiente de validación profesional."
    return "\n".join(
        [
            f"Motivo de consulta: {case.get('caseType', 'Consulta PK/PD')}.",
            f"Datos revisados: {case.get('clinicalSummary', 'Sin resumen clínico estructurado')}",
            f"Tratamiento actual: {therapy.get('currentDrug', 'No indicado')} {therapy.get('currentDose', '')} {therapy.get('interval', '')}".strip(),
            f"Determinantes PK/PD: {determinant_text}.",
            f"Interpretación: {(case.get('pkpdInterpretation') or {}).get('summary', 'Pendiente de interpretar')}",
            f"Recomendación: {recommendation}",
            "Nota generada en entorno demo. Requiere validación farmacéutica y médica antes de HCE.",
        ]
    )


def _draft_pkpd_interpretation(case: dict) -> dict[str, str]:
    therapy = case.get("therapyContext") or {}
    determinants = case.get("labDeterminants") or []
    gaps = case.get("gaps") or []
    unresolved_critical = [gap for gap in gaps if gap.get("severity") == "Crítico"]

    level_items = [
        det
        for det in determinants
        if "nivel" in str(det.get("label", "")).lower()
        or "concentr" in str(det.get("label", "")).lower()
    ]
    antibody_items = [
        det
        for det in determinants
        if "anticuerpo" in str(det.get("label", "")).lower()
    ]
    inflammatory_items = [
        det
        for det in determinants
        if any(
            token in str(det.get("label", "")).lower()
            for token in ("pcr", "calprotectina", "proteína c reactiva")
        )
    ]

    current_drug = therapy.get("currentDrug") or "biológico actual"
    if unresolved_critical:
        return {
            "pattern": "Datos insuficientes para interpretación",
            "confidence": "Media",
            "summary": (
                f"El sistema detecta un patrón preliminar en {current_drug}, pero existen "
                f"{len(unresolved_critical)} gaps críticos que limitan una conclusión PK/PD robusta. "
                "Conviene resolver primero determinantes, relación muestra-dosis y contexto clínico."
            ),
        }

    if antibody_items:
        return {
            "pattern": "Baja exposición con inmunogenicidad probable",
            "confidence": "Alta",
            "summary": (
                f"La combinación de exposición baja y datos de inmunogenicidad sugiere revisar "
                f"si {current_drug} mantiene utilidad clínica o si conviene preparar alternativas "
                "para validación médica."
            ),
        }

    if level_items and inflammatory_items:
        return {
            "pattern": "Baja exposición con actividad inflamatoria persistente",
            "confidence": "Alta",
            "summary": (
                f"El paquete automático sugiere revisar intensificación o ajuste de {current_drug} "
                "tras confirmar temporalidad de la muestra y coherencia de dosis."
            ),
        }

    if level_items:
        return {
            "pattern": "Exposición en revisión",
            "confidence": "Media",
            "summary": (
                f"El nivel disponible orienta una revisión PK/PD de {current_drug}, aunque todavía "
                "requiere validación farmacéutica del contexto clínico y temporal."
            ),
        }

    return {
        "pattern": "Caso estructurado pendiente de interpretación",
        "confidence": "Media",
        "summary": (
            "La IA ha estructurado el caso y priorizado los datos disponibles, pero la interpretación "
            "PK/PD todavía depende de completar determinantes y validación profesional."
        ),
    }


def _draft_recommendation_text(case: dict) -> str:
    interpretation = case.get("pkpdInterpretation") or {}
    gaps = case.get("gaps") or []
    unresolved = [gap.get("label") for gap in gaps if gap.get("status") != "Resuelta"]
    drug = (case.get("therapyContext") or {}).get("currentDrug") or "el tratamiento actual"

    if unresolved:
        top_gaps = "; ".join(unresolved[:2])
        return (
            f"Antes de validar cambios sobre {drug}, el sistema propone cerrar estos puntos: "
            f"{top_gaps}. Una vez completados, conviene revisar de nuevo la exposición y decidir "
            "si procede ajuste, intensificación o cambio de estrategia."
        )

    return (
        f"Con los datos actuales, el sistema prepara una revisión farmacéutica centrada en: "
        f"{interpretation.get('pattern', 'interpretación PK/PD en curso')}. "
        "La decisión final debe ser confirmada por Farmacia Hospitalaria y el equipo clínico."
    )


def orchestrate_xarxa_case(case_id: str) -> dict:
    _ensure_xarxa_indexes()
    case = _recompute_case_state(case_id)
    orchestration_signature = _case_orchestration_signature(case)
    orchestration_cache = case.get("orchestrationCache") or {}
    if (
        orchestration_cache.get("key") == orchestration_signature
        and (case.get("recommendation") or {}).get("text")
        and (case.get("clinicalNote") or {}).get("text")
    ):
        return case

    interpretation = _draft_pkpd_interpretation(case)
    recommendation_text = _draft_recommendation_text({**case, "pkpdInterpretation": interpretation})

    _touch_case(
        case_id,
        {
            "pkpdInterpretation": interpretation,
            "updatedAt": _now_iso(),
        },
    )

    recommendation = {
        "caseId": case["caseId"],
        "status": "Borrador IA",
        "text": recommendation_text,
        "updatedAt": _now_iso(),
    }
    _upsert_singleton_case_doc("xarxa_recommendations", case["caseId"], "rec", recommendation)
    _touch_case(case_id, {"recommendation": recommendation})

    refreshed_case = get_xarxa_case(case_id)
    note_text = _generate_note_text({**refreshed_case, "pkpdInterpretation": interpretation, "recommendation": recommendation})
    note = {
        "caseId": case["caseId"],
        "status": refreshed_case.get("clinicalNote", {}).get("status") or "Borrador",
        "text": note_text,
        "updatedAt": _now_iso(),
    }
    _upsert_singleton_case_doc("xarxa_notes", case["caseId"], "note", note)
    _touch_case(case_id, {"clinicalNote": note})
    _touch_case(
        case_id,
        {
            "orchestrationCache": {
                "key": orchestration_signature,
                "orchestratedAt": _now_iso(),
            }
        },
    )

    _append_event(
        case["caseId"],
        "Decisiones",
        "IA",
        "Orquestación IA de demostración ejecutada sobre el caso",
        actor=SYSTEM_ACTOR,
    )
    _append_agent_run(
        case["caseId"],
        "Agente de gaps",
        f"Completitud revisada: {len(refreshed_case.get('gaps', []))} gaps y {len(refreshed_case.get('tasks', []))} tareas activas.",
    )
    _append_agent_run(
        case["caseId"],
        "Agente PK/PD",
        f"Paquete PK/PD preparado con patrón sugerido: {interpretation['pattern']}.",
    )
    _append_agent_run(
        case["caseId"],
        "Agente de recomendación",
        "Borrador clínico de demostración preparado para validación farmacéutica.",
    )
    _append_agent_run(
        case["caseId"],
        "Agente de informe HCE",
        "Borrador de nota HCE de demostración preparado para revisión profesional.",
    )

    updated_case = _recompute_case_state(
        case_id,
        stage_override="Análisis PK/PD generado",
        next_action_override="Revisión farmacéutica del paquete automático",
    )
    _invalidate_case_related_cache(case_id)
    return updated_case


def save_xarxa_note(case_id: str, payload: dict) -> dict:
    _ensure_xarxa_indexes()
    case = get_xarxa_case(case_id)
    actor = _extract_actor(payload)
    note = {
        "caseId": case_id,
        "status": payload.get("status") or case.get("clinicalNote", {}).get("status", "Borrador"),
        "text": payload.get("text") or case.get("clinicalNote", {}).get("text", ""),
        "updatedAt": _now_iso(),
    }
    _upsert_singleton_case_doc("xarxa_notes", case_id, "note", note)
    _touch_case(case_id, {"clinicalNote": note})

    case_updates = {
        key: payload[key]
        for key in ("pipelineStage", "nextAction")
        if payload.get(key) is not None
    }
    if case_updates:
        _validate_stage_transition(case.get("pipelineStage"), case_updates.get("pipelineStage"))
        _touch_case(case_id, case_updates)

    _append_event(
        case_id,
        "Decisiones",
        "Informe HCE",
        payload.get("eventLabel") or f"Informe HCE actualizado: {note['status']}",
        actor=actor,
    )
    _append_agent_run(case_id, "Agente de informe HCE", f"Se ha actualizado el informe HCE con estado {note['status']}.")
    _invalidate_case_related_cache(case_id)
    return get_xarxa_case(case_id)


def generate_xarxa_note(case_id: str) -> dict:
    _ensure_xarxa_indexes()
    case = get_xarxa_case(case_id)
    generated_text = _generate_note_text(case)
    return save_xarxa_note(
        case_id,
        {
            "status": "Informe generado",
            "text": generated_text,
            "pipelineStage": "Informe generado",
            "nextAction": "Solicitar co-validación del informe",
            "eventLabel": "Borrador de informe HCE generado",
        },
    )


def save_xarxa_followup(case_id: str, payload: dict) -> dict:
    _ensure_xarxa_indexes()
    label = payload.get("label")
    if not label:
        raise ValueError("Follow-up label is required")

    case = get_xarxa_case(case_id)
    actor = _extract_actor(payload)
    follow_up = {
        "caseId": case_id,
        "label": label,
        "status": payload.get("status", "Programado"),
        "dueDate": payload.get("dueDate"),
        "updatedAt": _now_iso(),
    }
    existing = _col("xarxa_followups").find_one({"caseId": case_id, "label": label}, {"_id": 1})
    if existing:
        _col("xarxa_followups").update_one({"_id": existing["_id"]}, {"$set": follow_up})
    else:
        safe_label = re.sub(r"[^a-z0-9]+", "-", label.lower()).strip("-")
        _col("xarxa_followups").insert_one({"_id": f"fu-{case_id.lower()}-{safe_label}", **follow_up})

    case_updates = {
        key: payload[key]
        for key in ("pipelineStage", "nextAction")
        if payload.get(key) is not None
    }
    if case_updates:
        _validate_stage_transition(case.get("pipelineStage"), case_updates.get("pipelineStage"))
        _touch_case(case_id, case_updates)

    _append_event(
        case_id,
        "Decisiones",
        "Seguimiento",
        payload.get("eventLabel") or f"Seguimiento actualizado: {label} ({follow_up['status']})",
        actor=actor,
    )
    _append_agent_run(case_id, "Agente de aprendizaje", f"Se ha registrado {label.lower()} con estado {follow_up['status']}.")
    _invalidate_case_related_cache(case_id)
    return get_xarxa_case(case_id)


# ── kpis ──────────────────────────────────────────────────────────────────────

def get_xarxa_kpis(
    center_id: str | None = None,
    program_id: str | None = None,
    days: int | None = None,
) -> dict:
    _ensure_xarxa_indexes()
    cache_payload = {"centerId": center_id, "programId": program_id, "days": days}
    cached = _cache_get("kpis", cache_payload)
    if cached is not None:
        return cached

    reporting = _col("xarxa_reporting").find_one({}, {"_id": 0})
    case_match: dict[str, Any] = {}
    if center_id:
        case_match["centerId"] = center_id
    if program_id:
        case_match["programId"] = program_id
    if days:
        threshold = (datetime.now(UTC) - timedelta(days=days)).isoformat()
        case_match["updatedAt"] = {"$gte": threshold}

    cases_col = _col("xarxa_cases")
    valid_case_ids = cases_col.distinct("caseId", case_match)
    agent_match = {"caseId": {"$in": valid_case_ids}} if valid_case_ids else {"caseId": {"$in": []}}
    sessions = list(_col("xarxa_sessions").find({}, {"_id": 0, "status": 1, "caseIds": 1}))
    today = datetime.now(UTC).date().isoformat()

    def count_by(field: str) -> list[dict[str, Any]]:
        pipeline = [
            {"$match": case_match},
            {"$group": {"_id": {"$ifNull": [f"${field}", "No clasificado"]}, "value": {"$sum": 1}}},
            {"$project": {"_id": 0, "label": "$_id", "value": 1}},
            {"$sort": {"value": -1, "label": 1}},
        ]
        return list(cases_col.aggregate(pipeline))

    active_cases = cases_col.count_documents({**case_match, "pipelineStage": {"$ne": "Cerrado con resultado"}})
    new_today = cases_col.count_documents({**case_match, "createdAt": {"$regex": f"^{today}"}})
    pending_determinants = cases_col.count_documents(
        {**case_match, "pipelineStage": {"$in": ["Datos incompletos", "Pendiente de determinantes"]}}
    )
    ready_for_review = cases_col.count_documents(
        {**case_match, "pipelineStage": {"$in": ["Determinantes recibidos", "Revisión farmacéutica"]}}
    )
    critical_gap_result = list(
        cases_col.aggregate(
            [
                {"$match": case_match},
                {"$unwind": "$gaps"},
                {"$match": {"gaps.severity": "Crítico"}},
                {"$group": {"_id": "$caseId"}},
                {"$count": "total"},
            ]
        )
    )
    critical_gap_cases = critical_gap_result[0]["total"] if critical_gap_result else 0
    overdue_followups_pipeline: list[dict[str, Any]] = [
        {
            "$lookup": {
                "from": "xarxa_cases",
                "localField": "caseId",
                "foreignField": "caseId",
                "as": "case",
            }
        },
        {"$unwind": "$case"},
        {"$match": {"dueDate": {"$lt": today}, "status": {"$ne": "Completado"}}},
    ]
    if center_id:
        overdue_followups_pipeline.append({"$match": {"case.centerId": center_id}})
    if program_id:
        overdue_followups_pipeline.append({"$match": {"case.programId": program_id}})
    if days:
        overdue_followups_pipeline.append({"$match": {"case.updatedAt": {"$gte": threshold}}})
    overdue_followups_pipeline.append({"$count": "total"})
    overdue_followups_result = list(_col("xarxa_followups").aggregate(overdue_followups_pipeline))
    overdue_followups = overdue_followups_result[0]["total"] if overdue_followups_result else 0

    live_kpis = [
        {"label": "Casos activos", "value": active_cases},
        {"label": "Nuevos hoy", "value": new_today},
        {"label": "Pendientes de determinantes", "value": pending_determinants},
        {"label": "Listos para revisión", "value": ready_for_review},
        {"label": "Con gaps críticos", "value": critical_gap_cases},
        {"label": "Seguimiento vencido", "value": overdue_followups},
    ]

    top_gaps = list(
        cases_col.aggregate(
            [
                {"$match": case_match},
                {"$unwind": "$gaps"},
                {"$group": {"_id": {"$ifNull": ["$gaps.label", "Gap no clasificado"]}, "value": {"$sum": 1}}},
                {"$project": {"_id": 0, "label": "$_id", "value": 1}},
                {"$sort": {"value": -1, "label": 1}},
                {"$limit": 5},
            ]
        )
    )

    agent_counts = list(
        _col("xarxa_agent_runs").aggregate(
            [
                {"$match": agent_match},
                {"$group": {"_id": {"$ifNull": ["$agent", "Agente no clasificado"]}, "value": {"$sum": 1}}},
                {"$project": {"_id": 0, "label": "$_id", "value": 1}},
                {"$sort": {"value": -1, "label": 1}},
            ]
        )
    )

    session_counts = {
        "Programadas": len([session for session in sessions if session.get("status") == "scheduled"]),
        "En directo": len([session for session in sessions if session.get("status") == "live"]),
        "Completadas": len([session for session in sessions if session.get("status") == "done"]),
    }

    prepared_case_ids = _col("xarxa_agent_runs").distinct("caseId", agent_match)
    cases_prepared_by_ai = len(prepared_case_ids)
    recommendation_drafts = cases_col.count_documents(
        {**case_match, "recommendation.text": {"$exists": True, "$nin": ["", None]}}
    )
    note_drafts = cases_col.count_documents(
        {**case_match, "clinicalNote.text": {"$exists": True, "$nin": ["", None]}}
    )
    automated_by_center = list(
        cases_col.aggregate(
            [
                {"$match": {**case_match, "caseId": {"$in": prepared_case_ids}}},
                {"$group": {"_id": {"$ifNull": ["$centerName", "Centro no clasificado"]}, "value": {"$sum": 1}}},
                {"$project": {"_id": 0, "label": "$_id", "value": 1}},
                {"$sort": {"value": -1, "label": 1}},
            ]
        )
    ) if prepared_case_ids else []

    live_charts = [
        {"label": "Casos por tipo", "data": count_by("caseType")},
        {"label": "Casos por estado", "data": count_by("pipelineStage")},
        {"label": "Casos por centro", "data": count_by("centerName")},
        {"label": "Gaps más frecuentes", "data": top_gaps},
        {"label": "Actividad de agentes", "data": agent_counts},
        {"label": "Impacto de automatización por centro", "data": automated_by_center},
        {
            "label": "Borradores y salidas IA",
            "data": [
                {"label": "Casos estructurados", "value": cases_prepared_by_ai},
                {"label": "Recomendaciones IA", "value": recommendation_drafts},
                {"label": "Notas HCE", "value": note_drafts},
            ],
        },
        {
            "label": "Sesiones de red",
            "data": [{"label": label, "value": value} for label, value in session_counts.items()],
        },
    ]

    live_kpis.extend(
        [
            {"label": "Pasos IA ejecutados", "value": sum(item["value"] for item in agent_counts)},
            {"label": "Casos preparados por IA", "value": cases_prepared_by_ai},
            {"label": "Borradores clínicos", "value": recommendation_drafts + note_drafts},
        ]
    )

    if not reporting:
        return _cache_set("kpis", cache_payload, {"kpis": live_kpis, "charts": live_charts})
    reporting["kpis"] = live_kpis
    reporting["charts"] = live_charts
    return _cache_set("kpis", cache_payload, reporting)


# ── professionals & centers ───────────────────────────────────────────────────

def _keep_id(doc: dict) -> dict:
    """Convert _id to string and keep it as the `_id` field."""
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


def _seed_xarxa_professional_requests_if_empty() -> None:
    global _professional_requests_seeded
    requests = _col("xarxa_professional_requests")
    if _professional_requests_seeded or requests.count_documents({}) > 0:
        return

    requests.insert_many(
        [
            {
                "_id": "req-prof-001",
                "name": "Dra. Lucía Navarro",
                "requestedRoleId": "rol-digestologo",
                "requestedRoleLabel": "Digestólogo",
                "requestedCenterId": "ctr-cap-prat",
                "requestedCenterName": "CAP El Prat",
                "specialties": ["Digestivo"],
                "programs": ["Crohn PK/PD"],
                "status": "Pendiente",
                "requestedDate": _now_iso().split("T")[0],
                "requestReason": "Solicita acceso para derivar casos y revisar recomendaciones compartidas.",
            },
            {
                "_id": "req-prof-002",
                "name": "Enf. Pilar Costa",
                "requestedRoleId": "rol-enfermeria-eii",
                "requestedRoleLabel": "Enfermería EII",
                "requestedCenterId": "ctr-garraf-demo",
                "requestedCenterName": "Unidad Territorial Garraf",
                "specialties": ["Enfermería EII"],
                "programs": ["Crohn PK/PD"],
                "status": "Pendiente",
                "requestedDate": _now_iso().split("T")[0],
                "requestReason": "Necesita confirmar administraciones y coordinar extracciones en seguimiento.",
            },
            {
                "_id": "req-prof-003",
                "name": "Dr. Samuel Pujol",
                "requestedRoleId": "rol-laboratorio",
                "requestedRoleLabel": "Laboratorio",
                "requestedCenterId": "ctr-penedes-demo",
                "requestedCenterName": "Unidad Territorial Penedès",
                "specialties": ["Laboratorio"],
                "programs": ["Crohn PK/PD"],
                "status": "Pendiente",
                "requestedDate": _now_iso().split("T")[0],
                "requestReason": "Solicita acceso para validar determinantes y marcar muestras no interpretables.",
            },
        ]
    )
    _professional_requests_seeded = True


def reset_xarxa_runtime_state() -> None:
    global _professional_requests_seeded, _indexes_ready
    _professional_requests_seeded = False
    _indexes_ready = False
    _cache_invalidate()


def _center_name(center_id: str) -> str:
    center = _col("xarxa_centers").find_one({"_id": center_id}, {"name": 1})
    return center.get("name", center_id) if center else center_id


def _enrich_professional(doc: dict) -> dict:
    professional = _keep_id(doc)
    active_cases = _col("xarxa_cases").count_documents(
        {
            "$or": [
                {"assignedTo": professional["_id"]},
                {"requesterId": professional["_id"]},
            ],
            "pipelineStage": {"$ne": "Cerrado con resultado"},
        }
    )
    validated_cases = _col("xarxa_cases").count_documents(
        {
            "$or": [
                {"assignedTo": professional["_id"]},
                {"requesterId": professional["_id"]},
            ],
            "pipelineStage": "Cerrado con resultado",
        }
    )
    professional["centerName"] = _center_name(professional.get("centerId", ""))
    professional["activeCases"] = active_cases
    professional["validatedCases"] = validated_cases
    professional["responseTimeLabel"] = "2.4 h" if professional.get("roleLabel") == "Farmacéutico experto" else "4.8 h"
    professional["availability"] = "Disponible" if professional.get("status") == "Activo" else "Pendiente de activación"
    professional["expertise"] = professional.get("specialties") or []
    return professional


def list_xarxa_professionals() -> list[dict]:
    _ensure_xarxa_indexes()
    cached = _cache_get("professionals", {})
    if cached is not None:
        return cached
    items = [_enrich_professional(d) for d in _col("xarxa_professionals").find({}).sort("name", 1)]
    return _cache_set("professionals", {}, items)


def list_xarxa_centers() -> list[dict]:
    _ensure_xarxa_indexes()
    cached = _cache_get("centers", {})
    if cached is not None:
        return cached
    items = [_keep_id(d) for d in _col("xarxa_centers").find({})]
    return _cache_set("centers", {}, items)


def list_xarxa_professional_requests() -> list[dict]:
    _ensure_xarxa_indexes()
    cached = _cache_get("requests", {})
    if cached is not None:
        return cached
    _seed_xarxa_professional_requests_if_empty()
    items = [_keep_id(d) for d in _col("xarxa_professional_requests").find({}).sort("requestedDate", -1)]
    return _cache_set("requests", {}, items)


def approve_xarxa_professional_request(
    request_id: str,
    role_id: str | None = None,
    center_id: str | None = None,
) -> dict:
    _ensure_xarxa_indexes()
    _seed_xarxa_professional_requests_if_empty()
    request = _col("xarxa_professional_requests").find_one({"_id": request_id})
    if not request:
        raise ValueError(f"Professional request not found: {request_id}")

    final_role_id = role_id or request["requestedRoleId"]
    final_center_id = center_id or request["requestedCenterId"]
    role = _col("xarxa_roles").find_one({"_id": final_role_id}, {"label": 1})
    role_label = role.get("label", request["requestedRoleLabel"]) if role else request["requestedRoleLabel"]

    sequence = _next_sequence("professional", start_from=_col("xarxa_professionals").count_documents({}))
    slug = re.sub(r"[^a-z0-9]+", "-", request["name"].lower()).strip("-")
    professional_id = f"pro-net-{sequence:03d}"
    _col("xarxa_professionals").insert_one(
        {
            "_id": professional_id,
            "name": request["name"],
            "roleId": final_role_id,
            "roleLabel": role_label,
            "centerId": final_center_id,
            "specialties": request.get("specialties", []),
            "programs": request.get("programs", ["Crohn PK/PD"]),
            "status": "Activo",
            "sourceRequestId": request_id,
            "profileSlug": slug,
        }
    )
    _col("xarxa_professional_requests").delete_one({"_id": request_id})
    _cache_invalidate("professionals", "requests")
    return _enrich_professional(_col("xarxa_professionals").find_one({"_id": professional_id}))


def update_xarxa_professional(
    professional_id: str,
    role_id: str | None = None,
    center_id: str | None = None,
    status: str | None = None,
) -> dict:
    _ensure_xarxa_indexes()
    update_doc: dict[str, Any] = {}
    if role_id:
        role = _col("xarxa_roles").find_one({"_id": role_id}, {"label": 1})
        update_doc["roleId"] = role_id
        update_doc["roleLabel"] = role.get("label", role_id) if role else role_id
    if center_id:
        update_doc["centerId"] = center_id
    if status:
        update_doc["status"] = status

    if not update_doc:
        existing = _col("xarxa_professionals").find_one({"_id": professional_id})
        if not existing:
            raise ValueError(f"Professional not found: {professional_id}")
        return _enrich_professional(existing)

    result = _col("xarxa_professionals").find_one_and_update(
        {"_id": professional_id},
        {"$set": update_doc},
        return_document=ReturnDocument.AFTER,
    )
    if not result:
        raise ValueError(f"Professional not found: {professional_id}")
    _cache_invalidate("professionals")
    return _enrich_professional(result)


# ── agents ────────────────────────────────────────────────────────────────────

def list_xarxa_agents() -> list[dict]:
    _ensure_xarxa_indexes()
    cached = _cache_get("agents", {})
    if cached is not None:
        return cached
    agents = [_keep_id(agent) for agent in _col("xarxa_agents").find({})]
    for agent in agents:
        all_runs = list(_col("xarxa_agent_runs").find({"agent": agent["label"]}, {"_id": 0}).sort("timestamp", -1))
        recent_runs = all_runs[:5]
        metrics = list(
            _col("xarxa_agent_runs").aggregate(
                [
                    {"$match": {"agent": agent["label"]}},
                    {
                        "$group": {
                            "_id": "$agent",
                            "totalRuns": {"$sum": 1},
                            "caseIds": {"$addToSet": "$caseId"},
                            "draftsPrepared": {
                                "$sum": {
                                    "$cond": [
                                        {
                                            "$regexMatch": {
                                                "input": {"$toLower": {"$ifNull": ["$message", ""]}},
                                                "regex": "borrador|paquete|nota hce|propuesta clínica",
                                            }
                                        },
                                        1,
                                        0,
                                    ]
                                }
                            },
                        }
                    },
                ]
            )
        )
        agent_metric = metrics[0] if metrics else {"totalRuns": 0, "caseIds": [], "draftsPrepared": 0}
        cases_touched = len([case_id for case_id in agent_metric.get("caseIds", []) if case_id])

        agent["recentRuns"] = recent_runs
        agent["metrics"] = {
            "totalRuns": agent_metric.get("totalRuns", 0),
            "casesTouched": cases_touched,
            "lastRunAt": recent_runs[0].get("timestamp") if recent_runs else None,
            "draftsPrepared": agent_metric.get("draftsPrepared", 0),
        }
    return _cache_set("agents", {}, agents)


# ── programs ──────────────────────────────────────────────────────────────────

def list_xarxa_programs() -> list[dict]:
    _ensure_xarxa_indexes()
    cached = _cache_get("programs", {})
    if cached is not None:
        return cached
    items = [_keep_id(program) for program in _col("xarxa_programs").find({}).sort("label", 1)]
    return _cache_set("programs", {}, items)


def list_xarxa_forms(program_id: str | None = None) -> list[dict]:
    _ensure_xarxa_indexes()
    cache_payload = {"programId": program_id}
    cached = _cache_get("forms", cache_payload)
    if cached is not None:
        return cached
    query: dict[str, Any] = {}
    if program_id:
        query["programId"] = program_id
    items = [_keep_id(form) for form in _col("xarxa_forms").find(query).sort("label", 1)]
    return _cache_set("forms", cache_payload, items)


def create_xarxa_program(payload: dict[str, Any]) -> dict:
    _ensure_xarxa_indexes()
    label = payload.get("label", "").strip()
    specialty = payload.get("specialty", "").strip()
    if not label or not specialty:
        raise ValueError("Program label and specialty are required.")

    slug = re.sub(r"[^a-z0-9]+", "-", label.lower()).strip("-")
    program_id = f"prog-{slug}"
    if _col("xarxa_programs").find_one({"_id": program_id}):
        stamp = datetime.now(UTC).strftime("%H%M%S")
        program_id = f"{program_id}-{stamp}"

    doc = {
        "_id": program_id,
        "label": label,
        "specialty": specialty,
        "status": payload.get("status") or "Borrador",
        "version": payload.get("version") or "v0.1",
        "conditions": payload.get("conditions") or [],
        "drugs": payload.get("drugs") or [],
        "determinants": payload.get("determinants") or [],
        "caseTypes": payload.get("caseTypes") or [],
        "workflowStages": payload.get("workflowStages") or [],
        "sharingPolicy": payload.get("sharingPolicy") or "Pendiente de definir política de compartición",
        "updatedAt": _now_iso(),
        "createdAt": _now_iso(),
    }
    _col("xarxa_programs").insert_one(doc)
    _cache_invalidate("programs", "forms")
    return {key: value for key, value in doc.items() if key != "_id"} | {"_id": program_id}


def update_xarxa_program(program_id: str, payload: dict[str, Any]) -> dict:
    _ensure_xarxa_indexes()
    mutable_fields = {
        "label",
        "specialty",
        "status",
        "version",
        "conditions",
        "drugs",
        "determinants",
        "caseTypes",
        "workflowStages",
        "sharingPolicy",
    }
    update_doc = {key: value for key, value in payload.items() if key in mutable_fields and value is not None}
    if not update_doc:
        result = _col("xarxa_programs").find_one({"_id": program_id}, {"_id": 0})
        if not result:
            raise ValueError(f"Program not found: {program_id}")
        return result | {"_id": program_id}

    update_doc["updatedAt"] = _now_iso()
    result = _col("xarxa_programs").find_one_and_update(
        {"_id": program_id},
        {"$set": update_doc},
        return_document=ReturnDocument.AFTER,
        projection={"_id": 0},
    )
    if not result:
        raise ValueError(f"Program not found: {program_id}")
    _cache_invalidate("programs", "forms")
    return result | {"_id": program_id}


def publish_xarxa_program(program_id: str) -> dict:
    program = _col("xarxa_programs").find_one({"_id": program_id})
    if not program:
        raise ValueError(f"Program not found: {program_id}")

    current_version = str(program.get("version", "v0.1")).lstrip("v")
    try:
        major, minor = current_version.split(".")
        next_version = f"v{major}.{int(minor) + 1}"
    except ValueError:
        next_version = "v1.0"

    return update_xarxa_program(
        program_id,
        {
            "status": "Activo",
            "version": next_version,
        },
    )


# ── roles ─────────────────────────────────────────────────────────────────────

def list_xarxa_roles() -> list[dict]:
    _ensure_xarxa_indexes()
    cached = _cache_get("roles", {})
    if cached is not None:
        return cached
    items = [_keep_id(role) for role in _col("xarxa_roles").find({})]
    return _cache_set("roles", {}, items)
