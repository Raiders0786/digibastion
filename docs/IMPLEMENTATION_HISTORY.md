# Implementation history

This checklist records completed production hardening work from repository and
operator notes. It is historical, not a live status dashboard: schedules,
email delivery, secrets, deployed function revisions, and database policies
must still be checked in the owning platforms. For the current product map and
priorities, see [`PRODUCT_AND_ARCHITECTURE.md`](PRODUCT_AND_ARCHITECTURE.md) and
[`ROADMAP.md`](ROADMAP.md).

- [x] Diagnose current edge function and scheduled-job failures.
- [x] Hide privileged Threat Intel actions from public visitors.
- [x] Increase digest and critical-alert request timeouts.
- [x] Replace estimated cron health with real attributed outcomes.
- [x] Disable the stale NVD RSS source.
- [x] Deploy and verify all repairs without weakening authorization.
- [x] Repair and verify manual admin refresh for RSS, Web3 incidents, and AI summaries.

## Production integrity and operations hardening

- [x] Make Active Alerts independent of feed filters and pagination.
- [x] Make quiz scoring server-authoritative and prevent session restart/token sharing.
- [x] Move API-key mutations behind an audited admin function and preserve usage history.
- [x] Normalize admin authorization failures and loading states.
- [x] Schedule unattended cron monitoring with durable alert outcomes.
- [x] Add durable rate limits to email-triggering public endpoints.
- [x] Restrict unnecessary `SECURITY DEFINER` execution grants.
- [x] Validate and optimize the slow news query.
- [x] Label dated analytics, remove unsupported rating schema, and redirect legacy news URLs.
- [x] Harden Firecrawl URL checks and API rate-limit concurrency.
- [x] Retain required quiz cleanup ownership and remediate dependencies safely.
- [x] Run regression, build, and end-to-end validation.

## SEO and accessibility corrections

- [x] Restore sequential headings on category detail pages.
- [x] Add accessible names to quick newsletter subscription fields.
- [x] Associate every contact form label with its field.

## Production domain SEO migration

- [x] Connect root and `www` custom domains with `www` as primary.
- [x] Switch sitemap and crawler references to `www.digibastion.com`.
- [x] Publish and verify live custom-domain metadata, redirects, and sitemap.
- [x] Verify the domain property and submit the `www` sitemap in Search Console.

## Security findings repair

- [x] Prevent public subscription requests from replacing verified settings or management links.
- [x] Validate tracking IDs and remove subscriber details from operational logs.
- [x] Escape quiz sharing metadata and restrict administrator test-email recipients.
- [x] Run full regression checks, deploy changed functions, and publish the verified release.

## Threat-intelligence integrations

- [x] Add secure, scheduled QuillMonitor incident ingestion with validation and deduplication.
- [x] Normalize project, chain, attack method, loss, category, severity, and source metadata.
- [x] Add QuillMonitor refresh controls and rich incident presentation to Threat Intel.
- [x] Include QuillMonitor context in immediate alerts and daily or weekly digests.
- [x] Tighten future RSS Web3, OpSec, and severity classification without disrupting existing feeds.
- [x] Replace provider-only filtering with a cross-source Web3 Incidents view.
- [x] Keep critical/high records synchronized into Active Alerts.
- [x] Add private source freshness and data-quality monitoring.
- [x] Show clear QuillMonitor attribution in the unified feed and Active Alerts.

## Repository documentation consolidation

- [x] Replace expired quarter-based promises with a shipped/validated/planned roadmap.
- [x] Document the relationship between Digibastion, VANTAGE, and security services.
- [x] Align setup and contribution instructions with the actual package scripts and data types.
- [x] Replace the stale static feed-status catalog with source policy and runtime verification guidance.
- [x] Archive superseded Lovable plans and remove duplicate contribution guides.
- [x] Correct repository licensing language to source-available pending an owner decision.

## QuillMonitor incremental sync and SlowMist (2026-09-29)

