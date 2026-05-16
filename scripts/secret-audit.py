#!/usr/bin/env python3
"""Fail fast if tracked files or staged changes contain secrets."""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
BLOCKED_TRACKED_PATHS = (
    ".env",
    ".env.local",
    ".env.production",
    ".env.preview",
    ".env.development",
)
BLOCKED_PATH_PREFIXES = (
    ".vercel/",
)
BLOCKED_PATH_SUFFIXES = (
    ".pem",
    ".p12",
    ".key",
    ".crt",
)
TEXT_EXTENSIONS = {
    ".cjs",
    ".css",
    ".env",
    ".example",
    ".html",
    ".js",
    ".json",
    ".jsx",
    ".md",
    ".mjs",
    ".py",
    ".sh",
    ".ts",
    ".tsx",
    ".txt",
    ".yaml",
    ".yml",
}

PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("MongoDB URI with credentials", re.compile(r"mongodb(?:\+srv)?:\/\/[^\/\s:@]+:[^@\s\/]+@", re.IGNORECASE)),
    ("Private key material", re.compile(r"-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----")),
    ("AWS access key", re.compile(r"\b(?:AKIA|ASIA|AIDA|ABIA)[A-Z0-9]{16}\b")),
    ("AWS secret access key assignment", re.compile(r"AWS_SECRET_ACCESS_KEY\s*=\s*[\"']?[^\"'\s#]{8,}")),
    ("OpenAI API key assignment", re.compile(r"OPENAI_API_KEY\s*=\s*[\"']?sk-[^\"'\s#]{10,}")),
    ("Voyage API key assignment", re.compile(r"VOYAGE_API_KEY\s*=\s*[\"']?(?!\"\"|''|<)[^\"'\s#]{8,}")),
    ("Vercel token assignment", re.compile(r"VERCEL_TOKEN\s*=\s*[\"']?(?!\"\"|''|<)[^\"'\s#]{8,}")),
]

ASSIGNMENT_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("MongoDB URI assignment", re.compile(r"MONGODB(?:_ATLAS)?_URI\s*=\s*[\"']?(?P<value>[^\"'\n#]+)")),
    ("OpenAI API key assignment", re.compile(r"OPENAI_API_KEY\s*=\s*[\"']?(?P<value>[^\"'\n#]*)")),
    ("Voyage API key assignment", re.compile(r"VOYAGE_API_KEY\s*=\s*[\"']?(?P<value>[^\"'\n#]*)")),
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Audit tracked files for leaked secrets.")
    parser.add_argument(
        "--staged",
        action="store_true",
        help="Scan staged content instead of the working tree.",
    )
    return parser.parse_args()


def git_lines(*args: str) -> list[str]:
    result = subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    return [line for line in result.stdout.splitlines() if line]


def tracked_files(staged: bool) -> list[str]:
    if staged:
        return git_lines("diff", "--cached", "--name-only", "--diff-filter=ACMR")
    return git_lines("ls-files")


def read_file(path: str, staged: bool) -> str | None:
    try:
        if staged:
            result = subprocess.run(
                ["git", "show", f":{path}"],
                cwd=REPO_ROOT,
                check=True,
                capture_output=True,
            )
            data = result.stdout
        else:
            data = (REPO_ROOT / path).read_bytes()
    except (subprocess.CalledProcessError, OSError):
        return None

    try:
        return data.decode("utf-8")
    except UnicodeDecodeError:
        return None


def looks_like_placeholder(value: str) -> bool:
    lower = value.lower()
    return (
        value == ""
        or value == "..."
        or value.endswith("...")
        or "$" in value
        or "<" in value
        or "example" in lower
        or "changeme" in lower
        or "placeholder" in lower
        or lower.startswith("sk-...")
        or lower.startswith("mongodb+srv://...")
        or lower.startswith("mongodb://...")
        or value in {"your-key", "your-value"}
    )


def is_text_candidate(path: str) -> bool:
    suffix = Path(path).suffix.lower()
    return suffix in TEXT_EXTENSIONS or "." not in Path(path).name


def audit_path_rules(path: str) -> list[str]:
    findings: list[str] = []
    normalized = path.replace("\\", "/")
    name = Path(normalized).name

    if normalized in BLOCKED_TRACKED_PATHS and normalized != ".env.example":
        findings.append(f"blocked tracked secret file: {normalized}")
    if any(normalized.startswith(prefix) for prefix in BLOCKED_PATH_PREFIXES):
        findings.append(f"blocked tracked Vercel metadata: {normalized}")
    if name.endswith(BLOCKED_PATH_SUFFIXES):
        findings.append(f"blocked tracked certificate/key file: {normalized}")

    return findings


def audit_content(path: str, content: str) -> list[str]:
    findings: list[str] = []

    for label, pattern in PATTERNS:
        for match in pattern.finditer(content):
            if looks_like_placeholder(match.group(0).strip()):
                continue
            findings.append(f"{label} in {path}")
            break

    for label, pattern in ASSIGNMENT_PATTERNS:
        for match in pattern.finditer(content):
            value = match.groupdict().get("value", "").strip()
            if not looks_like_placeholder(value):
                findings.append(f"{label} in {path}")
                break

    return findings


def main() -> int:
    args = parse_args()
    paths = tracked_files(args.staged)
    findings: list[str] = []

    for path in paths:
        findings.extend(audit_path_rules(path))
        if not is_text_candidate(path):
            continue
        content = read_file(path, args.staged)
        if content is None:
            continue
        findings.extend(audit_content(path, content))

    if findings:
        print("Secret audit failed:", file=sys.stderr)
        for finding in sorted(set(findings)):
            print(f"  - {finding}", file=sys.stderr)
        return 1

    print("Secret audit passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
