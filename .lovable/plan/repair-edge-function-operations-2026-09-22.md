# Repair Edge Function Operations

## Verified findings

1. **Manual feed controls fail for public visitors.** The Threat Intel page shows `AI Summarize`, `Web3 Incidents`, and `RSS Feeds` to everyone. The functions now correctly require an admin session, so public clicks return `401 Unauthorized`. This is the source of the two visible errors captured in recent logs.
2. **Two hourly jobs have a five-second network timeout.** Digest and critical-alert requests regularly exceed that limit. The database records them as timed out even when the function may continue and send successfully, which makes delivery state ambiguous and risks retries or misleading alerts.
3. **The cron monitor is not reading cron execution results.** It estimates health from article and notification counts, uses stale schedule labels, and cannot see the recorded network timeouts. It can therefore report healthy while scheduled requests are failing.
4. **One RSS source is stale.** `NVD Analyzed CVEs` returns HTTP 404 on every hourly fetch. The remaining 18 feeds continue to work, and 99 articles were added in the last 24 hours.

The Lovable Cloud backend and database are healthy. Current scheduled RSS and Web3 ingestion both succeed with secure cron authorization.

## Changes

### 1. Keep privileged controls away from public visitors
- Check the signed-in user's admin role on the Threat Intel page.
- Show the three ingestion and summarization controls only to admins.
- Keep the normal public `Refresh` action, which only reloads already-published feed data.
- Preserve the existing server-side admin checks. No privileged function will become public.

### 2. Repair scheduled request timeouts
- Reschedule `send-hourly-digests` with a 180-second request timeout.
- Reschedule `send-critical-alerts-hourly` with a 120-second request timeout.
- Preserve their current hourly schedules, secure cron headers, and request bodies.
- Disable the stale NVD feed record rather than changing parser logic or affecting the other feeds.

### 3. Make cron monitoring truthful
- Add a narrowly scoped database function that returns recent cron jobs and their actual HTTP outcomes to authenticated admins only.
- Read real job schedules, response codes, timeout messages, and run times in `cron-monitor`.
- Remove hardcoded schedules and estimated success counts.
- Report a timeout or HTTP error as a failed run, including functions that returned no response before the timeout.
- Keep the existing seven-day health snapshots and admin-only dashboard.

## Verification before deployment

- Confirm public visitors no longer see privileged Threat Intel controls.
- Confirm an admin still sees and can run RSS, Web3, and summarization actions.
- Trigger safe authenticated and unauthenticated function checks; unauthorized calls must remain blocked.
- Verify both updated jobs have the intended timeout and secure authorization.
- Run the cron monitor and confirm its totals match actual recent request records.
- Confirm RSS ingestion, Web3 ingestion, digest delivery, critical alerts, and article reads still work.
- Check the website build and runtime logs.

## Not changing

- No relaxation of edge-function security.
- No changes to subscriber preferences, email content, article sorting, or ingestion logic.
- No deployment or publication until verification passes.