from __future__ import annotations

import copy
import json
import re
from pathlib import Path

from backend.db.mongo import get_database
from backend.services.xarxa_repository import reset_xarxa_runtime_state

_SEED_FILE = Path(__file__).resolve().parents[2] / "docs" / "xarxa_pkpd_seed_data_es.json"

_XARXA_COLLECTIONS = [
    "xarxa_cases",
    "xarxa_centers",
    "xarxa_professionals",
    "xarxa_agents",
    "xarxa_programs",
    "xarxa_tasks",
    "xarxa_events",
    "xarxa_recommendations",
    "xarxa_notes",
    "xarxa_followups",
    "xarxa_agent_runs",
    "xarxa_forms",
    "xarxa_roles",
    "xarxa_specialties",
    "xarxa_inbox_requests",
    "xarxa_sessions",
    "xarxa_professional_requests",
    "xarxa_counters",
    "xarxa_reporting",
]

# Old collections from previous prototype — dropped on reseed
_LEGACY_COLLECTIONS = [
    "pkpd_cases", "pkpd_hospitals", "pkpd_patients", "pkpd_protocols",
    "pkpd_network", "pkpd_agents", "pkpd_professionals", "pkpd_knowledge",
]

_seeded = False


def _max_case_sequence(existing_case_ids: list[str]) -> int:
    highest = 0
    for case_id in existing_case_ids:
        match = re.search(r"PKPD-\d{4}-(\d+)$", str(case_id))
        if match:
            highest = max(highest, int(match.group(1)))
    return highest


