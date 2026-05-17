# PK/PD Nexus AI i18n Setup

The prototype now supports `English`, `Spanish`, and `Catalan` with a lightweight setup:

- `lib/i18n.ts`
  Holds the shared translation dictionary and language helpers.
- `components/i18n/language-provider.tsx`
  Resolves the active language and exposes translated copy through context.
- `components/i18n/language-switcher.tsx`
  Renders the `EN / ES / CA` switcher used across the app.

Resolution order:

1. `?lang=en|es|ca` in the URL
2. `localStorage` key `pkpd-nexus-language`
3. Browser language
4. Default fallback: `en`

Why this is easy to maintain:

- No extra i18n dependency was added.
- New UI copy only needs a key in `lib/i18n.ts`.
- The switcher automatically persists the choice and keeps the `lang` query param in sync.

To add a new translated label:

1. Add the key under `translations.en`, `translations.es`, and `translations.ca` in [lib/i18n.ts](/Users/francesc.mateu/Documents/GitHub/farupeib26-1/lib/i18n.ts).
2. Read it with `const { copy } = useLanguage()`.
3. Replace the hardcoded string with `copy.<section>.<key>`.

Current scope:

- Navigation, landing, pro dashboard, and mobile UI chrome are localized.
- Clinical payloads returned by the backend can still remain source-language unless we explicitly localize or generate them per language.
