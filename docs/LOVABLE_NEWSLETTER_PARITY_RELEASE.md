# Release: newsletter parity with the legacy digest

Why: the first switch to `send-newsletters` (11 October 2026) left
subscribers with nothing. The daily brief only carried incidents and
critical/high vulnerabilities, so general news never reached anyone. When a
subscriber's filters matched nothing they got no email at all. This release
fixes both:

- The daily brief stores every other deliverable record of the day in
  `updates`. Each subscriber sees what matches their filters, using the same
  rules as the legacy digest.
- When nothing matches, the subscriber gets a quiet-day brief with the top 3
  other records.
- The weekly email goes out on each subscriber's `preferred_day` (Monday when
  unset).
- `send-newsletters {"parity": true}` is a read-only cut-over check that
  works while `NEWSLETTER_POSTAL_ADDRESS` is unset.

No migration. `NEWSLETTER_POSTAL_ADDRESS` stays unset in this release: the
legacy digest keeps sending until the parity check passes.

## Prompt for Lovable

Paste this as one message. Replace `<EXACT_SHA>` with the commit on `main`.

```text
Release newsletter parity from main at <EXACT_SHA>. Never print secret values or email addresses. Stop at the first FAIL and report.

1. Confirm main is at <EXACT_SHA>. PASS/FAIL.
2. Deploy edge functions build-daily-newsletter and send-newsletters (keep verify_jwt=false as in supabase/config.toml). No migration. PASS/FAIL.
3. Confirm the secret NEWSLETTER_POSTAL_ADDRESS is NOT set (say only "set" or "not set"). PASS if not set.
4. Return a table of steps 1-3 with PASS/FAIL.
```

## After the release (run by us, no Lovable credits)

1. From `/admin`, call `send-newsletters` with `{"parity": true}`. Issues
   built before this release show `daily_issue_built_before_parity`.
2. If today's daily issue has not been sent to anyone, rebuild it with
   `build-daily-newsletter {"force": true}`. Otherwise wait for the 00:05 UTC
   build.
3. Run the parity check again. Set `NEWSLETTER_POSTAL_ADDRESS` only when it
   reports `ready_for_cutover: true`. The day after, check that
   `admin-analytics` shows about the same number of sends as before.