def _curated_demo_payload() -> dict[str, list[dict]]:
    cases = [
        {
            "_id": "case-0006",
            "caseId": "PKPD-2026-0006",
            "demoSeedTag": "longitudinal-adalimumab-followup",
            "title": "Seguimiento tras optimización de adalimumab con respuesta sostenida",
            "patientCode": "P-1048",
            "programId": "prog-crohn-pkpd",
            "specialty": "Digestivo",
            "centerId": "ctr-hub",
            "centerName": "Hospital Universitario de Bellvitge",
            "requesterId": "pro-dig-001",
            "requesterName": "Dra. Ana Beltrán",
            "assignedTo": "pro-farm-001",
            "assignedName": "Dra. Laura Vidal",
            "caseType": "Seguimiento PK/PD",
            "entrySource": "Seguimiento programado",
            "priority": "Media",
            "pipelineStage": "Cerrado con resultado",
            "nextAction": "Caso cerrado con outcome documentado",
            "createdAt": "2026-03-18T09:10:00+02:00",
            "updatedAt": "2026-05-17T09:30:00+02:00",
            "clinicalSummary": "Seguimiento longitudinal del paciente P-1048 tras intensificación progresiva de adalimumab. La exposición se normaliza, la respuesta clínica mejora y el caso se cierra con outcome favorable.",
            "patientProfile": {
                "age": 34,
                "sex": "Varón",
                "weightKg": 74,
                "heightCm": 177,
                "specialPopulation": ["Inmunosuprimido"],
            },
            "diseaseContext": {
                "diagnosis": "Enfermedad de Crohn",
                "phenotype": "Ileal",
                "activity": "Respuesta parcial sostenida",
                "symptoms": "Dolor abdominal leve residual",
            },
            "therapyContext": {
                "currentDrug": "Adalimumab",
                "currentDose": "40 mg",
                "interval": "Cada 7 días",
                "route": "Subcutánea",
                "lastAdministration": "2026-04-26T08:00:00+02:00",
                "previousTherapies": [
                    "Adalimumab 40 mg SC cada 14 días",
                    "Adalimumab 40 mg SC cada 10 días",
                ],
            },
            "labDeterminants": [
                {
                    "label": "Concentración sérica de adalimumab",
                    "value": 8.4,
                    "unit": "µg/mL",
                    "status": "Confirmado",
                    "source": "Laboratorio",
                    "relationToDose": "Valle confirmado",
                    "interpretation": "Exposición en rango tras intensificación",
                },
                {
                    "label": "Anticuerpos anti-adalimumab",
                    "value": "Negativos",
                    "unit": None,
                    "status": "Confirmado",
                    "source": "Laboratorio",
                },
                {
                    "label": "PCR",
                    "value": 4,
                    "unit": "mg/L",
                    "status": "Confirmado",
                    "source": "Laboratorio",
                },
                {
                    "label": "Calprotectina fecal",
                    "value": 145,
                    "unit": "µg/g",
                    "status": "Confirmado",
                    "source": "Laboratorio",
                },
            ],
            "gaps": [],
            "tasks": [
                {
                    "taskId": "tsk-0101",
                    "title": "Confirmar respuesta clínica a las 8 semanas",
                    "ownerRole": "Digestólogo",
                    "ownerId": "pro-dig-001",
                    "priority": "Media",
                    "status": "Resuelta",
                    "dueDate": "2026-05-03",
                    "createdBy": "Agente de aprendizaje",
                },
                {
                    "taskId": "tsk-0102",
                    "title": "Cerrar caso con outcome documentado",
                    "ownerRole": "Farmacéutico experto",
                    "ownerId": "pro-farm-001",
                    "priority": "Media",
                    "status": "Resuelta",
                    "dueDate": "2026-05-17",
                    "createdBy": "Agente de aprendizaje",
                },
            ],
            "timeline": [
                {"date": "2025-11-04", "lane": "Tratamiento", "type": "Inicio de tratamiento", "label": "Inicio de adalimumab 40 mg SC cada 14 días"},
                {"date": "2026-01-20", "lane": "Tratamiento", "type": "Cambio de dosis", "label": "Ajuste a adalimumab 40 mg SC cada 10 días"},
                {"date": "2026-02-28", "lane": "Tratamiento", "type": "Cambio de dosis", "label": "Ratificación de adalimumab 40 mg SC cada 10 días"},
                {"date": "2026-03-18", "lane": "Tratamiento", "type": "Cambio de dosis", "label": "Intensificación a adalimumab 40 mg SC cada 7 días"},
                {"date": "2026-04-05", "lane": "Clínica", "type": "Seguimiento", "label": "Mejoría clara tras intensificación"},
                {"date": "2026-04-26", "lane": "Administración", "type": "Administración", "label": "Última administración adalimumab 40 mg SC cada 7 días"},
                {"date": "2026-04-30", "lane": "Laboratorio", "type": "Determinante recibido", "label": "Nivel valle en rango tras intensificación"},
                {"date": "2026-05-03", "lane": "Decisiones", "type": "Seguimiento", "label": "Seguimiento a 8 semanas completado con respuesta favorable"},
            ],
            "pkpdInterpretation": {
                "pattern": "Exposición adecuada tras optimización",
                "confidence": "Alta",
                "summary": "La intensificación progresiva de adalimumab consigue exposición en rango y mejoría clínica sostenida. El caso puede cerrarse con aprendizaje explícito.",
            },
            "simulation": {
                "currentScenario": "Mantener pauta actual",
                "preferredScenario": "Mantener pauta actual",
                "scenarios": [
                    "Mantener pauta actual",
                    "Espaciar tras más seguimiento",
                    "Repetir determinantes",
                ],
            },
            "recommendation": {
                "status": "Validado",
                "text": "Mantener adalimumab 40 mg semanal. Registrar respuesta clínica sostenida y documentar aprendizaje como caso de optimización escalonada con outcome favorable.",
            },
            "clinicalNote": {
                "status": "Registrado en HCE",
                "text": "Seguimiento de paciente con Crohn tras intensificación progresiva de adalimumab hasta pauta semanal. Exposición en rango, mejoría clínica y biomarcadores en descenso. Se mantiene la pauta actual y se cierra el caso con outcome favorable documentado.",
            },
            "caseOutcome": {
                "recommendationAccepted": "Aceptada íntegramente",
                "clinicalResponse": "Mejora clara",
                "treatmentDecision": "Mantener",
                "adverseEvents": "Ninguno relevante",
                "networkLearning": "Caso docente: optimización progresiva con ratificación por seguimiento",
                "summary": "Tras intensificación de adalimumab a pauta semanal se documenta exposición adecuada, descenso de biomarcadores y mejoría clínica sostenida.",
            },
            "followUps": [
                {"label": "Seguimiento 4 semanas", "status": "Completado", "dueDate": "2026-04-05"},
                {"label": "Seguimiento 8 semanas", "status": "Completado", "dueDate": "2026-05-03"},
            ],
            "demoLocked": True,
            "deletable": False,
        },
        {
            "_id": "case-0007",
            "caseId": "PKPD-2026-0007",
            "demoSeedTag": "infliximab-sequential-escalation",
            "title": "Escalada secuencial de infliximab con respuesta inestable",
            "patientCode": "P-1188",
            "programId": "prog-crohn-pkpd",
            "specialty": "Digestivo",
            "centerId": "ctr-vila",
            "centerName": "Hospital de Viladecans",
            "requesterId": "pro-dig-004",
            "requesterName": "Dr. Marc Soler",
            "assignedTo": "pro-farm-001",
            "assignedName": "Dra. Laura Vidal",
            "caseType": "Pérdida de respuesta",
            "entrySource": "Formulario normalizado",
            "priority": "Alta",
            "pipelineStage": "Revisión farmacéutica",
            "nextAction": "Decidir si la nueva intensificación aporta beneficio incremental",
            "createdAt": "2026-05-08T11:15:00+02:00",
            "updatedAt": "2026-05-17T10:05:00+02:00",
            "clinicalSummary": "Paciente con Crohn tratado con infliximab y múltiples ajustes de dosis e intervalo. La respuesta clínica mejora y recae de forma intermitente, con necesidad de revisar si tiene sentido seguir escalando o cambiar estrategia.",
            "patientProfile": {
                "age": 29,
                "sex": "Mujer",
                "weightKg": 62,
                "heightCm": 168,
                "specialPopulation": ["Inmunosuprimido"],
            },
            "diseaseContext": {
                "diagnosis": "Enfermedad de Crohn",
                "phenotype": "Ileocolónico",
                "activity": "Respuesta parcial inestable",
                "symptoms": "Rectorragia intermitente y urgencia fecal",
            },
            "therapyContext": {
                "currentDrug": "Infliximab",
                "currentDose": "10 mg/kg",
                "interval": "Cada 6 semanas",
                "route": "Intravenosa",
                "lastAdministration": "2026-05-06T09:00:00+02:00",
                "previousTherapies": [
                    "Azatioprina",
                    "Infliximab 5 mg/kg IV cada 8 semanas",
                    "Infliximab 5 mg/kg IV cada 6 semanas",
                    "Infliximab 10 mg/kg IV cada 8 semanas",
                ],
            },
            "labDeterminants": [
                {
                    "label": "Concentración sérica de infliximab",
                    "value": 6.2,
                    "unit": "µg/mL",
                    "status": "Confirmado",
                    "source": "Laboratorio",
                    "relationToDose": "Valle confirmado",
                    "interpretation": "Exposición intermedia tras varias intensificaciones",
                },
                {
                    "label": "Anticuerpos anti-infliximab",
                    "value": "Negativos",
                    "unit": None,
                    "status": "Confirmado",
                    "source": "Laboratorio",
                },
                {
                    "label": "PCR",
                    "value": 10,
                    "unit": "mg/L",
                    "status": "Confirmado",
                    "source": "Laboratorio",
                },
                {
                    "label": "Calprotectina fecal",
                    "value": 310,
                    "unit": "µg/g",
                    "status": "Confirmado",
                    "source": "Laboratorio",
                },
                {
                    "label": "Albúmina",
                    "value": 3.2,
                    "unit": "g/dL",
                    "status": "Confirmado",
                    "source": "Laboratorio",
                },
            ],
            "gaps": [
                {
                    "label": "Falta confirmar si la respuesta clínica ha sido homogénea tras las dos últimas intensificaciones",
                    "severity": "Importante",
                    "status": "Pendiente",
                },
                {
                    "label": "Falta consensuar si merece la pena otra intensificación frente a cambio de mecanismo",
                    "severity": "Informativo",
                    "status": "Pendiente",
                },
            ],
            "tasks": [
                {
                    "taskId": "tsk-0103",
                    "title": "Confirmar respuesta clínica tras las dos últimas infusiones",
                    "ownerRole": "Enfermería EII",
                    "ownerId": "pro-enf-001",
                    "priority": "Media",
                    "status": "Pendiente",
                    "dueDate": "2026-05-18",
                    "createdBy": "Agente de gaps",
                },
                {
                    "taskId": "tsk-0104",
                    "title": "Revisar si hay beneficio incremental con nueva intensificación",
                    "ownerRole": "Farmacéutico experto",
                    "ownerId": "pro-farm-001",
                    "priority": "Alta",
                    "status": "En curso",
                    "dueDate": "2026-05-18",
                    "createdBy": "Agente PK/PD",
                },
            ],
            "timeline": [
                {"date": "2024-09-12", "lane": "Tratamiento", "type": "Inicio de tratamiento", "label": "Inicio de infliximab 5 mg/kg IV cada 8 semanas"},
                {"date": "2025-01-21", "lane": "Tratamiento", "type": "Cambio de dosis", "label": "Intensificación a infliximab 5 mg/kg IV cada 6 semanas"},
                {"date": "2025-05-09", "lane": "Tratamiento", "type": "Cambio de dosis", "label": "Ratificación de infliximab 5 mg/kg IV cada 6 semanas"},
                {"date": "2025-11-10", "lane": "Tratamiento", "type": "Cambio de dosis", "label": "Escalada a infliximab 10 mg/kg IV cada 8 semanas"},
                {"date": "2026-03-22", "lane": "Tratamiento", "type": "Cambio de dosis", "label": "Ajuste a infliximab 10 mg/kg IV cada 6 semanas"},
                {"date": "2026-05-06", "lane": "Administración", "type": "Administración", "label": "Última infusión infliximab 10 mg/kg IV cada 6 semanas"},
                {"date": "2026-05-13", "lane": "Laboratorio", "type": "Determinante recibido", "label": "Valle 6.2 µg/mL con calprotectina 310 µg/g"},
                {"date": "2026-05-17", "lane": "Decisiones", "type": "Análisis", "label": "Caso listo para revisar si conviene nueva intensificación o cambio de mecanismo"},
            ],
            "pkpdInterpretation": {
                "pattern": "Exposición intermedia tras escalada secuencial",
                "confidence": "Media",
                "summary": "La exposición ya no es claramente infraterapéutica, pero la respuesta sigue siendo inestable. Es un caso útil para discutir si una nueva escalada aporta valor o si debe priorizarse el cambio de mecanismo.",
            },
            "simulation": {
                "currentScenario": "Mantener 10 mg/kg cada 6 semanas",
                "preferredScenario": "Cambiar mecanismo",
                "scenarios": [
                    "Mantener 10 mg/kg cada 6 semanas",
                    "Acortar a cada 4 semanas",
                    "Cambiar mecanismo",
                    "Repetir determinantes",
                ],
            },
            "recommendation": {
                "status": "Borrador IA",
                "text": "Antes de una nueva intensificación conviene revisar de forma estructurada la respuesta clínica real tras las dos últimas infusiones y discutir el valor de cambio de mecanismo.",
            },
            "clinicalNote": {
                "status": "Borrador",
                "text": "Paciente con escalada secuencial de infliximab hasta 10 mg/kg cada 6 semanas. Exposición intermedia y respuesta clínica inestable. Se propone revisión farmacéutica para decidir entre nueva intensificación, ratificación de pauta o cambio de mecanismo.",
            },
            "followUps": [
                {"label": "Seguimiento 4 semanas", "status": "Programado", "dueDate": "2026-06-14"},
            ],
            "demoLocked": True,
            "deletable": False,
        },
        {
            "_id": "case-0008",
            "caseId": "PKPD-2026-0008",
            "demoSeedTag": "ustekinumab-second-biologic-discussion",
            "title": "Segundo biológico con intensificación de ustekinumab y respuesta parcial",
            "patientCode": "P-1234",
            "programId": "prog-crohn-pkpd",
            "specialty": "Digestivo",
            "centerId": "ctr-mar",
            "centerName": "Hospital del Mar",
            "requesterId": "pro-dig-003",
            "requesterName": "Dr. Joan Casals",
            "assignedTo": "pro-farm-002",
            "assignedName": "Dr. Marco Suárez",
            "caseType": "Cambio de medicación",
            "entrySource": "Email",
            "priority": "Alta",
            "pipelineStage": "Discusión en red",
            "nextAction": "Discutir cambio de mecanismo frente a nueva intensificación",
            "createdAt": "2026-05-11T10:20:00+02:00",
            "updatedAt": "2026-05-17T10:50:00+02:00",
            "emailOriginal": "Paciente multiexpuesto con ustekinumab intensificado a cada 8 semanas. Persisten actividad y calprotectina elevada. Solicito revisión PK/PD y discusión de cambio de mecanismo.",
            "clinicalSummary": "Paciente con Crohn multiexpuesto, actualmente en ustekinumab intensificado a cada 8 semanas como segundo biológico de mantenimiento. Persiste respuesta parcial y biomarcadores elevados, lo que obliga a discutir si todavía hay margen PK/PD o si conviene cambio de mecanismo.",
            "patientProfile": {
                "age": 46,
                "sex": "Varón",
                "weightKg": 83,
                "heightCm": 177,
                "specialPopulation": ["Inmunosuprimido"],
            },
            "diseaseContext": {
                "diagnosis": "Enfermedad de Crohn",
                "phenotype": "Ileocolónico con afectación perianal",
                "activity": "Persistente",
                "symptoms": "Diarrea, dolor abdominal y molestias perianales",
            },
            "therapyContext": {
                "currentDrug": "Ustekinumab",
                "currentDose": "90 mg",
                "interval": "Cada 8 semanas",
                "route": "Subcutánea",
                "lastAdministration": "2026-05-02T08:30:00+02:00",
                "previousTherapies": [
                    "Infliximab 5 mg/kg IV cada 8 semanas",
                    "Adalimumab 40 mg SC cada 14 días",
                    "Ustekinumab 90 mg SC cada 12 semanas",
                ],
            },
            "labDeterminants": [
                {
                    "label": "Concentración sérica de ustekinumab",
                    "value": 4.9,
                    "unit": "µg/mL",
                    "status": "Confirmado",
                    "source": "Laboratorio",
                    "relationToDose": "Valle confirmado",
                    "interpretation": "Exposición intermedia con respuesta parcial persistente",
                },
                {
                    "label": "PCR",
                    "value": 11,
                    "unit": "mg/L",
                    "status": "Confirmado",
                    "source": "Laboratorio",
                },
                {
                    "label": "Calprotectina fecal",
                    "value": 430,
                    "unit": "µg/g",
                    "status": "Confirmado",
                    "source": "Laboratorio",
                },
                {
                    "label": "Albúmina",
                    "value": 3.5,
                    "unit": "g/dL",
                    "status": "Confirmado",
                    "source": "Laboratorio",
                },
            ],
            "gaps": [
                {
                    "label": "Falta endoscopia reciente antes de decidir cambio de mecanismo",
                    "severity": "Importante",
                    "status": "Pendiente",
                },
                {
                    "label": "Conviene revisar si la respuesta perianal sigue la misma trayectoria que la luminal",
                    "severity": "Informativo",
                    "status": "Pendiente",
                },
            ],
            "tasks": [
                {
                    "taskId": "tsk-0105",
                    "title": "Solicitar endoscopia reciente para discusión terapéutica",
                    "ownerRole": "Digestólogo",
                    "ownerId": "pro-dig-003",
                    "priority": "Alta",
                    "status": "Pendiente",
                    "dueDate": "2026-05-19",
                    "createdBy": "Agente de gaps",
                },
                {
                    "taskId": "tsk-0106",
                    "title": "Preparar resumen para sesión de red",
                    "ownerRole": "Farmacéutico experto",
                    "ownerId": "pro-farm-002",
                    "priority": "Alta",
                    "status": "En curso",
                    "dueDate": "2026-05-18",
                    "createdBy": "Agente de sesión",
                },
            ],
            "timeline": [
                {"date": "2023-10-12", "lane": "Tratamiento", "type": "Inicio de tratamiento", "label": "Inicio de infliximab 5 mg/kg IV cada 8 semanas"},
                {"date": "2024-07-04", "lane": "Tratamiento", "type": "Cambio de dosis", "label": "Cambio a adalimumab 40 mg SC cada 14 días"},
                {"date": "2025-03-18", "lane": "Tratamiento", "type": "Cambio de dosis", "label": "Inicio de ustekinumab 90 mg SC cada 12 semanas"},
                {"date": "2025-11-20", "lane": "Tratamiento", "type": "Cambio de dosis", "label": "Intensificación a ustekinumab 90 mg SC cada 8 semanas"},
                {"date": "2026-01-29", "lane": "Tratamiento", "type": "Cambio de dosis", "label": "Ratificación de ustekinumab 90 mg SC cada 8 semanas"},
                {"date": "2026-05-02", "lane": "Administración", "type": "Administración", "label": "Última administración ustekinumab 90 mg SC cada 8 semanas"},
                {"date": "2026-05-09", "lane": "Laboratorio", "type": "Determinante recibido", "label": "Nivel 4.9 µg/mL con calprotectina 430 µg/g"},
                {"date": "2026-05-16", "lane": "Decisiones", "type": "Sesión", "label": "Caso priorizado para discusión de red por duda entre margen PK/PD y cambio de mecanismo"},
            ],
            "pkpdInterpretation": {
                "pattern": "Exposición intermedia con respuesta parcial persistente",
                "confidence": "Media",
                "summary": "Caso frontera entre optimización adicional y cambio de mecanismo. La exposición no es claramente baja, pero la respuesta sigue siendo parcial y heterogénea.",
            },
            "simulation": {
                "currentScenario": "Mantener cada 8 semanas",
                "preferredScenario": "Cambiar mecanismo",
                "scenarios": [
                    "Mantener cada 8 semanas",
                    "Acortar a cada 6 semanas",
                    "Cambiar mecanismo",
                    "Repetir determinantes y endoscopia",
                ],
            },
            "recommendation": {
                "status": "Pendiente de revisión médica",
                "text": "Discutir en sesión de red si la actividad persistente con exposición intermedia justifica nueva intensificación o prioriza un cambio de mecanismo tras completar endoscopia.",
            },
            "clinicalNote": {
                "status": "Informe generado",
                "text": "Paciente multiexpuesto con ustekinumab intensificado a cada 8 semanas, persistencia de actividad y biomarcadores elevados. Se propone discusión en red con revisión de endoscopia reciente antes de decidir cambio de mecanismo.",
            },
            "followUps": [],
            "demoLocked": True,
            "deletable": False,
        },
        {
            "_id": "case-0009",
            "caseId": "PKPD-2026-0009",
            "demoSeedTag": "infliximab-deintensification-remission",
            "title": "Desintensificación secuencial de infliximab en remisión profunda",
            "patientCode": "P-1310",
            "programId": "prog-crohn-pkpd",
            "specialty": "Digestivo",
            "centerId": "ctr-hub",
            "centerName": "Hospital Universitario de Bellvitge",
            "requesterId": "pro-dig-001",
            "requesterName": "Dra. Ana Beltrán",
            "assignedTo": "pro-farm-001",
            "assignedName": "Dra. Laura Vidal",
            "caseType": "Desintensificación",
            "entrySource": "Seguimiento programado",
            "priority": "Baja",
            "pipelineStage": "Informe validado",
            "nextAction": "Registrar en HCE y mantener seguimiento estrecho",
            "createdAt": "2026-05-06T12:00:00+02:00",
            "updatedAt": "2026-05-17T08:55:00+02:00",
            "clinicalSummary": "Paciente en remisión profunda tras reducción progresiva y espaciamiento de infliximab. El caso es útil para ver gráficamente una desintensificación escalonada con ratificación posterior.",
            "patientProfile": {
                "age": 38,
                "sex": "Mujer",
                "weightKg": 68,
                "heightCm": 170,
                "specialPopulation": [],
            },
            "diseaseContext": {
                "diagnosis": "Enfermedad de Crohn",
                "phenotype": "Ileocolónico",
                "activity": "Remisión profunda",
                "symptoms": "Asintomática",
            },
            "therapyContext": {
                "currentDrug": "Infliximab",
                "currentDose": "5 mg/kg",
                "interval": "Cada 8 semanas",
                "route": "Intravenosa",
                "lastAdministration": "2026-05-05T09:15:00+02:00",
                "previousTherapies": [
                    "Infliximab 10 mg/kg IV cada 6 semanas",
                    "Infliximab 5 mg/kg IV cada 6 semanas",
                    "Infliximab 5 mg/kg IV cada 8 semanas",
                ],
            },
            "labDeterminants": [
                {
                    "label": "Concentración sérica de infliximab",
                    "value": 9.8,
                    "unit": "µg/mL",
                    "status": "Confirmado",
                    "source": "Laboratorio",
                    "relationToDose": "Valle confirmado",
                    "interpretation": "Exposición suficiente en remisión tras desintensificación",
                },
                {
                    "label": "PCR",
                    "value": 1,
                    "unit": "mg/L",
                    "status": "Confirmado",
                    "source": "Laboratorio",
                },
                {
                    "label": "Calprotectina fecal",
                    "value": 65,
                    "unit": "µg/g",
                    "status": "Confirmado",
                    "source": "Laboratorio",
                },
            ],
            "gaps": [],
            "tasks": [
                {
                    "taskId": "tsk-0107",
                    "title": "Validar informe de desintensificación",
                    "ownerRole": "Farmacéutico experto",
                    "ownerId": "pro-farm-001",
                    "priority": "Media",
                    "status": "En curso",
                    "dueDate": "2026-05-18",
                    "createdBy": "Agente de informe HCE",
                },
            ],
            "timeline": [
                {"date": "2024-02-14", "lane": "Tratamiento", "type": "Inicio de tratamiento", "label": "Inicio de infliximab 10 mg/kg IV cada 6 semanas"},
                {"date": "2025-01-09", "lane": "Tratamiento", "type": "Cambio de dosis", "label": "Reducción a infliximab 5 mg/kg IV cada 6 semanas"},
                {"date": "2025-09-18", "lane": "Tratamiento", "type": "Cambio de dosis", "label": "Espaciamiento a infliximab 5 mg/kg IV cada 8 semanas"},
                {"date": "2026-02-20", "lane": "Tratamiento", "type": "Cambio de dosis", "label": "Ratificación de infliximab 5 mg/kg IV cada 8 semanas"},
                {"date": "2026-05-05", "lane": "Administración", "type": "Administración", "label": "Última infusión infliximab 5 mg/kg IV cada 8 semanas"},
                {"date": "2026-05-12", "lane": "Laboratorio", "type": "Determinante recibido", "label": "Nivel 9.8 µg/mL con PCR normal y calprotectina 65"},
                {"date": "2026-05-16", "lane": "Decisiones", "type": "Informe", "label": "Informe validado para mantener pauta actual y seguimiento"},
            ],
            "pkpdInterpretation": {
                "pattern": "Exposición suficiente en remisión tras desintensificación",
                "confidence": "Alta",
                "summary": "La reducción progresiva y el espaciamiento mantienen remisión y exposición suficiente. Caso útil para visualizar ratificación y sostenibilidad terapéutica.",
            },
            "simulation": {
                "currentScenario": "Mantener cada 8 semanas",
                "preferredScenario": "Mantener cada 8 semanas",
                "scenarios": [
                    "Mantener cada 8 semanas",
                    "Nueva desintensificación",
                    "Repetir determinantes",
                ],
            },
            "recommendation": {
                "status": "Validado",
                "text": "Mantener infliximab 5 mg/kg cada 8 semanas. Registrar en HCE y mantener seguimiento programado para confirmar sostenibilidad de la desintensificación.",
            },
            "clinicalNote": {
                "status": "Informe validado",
                "text": "Paciente en remisión profunda con exposición suficiente tras desintensificación secuencial de infliximab. Se valida mantener pauta de 5 mg/kg cada 8 semanas y continuar seguimiento programado.",
            },
            "followUps": [
                {"label": "Seguimiento 4 semanas", "status": "Programado", "dueDate": "2026-06-13"},
                {"label": "Seguimiento 8 semanas", "status": "Programado", "dueDate": "2026-07-11"},
            ],
            "demoLocked": True,
            "deletable": False,
        },
    ]

    tasks = [
        {"_id": "tsk-0101", "caseId": "PKPD-2026-0006", "taskId": "tsk-0101", "title": "Confirmar respuesta clínica a las 8 semanas", "ownerRole": "Digestólogo", "ownerId": "pro-dig-001", "priority": "Media", "status": "Resuelta", "dueDate": "2026-05-03", "createdBy": "Agente de aprendizaje"},
        {"_id": "tsk-0102", "caseId": "PKPD-2026-0006", "taskId": "tsk-0102", "title": "Cerrar caso con outcome documentado", "ownerRole": "Farmacéutico experto", "ownerId": "pro-farm-001", "priority": "Media", "status": "Resuelta", "dueDate": "2026-05-17", "createdBy": "Agente de aprendizaje"},
        {"_id": "tsk-0103", "caseId": "PKPD-2026-0007", "taskId": "tsk-0103", "title": "Confirmar respuesta clínica tras las dos últimas infusiones", "ownerRole": "Enfermería EII", "ownerId": "pro-enf-001", "priority": "Media", "status": "Pendiente", "dueDate": "2026-05-18", "createdBy": "Agente de gaps"},
        {"_id": "tsk-0104", "caseId": "PKPD-2026-0007", "taskId": "tsk-0104", "title": "Revisar si hay beneficio incremental con nueva intensificación", "ownerRole": "Farmacéutico experto", "ownerId": "pro-farm-001", "priority": "Alta", "status": "En curso", "dueDate": "2026-05-18", "createdBy": "Agente PK/PD"},
        {"_id": "tsk-0105", "caseId": "PKPD-2026-0008", "taskId": "tsk-0105", "title": "Solicitar endoscopia reciente para discusión terapéutica", "ownerRole": "Digestólogo", "ownerId": "pro-dig-003", "priority": "Alta", "status": "Pendiente", "dueDate": "2026-05-19", "createdBy": "Agente de gaps"},
        {"_id": "tsk-0106", "caseId": "PKPD-2026-0008", "taskId": "tsk-0106", "title": "Preparar resumen para sesión de red", "ownerRole": "Farmacéutico experto", "ownerId": "pro-farm-002", "priority": "Alta", "status": "En curso", "dueDate": "2026-05-18", "createdBy": "Agente de sesión"},
        {"_id": "tsk-0107", "caseId": "PKPD-2026-0009", "taskId": "tsk-0107", "title": "Validar informe de desintensificación", "ownerRole": "Farmacéutico experto", "ownerId": "pro-farm-001", "priority": "Media", "status": "En curso", "dueDate": "2026-05-18", "createdBy": "Agente de informe HCE"},
    ]

    case_events = [
        {"caseId": "PKPD-2026-0006", "date": "2025-11-04", "lane": "Tratamiento", "type": "Inicio de tratamiento", "label": "Inicio de adalimumab 40 mg SC cada 14 días"},
        {"caseId": "PKPD-2026-0006", "date": "2026-01-20", "lane": "Tratamiento", "type": "Cambio de dosis", "label": "Ajuste a adalimumab 40 mg SC cada 10 días"},
        {"caseId": "PKPD-2026-0006", "date": "2026-02-28", "lane": "Tratamiento", "type": "Cambio de dosis", "label": "Ratificación de adalimumab 40 mg SC cada 10 días"},
        {"caseId": "PKPD-2026-0006", "date": "2026-03-18", "lane": "Tratamiento", "type": "Cambio de dosis", "label": "Intensificación a adalimumab 40 mg SC cada 7 días"},
        {"caseId": "PKPD-2026-0006", "date": "2026-04-05", "lane": "Clínica", "type": "Seguimiento", "label": "Mejoría clara tras intensificación"},
        {"caseId": "PKPD-2026-0006", "date": "2026-04-26", "lane": "Administración", "type": "Administración", "label": "Última administración adalimumab 40 mg SC cada 7 días"},
        {"caseId": "PKPD-2026-0006", "date": "2026-04-30", "lane": "Laboratorio", "type": "Determinante recibido", "label": "Nivel valle en rango tras intensificación"},
        {"caseId": "PKPD-2026-0006", "date": "2026-05-03", "lane": "Decisiones", "type": "Seguimiento", "label": "Seguimiento a 8 semanas completado con respuesta favorable"},
        {"caseId": "PKPD-2026-0007", "date": "2024-09-12", "lane": "Tratamiento", "type": "Inicio de tratamiento", "label": "Inicio de infliximab 5 mg/kg IV cada 8 semanas"},
        {"caseId": "PKPD-2026-0007", "date": "2025-01-21", "lane": "Tratamiento", "type": "Cambio de dosis", "label": "Intensificación a infliximab 5 mg/kg IV cada 6 semanas"},
        {"caseId": "PKPD-2026-0007", "date": "2025-05-09", "lane": "Tratamiento", "type": "Cambio de dosis", "label": "Ratificación de infliximab 5 mg/kg IV cada 6 semanas"},
        {"caseId": "PKPD-2026-0007", "date": "2025-11-10", "lane": "Tratamiento", "type": "Cambio de dosis", "label": "Escalada a infliximab 10 mg/kg IV cada 8 semanas"},
        {"caseId": "PKPD-2026-0007", "date": "2026-03-22", "lane": "Tratamiento", "type": "Cambio de dosis", "label": "Ajuste a infliximab 10 mg/kg IV cada 6 semanas"},
        {"caseId": "PKPD-2026-0007", "date": "2026-05-06", "lane": "Administración", "type": "Administración", "label": "Última infusión infliximab 10 mg/kg IV cada 6 semanas"},
        {"caseId": "PKPD-2026-0007", "date": "2026-05-13", "lane": "Laboratorio", "type": "Determinante recibido", "label": "Valle 6.2 µg/mL con calprotectina 310 µg/g"},
        {"caseId": "PKPD-2026-0007", "date": "2026-05-17", "lane": "Decisiones", "type": "Análisis", "label": "Caso listo para revisar si conviene nueva intensificación o cambio de mecanismo"},
        {"caseId": "PKPD-2026-0008", "date": "2023-10-12", "lane": "Tratamiento", "type": "Inicio de tratamiento", "label": "Inicio de infliximab 5 mg/kg IV cada 8 semanas"},
        {"caseId": "PKPD-2026-0008", "date": "2024-07-04", "lane": "Tratamiento", "type": "Cambio de dosis", "label": "Cambio a adalimumab 40 mg SC cada 14 días"},
        {"caseId": "PKPD-2026-0008", "date": "2025-03-18", "lane": "Tratamiento", "type": "Cambio de dosis", "label": "Inicio de ustekinumab 90 mg SC cada 12 semanas"},
        {"caseId": "PKPD-2026-0008", "date": "2025-11-20", "lane": "Tratamiento", "type": "Cambio de dosis", "label": "Intensificación a ustekinumab 90 mg SC cada 8 semanas"},
        {"caseId": "PKPD-2026-0008", "date": "2026-01-29", "lane": "Tratamiento", "type": "Cambio de dosis", "label": "Ratificación de ustekinumab 90 mg SC cada 8 semanas"},
        {"caseId": "PKPD-2026-0008", "date": "2026-05-02", "lane": "Administración", "type": "Administración", "label": "Última administración ustekinumab 90 mg SC cada 8 semanas"},
        {"caseId": "PKPD-2026-0008", "date": "2026-05-09", "lane": "Laboratorio", "type": "Determinante recibido", "label": "Nivel 4.9 µg/mL con calprotectina 430 µg/g"},
        {"caseId": "PKPD-2026-0008", "date": "2026-05-16", "lane": "Decisiones", "type": "Sesión", "label": "Caso priorizado para discusión de red por duda entre margen PK/PD y cambio de mecanismo"},
        {"caseId": "PKPD-2026-0009", "date": "2024-02-14", "lane": "Tratamiento", "type": "Inicio de tratamiento", "label": "Inicio de infliximab 10 mg/kg IV cada 6 semanas"},
        {"caseId": "PKPD-2026-0009", "date": "2025-01-09", "lane": "Tratamiento", "type": "Cambio de dosis", "label": "Reducción a infliximab 5 mg/kg IV cada 6 semanas"},
        {"caseId": "PKPD-2026-0009", "date": "2025-09-18", "lane": "Tratamiento", "type": "Cambio de dosis", "label": "Espaciamiento a infliximab 5 mg/kg IV cada 8 semanas"},
        {"caseId": "PKPD-2026-0009", "date": "2026-02-20", "lane": "Tratamiento", "type": "Cambio de dosis", "label": "Ratificación de infliximab 5 mg/kg IV cada 8 semanas"},
        {"caseId": "PKPD-2026-0009", "date": "2026-05-05", "lane": "Administración", "type": "Administración", "label": "Última infusión infliximab 5 mg/kg IV cada 8 semanas"},
        {"caseId": "PKPD-2026-0009", "date": "2026-05-12", "lane": "Laboratorio", "type": "Determinante recibido", "label": "Nivel 9.8 µg/mL con PCR normal y calprotectina 65"},
        {"caseId": "PKPD-2026-0009", "date": "2026-05-16", "lane": "Decisiones", "type": "Informe", "label": "Informe validado para mantener pauta actual y seguimiento"},
    ]

    recommendations = [
        {"_id": "rec-0006", "caseId": "PKPD-2026-0006", "status": "Validado", "text": "Mantener adalimumab 40 mg semanal. Registrar respuesta clínica sostenida y documentar el caso como optimización escalonada con outcome favorable."},
        {"_id": "rec-0007", "caseId": "PKPD-2026-0007", "status": "Borrador IA", "text": "Antes de una nueva intensificación conviene revisar la respuesta clínica real tras las dos últimas infusiones y debatir si el cambio de mecanismo ofrece más valor."},
        {"_id": "rec-0008", "caseId": "PKPD-2026-0008", "status": "Pendiente de revisión médica", "text": "Discutir en sesión de red si la actividad persistente con exposición intermedia justifica nueva intensificación o cambio de mecanismo tras completar endoscopia."},
        {"_id": "rec-0009", "caseId": "PKPD-2026-0009", "status": "Validado", "text": "Mantener infliximab 5 mg/kg cada 8 semanas. Registrar en HCE y continuar seguimiento para confirmar sostenibilidad de la desintensificación."},
    ]

    notes = [
        {"_id": "note-0006", "caseId": "PKPD-2026-0006", "status": "Registrado en HCE", "text": "Seguimiento de paciente con Crohn tras intensificación progresiva de adalimumab hasta pauta semanal. Exposición en rango, mejoría clínica y biomarcadores en descenso. Se mantiene la pauta actual y se cierra el caso con outcome favorable documentado."},
        {"_id": "note-0007", "caseId": "PKPD-2026-0007", "status": "Borrador", "text": "Paciente con escalada secuencial de infliximab hasta 10 mg/kg cada 6 semanas. Exposición intermedia y respuesta clínica inestable. Se propone revisión farmacéutica para decidir entre nueva intensificación, ratificación de pauta o cambio de mecanismo."},
        {"_id": "note-0008", "caseId": "PKPD-2026-0008", "status": "Informe generado", "text": "Paciente multiexpuesto con ustekinumab intensificado a cada 8 semanas, persistencia de actividad y biomarcadores elevados. Se propone discusión en red con revisión de endoscopia reciente antes de decidir cambio de mecanismo."},
        {"_id": "note-0009", "caseId": "PKPD-2026-0009", "status": "Informe validado", "text": "Paciente en remisión profunda con exposición suficiente tras desintensificación secuencial de infliximab. Se valida mantener pauta de 5 mg/kg cada 8 semanas y continuar seguimiento programado."},
    ]

    followups = [
        {"_id": "fu-0006-01", "caseId": "PKPD-2026-0006", "label": "Seguimiento 4 semanas", "status": "Completado", "dueDate": "2026-04-05"},
        {"_id": "fu-0006-02", "caseId": "PKPD-2026-0006", "label": "Seguimiento 8 semanas", "status": "Completado", "dueDate": "2026-05-03"},
        {"_id": "fu-0007-01", "caseId": "PKPD-2026-0007", "label": "Seguimiento 4 semanas", "status": "Programado", "dueDate": "2026-06-14"},
        {"_id": "fu-0009-01", "caseId": "PKPD-2026-0009", "label": "Seguimiento 4 semanas", "status": "Programado", "dueDate": "2026-06-13"},
        {"_id": "fu-0009-02", "caseId": "PKPD-2026-0009", "label": "Seguimiento 8 semanas", "status": "Programado", "dueDate": "2026-07-11"},
    ]

    agent_runs = [
        {"_id": "run-0101", "caseId": "PKPD-2026-0006", "agent": "Agente PK/PD", "status": "Completado", "message": "Seguimiento longitudinal consolidado tras intensificación semanal", "timestamp": "2026-05-03T12:10:00+02:00"},
        {"_id": "run-0102", "caseId": "PKPD-2026-0006", "agent": "Agente de aprendizaje", "status": "Completado", "message": "Outcome favorable documentado y listo para conocimiento de red", "timestamp": "2026-05-17T09:20:00+02:00"},
        {"_id": "run-0103", "caseId": "PKPD-2026-0007", "agent": "Agente de gaps", "status": "Completado", "message": "Detectada incertidumbre sobre beneficio incremental tras varias intensificaciones", "timestamp": "2026-05-17T09:45:00+02:00"},
        {"_id": "run-0104", "caseId": "PKPD-2026-0007", "agent": "Agente PK/PD", "status": "Completado", "message": "Patrón sugerido: exposición intermedia tras escalada secuencial", "timestamp": "2026-05-17T09:50:00+02:00"},
        {"_id": "run-0105", "caseId": "PKPD-2026-0008", "agent": "Agente de ingesta", "status": "Completado", "message": "Email convertido en caso multibiológico estructurado", "timestamp": "2026-05-11T10:21:00+02:00"},
        {"_id": "run-0106", "caseId": "PKPD-2026-0008", "agent": "Agente PK/PD", "status": "Completado", "message": "Caso frontera priorizado para discusión entre intensificación y cambio de mecanismo", "timestamp": "2026-05-16T10:05:00+02:00"},
        {"_id": "run-0107", "caseId": "PKPD-2026-0008", "agent": "Agente de sesión", "status": "Completado", "message": "Caso preparado para sesión de red por alto valor clínico y docente", "timestamp": "2026-05-16T10:12:00+02:00"},
        {"_id": "run-0108", "caseId": "PKPD-2026-0009", "agent": "Agente PK/PD", "status": "Completado", "message": "Desintensificación secuencial consolidada con exposición suficiente", "timestamp": "2026-05-16T09:30:00+02:00"},
        {"_id": "run-0109", "caseId": "PKPD-2026-0009", "agent": "Agente de informe HCE", "status": "Completado", "message": "Informe validado para mantener pauta actual y seguimiento programado", "timestamp": "2026-05-16T09:40:00+02:00"},
    ]

    return {
        "cases": cases,
        "tasks": tasks,
        "caseEvents": case_events,
        "recommendations": recommendations,
        "clinicalNotes": notes,
        "followUps": followups,
        "agentRuns": agent_runs,
    }


