# Lovable Telegram alerts release

Posts QuillMonitor Web3 incidents to the `@digibastion` Telegram channel through
`@digibastion_alerts_bot`. `Digibastion Community Chat` is the channel's linked
discussion group, so Telegram copies each post there automatically; the bot
never posts to the chat directly.

Unconfirmed incidents are posted with an "UNCONFIRMED" label and edited in
place when QuillMonitor verifies them. Incidents that are withdrawn, merged as
duplicates, or marked irrelevant are edited to "RETRACTED". Other providers are
not posted until cross-provider deduplication ships.

## Function secrets

Set these in Lovable Cloud function secrets. Never paste the token into chat,
code, or a prompt.

| Secret | Value |
|---|---|
| `TELEGRAM_BOT_TOKEN` | token from @BotFather for `@digibastion_alerts_bot` |
| `TELEGRAM_CHANNEL_ID` | `@digibastion` |
| `TELEGRAM_TEST_CHANNEL_ID` | `@<public test channel>` or the private channel's `-100…` ID |
| `TELEGRAM_POSTING_ENABLED` | `false` to start; `test` during the dry run; `true` to go live |
| `TELEGRAM_MIN_SEVERITY` | optional; defaults to `low` (every QuillMonitor incident) |
| `PUBLIC_SITE_URL` | optional; defaults to `https://www.digibastion.com` |

The bot must be an admin of `@digibastion` and of the test channel with
Post, Edit, and Delete message rights.

## Step 1: deploy (posting off)

```text
Use View Backend for the existing managed Lovable Cloud project and use GitHub
main commit <EXACT_SHA>. Do not rewrite application source, create another
backend, or print any secret value.

1. Apply only:
   supabase/migrations/20261010120000_add_telegram_alerts.sql
2. Deploy the repository versions of post-telegram-alerts and
   fetch-quillmonitor-incidents with their shared imports
   (_shared/telegram-alerts.ts, _shared/ingestion-health.ts). Confirm platform
   JWT verification is disabled for post-telegram-alerts as declared in
   supabase/config.toml; the function itself requires CRON_SECRET, the
   service-role key, or an authenticated admin.
3. Confirm these function secrets exist without showing their values:
   TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID, TELEGRAM_TEST_CHANNEL_ID,
   TELEGRAM_POSTING_ENABLED (must be false).
4. Invoke post-telegram-alerts with an authorized POST body {"mode":"check"}
   and return the JSON response. Both channel and test_channel must show
   reachable=true and can_post_messages, can_edit_messages and
   can_delete_messages all true.
5. Confirm the cron job post-telegram-alerts-30min exists with schedule
   "20,50 * * * *" and that telegram_posts has RLS enabled with no anon or
   authenticated access.
6. Return the deployed Git revision, migration state, the check response, and
   the cron job row.
```

If `check` shows `reachable: false`, the chat ID is wrong or the bot is not a
member. If any `can_*` value is false, fix the bot's admin rights in Telegram.

## Step 2: dry run on the test channel (48 hours)

Set `TELEGRAM_POSTING_ENABLED=test`. Every scheduled run and every
QuillMonitor-triggered run now posts to the test channel only.

Review in the test channel:

- unconfirmed posts say "UNCONFIRMED" and "reported lost";
- the "Full details on DigiBastion" link opens the right incident page;
- a QuillMonitor verification turns the same message into "CONFIRMED" with an
  "Updated … UTC" note, without a second post;
- nothing is posted twice;
- `/admin/cron` shows the `telegram` pipeline as healthy.

## Step 3: go live

```text
Use View Backend for the existing managed Lovable Cloud project. Do not print
any secret value.

1. Set TELEGRAM_POSTING_ENABLED=false.
2. Invoke post-telegram-alerts with an authorized POST body {"mode":"seed"} and
   return the response. This marks incidents already eligible today as handled
   for @digibastion, so launch does not repost the last day's incidents.
3. Set TELEGRAM_POSTING_ENABLED=true.
4. Invoke post-telegram-alerts with an authorized POST body {} and return the
   response. Expect sent=0 unless a new incident arrived after seeding.
5. Return the latest three rows of threat_intel_ingestion_runs where
   pipeline = 'telegram' (aggregate columns only).
```

The flag must be `false` during the seed: while it is `test`, every run
(including `seed`) targets the test channel.

## When a post has an unknown outcome

If Telegram times out or returns a server error, the message may or may not
have been posted. The poster never retries those, to avoid a duplicate: it sets
the `telegram_posts` row to `unknown` and the `telegram` pipeline reports it on
`/admin/cron`. Check the channel for that incident, then ask Lovable to run one
of these for the row's `article_uid`:

- The message is in the channel: `UPDATE public.telegram_posts SET status = 'seeded' WHERE status = 'unknown' AND article_uid = '<uid>';`
  (no repost; that message just won't be auto-edited later)
- The message is not in the channel: `UPDATE public.telegram_posts SET status = 'failed' WHERE status = 'unknown' AND article_uid = '<uid>';`
  (the next run posts it)

## Rollback

Set `TELEGRAM_POSTING_ENABLED=false`. Scheduled runs become no-ops at once.
Already-posted messages stay in the channel; delete them by hand if needed.
If the bot token leaks, send `/revoke` to @BotFather and update
`TELEGRAM_BOT_TOKEN`.
