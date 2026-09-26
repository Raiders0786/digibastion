# QuillMonitor Threat Intelligence Integration

## Outcome

QuillMonitor incidents will appear as a trusted, clearly attributed source in the existing Threat Intelligence feed, detail views, immediate alerts, and subscriber digests. Existing RSS, Web3, quiz, admin, and email flows remain operational if QuillMonitor is unavailable.

## Build

1. Add a protected QuillMonitor sync function using the encrypted API key, strict response checks, bounded pages, request timeouts, stable incident IDs, and safe operational logs.
2. Normalize each incident into the existing feed with project, chain, QuillMonitor category, attack method, loss amount, reference link, incident date, source label, tags, and deterministic severity.
3. Map protocol and financial exploits to DeFi Exploits, general blockchain incidents to Web3 Security, and human or process compromises to Operational Security while preserving QuillMonitor's original labels as subcategories.
4. Add a six-hour scheduled sync and include it in existing operational monitoring. Keep every existing source independent.
5. Add an administrator QuillMonitor refresh action alongside existing feed refresh actions.
6. Show the source, project, chain, attack method, and loss cleanly on feed cards and incident details, plus the required linked “Powered by QuillMonitor” attribution.
7. Carry the same structured context into immediate alerts and daily or weekly digest emails while preserving subscriber category, severity, frequency, tracking, and unsubscribe behavior.
8. Tighten future RSS categorization and severity signals to reduce obvious Web3 and Operational Security false positives. Do not bulk-rewrite historical records in this release.

## Technical details

- Reuse `news_articles`; QuillMonitor-specific fields live in its existing `metadata` JSON so public API clients remain compatible.
- Use `quillmonitor:<incident-id>` as the stable UID and update existing QuillMonitor records when provider data changes.
- Poll newest-first with a bounded page count per run. A scheduled six-hour reconciliation provides a maximum six-hour ingestion delay without adding a high-frequency polling cost.
- Use the existing CRON, service-role, and administrator authorization pattern. The API key remains server-only.
- Validate URLs, dates, numeric loss values, pagination, and response shape before writes.
- Test normalization and classification, then verify the deployed function, newest-first feed, administrator refresh, attribution, alert rendering, digest rendering, and scheduled-job health.