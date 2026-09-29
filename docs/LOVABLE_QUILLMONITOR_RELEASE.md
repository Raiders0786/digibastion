# Lovable QuillMonitor incremental-sync release

Use this only after the corresponding local commit is pushed to GitHub `main`.
The application and edge-function code are prepared in the repository; Lovable
should deploy and verify the managed backend without rewriting source files.

## One-shot Lovable prompt

```text
Use View Backend for the existing managed Lovable Cloud project and use GitHub
main commit <EXACT_SHA>. Do not edit or regenerate application source, create
another backend, expose credentials/provider payloads, or replay old migrations.

1. Confirm QUILLMONITOR_API_KEY is configured, without displaying or rotating it.
2. Start this deployment away from minutes 17 and 47, then apply only this new migration:
   supabase/migrations/20260929153000_schedule_quillmonitor_incremental_sync.sql
3. Deploy the repository version of fetch-quillmonitor-incidents and its shared
   imports. Confirm platform JWT verification is disabled for this function as
   declared in supabase/config.toml; the function itself must continue enforcing
   CRON_SECRET, service-role, or authenticated-admin authorization.
4. Confirm the old fetch-quillmonitor-incidents-6hourly job is absent and the new
   fetch-quillmonitor-incidents-30min job is active at minutes 17 and 47.
5. Invoke fetch-quillmonitor-incidents once with
   {"mode":"full","max_pages":100,"page_size":100}. Confirm every
   provider page is fetched through nextPage=null, persistence errors are zero,
   and the private QUILLMONITOR_SYNC_SINCE app_config cursor is saved only after
   the complete successful write. Confirm the migration's private cursor helper
   keeps this timestamp monotonic if two authorized runs overlap. Report sanitized aggregate verified,
   preliminary, inserted, updated, invalid, page, and cursor results only.
6. Invoke it again with {} to verify incremental polling. A zero-change result is
   valid and must report success. Confirm page 1 captures syncUntil, later pages
   use the same since/until window, and the cursor advances to syncUntil only
   after the final page and all writes succeed.
7. Verify with read-only queries that Bitget and the September 2026 incidents
   exist; unverified records have metadata.verification_status="unverified";
   verified records have "verified"; blank provider descriptions display
   "Summary pending"; and no synthetic TEST protocol record exists.
8. Verify an unauthorized request is denied, while the cron and an authenticated
   admin invocation succeed. Confirm no provider key is present in URLs, logs,
   ingestion-run metadata, news_articles, or browser-delivered code.
9. Return a concise report with the deployed Git revision, migration/job state,
   sanitized run totals, verification results, and any remaining action. Do not
   make unrelated changes.
```

After Lovable reports success, verify the production deployment from that same
Git commit and smoke-test `/threat-intel`: Preliminary labels, status transitions,
`Summary pending`, linked Powered by QuillMonitor attribution, and no console or
network errors.
