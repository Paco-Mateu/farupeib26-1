from __future__ import annotations

from backend.config.settings import ROOT_DIR
from backend.services.runtime_config import get_parallel_runtime_manifest


def _folder_record(label: str, relative_path: str, purpose: str) -> dict[str, object]:
    path = ROOT_DIR / relative_path
    file_count = 0
    if path.exists():
        file_count = sum(1 for item in path.rglob("*") if item.is_file() and item.name != ".gitkeep")
    return {
        "label": label,
        "path": relative_path,
        "purpose": purpose,
        "exists": path.exists(),
        "fileCount": file_count,
    }


def get_workkit_manifest() -> dict[str, object]:
    folders = [
        _folder_record("Brand Assets", "public/brand", "Logos, hero images, event visuals, and screenshots for demos."),
        _folder_record("Prototype Media", "public/prototype-media", "UI captures, diagrams, and image assets tied to a specific prototype."),
        _folder_record("Raw Data", "data/raw", "Original datasets downloaded during the event."),
        _folder_record("Processed Data", "data/processed", "Cleaned or reshaped files ready for ingestion."),
        _folder_record("Synthetic Data", "data/synthetic", "Generated records for demos when real data is unavailable."),
        _folder_record("Prototype Briefs", "docs/briefs", "Short notes about the chosen idea, scope, and constraints."),
        _folder_record("Prompts", "prompts", "System prompts, extraction prompts, evaluation prompts, and quick experiments."),
    ]

    return {
        "name": "Prototype Sprint Kit",
        "goal": "Turn a contest idea into a demonstrable prototype in roughly two hours.",
        "runtime": get_parallel_runtime_manifest(),
        "folders": folders,
        "recommendedFlow": [
            "Capture the winning idea in docs/briefs.",
            "Drop logo and event assets into public/brand.",
            "Choose a public dataset or generate synthetic data into data/raw or data/synthetic.",
            "Wire OpenAI chat and choose OpenAI or Voyage embeddings for the domain workflow.",
            "Persist the working prototype state and demo records in MongoDB.",
        ],
        "starterEndpoints": [
            {"method": "GET", "path": "/api/health", "purpose": "Readiness check for MongoDB and OpenAI."},
            {"method": "GET", "path": "/api/health/openai", "purpose": "Runs a live OpenAI validation through the API."},
            {"method": "GET", "path": "/api/health/voyage", "purpose": "Runs a live Voyage validation through the API."},
            {"method": "GET", "path": "/api/kit", "purpose": "Returns this workspace manifest."},
            {"method": "POST", "path": "/api/ai/openai-check", "purpose": "Runs a tiny OpenAI chat plus embeddings test before the event."},
            {"method": "POST", "path": "/api/ai/voyage-check", "purpose": "Runs a tiny Voyage embeddings plus rerank test before the event."},
            {"method": "POST", "path": "/api/ai/chat", "purpose": "OpenAI chat/completions endpoint."},
            {"method": "POST", "path": "/api/ai/embed", "purpose": "Embeddings endpoint with OpenAI or Voyage provider selection."},
            {"method": "POST", "path": "/api/ai/rerank", "purpose": "Voyage rerank endpoint."},
        ],
    }
