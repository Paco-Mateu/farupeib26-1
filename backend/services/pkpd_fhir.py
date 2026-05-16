from __future__ import annotations

from collections import Counter
from datetime import UTC, datetime
from typing import Any

from backend.config import settings
from backend.db.mongo import get_synthea_fhir_database


BREAST_ONCOLOGY_CONDITION_TERMS = (
    "malignant neoplasm of breast",
    "breast",
)
BREAST_ONCOLOGY_PROCEDURE_TERMS = (
    "breast",
    "mammography",
    "lumpectomy",
    "mastectomy",
    "her2",
    "teleradiotherapy",
)
BREAST_ONCOLOGY_MEDICATION_TERMS = (
    "exemestane",
    "ribociclib",
    "tamoxifen",
    "anastrozole",
    "letrozole",
    "trastuzumab",
    "docetaxel",
    "cyclophosphamide",
)
CLINICALLY_RELEVANT_LAB_TERMS = (
    "creatinine",
    "leukocyte",
    "hemoglobin",
    "hematocrit",
    "platelet",
    "neutrophil",
    "glucose",
    "potassium",
    "sodium",
    "alt",
    "ast",
)
LOW_SIGNAL_LAB_TERMS = (
    "body height",
    "body weight",
    "body mass index",
    "pain severity",
    "tobacco smoking status",
)


def _normalize_patient_ref(value: str | None) -> str:
    token = str(value or "").strip()
    if not token:
        return ""
    if token.startswith("Patient/"):
        return token
    return f"Patient/{token}"


def _resource_label(resource: dict[str, Any]) -> str:
    code = resource.get("code") or {}
    if isinstance(code, dict):
        text = str(code.get("text") or "").strip()
        if text:
            return text
        coding = code.get("coding") or []
        for row in coding if isinstance(coding, list) else []:
            if not isinstance(row, dict):
                continue
            display = str(row.get("display") or "").strip()
            if display:
                return display

    medication = resource.get("medicationCodeableConcept") or {}
    if isinstance(medication, dict):
        text = str(medication.get("text") or "").strip()
        if text:
            return text
        coding = medication.get("coding") or []
        for row in coding if isinstance(coding, list) else []:
            if not isinstance(row, dict):
                continue
            display = str(row.get("display") or "").strip()
            if display:
                return display

    resource_type = str(resource.get("resourceType") or "").strip()
    return resource_type or "FHIR resource"


def _parse_datetime(value: str | None) -> datetime | None:
    token = str(value or "").strip()
    if not token:
        return None

    try:
        if token.endswith("Z"):
            return datetime.fromisoformat(token.replace("Z", "+00:00")).astimezone(UTC)
        parsed = datetime.fromisoformat(token)
        if parsed.tzinfo is None:
            return parsed.replace(tzinfo=UTC)
        return parsed.astimezone(UTC)
    except ValueError:
        return None


def _extract_event_datetime(resource: dict[str, Any]) -> datetime | None:
    candidates = [
        resource.get("effectiveDateTime"),
        resource.get("recordedDate"),
        resource.get("issued"),
        resource.get("authoredOn"),
        resource.get("onsetDateTime"),
        resource.get("date"),
        ((resource.get("performedPeriod") or {}).get("end")),
        ((resource.get("performedPeriod") or {}).get("start")),
        ((resource.get("period") or {}).get("end")),
        ((resource.get("period") or {}).get("start")),
    ]
    for candidate in candidates:
        parsed = _parse_datetime(candidate)
        if parsed is not None:
            return parsed
    return None


def _iso(value: datetime | None) -> str | None:
    if value is None:
        return None
    return value.astimezone(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _extract_patient_name(patient_resource: dict[str, Any]) -> str:
    names = patient_resource.get("name") or []
    for item in names if isinstance(names, list) else []:
        if not isinstance(item, dict):
            continue
        given = " ".join(str(value or "").strip() for value in item.get("given") or [] if str(value or "").strip())
        family = str(item.get("family") or "").strip()
        combined = " ".join(part for part in [given, family] if part).strip()
        if combined:
            return combined
    return str(patient_resource.get("id") or "Synthetic patient").strip()


def _extract_age(birth_date: str | None) -> int | None:
    parsed = _parse_datetime(birth_date)
    if parsed is None:
        token = str(birth_date or "").strip()
        if not token:
            return None
        try:
            parsed = datetime.fromisoformat(f"{token}T00:00:00+00:00")
        except ValueError:
            return None

    today = datetime.now(UTC).date()
    birth = parsed.date()
    return today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))


def _contains_any(value: str | None, terms: tuple[str, ...]) -> bool:
    haystack = str(value or "").strip().lower()
    if not haystack:
        return False
    return any(term in haystack for term in terms)


