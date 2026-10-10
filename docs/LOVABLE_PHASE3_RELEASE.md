# Lovable Phase 3 release: newsletters, email compliance and severity fixes

This release ships four things together:

- the Phase 3 newsletters: a daily brief, a weekly deep-dive with an optional AI pass, and a public weekly page with a Telegram link post;
- email compliance: one-click unsubscribe (RFC 8058), a Resend webhook that suppresses bounced and complaining addresses, an opt-in flow for resubscribing, and a consent audit trail;
- a rewritten real-time alert sender that runs every 30 minutes and respects each subscriber's channel choices;
- the threat-intel quick fixes: the direct-loss severity rule, USD formatting with unit rollover, and a 100-page default for a full QuillMonitor sync.

Newsletters stay gated. `send-newsletters` sends nothing to subscribers until
`NEWSLETTER_POSTAL_ADDRESS` is set, and the legacy `send-digest-emails` keeps
running until then. Setting the address is the launch switch. Unsetting it is
the rollback.

Pre-release main (rollback target for functions): `e2dbebec327e3311f61930a8023953b2ce8093a0`.
Release commit: `<MAIN_SHA>`, the merge commit of `phase3-newsletters` on main.

## Stage 0: before Lovable (user only)

1. **Resend webhook.** In Resend, open Webhooks and add
   `https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/resend-webhook`
   with the events `email.bounced`, `email.complained`, `email.delivered` and
   `email.delivery_delayed`. Copy its signing secret (`whsec_...`) into the
   Lovable Cloud function secret `RESEND_WEBHOOK_SECRET`. Do not paste it into chat.
2. **DNS.** In Resend's Domains page, `digibastion.com` must show Verified for
   DKIM (`resend._domainkey`) and SPF on the `send` return-path subdomain.
   `_dmarc.digibastion.com` needs a TXT record of at least
   `v=DMARC1; p=none; rua=mailto:<address>`.
3. **Postal address.** Pick a physical postal address for CAN-SPAM (a
   registered PO box or a commercial mailbox is fine). Keep it ready for the
   launch stage. Do not set it yet.

## Stage 1: preflight (Lovable, read-only)

- `count_news_articles` has a `verification_filter` argument, which shows that
  `20261012090000_threat_intel_incident_filters.sql` is applied. If it is
  missing, stop: the earlier threat-intel revamp release is not live.
- These secrets exist (names only, never values): `RESEND_API_KEY`,
  `CRON_SECRET`, `LOVABLE_API_KEY`, `RESEND_WEBHOOK_SECRET`.
- `NEWSLETTER_POSTAL_ADDRESS` is not set.

## Stage 2: migrations, in this order only

1. `supabase/migrations/20261013100000_newsletter_data_model.sql`
2. `supabase/migrations/20261013110000_email_compliance_jobs.sql`
3. `supabase/migrations/20261013120000_daily_newsletter_jobs.sql`
4. `supabase/migrations/20261013130000_weekly_newsletter_jobs.sql`
5. `supabase/migrations/20261013140000_weekly_newsletter_public.sql`

Run the backfill checks straight after migration 1, before any new function
runs, because the new alert sender also writes `notification_log`:

```sql
-- (a) frequency and wants_* agree: the two counts match on every row
SELECT v,
  count(*) FILTER (WHERE frequency = v) AS by_frequency,
  count(*) FILTER (WHERE CASE v WHEN 'immediate' THEN wants_realtime
    WHEN 'daily' THEN wants_daily AND NOT wants_realtime
    ELSE wants_weekly AND NOT wants_daily AND NOT wants_realtime END) AS by_channels
FROM subscriptions, unnest(array['immediate','daily','weekly']) v GROUP BY v;

-- (b) expect 0
SELECT count(*) FROM subscriptions WHERE is_verified AND consent_source IS NULL;

-- (c) legacy_sends equals eligible
SELECT
  (SELECT count(*) FROM email_sends WHERE idempotency_key LIKE 'legacy/%') AS legacy_sends,
  (SELECT count(DISTINCT (nl.subscription_id, nl.article_id))
     FROM notification_log nl JOIN news_articles na ON na.id = nl.article_id
     WHERE nl.status = 'sent' AND nl.subscription_id IS NOT NULL) AS eligible;
```

