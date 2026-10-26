"""Deterministic PK/PD rules engine for the Xarxa PK/PD network.

Implements the empirical dosing rules documented by the hospital network:

- Voriconazole: dose diagram by Cmin band (target 1-5.5 mg/L)
- Linezolid: %T>MIC >85% exposure bands and AUC24/MIC guidance
- Trough targets for the IBD biologics managed by the network

This is decision support only: outputs always require human validation and
never replace a validated Bayesian MIPD engine.
"""

from __future__ import annotations

import re
from typing import Any

ENGINE_ID = "reglas-empiricas-v1"
ENGINE_NOTE = (
    "Soporte a la decisión basado en las reglas empíricas de la red. "
    "No sustituye el modelado bayesiano validado (MIPD). Requiere validación humana."
)

# Trough target ranges (mg/L unless noted) used by the network for IBD biologics
BIOLOGIC_TROUGH_TARGETS = {
    "infliximab": {"target": [3.0, 7.0], "direction": "more_is_better"},
    "adalimumab": {"target": [5.0, 12.0], "direction": "more_is_better"},
    "vedolizumab": {"target": [10.0, 40.0], "direction": "more_is_better"},
    "ustekinumab": {"target": [1.0, 4.5], "direction": "more_is_better"},
}

# Voriconazole empirical dose diagram (Cmin in µg/mL), evaluated top-down
VORICONAZOLE_DIAGRAM = {
    "drug": "voriconazol",
    "source": "Diagrama empírico de la red (HUB Bellvitge)",
    "unit": "µg/mL",
    "target": [1.0, 5.5],
    "rules": [
        {
            "id": "VORI-3",
            "condition": "Cmin > 10 mg/L, o Cmin > 5,5 mg/L con efectos adversos",
            "applies": lambda cmin: cmin > 10,
            "action": "Suspender una dosis y reiniciar con el 50% de la dosis",
        },
        {
            "id": "VORI-2",
            "condition": "Cmin > 5,5 mg/L sin efectos adversos",
            "applies": lambda cmin: 5.5 < cmin <= 10,
            "action": "Disminuir la dosis un 50%",
        },
        {
            "id": "VORI-1",
            "condition": "Cmin < 1 mg/L",
            "applies": lambda cmin: cmin < 1.0,
            "action": "Incrementar la dosis un 100%",
        },
    ],
}

# Linezolid exposure targets for mycobacterial infection, by MIC (mg/L)
LINEZOLID_BANDS = {
    "drug": "linezolid",
    "source": "Objetivos PK/PD de la red para micobacterias no tuberculosas",
    "unit": "mg/L",
    "rules": [
        {
            "id": "LZD-2",
            "condition": "Cmin fuera de 2-7 mg/L con MIC = 1 (objetivo %T>MIC >85%)",
            "applies": lambda cmin, mic: mic <= 1 and not (2.0 <= cmin <= 7.0),
            "action": "Ajustar pauta para mantener Cmin 2-7 mg/L y %T>MIC >85% (AUC24/MIC 80-120)",
        },
        {
            "id": "LZD-5",
            "condition": "Cmin fuera de 5-8 mg/L con MIC = 2 (objetivo %T>MIC >85%)",
            "applies": lambda cmin, mic: 1 < mic <= 2 and not (5.0 <= cmin <= 8.0),
            "action": "Ajustar pauta para mantener Cmin 5-8 mg/L y %T>MIC >85% (AUC24/MIC 80-120)",
        },
        {
            "id": "LZD-TOX",
            "condition": "Cmin > 8 mg/L (riesgo de mielosupresión)",
            "applies": lambda cmin, mic: cmin > 8.0,
            "action": "Reducir dosis/intervalo y vigilar hemograma (toxicidad hematológica)",
        },
    ],
}


