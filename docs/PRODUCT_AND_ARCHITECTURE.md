# Product and architecture

Last verified: 2026-09-27

This document is the current repository map. It distinguishes what is present
in source, what was publicly reachable when checked, and what still requires
private platform access.

## Product model

Digibastion has two related public products and a services layer:

1. **Digibastion** at `www.digibastion.com` is the public learning, assessment,
   checklist, threat-intelligence, tools, and service-discovery application in
   this repository.
2. **VANTAGE by Digibastion** at `vantage.digibastion.com` is a separate deployed
   product for external domain trust evidence. Its application source is not in
   this repository, so changes here cannot deploy or validate its private
   workflows.
3. **Security services** connect teams that need hands-on OpSec or full-stack
   review with Digibastion through the main application.

The shared product promise should stay concrete: help an individual or team
identify relevant risk, understand what to do, verify the control, and follow
changes over time. No automated score or checklist guarantees security.

## Public product inventory

### Digibastion routes

| Surface | Routes | Source status |
| --- | --- | --- |
| Security plan | `/`, `/category/:categoryId`, `/share` | 11 categories and 274 checklist items; progress stored in the browser |
| OpSec assessment | `/quiz`, `/quiz-result`, `/leaderboard` | Eight-question quiz with server-issued sessions and server-validated score submission |
| Threat intelligence | `/threat-intel`; `/news` redirects here | Unified public feed, Web3 incident and active-alert views, subscriptions, and provider-aware details |
| Learning | `/articles`, `/articles/:slug`, `/tools`, `/links` | 58 article entries, 28 product-tool entries, and resource collections |
| Organization help | `/services`, `/services/opsec-consulting`, `/services/full-stack-review`, `/contact` | Public discovery and inquiry surfaces |
| Project | `/about`, `/support`, `/license` | Project, support, and legal information |
| Subscriber utility | `/manage-subscription`, `/unsubscribe`, `/verify-email` | Token- or email-workflow destinations; not primary navigation pages |
| Legacy presentation route | `/present` | Redirects to `/about`; retained only for old links |
| Administration | `/admin`, `/admin/analytics`, `/admin/cron`, `/admin/api-keys` | Private operator surfaces; authorization remains server-enforced |

These routes are defined in `src/App.tsx`. The public homepage, threat-intel,
quiz, services, and articles URLs returned HTTP 200 when checked on
2026-09-27. Private routes and data mutations were not exercised for this
documentation audit.

### VANTAGE public surface

The following separate-product routes returned HTTP 200 on 2026-09-27:

- `/` — domain scan entry, public score preview, evidence modules, workflow,
  and portfolio explanation
- `/score/` — public score lookup
- `/blog/` — research field notes
- `/knowledge/` — concepts and definitions
- `/checks/` — documented security controls
- `/use-cases/` — team workflows
- `/incidents/` — source-backed incident notes
- `/signup/` — access request

The live overview describes 12 modules spanning DNS, email, TLS, web,
infrastructure, client-side/frontend supply chain, phishing, breach, and Web3
trust evidence. It distinguishes safe public previews from authenticated
evidence, workflow state, comments, exports, and monitoring. Those
authenticated claims were not independently tested during this audit and
should be labeled beta or generally available based on the owner's actual
release policy.

## Application architecture

```text
Browser
  React + TypeScript + React Router
  Tailwind/shadcn UI, local checklist state, React Query
       |
       | publishable Supabase client / HTTPS
       v
Supabase
  Postgres + Row Level Security
  Edge Functions (Deno)
  scheduled jobs and private operational records
       |
       +--> RSS and Web3 incident providers
       +--> QuillMonitor provider integration
       +--> email delivery and tracking provider
       +--> optional summarization/scraping providers

Vercel
  static SPA delivery, security headers, analytics, and OG request handler

VANTAGE
  separate application/deployment; linked product, not a package in this repo
```

### Client

- `src/App.tsx` owns the route map and lazy-loaded page boundaries.
- `src/pages/` contains route-level views.
- `src/components/` contains shared navigation, mobile, checklist, article,
  quiz, threat, and UI primitives.
