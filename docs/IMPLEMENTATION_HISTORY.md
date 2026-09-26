# Implementation history

This checklist records completed production hardening work from repository and
operator notes. It is historical, not a live status dashboard: schedules,
email delivery, secrets, deployed function revisions, and database policies
must still be checked in the owning platforms. For the current product map and
priorities, see [`PRODUCT_AND_ARCHITECTURE.md`](PRODUCT_AND_ARCHITECTURE.md) and
[`ROADMAP.md`](../ROADMAP.md).

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
