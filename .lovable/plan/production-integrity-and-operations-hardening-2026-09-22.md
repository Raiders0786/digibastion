# Production integrity and operations hardening

## Goal
Protect the accuracy of security alerts, quiz results, administrator actions, and scheduled operations without disrupting the healthy feed ingestion, digest, or public-read workflows.

## P0: Fix trust-critical behavior

1. **Make Active Alerts independent and complete**
   - Load critical and high alerts with their own unfiltered database query instead of reusing the current Feed page and filters.
   - Give the alerts query its own loading, error, refresh, and realtime refresh behavior.
   - Keep the Feed filters and pagination unchanged.

2. **Make quiz results server-authoritative**
   - Send stable answer option identifiers for the server-issued question set.
   - Recalculate score, badges, and character rank in `submit-quiz-score`; ignore client-calculated leaderboard values.
   - Validate every answer belongs to the signed session before consuming it.
   - Mark a session complete only after validation and successful score handling, with a conditional update preventing double submission.
   - Reuse the server-returned result in the UI and prevent Back/Next from silently creating a second session.

3. **Preserve administrator audit history**
   - Replace hard deletion of API keys with revocation/soft deletion so the existing 176 usage logs remain attributable.
   - Add an immutable API-key admin audit table for create, revoke, and delete-equivalent actions.
   - Move API-key mutations behind an admin edge function that independently verifies the JWT and admin role.
   - Keep read access protected by existing RLS.

## P1: Make operations reliable

4. **Normalize admin authorization and loading states**
   - Use one shared handler for 401/403 responses across Analytics, Cron Monitor, and API Keys.
   - Clear stale admin state and redirect safely when access is revoked.
   - Add disabled/loading feedback to API-key refresh and mutation controls.

5. **Make cron monitoring unattended**
   - Allow `cron-monitor` to authenticate scheduled calls using the existing protected cron-secret pattern while retaining admin JWT access.
   - Schedule hourly health evaluation so alerts and snapshots do not depend on an admin opening the page.
   - Move alert recipients to protected configuration and support more than one address.
   - Record alert delivery outcomes for visibility in the admin UI.

6. **Replace ephemeral rate limits where abuse matters**
   - Add an atomic database-backed limiter for management-link and form/email-triggering endpoints.
   - Apply it by hashed IP and hashed email with expiry, avoiding storage of raw identifiers.
   - Leave low-risk read-only endpoints unchanged unless the same helper can be reused safely.

7. **Restrict database helper permissions**
   - Revoke public execution from maintenance, cleanup, cron-secret, and role-helper functions that do not need anonymous access.
   - Preserve intentionally public read helpers, such as the subscriber count and leaderboard reads.
   - Verify each grant against its frontend and cron call sites before migration.

## P2: Performance, clarity, and maintenance

8. **Optimize the slow news query safely**
   - Run `EXPLAIN (ANALYZE, BUFFERS)` for the exact severity/date/order query.
   - Add only the composite index justified by the plan, then compare latency and index usage.
   - Do not change feed ordering semantics.

9. **Correct misleading or stale presentation**
   - Label the Analytics tab as dated reference research with a visible “through November 2025” timestamp, or remove it until backed by current data.
   - Remove the unsupported hard-coded aggregate rating from structured data.
   - Redirect legacy `/news` URLs to `/threat-intel` while preserving query parameters.

10. **Backend cleanup and defense in depth**
    - Remove the unused duplicate quiz-cleanup edge function after confirming the database cron remains active.
    - Harden Firecrawl URL validation against IPv6 ULA, alternate IP formats, and DNS resolution to private addresses.
    - Make the Threat Intel API rate-limit operation atomic.

11. **Dependency remediation as a controlled pass**
    - Upgrade direct vulnerable packages in small compatible groups, prioritizing Supabase, React Router, Vitest, Recharts, and PWA/build tooling.
    - Review lockfile-only transitive fixes separately.
    - Run the existing test suite and smoke-test routes, auth, news refresh, quiz, subscriptions, and admin pages after each group.

## Validation and rollout

- Apply additive database changes first; keep compatibility during the frontend and edge-function transition.
- Confirm RSS, Web3 ingestion, summarization, digests, critical alerts, cleanup jobs, and public reads still succeed.
- Test anonymous, authenticated non-admin, expired-session, and admin paths.
- Test quiz tampering, duplicate submission, malformed answers, mobile IP change, and normal completion.
- Verify Active Alerts remains complete after changing Feed filters and pages.
- Verify revoked API keys fail immediately while historical usage and audit entries remain available.
- Compare news query timings before and after indexing.
- Deploy in two stages: database/backend compatibility changes, then frontend consumers and cleanup.

## Deliberately unchanged

- Public `news_articles` reads and Realtime behavior.
- Existing feed ingestion and digest schedules, except adding independent cron-health monitoring.
- Current subscription semantics and public quiz experience.
- Intentionally public aggregate helpers required by visible site counters.