def _dedupe(values: list[str]) -> list[str]:
    seen: set[str] = set()
    ordered: list[str] = []
    for value in values:
        token = str(value or "").strip()
        if not token or token in seen:
            continue
        seen.add(token)
        ordered.append(token)
    return ordered


def _regex_for_terms(terms: tuple[str, ...]) -> dict[str, Any]:
    return {"$regex": "|".join(terms), "$options": "i"}


def _focus_narrative(
    conditions: list[str],
    medications: list[str],
    procedures: list[str],
) -> str | None:
    highlights = _dedupe(conditions[:2] + medications[:2] + procedures[:2])[:4]
    if not highlights:
        return None
    return "Breast-oncology backbone detected through " + ", ".join(highlights) + "."


def _lab_priority(label: str | None) -> int:
    token = str(label or "").strip().lower()
    if not token:
        return 0
    if _contains_any(token, LOW_SIGNAL_LAB_TERMS):
        return 0
    if _contains_any(token, CLINICALLY_RELEVANT_LAB_TERMS):
        return 2
    return 1


def fetch_fhir_patient_refs(limit: int = 40) -> list[dict[str, Any]]:
    collection = get_synthea_fhir_database()[settings.synthea_breast_cancer_fhir_resources_collection]
    cursor = collection.find(
        {"resource.resourceType": "Patient", "resource.id": {"$exists": True}},
        {"resource.id": 1, "resource.name": 1, "resource.birthDate": 1, "resource.gender": 1},
    ).sort("resource.id", 1)

    all_patients = list(cursor)
    patient_by_ref: dict[str, dict[str, Any]] = {}
    ordered_refs: list[str] = []
    for row in all_patients:
        resource = row.get("resource") or {}
        patient_ref = _normalize_patient_ref(resource.get("id"))
        if not patient_ref:
            continue
        patient_by_ref[patient_ref] = resource
        ordered_refs.append(patient_ref)

    breast_condition_refs = set(
        collection.distinct(
            "resource.subject.reference",
            {
                "resource.resourceType": "Condition",
                "resource.code.text": _regex_for_terms(BREAST_ONCOLOGY_CONDITION_TERMS),
            },
        )
    )
    oncology_medication_refs = set(
        collection.distinct(
            "resource.subject.reference",
            {
                "resource.resourceType": "MedicationRequest",
                "resource.medicationCodeableConcept.text": _regex_for_terms(BREAST_ONCOLOGY_MEDICATION_TERMS),
            },
        )
    )
    oncology_procedure_refs = set(
        collection.distinct(
            "resource.subject.reference",
            {
                "resource.resourceType": "Procedure",
                "resource.code.text": _regex_for_terms(BREAST_ONCOLOGY_PROCEDURE_TERMS),
            },
        )
    )

    preferred_refs = sorted(
        breast_condition_refs | oncology_medication_refs | oncology_procedure_refs,
        key=lambda ref: (
            -(
                (4 if ref in breast_condition_refs else 0)
                + (2 if ref in oncology_medication_refs else 0)
                + (1 if ref in oncology_procedure_refs else 0)
            ),
            ref,
        ),
    )
    selected_refs = preferred_refs + [ref for ref in ordered_refs if ref not in set(preferred_refs)]

    patients: list[dict[str, Any]] = []
    for patient_ref in selected_refs[: max(1, min(limit, 200))]:
        resource = patient_by_ref.get(patient_ref) or {}
        if not resource:
            continue
        birth_date = str(resource.get("birthDate") or "").strip() or None
        oncology_signals = []
        if patient_ref in breast_condition_refs:
            oncology_signals.append("breast_cancer_condition")
        if patient_ref in oncology_medication_refs:
            oncology_signals.append("oncology_medication")
        if patient_ref in oncology_procedure_refs:
            oncology_signals.append("breast_imaging_or_procedure")
        patients.append(
            {
                "patientRef": patient_ref,
                "name": _extract_patient_name(resource),
                "birthDate": birth_date,
                "age": _extract_age(birth_date),
                "sex": str(resource.get("gender") or "").strip().lower() or "unknown",
                "clinicalBackbone": "breast_oncology" if oncology_signals else "general_clinical",
                "oncologySignals": oncology_signals,
            }
        )
    return patients