def _parse_float(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    match = re.search(r"(\d+(?:[.,]\d+)?)", str(value))
    if not match:
        return None
    return float(match.group(1).replace(",", "."))


def _drug_level_determinants(case: dict) -> list[dict]:
    """Determinants that look like drug levels, newest sample first."""
    levels = []
    for det in case.get("labDeterminants") or []:
        label = str(det.get("label", "")).lower()
        if re.search(r"concentraci[oó]n|nivel", label) and not re.search(r"cim|mic\b", label):
            if _parse_float(det.get("value")) is not None:
                levels.append(det)
    levels.sort(key=lambda det: det.get("sampleDateTime") or "", reverse=True)
    return levels


def _match_drug(case: dict) -> str | None:
    therapy = case.get("therapyContext") or {}
    haystack = " ".join(
        [
            str(therapy.get("currentDrug") or ""),
            str(case.get("clinicalSummary") or ""),
            str((case.get("diseaseContext") or {}).get("diagnosis") or ""),
        ]
    ).lower()
    for drug in ["voriconazol", "linezolid", "infliximab", "adalimumab", "ustekinumab", "vedolizumab"]:
        if drug in haystack:
            return drug
    return None


def evaluate_pkpd_rules(case: dict) -> dict | None:
    """Evaluate the network's empirical rules against the newest drug level.

    Returns None when no rule set applies to the case.
    """
    drug = _match_drug(case)
    if not drug:
        return None

    levels = _drug_level_determinants(case)
    latest = levels[0] if levels else None
    observed = _parse_float(latest.get("value")) if latest else None

    evaluation: dict[str, Any] = {
        "engine": ENGINE_ID,
        "note": ENGINE_NOTE,
        "drug": drug,
        "observed": None,
        "firedRules": [],
        "inTarget": None,
        "recommendationDraft": "",
    }

    if drug == "voriconazol":
        evaluation.update(targetRange=VORICONAZOLE_DIAGRAM["target"], unit=VORICONAZOLE_DIAGRAM["unit"], source=VORICONAZOLE_DIAGRAM["source"])
        if observed is not None and latest:
            evaluation["observed"] = {"value": observed, "sampleDateTime": latest.get("sampleDateTime"), "sampleType": latest.get("sampleType")}
            evaluation["inTarget"] = VORICONAZOLE_DIAGRAM["target"][0] <= observed <= VORICONAZOLE_DIAGRAM["target"][1]
            has_adrs = bool((case.get("caseOutcome") or {}).get("adverseEvents") not in (None, "", "Ninguno relevante", "Ninguno"))
            for rule in VORICONAZOLE_DIAGRAM["rules"]:
                if rule["applies"](observed):
                    if rule["id"] == "VORI-2" and has_adrs:
                        continue  # with ADRs, VORI-3 takes over
                    evaluation["firedRules"].append({"id": rule["id"], "condition": rule["condition"], "action": rule["action"]})
            if evaluation["firedRules"]:
                evaluation["recommendationDraft"] = " ".join(rule["action"] for rule in evaluation["firedRules"])
            elif evaluation["inTarget"]:
                evaluation["recommendationDraft"] = "Mantener pauta actual con control de Cmin programado (en objetivo)."

    elif drug == "linezolid":
        evaluation.update(targetRange=[2.0, 7.0], unit=LINEZOLID_BANDS["unit"], source=LINEZOLID_BANDS["source"])
        mic = None
        for det in case.get("labDeterminants") or []:
            label_lower = str(det.get("label", "")).lower()
            if re.search(r"cim|mic", label_lower) and "linezolid" in label_lower:
                if re.search(r"combinaci|sinergi", label_lower):
                    continue  # synergy-test CIM is not the linezolid MIC
                mic = _parse_float(det.get("value"))
                break
        mic_assumed = mic is None
        mic = mic or 1.0
        band = [2.0, 7.0] if mic <= 1 else [5.0, 8.0]
        evaluation["targetRange"] = band
        if observed is not None and latest:
            evaluation["observed"] = {"value": observed, "mic": mic, "sampleDateTime": latest.get("sampleDateTime"), "sampleType": latest.get("sampleType")}
            evaluation["inTarget"] = band[0] <= observed <= band[1]
            for rule in LINEZOLID_BANDS["rules"]:
                if rule["applies"](observed, mic):
                    evaluation["firedRules"].append({"id": rule["id"], "condition": rule["condition"], "action": rule["action"]})
            if evaluation["firedRules"]:
                evaluation["recommendationDraft"] = " ".join(rule["action"] for rule in evaluation["firedRules"])
            else:
                evaluation["recommendationDraft"] = (
                    "Exposición compatible con %T>MIC >85% y AUC24/MIC 80-120. Mantener pauta con TDM programado y vigilancia de toxicidad."
                )
        else:
            evaluation["recommendationDraft"] = (
                "TDM pendiente: extraer Cmin 3-4 días tras el cambio de dosis. Objetivo %T>MIC >85% "
                f"(Cmin {band[0]:.0f}-{band[1]:.0f} mg/L con MIC={mic:g}); AUC24/MIC 80-120."
            )
            if mic_assumed:
                evaluation["recommendationDraft"] += " MIC de linezolid no registrada en los determinantes: asumida 1 mg/L; confirmar con el antibiograma."

    else:
        target_config = BIOLOGIC_TROUGH_TARGETS.get(drug)
        if not target_config:
            return None
        evaluation.update(targetRange=target_config["target"], unit="mg/L", source="Objetivos de exposición de la red para biológicos (IBD)")
        if observed is not None and latest:
            evaluation["observed"] = {"value": observed, "sampleDateTime": latest.get("sampleDateTime"), "sampleType": latest.get("sampleType")}
            low, high = target_config["target"]
            evaluation["inTarget"] = low <= observed <= high
            if observed < low:
                evaluation["firedRules"].append({
                    "id": f"{drug.upper()[:4]}-LOW",
                    "condition": f"Cmin {observed:g} < objetivo {low}-{high} mg/L",
                    "action": "Valorar intensificación de pauta según análisis bayesiano y actividad clínica/biológica",
                })
            elif observed > high:
                evaluation["firedRules"].append({
                    "id": f"{drug.upper()[:4]}-HIGH",
                    "condition": f"Cmin {observed:g} > objetivo {low}-{high} mg/L",
                    "action": "Valorar desintensificación progresiva con control de niveles y balance clínico",
                })
            if evaluation["firedRules"]:
                evaluation["recommendationDraft"] = evaluation["firedRules"][0]["action"]
            else:
                evaluation["recommendationDraft"] = "Exposición en rango objetivo. Mantener pauta y seguimiento programado."

    return evaluation
