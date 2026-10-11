# Project Architecture Rules

- External threat-intelligence providers use isolated protected ingestion functions that normalize into `news_articles`; this preserves source independence and keeps credentials server-only.
- Provider-specific incident fields live in `news_articles.metadata`; this keeps the public feed schema stable while supporting rich source-aware UI and emails.
- Ingestion functions record sanitized aggregate outcomes in `threat_intel_ingestion_runs`; this provides private operational health without storing provider payloads or credentials.
- Cross-name incident matches require an identical dated social-post reference, exact incident date and equal positive plausible loss; this catches differently titled reports without broad fuzzy merges.
- Generated types include `get_weekly_newsletter`; `list_weekly_newsletters` is cast locally in `WeeklyArchive.tsx` until Lovable regenerates `types.ts` after `20261014100000`, and both local casts should go once it has; this keeps the app compiling without hand edits to generated types.
- New migrations sort after the newest file and keep one signature per RPC name, dropping the old one in the same file; Lovable applies migrations in filename order and an extra overload makes PostgREST calls ambiguous.
- Modules in `supabase/functions/_shared/` that the app or tests import have no `https://` or `npm:` imports, no `Deno` references and no `replaceAll`; Vitest, Vite and the ES2020 target must be able to load them.
- Never hand-edit `src/integrations/supabase/types.ts`, `.lovable/`, `drizzle/` or the root `roadmap.md`; Lovable owns them and overwrites them (the public roadmap is `docs/ROADMAP.md`).
- Never say an incident is verified by Digibastion, name the source on every incident, and keep "Powered by QuillMonitor" on QuillMonitor-only records; Digibastion relays what sources report and does not verify incidents itself, so readers must always see whose claim they are reading.
- No personal email addresses in migrations, seeds, functions or docs, only role addresses on `@digibastion.com`; the repo is public.
- Run `npm run seo:generate` after changing a route, guide or checklist; the sitemap, `llms.txt` and `llms-full.txt` are generated from the same data and a test fails when they drift.