def ensure_curated_demo_cases() -> dict[str, object]:
    db = get_database()
    curated = _curated_demo_payload()
    template_cases = curated["cases"]
    template_case_ids = {case["caseId"] for case in template_cases}

    existing_tags = {
        doc.get("demoSeedTag")
        for doc in db["xarxa_cases"].find(
            {"demoSeedTag": {"$exists": True}},
            {"_id": 0, "demoSeedTag": 1},
        )
    }
    missing_templates = [
        case for case in template_cases if case.get("demoSeedTag") not in existing_tags
    ]

    if not missing_templates:
        return {"status": "already_present", "inserted": 0, "caseIds": []}

    next_sequence = _max_case_sequence(
        [doc.get("caseId", "") for doc in db["xarxa_cases"].find({}, {"_id": 0, "caseId": 1})]
    )
    template_to_new_case_id: dict[str, str] = {}
    prepared_cases: list[dict] = []

    for template in missing_templates:
        next_sequence += 1
        new_case_id = f"PKPD-2026-{next_sequence:04d}"
        template_to_new_case_id[template["caseId"]] = new_case_id

        case_doc = copy.deepcopy(template)
        case_doc["_id"] = f"case-{next_sequence:04d}"
        case_doc["caseId"] = new_case_id

        remapped_tasks = []
        for index, task in enumerate(case_doc.get("tasks", []), start=1):
            task_copy = copy.deepcopy(task)
            task_copy["taskId"] = f"tsk-{next_sequence:04d}-{index:02d}"
            remapped_tasks.append(task_copy)
        case_doc["tasks"] = remapped_tasks
        prepared_cases.append(case_doc)

    def _replace_case_id(doc: dict) -> dict:
        old_case_id = doc["caseId"]
        new_case_id = template_to_new_case_id.get(old_case_id)
        if not new_case_id:
            return {}
        clone = copy.deepcopy(doc)
        clone["caseId"] = new_case_id
        return clone

    prepared_tasks: list[dict] = []
    for case_doc in prepared_cases:
        for index, task in enumerate(case_doc.get("tasks", []), start=1):
            task_doc = copy.deepcopy(task)
            task_doc["_id"] = task_doc["taskId"]
            task_doc["caseId"] = case_doc["caseId"]
            prepared_tasks.append(task_doc)

    prepared_events: list[dict] = []
    for event in curated["caseEvents"]:
        if event["caseId"] in template_case_ids:
            clone = _replace_case_id(event)
            if clone:
                prepared_events.append(clone)

    prepared_recommendations: list[dict] = []
    for rec in curated["recommendations"]:
        clone = _replace_case_id(rec)
        if not clone:
            continue
        clone["_id"] = f"rec-{clone['caseId'].split('-')[-1]}"
        prepared_recommendations.append(clone)

    prepared_notes: list[dict] = []
    for note in curated["clinicalNotes"]:
        clone = _replace_case_id(note)
        if not clone:
            continue
        clone["_id"] = f"note-{clone['caseId'].split('-')[-1]}"
        prepared_notes.append(clone)

    prepared_followups: list[dict] = []
    for followup in curated["followUps"]:
        clone = _replace_case_id(followup)
        if not clone:
            continue
        sequence = clone["caseId"].split("-")[-1]
        label_slug = re.sub(r"[^a-z0-9]+", "-", clone["label"].lower()).strip("-")
        clone["_id"] = f"fu-{sequence}-{label_slug}"
        prepared_followups.append(clone)

    prepared_runs: list[dict] = []
    for index, run in enumerate(curated["agentRuns"], start=1):
        clone = _replace_case_id(run)
        if not clone:
            continue
        sequence = clone["caseId"].split("-")[-1]
        clone["_id"] = f"run-{sequence}-{index:02d}"
        prepared_runs.append(clone)

    if prepared_cases:
        db["xarxa_cases"].insert_many(prepared_cases)
    if prepared_tasks:
        db["xarxa_tasks"].insert_many(prepared_tasks)
    if prepared_events:
        db["xarxa_events"].insert_many(prepared_events)
    if prepared_recommendations:
        db["xarxa_recommendations"].insert_many(prepared_recommendations)
    if prepared_notes:
        db["xarxa_notes"].insert_many(prepared_notes)
    if prepared_followups:
        db["xarxa_followups"].insert_many(prepared_followups)
    if prepared_runs:
        db["xarxa_agent_runs"].insert_many(prepared_runs)

    db["xarxa_counters"].update_one(
        {"_id": "case"},
        {"$max": {"value": next_sequence}},
        upsert=True,
    )

    return {
        "status": "inserted",
        "inserted": len(prepared_cases),
        "caseIds": [case["caseId"] for case in prepared_cases],
        "tags": [case["demoSeedTag"] for case in prepared_cases],
    }


