"""Prototype Bayesian MAP estimation for the Xarxa PK/PD network (MIPD).

One-compartment population PK model with linear elimination:

- IV dosing (infliximab IV): instant input, C(t) = (D/V) * exp(-k*t)
- SC dosing (ustekinumab, infliximab SC): first-order absorption
  (bateman function) with population F and Ka

MAP estimation of individual clearance CL from timed trough/level
measurements, by golden-section search on log(CL) of the weighted
log-residual objective with a log-normal prior. Pure Python (closed-form
superposition), so it runs anywhere the backend runs.

Outputs a regimen-comparison table (predicted Cmin at steady state and
AUC per interval) exactly like the network's session case slides.

PROTOTYPE - NOT CLINICALLY VALIDATED: parameter values are typical
published population values, not the hospital's validated tool. All
outputs require pharmacist review before any clinical use.
"""

from __future__ import annotations

import math
import re
from datetime import datetime, timezone
from typing import Any

from backend.services.pkpd_rules import _parse_float

ENGINE_ID = "bayes-map-1comp-v0"
ENGINE_NOTE = (
    "Prototipo de estimación bayesiana MAP (modelo monocompartimental, parámetros "
    "poblacionales publicados). NO validado para uso clínico; los resultados son "
    "ilustrativos y requieren validación farmacéutica y contraste con la herramienta MIPD de la red."
)

# Population PK parameters (typical published values; see module docstring)
POPULATION_PK = {
    "infliximab": {
        "cl_ml_per_kg_per_day": 5.42,  # weight-scaled CL, per the network's case reports
        "volume_l": 3.44,
        "bioavailability_iv": 1.0,
        "bioavailability_sc": 1.0,
        "ka_per_day": 0.01,  # generic mAb SC absorption (approximation)
    },
    "ustekinumab": {
        "cl_l_per_hour": 0.00775,  # population CL from the network's case report (L/h)
        "volume_l": 5.6,
        "bioavailability_sc": 0.513,
        "ka_per_day": 0.0068,
    },
}

SIGMA_PROP = 0.25  # proportional residual error of log-concentrations
OMEGA = 0.4  # prior SD on log(CL) (CV ~40%)

# Default maintenance regimens per drug (dose label, mg or mg/kg, interval days, route)
DEFAULT_REGIMENS = {
    "infliximab": [
        {"label": "5 mg/kg / 4 semanas IV", "mgPerKg": 5.0, "intervalDays": 28, "route": "IV"},
        {"label": "8 mg/kg / 4 semanas IV", "mgPerKg": 8.0, "intervalDays": 28, "route": "IV"},
        {"label": "10 mg/kg / 5 semanas IV", "mgPerKg": 10.0, "intervalDays": 35, "route": "IV"},
        {"label": "10 mg/kg / 6 semanas IV", "mgPerKg": 10.0, "intervalDays": 42, "route": "IV"},
    ],
    "ustekinumab": [
        {"label": "90 mg / 4 semanas SC", "mg": 90.0, "intervalDays": 28, "route": "SC"},
        {"label": "90 mg / 5 semanas SC", "mg": 90.0, "intervalDays": 35, "route": "SC"},
        {"label": "90 mg / 6 semanas SC", "mg": 90.0, "intervalDays": 42, "route": "SC"},
        {"label": "90 mg / 8 semanas SC (actual)", "mg": 90.0, "intervalDays": 56, "route": "SC"},
    ],
}


