from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
import json
from pathlib import Path
from random import Random
from typing import Any

from pymongo import ReplaceOne

from backend.db.mongo import get_database
from backend.services.pkpd_fhir import fetch_fhir_patient_refs


PKPD_NETWORK_ID = "CAT-PKPD-NET"
PKPD_REFERENCE_HOSPITAL_ID = "HOSP-REF-01"
PKPD_DATASET_VERSION = "pkpd-nexus-ai-demo-v4"
PKPD_DEMO_ANCHOR = datetime(2026, 5, 16, 12, 0, tzinfo=UTC)
SUPPLEMENTAL_DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "synthetic" / "pkpd_nexus_demo_data"

PKPD_COLLECTIONS = {
    "networks": "pkpd_networks",
    "hospitals": "pkpd_hospitals",
    "users": "pkpd_users",
    "patients": "pkpd_patients",
    "cases": "pkpd_cases",
    "protocols": "pkpd_protocols",
    "retrieval_chunks": "pkpd_retrieval_chunks",
    "knowledge_products": "pkpd_knowledge_products",
    "expert_interventions": "pkpd_expert_interventions",
    "drug_dictionary": "pkpd_drug_dictionary",
    "observation_dictionary": "pkpd_observation_dictionary",
    "unit_dictionary": "pkpd_unit_dictionary",
    "official_drug_information": "pkpd_official_drug_information",
}

SATELLITE_HOSPITALS = [
    {"_id": "HOSP-001", "name": "Hospital de Viladecans", "city": "Viladecans", "lat": 41.32, "lon": 2.01},
    {"_id": "HOSP-002", "name": "H. U. Moisès Broggi", "city": "Sant Joan Despí", "lat": 41.37, "lon": 2.07},
    {"_id": "HOSP-003", "name": "Hospital General de l'Hospitalet", "city": "L'Hospitalet de Ll.", "lat": 41.36, "lon": 2.10},
    {"_id": "HOSP-004", "name": "Hospital General de Sant Boi", "city": "Sant Boi de Ll.", "lat": 41.34, "lon": 2.03},
    {"_id": "HOSP-005", "name": "H. Sant Joan de Déu Martorell", "city": "Martorell", "lat": 41.47, "lon": 1.93},
    {"_id": "HOSP-006", "name": "Hospital Residència Sant Camil", "city": "Sant Pere de Ribes", "lat": 41.23, "lon": 1.76},
    {"_id": "HOSP-007", "name": "H. Comarcal de l'Alt Penedès", "city": "Vilafranca del Penedès", "lat": 41.34, "lon": 1.70},
    {"_id": "HOSP-008", "name": "Hospital Universitari d'Igualada", "city": "Igualada", "lat": 41.58, "lon": 1.62},
    {"_id": "HOSP-009", "name": "H. Sociosanitari de l'Hospitalet", "city": "L'Hospitalet de Ll.", "lat": 41.36, "lon": 2.12},
]

THERAPEUTIC_AREAS = {
    "Infliximab": "biologics",
    "Ustekinumab": "biologics",
    "Adalimumab": "biologics",
    "Vancomycin": "antibiotics",
    "Tacrolimus": "immunosuppressants",
    "Voriconazole": "antifungals",
    "Levetiracetam": "antiepileptics",
}


@dataclass(frozen=True)
class DrugBlueprint:
    drug_name: str
    therapeutic_area: str
    target_min: float
    target_max: float
    unit: str
    biomarker_name: str
    hero_reason: str
    high_priority_summary: str
    risk_signals: tuple[str, ...]
    intervention_template: str
    similar_hint: str


