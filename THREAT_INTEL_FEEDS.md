# Threat-intelligence sources

The live public feed is at
[`/threat-intel`](https://www.digibastion.com/threat-intel). The historical
`/news` route redirects there.

This document describes source policy and architecture. It intentionally does
not label a static list of URLs “active”: source enablement, failures, and
freshness are runtime facts held in the database and private operations view.
The previous hand-maintained list had already diverged from migrations and
production operations.

## Source model

Digibastion currently supports three source families:

- RSS or structured advisory/news feeds configured in `rss_feeds`;
- a protected Web3 incident collector;
- a protected QuillMonitor integration.

Each provider is fetched independently by a server-side Edge Function and
normalized into `news_articles`. Provider-specific incident fields belong in
`news_articles.metadata`; they do not change the stable public feed schema.
Sanitized aggregate outcomes are recorded in
`threat_intel_ingestion_runs` for private operational health.

The public feed can filter on normalized meaning, including Web3 incidents and
active alerts, without making any one provider its own product area. Provider
attribution remains visible on records where it is required or useful.

## What production operators must verify

The database and private admin view, not this file, are authoritative for:

- enabled and disabled RSS records;
- current feed URLs and parser behavior;
- last attempt and last successful ingestion;
- records added or refreshed;
- provider timeouts, rate limits, and partial failures;
- data-quality warnings and latest record time;
- scheduled-job outcomes;
- email alert and digest health.

A migration shows intended configuration at a point in time but does not prove
that the production database, schedule, or credential is healthy.

## Proposing a source

Open a focused GitHub issue with:

1. Source name, owner, homepage, and machine-readable endpoint.
2. The gap it fills in the existing feed.
3. Publication cadence, geographic or ecosystem coverage, and expected volume.
4. Stable identifiers and a deduplication strategy.
5. Licensing, attribution, redistribution, and retention terms.
6. Authentication, rate limits, timeout behavior, and expected operating cost.
7. Sample records with sensitive data removed.
8. Proposed category, severity, incident fields, and failure behavior.

Prefer primary advisories, public incident disclosures, and reputable sources
with stable structured output. Do not propose scraped paywalled material,
credentialed sources without permission, marketing feeds disguised as news, or
sources that cannot be attributed and verified.

## Integration requirements

New providers must:

- keep credentials server-only;
- use an isolated ingestion function so one provider cannot block others;
- validate response shape, URLs, dates, pagination, and numeric fields;
- bound pages, concurrency, response size, and execution time;
- generate deterministic identifiers and avoid duplicate public records;
- sanitize logs and errors;
- store only normalized public content and approved metadata;
- write aggregate operational outcomes without raw payloads or secrets;
- preserve public-write restrictions and administrator/cron authorization;
- include tests for malformed input, timeouts, duplicates, partial failure, and
  denied authorization;
- state the required public attribution.

Changes to feed documentation alone do not activate a source. Activation also
requires reviewed server code or database configuration, protected credentials,
deployment, and a successful production health check by an authorized owner.
