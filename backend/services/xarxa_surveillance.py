"""Proactive surveillance for the Xarxa PK/PD network.

The hospital's AI project brief: instead of only reacting to requests,
continuously analyze the network's cases and raise alerts when a patient is
a candidate for early precision dosing (MIPD) — based on the risk factors the
pharmacists themselves listed: subtherapeutic/supratherapeutic exposure,
low albumin, high inflammatory markers, treatment restarts, urgent SLA
breaches.

Deterministic prototype rules, evaluated over every non-closed case. Each
active rule produces one alert per case (idempotent), always as decision
support with mandatory human review.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from backend.services.xarxa_repository import (
    _append_agent_run,
    _append_event,
    _cache_invalidate,
    _col,
    _ensure_xarxa_indexes,
    _now_iso,
    RESOLVED_SLA_STAGES,
    SYSTEM_ACTOR,
)

SURVEILLANCE_COLLECTION = "xarxa_surveillance_alerts"

CPF_HIGH = 250.0  # µg/g
CRP_HIGH = 10.0  # mg/L
ALBUMIN_LOW = 35.0  # g/L


def _parse_float(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    import re

    match = re.search(r"(\d+(?:[.,]\d+)?)", str(value))
    return float(match.group(1).replace(",", ".")) if match else None


def _latest_determinant(case: dict, keyword: str) -> tuple[float, str | None] | None:
    values = []
    for det in case.get("labDeterminants") or []:
        label = str(det.get("label", "")).lower()
        if keyword in label and det.get("value") not in (None, ""):
            parsed = _parse_float(det.get("value"))
            if parsed is not None:
                sort_key = det.get("sampleDateTime") or ""
                values.append((sort_key, parsed, det.get("unit")))
    if not values:
        return None
    values.sort()
    latest = values[-1]
    return latest[1], latest[2]


def _albumin_g_per_l(case: dict) -> float | None:
    latest = _latest_determinant(case, "albúmina")
    if latest is None:
        return None
    value, unit = latest
    if unit and "dl" in unit.lower():
        return value * 10.0
    return value


def _scan_case(case: dict) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    stage = case.get("pipelineStage", "")
    if stage in RESOLVED_SLA_STAGES:
        return findings

    cpf_pair = _latest_determinant(case, "calprotectina")
    crp_pair = _latest_determinant(case, "pcr")
    albumin = _albumin_g_per_l(case)
    trough_pair = _latest_determinant(case, "concentración")
    cpf = cpf_pair[0] if cpf_pair else None
    crp = crp_pair[0] if crp_pair else None
    trough = trough_pair[0] if trough_pair else None

    if cpf is not None and cpf >= CPF_HIGH:
        findings.append(
            {
                "ruleId": "SUR-CPF-HIGH",
                "severity": "Importante",
                "message": f"Calprotectina {cpf:g} µg/g ≥ {CPF_HIGH:g}: actividad inflamatoria activa; candidata a revisión PK/PD precoz aunque no haya solicitud.",
            }
        )
    if crp is not None and crp >= CRP_HIGH:
        findings.append(
            {
                "ruleId": "SUR-CRP-HIGH",
                "severity": "Informativo",
                "message": f"PCR {crp:g} mg/L ≥ {CRP_HIGH:g}: reactante elevado; vigilar exposición y respuesta.",
            }
        )
    if albumin is not None and albumin < ALBUMIN_LOW:
        findings.append(
            {
                "ruleId": "SUR-ALB-LOW",
                "severity": "Importante",
                "message": f"Albúmina {albumin:g} g/L < {ALBUMIN_LOW:g}: hipoproteinemia asocia a mayor aclaramiento y riesgo de infraxposición; candidata a MIPD precoz.",
            }
        )
    if trough is not None and stage in ("Datos incompletos", "Pendiente de determinantes", "Solicitud recibida", "Determinantes recibidos"):
        findings.append(
            {
                "ruleId": "SUR-EXPO-REVIEW",
                "severity": "Informativo",
                "message": "Nivel de fármaco disponible sin interpretación finalizada: revisar exposición frente a objetivo.",
            }
        )
    if case.get("urgencyTrack") == "Urgente" and case.get("responseDeadline"):
        deadline = str(case["responseDeadline"])
        if deadline < _now_iso() and stage not in ("Análisis PK/PD generado",):
            findings.append(
                {
                    "ruleId": "SUR-URGENT-SLA",
                    "severity": "Crítico",
                    "message": "Circuito urgente fuera de plazo (<24-48 h) sin análisis PK/PD emitido: requiere resolución inmediata.",
                }
            )

    return findings


def run_xarxa_surveillance() -> dict[str, Any]:
    """Scan all non-closed cases; create new alerts idempotently (one per
    case+rule). Returns the created alerts and totals."""
    _ensure_xarxa_indexes()
    created: list[dict[str, Any]] = []
    scanned = 0

    existing_active = {
        (doc["caseId"], doc["ruleId"])
        for doc in _col(SURVEILLANCE_COLLECTION).find({"status": "Activa"}, {"_id": 0, "caseId": 1, "ruleId": 1})
    }

    for case in _col("xarxa_cases").find({}, {"_id": 0}):
        scanned += 1
        for finding in _scan_case(case):
            key = (case["caseId"], finding["ruleId"])
            if key in existing_active:
                continue
            alert = {
                "alertId": f"SURV-{case['caseId']}-{finding['ruleId']}",
                "caseId": case["caseId"],
                "caseTitle": case.get("title", ""),
                "centerName": case.get("centerName", ""),
                "priority": case.get("priority", ""),
                **finding,
                "status": "Activa",
                "createdAt": _now_iso(),
            }
            _col(SURVEILLANCE_COLLECTION).update_one(
                {"alertId": alert["alertId"]},
                {"$set": alert, "$unset": {"resolvedAt": ""}},
                upsert=True,
            )
            _append_event(
                case["caseId"],
                "Decisiones",
                "Vigilancia",
                f"Alerta de vigilancia ({finding['ruleId']}): {finding['message']}",
                actor=SYSTEM_ACTOR,
            )
            _append_agent_run(
                case["caseId"],
                "Agente de vigilancia",
                f"Regla {finding['ruleId']} activada. {finding['message']} Requiere validación humana.",
            )
            created.append(alert)

    _cache_invalidate("surveillance", "cases", "kpis", "agents")
    return {
        "status": "scanned",
        "casesScanned": scanned,
        "alertsCreated": len(created),
        "alerts": created,
    }


def list_xarxa_surveillance_alerts(status: str = "Activa") -> list[dict[str, Any]]:
    _ensure_xarxa_indexes()
    return list(_col(SURVEILLANCE_COLLECTION).find({"status": status}, {"_id": 0}).sort("createdAt", -1))


def resolve_xarxa_surveillance_alert(alert_id: str) -> dict[str, Any]:
    result = _col(SURVEILLANCE_COLLECTION).find_one_and_update(
        {"alertId": alert_id},
        {"$set": {"status": "Resuelta", "resolvedAt": _now_iso()}},
        return_document=True,
        projection={"_id": 0},
    )
    if not result:
        raise ValueError(f"Alert not found: {alert_id}")
    _cache_invalidate("surveillance", "kpis")
    return result