Deploy the functions in stage 3 right after the migrations. The new cron jobs
call `build-daily-newsletter` at 00:05 UTC, `build-weekly-newsletter` at 00:10
UTC on Mondays and `post-telegram-alerts {"mode":"weekly"}` at 01:00 UTC on
Mondays. The old `post-telegram-alerts` rejects `mode: weekly` with a 400.
The old alert and digest functions keep working against the migrated schema,
because a trigger keeps `frequency` in sync with the new `wants_*` columns.

## Stage 3: edge functions

Deploy the repository versions with their `_shared` imports. All 19 have
`verify_jwt = false` in `supabase/config.toml` and enforce auth themselves
(CRON_SECRET, the service-role key or an admin JWT, depending on the function).

| Function | Why |
|---|---|
| `resend-webhook` | new |
| `build-daily-newsletter` | new |
| `build-weekly-newsletter` | new |
| `send-newsletters` | new |
| `send-critical-alerts` | rewritten: 30-minute batches, channel preferences, follow-ups, email ledger |
| `send-digest-emails` | cutover guard, List-Unsubscribe headers |
| `one-click-unsubscribe` | RFC 8058 multipart and form-encoded bodies |
| `unsubscribe` | unsubscribe-page backend |
| `submit-form`, `update-subscription`, `get-subscription`, `verify-email`, `request-management-link` | channel preferences, opt-in resubscribe, consent audit, suppression check |
| `post-telegram-alerts` | weekly mode; the edit pass skips `weekly:%` rows |
| `generate-sitemap` | weekly pages |
| `fetch-quillmonitor-incidents` | 100-page default, severity rule, USD formatter |
| `fetch-slowmist-incidents`, `fetch-web3-incidents`, `dedupe-incidents` | shared severity rule and USD formatter |

The changed shared modules are `alert-email.ts`, `daily-brief.ts`,
`email-compliance.ts`, `email-ledger.ts`, `incident-severity.ts`,
`ingestion-health.ts`, `newsletter-content.ts`, `newsletter-render.ts`,
`quillmonitor.ts`, `resend-client.ts`, `resend-webhook.ts`,
`security-actions.ts`, `send-window.ts`, `slowmist.ts`,
`subscription-delivery.ts`, `subscription-optin.ts`,
`subscription-preferences.ts`, `telegram-alerts.ts`, `usd-amount.ts` and the
`weekly-*.ts` files (`weekly-ai`, `weekly-content`, `weekly-render`,
`weekly-stats`, `weekly-templates`, `weekly-validator`). `fetch-rss-news`
needs no redeploy: its only change is a type in `ingestion-health.ts`.

## Stage 4: flags

Set `WEEKLY_AI_ENABLED` to `false`. It is a kill switch, not a secret value.
Leave `WEEKLY_AI_MODEL` unset (the default is `google/gemini-2.5-pro`). Leave
`NEWSLETTER_POSTAL_ADDRESS` unset.

## Stage 5: read-only checks

```sql
-- cron: expect 9 rows, no send-critical-alerts-hourly, all active
SELECT jobname, schedule, active FROM cron.job WHERE jobname IN (
  'send-critical-alerts-hourly','send-critical-alerts-30min','cleanup-unverified-subscriptions',
  'build-daily-newsletter','send-newsletters-00','send-newsletters-15','send-newsletters-30',
  'send-newsletters-45','build-weekly-newsletter','post-weekly-telegram')
ORDER BY jobname;
-- expected schedules: send-critical-alerts-30min '25,55 * * * *', cleanup-unverified-subscriptions '40 3 * * *',
-- build-daily-newsletter '5 0 * * *', send-newsletters-00/15/30/45 '0|15|30|45 * * * *',
-- build-weekly-newsletter '10 0 * * 1', post-weekly-telegram '0 1 * * 1'.
-- The send-digests-hourly-* jobs must still exist:
SELECT count(*) FROM cron.job WHERE jobname LIKE 'send-digests-hourly-%';

-- RLS on, no anon or authenticated grants
SELECT relname, relrowsecurity FROM pg_class
WHERE relnamespace = 'public'::regnamespace
  AND relname IN ('newsletter_issues','email_sends','email_suppressions','incident_status_events');
SELECT table_name, grantee, privilege_type FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND grantee IN ('anon','authenticated')
  AND table_name IN ('newsletter_issues','email_sends','email_suppressions','incident_status_events');  -- expect 0 rows

-- the weekly RPC is the one public read path
SELECT has_function_privilege('anon', 'public.get_weekly_newsletter(date)', 'EXECUTE');  -- true
```

