# Prototype Sprint Kit

This repository is a reusable contest-day work kit for building a convincing prototype fast.

It is structured around:

- Next.js App Router frontend
- FastAPI backend served through `api/index.py`
- MongoDB persistence
- OpenAI chat/completions plus optional OpenAI or Voyage embeddings
- prepared folders for assets, prompts, briefs, and datasets
- reserved seams for lightweight auth and multi-tenancy when a prototype needs them

## Route Shape

The frontend is split into three entry points:

- `/` -> landing page / expectation page
- `/pro` -> professional desktop portal
- `/app` -> end-user mobile-oriented portal

That gives you one public URL for the teaser, one desktop flow, and one mobile flow without needing separate repos or deployments.

## Project Layout

```text
backend/
  auth/
  config/
  db/
  multitenancy/
  providers/
  routes/
  schemas/
  services/
api/
  index.py
app/
public/
  brand/
  prototype-media/
data/
  raw/
  processed/
  synthetic/
docs/
  briefs/
prompts/
scripts/
```

## Local Setup

1. Copy the environment template:

```bash
cp .env.example .env.local
```

2. Fill in the values you need:

```bash
PROJECT_SLOT=1
PROJECT_NAME="FarupeIB 26 Prototype 1"
APP_NAME=prototype-sprint-kit
MONGODB_URI=<your_mongodb_connection_string>
DATABASE_NAME=proto1
BACKEND_PORT=8001
FRONTEND_PORT=3001
OPENAI_API_KEY=<your_openai_key>
OPENAI_CHAT_MODEL=gpt-5.4-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
VOYAGE_API_KEY=<your_voyage_key>
VOYAGE_EMBEDDING_MODEL=voyage-4-lite
VOYAGE_RERANK_MODEL=rerank-2.5-lite
NEXT_PUBLIC_DEMO_URL=https://farupeib26-1.vercel.app
NEXT_PUBLIC_DEMO_URL_PORTAL=https://farupeib26-1.vercel.app/pro
NEXT_PUBLIC_DEMO_URL_APP=https://farupeib26-1.vercel.app/app
```

The backend also accepts `PUBLIC_DEMO_URL`, `PUBLIC_DEMO_URL_PORTAL`, and `PUBLIC_DEMO_URL_APP`, and it normalizes bare hostnames like `farupeib26-1.vercel.app` to `https://...` automatically.

3. Install dependencies:

```bash
npm install
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

4. Start the local stack:

```bash
npm run demo:start
```

With slot `1`, the frontend runs on `http://localhost:3001` and the FastAPI server runs on `http://127.0.0.1:8001`.

## Slot Setup

To generate a slot-specific `.env.local` quickly:

```bash
bash scripts/setup-slot.sh 1 "<your_mongodb_connection_string>" "http://localhost:3001"
```

Use the same command with `2` and `3` for the sibling repos:

- slot `1`: frontend `3001`, backend `8001`, database `proto1`
- slot `2`: frontend `3002`, backend `8002`, database `proto2`
- slot `3`: frontend `3003`, backend `8003`, database `proto3`

## OpenAI Readiness

This repo now validates OpenAI through both chat/completions and embeddings.

Run the preflight:

```bash
npm run openai:check
```

That performs:

- a tiny OpenAI chat/completions call
- a tiny OpenAI embeddings call
- failure-fast checks for missing `OPENAI_API_KEY` or model configuration

There is also a live API health endpoint:

- `GET /api/health` -> cheap readiness and config status
- `GET /api/health/openai` -> live OpenAI validation

Optional Voyage validation:

```bash
npm run voyage:check
```

That performs a tiny Voyage embeddings request and a tiny Voyage rerank request.

## Demo Scripts

To stop the local stack:

```bash
npm run demo:stop
```

The demo scripts:

- start FastAPI first
- wait for backend readiness
- start Next.js in the foreground
- write logs under `logs/`
- manage PID files under `logs/pids/`

## Starter Endpoints

- `GET /api/health` -> readiness for MongoDB, OpenAI, and Voyage
- `GET /api/health/openai` -> live OpenAI validation
- `GET /api/health/voyage` -> live Voyage validation
- `GET /api/kit` -> workspace manifest and prepared folders
- `POST /api/ai/openai-check` -> OpenAI runtime validation
- `POST /api/ai/voyage-check` -> Voyage runtime validation
- `POST /api/ai/chat` -> OpenAI chat/completions endpoint
- `POST /api/ai/embed` -> OpenAI or Voyage embeddings endpoint
- `POST /api/ai/rerank` -> Voyage rerank endpoint

## Secret Safety

The repo includes a secret audit, local git hooks, and CI guardrails so real keys do not end up in git by accident.

Install the hooks once per clone:

```bash
npm run security:hooks
```

Run the audit manually:

```bash
npm run security:check
```

What is blocked:

- tracked `.env` files
- tracked `.vercel/` metadata
- MongoDB URIs with credentials
- OpenAI keys
- private key material
- Vercel tokens

## Prepared Folders

- `public/brand/` -> logos and event visuals
- `public/prototype-media/` -> screenshots and prototype-specific assets
- `data/raw/` -> downloaded public datasets
- `data/processed/` -> cleaned or transformed data
- `data/synthetic/` -> generated demo data
- `docs/briefs/` -> short project briefs created during the event
- `prompts/` -> prompts and quick experiments
- `logs/` -> runtime logs created by the demo scripts

## Deployment Notes

- The repo is structured for one combined Next.js + FastAPI deployment on Vercel.
- The recommended setup is one Vercel project per repository.
- For the three parallel repos, the clean target is `farupeib26-1`, `farupeib26-2`, and `farupeib26-3` mapped to three separate Vercel projects.
- Put `MONGODB_URI`, `DATABASE_NAME`, `OPENAI_API_KEY`, `OPENAI_CHAT_MODEL`, `OPENAI_EMBEDDING_MODEL`, `VOYAGE_API_KEY`, `VOYAGE_EMBEDDING_MODEL`, and `VOYAGE_RERANK_MODEL` into Vercel Project Settings.
- Also set `NEXT_PUBLIC_DEMO_URL`, `NEXT_PUBLIC_DEMO_URL_PORTAL`, and `NEXT_PUBLIC_DEMO_URL_APP` so the teaser page and QR code use the right public URLs.

## Vercel Sync

To link the current repo locally:

```bash
npm run vercel:link
```

To confirm whether the repo is linked:

```bash
npm run vercel:status
```

To push the non-empty keys from `.env.local` to Vercel:

```bash
npm run vercel:env:push
```

To pull them back:

```bash
npm run vercel:env:pull:dev
npm run vercel:env:pull:preview
npm run vercel:env:pull:prod
```

By default, the push helper skips local-only keys:

- `PORT`
- `FRONTEND_PORT`
- `BACKEND_PORT`

The fuller guide is in [docs/vercel-workflow.md](/Users/francesc.mateu/Documents/GitHub/farupeib26-1/docs/vercel-workflow.md:1).

## Deployment Cycle

To verify the local deployment path end to end:

```bash
npm run deploy:check
```

That script:

- runs the secret audit
- validates OpenAI chat/completions and embeddings
- validates Voyage embeddings and rerank when configured
- compiles the Python backend
- builds the Next.js app
- starts the local stack
- checks `/`, `/app`, `/pro`, `/api/health`, `/api/health/openai`, and `/api/health/voyage`
- runs `vercel pull` and `vercel build` when the repo is linked locally

If you want the script to also create a Vercel deployment:

```bash
npm run deploy:preview
npm run deploy:prod
```
