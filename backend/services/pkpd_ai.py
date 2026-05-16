from __future__ import annotations

from typing import Any

from backend.providers.openai import OpenAIConfigurationError, OpenAIPlatformClient
from backend.services.pkpd_repository import get_case_workspace, upsert_knowledge_product


PKPD_COPILOT_SYSTEM_PROMPT = """
You are the PK/PD Nexus AI copilot for a hospital pharmacokinetics and pharmacodynamics collaboration network.
You are not diagnosing or prescribing.
You only draft grounded summaries and documentation support for pharmacists and clinicians.

Rules:
- Use only the supplied case, protocol, similar-case, and FHIR context.
- Explain deterministic reasons clearly.
- Be concise, practical, and clinically respectful.
- If information is missing, say so directly.
- Avoid definitive treatment decisions. Frame actions as review-ready suggestions for expert validation.
""".strip()


def _workspace_snapshot(workspace: dict[str, Any]) -> str:
    case = workspace.get("case") or {}
    protocol_match = workspace.get("protocolMatch") or {}
    fhir_context = workspace.get("fhirContext") or {}
    patient = workspace.get("patient") or {}
    similar_cases = workspace.get("similarCases") or []
    interventions = workspace.get("expertInterventions") or []

    protocol = protocol_match.get("protocol") or {}
    chunk_lines = [
        f"- {row.get('section')}: {row.get('chunkText')}"
        for row in (protocol_match.get("topChunks") or [])[:3]
    ]
    similar_lines = [
        f"- {row.get('drugName')} | matched signals: {', '.join(row.get('matchedSignals') or [])} | summary: {row.get('summary')}"
        for row in similar_cases[:3]
    ]
    intervention_lines = [
        f"- {row.get('decisionSummary')} | rationale: {row.get('rationale')}"
        for row in interventions[:2]
    ]
    fhir_summary = (fhir_context.get("summary") or {})

    return f"""
Case ID: {case.get('_id')}
Drug: {case.get('drugName')}
Therapeutic area: {case.get('therapeuticArea')}
Priority: {case.get('priority')}
Status: {case.get('status')}
Case reason: {case.get('caseReason')}
Risk signals: {', '.join(case.get('riskSignals') or [])}
Stored explanation: {(case.get('ai') or {}).get('explanation')}
Missing data: {', '.join((case.get('ai') or {}).get('missingData') or [])}
Clinical question: {case.get('clinicalQuestion')}

Patient:
- Demo patient id: {patient.get('_id')}
- Name: {(case.get('patientSnapshot') or {}).get('displayName')}
- Age: {(case.get('patientSnapshot') or {}).get('age')}
- Sex: {(case.get('patientSnapshot') or {}).get('sex')}
- FHIR linked ref: {case.get('syntheaPatientRef')}

Protocol:
- Title: {protocol.get('title')}
- Matched terms: {', '.join(protocol_match.get('matchedTerms') or [])}
{chr(10).join(chunk_lines) if chunk_lines else '- No protocol chunks found'}

Similar historical cases:
{chr(10).join(similar_lines) if similar_lines else '- No similar cases found'}

Validated interventions:
{chr(10).join(intervention_lines) if intervention_lines else '- No validated interventions found'}

FHIR context:
- Conditions: {', '.join(fhir_summary.get('conditions') or [])}
- Medications: {', '.join(fhir_summary.get('medications') or [])}
- Resource counts: {fhir_summary.get('resourceCounts') or {}}
""".strip()


def _fallback_summary(workspace: dict[str, Any]) -> dict[str, Any]:
    case = workspace.get("case") or {}
    protocol_match = workspace.get("protocolMatch") or {}
    similar_cases = workspace.get("similarCases") or []

    text = (
        f"{(case.get('patientSnapshot') or {}).get('displayName')} is currently in the "
        f"{case.get('priority')} priority PK/PD queue for {case.get('drugName')}. "
        f"The case was surfaced because {case.get('caseReason').lower()} "
        f"Key deterministic signals are {', '.join(case.get('riskSignals') or [])}. "
        f"The current reference protocol match is "
        f"{((protocol_match.get('protocol') or {}).get('title') or 'pending')}. "
        f"{len(similar_cases)} validated historical cases are available for comparison."
    )
    return {
        "text": text,
        "source": "deterministic_fallback",
        "warning": "OpenAI live generation was unavailable, so the copilot used grounded deterministic phrasing.",
    }


