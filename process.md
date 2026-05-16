# FarupeIB 26 Prototype Process

## Goal

This repo is a sprint kit for building a convincing prototype in about two hours during the contest.

The kit should let us:

- start from a stable full-stack base
- keep secrets out of git
- run three prototypes in parallel without port collisions
- deploy each prototype from GitHub to Vercel
- support both end-user and professional entry points
- plug in MongoDB and OpenAI quickly once the contest idea is known

## Core Structure

- Frontend: Next.js in `app/`
- Backend: FastAPI via `api/index.py` and `backend/`
- Database: MongoDB
- AI providers: OpenAI for chat/completions, Voyage optional for embeddings and rerank
- Reserved seams: `backend/auth/` and `backend/multitenancy/`
- Static assets: `public/brand/` and `public/prototype-media/`
- Data: `data/raw/`, `data/processed/`, `data/synthetic/`
- Notes and prompts: `docs/briefs/` and `prompts/`

## Route Contract

The current frontend split is:

- `/` for the event landing page / expectation page
- `/app` for the end-user or mobile-oriented portal
- `/pro` for the professional or desktop-oriented portal

| Route | Portal | Layout |
| --- | --- | --- |
| `/` | Kit landing page | Teaser / QR code page |
| `/pro` | Professional (desktop) | Fixed sidebar + scrollable main |
| `/app` | End user (mobile) | Fixed `100dvh` shell + top header + bottom nav |

Important mobile assumptions for `/app`:

- fixed shell with `height: 100dvh`
- safe-area insets for notches
- bottom navigation designed for app-like movement
- `userScalable: false` in viewport metadata

## Parallel Repo Map

We are working with three repositories in parallel:

| Repo | Frontend | Backend | Database |
| --- | --- | --- | --- |
| `farupeib26-1` | `3001` | `8001` | `proto1` |
| `farupeib26-2` | `3002` | `8002` | `proto2` |
| `farupeib26-3` | `3003` | `8003` | `proto3` |

The MongoDB cluster can stay the same across all three repos as long as the database name changes per repo.

## Secret Rules

These rules are non-negotiable:

1. Never commit `.env`, `.env.local`, `.vercel/`, private keys, or real tokens.
2. Keep real values only in local env files and in Vercel project settings.
3. Commit only `.env.example` with placeholders.
4. Run the secret audit before push if anything sensitive changed.

Guardrails already in this repo:

- `npm run security:check`
- `npm run security:hooks`
- local git hooks in `.githooks/`
- GitHub Actions workflow in `.github/workflows/guardrails.yml`

## Frontend Stack

Installed and configured before the contest:

- **Next.js 14** (App Router, Server Components)
- **shadcn/ui v4** — component library, `base-nova` style, neutral palette
- **Tailwind CSS v4** — `@import "tailwindcss"` syntax, `@tailwindcss/postcss`
- **Framer Motion** — animations; used for bottom-nav spring indicator
- **Geist Sans** — from `geist` npm package (not `next/font/google`)
- **Lucide React** — icons bundled with shadcn

Portal layouts already wired:

| Route | Layout | Key file |
| --- | --- | --- |
| `/` | Landing + QR + provider status | `app/page.tsx` (Server Component) |
| `/pro` | Fixed 260px sidebar + scrollable main | `app/pro/layout.tsx` |
| `/app` | `100dvh` shell + top header + Framer Motion bottom nav | `app/app/layout.tsx` |

The landing page reads env vars directly as a Server Component — no `NEXT_PUBLIC_` prefix needed for any landing variable. Only the `ProviderStatus` client component exists on the client side (fetches `/api/health`).

## Environment Variables

Minimal set — `APP_NAME` is the single source of truth for display name and database name:

```bash
APP_NAME=proto1
PROJECT_NAME="FarupeIB 26 Prototype 1"
BACKEND_PORT=8001
FRONTEND_PORT=3001

MONGODB_URI="mongodb+srv://..."
DATABASE_NAME=proto1

OPENAI_API_KEY="sk-..."
OPENAI_CHAT_MODEL="gpt-4.1-mini"
OPENAI_EMBEDDING_MODEL="text-embedding-3-small"
VOYAGE_API_KEY="..."
VOYAGE_EMBEDDING_MODEL="voyage-4-lite"
VOYAGE_RERANK_MODEL="rerank-2.5-lite"

PUBLIC_DEMO_URL=https://farupeib26-1.vercel.app
PUBLIC_DEMO_URL_PORTAL=https://farupeib26-1.vercel.app/pro
PUBLIC_DEMO_URL_APP=https://farupeib26-1.vercel.app/app
WAITLIST_HEADLINE="We are building this prototype live today."
```

Variables you do NOT need (removed as redundant):

- `PROJECT_SLOT` — only a port fallback; with explicit `BACKEND_PORT` and `FRONTEND_PORT` set, it is unused
- `NEXT_PUBLIC_DEMO_URL` / `NEXT_PUBLIC_DEMO_URL_PORTAL` / `NEXT_PUBLIC_DEMO_URL_APP` — landing page is a Server Component, reads non-prefixed vars directly
- `NEXT_PUBLIC_PROJECT_NAME` / `NEXT_PUBLIC_WAITLIST_HEADLINE` / `NEXT_PUBLIC_WAITLIST_MESSAGE` — same reason

Rules for env management:

