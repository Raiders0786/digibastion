# Release: newsletter parity with the legacy digest

Why: the first switch to `send-newsletters` (11 October 2026) left
subscribers with nothing. The daily brief only carried incidents and
critical/high vulnerabilities, and a subscriber whose filters matched nothing
got no email at all. After this release the new sender sends at least what
the legacy digest would:

- **Daily brief.** Every other deliverable record of the day is stored in
  `updates` and filtered per subscriber with the legacy rules, shown as "More
  updates". When nothing matches, the subscriber gets a quiet-day brief with
  the top 3 other records.
- **Weekly email.** The shared deep-dive plus "More this week", filtered per
  subscriber. It goes out on each subscriber's `preferred_day` (Monday when
  unset).
- **No double email on switch day.** A daily brief is skipped if the
  subscriber got any digest in the last 12 hours.
- **Cut-over check.** `send-newsletters {"parity": true}` is read-only and
  works while `NEWSLETTER_POSTAL_ADDRESS` is unset.
- **Admin test sends.** They take a `view`: `edition`, `subscriber` or
  `quiet`.

No migration. `NEWSLETTER_POSTAL_ADDRESS` stays unset in this release: the
legacy digest keeps sending until the parity check passes.

## Prompt for Lovable

Paste this as one message. Replace `<EXACT_SHA>` with the commit on `main`.

```text
Release newsletter parity from main at <EXACT_SHA>. Never print secret values or email addresses. Stop at the first FAIL and report.

1. Confirm main is at <EXACT_SHA>. PASS/FAIL.
2. Deploy edge functions build-daily-newsletter, build-weekly-newsletter and send-newsletters (keep verify_jwt=false as in supabase/config.toml). No migration. PASS/FAIL.
3. Confirm the secret NEWSLETTER_POSTAL_ADDRESS is NOT set (say only "set" or "not set"). PASS if not set.
4. Publish the site.
5. Return a table of steps 1-4 with PASS/FAIL.
```

## Test emails (run by you, from /admin)

Log in at `https://www.digibastion.com/admin`, open the browser console and
paste the snippet below. Every email goes only to the signed-in admin
address. The admin address needs its own subscription for the "your view"
emails.

The issues built before this release have no "More updates" or "More this
week" yet. New ones are built at 00:05 UTC (daily) and Monday 00:10 UTC
(weekly), so run it after 00:15 UTC for the full picture.

```js
(async () => {
  const s = JSON.parse(localStorage.getItem('sb-sdszjqltoheqhfkeprrd-auth-token') || 'null');
  if (!s?.access_token) return console.log('Log in at /admin first');
  const call = (fn, body) => fetch(`https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/${fn}`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + s.access_token, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));
  const me = s.user.email;
  const tests = [
    ['1. Daily brief, as your subscription gets it', 'send-newsletters', { test_email: me, kind: 'daily', view: 'subscriber' }],
    ['2. Daily brief, quiet day', 'send-newsletters', { test_email: me, kind: 'daily', view: 'quiet' }],
    ['3. Daily brief, whole edition', 'send-newsletters', { test_email: me, kind: 'daily' }],
    ['4. Weekly, as your subscription gets it', 'send-newsletters', { test_email: me, kind: 'weekly', view: 'subscriber' }],
    ['5. Current digest, quiet day', 'send-digest-emails', { test_email: me, quiet: true }],
  ];
  for (const [label, fn, body] of tests) console.log(label, (await call(fn, body)).body);
  const parity = (await call('send-newsletters', { parity: true })).body;
  console.log('Parity:', parity?.ready_for_cutover ? 'READY' : 'NOT READY', parity);
})();
```

## Switching over

1. Run the snippet. `Parity: READY` means every subscriber the legacy digest
   serves would get the new emails. Issues built before this release show
   `daily_issue_built_before_parity` or `weekly_issue_built_before_parity`,
   so wait for the next build.
2. Set `NEWSLETTER_POSTAL_ADDRESS` in Lovable Cloud → Secrets. The legacy
   digest stands down at once and the new sender takes over at each
   subscriber's next local hour.
3. The day after, check that `admin-analytics` shows about the same number
   of sends as before (about 13 a day).
4. Rollback: delete the secret.
