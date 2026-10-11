# Contributing to Digibastion

Contributions from security practitioners, developers, designers, writers,
educators and people who use the site are welcome. Small fixes count: correcting
one unsafe instruction or reproducing one mobile bug is useful work.

The repository is source-available under the terms in [`LICENSE`](LICENSE),
which include a Commons Clause restriction. By contributing, you agree that your
contribution can be distributed under those terms.

## Before you begin

- Use a public GitHub issue for bugs, content corrections and feature ideas.
- Use the private process in [`SECURITY.md`](SECURITY.md) for vulnerabilities,
  leaked credentials, or advice that could put users at immediate risk.
- Open an issue before work that changes the architecture, the data model, a
  threat source, authentication, email behavior, or several routes at once.
- Never put real credentials, subscriber data, private incident data, raw
  provider payloads or client data in an issue or pull request.

The priorities are in [`docs/ROADMAP.md`](docs/ROADMAP.md). How the system fits
together is in
[`docs/PRODUCT_AND_ARCHITECTURE.md`](docs/PRODUCT_AND_ARCHITECTURE.md), and
[`docs/README.md`](docs/README.md) lists every other document.

## Set up the project

You need Node.js 22.12 or later and npm.

```bash
git clone https://github.com/YOUR-USERNAME/digibastion.git
cd digibastion
npm ci
npm run dev          # http://127.0.0.1:8080
```

The app reads from the production backend by default, using the public anon
key. Do not submit forms that write data (subscribe, contact, quiz scores)
against production. To test those, copy `.env.example` to `.env` and point
`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` at your own Supabase
project. Never use production service-role keys or provider credentials for
local work.

The production backend is Supabase on Lovable Cloud. Maintainers reach its
database, functions, logs and secrets through **View Backend** in Lovable; there
is no separate Supabase dashboard. If your change needs a production check you
cannot run, say so in the pull request and a maintainer will run it.

Before you open a pull request, run:

```bash
npm run check
```

