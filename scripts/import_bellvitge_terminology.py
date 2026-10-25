#!/usr/bin/env python3
"""Convert the Hospital de Bellvitge PK/PD terminology CSVs into JSON seed data.

Input (UTF-8, semicolon-separated, from data/raw/):
    bellvitge_variables_per_patologia.csv
    bellvitge_variables_analitiques_per_medicament.csv

Output (data/processed/):
    xarxa_pathology_scores.json   -> disease activity score definitions per IMID
    xarxa_drug_lab_panels.json    -> lab monitoring panel per biologic substance

Typos in the source are fixed in normalized fields; the original text is
preserved in ``source`` fields for traceability.
"""
from __future__ import annotations

import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
OUT = ROOT / "data" / "processed"

DISEASE_EN = {
    "APS": "Psoriatic arthritis",
    "ARE": "Rheumatoid arthritis",
    "COU": "Ulcerative colitis",
    "EAN": "Ankylosing spondylitis",
    "EAX": "Axial spondyloarthropathy",
    "HSU": "Hidradenitis suppurativa",
    "MDB": "Behçet's disease",
    "MDC": "Crohn's disease",
    "PSO": "Psoriasis",
}

VARIABLE_FIXES = {
    "ISH4": "IHS4",  # typo in source
    "ASDAS-PCR": "ASDAS-CRP",  # PCR is the Catalan/Spanish acronym for CRP
    "DAS28-VSG": "DAS28-ESR",  # VSG is the Catalan/Spanish acronym for ESR
}

LABEL_FIXES = {
    "moderarda": "moderada",
    "gru": "greu",
    "Nduls": "Nòduls",
    "Fstules": "Fístules",
    "ueveitis": "uveítis",
    "NrmerO": "Número",
    "NúrmerO": "Número",
    "Nrero": "Número",
    "Depos ": "Depòsits ",
    "Depos liq/tov": "Depòsits líquids/sòlids",
}

NUMERIC_PREFIXES = ("número", "numero", "número")  # after accent-stripping all become "numero"


def _fix(text: str) -> str:
    for bad, good in LABEL_FIXES.items():
        text = text.replace(bad, good)
    return text.strip()


def _strip_accents(text: str) -> str:
    return re.sub(r"[̀-ͯ]", "", text)


def parse_variable_type(description: str) -> dict:
    """Infer the value shape of a disease-activity variable from its description."""
    raw = description.strip()
    fixed = _fix(raw)
    flat = _strip_accents(fixed).lower()

    if not fixed:
        return {"valueType": "text", "notes": raw}

    if "si/no" in flat or "sí/no" in flat.lower():
        return {"valueType": "boolean", "options": ["Sí", "No"], "notes": raw}

    if "pot ser i, ii o iii" in flat or flat.startswith("pot ser"):
        return {"valueType": "enum", "options": ["I", "II", "III"], "notes": raw}

    range_match = re.search(r"entre\s+(\d+)\s+i\s+(\d+)", flat)
    if range_match:
        return {
            "valueType": "number",
            "range": [int(range_match.group(1)), int(range_match.group(2))],
            "notes": raw,
        }

    if flat.startswith(NUMERIC_PREFIXES[:2]) or "numero" in flat.split(".")[0]:
        return {"valueType": "number", "notes": raw}

    if "nombre de" in flat or flat.startswith("nombre"):
        return {"valueType": "count", "notes": raw}

    if "," in fixed:
        options = [option.strip() for option in fixed.split(",") if option.strip()]
        return {"valueType": "enum", "options": options, "notes": raw}

    return {"valueType": "text", "notes": raw}