def seed_xarxa_demo(force: bool = False) -> dict:
    global _seeded
    db = get_database()

    if not force:
        existing_cases = db["xarxa_cases"].count_documents({})
        existing_programs = db["xarxa_programs"].count_documents({})
        if existing_cases > 0 and existing_programs > 0:
            _seeded = True
            return {"status": "already_seeded", "counts": {"cases": existing_cases, "programs": existing_programs}}

    if _seeded and not force:
        return {"status": "already_seeded"}

    reset_xarxa_runtime_state()

    # Drop legacy collections
    for col in _LEGACY_COLLECTIONS:
        db.drop_collection(col)

    # Drop xarxa collections for clean reseed
    for col in _XARXA_COLLECTIONS:
        db.drop_collection(col)

    if not _SEED_FILE.exists():
        return {"status": "error", "detail": f"Seed file not found: {_SEED_FILE}"}

    with open(_SEED_FILE, encoding="utf-8") as f:
        data = json.load(f)

    curated = _curated_demo_payload()
    for key, docs in curated.items():
        data[key] = [*data.get(key, []), *docs]

    inserted: dict[str, int] = {}

    def _insert(collection: str, docs: list[dict]) -> None:
        if docs:
            db[collection].insert_many(docs)
            inserted[collection] = len(docs)

    _insert("xarxa_specialties", data.get("specialties", []))
    _insert("xarxa_roles", data.get("roles", []))
    _insert("xarxa_centers", data.get("centers", []))
    _insert("xarxa_professionals", data.get("professionals", []))
    _insert("xarxa_programs", data.get("clinicalPrograms", []))
    _insert("xarxa_agents", data.get("agents", []))
    _insert("xarxa_forms", data.get("forms", []))
    _insert("xarxa_cases", data.get("cases", []))
    _insert("xarxa_tasks", data.get("tasks", []))
    _insert("xarxa_events", data.get("caseEvents", []))
    _insert("xarxa_recommendations", data.get("recommendations", []))
    _insert("xarxa_notes", data.get("clinicalNotes", []))
    _insert("xarxa_followups", data.get("followUps", []))
    _insert("xarxa_agent_runs", data.get("agentRuns", []))

    # Store reporting seed as a single doc
    reporting = data.get("reportingSeed")
    if reporting:
        db["xarxa_reporting"].drop()
        db["xarxa_reporting"].insert_one(reporting)
        inserted["xarxa_reporting"] = 1

    _seeded = True
    return {"status": "seeded", "inserted": inserted}