- [x] Sync QuillMonitor every 30 minutes from a stored cursor (`app_config.QUILLMONITOR_SYNC_SINCE`), including unverified incidents, so status changes on older incidents are picked up.
- [x] Build the SlowMist Hacked importer with fact-only storage and cross-source duplicate checks, and leave it switched off (`SLOWMIST_INGESTION_ENABLED`, no cron) until SlowMist gives written permission.

## Telegram alerts (2026-10-10)

- [x] Post new QuillMonitor Web3 incidents to `@digibastion` at :20 and :50 UTC, with the source named and linked, "Powered by QuillMonitor", and AI-written summaries labelled.
- [x] Edit posts in place when QuillMonitor confirms or retracts an incident.
- [x] Gate posting with `TELEGRAM_POSTING_ENABLED` (`true`, `test` or off) and `TELEGRAM_MIN_SEVERITY`.

## Threat Intel revamp, phase 0: one record per incident (2026-10-10)

- [x] Share one cross-source duplicate matcher (`_shared/incident-dedup.ts`) across every importer, with no fuzzy name matching.
- [x] Add `dedupe-incidents` to merge history, dry run by default, with merged records keeping their links in the survivor's `sources`.
- [x] Repair legacy Web3 Is Going Just Great amounts that were stored a million times too large (`amount_parser: v2`).
- [x] Merge QuillMonitor's own duplicate listings on the exact name, date and loss, keeping the verified record.

## Threat Intel revamp, phase 2: the feed page (2026-10-10)

- [x] Add `threat_intel_stats` and `threat_intel_facets` so totals and filter counts cover the whole result, not one page.
- [x] Default to Web3 incidents, with filters for status, chain, attack type and source, and a severity sort.
- [x] Rebuild the incident cards and incident page, and redirect merged records to the survivor.
- [x] Publish the methodology page at `/threat-intel/methodology`.

## Threat Intel revamp, phase 3: newsletters and email compliance (2026-10-11)

- [x] Add subscription channels (real-time, daily, weekly), time zones, chain filters and `include_preliminary`, plus the `newsletter_issues`, `email_sends` and `incident_status_events` tables.
- [x] Add email compliance: double opt-in with a consent audit, RFC 8058 one-click unsubscribe, and a signed Resend webhook that suppresses bounced and complaining addresses.
- [x] Rewrite real-time alerts as a 30-minute batch that respects each subscriber's channels, with follow-ups for retractions and upgrades to critical.
- [x] Build the daily brief (00:05 UTC) and the weekly report (Mondays 00:10 UTC, optional grounded AI pass with a validator).
- [x] Publish each weekly report at `/threat-intel/weekly/<YYYY-MM-DD>` and post its link to Telegram on Mondays at 01:00 UTC.
- [ ] Start sending newsletters: waits for `NEWSLETTER_POSTAL_ADDRESS`. Until then the legacy digests keep running.

## SEO, answer engines, distribution and docs (branch `seo-aeo-docs`, 2026-10-11)

Built and tested; released when the owner runs [`LOVABLE_SEO_RELEASE.md`](LOVABLE_SEO_RELEASE.md).

- [x] Rebuild `generate-sitemap` as a dynamic sitemap of indexable incidents and weekly reports with an honest `lastmod`, plus a Google News sitemap, both listed in `robots.txt`.
- [x] Add `ping-indexnow` (cron at :22 and :52 UTC) with a cursor, a key file in `public/`, and a one-time backfill mode.
- [x] Add RSS, Atom and JSON feeds (`threat-intel-feed`).
- [x] Add one route metadata registry, per-page HTML written at build time, `/faq`, the weekly archive at `/threat-intel/weekly`, and generated `sitemap.xml`, `llms.txt` and `llms-full.txt`.
- [x] Keep security-news relays out of search (`noindex, follow`) and out of the sitemaps, feeds and pings.
- [x] Tag our own links in Telegram posts, emails and the new share bar with UTM parameters, credit sources in every email, and draw preview cards for incidents and weekly reports.
- [x] Add an optional Cloudflare Worker (inactive until DNS moves) for per-URL HTML, real redirects and security headers.
- [x] Move the roadmap to `docs/ROADMAP.md` and the 2026-09-27 security review to `docs/security/`, and rewrite the docs against the code.
