"""Network demo cases rebuilt from the anonymized Hospital de Bellvitge PK/PD
network material (Sessió 23 IMID cases plus the voriconazole and linezolid
teaching cases), using the timed schema: doses[] with administration
datetimes and determinants with extraction datetime + sample type.

All patient data is synthetic; only the hospital names and clinical patterns
are faithful to the network.
"""

from __future__ import annotations

import json
from pathlib import Path

_NETWORK_FILE = Path(__file__).resolve().parents[2] / "docs" / "xarxa_pkpd_network_cases_es.json"

_PAYLOAD_KEYS = ("cases", "tasks", "caseEvents", "recommendations", "clinicalNotes", "followUps", "agentRuns", "trainingRequests")


def network_demo_payload() -> dict[str, list[dict]]:
    with open(_NETWORK_FILE, encoding="utf-8") as handle:
        data = json.load(handle)
    return {key: data.get(key, []) for key in _PAYLOAD_KEYS}