That runs `npm run typecheck` (the app's `tsconfig.app.json` and the build
scripts' `tsconfig.node.json`), ESLint, the Vitest suite and the production
build. For UI changes, also look at narrow mobile, tablet and desktop widths,
use the keyboard, and try reduced motion.

## Rules the code depends on

These rules are enforced by tests, by Lovable's release process, or by the
public nature of the repo. Breaking one usually breaks something you cannot see
from your branch.

- **Run `npm run seo:generate` after changing a route, a guide or a checklist.**
  It rewrites `public/sitemap.xml`, `public/sitemap-index.xml`,
  `public/llms.txt` and `public/llms-full.txt`.
  `src/seo/__tests__/generatedFilesInSync.test.ts` fails until you do. New
  public routes also need an entry in `src/seo/routeMeta.ts`.
- **Shared modules stay pure.** Anything in `supabase/functions/_shared/` that
  the app or a test imports must have no `https://` or `npm:` imports, no
  `Deno` references and no `String.prototype.replaceAll` (the TypeScript target
  is ES2020). Shared modules import each other with the `.ts` extension.
  Otherwise Vitest and the build cannot load them.
- **Migrations.** New files sort after the newest one in `supabase/migrations/`.
  Keep one signature per RPC name: if you change an RPC's arguments, drop the old
  signature in the same file. Never edit a migration that has been applied;
  Lovable's migration history has to match byte for byte. A migration that
  schedules a cron job starts with a
  `-- lovable-cron-fallback-reviewed: <why a poll>` comment, calls
  `public.record_cron_http_request(...)`, unschedules the job name first, and
  runs at most 48 times a day.
- **Do not edit by hand:** `src/integrations/supabase/types.ts` (Lovable
  regenerates it), `.lovable/`, `drizzle/`, and `roadmap.md` at the repo root
  (Lovable's working log; the real roadmap is `docs/ROADMAP.md`).
- **Functions authenticate their callers.** Every function in
  `supabase/config.toml` has `verify_jwt = false` and checks callers itself. A
  cron-called function compares the bearer token with `CRON_SECRET` in constant
  time and also accepts the service-role key or an admin user's token. Copy
  `timingSafeEqual()` and `authorize()` from
  `supabase/functions/send-newsletters/index.ts`; never compare secrets with
  `===`.
- **Attribution words.** Never write that Digibastion verified an incident.
  Name the source on every incident, everywhere. Status words come only from the
  source: confirmed or unconfirmed. Keep "Powered by QuillMonitor" on any record
  whose only source is QuillMonitor. Write losses as "about $X" or "~$X
  reported".
- **Honest timing.** Incident sources are checked every 30 minutes or less
  often. Do not describe the feed or alerts as "instant" or "as they happen".
- **No secrets and no personal data in the repo.** Name environment variables;
  never quote their values. Use role addresses on `@digibastion.com`, never a
  personal email, including in migrations and seed data.
  `src/utils/__tests__/publicFilesNoSecrets.test.ts` scans `public/`,
  `supabase/functions/` and `edge/` for keys and personal addresses.

## What to work on

### Security checklist items

Each checklist is a file in `src/data/categories/` using the `SecurityItem`
type from `src/types/security.ts`:

```typescript
{
  id: 'category-unique-id',
  title: 'Use a security key for important accounts',
  description: 'Short summary shown in list views.',
  completed: false,
  level: 'essential', // essential | recommended | optional | advanced
  details: 'Explain the risk, the action, the trade-offs and how to check it worked.',
  links: [
    { text: 'Primary documentation', url: 'https://example.com/docs' }
  ],
  threatLevels: ['basic', 'developer'],
  priority: 1
}
```

Keep IDs stable: changing one breaks saved progress in people's browsers.
Prefer primary documentation and recognized standards. Avoid absolute safety
claims, unexplained jargon and vendor marketing. A new checklist also needs an
entry in `src/data/securityData.ts`, threat-profile mappings in
`src/data/threatProfiles.ts`, and `npm run seo:generate`. The starter file is
`src/templates/categoryTemplate.ts`.

### Guides

Guide metadata (title, description, dates, tags) is in
`src/data/articlesData.ts` and in the `*Meta.ts` and `*Enhancements.ts` files in
`src/data/contentBatches/`. Guide bodies are in
`src/data/contentBatches/*Content.tsx`, and `src/data/articleContent.tsx` maps
each slug to its body. Run `npm run seo:generate` after adding or renaming a
guide.

A good guide has:

- a specific reader and problem;
- original, practical guidance, not a rewritten feed item;
- primary sources for technical and incident claims;
- published and reviewed dates that reflect real editorial work;
- clear limits where facts are still developing;
- a next step the reader can take on Digibastion or Vantage;
- no invented loss figures, quotes, clients, credentials or expertise.

For a recent incident, separate confirmed facts from analysis, and include the
timeline, affected systems, impact, attack path, mitigations, primary sources
and lessons. A threat-feed record alone is not enough evidence for a guide.

### Tools and links

- Tools directory: `src/data/tools/categories.ts`
- Links directory: `src/data/links/categories/`

Check the destination, who owns it, what the product does today and its
security trade-offs. A listing is not an endorsement. Disclose any affiliation
and never add referral tracking without a maintainer's approval.

### Threat sources

Read [`THREAT_INTEL_FEEDS.md`](THREAT_INTEL_FEEDS.md) first, and the public
[methodology page](https://www.digibastion.com/threat-intel/methodology). A new
source needs a case for its quality, stable identifiers, a plan for matching its
records against existing ones, failure and rate-limit behavior, and its license
terms. It runs as its own function and writes into the existing feed model.

### Product and UI work

- Use the existing design tokens, not hard-coded light or dark colors.
- Keep content usable at 320 CSS pixels wide and at 200% zoom.
- Keep visible focus, meaningful labels, heading order, reduced-motion behavior
  and screen-reader status messages.
- Add or update tests for behavior changes.
- Add before and after screenshots for visual changes, and list the viewports
  and paths you tested.
- Use `<Link>` (or `<a href>`) for navigation, so crawlers can follow it.

## Pull request checklist

Keep a pull request small enough to review. In the description, include:

- the user problem and why this change fits;
- the files and flows changed;
- the tests and manual checks you ran;
- screenshots for visual changes;
- security, privacy, accessibility and migration notes;
- any production check a maintainer has to run;
- the related issue or roadmap item.

Do not mix generated files, unrelated formatting, broad dependency updates and
behavior changes in one pull request unless they cannot be separated. (The
`seo:generate` output that goes with your route or content change is fine.)
Maintainers may ask for changes or decline a proposal, and no review time or
merge date is promised.

## Talk to us

- [GitHub issues](https://github.com/Raiders0786/digibastion/issues) for
  bugs and scoped proposals
- [GitHub discussions](https://github.com/Raiders0786/digibastion/discussions)
  for early ideas and questions
- [Telegram community chat](https://t.me/digibastion_chat) for conversation
  that contains nothing confidential

Thank you for helping make the guidance and tools more accurate and more
useful.
