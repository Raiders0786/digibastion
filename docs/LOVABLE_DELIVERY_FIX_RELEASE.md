# Release: digest delivery fix

Why: on 10 and 11 October 2026 the daily digest reached 6 and then 4 of 13
subscribers, down from 13 a day. Three things caused it:

- RSS inserted nothing from about 17:00 UTC on 8 October to 08:35 on
  10 October.
- The digest only took articles published in the last 26 hours, so the
  catch-up articles never went out.
- Subscribers whose filters matched nothing got no email at all.

This release changes four things:

- The legacy digest picks articles by when we ingested them.
- It sends a "quiet day" email when nothing matches.
- Every verified subscription gets a management token.
- `cron-monitor` emails the admins when RSS goes stale or a subscriber is
  overdue.

`NEWSLETTER_POSTAL_ADDRESS` must stay unset. The legacy digest is the live
sender until `send-newsletters` covers everything it sends (see
`docs/ROADMAP.md`).

## Prompt for Lovable

Paste this as one message. Replace `<EXACT_SHA>` with the commit on `main`.

```text
Release the digest delivery fix from main at <EXACT_SHA>. Never print secret values or email addresses. Stop at the first FAIL and report.

1. Confirm main is at <EXACT_SHA>. PASS/FAIL.
2. Apply migration supabase/migrations/20261015090000_digest_delivery_health.sql. PASS/FAIL.
3. Deploy edge functions send-digest-emails and cron-monitor (keep verify_jwt=false as in supabase/config.toml). PASS/FAIL.
4. Read-only SQL, report the numbers only:
   a) SELECT count(*) FROM public.subscriptions WHERE is_verified AND verification_token IS NULL;  -- expect 0
   b) SELECT count(*) FROM public.delivery_health_alerts;  -- table exists
   PASS if a) is 0 and b) runs. (get_delivery_health is service-role only; we check it through cron-monitor afterwards.)
5. Confirm the secret NEWSLETTER_POSTAL_ADDRESS is NOT set (say only "set" or "not set"). PASS if not set.
6. Return a table of steps 1-5 with PASS/FAIL and the numbers from step 4.
```

## After the release (run by us, no Lovable credits)

- From `/admin`, call `cron-monitor`. The response has a `delivery` block
  with `rss_last_inserted_at`, `overdue_count` and any `alerts`.
- Preview the quiet-day email: call `send-digest-emails` with
  `{"test_email": "<your admin address>", "quiet": true}`. It goes only to
  the signed-in admin.
- Check the next morning that sends per day in `admin-analytics` are back
  near 13. Subscribers whose filters matched nothing now get the quiet-day
  email.