## Stage 6: authorized invocations

Authenticate each POST with `Authorization: Bearer` and the CRON_SECRET read
from the function secrets. Never echo the header or the value.

1. `send-critical-alerts {}` returns `success: true`. The latest
   `threat_intel_ingestion_runs` row with `pipeline = 'critical-alerts'` has
   `success = true` and sent, suppressed and deferred counts in `metadata`.
   This is a real run: it sends alerts for incidents ingested in the last 6
   hours that no one has been sent yet, exactly as the cron would.
2. `build-daily-newsletter {"dryRun": true}` returns section counts. Then
   `{}` returns an issue id, and `newsletter_issues` has a `kind = 'daily'` row
   with `status = 'ready'`. A second `{}` returns `skipped: 'already_built'`.
3. `build-weekly-newsletter {}` returns `success: true`, `status: 'ready'`.
   `SELECT content->'archive'->'aiEnabled', content->'archive'->'validation' FROM newsletter_issues WHERE kind = 'weekly' ORDER BY period_start DESC LIMIT 1`
   shows `false` and every entry with `accepted: false` and reasons `["ai_disabled"]`.
4. `send-newsletters {"dryRun": true}` returns `skipped: 'postal_address_missing'`.
5. `resend-webhook` with an unsigned POST returns 401.
6. `one-click-unsubscribe` with a `multipart/form-data` body
   `List-Unsubscribe=One-Click` and no token returns 400 with the page text
   "Invalid or missing unsubscribe token", not "Invalid one-click unsubscribe
   request". That shows the multipart body was accepted. The positive test
   with a real token is a user check in stage 8.
7. `fetch-quillmonitor-incidents {"mode": "full"}` gets past page 20 without a
   safety-limit error. Afterwards,
   `SELECT kind, count(*) FROM incident_status_events GROUP BY kind` shows a
   handful of real status changes, not one row per upserted incident.
8. `GET generate-sitemap` lists `/threat-intel/weekly/<weekStart>` for the week built in step 3.
9. As anon: `SELECT public.get_weekly_newsletter('<weekStart>')` returns
   content with no `archive` key.

## Stage 7: frontend

Publish the site after the functions. The new subscribe forms send
`wants_*`, `include_preliminary`, `chains`, `timezone` and `consent_source`,
which the old functions reject with a 400. Then check:

- `/threat-intel/methodology` shows the new severity rubric.
- `/threat-intel/weekly/<weekStart>` renders on a 390 px viewport with no
  horizontal scroll, and its subscribe button goes to
  `/threat-intel?tab=subscribe&scope=web3-incidents&weekly=1`.
- `/unsubscribe` renders the new Unsubscribe page, not Manage Subscription.

## Stage 8: admin test sends (user, signed in as admin)

Test sends go only to the signed-in admin's own address. The functions return
403 for any other address, so Lovable cannot run this step on its own. Sign in
at `https://www.digibastion.com/admin`, open the browser console on that
tab and run:

