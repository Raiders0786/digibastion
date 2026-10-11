# Product and architecture

Last verified: 2026-10-11, against the code on the `seo-aeo-docs` branch and
the live site. Anything that depends on production state (which secrets are
set, whether a cron job ran) is marked as something to check, not a fact.

This is the end-to-end map: where the site runs, where incidents come from, how
they are stored, how they reach readers, search engines and subscribers, and
what keeps it safe. For a shorter overview, start with the
[README](../README.md).

## Products

- **Digibastion** at `www.digibastion.com` is this repository: the Threat Intel
  feed and its alerts, the security checklists, the OpSec self-check, guides,
  tools and the service pages.
- **Vantage** at `vantage.digibastion.com` checks a domain's DNS, email, TLS,
  web and Web3 trust setup. It is a separate app in beta. Its code is not in
  this repo, so nothing here deploys or tests it.
- **Services** (OpSec consulting and full-stack security review) are paid and
  are requested through `/services` and `/contact`.

No checklist, score or feed guarantees security, and the copy should never
suggest one does.

## Hosting and runtime

| Part | Where it runs |
| --- | --- |
| Frontend | React 18, Vite and TypeScript single-page app on Lovable static hosting. DNS is at GoDaddy; `www` points at Lovable (A record 185.158.133.1). `www.digibastion.com` is the canonical host; `digibastion.com` answers with a 302 to `www`. |
| Backend | Supabase on Lovable Cloud, project ref `sdszjqltoheqhfkeprrd`: Postgres with row-level security, Deno edge functions at `https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/<name>`, and pg_cron with pg_net for scheduled calls. |
| Operator access | **View Backend** in the Lovable project, for the database, functions, logs and secrets. There is no separate Supabase dashboard login. |
| Email | Resend, sending as `alerts@digibastion.com`. Bounces and complaints come back through the `resend-webhook` function. |
| Telegram | A bot posts to the public channel `@digibastion`. |
| AI | The Lovable AI gateway (`LOVABLE_API_KEY`) writes short summaries and, when enabled, the weekly report's narrative. |