DRUG_BLUEPRINTS: dict[str, DrugBlueprint] = {
    "Infliximab": DrugBlueprint(
        drug_name="Infliximab",
        therapeutic_area="biologics",
        target_min=3.0,
        target_max=7.0,
        unit="ug/mL",
        biomarker_name="CRP",
        hero_reason="Low level with positive anti-drug antibodies and inflammatory activity.",
        high_priority_summary="Prioritized due to subtherapeutic infliximab exposure, positive antibodies, and suspected loss of response.",
        risk_signals=("subtherapeutic_level", "positive_antidrug_antibodies", "loss_of_response_suspected"),
        intervention_template="Validate escalation to the reference biologics board and assess whether switching strategy is required.",
        similar_hint="Historically similar biologics cases improved after reference review and protocol-aligned optimization.",
    ),
    "Ustekinumab": DrugBlueprint(
        drug_name="Ustekinumab",
        therapeutic_area="biologics",
        target_min=1.0,
        target_max=4.5,
        unit="ug/mL",
        biomarker_name="Fecal calprotectin",
        hero_reason="Low exposure with persistent inflammatory activity.",
        high_priority_summary="Prioritized because ustekinumab exposure is below the expected maintenance window and biomarkers remain elevated.",
        risk_signals=("subtherapeutic_level", "persistent_inflammation", "reference_protocol_check"),
        intervention_template="Prepare exposure review packet and compare local strategy with reference maintenance targets.",
        similar_hint="Comparable ustekinumab reviews often required protocol harmonization rather than urgent escalation.",
    ),
    "Adalimumab": DrugBlueprint(
        drug_name="Adalimumab",
        therapeutic_area="biologics",
        target_min=5.0,
        target_max=12.0,
        unit="ug/mL",
        biomarker_name="CRP",
        hero_reason="Suspected loss of response with low trough concentration.",
        high_priority_summary="Prioritized because adalimumab trough concentration is below target and symptoms suggest loss of response.",
        risk_signals=("subtherapeutic_level", "loss_of_response_suspected", "local_review_required"),
        intervention_template="Draft optimization note with protocol references and request confirmation from the reference center if symptoms progress.",
        similar_hint="Most related adalimumab cases were resolved with standardized documentation and longitudinal review.",
    ),
    "Vancomycin": DrugBlueprint(
        drug_name="Vancomycin",
        therapeutic_area="antibiotics",
        target_min=10.0,
        target_max=20.0,
        unit="mg/L",
        biomarker_name="Creatinine",
        hero_reason="High level with renal function decline.",
        high_priority_summary="Urgent due to supratherapeutic vancomycin level and worsening renal function.",
        risk_signals=("supratherapeutic_level", "renal_decline", "urgent_review"),
        intervention_template="Highlight nephrotoxicity risk, recheck timing, and request rapid reference-center confirmation.",
        similar_hint="High-risk antibiotic cases are best surfaced first because timing errors compound quickly across the network.",
    ),
    "Tacrolimus": DrugBlueprint(
        drug_name="Tacrolimus",
        therapeutic_area="immunosuppressants",
        target_min=5.0,
        target_max=12.0,
        unit="ng/mL",
        biomarker_name="Creatinine",
        hero_reason="Marked variability in trough levels with unstable renal function.",
        high_priority_summary="Prioritized because tacrolimus levels show high variability and the current pattern threatens continuity of immunosuppression.",
        risk_signals=("high_variability", "renal_decline", "monitoring_intensified"),
        intervention_template="Assemble trough history, adherence hypotheses, and the latest renal trend before expert review.",
        similar_hint="The best tacrolimus matches are cases with repeated variability and follow-up monitoring plans.",
    ),
    "Voriconazole": DrugBlueprint(
        drug_name="Voriconazole",
        therapeutic_area="antifungals",
        target_min=1.0,
        target_max=5.5,
        unit="mg/L",
        biomarker_name="ALT",
        hero_reason="Exposure outside target with hepatic safety concern.",
        high_priority_summary="Prioritized because voriconazole exposure and liver markers suggest the need for protocol-guided reassessment.",
        risk_signals=("out_of_range_level", "hepatic_signal", "reference_protocol_check"),
        intervention_template="Draft antifungal review note that balances efficacy concerns with liver safety monitoring.",
        similar_hint="Relevant antifungal examples usually combine exposure interpretation and toxicity surveillance.",
    ),
    "Levetiracetam": DrugBlueprint(
        drug_name="Levetiracetam",
        therapeutic_area="antiepileptics",
        target_min=12.0,
        target_max=46.0,
        unit="mg/L",
        biomarker_name="Seizure log",
        hero_reason="Low exposure with breakthrough symptoms reported by the ward.",
        high_priority_summary="Prioritized because low levetiracetam exposure aligns with breakthrough symptom reporting and requires structured review.",
        risk_signals=("subtherapeutic_level", "breakthrough_symptoms", "specialist_review"),
        intervention_template="Prepare concise antiepileptic case summary and clarify recent adherence or administration changes.",
        similar_hint="The most useful antiepileptic matches are cases where deterministic triage identified symptom-pattern drift early.",
    ),
}

CASE_DISTRIBUTION = {
    "Infliximab": 30,
    "Ustekinumab": 12,
    "Adalimumab": 12,
    "Vancomycin": 10,
    "Tacrolimus": 6,
    "Voriconazole": 5,
    "Levetiracetam": 5,
}

CASE_SEQUENCE = (
    "Infliximab",
    "Vancomycin",
    "Ustekinumab",
    "Adalimumab",
    "Tacrolimus",
    "Voriconazole",
    "Levetiracetam",
)

PROTOCOL_LIBRARY = [
    {
        "_id": "PROT-INFLIXIMAB-REF-2026",
        "drugName": "Infliximab",
        "therapeuticArea": "biologics",
        "title": "Reference protocol for infliximab therapeutic drug monitoring",
        "sections": [
            ("Target levels", "Target trough concentrations should be reviewed against indication, inflammatory activity, and recent response trajectory."),
            ("Referral criteria", "Escalate to the reference center when infliximab levels are subtherapeutic with positive anti-drug antibodies or a strong loss-of-response signal."),
            ("Required evidence", "Attach last infusion timing, biomarker trend, symptom trajectory, and prior optimization attempts before the expert review session."),
            ("Documentation", "Record the validated intervention in the clinical note and classify the learning artifact for network reuse."),
        ],
    },
    {
        "_id": "PROT-USTEKINUMAB-REF-2026",
        "drugName": "Ustekinumab",
        "therapeuticArea": "biologics",
        "title": "Reference protocol for ustekinumab therapeutic monitoring",
        "sections": [
            ("Target levels", "Maintenance exposure should be interpreted together with disease activity and recent interval adjustments."),
            ("Referral criteria", "Send cases to the reference center when trough concentration is below target with persistent biochemical activity or uncertain interval strategy."),
            ("Required evidence", "Include dosing interval, the last symptom assessment, and biomarker context in the referral packet."),
            ("Documentation", "Convert validated recommendations into structured knowledge products for later comparison."),
        ],
    },
    {
        "_id": "PROT-ADALIMUMAB-REF-2026",
        "drugName": "Adalimumab",
        "therapeuticArea": "biologics",
        "title": "Reference protocol for adalimumab therapeutic monitoring",
        "sections": [
            ("Target levels", "Trough interpretation should balance disease state, interval changes, and confirmed adherence."),
            ("Referral criteria", "Seek reference review when low adalimumab levels coexist with loss-of-response suspicion or conflicting local interpretation."),
            ("Required evidence", "Provide recent biomarkers, treatment history, administration timing, and protocol deviations."),
            ("Documentation", "Validated intervention notes must distinguish between local action and reference-center endorsement."),
        ],
    },
    {
        "_id": "PROT-VANCOMYCIN-REF-2026",
        "drugName": "Vancomycin",
        "therapeuticArea": "antibiotics",
        "title": "Reference protocol for vancomycin PK review",
        "sections": [
            ("Target levels", "Review vancomycin trough or exposure estimates together with renal function and sampling time quality."),
            ("Referral criteria", "Escalate urgently when supratherapeutic levels coincide with renal decline or timing uncertainty."),
            ("Required evidence", "Collect sampling timestamp, infusion timing, serum creatinine trend, and the current infection context."),
            ("Documentation", "Flag urgent recommendations clearly and register the decision path for auditability."),
        ],
    },
    {
        "_id": "PROT-TACROLIMUS-REF-2026",
        "drugName": "Tacrolimus",
        "therapeuticArea": "immunosuppressants",
        "title": "Reference protocol for tacrolimus variability review",
        "sections": [
            ("Target levels", "Interpret tacrolimus targets according to transplant context, time from transplant, and toxicity profile."),
            ("Referral criteria", "Escalate cases with sustained variability, renal concern, or unresolved adherence questions."),
            ("Required evidence", "Attach complete trough history, interacting drugs, renal function trend, and administration schedule."),
            ("Documentation", "Document validated stabilization plans as reusable intervention patterns."),
        ],
    },
    {
        "_id": "PROT-VORICONAZOLE-REF-2026",
        "drugName": "Voriconazole",
        "therapeuticArea": "antifungals",
        "title": "Reference protocol for voriconazole TDM",
        "sections": [
            ("Target levels", "Interpret voriconazole levels against antifungal indication, liver tolerance, and microbiology context."),
            ("Referral criteria", "Request reference review when exposure is outside range or safety markers deteriorate."),
            ("Required evidence", "Include liver-function trend, antifungal indication, and timing of the last level."),
            ("Documentation", "Preserve validated safety rationale as a network learning object."),
        ],
    },
    {
        "_id": "PROT-LEVETIRACETAM-REF-2026",
        "drugName": "Levetiracetam",
        "therapeuticArea": "antiepileptics",
        "title": "Reference protocol for antiepileptic exposure review",
        "sections": [
            ("Target levels", "Interpret antiepileptic levels together with breakthrough symptoms and administration reliability."),
            ("Referral criteria", "Escalate when subtherapeutic exposure is accompanied by breakthrough symptoms or unclear adherence."),
            ("Required evidence", "Send the seizure log, dose chronology, and the most recent specialist context."),
            ("Documentation", "Translate the expert decision into a concise ward-ready intervention note."),
        ],
    },
]


