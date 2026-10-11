# SEO, AEO, Distribution and Documentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. One implementer per workstream, in the order S1 to S6. TDD for every pure module: write the failing test first, watch it fail, then implement. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every incident, weekly issue, guide and checklist on www.digibastion.com can be found by search and answer engines, previews correctly when shared, and is pushed out through IndexNow, feeds, Telegram and email with honest attribution. The repo docs and site copy describe what the code actually does today.

**Architecture:** Six workstreams run in order. S1 adds the server side of indexing (a dynamic sitemap with accurate lastmod, an IndexNow pinger on cron, RSS/Atom/JSON feeds) on top of new pure shared modules. S2 adds a build-time prerender inside `vite build` so non-JS crawlers and preview bots get per-route HTML, plus one registry of route metadata that the SPA, the prerender, `llms.txt` and the sitemap all read. S3 makes every outbound link (Telegram, email, share buttons) point at our canonical pages with consistent UTM tags while still naming and linking the original source. S4 is an optional Cloudflare Worker that stays inert until DNS moves. S5 rewrites the docs and S6 the site copy.

**Tech Stack:** React 18, Vite 8, TypeScript, react-router-dom 7, Tailwind/shadcn, vitest 5; Supabase on Lovable Cloud (Postgres, pg_cron, pg_net, Deno edge functions); Cloudflare Workers (optional).

**Spec:** the four audit reports in `.audit/` (local only, untracked; never `git add` them): `docs-audit.md`, `copy-audit.md`, `seo-audit.md`, `distribution-audit.md`. Read the report a task cites before starting it. Line numbers in the reports refer to commit `145f844`.

## Global Constraints

- **Worktree.** Work only in `/Users/chirag/Documents/digibastion_web-seo` (branch `seo-aeo-docs`). Use absolute paths or `cd` into it in every shell command; the shell cwd resets between calls. Never touch `/Users/chirag/Documents/digibastion_web`.
- **Public repo.** Never write secrets, tokens, `CRON_SECRET`/Resend/Telegram/service-role values, personal emails, phone numbers, home addresses or internal-only notes into any file. Allowed: the Supabase project ref `sdszjqltoheqhfkeprrd`, the anon key already in `src/integrations/supabase/publicConfig.ts`, the channel name `@digibastion`, role addresses on `@digibastion.com`, and the IndexNow key (public by design).
- **Do not edit by hand:** `src/integrations/supabase/types.ts` (Lovable regenerates it), `drizzle/`, `.lovable/`, `roadmap.md` (lowercase; Lovable's task log), any applied migration.
- **Pure shared modules.** Anything under `supabase/functions/_shared/` that vitest or `src/` imports has no `https://` imports, no `npm:` specifiers, no `Deno` references and no `String.prototype.replaceAll` (tsconfig lib is ES2020). Shared modules import each other with the `.ts` extension (`import { x } from './y.ts'`); `src/` imports them with a relative path and no extension (`'../../supabase/functions/_shared/site-urls'`). Tests for shared modules sit next to them as `<name>.test.ts`.
- **Migrations.** New filenames sort after `20261013140000`. One overload per RPC name; drop the old signature in the same file. Start each cron migration with a `-- lovable-cron-fallback-reviewed: <why a poll>` line. Schedule with `public.record_cron_http_request(jobname, 'https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/<fn>', body, timeout_ms)` and unschedule the same job name first. At most 48 runs a day per job.
- **Cron auth.** Copy `timingSafeEqual()` and `authorize()` from `supabase/functions/send-newsletters/index.ts` (lines 99-128): accept a timing-safe `CRON_SECRET`, the service-role key, or an admin JWT. Never compare secrets with `===`.
- **Attribution.** Never claim an incident is "verified by Digibastion". Name the source on every incident in every surface. Keep "Powered by QuillMonitor" wherever a QuillMonitor-only record is shown. Status words come only from the source: confirmed, unconfirmed. Losses read "about $X" or "~$X reported". SlowMist is not a live source (no cron); never list it as one.
- **Canonical URLs.** `https://www.digibastion.com` plus a path, no query string, no fragment, no trailing slash except `/`. UTM tags never appear in a canonical, sitemap, feed GUID, JSON-LD URL or IndexNow URL.
- **Copy.** Brand is "Digibastion" (never "DigiBastion"). The pipeline runs every 30 minutes: never write "real-time", "instantly" or "as they happen" about it, except "Real-time alerts" as the email channel name next to a "checked every 30 minutes" hint. Apply the humanize-output skill as the final pass on docs, site copy and the release doc: plain, concrete, no AI-slop vocabulary, few em-dashes.
- **Commands.** One test file: `rtk proxy npx vitest run <file>`. Full suite: `rtk proxy npx vitest run` (baseline: 72 files, 814 tests pass). Typecheck: `npx tsc --noEmit -p tsconfig.app.json`. Lint: `npx eslint <files>`. Deno entry files: `bun build supabase/functions/<fn>/index.ts --no-bundle > /dev/null` (Deno is not installed). Site build: `node node_modules/vite/bin/vite.js build`. Python, if ever needed: `uv run python3`. Plain `npx vitest` output is swallowed by a shell hook; always use `rtk proxy`.
- **Git.** Stage files by path; never `git add -A`, `git add .` or anything under `.audit/`. Conventional commit messages, no AI attribution, no `Co-Authored-By` trailer.
- **New edge functions** get a `[functions.<name>]` entry in `supabase/config.toml` with `verify_jwt = false` only when the function authenticates callers itself or is a public read-only GET.

## Facts this plan rests on (verified 2026-10-11)

- The frontend is on Lovable static hosting with DNS at GoDaddy (`www` A record 185.158.133.1). It is not Cloudflare or Vercel. `vercel.json` and `api/og-tags.ts` are inert.
- Every route returns the same `index.html` with HTTP 200, the homepage title, and `<link rel="canonical" href="https://www.digibastion.com/">` plus `og:url` and `twitter:url` pointing at `/` (`index.html:22,36,50`). Files in `public/` are served as-is.
- Whether Lovable serves `dist/<route>.html` or `dist/<route>/index.html` before its SPA fallback is **unverified**. Everything that depends on it must be harmless when it is not served, and the release doc checks it with a canary.
- On GET, the Supabase gateway rewrites XML and HTML responses to `text/plain` with `content-security-policy: default-src 'none'; sandbox`. JSON and PNG pass through. HEAD keeps the original type.
- Google has no ping API for normal pages (sitemap ping retired 2023; the Indexing API is only for JobPosting/BroadcastEvent). Do not build either. IndexNow (Bing, Yandex, Seznam, Naver, Yep) is the instant path; its key file must be served from the site root.
- `news_articles`: about 21,600 publishable rows, of which 2,112 are Web3 incidents (2,091 QuillMonitor, 21 web3-incidents, 0 SlowMist). About 19,500 are RSS relays averaging 363 characters.
- QuillMonitor syncs rewrite `updated_at` on every run, so `updated_at` is useless as lastmod. `published_at` on QuillMonitor rows is the incident date, not our publish date; `created_at` is when Digibastion stored the record.
- Cron schedule (UTC): QuillMonitor `17,47`, Telegram `20,50`, alert emails `25,55`, weekly build Monday `00:10`, weekly Telegram post Monday `01:00`.
- `supabase/config.toml` has `max_rows = 1000`, so any query that can return more than 1,000 rows must page with `.range()`.

## Decisions taken from the audits

1. **No IndexNow ledger table.** The pinger keeps a cursor in `threat_intel_ingestion_runs.metadata.cursor` of its last successful run and submits only rows created, or with a logged status change, after it. This meets "since its last successful run" without a new table.
2. **RSS relays are not indexed.** Detail pages for records that are not Web3 incidents get `noindex, follow`, and stay out of the sitemap, feeds, prerender and IndexNow. Readers and email links are unaffected.
3. **Prerender writes `<route>.html` only by default** (`PRERENDER_LAYOUT=file`). A `dir` layout (`<route>/index.html`) risks a host-side 301 to a trailing-slash URL, which would contradict our canonical. The canary in S2 tells us which layouts the host serves; `PRERENDER_LAYOUT=dir|both` switches without code changes.
4. **No address-bar UTM stripping yet.** Nothing in production records UTM tags (`@vercel/analytics` only loads on `*.vercel.app`). Stripping tags before any analytics reads them would destroy data a future tool could use. Share buttons always build from the canonical URL, so shares are clean anyway. Picking an analytics tool is a user action.
5. **Telegram copy is written to be true at any `TELEGRAM_MIN_SEVERITY`**: "posts new Web3 incidents from QuillMonitor". No "each" and no "high and critical".
6. **Newsletters are gated** until `NEWSLETTER_POSTAL_ADDRESS` is set. A single flag `NEWSLETTERS_LIVE = false` in `src/seo/siteFacts.ts` drives every sentence that mentions the daily brief or weekly email.
7. **A Google News sitemap is included** (`?part=news`, Web3 incidents created in the last 48 hours, at most 1,000). It costs one query and is harmless if Google ignores it.
8. **A `/faq` page and a `/privacy` page are added.** `/faq` gives answer engines one citable URL for plain Q&A. `/privacy` states what the code collects, before newsletters launch.
9. **`vercel.json` and `api/og-tags.ts` stay** (useful if hosting ever moves to Vercel) and the docs say plainly that they are inert. The Worker in S4 carries the same security headers.
10. **The X handle is `digibastion`**, from `index.html` (`twitter:site`) and the quiz share text. It is one constant, `X_HANDLE` in `src/seo/siteFacts.ts`; set it to `null` if the user says the account is not theirs.

## File ownership

Each file has one owning workstream, the earliest that needs it. A later workstream may edit an owned file only inside the append zone listed here. Everything not listed belongs to the workstream whose task names it.

| File | Owner | Later edits allowed |
|---|---|---|
| `supabase/functions/_shared/site-urls.ts`, `xml.ts`, `publishable.ts`, `attribution.ts`, `incident-answer.ts` | S1 | none (S3 and S4 import them) |
| `public/robots.txt`, `supabase/config.toml` | S1 | none |
| `index.html` | S2 | S6 may change human-readable strings only: `<title>`, meta description, `og:`/`twitter:` title, description and image alt, JSON-LD `description` and `alternateName`, and add a `<noscript>` block. S6 must not move the `seo:` markers or touch `<link>` tags. |
| `src/App.tsx` | S2 | S6 adds one `<Route path="/privacy">` line and its lazy import. |
| `src/seo/routeMeta.ts` | S2 | S3 changes the `image` field in `incidentRouteMeta` and `weeklyRouteMeta`. S6 adds the `/privacy` entry and may reword string values in a humanize pass, without changing keys or structure. |
| `src/seo/siteFacts.ts` | S2 | S6 may reword string values only. |
| `src/pages/News.tsx` | S2 | S3: keep `location.search` on the merged-record redirect and set the incident `image`. S6: hero and intro copy only. |
| `src/components/news/NewsDetail.tsx` | S2 | S3: replace the Share button with `ShareBar`, change `rel` on source links. S6: the Telegram sentence. |
| `src/pages/WeeklyNewsletter.tsx` | S2 | S3: add `ShareBar`, set `image`, change `rel` on source links. S6: body copy. |
| `src/pages/Index.tsx` and every other page whose `<MetaTags>` S2 rewires | S2 | S6: JSX text and the "Latest alerts" query and render. |
| `src/pages/ThreatIntelMethodology.tsx` | S2 (JSON-LD, MetaTags) | S3: `rel` on source links. S6: new sections and copy. |
| `public/sitemap.xml`, `public/sitemap-index.xml`, `public/llms.txt`, `public/llms-full.txt` | S2 (generated) | S6 regenerates them with `npm run seo:generate` after adding `/privacy`. Nobody edits them by hand. |
| `src/pages/VerifyEmail.tsx` | S3 | S6: copy. |
| `src/components/Footer.tsx`, `src/components/Navbar.tsx`, `src/components/MobileBottomNav.tsx` | S6 | none |

## Review Focus

These are the failure modes most likely to hurt real users or rankings. Each line names the test that pins it and the task that owns that test.

1. **Build offline or with Supabase down.** `vite build` must succeed with no network, with a refused connection and with a hanging server; dynamic pages are skipped with one warning. Pinned by `src/seo/__tests__/fetchDynamic.test.ts` (throwing and hanging fetch) and the S2 offline build check `VITE_SUPABASE_URL=http://127.0.0.1:9 node node_modules/vite/bin/vite.js build` (Task S2.6).
2. **Retracted or merged incidents leaking.** A row with `duplicate_of_uid` or `classification_relevant=false` must not appear in the sitemap, the feeds, IndexNow or the prerender. Every query uses `INDEXABLE_INCIDENT_POSTGREST_FILTER` and every result passes `isIndexableIncidentMetadata` as a second guard. Pinned by `publishable.test.ts` (S1.2), `sitemap-render.test.ts` and `feed-render.test.ts` (S1.4, S1.6), `indexnow.test.ts` (S1.5) and `fetchDynamic.test.ts` (S2.5).
3. **UTM or query noise in a canonical, and duplicate canonicals.** Pinned by `site-urls.test.ts` (`canonicalizeUrl` strips `?utm_source=...`), `prerender.test.ts` (exactly one canonical per page, none in the fallback `index.html`), `MetaTags.test.tsx` (an existing canonical is updated, never duplicated) and `share-links.test.ts` (S3.1: copy-link URL carries no tags).
4. **IndexNow spam and rate limits.** At most one run every 30 minutes, at most 1,000 URLs per run, only new or status-changed records, a dry run never advances the cursor, and a 429 or 403 leaves the cursor where it was so the next run retries. Pinned by `indexnow.test.ts` (`planIndexNowUrls`, `resolveSince`, `nextCursor`, `classifyIndexNowResponse`).
5. **Sitemap too large or invalid XML.** `renderUrlset` throws above 50,000 URLs, the function pages at 45,000, and every rendered sitemap and feed parses with `DOMParser` without a `parsererror`, including titles with `&`, `<` and emoji. Pinned by `sitemap-render.test.ts` and `feed-render.test.ts`; the release doc adds `xmllint --noout` on the live output.
6. **Trailing-slash redirect fighting the canonical.** Default `PRERENDER_LAYOUT=file`; the canary in the release doc checks `curl -sI` before anyone switches to `dir`. Pinned by `prerender.test.ts` (`outputPathsFor`).
7. **Prerendered HTML diverging from the app.** The app uses `createRoot().render()`, which replaces `#root`, so there is no hydration and no hydration warning. `main.tsx` removes `script[data-prerender]` before rendering so Google never sees two JSON-LD copies. Pinned by `src/seo/__tests__/mainEntry.test.ts` (no `hydrateRoot`; removal happens before `render`). Stale prerendered incident pages (status changed after the last publish) are a known limit; the Worker in S4 fixes it.
8. **Path traversal in prerender writes.** Incident ids must match `/^[A-Za-z0-9_-]{1,128}$/` and weekly dates `/^\d{4}-\d{2}-\d{2}$/` before any file is written. Pinned by `prerender.test.ts`.
9. **Secret leakage.** Pinned by `src/utils/__tests__/publicFilesNoSecrets.test.ts` (S1.8), which scans `public/`, `supabase/functions/` and `edge/` for service-role JWTs, `re_`/`whsec_` keys, Telegram bot tokens and `@gmail.com` addresses.

---

## S1. Indexing backend

**Goal:** Crawlers find every indexable incident and weekly page through the robots-listed sitemap with honest lastmod; Bing and friends hear about new pages within 30 minutes through IndexNow; readers and bots can subscribe to RSS, Atom and JSON feeds.

**Files**
- Create: `supabase/functions/_shared/site-urls.ts`, `xml.ts`, `publishable.ts`, `attribution.ts`, `incident-answer.ts`, `sitemap-render.ts`, `indexnow.ts`, `feed-render.ts`, each with a `.test.ts` beside it (`xml` is covered by `sitemap-render.test.ts`).
- Create: `supabase/functions/ping-indexnow/index.ts`, `supabase/functions/threat-intel-feed/index.ts`.
- Create: `supabase/migrations/20261014090000_seo_indexing.sql`, `supabase/migrations/20261014100000_weekly_newsletter_list.sql`.
- Create: `public/<INDEXNOW_KEY>.txt`.
- Create: `src/utils/__tests__/publishableParity.test.ts`, `src/utils/__tests__/publicFilesNoSecrets.test.ts`.
- Modify: `supabase/functions/generate-sitemap/index.ts`, `supabase/functions/_shared/ingestion-health.ts`, `supabase/config.toml`, `public/robots.txt`, `supabase/functions/fetch-web3-incidents/index.ts` (line 21 only).

**Interfaces produced for later workstreams**

```ts
// _shared/site-urls.ts
export const SITE_URL: 'https://www.digibastion.com';
export const SITE_HOST: 'www.digibastion.com';
export const FUNCTIONS_BASE_URL: 'https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1';
export function trimTrailingSlashes(value: string): string;
export function incidentPath(articleId: string): string;          // /threat-intel/<encoded id>
export function weeklyPath(weekStart: string): string;            // /threat-intel/weekly/YYYY-MM-DD, throws on bad input
export function absoluteSiteUrl(path: string, siteUrl?: string): string;
export function canonicalIncidentUrl(id: string, siteUrl?: string): string;
export function canonicalWeeklyUrl(weekStart: string, siteUrl?: string): string;
export function canonicalizeUrl(input: string, siteUrl?: string): string | null;
export const FEED_URLS: { rss: string; atom: string; json: string };

// _shared/xml.ts
export function escapeXml(value: string): string;

// _shared/publishable.ts
export const PUBLISHABLE_POSTGREST_FILTER: string;
export const WEB3_INCIDENT_POSTGREST_FILTER: string;
export const INDEXABLE_INCIDENT_POSTGREST_FILTER: string;         // pass to ONE .or() call
export function isPublishableMetadata(metadata: unknown): boolean;
export function isIndexableIncidentMetadata(metadata: unknown): boolean;
export const SAFE_ARTICLE_ID: RegExp;                             // /^[A-Za-z0-9_-]{1,128}$/
export const WEEK_START: RegExp;                                  // /^\d{4}-\d{2}-\d{2}$/

// _shared/attribution.ts
export const QUILLMONITOR_DATABASE_URL: 'https://www.quillaudits.com/web3-hacks-database';
export function providerLabel(provider: string | null | undefined): string | null;
export function isQuillMonitorOnly(providers: readonly string[]): boolean;
export function sourceLabelFor(item: { providers: readonly string[]; sourceName: string | null }): string;
export function sourceLinkFor(item: { sourceUrl: string | null; incidentUrl: string }): string | null;

// _shared/incident-answer.ts
export type AnswerInput = Pick<NewsletterItem, 'title' | 'projectName' | 'chain' | 'attackType' | 'amountUsd' |
  'amountDisplay' | 'incidentDate' | 'fundsReturned' | 'sourceName' | 'providers' | 'status'>;
export function formatAnswerDate(isoDay: string): string;          // '2026-09-30' -> '30 Sep 2026'
export function buildIncidentAnswer(input: AnswerInput): string;
```

### Task S1.1: Site URL helpers

**Files:** Create `supabase/functions/_shared/site-urls.ts`, `supabase/functions/_shared/site-urls.test.ts`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import {
  absoluteSiteUrl, canonicalIncidentUrl, canonicalWeeklyUrl, canonicalizeUrl,
  FEED_URLS, incidentPath, trimTrailingSlashes, weeklyPath,
} from './site-urls';

describe('site-urls', () => {
  it('builds incident and weekly paths', () => {
    expect(incidentPath('a/b')).toBe('/threat-intel/a%2Fb');
    expect(weeklyPath('2026-10-05')).toBe('/threat-intel/weekly/2026-10-05');
    expect(() => weeklyPath('2026-10-5')).toThrow();
  });
  it('joins site and path once', () => {
    expect(trimTrailingSlashes('https://x.test///')).toBe('https://x.test');
    expect(absoluteSiteUrl('tools', 'https://x.test/')).toBe('https://x.test/tools');
    expect(canonicalIncidentUrl('abc')).toBe('https://www.digibastion.com/threat-intel/abc');
    expect(canonicalWeeklyUrl('2026-10-05')).toBe('https://www.digibastion.com/threat-intel/weekly/2026-10-05');
  });
  it('canonicalizes: strips query, fragment and trailing slash', () => {
    expect(canonicalizeUrl('https://www.digibastion.com/threat-intel/abc?utm_source=telegram&utm_medium=social#top'))
      .toBe('https://www.digibastion.com/threat-intel/abc');
    expect(canonicalizeUrl('/articles/x/')).toBe('https://www.digibastion.com/articles/x');
    expect(canonicalizeUrl('https://www.digibastion.com')).toBe('https://www.digibastion.com/');
    expect(canonicalizeUrl('https://www.digibastion.com/?ref=x')).toBe('https://www.digibastion.com/');
  });
  it('refuses other hosts, including look-alikes and the apex', () => {
    expect(canonicalizeUrl('https://digibastion.com/tools')).toBeNull();
    expect(canonicalizeUrl('https://www.digibastion.com.evil.test/tools')).toBeNull();
    expect(canonicalizeUrl('https://www.quillaudits.com/web3-hacks-database')).toBeNull();
  });
  it('lists the three feed URLs on the functions host', () => {
    expect(FEED_URLS.rss).toBe('https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/threat-intel-feed?format=rss');
    expect(FEED_URLS.json).toContain('format=json');
  });
});
```

- [ ] **Step 2: Run it and watch it fail.** `rtk proxy npx vitest run supabase/functions/_shared/site-urls.test.ts` fails with "Failed to resolve import './site-urls'".

- [ ] **Step 3: Implement**

```ts
// Canonical Digibastion URLs. Pure module: no Deno or URL-specifier imports,
// so vitest, Vite, the Worker and Deno can all load it.
export const SITE_URL = 'https://www.digibastion.com' as const;
export const SITE_HOST = 'www.digibastion.com' as const;
export const FUNCTIONS_BASE_URL = 'https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1' as const;

const WEEK = /^\d{4}-\d{2}-\d{2}$/;

export function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '');
}

export function incidentPath(articleId: string): string {
  return `/threat-intel/${encodeURIComponent(articleId)}`;
}

export function weeklyPath(weekStart: string): string {
  if (!WEEK.test(weekStart)) throw new Error('weekStart must be YYYY-MM-DD');
  return `/threat-intel/weekly/${weekStart}`;
}

export function absoluteSiteUrl(path: string, siteUrl: string = SITE_URL): string {
  return `${trimTrailingSlashes(siteUrl)}${path.startsWith('/') ? path : `/${path}`}`;
}

export const canonicalIncidentUrl = (id: string, siteUrl: string = SITE_URL) => absoluteSiteUrl(incidentPath(id), siteUrl);
export const canonicalWeeklyUrl = (weekStart: string, siteUrl: string = SITE_URL) => absoluteSiteUrl(weeklyPath(weekStart), siteUrl);

/** Canonical form of a URL on our site, or null for any other host. */
export function canonicalizeUrl(input: string, siteUrl: string = SITE_URL): string | null {
  const site = trimTrailingSlashes(siteUrl);
  let rest: string;
  if (input.startsWith('/')) rest = input;
  else if (input === site || ['/', '?', '#'].some((c) => input.startsWith(`${site}${c}`))) rest = input.slice(site.length);
  else return null;
  let path = rest.split('#')[0].split('?')[0];
  if (!path.startsWith('/')) path = `/${path}`;
  if (path.length > 1) path = path.replace(/\/+$/, '') || '/';
  return `${site}${path}`;
}