- local development uses `.env.local`
- tracked placeholders live in `.env.example`
- production and preview values live in Vercel project settings
- bare hostnames like `farupeib26-1.vercel.app` are normalized to `https://...` at runtime by the backend settings layer

## One-Time Setup Per Repo

Run this once inside each of `farupeib26-1`, `farupeib26-2`, and `farupeib26-3`.

```bash
npm install
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
npm run security:hooks
```

Then create the slot-specific local env:

```bash
bash scripts/setup-slot.sh 1
```

Use `1`, `2`, or `3` depending on the repo, then fill `.env.local` with the real values.

## OpenAI Readiness

Before the contest, OpenAI must be validated so it does not fail during the build sprint.

Use:

```bash
npm run openai:check
```

That check performs:

- one tiny OpenAI chat/completions request
- one tiny OpenAI embeddings request
- failure-fast validation for missing key or missing default models

Optional Voyage check:

```bash
npm run voyage:check
```

That performs one tiny Voyage embeddings request and one tiny Voyage rerank request.

The backend also exposes:

- `GET /api/health` for cheap readiness
- `GET /api/health/openai` for live OpenAI validation
- `GET /api/health/voyage` for live Voyage validation
- `POST /api/ai/openai-check` for an explicit API runtime check

## Local Development Flow

Standard local startup:

```bash
npm run demo:start
```

Standard local shutdown:

```bash
npm run demo:stop
```

The startup script:

- starts FastAPI first
- waits for backend health
- starts Next.js
- writes logs under `logs/`
- avoids port collisions where possible

For a full local validation pass:

```bash
npm run deploy:check
```

That command verifies:

- secret audit
- OpenAI runtime
- Python compile health
- production Next.js build
- local startup
- route checks for `/`, `/app`, `/pro`, `/api/health`, and `/api/health/openai`
- Vercel build flow if the repo is linked locally

## GitHub and Vercel Structure

Recommended deployment shape:

- one GitHub repo per prototype
- one Vercel project per repo

That means:

- `farupeib26-1` -> one Vercel project
- `farupeib26-2` -> one Vercel project
- `farupeib26-3` -> one Vercel project

We are not splitting frontend and backend into separate Vercel projects unless there is a strong reason later.

## Vercel Local Linking

The Vercel link is local only and is not committed because `.vercel/` is ignored.

Per repo:

```bash
npm run vercel:link
npm run vercel:status
```

## Syncing `.env.local` to Vercel

After local linking, push the env values to Vercel:

```bash
npm run vercel:env:push
```

Pull them back if needed:

```bash
npm run vercel:env:pull:dev
npm run vercel:env:pull:preview
npm run vercel:env:pull:prod
```

By default, the sync skips local-only values:

- `PORT`
- `FRONTEND_PORT`
- `BACKEND_PORT`

## Contest-Day Runbook

Before the event:

1. Confirm MongoDB is reachable.
2. Confirm `npm run openai:check` passes.
3. Confirm `npm run deploy:check` passes.
4. Confirm the Vercel project is linked and env vars are synced.
5. Confirm the public QR URL points to the correct landing page.

When the idea is announced:

1. Write a short problem statement in `docs/briefs/`.
2. Decide whether the prototype uses public data, synthetic data, or both.
3. Drop any logo or visuals into `public/brand/`.
4. Define the first three API capabilities the prototype must demonstrate.
5. Keep the data model small and seed only what helps the demo.
6. Start with one strong user journey before expanding.

Before the final demo:

1. Re-run `npm run deploy:check`.
2. Verify `/`, `/pro`, and `/app` on the public domain.
3. Verify `GET /api/health` and `GET /api/health/openai`.
4. Confirm the QR code still points to the intended URL.

## Scaffolding Status (2026-05-16)

All three repos are fully scaffolded, aligned, and ready to build on.

**What is ready:**

- Landing page with QR code, live provider status (MongoDB / OpenAI / Voyage), and portal links
- `/pro` desktop portal — blank canvas with fixed sidebar and scrollable main area
- `/app` mobile portal — blank canvas with fixed `100dvh` shell, top header, Framer Motion bottom nav, safe-area insets
- FastAPI backend with working routes: `/api/health`, `/api/health/openai`, `/api/health/voyage`, `/api/ai/chat`, `/api/ai/embed`, `/api/ai/rerank`
- MongoDB connection singleton ready (just needs `MONGODB_URI` in `.env.local`)
- All `/api/*` traffic proxied from Next.js to FastAPI in dev and on Vercel
- Env config simplified: `APP_NAME` drives database name and display name; `NEXT_PUBLIC_*` duplicates removed
- Reserved stubs: `backend/auth/`, `backend/multitenancy/`

**What to add during the sprint:**

1. A short problem brief in `docs/briefs/`
2. MongoDB write/query routes in `backend/routes/` once the data model is known
3. Portal page content in `app/pro/page.tsx` and `app/app/page.tsx`
4. Nav sections in `components/pro/sidebar.tsx` and `components/app/bottom-nav.tsx`

## Current Assumptions

- MongoDB is the shared persistence layer.
- OpenAI is the primary AI runtime.
- `gpt-4.1-mini` is the default chat/completions model unless we choose a stronger model for a specific prototype.
- `text-embedding-3-small` is the default embeddings model unless the prototype needs higher recall or multilingual quality.