def _load_json_rows(filename: str) -> list[dict[str, Any]]:
    path = SUPPLEMENTAL_DATA_DIR / filename
    if not path.exists():
        return []
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []
    return payload if isinstance(payload, list) else []


def _normalize_text(value: str | None) -> str:
    return str(value or "").strip().lower()


def _build_users(hospitals: list[dict[str, Any]]) -> list[dict[str, Any]]:
    defaults = [
        {"_id": "USR-REF-001", "name": "Reference PK/PD Pharmacist A", "role": "reference_pharmacist", "hospitalId": PKPD_REFERENCE_HOSPITAL_ID},
        {"_id": "USR-REF-002", "name": "Reference PK/PD Pharmacist B", "role": "reference_pharmacist", "hospitalId": PKPD_REFERENCE_HOSPITAL_ID},
        {"_id": "USR-REF-003", "name": "Reference Clinical Pharmacologist", "role": "clinical_pharmacologist", "hospitalId": PKPD_REFERENCE_HOSPITAL_ID},
        {"_id": "USR-REF-004", "name": "Reference Antimicrobial Pharmacist", "role": "reference_pharmacist", "hospitalId": PKPD_REFERENCE_HOSPITAL_ID},
        {"_id": "USR-REF-005", "name": "Reference Oncology Pharmacist", "role": "reference_pharmacist", "hospitalId": PKPD_REFERENCE_HOSPITAL_ID},
    ]
    for hospital in hospitals:
        if hospital.get("_id") == PKPD_REFERENCE_HOSPITAL_ID:
            continue
        defaults.append(
            {
                "_id": f"USR-{hospital['_id']}-LOCAL",
                "name": f"Local PK/PD Pharmacist · {hospital['city']}",
                "role": "local_pharmacist",
                "hospitalId": hospital["_id"],
            }
        )

    merged = {row["_id"]: row for row in defaults}
    for row in _load_json_rows("users.json"):
        if row.get("_id"):
            merged[row["_id"]] = {**merged.get(row["_id"], {}), **row}
    return [merged[key] for key in sorted(merged)]


def _fallback_drug_entry(blueprint: DrugBlueprint) -> dict[str, Any]:
    return {
        "_id": f"DRUG-{blueprint.drug_name.upper()}",
        "name": blueprint.drug_name,
        "normalizedName": _normalize_text(blueprint.drug_name),
        "class": humanize_class(blueprint.therapeutic_area),
        "therapeuticArea": blueprint.therapeutic_area,
        "monitoringType": "therapeutic_drug_monitoring",
        "aliases": [],
        "typicalPkpdSignals": list(blueprint.risk_signals),
        "unit": blueprint.unit,
        "targetRange": {"min": blueprint.target_min, "max": blueprint.target_max},
        "terminology": {
            "rxnormRxcui": None,
            "atc": None,
            "sourceNote": "Fallback demo entry generated locally because the supplemental drug dictionary was unavailable.",
        },
    }


def humanize_class(value: str) -> str:
    return value.replace("_", " ").rstrip("s")


def _build_drug_dictionary() -> list[dict[str, Any]]:
    source_rows = {
        _normalize_text(row.get("name") or row.get("normalizedName")): row
        for row in _load_json_rows("drug_dictionary.json")
        if row.get("name") or row.get("normalizedName")
    }
    documents: list[dict[str, Any]] = []
    for blueprint in DRUG_BLUEPRINTS.values():
        key = _normalize_text(blueprint.drug_name)
        row = dict(source_rows.get(key) or _fallback_drug_entry(blueprint))
        row.setdefault("normalizedName", key)
        row.setdefault("therapeuticArea", blueprint.therapeutic_area)
        row.setdefault("monitoringType", "therapeutic_drug_monitoring")
        row.setdefault("unit", blueprint.unit)
        row.setdefault("targetRange", {"min": blueprint.target_min, "max": blueprint.target_max})
        documents.append(row)
    return documents