def import_pathology_scores() -> list[dict]:
    by_code: dict[str, dict] = {}
    with (RAW / "bellvitge_variables_per_patologia.csv").open(encoding="utf-8") as handle:
        for row in csv.reader(handle, delimiter=";"):
            if len(row) < 5 or row[0] in ("", "Codi Diagnòstic"):
                continue
            code, disease, order, variable, description = (cell.strip() for cell in row[:5])
            entry = by_code.setdefault(
                code,
                {
                    "code": code,
                    "disease": _fix(disease),
                    "diseaseEn": DISEASE_EN.get(code, disease),
                    "variables": [],
                },
            )
            parsed = parse_variable_type(description)
            entry["variables"].append(
                {
                    "order": int(order) if order.isdigit() else len(entry["variables"]) + 1,
                    "code": VARIABLE_FIXES.get(variable, variable),
                    "sourceCode": variable,
                    "description": _fix(description),
                    **parsed,
                }
            )
    return sorted(by_code.values(), key=lambda item: item["code"])


SUBSTANCE_FIXES = {
    "inFLIXimab": "infliximab",
    "Remisima": "Remsima",
}


def _parse_presentation(name: str) -> dict:
    fixed = name
    for bad, good in SUBSTANCE_FIXES.items():
        fixed = fixed.replace(bad, good)
    substance = re.match(r"[A-Za-z]+", fixed).group(0).lower()
    is_biosimilar = "BIOSIMILAR" in fixed.upper()
    brands = re.findall(r"\(([^)]+)\)", fixed)
    brand = next((b for b in brands if b != "BIOSIMILAR"), None)
    form = "vial"
    if "ploma" in fixed or "pluma" in fixed:
        form = "pluma"  # pre-filled pen
    elif "cartutx" in fixed:
        form = "cartutx"
    if "precarg" in fixed:
        form += "+precàrrega"
    return {
        "substance": substance,
        "name": fixed,
        "brand": brand,
        "isBiosimilar": is_biosimilar,
        "form": form,
        "sourceName": name,
    }


def _test_category(label: str, is_drug_level: bool) -> str:
    if is_drug_level:
        return "drug_level"
    flat = _strip_accents(label).lower()
    if "calprotectina" in flat:
        return "biomarker"
    if "proteina c reactiva" in flat or flat.startswith("pcr"):
        return "biomarker"
    if "albumina" in flat:
        return "biomarker"
    if label.startswith("H"):
        return "hemogram"
    return "other"


def import_drug_lab_panels() -> list[dict]:
    by_substance: dict[str, dict] = {}
    with (RAW / "bellvitge_variables_analitiques_per_medicament.csv").open(encoding="utf-8") as handle:
        for row in csv.reader(handle, delimiter=";"):
            if len(row) < 7 or row[0] in ("", "Codi Medicament"):
                continue
            medication_code, national_code, name, lab_code, lab_label, nivell, show = (cell.strip() for cell in row[:7])
            presentation = _parse_presentation(name)
            panel = by_substance.setdefault(
                presentation["substance"],
                {"substance": presentation["substance"], "presentations": [], "tests": []},
            )
            if not any(p["name"] == presentation["name"] for p in panel["presentations"]):
                panel["presentations"].append(
                    {
                        "medicationCode": medication_code,
                        "nationalCode": national_code,
                        **presentation,
                    }
                )
            is_drug_level = nivell == "S"
            existing = next((t for t in panel["tests"] if t["labCode"] == lab_code), None)
            if existing is None:
                panel["tests"].append(
                    {
                        "labCode": lab_code,
                        "label": _fix(lab_label),
                        "isDrugLevel": is_drug_level,
                        "show": show == "S",
                        "category": _test_category(lab_label, is_drug_level),
                    }
                )
            elif is_drug_level:
                existing["isDrugLevel"] = True
    for panel in by_substance.values():
        panel["tests"].sort(key=lambda t: (not t["isDrugLevel"], t["labCode"]))
    return [by_substance[key] for key in sorted(by_substance)]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    outputs = {
        "xarxa_pathology_scores.json": import_pathology_scores(),
        "xarxa_drug_lab_panels.json": import_drug_lab_panels(),
    }
    for filename, payload in outputs.items():
        path = OUT / filename
        path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"{path}: {len(payload)} entries")


if __name__ == "__main__":
    main()
