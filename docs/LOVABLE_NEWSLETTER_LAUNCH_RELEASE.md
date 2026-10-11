# Release: newsletter launch

This follows [`LOVABLE_NEWSLETTER_PARITY_RELEASE.md`](LOVABLE_NEWSLETTER_PARITY_RELEASE.md).
It adds privacy-friendly open counts and switches the site copy to "live":

- **Open counts.** The daily brief and the weekly deep-dive carry an open
  pixel. `email-tracking` records only the first open of each email: time,
  country, device type and email app. It stores no IP, IP hash, region or
  user agent. `/admin/analytics` shows the opens with the legacy ones.
- **Privacy page.** `/privacy` says exactly that.
- **Site copy.** `NEWSLETTERS_LIVE = true`: the forms, FAQ, methodology and
  `llms.txt` stop saying "starting soon".
- **Weekly day.** Migration `20261015100000` makes new subscriptions default
  to Monday for the weekly, matching the form. Existing rows keep their day.

## Before you paste the prompt

Set `NEWSLETTER_POSTAL_ADDRESS` in Lovable Cloud → Secrets. The legacy digest
stands down at once. The new sender takes over at each subscriber's next
local hour, and skips anyone who got a digest in the last 12 hours.

## Prompt for Lovable

Replace `<EXACT_SHA>` with the commit on `main`.

```text
Release the newsletter launch from main at <EXACT_SHA>. Never print secret values or email addresses. Stop at the first FAIL and report.

1. Confirm main is at <EXACT_SHA>. PASS/FAIL.
2. Apply migration supabase/migrations/20261015100000_weekly_day_default_monday.sql. PASS/FAIL.
3. Deploy edge functions email-tracking and send-newsletters (keep verify_jwt=false as in supabase/config.toml). PASS/FAIL.
4. Confirm the secret NEWSLETTER_POSTAL_ADDRESS is set (say only "set" or "not set"). PASS if set.
5. Publish the site.
6. Return a table of steps 1-5 with PASS/FAIL.
```

## After the release

- After 00:15 UTC, run the test snippet in the parity release doc. Each
  newsletter test email is a test send without a pixel, so opening one
  records nothing.
- The next morning, `/admin/analytics` should show about 13 sends, with
  `daily_brief` as the email type, and opens arriving through the day.
- Rollback: delete `NEWSLETTER_POSTAL_ADDRESS`; the legacy digest resumes at
  the next quarter hour.
