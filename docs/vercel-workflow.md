# Vercel Workflow

## Recommended Shape

Use **one Vercel project per repository**, not one for the frontend and one for the backend.

That matches the current repo structure:

- Next.js frontend in `app/`
- FastAPI backend entrypoint in `api/index.py`
- shared routing under `/api`
- one shared domain
- one shared environment variable set

For the three parallel contest repos, the cleanest setup is:

- `farupeib26-1` -> one Vercel project
- `farupeib26-2` -> one Vercel project
- `farupeib26-3` -> one Vercel project

That means **3 Vercel projects total**, not 6.

## When You Would Split Frontend and Backend

Only split into two Vercel projects if you explicitly want:

- different domains
- different release cadences
- different teams or permissions
- a backend that is shared across several unrelated frontends

If you split them, you would also need to replace the current local and production routing assumptions, because the frontend would no longer treat `/api/*` as part of the same deployment.

## Local Link

This repo does not store the Vercel project link in git because `.vercel/` is ignored.

To link the current repo locally:

```bash
bash scripts/vercel-link.sh
```

To check link status:

```bash
bash scripts/vercel-project-status.sh
```

## Syncing Environment Variables

Push non-empty values from `.env.local` to the linked Vercel project:

```bash
bash scripts/vercel-env-push.sh .env.local
```

By default, this syncs to:

- `development`
- `preview`
- `production`

It intentionally skips a few local-only keys unless you opt in:

- `PORT`
- `FRONTEND_PORT`
- `BACKEND_PORT`

To preview what would be pushed:

```bash
python3 scripts/vercel-env-sync.py --file .env.local --dry-run
```

To pull environment variables back from Vercel:

```bash
bash scripts/vercel-env-pull.sh development
bash scripts/vercel-env-pull.sh preview
bash scripts/vercel-env-pull.sh production
```

Those commands write to:

- `.env.vercel.development.local`
- `.env.vercel.preview.local`
- `.env.vercel.production.local`

## Suggested Pre-Contest Checklist

1. Link each repo to its own Vercel project.
2. Push `.env.local` into Vercel for each repo.
3. Set the real public URL in `NEXT_PUBLIC_DEMO_URL`.
4. Run `npm run openai:check`.
5. Start the local stack with `npm run demo:start`.