```js
const key = Object.keys(localStorage).find((k) => k.endsWith('-auth-token'));
const session = JSON.parse(localStorage.getItem(key));
const send = (fn, body) => fetch(`https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/${fn}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
  body: JSON.stringify({ test_email: session.user.email, ...body }),
}).then((r) => r.json());
console.log(await send('send-newsletters', { kind: 'daily' }));
console.log(await send('send-newsletters', { kind: 'weekly' }));
console.log(await send('send-critical-alerts', {}));
```

Check each email in Gmail with "Show original":

- SPF, DKIM and DMARC pass, aligned to `digibastion.com`.
- The `List-Unsubscribe` and `List-Unsubscribe-Post` headers are present.
- The footer has Unsubscribe and Manage preferences links and the line
  "Postal address not configured".
- No subject has an emoji. Newsletter subjects start with `[Test]`; the alert
  subject follows `High: Project attack, ~$X reported`.
- The daily brief has five sections. The weekly has the totals block and top
  incidents with source and Digibastion links.
- No `email_sends` row is written for a test send.

Also send a test event from the Resend webhook page and expect `200 {ok: true}`.

Finally, test one-click unsubscribe on a throwaway subscription, not the admin
address. Copy the one-click URL from its email's `List-Unsubscribe` header (it
carries `token` and `email`), and POST `multipart/form-data` with
`List-Unsubscribe=One-Click` to it. Expect 200 and `is_active = false` on that
row.

## Stage 9: launch (user)

Do this soon after stage 8 passes. Until the postal address is set, the legacy
`send-digest-emails` picks recipients by the single collapsed `frequency`. A
subscriber who ticks Real-time plus Daily or Weekly on the new form then gets
only alerts, and the legacy path does not read `email_suppressions`.

1. Set `NEWSLETTER_POSTAL_ADDRESS`.
2. `send-newsletters {"dryRun": true}` shows due, skipped_empty and suppressed
   counts per kind. `send-digest-emails` returns `skipped: 'newsletters_live'`.
3. After the next quarter-hour slot, `email_sends` has `kind = 'daily'` rows,
   `email_events` has `email_type = 'daily_brief'` rows, and the issue's
   `newsletter_issues.status` is `sent`.
4. For the first 24 hours, watch `threat_intel_ingestion_runs` for the
   `critical-alerts`, `newsletter-build` and `digest-emails` pipelines, and
   `SELECT kind, status, count(*) FROM email_sends WHERE created_at > now() - interval '1 day' GROUP BY 1, 2`.

The Monday `post-weekly-telegram` job follows `TELEGRAM_POSTING_ENABLED` like
every other post: `true` posts to the live channel, `test` to the test
channel, anything else skips.

**Weekly AI (optional, later).** Set `WEEKLY_AI_ENABLED=true`, run
`build-weekly-newsletter {"dryRun": true}` and read `content.archive.validation`
and `ai_error`. When the output looks right, run `{"force": true}`, which works
only while the issue has no `email_sends` rows. An `ai_http_4xx` error means
the model id is wrong; set `WEEKLY_AI_MODEL` to an allowed gateway id.

## Rollback

| Problem | Action |
|---|---|
| Newsletters misbehave after launch | Unset `NEWSLETTER_POSTAL_ADDRESS`. The legacy digest resumes on its next hourly slot. |
| Weekly AI prose is wrong | Set `WEEKLY_AI_ENABLED=false` and run `build-weekly-newsletter {"force": true}` if nothing has been sent. |
| Weekly Telegram post is wrong | `SELECT cron.unschedule('post-weekly-telegram');` Real-time posts are unaffected. |
| Real-time alerts fail | Redeploy `send-critical-alerts` from `e2dbebec327e3311f61930a8023953b2ce8093a0`. The new sender also writes `notification_log`, so the old one does not resend recent alerts. |
| Subscribe forms fail | Revert the frontend publish first, then redeploy `submit-form`, `update-subscription`, `get-subscription`, `verify-email` and `request-management-link` from `e2dbebe...`. Old functions reject the new form payload, so the order matters. |
| Newsletter build jobs misfire | `SELECT cron.unschedule(jobname) FROM cron.job WHERE jobname IN ('build-daily-newsletter','build-weekly-newsletter') OR jobname LIKE 'send-newsletters-%';` |

Do not reverse the migrations. They add columns, tables and jobs, and the old
functions run against the new schema.