export const FEED_URLS = {
  rss: `${FUNCTIONS_BASE_URL}/threat-intel-feed?format=rss`,
  atom: `${FUNCTIONS_BASE_URL}/threat-intel-feed?format=atom`,
  json: `${FUNCTIONS_BASE_URL}/threat-intel-feed?format=json`,
} as const;
```

- [ ] **Step 4: Run the test; it passes.**
- [ ] **Step 5: Commit.** `git add supabase/functions/_shared/site-urls.ts supabase/functions/_shared/site-urls.test.ts && git commit -m "feat(seo): add shared canonical URL helpers"`

### Task S1.2: Publishable filters and XML escaping

**Files:** Create `_shared/publishable.ts`, `_shared/publishable.test.ts`, `_shared/xml.ts`, `src/utils/__tests__/publishableParity.test.ts`.

- [ ] **Step 1: Write the failing tests**

`supabase/functions/_shared/publishable.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { isIndexableIncidentMetadata, isPublishableMetadata, INDEXABLE_INCIDENT_POSTGREST_FILTER } from './publishable';

describe('isIndexableIncidentMetadata', () => {
  it.each([
    [{ provider: 'quillmonitor', is_web3_incident: true }, true],
    [{ provider: 'web3-incidents' }, true],                                  // legacy row, no flag
    [{ provider: 'quillmonitor', is_web3_incident: true, duplicate_of_uid: 'qm:1' }, false],
    [{ provider: 'quillmonitor', is_web3_incident: true, duplicate_of_uid: '' }, false],
    [{ is_web3_incident: true, classification_relevant: false }, false],
    [{ is_web3_incident: true, classification_relevant: 'false' }, false],
    [{ provider: 'rss', is_web3_incident: false }, false],
    [{ provider: 'rss' }, false],
    [null, false],
  ])('%j -> %s', (metadata, expected) => {
    expect(isIndexableIncidentMetadata(metadata)).toBe(expected);
  });
  it('treats rows without metadata as publishable but not indexable', () => {
    expect(isPublishableMetadata(null)).toBe(true);
  });
  it('wraps everything in one and() group for a single .or() call', () => {
    expect(INDEXABLE_INCIDENT_POSTGREST_FILTER.startsWith('and(')).toBe(true);
    expect(INDEXABLE_INCIDENT_POSTGREST_FILTER).toContain('metadata->>duplicate_of_uid.is.null');
  });
});
```

`src/utils/__tests__/publishableParity.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { CLASSIFICATION_RELEVANCE_POSTGREST_FILTER, WEB3_INCIDENT_POSTGREST_FILTER } from '@/utils/newsIncident';
import { isPublishable } from '@/lib/threatIntel/articleRow';
import * as shared from '../../../supabase/functions/_shared/publishable';

describe('shared publishable filters match the SPA', () => {
  it('uses identical PostgREST strings', () => {
    expect(shared.PUBLISHABLE_POSTGREST_FILTER).toBe(CLASSIFICATION_RELEVANCE_POSTGREST_FILTER);
    expect(shared.WEB3_INCIDENT_POSTGREST_FILTER).toBe(WEB3_INCIDENT_POSTGREST_FILTER);
  });
  it.each([{}, { duplicate_of_uid: 'x' }, { classification_relevant: false }, { classification_relevant: 'false' }, null])(
    'agrees with isPublishable for %j', (metadata) => {
      expect(shared.isPublishableMetadata(metadata)).toBe(isPublishable(metadata));
    });
});
```

- [ ] **Step 2: Run both; they fail on the missing module.**

- [ ] **Step 3: Implement**

`supabase/functions/_shared/xml.ts`:

```ts
// Pure module. No replaceAll: tsconfig lib is ES2020.
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
```

`supabase/functions/_shared/publishable.ts`:

```ts
// Which news_articles rows may be listed, fed or pinged. Mirrors
// src/utils/newsIncident.ts and isPublishable() in src/lib/threatIntel/articleRow.ts;
// src/utils/__tests__/publishableParity.test.ts keeps them identical.
// Pure module: no Deno or URL imports.
export const PUBLISHABLE_POSTGREST_FILTER =
  'and(or(metadata->>classification_relevant.is.null,metadata->>classification_relevant.neq.false),metadata->>duplicate_of_uid.is.null)';

export const WEB3_INCIDENT_POSTGREST_FILTER = [
  'metadata->>is_web3_incident.eq.true',
  'and(metadata->>is_web3_incident.is.null,metadata->>provider.in.(quillmonitor,web3-incidents,web3))',
].join(',');

/** Publishable AND a Web3 incident, as one group: use `.or(INDEXABLE_INCIDENT_POSTGREST_FILTER)`. */
export const INDEXABLE_INCIDENT_POSTGREST_FILTER =
  'and(or(metadata->>classification_relevant.is.null,metadata->>classification_relevant.neq.false),' +
  `metadata->>duplicate_of_uid.is.null,or(${WEB3_INCIDENT_POSTGREST_FILTER}))`;

export const SAFE_ARTICLE_ID = /^[A-Za-z0-9_-]{1,128}$/;
export const WEEK_START = /^\d{4}-\d{2}-\d{2}$/;

const LEGACY_INCIDENT_PROVIDERS = new Set(['quillmonitor', 'web3-incidents', 'web3']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isPublishableMetadata(metadata: unknown): boolean {
  if (!isRecord(metadata)) return true;
  if (metadata.classification_relevant === false || metadata.classification_relevant === 'false') return false;
  return metadata.duplicate_of_uid === undefined || metadata.duplicate_of_uid === null;
}

export function isIndexableIncidentMetadata(metadata: unknown): boolean {
  if (!isRecord(metadata) || !isPublishableMetadata(metadata)) return false;
  const flag = metadata.is_web3_incident;
  if (flag === true || flag === 'true') return true;
  if (flag === undefined || flag === null) return LEGACY_INCIDENT_PROVIDERS.has(String(metadata.provider ?? ''));
  return false;
}
```

- [ ] **Step 4: Run both tests; they pass.**
- [ ] **Step 5: Commit.** `git add supabase/functions/_shared/publishable.ts supabase/functions/_shared/publishable.test.ts supabase/functions/_shared/xml.ts src/utils/__tests__/publishableParity.test.ts && git commit -m "feat(seo): share publishable and indexable incident filters"`

### Task S1.3: Attribution and the answer-first incident sentence

**Files:** Create `_shared/attribution.ts`, `_shared/attribution.test.ts`, `_shared/incident-answer.ts`, `_shared/incident-answer.test.ts`.

The answer sentence is reused by the feeds (S1), the incident meta description, the prerender and the FAQ-style detail line (S2), share text (S3) and the Worker (S4). Rules: name the source, use the source's status word, write "about" for amounts, leave out missing fields, no hype words.

- [ ] **Step 1: Write the failing tests**

```ts
// incident-answer.test.ts
import { describe, expect, it } from 'vitest';
import { buildIncidentAnswer, formatAnswerDate, type AnswerInput } from './incident-answer';

const base: AnswerInput = {
  title: 'HOT Omni Bridge exploit', projectName: 'HOT Omni Bridge', chain: 'NEAR', attackType: 'Bridge exploit',
  amountUsd: 3_860_000, amountDisplay: '$3.86M', incidentDate: '2026-09-30', fundsReturned: true,
  sourceName: 'QuillMonitor', providers: ['quillmonitor'], status: 'confirmed',
};

describe('buildIncidentAnswer', () => {
  it('writes the full sentence', () => {
    expect(buildIncidentAnswer(base)).toBe(
      'HOT Omni Bridge on NEAR lost about $3.86M in a bridge exploit on 30 Sep 2026, according to QuillMonitor (confirmed). The funds were later reported returned.');
  });
  it('says unconfirmed when the source does', () => {
    expect(buildIncidentAnswer({ ...base, status: 'unconfirmed', fundsReturned: null }))
      .toBe('HOT Omni Bridge on NEAR lost about $3.86M in a bridge exploit on 30 Sep 2026, according to QuillMonitor (unconfirmed).');
  });
  it('handles a missing amount, chain, date and status', () => {
    expect(buildIncidentAnswer({ ...base, amountUsd: null, amountDisplay: null, chain: null, incidentDate: null,
      status: null, fundsReturned: null, attackType: 'Access control', providers: ['web3-incidents'], sourceName: null }))
      .toBe('HOT Omni Bridge was hit by an access control attack, according to Web3 Is Going Just Great. No loss figure has been reported.');
  });
  it('falls back to the title and a generic attack', () => {
    expect(buildIncidentAnswer({ ...base, projectName: null, attackType: null, amountUsd: null, amountDisplay: null,
      chain: null, incidentDate: null, status: null, fundsReturned: null }))
      .toBe('HOT Omni Bridge exploit was hit by a security incident, according to QuillMonitor. No loss figure has been reported.');
  });
  it('never says verified or Digibastion', () => {
    expect(buildIncidentAnswer(base)).not.toMatch(/verified|digibastion/i);
  });
  it('formats dates', () => {
    expect(formatAnswerDate('2026-09-30')).toBe('30 Sep 2026');
    expect(formatAnswerDate('bad')).toBe('bad');
  });
});
```

```ts
// attribution.test.ts
import { describe, expect, it } from 'vitest';
import { isQuillMonitorOnly, providerLabel, sourceLabelFor, sourceLinkFor } from './attribution';

describe('attribution', () => {
  it('labels providers', () => {
    expect(providerLabel('quillmonitor')).toBe('QuillMonitor');
    expect(providerLabel('web3')).toBe('Web3 Is Going Just Great');
    expect(providerLabel('slowmist')).toBe('SlowMist Hacked');
    expect(providerLabel('rss')).toBeNull();
  });
  it('detects QuillMonitor-only records', () => {
    expect(isQuillMonitorOnly(['quillmonitor'])).toBe(true);
    expect(isQuillMonitorOnly(['quillmonitor', 'web3-incidents'])).toBe(false);
  });
  it('prefers the provider label, then the publisher, and never credits Digibastion', () => {
    expect(sourceLabelFor({ providers: [], sourceName: 'BleepingComputer' })).toBe('BleepingComputer');
    expect(sourceLabelFor({ providers: [], sourceName: null })).toBe('Source not given');
    expect(sourceLabelFor({ providers: [], sourceName: 'Digibastion Intelligence' })).toBe('Source not given');
  });
  it('never links the source to our own page', () => {
    expect(sourceLinkFor({ sourceUrl: 'https://www.digibastion.com/threat-intel/a', incidentUrl: 'https://www.digibastion.com/threat-intel/a' })).toBeNull();
    expect(sourceLinkFor({ sourceUrl: 'javascript:alert(1)', incidentUrl: 'x' })).toBeNull();
    expect(sourceLinkFor({ sourceUrl: 'https://example.com/r', incidentUrl: 'x' })).toBe('https://example.com/r');
  });
});
```

- [ ] **Step 2: Run them; they fail.**

- [ ] **Step 3: Implement**

```ts
// attribution.ts. Pure module.
import { SITE_HOST } from './site-urls.ts';

export const QUILLMONITOR_DATABASE_URL = 'https://www.quillaudits.com/web3-hacks-database' as const;

const PROVIDER_LABELS: Record<string, string> = {
  quillmonitor: 'QuillMonitor',
  slowmist: 'SlowMist Hacked',
  'web3-incidents': 'Web3 Is Going Just Great',
  web3: 'Web3 Is Going Just Great',
};

export function providerLabel(provider: string | null | undefined): string | null {
  return provider ? PROVIDER_LABELS[provider.toLowerCase()] ?? null : null;
}

export function isQuillMonitorOnly(providers: readonly string[]): boolean {
  return providers.length === 1 && providers[0] === 'quillmonitor';
}

export function sourceLabelFor(item: { providers: readonly string[]; sourceName: string | null }): string {
  for (const provider of item.providers) {
    const label = providerLabel(provider);
    if (label) return label;
  }
  const name = item.sourceName?.trim();
  if (!name || /digibastion/i.test(name)) return 'Source not given';
  return name;
}

export function sourceLinkFor(item: { sourceUrl: string | null; incidentUrl: string }): string | null {
  const url = item.sourceUrl?.trim();
  if (!url || !/^https?:\/\//i.test(url) || url === item.incidentUrl) return null;
  const host = url.replace(/^https?:\/\//i, '').split(/[/?#]/)[0].toLowerCase();
  return host === SITE_HOST || host === 'digibastion.com' ? null : url;
}
```

```ts
// incident-answer.ts. Pure module.
import { sourceLabelFor } from './attribution.ts';
import type { NewsletterItem } from './newsletter-content.ts';
import { formatCompactUsd } from './usd-amount.ts';

export type AnswerInput = Pick<NewsletterItem, 'title' | 'projectName' | 'chain' | 'attackType' | 'amountUsd'
  | 'amountDisplay' | 'incidentDate' | 'fundsReturned' | 'sourceName' | 'providers' | 'status'>;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatAnswerDate(isoDay: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDay);
  const month = match ? MONTHS[Number(match[2]) - 1] : undefined;
  return match && month ? `${Number(match[3])} ${month} ${match[1]}` : isoDay;
}

const article = (phrase: string) => (/^[aeiou]/i.test(phrase) ? `an ${phrase}` : `a ${phrase}`);

export function buildIncidentAnswer(input: AnswerInput): string {
  const subject = (input.projectName || input.title).trim();
  const chain = input.chain ? ` on ${input.chain}` : '';
  const amount = input.amountDisplay || (input.amountUsd && input.amountUsd > 0 ? formatCompactUsd(input.amountUsd) : null);
  const attack = input.attackType ? input.attackType.trim().toLowerCase() : null;
  const date = input.incidentDate ? ` on ${formatAnswerDate(input.incidentDate)}` : '';
  const status = input.status ? ` (${input.status})` : '';
  const source = `, according to ${sourceLabelFor(input)}${status}.`;
  const core = amount
    ? `${subject}${chain} lost about ${amount}${attack ? ` in ${article(attack)}` : ''}${date}${source}`
    : `${subject}${chain} was hit by ${article(attack ? `${attack} attack` : 'security incident')}${date}${source} No loss figure has been reported.`;
  return input.fundsReturned === true ? `${core} The funds were later reported returned.` : core;
}
```

Note on "attack": when `attackType` already ends in "attack", "exploit", "hack", "compromise", "scam" or "phishing", do not append " attack". Add that rule (`/\b(attack|exploit|hack|compromise|scam|phishing|drain)$/i`) and a test case `attackType: 'Phishing'` that expects "was hit by a phishing".

- [ ] **Step 4: Run both tests; they pass.**
- [ ] **Step 5: Commit.** `git commit -m "feat(seo): add source attribution helpers and incident answer sentence"` (stage the four files by path).

### Task S1.4: Sitemap renderer and the rebuilt generate-sitemap function

**Files:** Create `_shared/sitemap-render.ts`, `_shared/sitemap-render.test.ts`. Modify `supabase/functions/generate-sitemap/index.ts`.

New behaviour of `generate-sitemap` (public GET and HEAD, `verify_jwt = false` already set):

| Query | Returns |
|---|---|
| none, or `?part=dynamic` | `<urlset>` of every indexable Web3 incident plus every `ready`/`sent` weekly issue. No static pages (those live in `https://www.digibastion.com/sitemap.xml`). |
| `?part=dynamic&page=N` | Page N (1-based) when there are more than 45,000 URLs |
| `?part=dynamic&format=txt` | The same URLs, one per line (`text/plain`), as a fallback if a search engine refuses the gateway's `text/plain` XML |
| `?part=news` | Google News sitemap: indexable incidents with `created_at` in the last 48 hours, newest first, max 1,000 |

Lastmod for an incident is the latest of `created_at`, `metadata.provider_updated_at` and the newest `incident_status_events.created_at` for that article, capped at now. Never `updated_at`. Weekly lastmod is `generated_at`.

- [ ] **Step 1: Write the failing test** (`// @vitest-environment jsdom` at the top so `DOMParser` exists)

```ts
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  incidentLastmod, MAX_SITEMAP_URLS, pageEntries, renderNewsSitemap, renderUrlset, renderUrlText, sitemapDate,
} from './sitemap-render';

const parses = (xml: string) => new DOMParser().parseFromString(xml, 'application/xml').getElementsByTagName('parsererror').length === 0;

describe('sitemap-render', () => {
  it('renders valid XML with escaped locs', () => {
    const xml = renderUrlset([{ loc: 'https://www.digibastion.com/threat-intel/a?x=1&y=2', lastmod: '2026-10-01' }]);
    expect(parses(xml)).toBe(true);
    expect(xml).toContain('<loc>https://www.digibastion.com/threat-intel/a?x=1&amp;y=2</loc>');
    expect(xml).toContain('<lastmod>2026-10-01</lastmod>');
  });
  it('omits lastmod when unknown', () => {
    expect(renderUrlset([{ loc: 'https://www.digibastion.com/', lastmod: null }])).not.toContain('<lastmod>');
  });
  it('refuses more than 50,000 URLs and pages at 45,000', () => {
    const many = Array.from({ length: 50_001 }, (_, i) => ({ loc: `https://www.digibastion.com/threat-intel/${i}` }));
    expect(() => renderUrlset(many)).toThrow(/50,000/);
    expect(MAX_SITEMAP_URLS).toBe(45_000);
    expect(pageEntries(many, 2)).toHaveLength(5_001);
    expect(pageEntries(many, 3)).toHaveLength(0);
  });
  it('picks lastmod from created_at, provider_updated_at and status changes, never the future', () => {
    const now = new Date('2026-10-11T12:00:00Z');
    expect(incidentLastmod({ created_at: '2026-09-29T10:00:00Z', metadata: { provider_updated_at: '2024-10-25T00:00:00Z' } }, null, now)).toBe('2026-09-29');
    expect(incidentLastmod({ created_at: '2026-09-29T10:00:00Z', metadata: { provider_updated_at: '2026-10-02T00:00:00Z' } }, '2026-10-05T00:00:00Z', now)).toBe('2026-10-05');
    expect(incidentLastmod({ created_at: '2026-09-29T10:00:00Z', metadata: { provider_updated_at: '2027-01-01T00:00:00Z' } }, null, now)).toBe('2026-10-11');
    expect(sitemapDate('nope')).toBeNull();
  });
  it('renders a valid Google News sitemap with escaped titles', () => {
    const xml = renderNewsSitemap([{ loc: 'https://www.digibastion.com/threat-intel/a', title: 'A & B <exploit> 🚨', publishedAt: '2026-10-11T02:20:00Z' }]);
    expect(parses(xml)).toBe(true);
    expect(xml).toContain('xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"');
    expect(xml).toContain('<news:name>Digibastion</news:name>');
    expect(xml).toContain('<news:title>A &amp; B &lt;exploit&gt; 🚨</news:title>');
  });
  it('renders the text fallback', () => {
    expect(renderUrlText([{ loc: 'https://www.digibastion.com/a' }, { loc: 'https://www.digibastion.com/b' }]))
      .toBe('https://www.digibastion.com/a\nhttps://www.digibastion.com/b\n');
  });
});
```

- [ ] **Step 2: Run it; it fails.**

- [ ] **Step 3: Implement `sitemap-render.ts`**

```ts
// Pure module: sitemap XML for generate-sitemap. No Deno, no replaceAll.
import { escapeXml } from './xml.ts';

export interface SitemapEntry { loc: string; lastmod?: string | null }
export interface NewsSitemapEntry { loc: string; title: string; publishedAt: string }

export const MAX_SITEMAP_URLS = 45_000;
const PROTOCOL_LIMIT = 50_000;

export function sitemapDate(value: unknown): string | null {
  if (typeof value !== 'string' || !value) return null;
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : new Date(time).toISOString().slice(0, 10);
}

export function incidentLastmod(
  row: { created_at: string; metadata: unknown },
  latestStatusChangeAt: string | null,
  now: Date = new Date(),
): string | null {
  const meta = row.metadata && typeof row.metadata === 'object' ? row.metadata as Record<string, unknown> : {};
  const times = [row.created_at, meta.provider_updated_at, latestStatusChangeAt]
    .map((value) => (typeof value === 'string' ? Date.parse(value) : Number.NaN))
    .filter((time) => !Number.isNaN(time));
  if (times.length === 0) return null;
  return new Date(Math.min(Math.max(...times), now.getTime())).toISOString().slice(0, 10);
}

export function pageEntries<T>(entries: readonly T[], page: number): T[] {
  const start = (Math.max(1, Math.floor(page)) - 1) * MAX_SITEMAP_URLS;
  return entries.slice(start, start + MAX_SITEMAP_URLS);
}