def _build_observation_dictionary() -> list[dict[str, Any]]:
    rows = _load_json_rows("observation_dictionary.json")
    if rows:
        return rows
    return [
        {
            "_id": "OBS-DRUG-LEVEL",
            "name": "Drug level / concentration",
            "category": "pkpd",
            "allowedUnits": ["ug/mL", "mg/L", "ng/mL"],
            "usedFor": ["therapeutic_drug_monitoring"],
            "terminology": {"loinc": None},
        },
        {
            "_id": "OBS-ANTI-DRUG-AB",
            "name": "Anti-drug antibodies",
            "category": "immunogenicity",
            "allowedUnits": ["positive/negative", "AU/mL"],
            "usedFor": ["biologic_loss_of_response"],
            "terminology": {"loinc": None},
        },
        {
            "_id": "OBS-CREATININE",
            "name": "Creatinine",
            "category": "renal_function",
            "allowedUnits": ["mg/dL", "umol/L"],
            "usedFor": ["renal_clearance", "toxicity_risk"],
            "terminology": {"loinc": None},
        },
    ]


def _build_unit_dictionary() -> list[dict[str, Any]]:
    rows = _load_json_rows("unit_dictionary.json")
    if rows:
        return rows
    return [
        {"_id": "UNIT-UG-ML", "ucum": "ug/mL", "display": "microgram per milliliter", "category": "concentration"},
        {"_id": "UNIT-MG-L", "ucum": "mg/L", "display": "milligram per liter", "category": "concentration"},
        {"_id": "UNIT-NG-ML", "ucum": "ng/mL", "display": "nanogram per milliliter", "category": "concentration"},
    ]


def _fallback_official_document(blueprint: DrugBlueprint) -> dict[str, Any]:
    return {
        "_id": f"REGDOC-{blueprint.drug_name.upper()}-DEMO",
        "drugName": blueprint.drug_name,
        "documentType": "official_drug_information_manifest",
        "status": "download_required",
        "preferredSources": [
            {"source": "EMA", "sourceType": "download_medicine_data", "url": "https://www.ema.europa.eu/en/medicines/download-medicine-data"},
            {"source": "AEMPS CIMA", "sourceType": "cima_rest_api", "url": "https://cima.aemps.es/cima/resources/docs/CIMA_REST_API.pdf"},
            {"source": "DailyMed", "sourceType": "spl_all_drug_labels", "url": "https://dailymed.nlm.nih.gov/dailymed/spl-resources-all-drug-labels.cfm"},
            {"source": "openFDA", "sourceType": "drug_label_api", "url": "https://open.fda.gov/apis/drug/label/"},
        ],
        "demoExtract": {
            "notice": "This is synthetic placeholder text for app development. Replace with official product information from EMA, AEMPS CIMA, DailyMed or openFDA.",
            "sections": [
                {"heading": "Indications and usage", "text": f"Synthetic demo section for {blueprint.drug_name}."},
                {"heading": "Monitoring considerations", "text": "Synthetic demo section to be replaced with official label and local protocol content."},
            ],
        },
        "synthetic": True,
    }


def _build_official_drug_information() -> list[dict[str, Any]]:
    source_rows = {
        _normalize_text(row.get("drugName")): row
        for row in _load_json_rows("official_drug_information_manifest.json")
        if row.get("drugName")
    }
    documents: list[dict[str, Any]] = []
    for blueprint in DRUG_BLUEPRINTS.values():
        row = dict(source_rows.get(_normalize_text(blueprint.drug_name)) or _fallback_official_document(blueprint))
        row.setdefault("drugName", blueprint.drug_name)
        row.setdefault("documentType", "official_drug_information_manifest")
        row.setdefault("status", "download_required")
        row.setdefault("synthetic", True)
        documents.append(row)
    return documents


def _local_protocol_sections(drug_name: str) -> list[tuple[str, str]]:
    if drug_name == "Infliximab":
        return [
            ("Target levels", "Local teams review the same target window but may repeat a trough sample if the patient is clinically stable before requesting Bellvitge review."),
            ("Referral criteria", "Escalate after one local verification step unless anti-drug antibodies are positive or the inflammatory picture is worsening, in which case Bellvitge review should be requested directly."),
            ("Required evidence", "Attach infusion chronology, the latest inflammatory trend, anti-drug antibody result, and the local response assessment used before referral."),
            ("Documentation", "Document both the local interpretation and whether Bellvitge validation was requested in the same review packet."),
        ]
    if drug_name == "Vancomycin":
        return [
            ("Target levels", "Local review uses the same exposure window but requires explicit confirmation of sampling quality before interpretation."),
            ("Referral criteria", "Bellvitge escalation is immediate when supratherapeutic levels coincide with renal decline; otherwise local teams may repeat sampling once if timing quality is uncertain."),
            ("Required evidence", "Attach infusion time, blood-draw time, serum creatinine trend, infection context, and the local dosing record."),
            ("Documentation", "Record whether timing quality was confirmed locally and whether Bellvitge urgent review was triggered."),
        ]
    return [
        ("Target levels", "Local interpretation follows the network reference range but allows one structured local check before escalation when the patient is clinically stable."),
        ("Referral criteria", "Bellvitge review is requested when the reference criteria are met or when local interpretation remains uncertain after the first structured review."),
        ("Required evidence", "Attach dose chronology, the latest relevant biomarker trend, and the local interpretation note prepared before escalation."),
        ("Documentation", "Record the local protocol view alongside any Bellvitge confirmation so the decision path remains auditable."),
    ]