def _iso_to_days(iso: str | None, epoch: datetime) -> float | None:
    if not iso:
        return None
    try:
        parsed = datetime.fromisoformat(str(iso).replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return (parsed.astimezone(timezone.utc) - epoch).total_seconds() / 86400.0


def _dose_mg(dose: dict, weight_kg: float) -> float | None:
    """Resolve a dose record to absolute mg (handles '5 mg/kg (310 mg)' formats)."""
    amount = str(dose.get("doseAmount") or "")
    absolute = re.search(r"\((\d+(?:[.,]\d+)?)\s*mg", amount, re.I)
    if absolute:
        return float(absolute.group(1).replace(",", "."))
    per_kg = re.search(r"(\d+(?:[.,]\d+)?)\s*mg/kg", amount, re.I)
    if per_kg and weight_kg:
        return float(per_kg.group(1).replace(",", ".")) * weight_kg
    value = _parse_float(dose.get("doseAmount"))
    return value if value is not None else None


def _concentration(days_since_dose: float, dose_mg: float, cl: float, params: dict, route: str) -> float:
    k = cl / params["volume_l"]
    if route == "SC":
        ka = params["ka_per_day"]
        f = params.get("bioavailability_sc", 1.0)
        if abs(ka - k) < 1e-9:
            return 0.0
        coef = f * dose_mg * ka / (params["volume_l"] * (ka - k))
        return coef * (math.exp(-k * days_since_dose) - math.exp(-ka * days_since_dose))
    f = params.get("bioavailability_iv", 1.0)
    return f * dose_mg / params["volume_l"] * math.exp(-k * days_since_dose)


def _superpose(level_days: float, doses: list[tuple[float, float, str]], cl: float, params: dict) -> float:
    return sum(
        _concentration(level_days - dose_days, dose_mg, cl, params, route)
        for dose_days, dose_mg, route in doses
        if level_days >= dose_days
    )


def _add_spinup(doses: list[tuple[float, float, str]], slowest_half_life_days: float, weight_kg: float) -> list[tuple[float, float, str]]:
    """Prepend a steady-state history before the first recorded dose (the network
    cases usually only record the last administrations)."""
    if not doses:
        return doses
    first_days, first_mg, first_route = doses[0]
    interval = (
        (doses[1][0] - doses[0][0]) if len(doses) > 1 and doses[1][0] > doses[0][0] else 56.0
    )
    history_days = min(10 * slowest_half_life_days, 730.0)
    steps = max(2, int(history_days / interval))
    spinup = []
    for step in range(1, steps + 1):
        spinup.append((first_days - step * interval, first_mg, first_route))
    return sorted([*spinup, *doses])


def _steady_state(cmin_time: float, interval: float, dose_mg: float, cl: float, params: dict, route: str) -> float:
    """Closed-form steady-state concentration at t = cmin_time after a dose
    (geometric sum of the single-dose superposition terms)."""
    k = cl / params["volume_l"]
    if route == "SC":
        ka = params["ka_per_day"]
        f = params.get("bioavailability_sc", 1.0)
        if abs(ka - k) < 1e-9:
            return 0.0
        coef = f * dose_mg * ka / (params["volume_l"] * (ka - k))
        return coef * (
            math.exp(-k * cmin_time) / (1.0 - math.exp(-k * interval))
            - math.exp(-ka * cmin_time) / (1.0 - math.exp(-ka * interval))
        )
    f = params.get("bioavailability_iv", 1.0)
    return (
        f
        * dose_mg
        / params["volume_l"]
        * math.exp(-k * cmin_time)
        / (1.0 - math.exp(-k * interval))
    )


def _golden_section(objective, low: float, high: float, iterations: int = 80) -> float:
    inv_phi = (math.sqrt(5.0) - 1.0) / 2.0
    a, b = low, high
    c = b - inv_phi * (b - a)
    d = a + inv_phi * (b - a)
    fc, fd = objective(c), objective(d)
    for _ in range(iterations):
        if fc < fd:
            b, d, fd = d, c, fc
            c = b - inv_phi * (b - a)
            fc = objective(c)
        else:
            a, c, fc = c, d, fd
            d = a + inv_phi * (b - a)
            fd = objective(d)
    return (a + b) / 2.0


def estimate_clearance(doses: list[tuple[float, float, str]], levels: list[tuple[float, float]], cl_prior: float, params: dict, weight_kg: float) -> dict:
    """MAP estimate of CL (L/day) by golden-section search on log(CL)."""
    slowest_half_life = math.log(2.0) / max(params.get("ka_per_day", 0.01), 1e-6) if any(route == "SC" for _, _, route in doses) else (math.log(2.0) / (cl_prior / params["volume_l"]))
    full_history = _add_spinup(doses, slowest_half_life, weight_kg)

    def neg_log_posterior(log_cl: float) -> float:
        cl = math.exp(log_cl)
        if cl <= 0:
            return 1e12
        residuals = 0.0
        for level_days, observed in levels:
            predicted = _superpose(level_days, full_history, cl, params)
            if predicted <= 0:
                predicted = 1e-6
            residuals += ((math.log(observed) - math.log(predicted)) / SIGMA_PROP) ** 2
        prior = ((log_cl - math.log(cl_prior)) / OMEGA) ** 2
        return residuals + prior

    bounds = (math.log(cl_prior / 8.0), math.log(cl_prior * 8.0))
    log_cl_hat = _golden_section(neg_log_posterior, *bounds)
    cl_hat = math.exp(log_cl_hat)
    return {
        "clLPerDay": cl_hat,
        "clPriorLPerDay": cl_prior,
        "relativeToPopulation": cl_hat / cl_prior,
        "objectiveAtOptimum": neg_log_posterior(log_cl_hat),
    }


def predict_regimens(cl: float, weight_kg: float, drug: str, regimens: list[dict] | None = None) -> list[dict]:
    """Predicted trough (Cmin) at steady state and AUC per interval for each
    candidate maintenance regimen at the individual's CL."""
    params = POPULATION_PK[drug]
    candidates = regimens or DEFAULT_REGIMENS[drug]
    predictions = []
    for regimen in candidates:
        dose_mg = regimen.get("mg") or (regimen.get("mgPerKg", 0.0) * weight_kg)
        interval = float(regimen["intervalDays"])
        route = regimen.get("route", "IV")
        trough_time = interval - 1e-6  # just before the next dose
        cmin = _steady_state(trough_time, interval, dose_mg, cl, params, route)
        f = params.get("bioavailability_sc", 1.0) if route == "SC" else params.get("bioavailability_iv", 1.0)
        auc_mg_h = f * dose_mg / cl * 24.0  # linear PK: AUC_tau = F*D/CL, in mg*h/L
        auc_weekly = auc_mg_h * 7.0 / interval  # exposure per unit time: regimens with
        # the same mg/week share this value regardless of interval (equivalence criterion)
        predictions.append(
            {
                "label": regimen["label"],
                "doseMg": dose_mg,
                "intervalDays": interval,
                "route": route,
                "cminMgPerL": cmin,
                "aucMgHPerL": auc_mg_h,
                "aucWeeklyMgHPerL": auc_weekly,
            }
        )
    return predictions


def run_bayes_evaluation(case: dict, regimens: list[dict] | None = None) -> dict | None:
    """Full MIPD prototype evaluation for a case: estimate CL from the timed
    dose history and levels, then compare candidate maintenance regimens."""
    drug = None
    therapy = case.get("therapyContext") or {}
    current_drug = str(therapy.get("currentDrug") or "").lower()
    for candidate in POPULATION_PK:
        if candidate in current_drug:
            drug = candidate
            break
    if not drug:
        return None

    params = dict(POPULATION_PK[drug])
    if "cl_ml_per_kg_per_day" in params:
        weight_kg = (case.get("patientProfile") or {}).get("weightKg") or 70.0
        cl_prior = params["cl_ml_per_kg_per_day"] * weight_kg / 1000.0
        params.setdefault("bioavailability_iv", 1.0)
        params.setdefault("bioavailability_sc", 1.0)
        params.setdefault("ka_per_day", 0.01)
    else:
        weight_kg = (case.get("patientProfile") or {}).get("weightKg") or 70.0
        cl_prior = params["cl_l_per_hour"] * 24.0  # L/h -> L/day
    if "bioavailability_iv" not in params:
        params["bioavailability_iv"] = 1.0
    if "bioavailability_sc" not in params:
        params["bioavailability_sc"] = params.get("bioavailability_iv", 1.0)
    if "ka_per_day" not in params:
        params["ka_per_day"] = 0.01

    epoch = datetime(2000, 1, 1, tzinfo=timezone.utc)
    doses = []
    for dose in case.get("doses") or []:
        days = _iso_to_days(dose.get("administeredAt"), epoch)
        mg = _dose_mg(dose, weight_kg)
        if days is not None and mg is not None:
            doses.append((days, mg, (dose.get("route") or therapy.get("route") or "IV")))
    levels = []
    for det in case.get("labDeterminants") or []:
        label = str(det.get("label", "")).lower()
        if re.search(r"concentraci[oó]n|nivel", label) and not re.search(r"cim|mic\b", label):
            days = _iso_to_days(det.get("sampleDateTime"), epoch)
            value = _parse_float(det.get("value"))
            if days is not None and value is not None:
                levels.append((days, value))
    levels.sort()

    if len(doses) == 0 or len(levels) == 0:
        return {
            "engine": ENGINE_ID,
            "note": ENGINE_NOTE,
            "drug": drug,
            "status": "insufficient-data",
            "detail": "Se necesitan dosis administradas con fecha/hora y al menos un nivel de fármaco con fecha de extracción para estimar el aclaramiento individual.",
        }

    estimate = estimate_clearance(doses, levels, cl_prior, params, weight_kg)
    predictions = predict_regimens(estimate["clLPerDay"], weight_kg, drug, regimens)

    target_note = "Los escenarios se ordenan por Cmin previsto; la decisión final es del comité clínico."
    return {
        "engine": ENGINE_ID,
        "note": ENGINE_NOTE,
        "drug": drug,
        "status": "estimated",
        "weightKg": weight_kg,
        "clearance": {
            "estimatedLPerDay": estimate["clLPerDay"],
            "populationLPerDay": cl_prior,
            "relativeToPopulation": estimate["relativeToPopulation"],
        },
        "levelsUsed": len(levels),
        "dosesUsed": len(doses),
        "regimenComparison": predictions,
        "sourceNote": target_note,
    }