def _fallback_intervention(workspace: dict[str, Any]) -> dict[str, Any]:
    case = workspace.get("case") or {}
    protocol_match = workspace.get("protocolMatch") or {}
    first_section = ((protocol_match.get("topChunks") or [{}])[0] or {}).get("chunkText")

    text = (
        f"Draft intervention note for {case.get('_id')}: "
        f"Review {case.get('drugName')} exposure in the context of {case.get('caseReason').lower()} "
        f"Deterministic triage assigned {case.get('priority')} priority with signals "
        f"{', '.join(case.get('riskSignals') or [])}. "
        f"Reference protocol focus: {first_section or 'reference review packet pending additional protocol extraction'}. "
        "Recommendation draft is for expert validation before any clinical-facing use."
    )
    return {
        "text": text,
        "source": "deterministic_fallback",
        "warning": "OpenAI live generation was unavailable, so this note was composed from deterministic evidence only.",
    }


def _generate_with_openai(*, prompt: str) -> str:
    client = OpenAIPlatformClient()
    response = client.chat(
        messages=[{"role": "user", "content": prompt}],
        system_prompt=PKPD_COPILOT_SYSTEM_PROMPT,
        max_tokens=500,
        temperature=0.2,
    )
    return str(response.get("text") or "").strip()


def generate_case_summary(case_id: str) -> dict[str, Any]:
    workspace = get_case_workspace(case_id)
    if workspace is None:
        raise ValueError(f"Case {case_id} was not found.")

    prompt = (
        "Write a concise expert-review summary for this PK/PD case. "
        "Use 2 short paragraphs. Mention why the case is prioritized, what is missing, "
        "and what the team should review next. Do not prescribe or diagnose.\n\n"
        + _workspace_snapshot(workspace)
    )

    try:
        text = _generate_with_openai(prompt=prompt)
        payload = {"text": text, "source": "openai"}
    except OpenAIConfigurationError:
        payload = _fallback_summary(workspace)
    except Exception:
        payload = _fallback_summary(workspace)

    knowledge_product = upsert_knowledge_product(
        case_id=case_id,
        product_type="case_summary_card",
        content={
            "headline": payload["text"],
            "clinicalQuestion": (workspace.get("case") or {}).get("clinicalQuestion"),
            "keySignals": (workspace.get("case") or {}).get("riskSignals") or [],
            "recommendedNextStep": "expert_review_required",
        },
        generated_by=payload["source"],
    )
    return {
        "caseId": case_id,
        "summary": payload["text"],
        "source": payload["source"],
        "warning": payload.get("warning"),
        "knowledgeProduct": knowledge_product,
    }


def draft_intervention_note(case_id: str) -> dict[str, Any]:
    workspace = get_case_workspace(case_id)
    if workspace is None:
        raise ValueError(f"Case {case_id} was not found.")

    prompt = (
        "Draft a concise intervention note for the clinical record. "
        "Structure it as Situation, Evidence, Suggested next review step. "
        "Make it explicitly clear that the recommendation requires expert validation.\n\n"
        + _workspace_snapshot(workspace)
    )

    try:
        text = _generate_with_openai(prompt=prompt)
        payload = {"text": text, "source": "openai"}
    except OpenAIConfigurationError:
        payload = _fallback_intervention(workspace)
    except Exception:
        payload = _fallback_intervention(workspace)

    knowledge_product = upsert_knowledge_product(
        case_id=case_id,
        product_type="intervention_note_draft",
        content={
            "headline": payload["text"],
            "clinicalQuestion": (workspace.get("case") or {}).get("clinicalQuestion"),
            "keySignals": (workspace.get("case") or {}).get("riskSignals") or [],
            "recommendedNextStep": "expert_validation_required",
        },
        generated_by=payload["source"],
    )
    return {
        "caseId": case_id,
        "draftIntervention": payload["text"],
        "source": payload["source"],
        "warning": payload.get("warning"),
        "knowledgeProduct": knowledge_product,
    }
