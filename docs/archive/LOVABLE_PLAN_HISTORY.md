# Archived Lovable plan history

This is a short record of the one-time Lovable plans from September 2026,
up to 2026-09-26. Those plan files were removed from `.lovable/plan/` once
their outcomes were built, replaced or moved into the roadmap; their full text
is in Git history. Newer Lovable plans (from 2026-09-27 on) live in
`.lovable/plan/` again, and the plans written for this repo's own branches are
in `docs/superpowers/plans/`.

These entries are history, not evidence that anything in production is healthy
today. Before relying on an old completion note, check it again: the backend
through **View Backend** in the Lovable project, the site in Lovable hosting and
GoDaddy DNS, then Search Console, the email provider and Vantage. The managed
backend has no separate Supabase dashboard login.

## Search and production domain

- `complete-google-search-console-setup-2026-09-22.md` planned a temporary
  Lovable-domain sitemap and Search Console setup.
- `move-production-seo-to-www-digibastion-com-2026-09-22.md` superseded it by
  making `https://www.digibastion.com` the canonical production domain.

The domain migration is recorded in `docs/IMPLEMENTATION_HISTORY.md`. Current
technical SEO priorities are in `docs/ROADMAP.md`.

## Production integrity and operations

- `repair-edge-function-operations-2026-09-22.md` addressed privileged public
  controls, scheduled-request timeouts, truthful cron health, and a stale NVD
  feed.
- `production-integrity-and-operations-hardening-2026-09-22.md` covered active
  alert completeness, authoritative quiz scoring, admin audit history, durable
  rate limits, query performance, and regression checks.
- `security-findings-repair-and-production-release-2026-09-22.md` covered
  subscriber ownership, tracking validation, safe logs, quiz sharing output,
  admin email restrictions, dependency repair, and release checks.

Completed source changes are summarized in `docs/IMPLEMENTATION_HISTORY.md`.
Live job and delivery health remains a runtime check.

## Threat-intelligence integrations

- `quillmonitor-threat-intelligence-integration-2026-09-26.md` defined isolated
  protected ingestion, normalization into `news_articles`, metadata fields,
  provider attribution, schedules, and email presentation.
- `unified-web3-incidents-feed-and-admin-health-center-2026-09-26.md` changed
  the user model from provider-specific sections to a cross-source Web3
  incident view and added private source-health/data-quality reporting.

The lasting architecture rules are now in `AGENTS.md`,
`THREAT_INTEL_FEEDS.md`, and `docs/PRODUCT_AND_ARCHITECTURE.md`.
