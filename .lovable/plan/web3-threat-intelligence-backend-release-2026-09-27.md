# Web3 threat-intelligence backend release

## Scope
Apply only the uploaded release procedure to the existing managed backend. Do not rewrite application source, create another backend, expose secrets or provider payloads, or make unrelated changes.

## Release sequence
1. Apply the existing `20260927180000_add_subscription_content_scope.sql` migration exactly as committed.
2. Deploy only the eight listed backend functions from the repository, including their shared imports.
3. Verify the subscription scope, canonical Web3 filtering rules, classification exclusion, and metadata indexes before any historical updates.
4. Run RSS historical reclassification in bounded 250-row dry-run batches until complete. Stop if writes fail or the distribution is anomalous.
5. If healthy, repeat the complete batch sequence with writes enabled, without triggering email functions.
6. Run one normal refresh for RSS, Web3 incidents, and QuillMonitor, then inspect sanitized ingestion totals and health.
7. Perform read-only checks for feed scope intersections, classification exclusions, default subscription scope, and recent-email matching. Use only a temporary/test subscription for the scope round-trip, preserving real subscriber preferences.
8. Send one digest preview only if an already verified admin test subscription exists. Verify both formats contain the incident marker and linked QuillMonitor attribution; otherwise skip safely.
9. Report migration and deployment status, backfill totals, ingestion health, verification results, exact completion time, and any remaining action.

## Safety gates
- Stop before the write backfill if the dry run has write errors or clearly abnormal results.
- Never reveal addresses, credentials, provider payloads, or other sensitive data.
- Do not alter schedules, secrets, unrelated data, frontend code, or non-listed functions.