export function renderUrlset(entries: readonly SitemapEntry[]): string {
  if (entries.length > PROTOCOL_LIMIT) throw new Error('A sitemap may list at most 50,000 URLs');
  const body = entries.map((entry) => {
    const lastmod = entry.lastmod ? `\n  <lastmod>${escapeXml(entry.lastmod)}</lastmod>` : '';
    return `<url>\n  <loc>${escapeXml(entry.loc)}</loc>${lastmod}\n</url>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export function renderUrlText(entries: readonly SitemapEntry[]): string {
  return entries.map((entry) => `${entry.loc}\n`).join('');
}

export function renderNewsSitemap(entries: readonly NewsSitemapEntry[]): string {
  const body = entries.slice(0, 1_000).map((entry) => `<url>
  <loc>${escapeXml(entry.loc)}</loc>
  <news:news>
    <news:publication><news:name>Digibastion</news:name><news:language>en</news:language></news:publication>
    <news:publication_date>${escapeXml(new Date(entry.publishedAt).toISOString())}</news:publication_date>
    <news:title>${escapeXml(entry.title)}</news:title>
  </news:news>
</url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${body}
</urlset>
`;
}
```

- [ ] **Step 4: Run the test; it passes.**

- [ ] **Step 5: Rewrite `supabase/functions/generate-sitemap/index.ts`.** Keep the CORS and method handling (GET, HEAD, OPTIONS) and `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` client. Delete `fallbackRoutes`, `buildFallbackSitemap`, `fetchCanonicalSitemap` and the local `escapeXml` (it uses `replaceAll`). The core:

```ts
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.117.2';
import { INDEXABLE_INCIDENT_POSTGREST_FILTER, isIndexableIncidentMetadata, SAFE_ARTICLE_ID, WEEK_START } from '../_shared/publishable.ts';
import { canonicalIncidentUrl, canonicalWeeklyUrl } from '../_shared/site-urls.ts';
import { incidentLastmod, pageEntries, renderNewsSitemap, renderUrlset, renderUrlText, sitemapDate, type SitemapEntry } from '../_shared/sitemap-render.ts';

const PAGE = 1_000; // config.toml max_rows

async function indexableIncidents(db: SupabaseClient, sinceIso?: string) {
  const rows: { id: string; title: string; created_at: string; metadata: unknown }[] = [];
  for (let from = 0; ; from += PAGE) {
    let query = db.from('news_articles').select('id, title, created_at, metadata')
      .or(INDEXABLE_INCIDENT_POSTGREST_FILTER)
      .order('created_at', { ascending: false }).order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (sinceIso) query = query.gte('created_at', sinceIso);
    const { data, error } = await query;
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE || rows.length >= 100_000) break;
  }
  return rows.filter((row) => SAFE_ARTICLE_ID.test(row.id) && isIndexableIncidentMetadata(row.metadata));
}

async function latestStatusChanges(db: SupabaseClient): Promise<Map<string, string>> {
  const { data, error } = await db.from('incident_status_events').select('article_id, created_at')
    .not('article_id', 'is', null).order('created_at', { ascending: false }).limit(PAGE);
  if (error) throw error;
  const out = new Map<string, string>();
  for (const row of data ?? []) if (row.article_id && !out.has(row.article_id)) out.set(row.article_id, row.created_at);
  return out;
}

async function weeklyEntries(db: SupabaseClient): Promise<SitemapEntry[]> {
  const { data, error } = await db.from('newsletter_issues').select('period_start, generated_at')
    .eq('kind', 'weekly').in('status', ['ready', 'sent']).order('period_start', { ascending: false }).limit(520);
  if (error) throw error;
  return (data ?? []).flatMap((issue) => {
    const day = sitemapDate(String(issue.period_start));
    return day && WEEK_START.test(day) && new Date(`${day}T00:00:00Z`).getUTCDay() === 1
      ? [{ loc: canonicalWeeklyUrl(day), lastmod: sitemapDate(issue.generated_at) }]
      : [];
  });
}
```

Request handling: parse `part` (`dynamic` default, `news`), `page` (integer >= 1, default 1) and `format` (`xml` default, `txt`). Unknown values return 400. For `dynamic`: incidents (lastmod from `incidentLastmod(row, statusChanges.get(row.id) ?? null)`), then weekly; if a database call fails, return 503 with `Retry-After: 3600` instead of an empty urlset (an empty sitemap tells crawlers the pages are gone). For `news`: `indexableIncidents(db, new Date(Date.now() - 48 * 3_600_000).toISOString())`, mapped to `{ loc, title, publishedAt: created_at }`. Headers: `Content-Type: application/xml; charset=utf-8` (or `text/plain; charset=utf-8` for `txt`), `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`, and `X-Robots-Tag: noindex` so the sitemap itself is never shown as a search result.

- [ ] **Step 6: Check the entry compiles.** `bun build supabase/functions/generate-sitemap/index.ts --no-bundle > /dev/null` exits 0.
- [ ] **Step 7: Commit.** `git commit -m "feat(seo): list only indexable incidents in the dynamic sitemap with honest lastmod"`

### Task S1.5: IndexNow helper, key file and the ping-indexnow function

**Files:** Create `_shared/indexnow.ts`, `_shared/indexnow.test.ts`, `public/<key>.txt`, `supabase/functions/ping-indexnow/index.ts`. Modify `_shared/ingestion-health.ts` (add `'indexnow'` to the `pipeline` union).

- [ ] **Step 1: Generate the key.** `openssl rand -hex 16` prints 32 lowercase hex characters. Use that value as `<key>` below. It is public by design: anyone can read it from the site root.

- [ ] **Step 2: Write the failing test**

```ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildIndexNowBody, chunkUrls, classifyIndexNowResponse, filterSubmittableUrls, INDEXNOW_KEY,
  INDEXNOW_MAX_URLS_PER_RUN, keyLocation, nextCursor, planIndexNowUrls, resolveSince,
} from './indexnow';

describe('indexnow', () => {
  it('has a valid key served from public/', () => {
    expect(INDEXNOW_KEY).toMatch(/^[a-f0-9]{32}$/);
    expect(readFileSync(resolve(process.cwd(), `public/${INDEXNOW_KEY}.txt`), 'utf8').trim()).toBe(INDEXNOW_KEY);
    expect(keyLocation()).toBe(`https://www.digibastion.com/${INDEXNOW_KEY}.txt`);
  });
  it('submits only canonical URLs on our host, once each, without tags', () => {
    expect(filterSubmittableUrls([
      'https://www.digibastion.com/threat-intel/a?utm_source=telegram',
      'https://www.digibastion.com/threat-intel/a',
      'https://digibastion.com/threat-intel/b',
      'http://www.digibastion.com/threat-intel/c',
      'https://evil.test/x',
    ])).toEqual(['https://www.digibastion.com/threat-intel/a']);
  });
  it('builds the protocol body', () => {
    expect(buildIndexNowBody(['https://www.digibastion.com/a'])).toEqual({
      host: 'www.digibastion.com', key: INDEXNOW_KEY, keyLocation: keyLocation(), urlList: ['https://www.digibastion.com/a'],
    });
  });
  it('chunks at 10,000', () => {
    expect(chunkUrls(Array.from({ length: 10_001 }, (_, i) => `u${i}`)).map((c) => c.length)).toEqual([10_000, 1]);
  });
  it.each([[200, 'ok'], [202, 'ok'], [400, 'bad_request'], [403, 'key_invalid'], [422, 'unprocessable'], [429, 'rate_limited'], [503, 'server_error'], [302, 'unexpected']])(
    'classifies %i as %s', (status, outcome) => expect(classifyIndexNowResponse(status)).toBe(outcome));
  it('plans weekly first, then incidents, then hubs, capped', () => {
    expect(planIndexNowUrls({ incidentIds: ['b', 'a'], statusChangedIds: ['a', 'c'], weeklyStarts: ['2026-10-05'] })).toEqual([
      'https://www.digibastion.com/threat-intel/weekly/2026-10-05',
      'https://www.digibastion.com/threat-intel/b',
      'https://www.digibastion.com/threat-intel/a',
      'https://www.digibastion.com/threat-intel/c',
      'https://www.digibastion.com/threat-intel',
      'https://www.digibastion.com/threat-intel/weekly',
    ]);
    expect(planIndexNowUrls({ incidentIds: [], statusChangedIds: [], weeklyStarts: [] })).toEqual([]);
    const many = Array.from({ length: 2_000 }, (_, i) => `id${i}`);
    expect(planIndexNowUrls({ incidentIds: many, statusChangedIds: [], weeklyStarts: [] }).length).toBe(INDEXNOW_MAX_URLS_PER_RUN);
  });
  it('resumes from the last successful cursor, within 7 days', () => {
    const now = new Date('2026-10-11T12:00:00Z');
    expect(resolveSince(null, now)).toBe('2026-10-11T10:00:00.000Z');
    expect(resolveSince({ attempted_at: '2026-10-11T11:22:00Z', metadata: { cursor: '2026-10-11T11:21:00.000Z' } }, now)).toBe('2026-10-11T11:21:00.000Z');
    expect(resolveSince({ attempted_at: '2026-09-01T00:00:00Z', metadata: {} }, now)).toBe('2026-10-04T12:00:00.000Z');
  });
  it('advances the cursor to the last included row when truncated', () => {
    expect(nextCursor({ until: '2026-10-11T12:00:00.000Z', truncated: false, lastIncludedCreatedAt: null })).toBe('2026-10-11T12:00:00.000Z');
    expect(nextCursor({ until: '2026-10-11T12:00:00.000Z', truncated: true, lastIncludedCreatedAt: '2026-10-11T09:00:00.000Z' })).toBe('2026-10-11T09:00:00.000Z');
  });
});
```

- [ ] **Step 3: Run it; it fails.**

- [ ] **Step 4: Implement `_shared/indexnow.ts`**

```ts
// IndexNow (Bing, Yandex, Seznam, Naver, Yep). Google does not take part.
// Pure module. The key is public by design: it is served at keyLocation().
import { canonicalIncidentUrl, canonicalizeUrl, canonicalWeeklyUrl, SITE_HOST, SITE_URL } from './site-urls.ts';

export const INDEXNOW_KEY = '<key from Step 1>';
export const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
export const INDEXNOW_MAX_URLS_PER_RUN = 1_000;
export const INDEXNOW_MAX_URLS_PER_POST = 10_000;
const FIRST_RUN_WINDOW_MS = 2 * 3_600_000;
const MAX_LOOKBACK_MS = 7 * 86_400_000;

export type IndexNowOutcome = 'ok' | 'bad_request' | 'key_invalid' | 'unprocessable' | 'rate_limited' | 'server_error' | 'unexpected';

export const keyLocation = (key: string = INDEXNOW_KEY) => `${SITE_URL}/${key}.txt`;

export function filterSubmittableUrls(urls: readonly string[]): string[] {
  const seen = new Set<string>();
  for (const url of urls) {
    if (!url.startsWith(`https://${SITE_HOST}`)) continue;
    const canonical = canonicalizeUrl(url);
    if (canonical) seen.add(canonical);
  }
  return [...seen];
}

export function buildIndexNowBody(urls: readonly string[], key: string = INDEXNOW_KEY) {
  return { host: SITE_HOST, key, keyLocation: keyLocation(key), urlList: [...urls] };
}

export function chunkUrls(urls: readonly string[], size = INDEXNOW_MAX_URLS_PER_POST): string[][] {
  const out: string[][] = [];
  for (let i = 0; i < urls.length; i += size) out.push(urls.slice(i, i + size));
  return out;
}

export function classifyIndexNowResponse(status: number): IndexNowOutcome {
  if (status === 200 || status === 202) return 'ok';
  if (status === 400) return 'bad_request';
  if (status === 403) return 'key_invalid';
  if (status === 422) return 'unprocessable';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'server_error';
  return 'unexpected';
}

export interface IndexNowCandidates { incidentIds: string[]; statusChangedIds: string[]; weeklyStarts: string[] }

export function planIndexNowUrls(c: IndexNowCandidates): string[] {
  const weekly = c.weeklyStarts.map((week) => canonicalWeeklyUrl(week));
  const incidents = [...c.incidentIds, ...c.statusChangedIds].map((id) => canonicalIncidentUrl(id));
  const hubs = [
    ...(incidents.length > 0 ? [`${SITE_URL}/threat-intel`] : []),
    ...(weekly.length > 0 ? [`${SITE_URL}/threat-intel/weekly`] : []),
  ];
  const unique = filterSubmittableUrls([...weekly, ...incidents]).slice(0, INDEXNOW_MAX_URLS_PER_RUN - hubs.length);
  return unique.length === 0 ? [] : [...unique, ...hubs];
}

export function resolveSince(lastSuccess: { attempted_at: string; metadata: unknown } | null, now: Date): string {
  const floor = now.getTime() - MAX_LOOKBACK_MS;
  if (!lastSuccess) return new Date(now.getTime() - FIRST_RUN_WINDOW_MS).toISOString();
  const meta = lastSuccess.metadata && typeof lastSuccess.metadata === 'object' ? lastSuccess.metadata as Record<string, unknown> : {};
  const cursor = typeof meta.cursor === 'string' ? Date.parse(meta.cursor) : Date.parse(lastSuccess.attempted_at);
  return new Date(Math.max(Number.isNaN(cursor) ? floor : cursor, floor)).toISOString();
}

export function nextCursor(o: { until: string; truncated: boolean; lastIncludedCreatedAt: string | null }): string {
  return o.truncated && o.lastIncludedCreatedAt ? new Date(o.lastIncludedCreatedAt).toISOString() : o.until;
}
```

Write `public/<key>.txt` containing exactly the key and one trailing newline.

- [ ] **Step 5: Run the test; it passes.**

- [ ] **Step 6: Write `supabase/functions/ping-indexnow/index.ts`.** Copy `corsHeaders`, `json()`, `timingSafeEqual()` and `authorize()` from `send-newsletters/index.ts`. Body schema, validated by hand (no zod import needed): `{ mode?: 'run' | 'urls' | 'backfill'; dryRun?: boolean; urls?: string[] }`, default `mode: 'run'`. `urls` and `backfill` require `principal.kind === 'admin' || 'service'`; `urls` takes at most 1,000 entries. The run:

```ts
const until = new Date().toISOString();
const { data: last } = await db.from('threat_intel_ingestion_runs').select('attempted_at, metadata')
  .eq('pipeline', 'indexnow').eq('success', true).order('attempted_at', { ascending: false }).limit(1).maybeSingle();
const since = resolveSince(last ?? null, new Date(until));

// New incidents, oldest first so a truncated run can resume exactly where it stopped.
const { data: fresh } = await db.from('news_articles').select('id, created_at, metadata')
  .or(INDEXABLE_INCIDENT_POSTGREST_FILTER).gt('created_at', since).lte('created_at', until)
  .order('created_at', { ascending: true }).limit(INDEXNOW_MAX_URLS_PER_RUN);
const incidents = (fresh ?? []).filter((r) => SAFE_ARTICLE_ID.test(r.id) && isIndexableIncidentMetadata(r.metadata));
const truncated = (fresh ?? []).length === INDEXNOW_MAX_URLS_PER_RUN;

// Status changes (confirmed, revised, retracted) logged in the window, still indexable.
const { data: events } = await db.from('incident_status_events').select('article_id')
  .gt('created_at', since).lte('created_at', until).not('article_id', 'is', null).limit(1_000);
const changedIds = [...new Set((events ?? []).map((e) => e.article_id as string))];
const { data: changedRows } = changedIds.length
  ? await db.from('news_articles').select('id, metadata').in('id', changedIds).or(INDEXABLE_INCIDENT_POSTGREST_FILTER)
  : { data: [] };

const { data: weeks } = await db.from('newsletter_issues').select('period_start')
  .eq('kind', 'weekly').in('status', ['ready', 'sent']).gt('generated_at', since).lte('generated_at', until);
```

Build `urls = planIndexNowUrls(...)` (weekly starts via `String(period_start).slice(0, 10)` filtered by `WEEK_START`). For `backfill`, page through all indexable incidents with `.range()` (as in S1.4) plus every weekly issue, and submit in `chunkUrls` pieces. For `urls`, use `filterSubmittableUrls(body.urls)`.

Then:
- `dryRun: true`: return `{ dryRun: true, count, sample: urls.slice(0, 5) }` and **record nothing** (a dry run must never advance the cursor).
- Empty list: record a successful run with `records_found: 0` and `metadata: { mode, cursor }` and return. Health stays green.
- Otherwise POST each chunk to `INDEXNOW_ENDPOINT` with `Content-Type: application/json; charset=utf-8`, `AbortSignal.timeout(10_000)` and no retries. Stop at the first chunk that is not `ok`.
- Record with `recordIngestionRun(db, { pipeline: 'indexnow', attempted_at, completed_at, success, records_found: urls.length, records_inserted: acceptedCount, records_invalid: rejectedCount, duration_ms, error_summary: success ? undefined : outcomes.join(','), metadata: { mode, chunks, statuses, truncated, cursor: success ? nextCursor({ until, truncated, lastIncludedCreatedAt: incidents.at(-1)?.created_at ?? null }) : undefined } })`. Never store the key or URL lists in the run. A failed run keeps the old cursor, so the next run retries the same URLs.
- Use `INDEXNOW_KEY` from `Deno.env.get('INDEXNOW_KEY')` when it is set and matches `/^[a-f0-9]{32}$/` (rotation), else the constant. If the env key differs from the constant, the matching `public/<key>.txt` must also exist; say so in the release doc.

- [ ] **Step 7: Compile.** `bun build supabase/functions/ping-indexnow/index.ts --no-bundle > /dev/null` exits 0.
- [ ] **Step 8: Commit.** `git commit -m "feat(seo): ping IndexNow with new and changed incident and weekly URLs"` (stage `_shared/indexnow.ts`, its test, `public/<key>.txt`, `ping-indexnow/index.ts`, `_shared/ingestion-health.ts`).

### Task S1.6: Feeds (RSS 2.0, Atom 1.0, JSON Feed 1.1)

**Files:** Create `_shared/feed-render.ts`, `_shared/feed-render.test.ts`, `supabase/functions/threat-intel-feed/index.ts`.

- [ ] **Step 1: Write the failing test** (jsdom environment for `DOMParser`). Build fixtures with `toNewsletterItem` from `newsletter-content.ts` and `weeklyPublicContent` from `weekly-test-fixtures.ts`.

```ts
// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { incidentFeedItem, renderAtom, renderJsonFeed, renderRss, weeklyFeedItem, FEED_CHANNEL } from './feed-render';
import { toNewsletterItem } from './newsletter-content';
import { weeklyPublicContent } from './weekly-test-fixtures';

const row = {
  id: 'abc', uid: 'qm:1', title: 'Bridge & Co <exploit>', summary: 'Attackers drained the bridge.', severity: 'high',
  category: 'defi-exploits', link: 'https://www.quillaudits.com/web3-hacks-database/x', source_name: 'QuillMonitor',
  cve_id: null, tags: [], affected_technologies: [], created_at: '2026-10-11T02:20:00Z',
  metadata: { provider: 'quillmonitor', is_web3_incident: true, verification_status: 'unverified', project_name: 'Bridge & Co', amount_lost_usd: 4_200_000, incident_date: '2026-10-10' },
};
const item = incidentFeedItem(toNewsletterItem(row, 'https://www.digibastion.com'));
const parses = (xml: string) => new DOMParser().parseFromString(xml, 'application/xml').getElementsByTagName('parsererror').length === 0;

describe('feed-render', () => {
  it('links to the canonical page with no tags and a permalink guid', () => {
    expect(item.url).toBe('https://www.digibastion.com/threat-intel/abc');
    const rss = renderRss(FEED_CHANNEL, [item]);
    expect(parses(rss)).toBe(true);
    expect(rss).toContain('<guid isPermaLink="true">https://www.digibastion.com/threat-intel/abc</guid>');
    expect(rss).not.toContain('utm_');
  });
  it('names the source, its status and QuillMonitor, never Digibastion as verifier', () => {
    expect(item.contentHtml).toContain('Source: <a href="https://www.quillaudits.com/web3-hacks-database/x">QuillMonitor</a> (unconfirmed, preliminary)');
    expect(item.contentHtml).toContain('Powered by <a href="https://www.quillaudits.com/web3-hacks-database">QuillMonitor</a>');
    expect(item.contentHtml).not.toMatch(/verified by digibastion/i);
  });
  it('produces valid Atom and JSON Feed', () => {
    expect(parses(renderAtom(FEED_CHANNEL, [item]))).toBe(true);
    const json = JSON.parse(renderJsonFeed(FEED_CHANNEL, [item]));
    expect(json.version).toBe('https://jsonfeed.org/version/1.1');
    expect(json.items[0]).toMatchObject({ id: item.url, url: item.url, date_published: '2026-10-11T02:20:00.000Z' });
  });
  it('is deterministic: no build clock in the output', () => {
    expect(renderRss(FEED_CHANNEL, [item])).toBe(renderRss(FEED_CHANNEL, [item]));
    expect(renderRss(FEED_CHANNEL, [])).not.toContain('<lastBuildDate>');
  });
  it('adds the weekly issue', () => {
    const weekly = weeklyFeedItem(weeklyPublicContent(), '2026-10-12T00:10:00Z');
    expect(weekly.url).toMatch(/^https:\/\/www\.digibastion\.com\/threat-intel\/weekly\/\d{4}-\d{2}-\d{2}$/);
  });
});
```

If `weeklyPublicContent` in `weekly-test-fixtures.ts` has a different call shape, adapt the call, not the fixture.

- [ ] **Step 2: Run it; it fails.**

- [ ] **Step 3: Implement `feed-render.ts`.** Interfaces and the parts that carry rules:

```ts
import { isQuillMonitorOnly, QUILLMONITOR_DATABASE_URL, sourceLabelFor, sourceLinkFor } from './attribution.ts';
import { buildIncidentAnswer } from './incident-answer.ts';
import type { NewsletterItem, WeeklyPublicContent } from './newsletter-content.ts';
import { buildWeeklySubject } from './weekly-render.ts';
import { canonicalIncidentUrl, canonicalWeeklyUrl, FEED_URLS, SITE_URL } from './site-urls.ts';
import { escapeXml } from './xml.ts';

export interface FeedItem {
  url: string; title: string; summaryText: string; contentHtml: string;
  publishedAt: string; categories: string[]; authorName: string;
}
export interface FeedChannel { title: string; description: string; homePageUrl: string }

export const FEED_CHANNEL: FeedChannel = {
  title: 'Digibastion Threat Intel',
  description: 'Crypto and Web3 security incidents from QuillMonitor and other public trackers, one record per incident, each linked to its source.',
  homePageUrl: `${SITE_URL}/threat-intel`,
};

const STATUS_WORDS = { confirmed: 'confirmed', unconfirmed: 'unconfirmed, preliminary' } as const;

export function incidentFeedItem(item: NewsletterItem): FeedItem {
  const url = canonicalIncidentUrl(item.articleId ?? item.uid);
  const answer = buildIncidentAnswer(item);
  const name = sourceLabelFor(item);
  const link = sourceLinkFor(item);
  const status = item.status ? ` (${STATUS_WORDS[item.status]})` : '';
  const source = link ? `<a href="${escapeXml(link)}">${escapeXml(name)}</a>` : escapeXml(name);
  const parts = [
    `<p>${escapeXml(answer)}</p>`,
    item.summary ? `<p>${escapeXml(item.summary)}</p>` : '',
    `<p>Source: ${source}${status}</p>`,
    isQuillMonitorOnly(item.providers) ? `<p>Powered by <a href="${QUILLMONITOR_DATABASE_URL}">QuillMonitor</a></p>` : '',
  ];
  return { url, title: item.title, summaryText: answer, contentHtml: parts.join(''), publishedAt: new Date(item.createdAt).toISOString(), categories: item.category ? [item.category] : [], authorName: name };
}

export function weeklyFeedItem(c: WeeklyPublicContent, generatedAt: string): FeedItem { /* title: buildWeeklySubject(c); url: canonicalWeeklyUrl(c.weekStart); authorName 'Digibastion' (we write the weekly) */ }
export function renderRss(ch: FeedChannel, items: readonly FeedItem[]): string { /* see rules below */ }
export function renderAtom(ch: FeedChannel, items: readonly FeedItem[]): string { /* see rules below */ }
export function renderJsonFeed(ch: FeedChannel, items: readonly FeedItem[]): string { /* see rules below */ }
```

Rendering rules:
- RSS 2.0: `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">`, channel `title`, `link`, `description`, `language` `en`, `<atom:link href="FEED_URLS.rss" rel="self" type="application/rss+xml"/>`, `<lastBuildDate>` equal to the newest item's `publishedAt` in RFC 822 (`new Date(x).toUTCString()`) and omitted when there are no items. Items: `title`, `link`, `guid isPermaLink="true"` (the canonical URL), `pubDate`, one `category` each, `description` holding the XML-escaped `contentHtml`.
- Atom 1.0: `<feed xmlns="http://www.w3.org/2005/Atom">`, `id` = `homePageUrl`, `updated` = newest item date (or `1970-01-01T00:00:00Z` when empty, since Atom requires it), `link rel="self"` = `FEED_URLS.atom`, entries with `id`, `link`, `updated`, `published`, `author/name`, `summary`, `content type="html"`.
- JSON Feed 1.1: `JSON.stringify({ version: 'https://jsonfeed.org/version/1.1', title, home_page_url, feed_url: FEED_URLS.json, description, language: 'en', items: [{ id: url, url, title, content_html, summary, date_published, tags, authors: [{ name }] }] }, null, 2)`.

- [ ] **Step 4: Run the test; it passes.**

