# Prototype Playbook

This repository is set up as a sprint kit for building a convincing prototype in roughly two hours.

## Fast Flow

1. Write a one-paragraph problem statement in `docs/briefs/`.
2. Decide whether the prototype uses public data, synthetic data, or both.
3. Drop the logo and event visuals into `public/brand/`.
4. Define the first three API capabilities the prototype must demonstrate.
5. Use OpenAI chat/completions for the core reasoning flow and OpenAI embeddings when the idea benefits from search or retrieval.
6. Store demo-ready records in MongoDB so the UI can show persistent state.

## Suggested First Cuts

- Start with one happy-path user journey.
- Keep the data model small.
- Make the health page work before building the domain workflow.
- Prefer one strong AI interaction over several weak ones.