- `src/hooks/useSecurityState.ts` provides shared checklist state.
- `src/data/` contains version-controlled educational content and directories.
- `src/integrations/supabase/` contains the browser client and generated
  database types.

The browser receives only publishable Supabase configuration. Checklist state
is local-first; data-backed feeds, quiz authority, subscriptions, forms, and
administration call Supabase.

### Threat-intelligence boundary

Each external provider has an isolated server-side ingestion path. Ingestion
normalizes public records into `news_articles`; provider-specific incident
details remain in `news_articles.metadata`. Sanitized aggregate outcomes are
recorded in `threat_intel_ingestion_runs` for private operations. Credentials,
authorization headers, raw provider payloads, subscriber details, and stack
traces must not enter the public record or public logs.

This boundary preserves source independence: one provider can fail without
blocking the others, and the public UI filters normalized incident meaning
rather than treating a provider as its own product section.

### Server and database

`supabase/functions/` contains functions for:

- RSS, Web3 incident, and QuillMonitor ingestion;
- article summarization, sitemap generation, scraping, and OG images;
- quiz session creation and score submission;
- subscription verification, management, unsubscribe, digests, critical
  alerts, and tracking;
- contact/form submission;
- admin analytics, operational health, and API-key management.

`supabase/migrations/` is the history of tables, policies, database functions,
rate limits, operational health, and scheduled jobs. A migration proves the
intended database change, not the state of the live project. Production truth
must be checked in the owning Supabase environment.

Several public or purpose-specific Edge Functions set `verify_jwt = false` in
`supabase/config.toml` and enforce their own token, rate-limit, cron-secret,
service-role, or administrator checks. Preserve those application-level checks
and test both allowed and denied cases when deploying.

## Local and operational setup

### Local frontend

```bash
cp .env.example .env
npm ci
npm run dev
```

Required browser values:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

Use a non-production project when a change writes data. Run `npm run check`
before release.

### Private deployment configuration

Depending on enabled functions, the owning platform must supply service-role,
cron, provider, email, scraping, and summarization credentials. Exact secret
names should be derived from each function at deployment time and managed in
the platform secret store, not copied into docs, issues, client variables, or
Git history.

Release validation should cover:

1. Vercel build, redirect behavior, security headers, route metadata, PWA
   assets, robots, and sitemap responses.
2. Supabase migration state, RLS policies, grants, function revisions, and
   allowed/denied authorization cases.
3. Scheduled ingestion, deduplication, partial-provider failure, operational
   run records, and feed freshness.
4. Quiz start/submit/replay controls and leaderboard integrity.
5. Subscription verification, management, unsubscribe, digest, critical-alert,
   tracking, and suppression paths without exposing subscriber data.
6. Contact/service inquiry delivery.
7. Desktop, mobile, keyboard, screen-reader, reduced-motion, offline, and slow
   network behavior.

## Content ownership and freshness

Version-controlled counts do not establish editorial quality. Each checklist
item, guide, tool, resource, and incident note needs an owner and evidence-based
review cadence. Time-sensitive vendor, price, incident, year, and product claims
should be reviewed against primary sources before publication. Threat-feed
summaries and editorial analysis must remain visibly distinct.

## Licensing boundary

`LICENSE` contains MIT text plus a Commons Clause restriction on commercial
use. The repository is therefore source-available rather than OSI-approved
open source. The owner must decide whether to keep that model or replace the
legal text with a standard open-source license; until then, product and
contribution copy should say source-available. This document does not change
or interpret the legal terms.

## Access required for full validation

- Supabase project access for deployed functions, secrets, RLS, migrations,
  scheduled jobs, logs, and production data checks
- Vercel project and DNS access for deployed build, redirects, headers, and
  environment variables
- Search Console and analytics access for indexing and user-journey evidence
- Email-provider access for deliverability, suppression, and complaint flows
- VANTAGE repository/deployment and authenticated test access
- Owner confirmation of licensing, release stage, service intake, and content
  review ownership