- [ ] **Step 5: Write `threat-intel-feed/index.ts`.** Public GET, HEAD and OPTIONS; anything else 405. Query `format` (`rss` default, `atom`, `json`) and `type` (`all` default, `incidents`, `weekly`); unknown values return 400. With the service-role client: the 50 newest indexable incidents (`select` the `NewsletterSourceRow` columns, `.or(INDEXABLE_INCIDENT_POSTGREST_FILTER)`, `.order('created_at', { ascending: false }).limit(50)`, then `isIndexableIncidentMetadata` and `toNewsletterItem(row, SITE_URL)`), and the 10 newest `ready`/`sent` weekly issues (`content`, `generated_at`; strip `archive` with `toPublicWeekly` from `weekly-render.ts`). Merge, sort by `publishedAt` descending. Content types: `application/rss+xml; charset=utf-8`, `application/atom+xml; charset=utf-8`, `application/feed+json; charset=utf-8`. `Cache-Control: public, max-age=900, stale-while-revalidate=3600`. On a database error return 503 with `Retry-After: 900`, never an empty feed.

- [ ] **Step 6: Compile.** `bun build supabase/functions/threat-intel-feed/index.ts --no-bundle > /dev/null`.
- [ ] **Step 7: Commit.** `git commit -m "feat(seo): add RSS, Atom and JSON feeds for threat intel"`

### Task S1.7: Migrations, config and robots

**Files:** Create both migrations. Modify `supabase/config.toml`, `public/robots.txt`, `supabase/functions/fetch-web3-incidents/index.ts`.

- [ ] **Step 1: Write `20261014090000_seo_indexing.sql`**

```sql
-- lovable-cron-fallback-reviewed: IndexNow has no database-trigger integration here; a half-hour poll five minutes after each QuillMonitor sync submits only new or status-changed URLs.

ALTER TABLE public.threat_intel_ingestion_runs
  DROP CONSTRAINT IF EXISTS threat_intel_ingestion_runs_pipeline_check;
ALTER TABLE public.threat_intel_ingestion_runs
  ADD CONSTRAINT threat_intel_ingestion_runs_pipeline_check
  CHECK (pipeline IN ('rss','web3-incidents','quillmonitor','slowmist','ai-summary','critical-alerts',
                      'digest-emails','telegram','newsletter-build','indexnow'));
```

Then `CREATE OR REPLACE FUNCTION public.get_threat_intel_health()`: copy lines 23-126 of `20261013120000_daily_newsletter_jobs.sql` exactly (function body, `REVOKE` and `GRANT`), changing only the `VALUES` list to:

```sql
    VALUES ('rss'::text, 2), ('web3-incidents'::text, 8), ('quillmonitor'::text, 1),
           ('slowmist'::text, 6), ('critical-alerts'::text, 2),
           ('digest-emails'::text, 2), ('ai-summary'::text, 8),
           ('telegram'::text, 1), ('newsletter-build'::text, 26),
           ('indexnow'::text, 1)
```

Then the cron job and the legacy cleanup:

```sql
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'ping-indexnow';
SELECT cron.schedule('ping-indexnow', '22,52 * * * *', $$
  SELECT public.record_cron_http_request(
    'ping-indexnow',
    'https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/ping-indexnow',
    '{"mode":"run"}'::jsonb,
    60000
  );
$$);

-- 20260113070736 created fetch-web3-incidents-6h with an old auth setting and no
-- later migration removed it; fetch-web3-incidents-6hourly replaced it.
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'fetch-web3-incidents-6h';
```

- [ ] **Step 2: Write `20261014100000_weekly_newsletter_list.sql`**

```sql
-- Public archive of weekly deep-dives for /threat-intel/weekly. Content only
-- for ready and sent issues; never the private archive key.
DROP FUNCTION IF EXISTS public.list_weekly_newsletters(integer);

CREATE FUNCTION public.list_weekly_newsletters(p_limit integer DEFAULT 52)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT coalesce(jsonb_agg(item ORDER BY week_start DESC), '[]'::jsonb)
  FROM (
    SELECT (issue.period_start AT TIME ZONE 'UTC')::date AS week_start,
      jsonb_build_object(
        'week_start', (issue.period_start AT TIME ZONE 'UTC')::date,
        'week_end', issue.content->>'weekEnd',
        'generated_at', issue.generated_at,
        'incident_count', coalesce(nullif(issue.content->'totals'->>'incidentCount', '')::numeric, 0),
        'loss_usd', coalesce(nullif(issue.content->'totals'->>'lossUsd', '')::numeric, 0)
      ) AS item
    FROM public.newsletter_issues issue
    WHERE issue.kind = 'weekly' AND issue.status IN ('ready', 'sent')
    ORDER BY issue.period_start DESC
    LIMIT least(greatest(coalesce(p_limit, 52), 1), 200)
  ) issues;
$function$;

REVOKE ALL ON FUNCTION public.list_weekly_newsletters(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_weekly_newsletters(integer) TO anon, authenticated, service_role;
```

- [ ] **Step 3: `supabase/config.toml`.** Append:

```toml
[functions.ping-indexnow]
verify_jwt = false

[functions.threat-intel-feed]
verify_jwt = false

[functions.weekly-admin-summary]
verify_jwt = false

[functions.threat-intel-api]
verify_jwt = false
```

`weekly-admin-summary` checks a timing-safe `CRON_SECRET` itself (index.ts:249-256), and its cron sends that secret as the bearer token, which a JWT-verifying gateway rejects. `threat-intel-api` checks a hashed `x-api-key` itself. Both are listed in the release doc for a live check.

- [ ] **Step 4: `public/robots.txt`.** Keep the existing groups and disallows. Add these agents to the shared group: `ClaudeBot`, `Claude-User`, `Claude-SearchBot`, `Perplexity-User`, `Applebot-Extended`, `meta-externalagent`, `Amazonbot`, `Bingbot`. Keep `anthropic-ai` and `Claude-Web` (retired names, harmless). Add `Disallow: /stats.html` and `Disallow: /__prerender-check`. Replace the sitemap block with:

```
Sitemap: https://www.digibastion.com/sitemap-index.xml
Sitemap: https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/generate-sitemap?part=dynamic
Sitemap: https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/generate-sitemap?part=news
```

The robots.txt `Sitemap:` line is what lets Google and Bing accept a sitemap hosted on another domain.

- [ ] **Step 5: De-obfuscate the Web3 source.** In `supabase/functions/fetch-web3-incidents/index.ts:21`, replace the base64-decoded constant with the plain string `'https://www.web3isgoinggreat.com'` (match the decoded value exactly, including scheme and trailing slash, by decoding it first with `node -e "console.log(Buffer.from('<value>','base64').toString())"`) and delete the "for privacy" comment. The site and methodology page already name the source, and hiding it contradicts the attribution rule. Compile with `bun build`.

- [ ] **Step 6: Commit.** `git commit -m "feat(seo): schedule IndexNow, add weekly archive RPC and list sitemaps in robots.txt"`

### Task S1.8: Secret scan for public files

**Files:** Create `src/utils/__tests__/publicFilesNoSecrets.test.ts`.

- [ ] **Step 1: Write the test**

```ts
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOTS = ['public', 'supabase/functions', 'edge'];
const SKIP = /\.(png|ico|jpg|jpeg|gif|webp|woff2?)$/i;
const JWT = /eyJ[A-Za-z0-9_-]+\.(eyJ[A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+/g;
const PATTERNS: [string, RegExp][] = [
  ['Resend key', /\bre_[A-Za-z0-9]{20,}/],
  ['webhook secret', /\bwhsec_[A-Za-z0-9+/=]{20,}/],
  ['Telegram bot token', /\b\d{8,10}:[A-Za-z0-9_-]{35}\b/],
  ['personal Gmail', /[A-Za-z0-9._%+-]+@gmail\.com/i],
  ['Supabase secret key', /\bsb_secret_[A-Za-z0-9_-]{10,}/],
];

function files(dir: string): string[] {
  let out: string[] = [];
  try { readdirSync(dir); } catch { return out; }
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules') continue;
    const path = join(dir, name);
    out = statSync(path).isDirectory() ? out.concat(files(path)) : SKIP.test(name) ? out : out.concat(path);
  }
  return out;
}

describe('public files carry no secrets', () => {
  const all = ROOTS.flatMap((root) => files(resolve(process.cwd(), root)));
  it.each(PATTERNS)('no %s', (_label, pattern) => {
    const hits = all.filter((file) => pattern.test(readFileSync(file, 'utf8')));
    expect(hits).toEqual([]);
  });
  it('no JWT other than the public anon key', () => {
    const hits = all.filter((file) => [...readFileSync(file, 'utf8').matchAll(JWT)].some((match) => {
      try { return JSON.parse(Buffer.from(match[1], 'base64url').toString('utf8')).role !== 'anon'; } catch { return false; }
    }));
    expect(hits).toEqual([]);
  });
});
```

`re_test_secret_key` in an existing test fixture does not match (`re_` plus 20 alphanumerics). If any pattern hits an existing file, read the hit, confirm it is a fixture or a false positive, and narrow the pattern rather than skipping the file.

- [ ] **Step 2: Run it; it passes.** `rtk proxy npx vitest run src/utils/__tests__/publicFilesNoSecrets.test.ts`
- [ ] **Step 3: Commit.** `git commit -m "test: scan public and function files for secrets"`

### S1 verification

```bash
cd /Users/chirag/Documents/digibastion_web-seo
rtk proxy npx vitest run supabase/functions/_shared src/utils/__tests__/publishableParity.test.ts src/utils/__tests__/publicFilesNoSecrets.test.ts
for f in generate-sitemap ping-indexnow threat-intel-feed fetch-web3-incidents; do bun build supabase/functions/$f/index.ts --no-bundle > /dev/null || echo "FAIL $f"; done
npx eslint supabase/functions/_shared/{site-urls,xml,publishable,attribution,incident-answer,sitemap-render,indexnow,feed-render}.ts
ls supabase/migrations | tail -3   # the two new files sort last
rtk proxy npx vitest run           # full suite still green
```

---

## S2. Prerender and on-page SEO

**Goal:** Every public route ships its own title, description, canonical, Open Graph tags, JSON-LD and a readable HTML body to crawlers that do not run JavaScript, from one registry that the React pages also read. Search and answer engines get complete `llms.txt`, `llms-full.txt` and a sitemap that never drifts.

**Files**
- Create: `src/seo/routeTypes.ts`, `src/seo/siteFacts.ts`, `src/seo/routeMeta.ts`, `src/seo/incidentMeta.ts`, `src/seo/prerender.ts`, `src/seo/htmlText.ts`, `src/seo/staticFiles.ts`, `src/seo/fetchDynamic.ts`, and tests in `src/seo/__tests__/`: `routeMeta.test.ts`, `incidentMeta.test.ts`, `prerender.test.ts`, `htmlText.test.ts`, `fetchDynamic.test.ts`, `generatedFilesInSync.test.ts`, `mainEntry.test.ts`.
- Create: `scripts/seo/prerenderPlugin.ts`, `scripts/seo/prerenderCore.ts`, `scripts/seo/ssrEntry.ts`, `scripts/seo/generate.mjs`.
- Create: `src/integrations/supabase/publicDefaults.ts`, `src/pages/Faq.tsx`, `src/pages/WeeklyArchive.tsx`, `src/components/__tests__/MetaTags.test.tsx`.
- Create: `public/__prerender-check.html`, `public/__prerender-check/index.html`, `public/llms-full.txt` (generated).
- Modify: `index.html`, `vite.config.ts`, `package.json`, `src/main.tsx`, `src/App.tsx`, `src/components/MetaTags.tsx`, `src/utils/seo.ts`, `src/utils/__tests__/seo.test.ts`, `src/integrations/supabase/publicConfig.ts`, `src/lib/threatIntel/weekly.ts`, `src/utils/__tests__/weekly.test.ts`, `src/components/news/NewsDetail.tsx`, `src/components/news/__tests__/NewsDetail.test.tsx`, `public/sitemap.xml`, `public/sitemap-index.xml`, `public/llms.txt`.
- Modify (MetaTags and JSON-LD only): `src/pages/Index.tsx`, `News.tsx`, `ThreatIntelMethodology.tsx`, `WeeklyNewsletter.tsx`, `About.tsx`, `Tools.tsx`, `Links.tsx`, `Quiz.tsx`, `Leaderboard.tsx`, `Services.tsx`, `services/OpsecConsulting.tsx`, `services/FullStackReview.tsx`, `Contact.tsx`, `Support.tsx`, `License.tsx`, `Share.tsx`, `Articles.tsx`, `ArticleDetail.tsx`, `CategoryDetail.tsx`, `NotFound.tsx`, `ManageSubscription.tsx`, `Unsubscribe.tsx`, `VerifyEmail.tsx`, `QuizResult.tsx`, `AdminLogin.tsx`, `AdminAnalytics.tsx`, `CronMonitor.tsx`, `AdminApiKeys.tsx`. Check each path with `ls` first; adjust to the real filename if one differs.

**Module boundary rule.** `routeTypes.ts`, `siteFacts.ts`, `routeMeta.ts`, `incidentMeta.ts`, `prerender.ts`, `htmlText.ts`, `src/utils/seo.ts`, and the two modules they may import from the app, `src/lib/threatIntel/weekly.ts` and `src/lib/threatIntel/officialLinks.ts` (both alias-free today), import only relative paths and `_shared` modules: no `@/` alias, no React, no `window`, no data modules. Type-only imports such as `import type { NewsArticle } from '../types/news'` are fine. The Worker (S4) and the prerender load them outside Vite. Builders take data as arguments, so pages do not pull `articlesData` into the main bundle.

**Interfaces produced**

```ts
// src/seo/routeTypes.ts
export type RobotsDirective = 'index' | 'noindex,follow' | 'noindex,nofollow';
export interface PrerenderLink { href: string; label: string }
export interface PrerenderBody {
  breadcrumbs: PrerenderLink[];   // excludes the current page
  h1: string;
  intro: string;                  // answer-first paragraph
  items?: string[];
  html?: string;                  // trusted HTML from our own React content (guide bodies)
  links: PrerenderLink[];
}
export interface RouteMeta {
  path: string;                   // canonical path
  title: string;                  // <= 70 chars
  description: string;            // <= 160 chars
  image: string;                  // absolute
  imageAlt: string;
  type: 'website' | 'article';
  robots: RobotsDirective;
  canonical: string | null;       // null only for the SPA fallback shell
  publishedTime?: string;
  modifiedTime?: string;
  lastmod?: string;               // YYYY-MM-DD for the static sitemap
  jsonLd: object[];
  body: PrerenderBody;
}

// src/seo/routeMeta.ts
export const SITE_FALLBACK_META: RouteMeta;                      // canonical: null
export const STATIC_ROUTES: Readonly<Record<string, RouteMeta>>;  // keyed by path
export const NOINDEX_PATHS: readonly string[];
export function staticRouteMeta(path: string): RouteMeta;         // throws on unknown path
export function categoryRouteMeta(c: { id: string; title: string; description: string; items: { title: string; description?: string }[] }): RouteMeta;
export function guideRouteMeta(a: GuideInput, html?: string): RouteMeta;
export function toolsRouteMeta(toolCount: number): RouteMeta;
export function weeklyRouteMeta(c: WeeklyPublicContent, generatedAt: string): RouteMeta;
export function toMetaTagsProps(meta: RouteMeta): MetaTagsProps;

// src/seo/incidentMeta.ts
export interface IncidentSeoInput extends AnswerInput { id: string; summary: string; createdAt: string; category: string; isWeb3Incident: boolean; sourceUrl: string | null; tags: string[] }
export function incidentSeoInputFromArticle(a: NewsArticle): IncidentSeoInput;
export function incidentRouteMeta(i: IncidentSeoInput): RouteMeta;
export function isUsableSummary(summary: string | null | undefined): boolean;

// src/seo/prerender.ts
export function renderHead(meta: RouteMeta): string;
export function renderBody(body: PrerenderBody): string;
export function injectIntoTemplate(template: string, head: string, body: string): string;
export function outputPathsFor(path: string, layout: 'file' | 'dir' | 'both'): string[];

// src/seo/siteFacts.ts
export const SITE_DEFINITION: string;
export const NEWSLETTERS_LIVE: boolean;            // false until NEWSLETTER_POSTAL_ADDRESS is set
export const X_HANDLE: string | null;              // 'digibastion'
export const GITHUB_REPO_URL: string;
export const GITHUB_ROADMAP_URL: string;           // .../blob/main/docs/ROADMAP.md
export interface FaqEntry { id: string; question: string; answer: string; links?: PrerenderLink[] }
export function faqEntries(o?: { newslettersLive?: boolean }): FaqEntry[];
export const THREAT_INTEL_FAQ_IDS: readonly string[];

// src/utils/seo.ts additions
export function buildWeeklySchema(c: WeeklyPublicContent, generatedAt: string): object;
export function buildFaqSchema(entries: FaqEntry[], pageUrl: string): object;
export function buildChecklistSchema(c: { id: string; title: string; items: { title: string; description?: string }[] }): object;
export function buildBreadcrumbSchema(items: PrerenderLink[]): object;
```

### Task S2.1: Route registry, site facts and the copy that lives in them

**Files:** `src/seo/routeTypes.ts`, `src/seo/siteFacts.ts`, `src/seo/routeMeta.ts`, `src/seo/__tests__/routeMeta.test.ts`.

Titles and descriptions come from the copy audit (sections 4 and 5). Use these strings exactly; S6 may reword them later without changing structure.

| Path | Title | Description |
|---|---|---|
| `/` | Digibastion: Web3 Security Alerts, Checklists and Guides | Free Web3 security help: a crypto hack tracker with email and Telegram alerts, security checklists, an OpSec self-check and practical guides. |
| `/threat-intel` | Crypto Hack and Web3 Exploit Tracker \| Digibastion | Crypto hacks, DeFi exploits and phishing from QuillMonitor and other public trackers, one record per incident, each linked to its source. Free alerts. |
| `/threat-intel/methodology` | How Digibastion Tracks Crypto Incidents: Sources and Severity | Where Digibastion's incident records come from, how severity is set, what confirmed and unconfirmed mean, how duplicates merge and how to report a mistake. |
| `/threat-intel/weekly` | Weekly Web3 Hack Reports \| Digibastion | Every weekly deep-dive in one list: reported losses, incident counts and the top incidents of each week, with every item linked to its source. |
| `/faq` | Digibastion FAQ: Threat Intel, Alerts and Checklists | Plain answers about Digibastion: where incident data comes from, how severity and duplicates work, how to get alerts and what is free. |
| `/about` | About Digibastion: Free Web3 Security Tools and Alerts | Digibastion is a free Web3 security site: an incident tracker with alerts, checklists, an OpSec self-check and guides, plus paid reviews for teams. |
| `/articles` | Web3 and Crypto Security Guides \| Digibastion | Practical guides to keeping crypto safe: seed phrases, phishing, token approvals, wallet drainers and what to do in the first hour after a hack. |
| `/tools` | Web3 Security Tools Directory \| Digibastion | `${n} Web3 security tools we link to, grouped by job: on-chain analytics, investigation, wallet protection, monitoring, hardware keys and secure messaging.` (n from `toolCategories`) |
| `/links` | Web3 Security Resources and Reading List \| Digibastion | Links to security guides, tools and references for Web3 users and developers, grouped by topic: wallets, smart contracts, cloud, on-chain and private keys. |
| `/quiz` | Crypto OpSec Self-Check: 8 Scenarios, 2 Minutes \| Digibastion | Eight questions drawn from 20 real scenarios show where your crypto OpSec is weak, with a breakdown and next steps. No wallet or account needed. |
| `/leaderboard` | OpSec Self-Check Leaderboard \| Digibastion | The top 50 public scores from Digibastion's crypto OpSec self-check. A light-hearted ranking, not a credential. Take the self-check to see your own result. |
| `/services` | Web3 Security Services \| Digibastion | OpSec consulting for founders and funds, and full-stack security reviews for Web3 teams, from the people who run Digibastion's free tools and alerts. |
| `/services/opsec-consulting` | Web3 OpSec Consulting for Founders and Funds \| Digibastion | Keep the page's current description, trimmed to 160 characters, with "DigiBastion" spelled "Digibastion" and "people sitting on size" replaced by "large holders". |
| `/services/full-stack-review` | Full-Stack Web3 Security Review \| Digibastion | Keep the current description, trimmed to 160 characters without adding claims. |
| `/contact`, `/support`, `/share` | Keep current titles, with " \| Digibastion" as the suffix | Keep current descriptions |
| `/license` | License and Terms \| Digibastion | Keep current description |
| `/category/<id>` | `${title.replace(/ Security$/, '')} Security Checklist \| Digibastion`; "OS Hardening" gives "OS Hardening Checklist \| Digibastion"; "Operational Security (OpSec)" gives "OpSec Checklist \| Digibastion" | `A ${n}-item ${title} checklist: ${description} Tick items off and your progress saves in your browser. No account needed.`, truncated at a word to 160 |
| `/articles/<slug>` | `${title} \| Digibastion` (truncated at a word so the whole fits 70) | the guide's `description` |

`NOINDEX_PATHS`: `/manage-subscription`, `/unsubscribe`, `/verify-email`, `/quiz-result`, `/admin`, `/admin/analytics`, `/admin/cron`, `/admin/api-keys`, `/news`, `/present`. They are never prerendered or listed.

`lastmod` for static pages: today's date (`2026-10-11` or the day you run this) for every page whose copy changes in this branch, which is all of them. Guides use `modifiedAt` from `articlesMeta`. Categories use the same date as the static pages. Never use the build date at runtime; the date lives in the registry.

`siteFacts.ts`:

```ts
import { TELEGRAM_CHANNEL_URL } from '../lib/threatIntel/officialLinks';

/** Flip to true in the same commit that confirms NEWSLETTER_POSTAL_ADDRESS is set in production. */
export const NEWSLETTERS_LIVE = false;
/** From index.html twitter:site and the quiz share text. Set to null if the account is not Digibastion's. */
export const X_HANDLE: string | null = 'digibastion';
export const GITHUB_REPO_URL = 'https://github.com/Raiders0786/digibastion';
export const GITHUB_ROADMAP_URL = `${GITHUB_REPO_URL}/blob/main/docs/ROADMAP.md`;

export const SITE_DEFINITION =
  'Digibastion is a free Web3 security site. It tracks crypto hacks, exploits and phishing from QuillMonitor and other public trackers, ' +
  'links every record to its source, and sends alerts by email and on Telegram. It also has security checklists, a two-minute OpSec ' +
  'self-check and practical guides. Teams that need more can hire Digibastion for OpSec consulting or a full-stack security review, ' +
  'or try Vantage (beta) to check their domain\'s security.';
```

Check `officialLinks.ts` imports nothing via `@/` before importing it here (it currently has no imports). `faqEntries({ newslettersLive = NEWSLETTERS_LIVE })` returns these entries in this order. Before writing answer 3, confirm the RSS publisher names with `rtk proxy grep -rniE "thehackernews|bleepingcomputer|cisa" supabase/migrations | head` and name only publishers that appear.

