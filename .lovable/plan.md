# Unified Web3 Incidents Feed and Admin Health Center

## Outcome

Digibastion will present one chronological Threat Intel feed across RSS, existing Web3 collectors, and QuillMonitor. Visitors can narrow that combined feed with a prominent **Web3 Incidents** control, while QuillMonitor remains source attribution rather than a separate product area. Administrators get a private health view showing whether each source, email workflow, and scheduled update is operating correctly.

## Confirmed current state

- All providers already normalize into the shared `news_articles` feed, with provider details in `metadata`.
- The public page currently exposes a QuillMonitor-only source selector and separate QuillMonitor and Web3 refresh actions.
- The database currently contains 17 QuillMonitor records across DeFi and Operational Security, alongside Web3 records from other sources.
- QuillMonitor, the existing Web3 collector, RSS updates, critical alerts, and digests all have active schedules. QuillMonitor runs every six hours.
- The current admin cron page shows scheduled-job success and failure counts, but it does not provide a focused source-freshness view or data-quality summary.
- The QuillMonitor credential is stored as a protected backend secret. Public writes to threat records are blocked, and ingestion checks administrator, scheduled-job, or trusted service authorization.
- The latest available application security scan reports no findings, but several scanner results are stale. The database linter also reports six existing warnings about callable privileged helper functions, which require a narrow privilege review rather than automatic removal.

## Build

### 1. Make Web3 Incidents a cross-source feed view

- Remove the public QuillMonitor-only selector.
- Add an **All Threats / Web3 Incidents** segmented control near search and sorting.
- Define Web3 Incidents by normalized categories and incident metadata, not provider name, so qualifying RSS, existing Web3 collector, and QuillMonitor records appear together.
- Keep the default view as the full newest-first feed and preserve category, severity, date, search, pagination, deep links, cache, and offline behavior.
- Extend the existing search/count queries with an incident-view parameter rather than overloading the source filter.

### 2. Present incident facts without promoting the provider

- Label qualifying cards **Web3 Incident**, regardless of source.
- Show available project, chain, attack method, reported loss, and incident date directly on the card in a stable responsive layout.
- Keep provider attribution compact in card/detail source areas. Retain the required linked “Powered by QuillMonitor” attribution only for QuillMonitor-sourced records.
- Keep ordinary articles visually unchanged when structured incident facts are unavailable.

### 3. Unify administrator refresh actions

- Replace the public-page QuillMonitor action with one administrator-only **Refresh Web3 Incidents** action.
- The action will run the existing Web3 and QuillMonitor collectors independently, report each result separately, and refresh the combined feed after both finish.
- A failure from one provider will not suppress a successful result from the other.
- Keep RSS refresh and summarization independent.

### 4. Add a private Threat Intel health view

- Extend the existing admin operations area with a Threat Intel section rather than creating another disconnected dashboard.
- Show per pipeline: status, schedule, last attempted update, last successful run, most recent record time, records added or refreshed, failure count, and freshness warning.
- Include summary checks for duplicate stable IDs, invalid/missing incident fields, future-dated records, category distribution, severity distribution, and recent provider volume.
- Add administrator-only actions to refresh RSS and Web3 incidents, then show a clear per-source outcome.
- Link the admin analytics, operations, API key, and Threat Intel views through one consistent admin header that works on mobile.
- Reuse sanitized operational records only. Never return credentials, authorization headers, raw provider payloads, subscriber details, internal service URLs, or stack traces.

### 5. Make emails match the unified product model

- Keep immediate alerts and daily/weekly digests as one combined stream governed by existing subscriber categories, severity, frequency, and technology preferences.
- Label structured records **Web3 Incident** and show available project, chain, attack method, and reported loss.
- Do not create a QuillMonitor email section.
- Preserve required linked attribution only on QuillMonitor-derived items, plus existing tracking, management, unsubscribe, and escaping behavior.

### 6. Security and public-repository hardening

- Keep every external credential in protected secrets and every ingestion call server-side.
- Preserve server-side administrator authorization and blocked public writes; add no client-side role trust or credential-bearing configuration.
- Replace unnecessary provider-specific console output with short aggregate operational events and ensure errors exposed to the browser are sanitized.
- Keep source comments sparse and useful. Security will come from access control and secret isolation, not from hiding implementation details in comments.
- Review the six existing privileged-function warnings by checking who genuinely needs execution; revoke only unnecessary grants so cron, feed refresh, email delivery, quiz, and admin workflows remain intact.
- Run a fresh complete security scan before release because parts of the currently available scan are stale.

### 7. Verification and release gate

- Verify mixed-source newest-first ordering and that **Web3 Incidents** includes qualifying records from multiple sources.
- Test desktop and mobile feed controls, cards, incident details, pagination, cache, and deep links.
- Verify public users cannot trigger ingestion or access health data; verify administrators can refresh and inspect outcomes.
- Test provider timeout/partial-failure behavior, stable-ID deduplication, pagination, URL validation, and malformed-record rejection.
- Render and inspect critical-alert and digest emails for structured incidents and ordinary articles.
- Run frontend checks, ingestion/email tests, authorization smoke tests, database lint review, and a fresh security scan.
- Deploy changed protected functions and database updates only after these checks pass; publishing remains a separate explicit action.

## Technical details

- Keep `news_articles` as the only public feed table and retain provider-specific fields in `metadata`.
- Add a generic incident marker during normalization so filtering and presentation do not depend on `source_name`.
- Store aggregate ingestion outcomes in an admin-only operational table with explicit grants, row-level security, retention, and no raw payloads or secrets.
- Derive freshness from scheduled-run history plus latest ingested/published timestamps. Continue the existing six-hour QuillMonitor reconciliation, which limits provider delay to six hours without adding another polling job.
- Preserve `quillmonitor:<incident-id>` stable IDs and all existing independent schedules.