def _iso(value: datetime) -> str:
    return value.astimezone(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _event_time(case_index: int, offset_days: int, hour: int, minute: int) -> str:
    baseline = PKPD_DEMO_ANCHOR - timedelta(days=(case_index % 15) + max(offset_days, 0))
    exact = baseline.replace(hour=hour, minute=minute, second=0, microsecond=0)
    return _iso(exact)


def _pseudo_id(index: int) -> str:
    return f"PSEUDO-{10200 + index}"


def _priority_from_blueprint(drug_name: str, case_index: int) -> str:
    if drug_name == "Vancomycin":
        return "high"
    if drug_name in {"Infliximab", "Tacrolimus"} and case_index % 3 != 0:
        return "high"
    if case_index % 5 == 0:
        return "medium"
    return "high" if case_index % 4 == 0 else "medium"


def _status_from_case_index(case_index: int) -> str:
    if case_index < 6:
        return "urgent_review"
    if case_index < 18:
        return "pending_reference_review"
    if case_index < 28:
        return "local_review"
    if case_index < 48:
        return "validated"
    if case_index < 64:
        return "resolved"
    return "closed"


def _priority_explanation(blueprint: DrugBlueprint, hospital_name: str) -> str:
    return (
        f"This case is surfaced for {hospital_name} because deterministic triage detected "
        f"{', '.join(signal.replace('_', ' ') for signal in blueprint.risk_signals[:2])} "
        f"for {blueprint.drug_name.lower()} and the reference protocol recommends rapid review."
    )


def _build_hospitals() -> list[dict[str, Any]]:
    hospitals: list[dict[str, Any]] = [
        {
            "_id": PKPD_REFERENCE_HOSPITAL_ID,
            "name": "Bellvitge University Hospital",
            "role": "reference_center",
            "networkId": PKPD_NETWORK_ID,
            "capabilities": [
                "pkpd_expert_review",
                "biologics",
                "antibiotics",
                "antifungals",
                "antiepileptics",
                "immunosuppressants",
            ],
            "geo": {"lat": 41.343, "lon": 2.108},
            "city": "L'Hospitalet de Llobregat",
            "responseTimeHours": 7.2,
            "clinicalScope": list(sorted(set(THERAPEUTIC_AREAS.values()))),
        }
    ]

    for entry in SATELLITE_HOSPITALS:
        hospitals.append(
            {
                "_id": entry["_id"],
                "name": entry["name"],
                "role": "satellite_center",
                "networkId": PKPD_NETWORK_ID,
                "capabilities": ["case_detection", "local_protocol_execution", "bi_weekly_review"],
                "geo": {"lat": entry["lat"], "lon": entry["lon"]},
                "city": entry["city"],
                "responseTimeHours": 12.0,
                "clinicalScope": list(sorted(set(THERAPEUTIC_AREAS.values()))),
            }
        )
    return hospitals


def _build_network_document() -> dict[str, Any]:
    return {
        "_id": PKPD_NETWORK_ID,
        "name": "PK/PD Nexus AI",
        "referenceHospitalId": PKPD_REFERENCE_HOSPITAL_ID,
        "referenceHospitalName": "Bellvitge University Hospital",
        "datasetVersion": PKPD_DATASET_VERSION,
        "positioning": "AI drafts, retrieves, summarizes, and explains. Clinicians decide.",
        "story": {
            "centers": 10,
            "legalAgreement": True,
            "operationalSince": "2025-05-01",
            "workingModel": "bi_weekly",
            "directInterventions": 119,
            "requestShareByMedicalTeams": 72,
            "drugHighlights": [
                {"drugName": "Infliximab", "cases": 64},
                {"drugName": "Ustekinumab", "cases": 28},
                {"drugName": "Adalimumab", "cases": 19},
            ],
            "therapeuticScope": [
                "Biologics",
                "Antibiotics",
                "Antifungals",
                "Antiepileptics",
                "Immunosuppressants",
            ],
        },
        "createdAt": _iso(PKPD_DEMO_ANCHOR),
        "updatedAt": _iso(PKPD_DEMO_ANCHOR),
    }


def _build_protocol_documents() -> list[dict[str, Any]]:
    documents: list[dict[str, Any]] = []
    created_at = _iso(PKPD_DEMO_ANCHOR)
    for item in PROTOCOL_LIBRARY:
        documents.append(
            {
                "_id": item["_id"],
                "title": item["title"],
                "hospitalId": PKPD_REFERENCE_HOSPITAL_ID,
                "networkId": PKPD_NETWORK_ID,
                "drugName": item["drugName"],
                "therapeuticArea": item["therapeuticArea"],
                "version": "2026.1",
                "status": "active",
                "approved": True,
                "sections": [{"heading": heading, "text": text} for heading, text in item["sections"]],
                "createdAt": created_at,
                "updatedAt": created_at,
            }
        )
        for hospital in SATELLITE_HOSPITALS:
            documents.append(
                {
                    "_id": f"{item['_id']}-{hospital['_id']}",
                    "title": f"Local protocol for {item['drugName']} review - {hospital['name']}",
                    "hospitalId": hospital["_id"],
                    "networkId": PKPD_NETWORK_ID,
                    "drugName": item["drugName"],
                    "therapeuticArea": item["therapeuticArea"],
                    "version": "2026.1-local",
                    "status": "active",
                    "approved": True,
                    "scope": "local_variant",
                    "parentProtocolId": item["_id"],
                    "sections": [{"heading": heading, "text": text} for heading, text in _local_protocol_sections(item["drugName"])],
                    "createdAt": created_at,
                    "updatedAt": created_at,
                }
            )
    return documents


def _build_retrieval_chunks(protocols: list[dict[str, Any]]) -> list[dict[str, Any]]:
    chunks: list[dict[str, Any]] = []
    chunk_counter = 1
    variants = [
        "Deterministic signal",
        "Reference escalation",
        "Evidence packet",
        "Documentation pattern",
    ]
    for protocol in protocols:
        variants = (
            ["Deterministic signal", "Reference escalation", "Evidence packet", "Documentation pattern"]
            if protocol.get("hospitalId") == PKPD_REFERENCE_HOSPITAL_ID
            else ["Local workflow", "Escalation threshold", "Evidence packet", "Documentation pattern"]
        )
        for section in protocol["sections"]:
            for variant in variants:
                chunks.append(
                    {
                        "_id": f"CHUNK-{chunk_counter:04d}",
                        "sourceType": "protocol",
                        "sourceId": protocol["_id"],
                        "networkId": PKPD_NETWORK_ID,
                        "drugName": protocol["drugName"],
                        "therapeuticArea": protocol["therapeuticArea"],
                        "hospitalId": protocol["hospitalId"],
                        "chunkText": (
                            f"{variant}. {section['heading']}: {section['text']} "
                            f"For PK/PD Nexus AI, keep deterministic metadata filters ahead of semantic reranking."
                        ),
                        "metadata": {
                            "version": protocol["version"],
                            "section": section["heading"],
                            "approved": True,
                            "variant": variant,
                        },
                    }
                )
                chunk_counter += 1

    network_chunks = [
        "Every validated expert decision becomes a reusable network learning object.",
        "The queue is prioritized deterministically first and narrated by AI second.",
        "Reference-center review packets must include protocol match, similar cases, and missing data.",
        "The mobile workflow supports review, escalation, and closure without autonomous prescribing.",
    ]
    for text in network_chunks:
        chunks.append(
            {
                "_id": f"CHUNK-{chunk_counter:04d}",
                "sourceType": "network_guidance",
                "sourceId": PKPD_NETWORK_ID,
                "networkId": PKPD_NETWORK_ID,
                "drugName": None,
                "therapeuticArea": "network_operations",
                "hospitalId": PKPD_REFERENCE_HOSPITAL_ID,
                "chunkText": text,
                "metadata": {"version": "2026.1", "section": "Network operations", "approved": True},
            }
        )
        chunk_counter += 1

    return chunks


def _build_patients(fhir_patients: list[dict[str, Any]]) -> list[dict[str, Any]]:
    hospitals = [entry["_id"] for entry in SATELLITE_HOSPITALS]
    patients: list[dict[str, Any]] = []
    for index, row in enumerate(fhir_patients):
        clinical_backbone = row.get("clinicalBackbone") or "general_clinical"
        patients.append(
            {
                "_id": _pseudo_id(index),
                "source": "synthea_breast_cancer_fhir_demo" if clinical_backbone == "breast_oncology" else "synthea_longitudinal_fhir_demo",
                "syntheaPatientRef": row["patientRef"],
                "demographics": {
                    "age": row.get("age"),
                    "sex": row.get("sex"),
                    "displayName": row.get("name"),
                },
                "clinicalBackbone": clinical_backbone,
                "oncologySignals": row.get("oncologySignals") or [],
                "conditions": [
                    {
                        "code": "breast_oncology_history" if clinical_backbone == "breast_oncology" else "longitudinal_hospital_history",
                        "display": (
                            "Breast oncology longitudinal history"
                            if clinical_backbone == "breast_oncology"
                            else "Longitudinal hospital history from the shared FHIR dataset"
                        ),
                        "status": "history",
                    }
                ],
                "homeHospitalId": hospitals[index % len(hospitals)],
            }
        )
    return patients


def _build_case(
    *,
    case_index: int,
    patient: dict[str, Any],
    origin_hospital: dict[str, Any],
    blueprint: DrugBlueprint,
    protocol_id: str,
    rng: Random,
) -> dict[str, Any]:
    priority = _priority_from_blueprint(blueprint.drug_name, case_index)
    status = _status_from_case_index(case_index)
    level_low = blueprint.target_min * (0.45 + (case_index % 5) * 0.12)
    level_high = blueprint.target_max * (1.08 + (case_index % 3) * 0.08)
    level_value = round(level_high if blueprint.drug_name == "Vancomycin" else level_low, 2)
    biomarker_value = round(15 + (case_index % 6) * 3.2, 1)
    creatinine_value = round(0.92 + (case_index % 4) * 0.22, 2)
    dose_value = 250 + (case_index % 4) * 75
    level_label = "subtherapeutic" if blueprint.drug_name != "Vancomycin" else "supratherapeutic"
    case_id = f"PKPD-2026-{case_index + 1:05d}"
    created_at = _event_time(case_index, 0, 8 + (case_index % 4), 15)
    updated_at = _event_time(case_index, 0, 11 + (case_index % 5), 40)

    collaboration_comments = [
        {
            "author": "Local pharmacist",
            "timestamp": _event_time(case_index, 1, 10, 5),
            "text": f"Local team flagged {blueprint.drug_name.lower()} case after deterministic queue review.",
        }
    ]
    if priority == "high":
        collaboration_comments.append(
            {
                "author": "Reference coordinator",
                "timestamp": _event_time(case_index, 0, 12, 20),
                "text": "Added to the next Bellvitge expert-review slot and requested missing context package.",
            }
        )

    patient_name = ((patient.get("demographics") or {}).get("displayName")) or patient["_id"]
    patient_age = (patient.get("demographics") or {}).get("age")
    patient_sex = (patient.get("demographics") or {}).get("sex") or "female"
    summary = (
        f"{patient_name} from {origin_hospital['name']} shows a {level_label} "
        f"{blueprint.drug_name.lower()} level, {blueprint.biomarker_name.lower()} activity, and "
        f"requires network review."
    )

    timeline = [
        {
            "type": "dose",
            "datetime": _event_time(case_index, 14, 9, 0),
            "drug": blueprint.drug_name,
            "doseMg": dose_value,
        },
        {
            "type": "level",
            "datetime": _event_time(case_index, 2, 8, 30),
            "drug": blueprint.drug_name,
            "value": level_value,
            "unit": blueprint.unit,
        },
        {
            "type": "biomarker",
            "datetime": _event_time(case_index, 2, 8, 45),
            "name": blueprint.biomarker_name,
            "value": biomarker_value,
            "unit": "mg/L" if blueprint.biomarker_name not in {"Seizure log"} else "events",
        },
        {
            "type": "renal_function",
            "datetime": _event_time(case_index, 2, 8, 50),
            "name": "Creatinine",
            "value": creatinine_value,
            "unit": "mg/dL",
        },
    ]
    if "positive_antidrug_antibodies" in blueprint.risk_signals:
        timeline.insert(
            2,
            {
                "type": "antibody",
                "datetime": _event_time(case_index, 2, 8, 40),
                "name": "Anti-drug antibodies",
                "value": "positive",
                "unit": None,
            },
        )

    return {
        "_id": case_id,
        "networkId": PKPD_NETWORK_ID,
        "originHospitalId": origin_hospital["_id"],
        "referenceHospitalId": PKPD_REFERENCE_HOSPITAL_ID,
        "patientId": patient["_id"],
        "syntheaPatientRef": patient.get("syntheaPatientRef"),
        "patientSnapshot": {
            "displayName": patient_name,
            "age": patient_age,
            "sex": patient_sex,
        },
        "therapeuticArea": blueprint.therapeutic_area,
        "drugName": blueprint.drug_name,
        "protocolId": protocol_id,
        "status": status,
        "priority": priority,
        "caseReason": blueprint.hero_reason,
        "clinicalQuestion": blueprint.intervention_template,
        "timeline": timeline,
        "targets": {
            "levelMin": blueprint.target_min,
            "levelMax": blueprint.target_max,
            "unit": blueprint.unit,
        },
        "riskSignals": list(blueprint.risk_signals),
        "priorityFactors": [
            "same_drug_protocol_match",
            "risk_threshold_crossed",
            "reference_center_required" if priority == "high" else "local_review_possible",
        ],
        "ai": {
            "caseSummary": summary,
            "missingData": ["albumin", "latest symptom score"] if case_index % 2 == 0 else ["last administration confirmation"],
            "explanation": _priority_explanation(blueprint, origin_hospital["name"]),
        },
        "collaboration": {
            "assignedTeam": "reference_pkpd_team" if priority == "high" else "local_pkpd_team",
            "comments": collaboration_comments,
            "decisionStatus": "awaiting_expert_validation" if status in {"urgent_review", "pending_reference_review"} else "prepared",
        },
        "semanticQuery": (
            f"{blueprint.drug_name} {blueprint.therapeutic_area} "
            f"{' '.join(blueprint.risk_signals)} {origin_hospital['city']}"
        ),
        "impactStory": blueprint.similar_hint,
        "createdAt": created_at,
        "updatedAt": updated_at,
        "sortOrder": case_index + 1,
        "storyFlags": {
            "heroCase": case_index in {0, 1, 2, 3},
            "usesReferenceWorkflow": priority == "high",
            "hasValidatedLearning": status in {"validated", "resolved", "closed"},
        },
    }


def _build_cases(patients: list[dict[str, Any]], hospitals: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rng = Random(26)
    satellite_pool = [entry for entry in hospitals if entry["_id"] != PKPD_REFERENCE_HOSPITAL_ID]
    protocols_by_drug = {entry["drugName"]: entry["_id"] for entry in _build_protocol_documents()}
    remaining = dict(CASE_DISTRIBUTION)
    case_order: list[str] = []
    while any(total > 0 for total in remaining.values()):
        for drug_name in CASE_SEQUENCE:
            if remaining.get(drug_name, 0) <= 0:
                continue
            case_order.append(drug_name)
            remaining[drug_name] -= 1

    cases: list[dict[str, Any]] = []
    patient_index = 0
    for drug_name in case_order:
        blueprint = DRUG_BLUEPRINTS[drug_name]
        patient = patients[patient_index % len(patients)]
        origin_hospital = satellite_pool[(patient_index + len(cases)) % len(satellite_pool)]
        cases.append(
            _build_case(
                case_index=len(cases),
                patient=patient,
                origin_hospital=origin_hospital,
                blueprint=blueprint,
                protocol_id=protocols_by_drug[drug_name],
                rng=rng,
            )
        )
        patient_index += 1
    return cases


def _build_expert_interventions(cases: list[dict[str, Any]]) -> list[dict[str, Any]]:
    interventions: list[dict[str, Any]] = []
    for index, case in enumerate(cases[18:48]):
        signals = ", ".join(signal.replace("_", " ") for signal in (case.get("riskSignals") or [])[:3])
        interventions.append(
            {
                "_id": f"INT-{991 + index:06d}",
                "caseId": case["_id"],
                "networkId": PKPD_NETWORK_ID,
                "expertUserId": f"USR-REF-{(index % 5) + 1:03d}",
                "decisionType": "treatment_optimization_recommendation",
                "decisionSummary": (
                    f"Validated {case['drugName'].lower()} review with protocol-aligned follow-up "
                    f"for {case['originHospitalId']} after reviewing {signals}."
                ),
                "rationale": (
                    f"Decision grounded in the reference {case['drugName']} protocol, deterministic signal review, "
                    f"and previously validated cases with overlapping risk signals from the Bellvitge network."
                ),
                "status": "validated",
                "createdAt": case["updatedAt"],
            }
        )
    return interventions


def _knowledge_product_content(case: dict[str, Any], product_type: str) -> dict[str, Any]:
    priority = str(case.get("priority") or "medium").lower()
    signals = [signal.replace("_", " ") for signal in case.get("riskSignals") or []]
    signal_text = ", ".join(signals[:3]) if signals else "no major signal pattern detected"
    next_step = "expert_review_required" if priority == "high" else "local_follow_up"
    protocol_slug = str(case.get("protocolId") or "").replace("PROT-", "").replace("-REF-2026", "").replace("-", " ")

    if product_type == "case_summary_card":
        headline = case["ai"]["caseSummary"]
        supporting = f"{case['patientSnapshot']['displayName']} originated from {case['originHospitalId']} and is routed into the collaborative review workflow."
    elif product_type == "pkpd_risk_profile":
        headline = f"{case['priority'].title()} priority because {signal_text}."
        supporting = "Priority is computed deterministically before any LLM draft is generated."
    elif product_type == "protocol_match_card":
        headline = f"Reference {protocol_slug.title()} protocol matched for trusted escalation criteria."
        supporting = "Protocol evidence is filtered to approved network content and then ranked inside that subset."
    elif product_type == "similar_case_bundle":
        headline = f"Validated precedents are available for the {case['drugName'].lower()} signal pattern."
        supporting = "Similar-case retrieval stays inside historical Bellvitge-network decisions rather than generic external examples."
    elif product_type == "intervention_note_draft":
        headline = f"Draft intervention note prepared for {case['drugName'].lower()} with expert validation pending."
        supporting = "This artifact is documentation support only and is not a prescribing action."
    else:
        headline = case["ai"]["caseSummary"]
        supporting = "Reusable knowledge artifact prepared for the network learning layer."

    return {
        "headline": headline,
        "supportingText": supporting,
        "clinicalQuestion": case["clinicalQuestion"],
        "keySignals": case["riskSignals"],
        "recommendedNextStep": next_step,
    }


def _build_knowledge_products(cases: list[dict[str, Any]]) -> list[dict[str, Any]]:
    documents: list[dict[str, Any]] = []
    product_types = [
        "case_summary_card",
        "pkpd_risk_profile",
        "protocol_match_card",
        "similar_case_bundle",
        "intervention_note_draft",
    ]
    for case in cases[:16]:
        for offset, product_type in enumerate(product_types, start=1):
            content = _knowledge_product_content(case, product_type)
            documents.append(
                {
                    "_id": f"KP-{case['_id']}-{product_type.upper()}",
                    "caseId": case["_id"],
                    "networkId": PKPD_NETWORK_ID,
                    "type": product_type,
                    "version": 1,
                    "status": "draft" if product_type == "intervention_note_draft" else "generated",
                    "generatedBy": "llm",
                    "validatedBy": None,
                    "content": {**content, "artifactIndex": offset},
                    "createdAt": case["updatedAt"],
                }
            )
    return documents


def build_pkpd_demo_dataset() -> dict[str, list[dict[str, Any]]]:
    fhir_patients = fetch_fhir_patient_refs(limit=40)
    if not fhir_patients:
        raise RuntimeError("No FHIR patients were found for the PK/PD demo seed.")

    hospitals = _build_hospitals()
    users = _build_users(hospitals)
    protocols = _build_protocol_documents()
    patients = _build_patients(fhir_patients)
    cases = _build_cases(patients, hospitals)
    retrieval_chunks = _build_retrieval_chunks(protocols)
    expert_interventions = _build_expert_interventions(cases)
    knowledge_products = _build_knowledge_products(cases)
    drug_dictionary = _build_drug_dictionary()
    observation_dictionary = _build_observation_dictionary()
    unit_dictionary = _build_unit_dictionary()
    official_drug_information = _build_official_drug_information()

    return {
        PKPD_COLLECTIONS["networks"]: [_build_network_document()],
        PKPD_COLLECTIONS["hospitals"]: hospitals,
        PKPD_COLLECTIONS["users"]: users,
        PKPD_COLLECTIONS["patients"]: patients,
        PKPD_COLLECTIONS["cases"]: cases,
        PKPD_COLLECTIONS["protocols"]: protocols,
        PKPD_COLLECTIONS["retrieval_chunks"]: retrieval_chunks,
        PKPD_COLLECTIONS["knowledge_products"]: knowledge_products,
        PKPD_COLLECTIONS["expert_interventions"]: expert_interventions,
        PKPD_COLLECTIONS["drug_dictionary"]: drug_dictionary,
        PKPD_COLLECTIONS["observation_dictionary"]: observation_dictionary,
        PKPD_COLLECTIONS["unit_dictionary"]: unit_dictionary,
        PKPD_COLLECTIONS["official_drug_information"]: official_drug_information,
    }


def ensure_pkpd_indexes() -> None:
    db = get_database()
    db[PKPD_COLLECTIONS["cases"]].create_index([("networkId", 1), ("status", 1), ("priority", 1)])
    db[PKPD_COLLECTIONS["cases"]].create_index([("originHospitalId", 1), ("status", 1)])
    db[PKPD_COLLECTIONS["cases"]].create_index([("drugName", 1), ("therapeuticArea", 1)])
    db[PKPD_COLLECTIONS["cases"]].create_index([("patientId", 1), ("createdAt", -1)])
    db[PKPD_COLLECTIONS["protocols"]].create_index([("drugName", 1), ("status", 1), ("hospitalId", 1)])
    db[PKPD_COLLECTIONS["knowledge_products"]].create_index([("caseId", 1), ("type", 1), ("version", -1)])
    db[PKPD_COLLECTIONS["retrieval_chunks"]].create_index([("drugName", 1), ("therapeuticArea", 1), ("hospitalId", 1)])
    db[PKPD_COLLECTIONS["expert_interventions"]].create_index([("caseId", 1), ("createdAt", -1)])
    db[PKPD_COLLECTIONS["users"]].create_index([("hospitalId", 1), ("role", 1)])
    db[PKPD_COLLECTIONS["drug_dictionary"]].create_index([("normalizedName", 1)])
    db[PKPD_COLLECTIONS["official_drug_information"]].create_index([("drugName", 1), ("status", 1)])


def seed_pkpd_demo_dataset() -> dict[str, Any]:
    db = get_database()
    dataset = build_pkpd_demo_dataset()
    stats: dict[str, Any] = {"collections": {}}

    for collection_name, rows in dataset.items():
        collection = db[collection_name]
        operations = [ReplaceOne({"_id": row["_id"]}, row, upsert=True) for row in rows]
        if operations:
            collection.bulk_write(operations, ordered=False)
        stats["collections"][collection_name] = len(rows)

    ensure_pkpd_indexes()
    stats["datasetVersion"] = PKPD_DATASET_VERSION
    return stats


def ensure_pkpd_demo_dataset() -> dict[str, Any]:
    db = get_database()
    cases_collection = db[PKPD_COLLECTIONS["cases"]]
    had_existing_data = cases_collection.estimated_document_count() > 0
    network_doc = db[PKPD_COLLECTIONS["networks"]].find_one({"_id": PKPD_NETWORK_ID}, {"datasetVersion": 1})
    current_version = (network_doc or {}).get("datasetVersion")

    if had_existing_data and current_version == PKPD_DATASET_VERSION:
        return {
            "seeded": False,
            "datasetVersion": PKPD_DATASET_VERSION,
            "collections": {
                PKPD_COLLECTIONS["cases"]: cases_collection.estimated_document_count(),
                PKPD_COLLECTIONS["patients"]: db[PKPD_COLLECTIONS["patients"]].estimated_document_count(),
                PKPD_COLLECTIONS["protocols"]: db[PKPD_COLLECTIONS["protocols"]].estimated_document_count(),
            },
        }

    stats = seed_pkpd_demo_dataset()
    return {
        "seeded": True,
        "reseeded": had_existing_data and current_version != PKPD_DATASET_VERSION,
        **stats,
    }


def summarize_case_mix(cases: list[dict[str, Any]]) -> dict[str, Any]:
    by_priority = Counter(case.get("priority") or "unknown" for case in cases)
    by_status = Counter(case.get("status") or "unknown" for case in cases)
    by_drug = Counter(case.get("drugName") or "unknown" for case in cases)
    return {
        "priorities": dict(by_priority),
        "statuses": dict(by_status),
        "drugs": dict(by_drug),
    }