| id | Question | Answer |
|---|---|---|
| `what-is-digibastion` | What is Digibastion? | `SITE_DEFINITION` |
| `what-is-threat-intel` | What is Digibastion Threat Intel? | A free feed of crypto and Web3 security incidents (hacks, exploits, phishing, supply-chain attacks) and security news. Each incident has one record, even when several trackers report it, and every record names and links its source. |
| `sources` | Where do the incidents come from? | QuillMonitor, checked every 30 minutes; Web3 Is Going Just Great, every 6 hours; and security news sites such as The Hacker News, BleepingComputer and CISA, every hour. The methodology page lists every source. |
| `verification` | Does Digibastion verify incidents? | No. Digibastion shows the status the source gives. QuillMonitor marks incidents confirmed or unconfirmed; the other sources do not publish a status. |
| `alerts` | How do I get alerts? | Live: Join @digibastion on Telegram for new incidents from QuillMonitor, or subscribe by email for real-time alerts on critical and high incidents (checked every 30 minutes), a daily brief or a weekly deep-dive. All are free. Not live: Join @digibastion on Telegram for new Web3 incidents from QuillMonitor, or subscribe by email for alerts on critical and high incidents, checked every 30 minutes. The daily brief and weekly deep-dive emails start soon; the weekly report is already published on the site every Monday. |
| `severity` | How is severity set? | Mostly by reported loss: $50M or more is critical and $10M or more is high. Private-key compromise, access-control flaws, oracle manipulation, reentrancy and flash-loan attacks are rated high even when no loss is disclosed. Any other disclosed loss is medium, and the rest are low. Security news uses the publisher's own rating. |
| `duplicates` | What happens when two trackers report the same hack? | Digibastion keeps one record and lists both sources. It merges only on a strong match: the same project name on the same day, or within two days plus one more matching fact such as the loss. It never merges records just because the names look alike, because a wrong merge would hide a real incident. |
| `free` | Is it free? | Yes. The feed, alerts, checklists, self-check and guides are free and need no account. OpSec consulting and security reviews are paid. |
| `self-check` | What is the OpSec self-check? | Eight questions drawn from 20 real scenarios. It takes about two minutes, shows where your habits are weak and what to fix first, and needs no wallet or account. |
| `corrections` | How do I report a mistake? | Email support@digibastion.com with the record's link, or open an issue on GitHub. The methodology page explains how corrections work. |

`THREAT_INTEL_FAQ_IDS = ['what-is-threat-intel', 'sources', 'verification', 'alerts', 'severity', 'duplicates']`.