def build_fhir_patient_context(patient_ref: str, *, limit: int = 220) -> dict[str, Any]:
    normalized_ref = _normalize_patient_ref(patient_ref)
    if not normalized_ref:
        return {
            "patientRef": None,
            "patient": None,
            "summary": {
                "focus": "unlinked",
                "resourceCounts": {},
                "recentEvents": [],
                "conditions": [],
                "medications": [],
                "procedures": [],
                "labs": [],
                "oncologyHighlights": {"conditions": [], "medications": [], "procedures": [], "narrative": None},
            },
        }

    collection = get_synthea_fhir_database()[settings.synthea_breast_cancer_fhir_resources_collection]
    patient_id = normalized_ref.split("/", 1)[1]
    patient_doc = collection.find_one(
        {"resource.resourceType": "Patient", "resource.id": patient_id},
        {"resource": 1},
    )
    patient_resource = (patient_doc or {}).get("resource") or {}

    query = {
        "$or": [
            {"compartments.patientRefs": normalized_ref},
            {"resource.subject.reference": normalized_ref},
            {"resource.patient.reference": normalized_ref},
            {"resource.beneficiary.reference": normalized_ref},
        ]
    }
    projection = {
        "resource.resourceType": 1,
        "resource.code": 1,
        "resource.medicationCodeableConcept": 1,
        "resource.valueQuantity": 1,
        "resource.valueString": 1,
        "resource.valueInteger": 1,
        "resource.status": 1,
        "resource.clinicalStatus": 1,
        "resource.effectiveDateTime": 1,
        "resource.recordedDate": 1,
        "resource.issued": 1,
        "resource.authoredOn": 1,
        "resource.onsetDateTime": 1,
        "resource.date": 1,
        "resource.performedPeriod": 1,
        "resource.period": 1,
        "resource.type": 1,
    }
    resources = list(collection.find(query, projection).limit(max(1, min(limit, 500))))

    resource_counts: Counter[str] = Counter()
    conditions: list[str] = []
    medications: list[str] = []
    procedures: list[str] = []
    labs: list[dict[str, Any]] = []
    recent_events: list[dict[str, Any]] = []
    oncology_conditions: list[str] = []
    oncology_medications: list[str] = []
    oncology_procedures: list[str] = []

    for row in resources:
        resource = row.get("resource") or {}
        resource_type = str(resource.get("resourceType") or "").strip() or "Unknown"
        resource_counts[resource_type] += 1
        label = _resource_label(resource)
        event_dt = _extract_event_datetime(resource)

        if resource_type == "Condition" and label not in conditions:
            conditions.append(label)
            if _contains_any(label, BREAST_ONCOLOGY_CONDITION_TERMS):
                oncology_conditions.append(label)
        if resource_type == "MedicationRequest" and label not in medications:
            medications.append(label)
            if _contains_any(label, BREAST_ONCOLOGY_MEDICATION_TERMS):
                oncology_medications.append(label)
        if resource_type == "Procedure" and label not in procedures:
            procedures.append(label)
            if _contains_any(label, BREAST_ONCOLOGY_PROCEDURE_TERMS):
                oncology_procedures.append(label)
        if resource_type == "Observation":
            quantity = resource.get("valueQuantity") or {}
            lab_value = quantity.get("value")
            if lab_value is None:
                lab_value = resource.get("valueInteger")
            if lab_value is None:
                lab_value = resource.get("valueString")
            labs.append(
                {
                    "label": label,
                    "value": lab_value,
                    "unit": quantity.get("unit") if isinstance(quantity, dict) else None,
                    "date": _iso(event_dt),
                }
            )

        recent_events.append(
            {
                "type": resource_type,
                "label": label,
                "date": _iso(event_dt),
                "status": str(resource.get("status") or "").strip() or None,
            }
        )

    recent_events.sort(key=lambda item: item.get("date") or "", reverse=True)
    labs.sort(key=lambda item: (_lab_priority(item.get("label")), item.get("date") or ""), reverse=True)

    birth_date = str(patient_resource.get("birthDate") or "").strip() or None
    oncology_conditions = _dedupe(oncology_conditions)
    oncology_medications = _dedupe(oncology_medications)
    oncology_procedures = _dedupe(oncology_procedures)
    focus = "breast_oncology" if (oncology_conditions or oncology_medications or oncology_procedures) else "general_clinical"

    return {
        "patientRef": normalized_ref,
        "patient": {
            "name": _extract_patient_name(patient_resource),
            "sex": str(patient_resource.get("gender") or "").strip().lower() or "unknown",
            "birthDate": birth_date,
            "age": _extract_age(birth_date),
        },
        "summary": {
            "focus": focus,
            "resourceCounts": dict(resource_counts),
            "conditions": conditions[:10],
            "medications": medications[:10],
            "procedures": procedures[:10],
            "labs": labs[:10],
            "recentEvents": recent_events[:18],
            "oncologyHighlights": {
                "conditions": oncology_conditions[:6],
                "medications": oncology_medications[:6],
                "procedures": oncology_procedures[:6],
                "narrative": _focus_narrative(oncology_conditions, oncology_medications, oncology_procedures),
            },
        },
    }
