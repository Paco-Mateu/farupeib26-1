"""FHIR R4 export of a Xarxa PK/PD case, as the bridge toward the hospital
EHR (HCE/SAP). Produces a Bundle with a synthetic Patient, the active
MedicationRequest, Observations for the timed determinants, and the network's
recommendation as a ClinicalImpression draft resource.

All patient data is synthetic; the export demonstrates the integration path.
"""

from __future__ import annotations

from typing import Any

from backend.services.xarxa_repository import get_xarxa_case

FHIR_BASE_URL = "http://xarxa-pkpd.example.org/fhir"


def _determinant_observation(case: dict[str, Any], determinant: dict[str, Any], patient_ref: str) -> dict[str, Any]:
    value = determinant.get("value")
    observation: dict[str, Any] = {
        "resourceType": "Observation",
        "id": f"obs-{determinant.get('label', 'det')}".replace(" ", "-")[:60],
        "status": "final" if determinant.get("status") == "Confirmado" else "preliminary",
        "category": [{"coding": [{"system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "laboratory"}]}],
        "code": {"text": determinant.get("label", "Determinante PK/PD")},
        "subject": {"reference": f"Patient/{patient_ref}"},
        "note": [note for note in [{"text": determinant.get("interpretation")} or None, {"text": determinant.get("relationToDose") and f"Relación con la dosis: {determinant['relationToDose']}"} or None, {"text": determinant.get("sampleType") and f"Tipo de muestra: {determinant['sampleType']}"} or None] if note],
    }
    if determinant.get("sampleDateTime"):
        observation["effectiveDateTime"] = determinant["sampleDateTime"]
    if isinstance(value, (int, float)):
        observation["valueQuantity"] = {
            "value": value,
            "unit": determinant.get("unit") or "",
            "system": "http://unitsofmeasure.org",
        }
    elif value not in (None, ""):
        observation["valueString"] = str(value)
    return observation


def export_xarxa_case_fhir(case_id: str) -> dict[str, Any]:
    case = get_xarxa_case(case_id)
    patient_ref = case.get("patientCode", "unknown")

    profile = case.get("patientProfile") or {}
    patient = {
        "resourceType": "Patient",
        "id": patient_ref,
        "identifier": [{"system": "urn:xarxa:pkpd-patient-code", "value": patient_ref}],
        "gender": {"Varón": "male", "Mujer": "female", "Varon": "male"}.get(str(profile.get("sex") or ""), "unknown"),
        "managingOrganization": {"display": case.get("centerName", "")},
    }

    therapy = case.get("therapyContext") or {}
    dosage_text = " ".join(
        filter(None, [str(therapy.get("currentDose") or ""), str(therapy.get("interval") or ""), str(therapy.get("route") or "")])
    )
    medication_request = {
        "resourceType": "MedicationRequest",
        "id": "medrequest-current",
        "status": "active",
        "intent": "order",
        "medicationCodeableConcept": {"text": str(therapy.get("currentDrug") or "")},
        "subject": {"reference": f"Patient/{patient_ref}"},
        "dosageInstruction": [{"text": dosage_text or "Pauta no especificada"}],
        "note": [{"text": str(therapy.get("previousTherapies") or "")}] if therapy.get("previousTherapies") else [],
    }

    recommendation = case.get("recommendation") or {}
    clinical_impression = {
        "resourceType": "ClinicalImpression",
        "id": "impression-xarxa",
        "status": "draft" if recommendation.get("status") in ("Borrador IA", "Editado por farmacia") else "completed",
        "subject": {"reference": f"Patient/{patient_ref}"},
        "summary": str(recommendation.get("text") or ""),
        "date": case.get("updatedAt"),
        "assessor": {"display": "Xarxa PK/PD — Comisión clínica (requiere validación humana)"},
    }

    entries = [
        {"resource": patient},
        {"resource": medication_request},
        {"resource": clinical_impression},
    ]
    for determinant in case.get("labDeterminants") or []:
        entries.append({"resource": _determinant_observation(case, determinant, patient_ref)})

    return {
        "resourceType": "Bundle",
        "id": f"xarxa-{case['caseId'].lower()}",
        "type": "collection",
        "timestamp": case.get("updatedAt"),
        "meta": {
            "tag": [{"system": "urn:xarxa:provenance", "code": "prototype", "display": "Prototipo no validado; exportación de demostración"}],
        },
        "entry": entries,
    }