- [ ] **Step 1: Write the failing test** `src/seo/__tests__/routeMeta.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { articlesMeta } from '@/data/articlesData';
import { initialSecurityData } from '@/data/securityData';
import { toolCategories } from '@/data/tools/categories';
import { categoryRouteMeta, guideRouteMeta, NOINDEX_PATHS, SITE_FALLBACK_META, STATIC_ROUTES, toolsRouteMeta } from '../routeMeta';
import { faqEntries } from '../siteFacts';

const appRoutes = [...readFileSync(resolve(process.cwd(), 'src/App.tsx'), 'utf8').matchAll(/<Route path="([^"]+)"/g)].map((m) => m[1]);

describe('route registry', () => {
  it('covers every static route in App.tsx or marks it noindex', () => {
    for (const path of appRoutes.filter((p) => !p.includes(':') && p !== '*')) {
      expect(path in STATIC_ROUTES || NOINDEX_PATHS.includes(path) || path === '/tools', path).toBe(true);
    }
  });
  it('keeps titles within 70 and descriptions within 160 characters', () => {
    const all = [...Object.values(STATIC_ROUTES), toolsRouteMeta(27),
      ...initialSecurityData.map(categoryRouteMeta), ...articlesMeta.map((a) => guideRouteMeta(a))];
    for (const meta of all) {
      expect(meta.title.length, meta.title).toBeLessThanOrEqual(70);
      expect(meta.description.length, meta.path).toBeLessThanOrEqual(160);
      expect(meta.description.length, meta.path).toBeGreaterThanOrEqual(50);
      expect(meta.canonical).toBe(`https://www.digibastion.com${meta.path === '/' ? '/' : meta.path}`);
      expect(meta.title).not.toMatch(/DigiBastion|Security Security|real-time/i);
    }
  });
  it('gives the fallback shell no canonical', () => {
    expect(SITE_FALLBACK_META.canonical).toBeNull();
  });
  it('derives the tools count from data', () => {
    const count = toolCategories.reduce((n, c) => n + c.tools.length, 0);
    expect(toolsRouteMeta(count).description.startsWith(`${count} Web3 security tools`)).toBe(true);
  });
  it('never promises newsletters before they send', () => {
    expect(faqEntries({ newslettersLive: false }).find((e) => e.id === 'alerts')!.answer).toMatch(/start soon/);
    expect(JSON.stringify(faqEntries())).not.toMatch(/verified by digibastion|high and critical incidents on telegram/i);
  });
});
```

If `ToolCategory` names its list something other than `tools`, use the real field.

- [ ] **Step 2: Run it; it fails.**
- [ ] **Step 3: Implement the three files.** Each static entry's `body` holds the H1 the page shows today, the description as `intro` (or `SITE_DEFINITION` for `/` and `/about`), and `links` to its natural neighbours: `/threat-intel` links methodology, weekly archive, FAQ and Telegram; guides link `/articles` and three guides from the same category; categories link `/` and the other ten checklists. Every body ends with the shared site links: Threat Intel, Weekly reports, Guides, Checklists (`/category/opsec`), OpSec self-check, FAQ, About, Telegram alerts. `jsonLd` uses the builders added in S2.3; until then use `[]` and let S2.3 fill them in.
- [ ] **Step 4: Run it; it passes.**
- [ ] **Step 5: Commit.** `git commit -m "feat(seo): add one route metadata registry and site facts"`

### Task S2.2: Incident meta, the answer line and honest incident schema

**Files:** `src/seo/incidentMeta.ts`, `src/seo/__tests__/incidentMeta.test.ts`, `src/utils/seo.ts`, `src/utils/__tests__/seo.test.ts`, `src/components/news/NewsDetail.tsx`, `src/components/news/__tests__/NewsDetail.test.tsx`.

Rules:
- `incidentSeoInputFromArticle(a)` builds a `NewsletterSourceRow` from the `NewsArticle` (`uid: a.id`, `created_at: (a.createdAt ?? a.publishedAt).toISOString()`, `link: a.link ?? null`, `source_name: a.sourceName ?? null`, the rest field by field) and runs `toNewsletterItem(row, SITE_URL)` from `_shared/newsletter-content.ts`, so the SPA, prerender and Worker read metadata exactly as the emails do.
- `incidentRouteMeta(i)`: title `${truncateAtWord(i.title, 56)} | Digibastion` (`truncateAtWord` from `_shared/summary-text.ts`). Description: `buildIncidentAnswer(i)` for Web3 incidents; otherwise the summary when `isUsableSummary`; otherwise `${i.title}. Source: ${sourceLabelFor(i)}.`; truncated at a word to 160. `robots`: `index` for Web3 incidents, `noindex,follow` otherwise. `type: 'article'`, `publishedTime: i.createdAt`. Body: breadcrumbs Home > Threat Intel, h1 title, intro the answer sentence, items (Severity, Reported loss, Chain, Attack type, Source and status, each only when present), links to the source (`sourceLinkFor`), methodology, the feed and the weekly archive.
- `isUsableSummary(s)`: trimmed length at least 40 and not matching `/^(summary pending|pending|no summary)/i`.
- `buildNewsArticleSchema` changes: `datePublished` from `createdAt` (not the incident date); `dateModified` when given; `author` is `{ '@type': 'Organization', name: <source label> }` and **never** the Digibastion publisher node (omit `author` if there is no label); `isBasedOn` and `citation` list every `metadata.sources[].url` plus `sourceUrl`, deduplicated, http(s) only; `about` lists `projectName` and `chain` as `Thing` nodes when present. Keep `publisher` as Digibastion. Extend `SeoNewsArticle` with `createdAt: string`, `modifiedAt?: string`, `sourceLabel?: string`, `citations?: string[]`, `about?: string[]`.
- `NewsDetail.tsx`: change the "Summary" and "Full Report" headings from `h3` to `h2` with ids `what-happened` and `details`, add `id="source"` to the source block's heading, and for Web3 incidents render `<p data-testid="incident-answer">{buildIncidentAnswer(...)}</p>` directly under the `h1`.

- [ ] **Step 1: Write failing tests.** In `incidentMeta.test.ts`: a QuillMonitor fixture produces the exact answer sentence as description, `robots: 'index'`, a title of at most 70 characters; an RSS fixture gets `noindex,follow`; a summary of "Summary pending" is never the description; a 200-character title is truncated at a word. In `seo.test.ts`: a 2012 incident stored on 2026-09-29 gets `datePublished` starting with `2026-09-29`; an RSS record's `author.name` is its publisher; a record with no source has no `author`; `JSON.stringify(schema)` never contains `"author":{"@type":"Organization","@id":"https://www.digibastion.com/#organization"`. In `NewsDetail.test.tsx`: the answer line renders for a Web3 incident and not for a news item, and `#what-happened` is an `h2`.
- [ ] **Step 2: Run them; they fail.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run them, plus the existing `src/pages/__tests__/News.*.test.tsx`; all pass.**
- [ ] **Step 5: Commit.** `git commit -m "feat(seo): honest incident schema, answer-first summaries and stable headings"`

### Task S2.3: Schema builders and wiring every page to the registry

**Files:** `src/utils/seo.ts`, `src/utils/__tests__/seo.test.ts`, `src/components/MetaTags.tsx`, `src/components/__tests__/MetaTags.test.tsx`, `src/lib/threatIntel/weekly.ts`, `src/utils/__tests__/weekly.test.ts`, `src/App.tsx`, `src/pages/Faq.tsx`, `src/pages/WeeklyArchive.tsx`, the page list above, `src/seo/routeMeta.ts` (fill `jsonLd`).

- [ ] **Step 1: Write failing tests.**
  - `seo.test.ts`: `buildWeeklySchema` returns `@type: 'Report'`, `datePublished` = `generatedAt`, `temporalCoverage` = `${weekStart}/${weekEnd}`, `mainEntity.itemListElement` URLs equal the canonical incident URLs with no `utm_`; `buildFaqSchema` emits one `Question` per entry whose `acceptedAnswer.text` equals the visible answer; `buildChecklistSchema` is an `ItemList` (not `HowTo`).
  - `MetaTags.test.tsx` (jsdom, render inside `MemoryRouter initialEntries={['/threat-intel/abc?utm_source=telegram']}`): the canonical is `https://www.digibastion.com/threat-intel/abc`; with a `<link rel="canonical">` already in `document.head`, there is still exactly one afterwards; `robots="noindex,follow"` writes `noindex, follow`.
  - `weekly.test.ts`: `weeklySeoTitle(c)` gives `Web3 hacks, week of Oct 5, 2026: ~$18.4M across 7 incidents` for the fixture values (adjust the expected numbers to the fixture) and `Web3 hacks and exploits, week of Oct 5, 2026` when the loss is zero, both at most 70 characters; `parseWeeklyArchiveResponse` keeps only items with a valid Monday `week_start` and coerces counts.
- [ ] **Step 2: Run them; they fail.**
- [ ] **Step 3: Implement.**
  - `MetaTags.tsx`: defaults come from `SITE_FALLBACK_META`; add `robots?: RobotsDirective`; build the canonical with `canonicalizeUrl(canonical ?? path)` from `_shared/site-urls`; keep the update-in-place logic.
  - `weekly.ts`: add `weeklySeoTitle(c)` and `parseWeeklyArchiveResponse(value)` returning `{ weekStart: string; weekEnd: string | null; generatedAt: string | null; incidentCount: number; lossUsd: number }[]`.
  - `WeeklyArchive.tsx` at `/threat-intel/weekly`: calls `supabase.rpc('list_weekly_newsletters' as never, { p_limit: 52 } as never)` (types.ts is regenerated by Lovable later; do not edit it), lists issues newest first as real `<Link>`s with "N incidents, ~$X reported", renders `CollectionPage` + `ItemList` + `BreadcrumbList` JSON-LD. Empty state: "The first weekly report is published on Monday." Error state keeps `robots` at `index` (a transient error must not deindex the page).
  - `Faq.tsx` at `/faq`: renders `faqEntries()` as `<h2 id={entry.id}>` question plus `<p>` answer, links as `<Link>`, and `buildFaqSchema` JSON-LD. Uses `Navbar` and `Footer` like `About.tsx`.
  - `App.tsx`: add both lazy routes; declare `/threat-intel/weekly` before `/threat-intel/weekly/:weekStart` and before `/threat-intel/:articleId`. Give admin routes `<MetaTags robots="noindex,nofollow" title="Admin | Digibastion" />`.
  - Pages: replace inline title and description props with `{...toMetaTagsProps(staticRouteMeta('/about'))}` (or the matching builder) and render `meta.jsonLd` with `serializeJsonLd`. `Index.tsx`: also point the roadmap button at `GITHUB_ROADMAP_URL`. `News.tsx`: detail view uses `incidentRouteMeta(incidentSeoInputFromArticle(selectedArticle))`, list view `staticRouteMeta('/threat-intel')` plus an `ItemList` of the loaded cards. `WeeklyNewsletter.tsx`: `weeklyRouteMeta`; set `noindex` **only** for `not-found`, not for `error`. `CategoryDetail.tsx`: `categoryRouteMeta` plus `buildChecklistSchema`. `Tools.tsx`: `toolsRouteMeta(count)`. `ThreatIntelMethodology.tsx`: `WebPage` + `BreadcrumbList` + `buildFaqSchema` over the questions the page already answers, with text matching the visible text. `About.tsx`: change its second `Organization` to an `AboutPage` whose `about` is `{ '@id': 'https://www.digibastion.com/#organization' }`.
- [ ] **Step 4: Run all touched tests, `npx tsc --noEmit -p tsconfig.app.json` and `npx eslint` on touched files.**
- [ ] **Step 5: Commit.** `git commit -m "feat(seo): read page metadata from the registry and add FAQ and weekly archive pages"`

### Task S2.4: Prerender renderers

**Files:** `src/seo/prerender.ts`, `src/seo/htmlText.ts`, `src/seo/__tests__/prerender.test.ts`, `src/seo/__tests__/htmlText.test.ts`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { injectIntoTemplate, outputPathsFor, renderBody, renderHead } from '../prerender';
import { SITE_FALLBACK_META, staticRouteMeta } from '../routeMeta';

const TEMPLATE = '<html><head><meta charset="UTF-8" /><!--seo:head--><title>x</title><!--/seo:head--></head><body><div id="root"><!--seo:body--></div></body></html>';

describe('prerender', () => {
  it('renders exactly one canonical and escapes values', () => {
    const head = renderHead({ ...staticRouteMeta('/about'), title: 'A "quoted" <title> & more' });
    expect(head.match(/rel="canonical"/g)).toHaveLength(1);
    expect(head).toContain('<title>A &quot;quoted&quot; &lt;title&gt; &amp; more</title>');
    expect(head).toContain('<script type="application/ld+json" data-prerender>');
  });
  it('gives the fallback no canonical, og:url or twitter:url', () => {
    const head = renderHead(SITE_FALLBACK_META);
    expect(head).not.toMatch(/rel="canonical"|og:url|twitter:url/);
  });
  it('escapes JSON-LD so a title cannot close the script tag', () => {
    const head = renderHead({ ...staticRouteMeta('/about'), jsonLd: [{ name: '</script><script>alert(1)</script>' }] });
    expect(head).not.toContain('</script><script>');
  });
  it('renders crawlable links and keeps trusted guide HTML', () => {
    const body = renderBody({ breadcrumbs: [{ href: '/', label: 'Home' }], h1: 'T & U', intro: 'Intro', links: [{ href: '/faq', label: 'FAQ' }], html: '<p>Guide</p>' });
    expect(body).toContain('<a href="/faq">FAQ</a>');
    expect(body).toContain('<h1>T &amp; U</h1>');
    expect(body).toContain('<p>Guide</p>');
  });
  it('injects between markers and throws without them', () => {
    const html = injectIntoTemplate(TEMPLATE, '<title>New</title>', '<p>Body</p>');
    expect(html).toContain('<title>New</title>');
    expect(html).not.toContain('<title>x</title>');
    expect(html).toContain('<div id="root"><p>Body</p></div>');
    expect(() => injectIntoTemplate('<html></html>', '', '')).toThrow(/marker/);
  });
  it('maps paths to files and refuses traversal', () => {
    expect(outputPathsFor('/threat-intel/abc', 'file')).toEqual(['threat-intel/abc.html']);
    expect(outputPathsFor('/threat-intel/abc', 'both')).toEqual(['threat-intel/abc.html', 'threat-intel/abc/index.html']);
    expect(outputPathsFor('/', 'both')).toEqual([]);
    expect(() => outputPathsFor('/threat-intel/../../etc', 'file')).toThrow();
    expect(() => outputPathsFor('/a b', 'file')).toThrow();
  });
});
```

`htmlText.test.ts`: `htmlToText('<h2>Step</h2><p>A &amp; B</p><ul><li>One</li></ul>')` returns `'## Step\n\nA & B\n\n- One'`; script and style content is dropped; numeric entities decode.

- [ ] **Step 2: Run them; they fail.**
- [ ] **Step 3: Implement.** `escapeHtml` is `escapeXml` from `_shared/xml.ts`. JSON-LD goes through the same escaping as `src/utils/jsonLd.ts` `serializeJsonLd`; copy its replacements into `prerender.ts` rather than importing it if it uses an `@/` import. `outputPathsFor` accepts only paths matching `/^\/[A-Za-z0-9/_-]*$/` with no empty segment and no `..`. `renderBody` wraps everything in `<div class="max-w-3xl mx-auto px-4 pt-28 pb-16 text-muted-foreground" data-prerender-body>` with a breadcrumb `<nav aria-label="Breadcrumb">`, `<h1>`, intro `<p>`, optional `<ul>`, optional `<article>` with the trusted HTML, and `<nav aria-label="Related">` with the links.
- [ ] **Step 4: Run them; they pass.**
- [ ] **Step 5: Commit.** `git commit -m "feat(seo): add pure prerender head and body renderers"`

### Task S2.5: Dynamic data fetch that fails soft

**Files:** `src/seo/fetchDynamic.ts`, `src/seo/__tests__/fetchDynamic.test.ts`, `src/integrations/supabase/publicDefaults.ts`, `src/integrations/supabase/publicConfig.ts`.

- [ ] **Step 1: Move the defaults.** Create `publicDefaults.ts` exporting `DEFAULT_SUPABASE_URL` and `DEFAULT_SUPABASE_PUBLISHABLE_KEY` (moved verbatim from `publicConfig.ts`, with its comment). `publicConfig.ts` imports them. No other change.

- [ ] **Step 2: Write the failing test**

```ts
import { describe, expect, it, vi } from 'vitest';
import { fetchDynamic } from '../fetchDynamic';

const log = { warn: vi.fn(), info: vi.fn() };
const opts = { baseUrl: 'https://x.supabase.co', anonKey: 'anon', incidentLimit: 500, weeklyLimit: 26, timeoutMs: 50, log };

describe('fetchDynamic', () => {
  it('returns nothing and warns once when fetch throws', async () => {
    const result = await fetchDynamic({ ...opts, fetchImpl: () => Promise.reject(new Error('offline')) });
    expect(result).toEqual({ incidents: [], weekly: [] });
    expect(log.warn).toHaveBeenCalledTimes(1);
  });
  it('gives up on a hanging server within the timeout', async () => {
    const hang = (_: unknown, init?: RequestInit) => new Promise<Response>((_, reject) =>
      init?.signal?.addEventListener('abort', () => reject(new Error('aborted'))));
    const started = Date.now();
    await fetchDynamic({ ...opts, fetchImpl: hang as typeof fetch });
    expect(Date.now() - started).toBeLessThan(1_000);
  });
  it('drops merged and non-incident rows even if the server returns them', async () => {
    const rows = [
      { id: 'good', title: 'A', summary: 's', content: '', category: 'defi-exploits', severity: 'high', tags: [], link: null, source_name: 'QuillMonitor', published_at: '2026-10-01T00:00:00Z', created_at: '2026-10-01T00:00:00Z', metadata: { provider: 'quillmonitor', is_web3_incident: true } },
      { id: 'dupe', title: 'B', summary: 's', content: '', category: 'defi-exploits', severity: 'high', tags: [], link: null, source_name: 'QuillMonitor', published_at: '2026-10-01T00:00:00Z', created_at: '2026-10-01T00:00:00Z', metadata: { provider: 'quillmonitor', is_web3_incident: true, duplicate_of_uid: 'qm:9' } },
      { id: '../x', title: 'C', summary: 's', content: '', category: 'defi-exploits', severity: 'high', tags: [], link: null, source_name: 'QuillMonitor', published_at: '2026-10-01T00:00:00Z', created_at: '2026-10-01T00:00:00Z', metadata: { provider: 'quillmonitor', is_web3_incident: true } },
    ];
    const fetchImpl = vi.fn(async (url: string) => new Response(JSON.stringify(url.includes('/rest/v1/news_articles') ? rows : []), { status: 200 }));
    const result = await fetchDynamic({ ...opts, fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(result.incidents.map((i) => i.id)).toEqual(['good']);
    expect(String(fetchImpl.mock.calls[0][0])).toContain(encodeURIComponent('metadata->>duplicate_of_uid.is.null'));
  });
});
```

- [ ] **Step 3: Run it; it fails.**
- [ ] **Step 4: Implement.** Requests: `GET ${baseUrl}/rest/v1/news_articles?select=${NEWS_ARTICLE_COLUMNS}&or=(${INDEXABLE_INCIDENT_POSTGREST_FILTER})&order=created_at.desc&limit=${incidentLimit}` with `apikey` and `Authorization: Bearer <anon>` headers; `POST ${baseUrl}/rest/v1/rpc/list_weekly_newsletters` `{ p_limit }`; then `POST .../rpc/get_weekly_newsletter` `{ p_week_start }` for each, four at a time. Each call has `AbortSignal.timeout(timeoutMs)`; a 404 from `list_weekly_newsletters` (migration not yet applied) falls back to no weekly pages. `fetchDynamic.ts` is outside the module boundary rule: only the prerender loads it, through `ssrLoadModule`, which resolves `@/`. So it imports `mapPublishableNewsArticleRows` and `NEWS_ARTICLE_COLUMNS` from `@/lib/threatIntel/articleRow`, maps the rows with them, and then keeps only rows that pass `isIndexableIncidentMetadata` and `SAFE_ARTICLE_ID`. Any thrown error: one `log.warn('[seo] dynamic pages skipped: <message>')` and return what was collected so far. Never throw.
- [ ] **Step 5: Run it; it passes.**
- [ ] **Step 6: Commit.** `git commit -m "feat(seo): fetch prerender data with timeouts and publishability guards"`

### Task S2.6: Vite plugin, template markers and the build

**Files:** `scripts/seo/prerenderPlugin.ts`, `scripts/seo/prerenderCore.ts`, `scripts/seo/ssrEntry.ts`, `index.html`, `vite.config.ts`, `src/main.tsx`, `src/seo/__tests__/mainEntry.test.ts`, `public/__prerender-check.html`, `public/__prerender-check/index.html`, `package.json`.

- [ ] **Step 1: Write the failing test** `mainEntry.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const main = readFileSync(resolve(process.cwd(), 'src/main.tsx'), 'utf8');
const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');

describe('entry and template', () => {
  it('replaces the prerendered body instead of hydrating it', () => {
    expect(main).toContain('createRoot(');
    expect(main).not.toContain('hydrateRoot');
  });
  it('removes prerendered JSON-LD before React renders', () => {
    expect(main.indexOf("script[data-prerender]")).toBeGreaterThan(-1);
    expect(main.indexOf("script[data-prerender]")).toBeLessThan(main.indexOf('.render('));
  });
  it('has markers and no homepage canonical in the shell', () => {
    expect(html).toContain('<!--seo:head-->');
    expect(html).toContain('<!--/seo:head-->');
    expect(html).toContain('<div id="root"><!--seo:body--></div>');
    expect(html).not.toMatch(/rel="canonical"|property="og:url"|name="twitter:url"/);
    expect(html).toContain('type="application/rss+xml"');
  });
});
```

- [ ] **Step 2: Run it; it fails.**
- [ ] **Step 3: `index.html`.** Delete the canonical link, `og:url`, `twitter:url`, `meta name="title"`, `meta keywords`, `meta googlebot`, and the whole `SoftwareApplication` JSON-LD block. Wrap title, description, robots, all remaining `og:` tags except `og:site_name` and `og:locale`, and the `twitter:` title, description, image and image alt in `<!--seo:head-->` and `<!--/seo:head-->`, with the values from `SITE_FALLBACK_META`. Change the root to `<div id="root"><!--seo:body--></div>`. Add `"logo": "https://www.digibastion.com/favicon-512x512.png"` to the Organization JSON-LD. Add, outside the markers:

```html
<link rel="alternate" type="application/rss+xml" title="Digibastion Threat Intel (RSS)" href="https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/threat-intel-feed?format=rss" />
<link rel="alternate" type="application/atom+xml" title="Digibastion Threat Intel (Atom)" href="https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/threat-intel-feed?format=atom" />
<link rel="alternate" type="application/feed+json" title="Digibastion Threat Intel (JSON Feed)" href="https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/threat-intel-feed?format=json" />
```

- [ ] **Step 4: `src/main.tsx`.** Before `createRoot`, add `document.querySelectorAll('script[data-prerender]').forEach((node) => node.remove());`. Leave everything else.

- [ ] **Step 5: The plugin.** `scripts/seo/prerenderPlugin.ts`:

```ts
import path from 'node:path';
import type { Plugin } from 'vite';
import { runPrerender } from './prerenderCore';

export function seoPrerender(): Plugin {
  let root = process.cwd();
  let outDir = path.resolve(root, 'dist');
  return {
    name: 'digibastion-seo-prerender',
    apply: 'build',
    configResolved(config) {
      root = config.root;
      outDir = path.resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      if (process.env.PRERENDER === '0') return;
      try {
        const summary = await runPrerender({ root, outDir, env: process.env, fetchImpl: fetch, log: console });
        console.log(`[seo] prerendered ${summary.staticPages} static, ${summary.incidents} incident, ${summary.weekly} weekly pages (${summary.layout})`);
      } catch (error) {
        if (process.env.PRERENDER_STRICT === '1') throw error;
        console.warn(`[seo] prerender skipped: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
  };
}
```

`scripts/seo/prerenderCore.ts` `runPrerender({ root, outDir, env, fetchImpl, log })`:
1. Read `dist/index.html`; if it is missing or has no markers, warn and return zero counts.
2. `const server = await createServer({ configFile: false, root, logLevel: 'error', resolve: { alias: { '@': path.resolve(root, 'src') } }, appType: 'custom', server: { middlewareMode: true, hmr: false, ws: false }, optimizeDeps: { noDiscovery: true, include: [] } })`. `configFile: false` keeps this plugin from recursing.
3. `const entry = await server.ssrLoadModule('/scripts/seo/ssrEntry.ts')`. `ssrEntry.ts` re-exports `articlesMeta`, `initialSecurityData`, `toolCategories`, `getArticleContent`, everything from `src/seo/routeMeta`, `src/seo/incidentMeta`, `src/seo/prerender`, `src/seo/fetchDynamic`, `src/seo/siteFacts`.
4. Load React through Node, not Vite (`ssrLoadModule` of `react-dom/server` fails with "require is not defined"): `const require = createRequire(path.join(root, 'package.json')); const React = require('react'); const { renderToStaticMarkup } = require('react-dom/server'); const { MemoryRouter } = require('react-router-dom');`. Render each guide body with `renderToStaticMarkup(React.createElement(MemoryRouter, null, entry.getArticleContent(slug)))` inside a try/catch per guide (one bad guide skips its body, not the build).
5. Pages: all `STATIC_ROUTES` except `/`, the 11 categories, all guides with bodies, `/faq`, `/threat-intel/weekly`, and, unless `env.PRERENDER_DYNAMIC === '0'`, the result of `fetchDynamic({ baseUrl: env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL, anonKey: env.VITE_SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_PUBLISHABLE_KEY, incidentLimit: Number(env.PRERENDER_INCIDENT_LIMIT) || 500, weeklyLimit: 26, timeoutMs: 8_000, fetchImpl, log })` mapped through `incidentRouteMeta` and `weeklyRouteMeta`. Wrap the dynamic step in an overall 30-second deadline.
6. Write each page to `outputPathsFor(meta.path, layout)` where `layout = env.PRERENDER_LAYOUT ?? 'file'`, creating directories as needed.
7. Rewrite `dist/index.html` itself with `injectIntoTemplate(template, renderHead(SITE_FALLBACK_META), renderBody(SITE_FALLBACK_META.body))`: the neutral shell for `/`, unknown routes and incidents newer than the build.
8. `await server.close()` in a `finally`.

- [ ] **Step 6: `vite.config.ts`.** Import `seoPrerender` and add it to `plugins` after `react()`. Change the visualizer to `process.env.ANALYZE === '1' && visualizer({ filename: 'stats.html', ... })` so it writes outside `dist` and only on request. `tsconfig.node.json` is strict and follows the import, so `scripts/seo/prerenderPlugin.ts` and `prerenderCore.ts` must type-check strictly: run `npx tsc --noEmit -p tsconfig.node.json`.

- [ ] **Step 7: Canary files.** `public/__prerender-check.html`: a minimal HTML page with `<meta name="robots" content="noindex">` and body text `prerender-file-ok`. `public/__prerender-check/index.html`: same with `prerender-dir-ok`.

- [ ] **Step 8: `package.json`.** Change `"typecheck"` to `"tsc --noEmit -p tsconfig.app.json && tsc --noEmit -p tsconfig.node.json"` (the root tsconfig has `files: []` and checked nothing). Add `"seo:generate": "node scripts/seo/generate.mjs"` (S2.7 creates the script).

- [ ] **Step 9: Build three ways and inspect.**

```bash
cd /Users/chirag/Documents/digibastion_web-seo
PRERENDER_DYNAMIC=0 node node_modules/vite/bin/vite.js build 2>&1 | tail -5
VITE_SUPABASE_URL=http://127.0.0.1:9 node node_modules/vite/bin/vite.js build 2>&1 | grep '\[seo\]'   # warns, still exits 0
node node_modules/vite/bin/vite.js build 2>&1 | grep '\[seo\]'                                       # online: incident and weekly counts > 0
ls dist/articles | head; test ! -f dist/stats.html && echo "no stats.html"
grep -c 'rel="canonical"' dist/index.html                       # 0
grep -o '<title>[^<]*' dist/threat-intel/methodology.html       # the methodology title
grep -c 'rel="canonical"' dist/about.html                       # 1
```

Each build must exit 0. If the Lovable build image blocks network, the second command is what it sees.

- [ ] **Step 10: Run `rtk proxy npx vitest run src/seo`; it passes.**
- [ ] **Step 11: Commit.** `git commit -m "feat(seo): prerender per-route HTML inside vite build"`

### Task S2.7: Generated sitemap, llms.txt and llms-full.txt

**Files:** `src/seo/staticFiles.ts`, `scripts/seo/generate.mjs`, `src/seo/__tests__/generatedFilesInSync.test.ts`, `public/sitemap.xml`, `public/sitemap-index.xml`, `public/llms.txt`, `public/llms-full.txt`.

`staticFiles.ts` exports, all pure and taking `deps = { articles, categories, toolCount, guideHtml: (slug) => string | null }`:
- `buildStaticSitemapXml(deps)`: every `STATIC_ROUTES` path (including `/`, `/faq`, `/threat-intel/weekly`), every category and guide, with `lastmod` from the registry or `modifiedAt`. Uses `renderUrlset` from `_shared/sitemap-render.ts`.
- `buildSitemapIndexXml(deps)`: one entry, `https://www.digibastion.com/sitemap.xml`, `lastmod` = the newest lastmod in it.
- `buildLlmsTxt(deps)`: `# Digibastion`, then `> ` + `SITE_DEFINITION`, then a line that incidents are relayed from named sources and never verified by Digibastion; sections **Threat intelligence** (feed, methodology, weekly archive, FAQ, the three feed URLs, `https://t.me/digibastion`, email alerts via `/threat-intel?tab=subscribe`, and one line each on severity and dedup rules taken from the FAQ answers), **Guides** (all of them, grouped by category, absolute URLs, one-line description), **Checklists** (all 11 with item counts), **Tools and services** (tools, links, services and both service pages, Vantage `https://vantage.digibastion.com` (beta)), **About** (about, license, GitHub repo, `GITHUB_ROADMAP_URL`). No `/news`, no "vetted", no "Satoshi-level", no "HMAC", no "July 2024 onward", no "Top 100" (the leaderboard shows 50). Mention the daily brief and weekly email only when `NEWSLETTERS_LIVE`.
- `buildLlmsFullTxt(deps)`: the FAQ in full; then each guide as `## <title>`, URL, summary, key takeaways, sources and `htmlToText(guideHtml(slug))`; then each checklist with item titles and descriptions. No live incidents (they go stale); point to the feeds instead.

`scripts/seo/generate.mjs` starts a Vite server exactly as in S2.6 step 5, loads `scripts/seo/ssrEntry.ts` (add the `staticFiles` exports to it), renders guide HTML the same way, and writes the four files into `public/`.

- [ ] **Step 1: Write the failing drift test**

```ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { getArticleContent } from '@/data/articleContent';
import { articlesMeta } from '@/data/articlesData';
import { initialSecurityData } from '@/data/securityData';
import { toolCategories } from '@/data/tools/categories';
import { buildLlmsFullTxt, buildLlmsTxt, buildSitemapIndexXml, buildStaticSitemapXml } from '../staticFiles';

const deps = {
  articles: articlesMeta,
  categories: initialSecurityData,
  toolCount: toolCategories.reduce((n, c) => n + c.tools.length, 0),
  guideHtml: (slug: string) => {
    const node = getArticleContent(slug);
    return node ? renderToStaticMarkup(createElement(MemoryRouter, null, node)) : null;
  },
};
const read = (name: string) => readFileSync(resolve(process.cwd(), 'public', name), 'utf8');

describe('generated SEO files match the committed copies (run npm run seo:generate)', () => {
  it('sitemap.xml', () => expect(read('sitemap.xml')).toBe(buildStaticSitemapXml(deps)));
  it('sitemap-index.xml', () => expect(read('sitemap-index.xml')).toBe(buildSitemapIndexXml(deps)));
  it('llms.txt', () => expect(read('llms.txt')).toBe(buildLlmsTxt(deps)));
  it('llms-full.txt', () => expect(read('llms-full.txt')).toBe(buildLlmsFullTxt(deps)));
  it('llms.txt uses absolute URLs only', () => {
    expect(read('llms.txt')).not.toMatch(/\]\(\//);
  });
});
```

If this file needs jsdom for the guide components, add `// @vitest-environment jsdom` at the top.

- [ ] **Step 2: Run it; it fails.**
- [ ] **Step 3: Implement `staticFiles.ts` and `generate.mjs`, run `npm run seo:generate`, and read the four outputs** (check the guide count is 71, the checklist count 11, and no relative links).
- [ ] **Step 4: Run the drift test; it passes.**
- [ ] **Step 5: Commit.** `git commit -m "feat(seo): generate sitemap, llms.txt and llms-full.txt from the registry"`

### S2 verification

```bash
cd /Users/chirag/Documents/digibastion_web-seo
rtk proxy npx vitest run
npx tsc --noEmit -p tsconfig.app.json && npx tsc --noEmit -p tsconfig.node.json
npx eslint src/seo scripts/seo src/components/MetaTags.tsx src/pages/Faq.tsx src/pages/WeeklyArchive.tsx src/main.tsx vite.config.ts
VITE_SUPABASE_URL=http://127.0.0.1:9 node node_modules/vite/bin/vite.js build   # exits 0 offline
xmllint --noout public/sitemap.xml public/sitemap-index.xml
```

---

## S3. Distribution: links, shares and previews

**Goal:** Every link we send (Telegram, alert, daily, weekly and legacy digest emails, subscribe emails, share buttons) lands on our canonical page with consistent UTM tags, still names and links the original source, and credits QuillMonitor where required. Incident and weekly pages get a share bar and their own preview image.

**Files**
- Create: `supabase/functions/_shared/share-links.ts`, `share-links.test.ts`, `supabase/functions/_shared/og-card.ts`, `og-card.test.ts`, `src/components/share/ShareBar.tsx`, `src/components/share/__tests__/ShareBar.test.tsx`.
- Modify: `_shared/telegram-alerts.ts`, `supabase/functions/post-telegram-alerts/index.ts`, `_shared/alert-email.ts`, `_shared/alert-email.test.ts`, `_shared/newsletter-render.ts`, `_shared/newsletter-render.test.ts`, `_shared/weekly-render.ts`, `_shared/weekly-render.test.ts`, `_shared/subscription-optin.ts`, `_shared/subscription-optin.test.ts`, `_shared/subscription-delivery.ts` (only if the legacy digest source fallback lives there), `supabase/functions/send-critical-alerts/index.ts`, `send-newsletters/index.ts`, `build-daily-newsletter/index.ts`, `build-weekly-newsletter/index.ts`, `send-digest-emails/index.ts`, `submit-form/index.ts`, `request-management-link/index.ts`, `verify-email/index.ts`, `weekly-admin-summary/index.ts`, `threat-intel-api/index.ts`, `og-image/index.ts`, `_shared/security-actions.ts`, `src/utils/share.ts`, `src/utils/safeUrl.ts`, `src/utils/__tests__/safeUrl.test.ts`, `src/utils/__tests__/telegramAlerts.test.ts`, `src/components/news/NewsCard.tsx`, `src/pages/VerifyEmail.tsx`, `src/pages/__tests__/WeeklyNewsletter.test.tsx`.
- Append zones (owned by S2): `src/pages/News.tsx`, `src/components/news/NewsDetail.tsx`, `src/pages/WeeklyNewsletter.tsx`, `src/pages/ThreatIntelMethodology.tsx`, `src/seo/routeMeta.ts`, `src/seo/incidentMeta.ts` (image field only).

**Interfaces produced**

```ts
// _shared/share-links.ts
export type UtmSource = 'telegram' | 'email' | 'x' | 'linkedin' | 'reddit' | 'bluesky' | 'share';
export type UtmMedium = 'social' | 'email' | 'share';
export type UtmCampaign = 'incident_alerts' | 'weekly_deep_dive' | 'realtime_alert' | 'alert_followup' | 'daily_brief'
  | 'digest_daily' | 'digest_weekly' | 'subscribe_confirm' | 'share_incident' | 'share_weekly';
export interface Tracking { source: UtmSource; medium: UtmMedium; campaign: UtmCampaign; content?: string }
export function buildTrackedUrl(pathOrUrl: string, t?: Tracking, siteUrl?: string): string;
export function stripTracking(url: string): string;
export function shareTargets(i: { url: string; text: string; title?: string; via?: string | null }): { x: string; telegram: string; linkedin: string; reddit: string; bluesky: string };
export function shareTextForIncident(i: AnswerInput): string;      // <= 200 chars
export function shareTextForWeekly(c: WeeklyPublicContent): string;
export function incidentOgImageUrl(id: string): string;
export function weeklyOgImageUrl(weekStart: string): string;
```

### Task S3.1: share-links module

- [ ] **Step 1: Write the failing test** `share-links.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildTrackedUrl, shareTargets, shareTextForIncident, stripTracking, incidentOgImageUrl } from './share-links';

const tg = { source: 'telegram', medium: 'social', campaign: 'incident_alerts' } as const;

describe('buildTrackedUrl', () => {
  it('keeps the existing Telegram string byte for byte', () => {
    expect(buildTrackedUrl('/threat-intel/abc', tg))
      .toBe('https://www.digibastion.com/threat-intel/abc?utm_source=telegram&utm_medium=social&utm_campaign=incident_alerts');
  });
  it('only tags our own host', () => {
    expect(buildTrackedUrl('https://www.quillaudits.com/web3-hacks-database', tg)).toBe('https://www.quillaudits.com/web3-hacks-database');
    expect(buildTrackedUrl('https://revoke.cash', tg)).toBe('https://revoke.cash');
  });
  it('refuses token and account paths', () => {
    expect(buildTrackedUrl('/verify-email?token=abc', tg)).toBe('https://www.digibastion.com/verify-email?token=abc');
    expect(buildTrackedUrl('/manage-subscription', tg)).toBe('https://www.digibastion.com/manage-subscription');
    expect(buildTrackedUrl('/threat-intel?token=x', tg)).toBe('https://www.digibastion.com/threat-intel?token=x');
  });
  it('keeps other params and the hash, and replaces old tags', () => {
    expect(buildTrackedUrl('https://www.digibastion.com/threat-intel?scope=web3-incidents&utm_source=x#top', { ...tg, content: 'retraction' }))
      .toBe('https://www.digibastion.com/threat-intel?scope=web3-incidents&utm_source=telegram&utm_medium=social&utm_campaign=incident_alerts&utm_content=retraction#top');
  });
  it('handles a trailing-slash site URL', () => {
    expect(buildTrackedUrl('/a', tg, 'https://www.digibastion.com/')).toMatch(/^https:\/\/www\.digibastion\.com\/a\?/);
  });
  it('returns the URL untouched with no tracking', () => {
    expect(buildTrackedUrl('/threat-intel/abc')).toBe('https://www.digibastion.com/threat-intel/abc');
  });
});

describe('stripTracking', () => {
  it('drops utm_* and keeps the rest', () => {
    expect(stripTracking('https://www.digibastion.com/threat-intel?utm_source=telegram&scope=all#x')).toBe('https://www.digibastion.com/threat-intel?scope=all#x');
    expect(stripTracking('https://www.digibastion.com/a?utm_source=t')).toBe('https://www.digibastion.com/a');
  });
});

describe('shareTargets', () => {
  it('encodes text with &, #, emoji and non-Latin script', () => {
    const t = shareTargets({ url: 'https://www.digibastion.com/threat-intel/a?utm_source=x', text: 'A & B #1 🚨 攻撃', via: 'digibastion' });
    expect(t.x).toBe('https://x.com/intent/post?text=A%20%26%20B%20%231%20%F0%9F%9A%A8%20%E6%94%BB%E6%92%83&url=https%3A%2F%2Fwww.digibastion.com%2Fthreat-intel%2Fa%3Futm_source%3Dx&via=digibastion');
    expect(t.telegram.startsWith('https://t.me/share/url?url=')).toBe(true);
    expect(t.linkedin).toBe('https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fwww.digibastion.com%2Fthreat-intel%2Fa%3Futm_source%3Dx');
  });
  it('omits via when there is no handle', () => {
    expect(shareTargets({ url: 'https://www.digibastion.com/', text: 't', via: null }).x).not.toContain('via=');
  });
});

describe('shareTextForIncident', () => {
  const base = { title: 'Bridge exploit', projectName: 'Example Protocol', chain: 'Ethereum', attackType: 'Bridge exploit', amountUsd: 4_200_000, amountDisplay: '$4.2M', incidentDate: null, fundsReturned: null, sourceName: 'QuillMonitor', providers: ['quillmonitor'], status: 'confirmed' as const };
  it('confirmed', () => expect(shareTextForIncident(base)).toBe('Example Protocol bridge exploit on Ethereum: ~$4.2M reported lost. Confirmed by QuillMonitor.'));
  it('unconfirmed', () => expect(shareTextForIncident({ ...base, status: 'unconfirmed' })).toBe('Unconfirmed: Example Protocol bridge exploit on Ethereum, ~$4.2M reported lost (per QuillMonitor).'));
  it('no status, no loss', () => expect(shareTextForIncident({ ...base, status: null, amountUsd: null, amountDisplay: null, providers: [], sourceName: 'BleepingComputer' })).toBe('Example Protocol bridge exploit on Ethereum. Source: BleepingComputer.'));
  it('stays under 200 characters', () => expect(shareTextForIncident({ ...base, projectName: 'x'.repeat(300) }).length).toBeLessThanOrEqual(200));
});

it('builds og-image URLs on the functions host', () => {
  expect(incidentOgImageUrl('a/b')).toBe('https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/og-image?kind=incident&id=a%2Fb');
});
```

- [ ] **Step 2: Run it; it fails.**
- [ ] **Step 3: Implement.** Build query strings by hand with `encodeURIComponent` (no `URL`/`URLSearchParams`, so Deno, Node and browsers produce identical bytes). Tag order: source, medium, campaign, content. Token rule: refuse `/verify-email`, `/manage-subscription`, `/unsubscribe` (and anything under them) and any query containing `token=`. `shareTextForWeekly(c)`: `Web3 security, week of Oct 5: ~$12.3M reported lost across 9 incidents. Every item names its source.` (no loss: `Web3 security, week of Oct 5: N incidents. Every item names its source.`). Truncate with `truncateAtWord` from `summary-text.ts`.
- [ ] **Step 4: Run it; it passes.**
- [ ] **Step 5: Commit.** `git commit -m "feat(share): add shared UTM and share-intent helpers"`

### Task S3.2: Telegram posts

**Files:** `_shared/telegram-alerts.ts`, `post-telegram-alerts/index.ts`, `src/utils/__tests__/telegramAlerts.test.ts`.

- [ ] **Step 1: Update tests first.** The incident URL assertions stay byte-identical. Add: the incident message links the source name to `article.link` when it is an http(s) URL (`<a href="...">QuillMonitor</a>`), prints the name unlinked otherwise, and contains `Powered by <a href="https://www.quillaudits.com/web3-hacks-database">QuillMonitor</a>`; the footer says "Full details on Digibastion" (not "DigiBastion"); the retraction post links `/threat-intel?scope=web3-incidents&utm_source=telegram&utm_medium=social&utm_campaign=incident_alerts&utm_content=retraction`; the weekly link URL is unchanged. Add a test that a message with a 400-character summary and a long source URL stays under `TELEGRAM_MESSAGE_LIMIT`.
- [ ] **Step 2: Run; they fail.**
- [ ] **Step 3: Implement.** `buildIncidentUrl(siteUrl, id)` becomes `buildTrackedUrl(incidentPath(id), { source: 'telegram', medium: 'social', campaign: 'incident_alerts' }, siteUrl)`; same pattern for the weekly and retraction links. Add `link?: string | null` to `TelegramAlertArticle`, and `link` to `ARTICLE_COLUMNS` in `post-telegram-alerts/index.ts:26`. Escape every interpolated value with `escapeTelegramHtml`. Leave `link_preview_options: { is_disabled: true }` as it is (turning previews on is a user action after per-route OG is live).
- [ ] **Step 4: Run; they pass. `bun build supabase/functions/post-telegram-alerts/index.ts --no-bundle > /dev/null`.**
- [ ] **Step 5: Commit.** `git commit -m "feat(telegram): link the source record and credit QuillMonitor in posts"`

### Task S3.3: Emails

**Files:** `alert-email.ts`, `newsletter-render.ts`, `weekly-render.ts`, `subscription-optin.ts`, their tests, the function entries listed above, `security-actions.ts`.

Rules (from the distribution audit's UTM table):
- Tags are added **at render time only**. `newsletter_issues.content.*.incidentUrl` stays clean because the public weekly page renders the same JSON. Add a test in `newsletter-content.test.ts` that `toNewsletterItem(...).incidentUrl` contains no `utm_`.
- Alert email: campaign `realtime_alert`, `utm_content` `title`, `details`, `feed`. Add a visible "Details on Digibastion" link under each item. Replace the `FEED_URL` constant with the caller's site URL. Follow-up email: campaign `alert_followup`; a retraction links the feed, not the removed record; the text version gets the feed link too.
- Daily brief: campaign `daily_brief`, contents `title`, `details`, `action`, `weekly`. Add a line linking the latest weekly page when the content has one, and the Telegram channel.
- Weekly email: campaign `weekly_deep_dive`, contents `title`, `details`, `web_version`, `tip`. Add "Read this issue on the web" under the period line and "Share this issue: <url>" at the bottom, both `buildTrackedUrl(weeklyPath(c.weekStart), { source: 'email', medium: 'email', campaign: 'weekly_deep_dive', content: 'web_version' }, ctx.siteUrl)`, in HTML and text.
- Legacy digest (`send-digest-emails`): campaigns `digest_daily`/`digest_weekly`, contents `title`, `feed`; `encodeURIComponent(article.id)` in the HTML path too.
- Every renderer: for `isQuillMonitorOnly(item.providers)` items add "Powered by QuillMonitor" linked to `QUILLMONITOR_DATABASE_URL`. Source line uses `sourceLabelFor` and `sourceLinkFor`: when `sourceLinkFor` returns null, print the name unlinked. Replace the `'Digibastion Intelligence'` fallback with `sourceLabelFor` (which gives "Source not given").
- Subscribe, verify and management emails: every `https://digibastion.com` becomes `SITE_URL` from `site-urls.ts` (also in `weekly-admin-summary` and `threat-intel-api`). Add a short block to the verify and already-verified emails: "While you wait: join @digibastion on Telegram, or read last week's report at /threat-intel/weekly", with campaign `subscribe_confirm`. "DigiBastion" becomes "Digibastion" in `subscription-optin.ts` (and its test).
- Replace the local `SITE_URL` constants in `send-critical-alerts`, `send-newsletters`, `build-daily-newsletter`, `build-weekly-newsletter`, `send-digest-emails`, `submit-form`, `verify-email`, `request-management-link` and `security-actions.ts` with the import from `site-urls.ts`.
- Never put an email address, subscription id, token or incident id in a UTM value.

- [ ] **Step 1: Write failing tests** in each renderer's test file for the rules above: the tagged title link, the untagged source link, the "Powered by QuillMonitor" line present for a QuillMonitor-only item and absent for a merged two-source item, the weekly web-version link, the unlinked source name when `sourceUrl` equals `incidentUrl`, and no `digibastion.com` without `www` anywhere in rendered output (`expect(html).not.toMatch(/https:\/\/digibastion\.com/)`).
- [ ] **Step 2: Run them; they fail.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run all `_shared` tests and `bun build` every changed function entry.**
- [ ] **Step 5: Commit.** `git commit -m "feat(email): tag our links, link the web version and credit sources in every email"`

### Task S3.4: Per-incident and per-weekly preview images

**Files:** `_shared/og-card.ts`, `og-card.test.ts`, `supabase/functions/og-image/index.ts`; append zones in `routeMeta.ts` and `incidentMeta.ts`.

- [ ] **Step 1: Write the failing test.** `renderIncidentCardSvg({ title, lossLabel, chain, attackType, sourceLabel, status, poweredByQuillMonitor })` returns an SVG with `width="1200" height="630"`; a title containing `<script>&"` appears escaped; titles wrap to at most 3 lines of about 34 characters with an ellipsis; "Powered by QuillMonitor" appears only when asked; the word "verified" never appears unless the status text is the source's own ("confirmed"). `renderWeeklyCardSvg({ weekLabel, lossLabel, incidentCount })` likewise. Also test that the existing quiz path escapes `u` and badge values (export the quiz SVG builder into `og-card.ts` as `renderQuizCardSvg` and escape inside it).
- [ ] **Step 2: Run; it fails.**
- [ ] **Step 3: Implement** with `escapeXml`. In `og-image/index.ts`: `?kind=incident&id=<id>` (validate with `SAFE_ARTICLE_ID`) reads the row with the service-role client, refuses non-indexable rows with a 302 to `https://www.digibastion.com/og-threat-intel.png`, maps it with `toNewsletterItem`, and renders the card through the existing resvg `render`. `?kind=weekly&week=YYYY-MM-DD` calls `get_weekly_newsletter`. No `kind` keeps the quiz behaviour. `Cache-Control: public, max-age=86400`.
- [ ] **Step 4: Point images at it.** In `incidentRouteMeta` set `image: incidentOgImageUrl(i.id)` for Web3 incidents (keep `/og-threat-intel.png` for news items); in `weeklyRouteMeta` set `image: weeklyOgImageUrl(c.weekStart)`; image size 1200x630.
- [ ] **Step 5: Run tests, `bun build supabase/functions/og-image/index.ts --no-bundle > /dev/null`.**
- [ ] **Step 6: Commit.** `git commit -m "feat(share): render preview cards for incidents and weekly issues"`

### Task S3.5: ShareBar, UTM-safe redirects and referrers

**Files:** `src/components/share/ShareBar.tsx`, its test, `src/utils/share.ts`, `src/utils/safeUrl.ts`, `src/utils/__tests__/safeUrl.test.ts`, `src/components/news/NewsCard.tsx`, `src/pages/VerifyEmail.tsx`, `src/pages/__tests__/WeeklyNewsletter.test.tsx`; append zones in `News.tsx`, `NewsDetail.tsx`, `WeeklyNewsletter.tsx`, `ThreatIntelMethodology.tsx`.

`ShareBar` props: `{ url: string; title: string; text: string; campaign: 'share_incident' | 'share_weekly'; compact?: boolean }`. Buttons: Post on X, Telegram, LinkedIn, Copy link, and More (native `navigator.share`, only when it exists). Compact mode shows X, Copy link and More. Platform buttons open `shareTargets` URLs built from `buildTrackedUrl(url, { source: <platform>, medium: 'social', campaign })` via `openExternalUrl`. More uses `{ source: 'share', medium: 'share', campaign }`. **Copy link copies the clean canonical URL with no tags.** `via` is `X_HANDLE`. Wrap in `<nav aria-label="Share">`; each button has an `aria-label` ("Share on X", "Share on Telegram", "Share on LinkedIn", "Copy link", "More sharing options"). Copy: `await navigator.clipboard.writeText(url)`, toast "Link copied" only after it resolves, toast "Copy the address from your browser" on rejection. Native share: return silently on `AbortError`.

- [ ] **Step 1: Write failing tests** (`ShareBar.test.tsx`, jsdom): clicking X calls `window.open` with a URL containing `utm_source%3Dx` and `via=digibastion`; Copy link writes the URL with no `utm_`; a rejected clipboard shows the failure toast, not "Link copied"; an `AbortError` from `navigator.share` shows no toast. In `WeeklyNewsletter.test.tsx`: the share bar renders; the `error` state does not set `noindex`. In `safeUrl.test.ts`: `openExternalUrl` calls `window.open(url, '_blank', 'noopener')`.
- [ ] **Step 2: Run them; they fail.**
- [ ] **Step 3: Implement.**
  - `NewsDetail.tsx`: replace the Share button (around lines 78-101 and 155-158) with `<ShareBar compact .../>` near the title and a full `ShareBar` under the source and attribution block. Text: `shareTextForIncident` for Web3 incidents, otherwise the title plus "Source: <name>".
  - `WeeklyNewsletter.tsx`: full bar under the header and again above the subscribe card, text `shareTextForWeekly`.
  - `ThreatIntelMethodology.tsx`: a Copy link button only.
  - `News.tsx` merged-record redirect (around line 344): `navigate(\`/threat-intel/${encodeURIComponent(primary.id)}${location.search}\`, { replace: true })`.
  - `src/utils/share.ts`: use `shareTargets` (x.com, `url=` and `via=`).
  - Source and partner links: change `rel="noopener noreferrer"` to `rel="noopener"` in `NewsDetail.tsx`, `NewsCard.tsx`, `WeeklyNewsletter.tsx` and `ThreatIntelMethodology.tsx` for anchors whose `href` is a source or partner URL; and `'noopener,noreferrer'` to `'noopener'` in `safeUrl.ts`. With the site's `strict-origin-when-cross-origin` policy only `https://www.digibastion.com` is sent, so QuillMonitor and others can see our traffic. Leave other files alone.
  - `VerifyEmail.tsx`: build the manage link with `const u = new URL(manageUrl); <Link to={u.pathname + u.search}>` (guarded by try/catch, falling back to the absolute URL), and add Telegram and `/threat-intel/weekly` links to the success state.
- [ ] **Step 4: Run all touched tests, typecheck and eslint.**
- [ ] **Step 5: Commit.** `git commit -m "feat(share): add share bar to incident and weekly pages and keep tags across redirects"`

### S3 verification

```bash
cd /Users/chirag/Documents/digibastion_web-seo
rtk proxy npx vitest run
for f in post-telegram-alerts send-critical-alerts send-newsletters build-daily-newsletter build-weekly-newsletter send-digest-emails submit-form request-management-link verify-email weekly-admin-summary threat-intel-api og-image; do bun build supabase/functions/$f/index.ts --no-bundle > /dev/null || echo "FAIL $f"; done
rtk proxy grep -rn "https://digibastion.com" supabase/functions src --include='*.ts' --include='*.tsx'   # no hits outside tests asserting absence
rtk proxy grep -rn "DigiBastion" supabase/functions/_shared supabase/functions/post-telegram-alerts  # no hits
npx tsc --noEmit -p tsconfig.app.json
```

---

## S4. Optional Cloudflare Worker (inert until DNS moves)

**Goal:** If the user moves DNS to Cloudflare, every incident and weekly URL gets correct head tags and preview images the moment it exists (no redeploy), unknown incidents return a real 404, legacy paths return real 301s, feeds and sitemaps are served from `www` with the right content type, and the security headers from `vercel.json` are finally sent. Nothing here runs until then.

**Files:** Create `edge/cloudflare-worker/wrangler.toml`, `edge/cloudflare-worker/tsconfig.json`, `edge/cloudflare-worker/README.md`, `edge/cloudflare-worker/src/index.ts`, `edge/cloudflare-worker/src/plan.ts`, `edge/cloudflare-worker/src/plan.test.ts`, `edge/cloudflare-worker/src/env.d.ts`.

**Interfaces consumed:** `canonicalizeUrl`, `SITE_URL`, `FUNCTIONS_BASE_URL` (S1); `INDEXABLE_INCIDENT_POSTGREST_FILTER`, `isIndexableIncidentMetadata`, `SAFE_ARTICLE_ID`, `WEEK_START` (S1); `toNewsletterItem` (existing); `incidentRouteMeta`, `weeklyRouteMeta`, `renderHead`, `injectIntoTemplate` (S2). The Worker imports these by relative path from `../../../src/seo/...` and `../../../supabase/functions/_shared/...`; the boundary rule in S2 guarantees they have no `@/` imports.

`plan.ts` (pure, tested):

```ts
export type Route =
  | { kind: 'incident'; id: string }
  | { kind: 'weekly'; weekStart: string }
  | { kind: 'redirect'; location: string; status: 301 }
  | { kind: 'proxy'; target: string; contentType: string }
  | { kind: 'passthrough' };

export const SECURITY_HEADERS: Readonly<Record<string, string>>;  // copied from vercel.json headers
export function classifyRequest(method: string, url: URL, accept: string | null): Route;
export function rewriteHtml(originHtml: string, meta: RouteMeta): string | null;  // null when markers are missing
export function notFoundHtml(originHtml: string): string;                         // fallback meta with robots noindex
```

Rules: only `GET`/`HEAD` with `Accept` including `text/html` (or no Accept) are rewritten; `/threat-intel/<id>` where `id` matches `SAFE_ARTICLE_ID` is `incident` (but `/threat-intel/methodology` and `/threat-intel/weekly` are passthrough); `/threat-intel/weekly/<date>` is `weekly`; `/news` 301s to `/threat-intel` keeping the query; `/present` 301s to `/about`; the retired article slugs in `vercel.json` 301 to their targets; `/feed.xml`, `/feed.atom`, `/feed.json` and `/sitemap-dynamic.xml` proxy to the Supabase function URLs with `application/rss+xml`, `application/atom+xml`, `application/feed+json` and `application/xml`. A host of `digibastion.com` 301s to `https://www.digibastion.com` with the same path. Rewrite for every visitor, not only bots, so there is no user-agent cloaking.

`index.ts`: fetch the origin (`env.ORIGIN_URL`, default `https://digibastion.lovable.app`) with the same path; for `incident`, read `${SUPABASE_URL}/rest/v1/news_articles?select=...&id=eq.<id>&or=(${INDEXABLE_INCIDENT_POSTGREST_FILTER})` with the anon key; if no row, look the id up without the filter: a row with `duplicate_of_uid` 301s to the primary record's page when it resolves, anything else returns `notFoundHtml` with status 404. Weekly uses `get_weekly_newsletter`; null is a 404. Cache Supabase reads in `caches.default` for 300 seconds. On any Supabase error, pass the origin response through unchanged (fail open). Add `SECURITY_HEADERS` to every HTML response.

- [ ] **Step 1: Write failing tests** in `plan.test.ts` for each classification rule above, for `rewriteHtml` producing exactly one canonical, for a missing marker returning null, for the apex redirect keeping path and query, and for `SECURITY_HEADERS` containing `Content-Security-Policy`, `X-Frame-Options` and `Permissions-Policy` equal to the values in `vercel.json` (read the file in the test and compare).
- [ ] **Step 2: Run** `rtk proxy npx vitest run edge/cloudflare-worker/src/plan.test.ts`; it fails.
- [ ] **Step 3: Implement `plan.ts` and `index.ts`.** `env.d.ts` declares the minimal `Env`, `ExecutionContext` and `caches.default` types used, so no `@cloudflare/workers-types` dependency is needed. `tsconfig.json`: `"compilerOptions": { "target": "ES2022", "module": "ESNext", "moduleResolution": "bundler", "strict": true, "noEmit": true, "lib": ["ES2022", "WebWorker"], "allowImportingTsExtensions": true, "skipLibCheck": true, "baseUrl": ".", "paths": { "@/*": ["../../src/*"] } }`, `"include": ["src", "../../src/seo", "../../supabase/functions/_shared"]`.
- [ ] **Step 4: `wrangler.toml`** (no secrets; the anon key is public and goes in `[vars]`):

```toml
name = "digibastion-edge"
main = "src/index.ts"
compatibility_date = "2026-09-01"
tsconfig = "./tsconfig.json"
workers_dev = false
# routes are added in the Cloudflare dashboard after the DNS move; see README.md

[vars]
ORIGIN_URL = "https://digibastion.lovable.app"
SUPABASE_URL = "https://sdszjqltoheqhfkeprrd.supabase.co"
SUPABASE_ANON_KEY = "<copy DEFAULT_SUPABASE_PUBLISHABLE_KEY from src/integrations/supabase/publicDefaults.ts>"
```

Paste the actual anon key value (it is already public in the repo). Before writing `ORIGIN_URL`, confirm the Lovable preview host from `supabase/functions/email-tracking/index.ts` (its allowlist names `digibastion.lovable.app`).

- [ ] **Step 5: README.md** for the user, in plain steps: what the Worker does and does not do; how to add the site to Cloudflare (free plan), copy every DNS record from GoDaddy (including email MX, SPF, DKIM and DMARC records for Resend so mail keeps working), change nameservers at GoDaddy, deploy with `npx wrangler deploy` from this folder, add the route `www.digibastion.com/*` and `digibastion.com/*`, and how to check it (`curl -sI https://www.digibastion.com/threat-intel/<id>` shows the title and `content-security-policy`); how to roll back (remove the route; DNS can stay on Cloudflare). Warn that Lovable's custom-domain check may need the domain re-verified after the move, and that the origin must be the `*.lovable.app` host to avoid a proxy loop.
- [ ] **Step 6: Check it bundles.** `bun build edge/cloudflare-worker/src/index.ts --target=browser --outdir /private/tmp/claude-501/worker-check > /dev/null` exits 0, and `npx tsc --noEmit -p edge/cloudflare-worker/tsconfig.json` passes.
- [ ] **Step 7: Commit.** `git commit -m "feat(edge): add optional Cloudflare Worker for per-URL meta, redirects and headers"`

---

## S5. Documentation

**Goal:** A newcomer can read the repo and understand what Digibastion is, how an incident travels from a source to the feed, Telegram, email, search engines and feeds, how to run it locally and how releases work through Lovable, with every fact checked against the code.

**Files**
- Move: `ROADMAP.md` to `docs/ROADMAP.md` (index-only move, below); `security_best_practices_report.md` to `docs/security/2026-09-27-source-review.md` (`git mv`).
- Rewrite: `README.md`, `docs/PRODUCT_AND_ARCHITECTURE.md`, `THREAT_INTEL_FEEDS.md`, `CONTRIBUTING.md`.
- Update: `SECURITY.md`, `AGENTS.md`, `docs/IMPLEMENTATION_HISTORY.md`, `docs/archive/LOVABLE_PLAN_HISTORY.md`, `.github/ISSUE_TEMPLATE/roadmap_contribution.md`, `.github/ISSUE_TEMPLATE/feature_request.md`.
- Create: `docs/SEO_AND_DISTRIBUTION.md`, `docs/README.md` (docs index), `docs/LOVABLE_SEO_RELEASE.md` (release runbook).

**Rules:** facts only from code, migrations and the S1-S4 changes; the docs audit section 6 is the inventory to start from, re-checked against the code. No secret values, ever: name env vars only. No personal emails. Say "Lovable static hosting with DNS at GoDaddy" wherever the host is mentioned; call `vercel.json` and `api/og-tags.ts` inert. Apply humanize-output as the last step on every file.

### Task S5.1: Move the roadmap and the security review

- [ ] **Step 1: Move the public roadmap without touching Lovable's `roadmap.md`.** On macOS (`core.ignorecase=true`) only `roadmap.md` exists on disk.

```bash
cd /Users/chirag/Documents/digibastion_web-seo
git ls-files -s roadmap.md ROADMAP.md          # note both blob ids
git show HEAD:ROADMAP.md > docs/ROADMAP.md
git rm --cached ROADMAP.md
git add docs/ROADMAP.md
git ls-files -s roadmap.md                       # must still show the same blob as before
git diff --cached --stat                         # roadmap.md must not appear
git mv security_best_practices_report.md docs/security/2026-09-27-source-review.md
```

- [ ] **Step 2: Fix every reference.** `README.md`, `CONTRIBUTING.md`, `docs/IMPLEMENTATION_HISTORY.md:8` (`../ROADMAP.md` becomes `ROADMAP.md`), `docs/archive/LOVABLE_PLAN_HISTORY.md:22`, `.github/ISSUE_TEMPLATE/roadmap_contribution.md:9,13`, and inside the moved file (`docs/IMPLEMENTATION_HISTORY.md` becomes `IMPLEMENTATION_HISTORY.md`, `CONTRIBUTING.md` becomes `../CONTRIBUTING.md`, `SECURITY.md` becomes `../SECURITY.md`). S2 already pointed `Index.tsx` and `public/llms.txt` at `docs/ROADMAP.md`, and S6 does `Footer.tsx`. Then check: `rtk proxy grep -rn "ROADMAP.md" --include='*.md' --include='*.ts' --include='*.tsx' --include='*.txt' . | grep -v node_modules | grep -v "docs/ROADMAP.md"` returns only intended hits.
- [ ] **Step 3: Add a dated status note** at the top of `docs/security/2026-09-27-source-review.md`: as of 2026-10-11, the SEC-003 header controls (CSP, `frame-ancestors`, X-Frame-Options, Permissions-Policy) live only in `vercel.json`, which the current host (Lovable) does not apply, so production does not send them; the Worker in `edge/cloudflare-worker/` sends them if DNS moves to Cloudflare; test counts and line numbers in the body are from 2026-09-27. Change SEC-003's status from "Fixed" to "Open in production".
- [ ] **Step 4: Commit.** `git commit -m "docs: move roadmap and security review under docs/"`

### Task S5.2: README and PRODUCT_AND_ARCHITECTURE

**README.md** sections: what Digibastion is (one paragraph, `SITE_DEFINITION` wording); what is live (Threat Intel feed with methodology and severity rubric, dedup, confirmed and unconfirmed status from QuillMonitor, email alerts every 30 minutes, Telegram `@digibastion`, the weekly report page every Monday, the daily brief and weekly email built but gated on the postal address, 11 checklists with 274 items, 71 guides, the 8-question self-check from 20 scenarios, the tools directory with the count from `toolCategories`, FAQ, feeds); a mermaid diagram (below); how an incident gets from a source to your inbox in one paragraph; local development (`npm install`, `npm run dev` on 127.0.0.1:8080, `npm test`, `npm run typecheck`, `npm run build`, `npm run seo:generate`, and `PRERENDER_DYNAMIC=0` for offline builds); deploy flow (branches merge to `main`, Lovable runs the release prompt in `docs/LOVABLE_*_RELEASE.md`, applies migrations and deploys functions, and the owner clicks Publish; Lovable may commit to `main` itself); repo map (`src/pages`, `src/components`, `src/lib/threatIntel`, `src/seo`, `src/data`, `scripts/seo`, `supabase/functions` and `_shared`, `supabase/migrations`, `supabase/config.toml`, `edge/cloudflare-worker`, `docs/`); contributing pointers; license (MIT with Commons Clause).

```mermaid
flowchart LR
  QM[QuillMonitor API<br/>every 30 min] --> ING
  W3[Web3 Is Going Just Great<br/>via Firecrawl, every 6 h] --> ING
  RSS[Security news RSS<br/>hourly] --> ING
  SM[SlowMist Hacked<br/>built, off] -.-> ING
  ING[Ingestion functions<br/>normalize, severity, dedup] --> DB[(news_articles<br/>+ status events)]
  DB --> RPC[Public RPCs<br/>search, stats, facets, weekly]
  RPC --> SPA[React SPA on Lovable hosting<br/>www.digibastion.com]
  DB --> TG[post-telegram-alerts<br/>@digibastion]
  DB --> AL[send-critical-alerts<br/>email every 30 min]
  DB --> NB[daily and weekly builders] --> NL[send-newsletters<br/>gated on postal address]
  NB --> WK[/threat-intel/weekly pages/]
  DB --> SEO[generate-sitemap, threat-intel-feed,<br/>ping-indexnow every 30 min]
  SEO --> SE[Google, Bing, IndexNow engines,<br/>feed readers, AI crawlers]
```

**docs/PRODUCT_AND_ARCHITECTURE.md**, end to end, each section from code: hosting and runtime (Lovable static hosting, GoDaddy DNS, Supabase on Lovable Cloud, operators use "View Backend" in Lovable; the response headers production actually sends); sources (each with cadence, auth env var name, and permission status); ingestion and normalization (`news_articles` fields, the `metadata` keys, AI summaries labelled as such); severity rubric; dedup rules (from `_shared/incident-dedup.ts`, including the no-fuzzy-names reason); verification status and `incident_status_events`; the feed and RPCs; delivery (Telegram rules and env flags by name, alert emails, daily and weekly builds, the sender gate, legacy digest stand-down, compliance: double opt-in, RFC 8058 one-click, suppressions, consent audit, email tracking); SEO and indexing (link to the new doc); the route table from `src/App.tsx` including `/faq`, `/privacy`, `/threat-intel/weekly`; the edge function table (all functions, grouped, with auth model); the cron table (final state after `20261014090000`, all UTC, including `ping-indexnow 22,52`); data model; security model (RLS on every table, service-role-only ops tables, public RPCs, cron auth, no secrets in the repo, the header gap); release validation (Lovable publish, the curl checks from the release doc); access required (Lovable project, GoDaddy DNS, Search Console, Bing Webmaster Tools). Replace "Last verified" with 2026-10-11.

- [ ] **Step 1: Write both files.** Verify each count with a command, for example `rtk proxy grep -c "verify_jwt" supabase/config.toml` and `ls supabase/functions | grep -v _shared | wc -l`.
- [ ] **Step 2: Run humanize-output on both.**
- [ ] **Step 3: Commit.** `git commit -m "docs: rewrite README and the product and architecture guide"`

### Task S5.3: Feeds doc, SEO doc, contributing, security, agents, history, templates

- `THREAT_INTEL_FEEDS.md`: name every source plainly, including Web3 Is Going Just Great by Molly White read through a Firecrawl scrape every 6 hours, and its attribution terms (link back on every record; check the site's own terms page for reuse terms and quote only what it says); SlowMist is integrated and disabled pending written permission; the severity rubric, dedup rules, verification status, `include_preliminary`, AI summaries, cadence per source, delivery channels, and a link to `/threat-intel/methodology` as the public version. Add "Last reviewed: 2026-10-11".
- `docs/SEO_AND_DISTRIBUTION.md` (new): the end-to-end publishing flow after this branch (ingestion, IndexNow at :22/:52 with its cursor, the robots-listed dynamic and news sitemaps and their lastmod rule, feeds and their URLs, the prerender and what it covers and does not, the fallback shell, `llms.txt` and `llms-full.txt` regeneration, share links and the UTM table, preview images, the Worker and when to use it); what Google does and does not offer (no ping, no Indexing API for this content); the content-type caveat on the functions host and the `format=txt` fallback; how to verify each piece with curl; known limits (prerendered incidents are as fresh as the last publish; RSS relays are `noindex,follow` and why).
- `CONTRIBUTING.md`: fix the garbled article lines (bodies in `src/data/contentBatches/*Content.tsx`, metadata in `*Meta.ts` and `*Enhancements.ts`); `npm run typecheck` now checks the app and node configs; add the binding rules (pure `_shared` modules, one RPC overload, migration naming, no hand edits to `types.ts`, `.lovable/` or `roadmap.md`, cron auth, attribution words, run `npm run seo:generate` after changing routes, guides or checklists, because a test fails otherwise); link the methodology page.
- `SECURITY.md`: add to the "do not" list triggering `post-telegram-alerts`, newsletter sends, `ping-indexnow` or `resend-webhook`. Check private vulnerability reporting with `gh api repos/Raiders0786/digibastion/private-vulnerability-reporting`; if it returns `{"enabled":true}`, drop the "if available" hedge, otherwise leave it and add the toggle to the user actions.
- `AGENTS.md`: replace stale rule 7 with "Generated types include the weekly RPCs; remove local casts once Lovable regenerates `types.ts`." Append short rules, each with its reason: migrations sort after the latest and keep one overload per RPC; `_shared` purity; no hand edits to `types.ts`, `.lovable/`, `roadmap.md`; never "verified by Digibastion", name the source, keep "Powered by QuillMonitor"; no personal emails in migrations or seeds; run `npm run seo:generate` after route or content changes. Keep the existing lines otherwise untouched (the main checkout has a local AGENTS.md edit that will need merging).
- `docs/IMPLEMENTATION_HISTORY.md`: append dated entries for 2026-09-29 (QuillMonitor incremental sync, SlowMist importer prepared and off), 2026-10-10 (Telegram alerts), Phase 0 (dedupe, legacy amount repair, same-provider merge), Phase 2 (stats, facets, filters, severity sort, methodology), Phase 3 (newsletter data model, compliance, 30-minute alerts, daily and weekly builds, public weekly page, weekly Telegram post, gated), and 2026-10-11 (this branch).
- `docs/archive/LOVABLE_PLAN_HISTORY.md`: say the archive covers the September 2026 plans and newer plans live in `.lovable/plan/`; replace Vercel with Lovable hosting.
- `.github/ISSUE_TEMPLATE/roadmap_contribution.md`: "Vercel" becomes "Lovable hosting and GoDaddy DNS"; `feature_request.md` adds "Telegram or newsletters" and "SEO and sharing" to product areas. Check labels with `gh label list` and note missing ones in the user actions.
- `docs/README.md` (new): one line per doc, plus "`roadmap.md` at the repo root is Lovable's working log, not the roadmap" and "`docs/superpowers/` holds historical working plans and specs".
- `docs/ROADMAP.md`: "Last reviewed: 2026-10-11"; a Shipped table that adds Telegram, dedup and severity, methodology, the Phase 2 feed UX, Phase 3 (built, sending gated), the weekly page, and this branch (sitemaps, IndexNow, feeds, prerender, FAQ, share bar); SlowMist state; Now: newsletter launch (set the postal address, flip `NEWSLETTERS_LIVE`, retire `send-digest-emails`), privacy review, security headers (Worker or host support), analytics with UTM support; Later: "open a stable public API beyond the current key-gated partner endpoint"; owner decisions mention Lovable hosting and GoDaddy DNS; tool count from data.

- [ ] **Step 1: Write the files.**
- [ ] **Step 2: Check links:** `rtk proxy grep -rnoE "\]\((\.\./|\./)?[A-Za-z0-9_./-]+\.md[^)]*\)" README.md CONTRIBUTING.md SECURITY.md THREAT_INTEL_FEEDS.md AGENTS.md docs/*.md` and confirm each relative target exists with `ls`.
- [ ] **Step 3: Run humanize-output on every changed file.**
- [ ] **Step 4: Run the secret test** `rtk proxy npx vitest run src/utils/__tests__/publicFilesNoSecrets.test.ts` and `rtk proxy grep -rniE "gmail|re_[A-Za-z0-9]{20}|whsec_|service_role\"" README.md CONTRIBUTING.md SECURITY.md THREAT_INTEL_FEEDS.md docs/*.md` (no hits).
- [ ] **Step 5: Commit.** `git commit -m "docs: document sources, delivery, SEO and contribution rules end to end"`

### Task S5.4: Release runbook `docs/LOVABLE_SEO_RELEASE.md`

Follow the shape of `docs/LOVABLE_PHASE3_RELEASE.md`. Contents:

1. **What ships:** migrations `20261014090000_seo_indexing.sql` and `20261014100000_weekly_newsletter_list.sql`; new functions `ping-indexnow`, `threat-intel-feed`; changed functions (list from S1 and S3); config entries; frontend changes. No new secrets are required. Optional: `INDEXNOW_KEY` only for key rotation (and then the matching `public/<key>.txt` must exist).
2. **Lovable prompt:** apply both migrations in order, deploy the listed functions, never print secrets, then Publish.
3. **Checks after publish,** each with the exact command and expected result:
   - `curl -s https://www.digibastion.com/<key>.txt` prints the key.
   - `curl -s https://www.digibastion.com/robots.txt | grep Sitemap` shows three lines.
   - `curl -sI "https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/generate-sitemap?part=dynamic"` is 200; `curl -s ... | xmllint --noout -` passes; `curl -s ... | grep -c "<loc>"` is about 2,100 or more; no URL of a known merged record appears.
   - `curl -s ".../threat-intel-feed?format=rss" | xmllint --noout -` passes; `?format=json | python3 -m json.tool` (run as `uv run python3 -m json.tool`) parses.
   - Prerender canary: `curl -s https://www.digibastion.com/__prerender-check` and `curl -s https://www.digibastion.com/__prerender-check/`, recording which of `prerender-file-ok` and `prerender-dir-ok` appears; `curl -sI https://www.digibastion.com/articles/seed-phrase-security-guide` (200, not a 301 to a trailing slash); `curl -s https://www.digibastion.com/articles/seed-phrase-security-guide | grep -o '<title>[^<]*'` (the guide title if prerender is served, the fallback title if not); `curl -s https://www.digibastion.com/does-not-exist | grep -c canonical` is 0. Decision table: file layout served, keep defaults; only dir layout served and no trailing-slash 301, set `PRERENDER_LAYOUT=dir` as a Lovable build env var if Lovable supports it, otherwise leave it; neither served, previews and per-page HTML need the Worker (S4).
   - IndexNow: call `ping-indexnow` as an admin with `{"mode":"urls","dryRun":true,"urls":["https://www.digibastion.com/threat-intel"]}`, then without `dryRun`; expect `200` or `202` and a new `threat_intel_ingestion_runs` row with pipeline `indexnow`. After that, run `{"mode":"backfill"}` once.
   - `/admin/cron`: `ping-indexnow` scheduled, `fetch-web3-incidents-6h` gone, `weekly-admin-summary` last run succeeded (it may have been failing at the gateway before the config change).
   - Previews: paste an incident URL and a weekly URL into the X composer, a Telegram chat and LinkedIn Post Inspector; record what each shows.
4. **Rollback:** unschedule `ping-indexnow`; set `PRERENDER=0` if a build problem appears; the old sitemap behaviour is not needed by anything.

- [ ] **Step 1: Write it; run humanize-output.**
- [ ] **Step 2: Commit.** `git commit -m "docs: add the SEO and distribution release runbook"`

---

## S6. Website copy

**Goal:** Every page says what the product does today, in plain words, with one name per thing, no claims the code cannot back, and answers a reader or an answer engine can quote.

**Files:** `src/components/Footer.tsx`, `src/components/Navbar.tsx`, `src/components/MobileBottomNav.tsx`, `src/components/news/InlineSubscribeCard.tsx`, `src/components/newsletter/QuickSubscribeCard.tsx`, `src/components/news/DeliveryPreferencesFields.tsx`, `src/components/news/SubscriptionForm.tsx`, `src/components/news/RealtimeStatusIndicator.tsx`, `src/components/news/AlertsPanel.tsx`, `src/components/news/IncidentFilters.tsx`, `src/lib/threatIntel/query.ts`, `src/pages/About.tsx`, `Tools.tsx`, `Links.tsx`, `Quiz.tsx`, `Leaderboard.tsx`, `NotFound.tsx`, `Share.tsx`, `Contact.tsx`, `Unsubscribe.tsx`, `ManageSubscription.tsx`, `Services.tsx`, `services/OpsecConsulting.tsx`, `services/FullStackReview.tsx`, `ArticleDetail.tsx`, `CategoryDetail.tsx`, new `src/pages/Privacy.tsx`, `public/site.webmanifest`, and the tests that assert copy (`src/components/news/__tests__/*`, `src/components/newsletter/__tests__/QuickSubscribeCard.test.tsx`, `src/pages/__tests__/*`). Append zones: `index.html`, `src/App.tsx` (one route), `src/seo/routeMeta.ts` (one entry), `src/seo/siteFacts.ts` (strings), `src/pages/Index.tsx`, `News.tsx`, `NewsDetail.tsx`, `WeeklyNewsletter.tsx`, `ThreatIntelMethodology.tsx`, `VerifyEmail.tsx` (copy only). Generated files: rerun `npm run seo:generate`.

Use the copy audit's replacement text where it gives one; the tasks below name the section. Every new sentence must pass two checks: it is true at `NEWSLETTERS_LIVE = false` and at any `TELEGRAM_MIN_SEVERITY`, and it names no source that is not live.

### Task S6.1: Subscribe, Telegram and "real-time" claims

- [ ] **Step 1: Update tests first.** In the subscribe-card, delivery-preference, NewsDetail, RealtimeStatusIndicator and VerifyEmail tests, assert the new strings: Telegram line "Telegram (@digibastion) posts new Web3 incidents from QuillMonitor, plus a link to the weekly report every Monday. Email alerts follow the filters you pick."; no "high and critical" in Telegram copy; with `NEWSLETTERS_LIVE = false` the daily and weekly options read "(starting soon)" and the success line reads "Your daily brief will arrive at {time} once the newsletter launches. Real-time alerts start with the next matching incident."; the delivery hint reads "Critical and high incidents, checked every 30 minutes"; the status indicator reads "Auto-updating" and "This page updates on its own when new records arrive."; VerifyEmail reads "You're subscribed. Real-time alerts go out within about 30 minutes of a matching critical or high incident. You can change what you get from the link in any email."
- [ ] **Step 2: Run; they fail.**
- [ ] **Step 3: Implement** (copy audit sections 1, 2 and 7). In `NewsDetail.tsx`, show the Telegram sentence only when the record is a Web3 incident. In `News.tsx`, the incident-view H1 becomes "Crypto hacks and Web3 exploits" and the intro uses the section 6 text ("…shows the source's confirmed or unconfirmed status when it gives one."). Hide the "SlowMist Hacked" source chip in `IncidentFilters.tsx` and `query.ts` until a SlowMist cron exists (keep the code path; gate it on a `SLOWMIST_LIVE = false` constant next to the chip list).
- [ ] **Step 4: Run; they pass.**
- [ ] **Step 5: Commit.** `git commit -m "fix(copy): make alert, Telegram and newsletter promises match what sends"`

### Task S6.2: Home, About, FAQ links, footer and navigation

- [ ] **Step 1: Tests first.** Add `src/components/__tests__/Footer.test.tsx` asserting links to `https://t.me/digibastion` ("Telegram alerts"), `/threat-intel/methodology` ("How we track incidents"), `/threat-intel/weekly` ("Weekly reports"), `/faq`, `/privacy`, the RSS feed, and `GITHUB_ROADMAP_URL`, and a "Community chat" label on the community link. Add `src/components/__tests__/Navbar.test.tsx` asserting every internal nav item is an `<a href>` (rendered by `<Link>`), and the desktop nav has Threat Intel, Guides and Services. Add a home test that "Latest alerts" items show "Source: <name>" or "Powered by QuillMonitor".
- [ ] **Step 2: Run; they fail.**
- [ ] **Step 3: Implement** (copy audit sections 3, 6, 8, 9, 10). Home: the lead paragraph is `SITE_DEFINITION`; the "What is live" list is "Threat Intel feed with email alerts · Telegram channel @digibastion · Weekly report every Monday · 11 security checklists · OpSec self-check · 71 security guides · Vantage (beta)", with "Daily brief email" under active work; "We curate" becomes the section 6 sentence; "Latest alerts" selects `source_name, metadata` and renders the source label with `getProviderLabel` from `incidentDisplay.ts`; Vantage status reads "Beta" everywhere; "Publicly inspectable." becomes "Source code on GitHub."; the home path cards become `<Link>`s. About: definition paragraph first, the threat-intel card text from section 8, a short Q&A block rendering `faqEntries()` filtered to five entries with a link to `/faq`, and the "connective tissue" line replaced. `/threat-intel`: a short Q&A block from `THREAT_INTEL_FAQ_IDS` above the methodology line, plus links to the weekly archive and the newest issue. Navbar and MobileBottomNav: `<Link to>` everywhere, labels from the section 9 table, category titles read from `initialSecurityData` instead of local copies, a Guides item on desktop. Footer: the links above, roadmap via `GITHUB_ROADMAP_URL`.
- [ ] **Step 4: Run; they pass.**
- [ ] **Step 5: Commit.** `git commit -m "feat(copy): plain definitions, sourced home alerts and crawlable navigation"`

### Task S6.3: Remaining pages, names and the privacy page

- [ ] **Step 1: Implement the rest of the copy audit:** section 5 page copy that is not in the registry; section 9 names everywhere (Digibastion, Threat Intel, OpSec self-check, Guides, Tools, Get alerts, OpSec tip, the unsubscribe confirmation); section 12 smaller fixes (Tools intro and badges, Tools CTA, NotFound text and links, Leaderboard, Quiz stat "8 of 20 scenarios", AlertsPanel rubric lines, VerifyEmail subtitle); Share page Telegram option (section 8); Contact "Incident correction" topic pointing at `CORRECTIONS_EMAIL`; methodology "Alerts and newsletters" section (section 8 text, with the Telegram clause written without a severity claim, and the newsletter clause conditional on `NEWSLETTERS_LIVE`) and an "Official channels" list that includes the three feed URLs; `ArticleDetail.tsx` adds `InlineSubscribeCard` after the sources block; `CategoryDetail.tsx` loses the `console.log` at line 90; `site.webmanifest` description "Free Web3 security help: crypto hack alerts, security checklists and guides."; `index.html` default strings and JSON-LD descriptions from `SITE_FALLBACK_META` and `SITE_DEFINITION`, Organization `alternateName` removed, and a `<noscript>` block with the definition paragraph and plain links to `/threat-intel`, `/threat-intel/methodology`, `/articles`, `/quiz`, `/faq`, `/about` and `https://t.me/digibastion`.
- [ ] **Step 2: Privacy page.** `src/pages/Privacy.tsx` at `/privacy` (add the route line in `App.tsx` and the entry in `routeMeta.ts`: title "Privacy at Digibastion" plus suffix, a description of what is collected). Content from code only: email subscriptions store the email address, chosen filters, timezone and a hash of the IP address at consent (`subscriptions.consent_ip_hash`); email opens and clicks are recorded with a hashed IP, country, device and email client (`email-tracking`, `email_events`) for the legacy digest and alerts; the new newsletters carry no tracking pixel; bounces and complaints go to a suppression list; quiz scores store the chosen display name and score; checklist progress stays in the browser's local storage; no account is needed for anything public; how to unsubscribe (link in every email, one-click header) and how to ask for deletion (`support@digibastion.com`). Verify each claim against the named file before writing it. Add a line at the top: "Last updated: <date>". Owner review is a user action before newsletters launch.
- [ ] **Step 3: Regenerate and test.** `npm run seo:generate`, then `rtk proxy npx vitest run`, typecheck and eslint on touched files.
- [ ] **Step 4: Run humanize-output over the new and changed copy** (read the diff of `src/` text, not the code).
- [ ] **Step 5: Commit.** `git commit -m "feat(copy): consistent names, honest tool and quiz copy, privacy page"`

### S6 verification

```bash
cd /Users/chirag/Documents/digibastion_web-seo
rtk proxy grep -rn "DigiBastion\|Security Security\|as they happen\|Live Feed Active\|Vetted by\|community-built\|Satoshi-level" src index.html public/llms.txt public/site.webmanifest   # no hits
rtk proxy npx vitest run
npx tsc --noEmit -p tsconfig.app.json && npx tsc --noEmit -p tsconfig.node.json
node node_modules/vite/bin/vite.js build
```

---

## Final gate (after S6)

```bash
cd /Users/chirag/Documents/digibastion_web-seo
rtk proxy npx vitest run                                                    # all green; count above 814
npm run typecheck
npx eslint src scripts edge supabase/functions/_shared
for f in $(ls supabase/functions | grep -v _shared); do bun build supabase/functions/$f/index.ts --no-bundle > /dev/null || echo "FAIL $f"; done
PRERENDER_DYNAMIC=0 node node_modules/vite/bin/vite.js build
VITE_SUPABASE_URL=http://127.0.0.1:9 node node_modules/vite/bin/vite.js build
git status --short | grep -v "^??" ; git status --short | grep "\.audit"   # nothing staged from .audit
git log --format=%B origin/main..HEAD | grep -i "co-authored\|claude\|generated with" # no hits
```

Then request a whole-branch review (superpowers:requesting-code-review) against the Review Focus list before the user merges.

## Deferred, with reasons

- **Stop no-op QuillMonitor writes** (seo audit P1.8). Sitemap lastmod no longer reads `updated_at`, and IndexNow keys off `created_at` and status events, so the rewrites no longer hurt SEO. Changing the importer carries ingestion risk with no SEO gain left. Do it in an ingestion-focused branch.
- **CSP via `<meta http-equiv>`.** It cannot set `frame-ancestors`, and it could break scripts Lovable injects in ways we cannot test locally. The Worker sends real headers; otherwise ask Lovable for header support.
- **Stripping UTM tags from the address bar.** Waits for an analytics tool (decision 4).
- **Telegram link previews.** Turn on for the weekly post only after a live curl shows per-route `og:title` on weekly pages.
- **New art for the four identical `public/og-*.png` files.** Design work; the generated cards cover incidents and weekly pages.
- **Rewriting git history to remove the old personal address.** Disruptive, and the address has been public since March 2026; the user decides.

## User actions (only the owner can do these)

1. Review and merge `seo-aeo-docs`, then run the release prompt in `docs/LOVABLE_SEO_RELEASE.md` in Lovable (apply both migrations, deploy the functions) and click Publish. Before pulling, commit or stash the local `AGENTS.md` edit in the main checkout.
2. Run the checks in the release doc, including the prerender canary, and tell the next session which layout the host serves.
3. Google Search Console: confirm the property for `https://www.digibastion.com` (a verification tag is already in `index.html`); submit `https://www.digibastion.com/sitemap-index.xml` and both function sitemap URLs (`generate-sitemap?part=dynamic` and `?part=news`); if Google rejects the `text/plain` type, submit `?part=dynamic&format=txt` instead. Use URL Inspection on `/`, one guide, one incident and one weekly page to see the rendered HTML.
4. Bing Webmaster Tools: import the site from Search Console, submit the same sitemaps, and watch the IndexNow report after the backfill.
5. Run the one-time IndexNow backfill (`{"mode":"backfill"}`) after the key file is live.
6. Confirm the X account `@digibastion` is Digibastion's. If not, tell us to set `X_HANDLE = null` and remove it from `index.html` `sameAs` and `twitter:site`.
7. Check `TELEGRAM_MIN_SEVERITY` in Lovable Cloud secrets (the copy is true either way; this is for your own records).
8. Set `NEWSLETTER_POSTAL_ADDRESS` when ready to launch newsletters, then ask for `NEWSLETTERS_LIVE = true` and the copy flip; review `/privacy` first.
9. Change the live `app_config.ADMIN_ALERT_EMAILS` value to a role address on `@digibastion.com` (the old migration keeps a personal address; leave the migration file as it is).
10. Rotate or delete the old Web3Forms access key if that account still exists.
11. Make the apex `digibastion.com` redirect a 301 instead of a 302 (Lovable domain settings or GoDaddy forwarding), or let the Worker do it after a DNS move.
12. Optional: move DNS to Cloudflare and deploy the Worker following `edge/cloudflare-worker/README.md`; copy the Resend mail records first.
13. Choose an analytics tool that reads UTM tags on any host (Plausible, Umami or Cloudflare Web Analytics), or confirm whether Lovable's analytics reports UTMs.
14. In `/admin/cron`, confirm `weekly-admin-summary` runs after the config change and the legacy `fetch-web3-incidents-6h` job is gone.
15. Turn on GitHub private vulnerability reporting if `gh api` showed it off, and create any missing issue labels.