Lovable serves files from `public/` as they are, and answers every other path
with the same `index.html`. The build also writes one HTML file per public page
(see [SEO and indexing](#seo-and-indexing)); whether Lovable serves those files
before falling back to `index.html` is not yet known, and the
[release runbook](LOVABLE_SEO_RELEASE.md) checks it.

Response headers that production sends, checked with `curl -I` on 2026-10-11:
`Strict-Transport-Security`, `X-Content-Type-Options: nosniff` and
`Referrer-Policy: strict-origin-when-cross-origin`. It sends no
Content-Security-Policy, X-Frame-Options or Permissions-Policy. Those are
written in `vercel.json`, but `vercel.json` and `api/og-tags.ts` are left from
an earlier Vercel setup and Lovable does not use them. The optional Cloudflare
Worker in `edge/cloudflare-worker/` adds the missing headers if DNS ever moves
to Cloudflare.

## Sources

| Source | Function | When (UTC) | Credential (name only) | Status |
| --- | --- | --- | --- | --- |
| QuillMonitor partner API | `fetch-quillmonitor-incidents` | :17 and :47 every hour | `QUILLMONITOR_API_KEY` | Live. The main incident source, under a partner agreement. |
| Web3 Is Going Just Great (Molly White), read through a Firecrawl scrape of the home page | `fetch-web3-incidents` | 00:30, 06:30, 12:30, 18:30 | `FIRECRAWL_API_KEY` | Live. Text is CC BY 3.0; see [THREAT_INTEL_FEEDS.md](../THREAT_INTEL_FEEDS.md) for the author's terms. |
| Security news RSS feeds listed in the `rss_feeds` table | `fetch-rss-news` | :15 every hour | none | Live. |
| SlowMist Hacked | `fetch-slowmist-incidents` | no schedule | none | Built and switched off. It returns a permission notice unless `SLOWMIST_INGESTION_ENABLED=true`, which waits on written permission from SlowMist. |

QuillMonitor syncs are incremental. Each run asks for incidents changed since a
cursor stored in `app_config.QUILLMONITOR_SYNC_SINCE` and moves the cursor
forward with `advance_quillmonitor_sync_cursor` only after a successful write.
An admin can request a full sync, which reads up to 100 pages. Unverified
QuillMonitor incidents are included and shown as unconfirmed.

`summarize-article` runs at 00:45, 06:45, 12:45 and 18:45 and writes summaries
for up to 20 records per run with the model `google/gemini-2.5-flash-lite`.
These summaries are labelled "AI summary" on cards and in Telegram posts, so a
reader can tell them apart from the source's own text.

## Ingestion and normalization

Each importer is its own function, so one failing source never blocks another.
All of them write the same shape into `news_articles`:

- `uid` is a stable id from the source (for example `quillmonitor:<id>`), so a
  re-sync updates the row instead of adding a copy.
- `title`, `summary`, `content`, `link` (the original report), `source_name`,
  `source_url`, `category`, `severity`, `tags`, `affected_technologies`,
  `cve_id` and `published_at` (for QuillMonitor, the incident date).
- `created_at` is when Digibastion stored the record. QuillMonitor syncs rewrite
  `updated_at` on every run, so nothing uses `updated_at` as a "last changed"
  date.
- `metadata` holds the source-specific fields, so the public schema stays the
  same when a source is added.

The `metadata` keys that matter:

| Key | Meaning |
| --- | --- |
| `provider` | `quillmonitor`, `web3-incidents` (older rows: `web3`), `slowmist`, or empty for RSS |
| `is_web3_incident` | true for a Web3 incident, including unconfirmed ones |
| `security_domain`, `taxonomy_version`, `classification_reasons` | How the classifier filed the record, so a classifier change can be reviewed |
| `classification_relevant` | false hides a rejected RSS record from the feed and from email, while keeping it for audit |
| `verification_status` | QuillMonitor's `verified` or `unverified` |
| `duplicate_of_uid` | set on a record that was merged into another one |
| `sources` | every report merged into this record, each with its link |
| `amount_lost_usd`, `amount_display`, `amount_parser` | the reported loss, as a number and as shown |
| chain and attack method fields | as the source reports them; only QuillMonitor reports a chain |

Every importer run writes one row to `threat_intel_ingestion_runs` with counts,
timing and a short error summary, never the provider's raw payload or a
credential. `/admin/cron` and the admin health panel read these rows through
`get_threat_intel_health`.

## Severity

One rubric, in `supabase/functions/_shared/incident-severity.ts`, is used by
every incident importer:

1. A reported loss of $50M or more is **critical**.
2. A reported loss of $10M or more is **high**.
3. An attack method that matches private-key compromise, access control,
   oracle manipulation, reentrancy or flash loan is **high** even with no
   disclosed loss.
4. Any other disclosed loss above $0 is **medium**.
5. Everything else is **low**.

RSS items keep the severity from the RSS classifier, which can also be `info`.

## One record per incident

Several trackers often report the same hack, sometimes under different titles.
`supabase/functions/_shared/incident-dedup.ts` decides when two records are the
same incident. Every importer runs it on write, and `dedupe-incidents` runs it
over history when an admin asks.

- Across sources, two records match only on high-confidence evidence: the same
  normalized project name, and either the same incident date or dates within
  two days plus one more matching fact (the same positive loss, the same attack
  method or the same reference link). A loss of zero is not evidence.
- Records with different names match only when they share an identical dated
  social-post reference, the same incident date and the same positive loss.
- Two QuillMonitor records merge only on the same name, date and loss. The
  verified one wins, then the smaller `uid`.
- When sources compete for the surviving record, QuillMonitor comes first, then
  Web3 Is Going Just Great, then SlowMist.
- The losing record keeps its row, gets `duplicate_of_uid`, and adds its link to
  the survivor's `sources`. Opening a merged record's URL redirects to the
  survivor.
- There is no fuzzy name matching. A wrong merge hides a real incident, which
  is worse than showing a duplicate.

## Confirmed and unconfirmed

Digibastion never verifies incidents and never says it does. QuillMonitor marks
each incident `verified` or `unverified`; the site shows these as
**Confirmed** and **Unconfirmed**. Records from other sources have no status
label, because those sources do not publish one.

When a status changes (confirmed, revised or retracted), the importer logs it in
`incident_status_events` through `log_incident_status_change`. Telegram edits
the original post in place. Email subscribers get a follow-up when an incident
they were alerted about is retracted or upgraded to critical. Subscribers who
set `include_preliminary` to false get no alerts for unconfirmed incidents; it
defaults to true.

## The feed and its RPCs

The `/threat-intel` page reads `news_articles` through public, read-only
Postgres functions, called with the anon key:

| RPC | Used for |
| --- | --- |
| `search_news_articles`, `count_news_articles` | the paged, filtered list |
| `threat_intel_stats` | totals and loss for the whole filtered result, not just the page |
| `threat_intel_facets` | counts per chain and attack type for the filter chips |
| `get_weekly_newsletter(date)` | one weekly report, without its private archive fields |
| `list_weekly_newsletters(limit)` | the weekly archive at `/threat-intel/weekly` |
| `get_top_leaderboard_ids`, `get_subscriber_count` | the leaderboard and the subscriber count |

The feed RPCs hide merged records (`duplicate_of_uid` set) and rejected records
(`classification_relevant = false`). The default view is Web3 incidents; "All
Intelligence" adds the security news.

`threat-intel-api` is a separate, key-gated partner API: a POST with an
`x-api-key` header, rate-limited, with usage logged in `api_usage_logs`. Keys
are managed at `/admin/api-keys`. It is not a public API.

## Delivery

### Telegram

`post-telegram-alerts` runs at :20 and :50, three minutes after each
QuillMonitor sync. It posts Web3 incidents from QuillMonitor that were stored in
the last 24 hours and happened in the last 7 days, so a backfill of old
incidents does not flood the channel. Other sources are not posted. Each post
names and links its source, says "Powered by QuillMonitor", links the incident
page, and labels any AI-written summary. When an incident's status changes, the
post is edited to show CONFIRMED or RETRACTED.

On Mondays at 01:00 the same function posts a link to the new weekly report
(`{"mode":"weekly"}`).

Settings, by name: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHANNEL_ID`,
`TELEGRAM_TEST_CHANNEL_ID`, `TELEGRAM_POSTING_ENABLED` (`true` posts, `test`
does a dry run, anything else posts nothing) and `TELEGRAM_MIN_SEVERITY`
(`low` when unset). Posts are recorded in `telegram_posts`, which also stops a
post from going out twice.

### Email alerts

`send-critical-alerts` runs at :25 and :55. It collects critical and high
records from the last six hours, matches them against each subscriber who
chose real-time alerts (categories, technologies, chains, content scope,
severity threshold and `include_preliminary`), and sends one email per
subscriber per run. `email_sends` is an idempotency ledger, so a retried run
does not send twice, and `notification_log` keeps the per-article record.
Follow-up emails go out for retractions and upgrades to critical.

### Daily brief and weekly report

- `build-daily-newsletter` runs at 00:05 every day and writes the day's issue to
  `newsletter_issues`.
- `build-weekly-newsletter` runs at 00:10 on Mondays. It builds the weekly
  report from the week's incidents. With `WEEKLY_AI_ENABLED`, an AI pass writes
  the narrative (model `WEEKLY_AI_MODEL`, default `google/gemini-2.5-pro`), and
  a validator rejects any name, number or claim that is not in the data.
  Without it, a template is used.
- The weekly report is public at `/threat-intel/weekly/<YYYY-MM-DD>` (the
  Monday's date) as soon as it is built, whether or not emails are sending.
- `send-newsletters` runs every 15 minutes and sends each subscriber's issue at
  their chosen local time. It sends nothing to subscribers until
  `NEWSLETTER_POSTAL_ADDRESS` is set. Setting that address is the launch switch.
- The legacy `send-digest-emails` also runs every 15 minutes and keeps sending
  the old digests until the postal address is set. Then it stands down on its
  own (`skipped: newsletters_live`).

### Subscriptions and compliance

- Double opt-in: `submit-form` stores the subscription and sends a
  confirmation link; `verify-email` confirms it. Unconfirmed subscriptions are
  deleted after 7 days.
- Consent audit: `consent_source`, `consent_at` and a hash of the IP address at
  consent (`consent_ip_hash`) are stored on the subscription.
- One-click unsubscribe (RFC 8058): every alert and newsletter carries
  `List-Unsubscribe` and `List-Unsubscribe-Post` headers handled by
  `one-click-unsubscribe`. Every email also links to the manage page.
- Suppressions: `resend-webhook` checks Resend's signature
  (`RESEND_WEBHOOK_SECRET`) and adds bounced and complaining addresses to
  `email_suppressions`. Senders skip suppressed addresses.
- Tracking: only the legacy digest uses `email-tracking`, which records opens
  and clicks with a hashed IP, country, device and email client in
  `email_events`. Alerts and the new newsletters carry no tracking pixel.
- Links to our own pages in emails, Telegram posts and share buttons carry UTM
  tags; see [SEO_AND_DISTRIBUTION.md](SEO_AND_DISTRIBUTION.md). Links to sources
  are never tagged.
- Links that carry a token (`/verify-email`, `/manage-subscription`,
  `/unsubscribe`) are never tagged and are kept out of search engines.

## SEO and indexing

Search engines and AI answer engines find new pages four ways: a dynamic
sitemap and a Google News sitemap served by `generate-sitemap` and listed in
`robots.txt`; IndexNow pings from `ping-indexnow` at :22 and :52; RSS, Atom and
JSON feeds from `threat-intel-feed`; and per-page HTML written at build time.
Only Web3 incidents are indexed. Security-news records from RSS are relays of
other sites' articles, so their pages carry `noindex, follow` and stay out of
the sitemaps, feeds and pings. [SEO_AND_DISTRIBUTION.md](SEO_AND_DISTRIBUTION.md)
has the details and the checks.

## Routes

From `src/App.tsx`:

| Route | What it is |
| --- | --- |
| `/` | Home: checklists by category and the latest alerts |
| `/category/:categoryId` | One checklist |
| `/threat-intel` | The feed, with filters and the Subscribe tab (`?tab=subscribe`) |
| `/threat-intel/:articleId` | One record (UUID). A merged record redirects to the survivor. |
| `/threat-intel/methodology` | How sources, severity, merging and status work |
| `/threat-intel/weekly` | Weekly report archive |
| `/threat-intel/weekly/:weekStart` | One weekly report (Monday's date) |
| `/faq` | Plain questions and answers |
| `/quiz`, `/quiz-result`, `/leaderboard` | The OpSec self-check and its results |
| `/share` | Share your checklist progress |
| `/articles`, `/articles/:slug` | Guides |
| `/tools`, `/links` | Tools and links directories |
| `/services`, `/services/opsec-consulting`, `/services/full-stack-review`, `/contact` | Services and contact |
| `/about`, `/support`, `/license` | About the project |
| `/manage-subscription`, `/unsubscribe`, `/verify-email` | Email-link destinations; not indexed |
| `/news` | Redirects to `/threat-intel` (in the browser) |
| `/present` | Redirects to `/about` (in the browser) |
| `/admin`, `/admin/analytics`, `/admin/cron`, `/admin/api-keys` | Private admin pages; the functions behind them check the admin role |
| `*` | Not found |

## Edge functions

34 functions, each with a `[functions.<name>] verify_jwt = false` entry in
`supabase/config.toml`. The gateway does not check callers; every function
checks them itself. "Cron" below means a timing-safe comparison against
`CRON_SECRET`; most cron functions also accept the service-role key or an admin
user's token.

| Group | Function | Who may call it | What it does |
| --- | --- | --- | --- |
| Ingestion | `fetch-quillmonitor-incidents` | cron, service role, admin | QuillMonitor sync, status events, same-source merge |
| | `fetch-web3-incidents` | cron, service role, admin | Web3 Is Going Just Great through Firecrawl |
| | `fetch-slowmist-incidents` | cron, service role, admin | SlowMist; off unless `SLOWMIST_INGESTION_ENABLED=true` |
| | `fetch-rss-news` | cron, service role, admin | RSS feeds, classifier, `reclassify` mode (dry run by default) |
| | `summarize-article` | cron, service role, admin | AI summaries |
| | `dedupe-incidents` | cron, service role, admin | Merge history and repair legacy amounts; dry run by default; no schedule |
| | `firecrawl-scrape` | cron, admin | Admin scrape helper with a private-address blocklist |
| Delivery | `post-telegram-alerts` | cron, service role, admin | Incident posts, status edits, weekly link |
| | `send-critical-alerts` | cron, admin (test send) | Real-time alert emails and follow-ups |
| | `build-daily-newsletter`, `build-weekly-newsletter` | cron | Build issues into `newsletter_issues` |
| | `send-newsletters` | cron, admin (test send) | Send issues; gated on `NEWSLETTER_POSTAL_ADDRESS` |
| | `send-digest-emails` | cron, admin (test send) | Legacy digests; stands down at launch |
| | `resend-webhook` | Resend signature | Bounces and complaints to suppressions |
| | `email-tracking` | public | Open pixel and allowlisted click redirect for the legacy digest |
| Subscribers | `submit-form`, `verify-email`, `get-subscription`, `update-subscription`, `request-management-link`, `unsubscribe`, `one-click-unsubscribe` | public, with tokens and rate limits | Contact form, subscribe, confirm, manage, unsubscribe |
| Quiz | `start-quiz-session`, `submit-quiz-score` | public, signed session and rate limit | Server-scored self-check |
| | `cleanup-quiz-logs` | cron | Unused by cron; the SQL job `cleanup-quiz-submission-logs` does this |
| Search and sharing | `generate-sitemap` | public GET | Dynamic and news sitemaps |
| | `threat-intel-feed` | public GET | RSS, Atom and JSON feeds |
| | `ping-indexnow` | cron, service role, admin | IndexNow submissions |
| | `og-image` | public GET | Preview images for incidents, weekly reports and quiz results |
| Admin | `admin-analytics`, `admin-api-keys` | admin | Admin pages |
| | `cron-monitor` | cron, admin | Hourly job health check; emails `app_config.ADMIN_ALERT_EMAILS` on failure |
| | `weekly-admin-summary` | cron | Monday summary email to admins |
| Partner | `threat-intel-api` | `x-api-key` | Key-gated partner API |

Shared logic lives in `supabase/functions/_shared/`. These modules are plain
TypeScript with no Deno or URL imports, so the app, the build and Vitest can
import them too. The main ones: `incident-dedup`, `incident-severity`,
`incident-fields`, `quillmonitor`, `slowmist`, `rss-classifier`,
`web3-taxonomy`, `publishable` (which rows may be listed), `site-urls`,
`attribution`, `incident-answer`, `share-links`, `sitemap-render`,
`feed-render`, `indexnow`, `og-card`, `telegram-alerts`, `alert-email`,
`newsletter-*`, `weekly-*`, `email-compliance`, `email-ledger` and
`resend-*`.

## Scheduled jobs

The final state after migration `20261014090000_seo_indexing.sql`. All times
are UTC. HTTP jobs call `public.record_cron_http_request(jobname, url, body,
timeout)`. It only accepts URLs on this project's functions host, adds the cron
secret through `public.get_cron_auth_headers()`, and records the request id in
`cron_http_requests` so `/admin/cron` can match each job to its HTTP response.

| Job | Schedule | Calls |
| --- | --- | --- |
| `fetch-rss-news-hourly` | `15 * * * *` | `fetch-rss-news` |
| `fetch-quillmonitor-incidents-30min` | `17,47 * * * *` | `fetch-quillmonitor-incidents` |
| `post-telegram-alerts-30min` | `20,50 * * * *` | `post-telegram-alerts` |
| `ping-indexnow` | `22,52 * * * *` | `ping-indexnow` `{"mode":"run"}` |
| `send-critical-alerts-30min` | `25,55 * * * *` | `send-critical-alerts` |
| `fetch-web3-incidents-6hourly` | `30 */6 * * *` | `fetch-web3-incidents` |
| `summarize-articles-6hourly` | `45 */6 * * *` | `summarize-article` `{"limit":20}` |
| `send-newsletters-00`, `-15`, `-30`, `-45` | `0,15,30,45 * * * *` | `send-newsletters` |
| `send-digests-hourly-00`, `-15`, `-30`, `-45` | `0,15,30,45 * * * *` | `send-digest-emails` (legacy) |
| `build-daily-newsletter` | `5 0 * * *` | `build-daily-newsletter` |
| `build-weekly-newsletter` | `10 0 * * 1` | `build-weekly-newsletter` |
| `post-weekly-telegram` | `0 1 * * 1` | `post-telegram-alerts` `{"mode":"weekly"}` |
| `weekly-admin-summary` | `5 7 * * 1` | `weekly-admin-summary` |
| `cron-monitor-hourly` | `7 * * * *` | `cron-monitor` |
| `cleanup-expired-rate-limits` | `23 * * * *` | SQL `cleanup_expired_rate_limits()` |
| `cleanup-unverified-subscriptions` | `40 3 * * *` | SQL: delete unconfirmed subscriptions older than 7 days |
| `cleanup-quiz-submission-logs` | `0 0 * * *` | SQL `cleanup_old_submission_logs()` |

That is 23 jobs. SlowMist and `dedupe-incidents` have no schedule on purpose.
`20261014090000` also removes `fetch-web3-incidents-6h`, an old duplicate of the
6-hourly Web3 import that no earlier migration removed.

## Data model

All tables are in the `public` schema with row-level security on.

| Area | Tables |
| --- | --- |
| Feed | `news_articles`, `incident_status_events`, `rss_feeds`, `security_keywords` |
| Operations | `threat_intel_ingestion_runs`, `cron_http_requests`, `cron_health_snapshots`, `app_config`, `rate_limit_counters` |
| Subscribers and email | `subscriptions`, `notification_log`, `email_sends`, `email_events`, `email_suppressions`, `newsletter_issues` |
| Telegram | `telegram_posts` |
| Quiz | `quiz_sessions`, `quiz_scores`, `quiz_submission_log` |
| Admin | `user_roles`, `api_keys`, `api_usage_logs`, `api_key_admin_audit` |

`subscriptions` holds the channels (`wants_realtime`, `wants_daily`,
`wants_weekly`), filters (`categories`, `technologies`, `chains`,
`content_scope` of `all` or `web3-incidents`, `severity_threshold`,
`include_preliminary`), `timezone`, the consent fields and the confirmation and
management tokens. A trigger keeps the older `frequency` column in step with
the `wants_*` columns.

`threat_intel_ingestion_runs.pipeline` is one of `rss`, `web3-incidents`,
`quillmonitor`, `slowmist`, `ai-summary`, `critical-alerts`, `digest-emails`,
`telegram`, `newsletter-build` or `indexnow`.

## Security model

- Row-level security is on for every table. The anon key can read
  `news_articles` and call the public RPCs above. Subscriber, email, Telegram
  and operations tables are reached by edge functions using the service role;
  a few admin tables (API keys and their usage logs) also allow reads by a
  signed-in admin.
- The browser holds only the public anon key and writes no table directly.
  Subscriptions, quiz scores and the contact form go through edge functions
  with rate limits (`consume_rate_limit`).
- Every function checks its caller itself (see the function table). Cron
  secrets are compared in constant time, never with `===`.
- Admin pages are hidden routes, but hiding is not the protection: every admin
  function checks the `admin` role in `user_roles`.
- No secret is in this repository. Secrets live in Lovable Cloud and are named
  in docs, never quoted. `src/utils/__tests__/publicFilesNoSecrets.test.ts`
  scans `public/`, `supabase/functions/` and `edge/` for service-role tokens,
  Resend and webhook keys, Telegram bot tokens and personal email addresses.
- Known gap: production sends no Content-Security-Policy or anti-framing
  header (see [Hosting and runtime](#hosting-and-runtime)). The 2026-09-27
  review in [security/2026-09-27-source-review.md](security/2026-09-27-source-review.md)
  tracks it as open.

Report vulnerabilities as described in [SECURITY.md](../SECURITY.md).

## Releasing

1. Merge to `main`.
2. Run the release prompt for the change in Lovable (`docs/LOVABLE_*_RELEASE.md`).
   It lists the migrations in order, the functions to deploy and the secrets to
   check by name.
3. Click Publish in Lovable.
4. Run the checks in the release doc. For this branch,
   [LOVABLE_SEO_RELEASE.md](LOVABLE_SEO_RELEASE.md) checks the IndexNow key
   file, `robots.txt`, both sitemaps, the feeds, the prerender layout and the
   new cron job, each with a `curl` command and its expected output.

After any release, also check `/admin/cron` for failing jobs and the admin
health panel for stale sources.

## Access needed to run and check production

- The Lovable project: publishing, View Backend, secrets, function logs.
- GoDaddy: DNS for `digibastion.com`, including the Resend mail records.
- Google Search Console and Bing Webmaster Tools for `https://www.digibastion.com`.
- Resend: domain status, webhook and suppressions.
- The Telegram bot and the `@digibastion` channel.
- Vantage has its own repository and deployment.

## Content and licensing

Each checklist item, guide, tool listing and incident note should have an owner
and a review date. Year-specific claims, prices and product behavior go stale
and need checking against primary sources before publishing. Feed summaries and
editorial guides stay visibly separate: a feed record is not an article.

`LICENSE` is MIT plus a Commons Clause restriction on selling the software, so
the repository is source-available rather than open source. The owner decides
whether that changes; this document does not interpret the license.
