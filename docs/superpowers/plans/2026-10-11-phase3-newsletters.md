# Threat Intel Phase 3 (Subscriptions and Newsletters) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use superpowers:subagent-driven-development or superpowers:executing-plans. One implementer per workstream. TDD for every pure module: write the failing test first.

**Goal:** Subscribers can take any mix of real-time alerts, a daily brief and a weekly deep-dive, filtered like the Threat Intel page. Every send is compliant (one-click unsubscribe, postal address, suppression list, idempotent) and the weekly AI write-up cannot invent facts.

**Spec:** `docs/superpowers/specs/2026-10-10-threat-intel-revamp-design.md` sections 8, 9 and 11 (decision 3: postal address before newsletters launch; decision 5: weekly goes out on Mondays at the subscriber's local hour).

**Architecture:** One W1 change lands the data model and the shared pure modules (contracts). Then five workstreams run in parallel, each owning its own files. Daily and weekly editions are built once per period into `newsletter_issues.content`. The sender `send-newsletters` filters each issue per subscriber at send time and records every send in `email_sends`. The legacy `send-digest-emails` keeps running until `NEWSLETTER_POSTAL_ADDRESS` is set. Setting that secret is the cutover switch.

## Global constraints

- **Newsletter gate.** `send-newsletters` sends nothing to subscribers unless `readPostalAddress(Deno.env.get('NEWSLETTER_POSTAL_ADDRESS'))` returns non-null. It returns `{ skipped: 'postal_address_missing' }` and records the run. Every daily and weekly footer renders the address. Admin test sends (`test_email` equal to the signed-in admin's email) still work without it and show a visible "Postal address not configured" line in the footer.
- **Cutover switch.** `send-digest-emails` (legacy) returns `{ skipped: 'newsletters_live' }` as soon as the address is set. Before that, it keeps serving daily and weekly subscribers exactly as it does today. Rollback means unsetting the secret.
- **Real-time alerts never stop.** `frequency` stays a readable, writable column. The W1 migration backfills `wants_*` from it, and a trigger keeps the two in sync in both directions, so the old and new versions of every function and UI keep working in any deploy order. Do not drop `frequency` in this phase.
- **Copy (spec section 9).** Name the source on every item. Never write "verified by DigiBastion". Status words come only from the source: confirmed, unconfirmed, revised, retracted. Loss amounts read "~$4.2M reported". No hype words ("massive", "devastating", "urgent", "Immediate Action Required") and no emoji in subjects.
- **Pure modules.** Anything under `supabase/functions/_shared/` that vitest imports has no `https://` or `npm:` imports, no `Deno`, and no `String.prototype.replaceAll`. Tests sit next to the module as `<name>.test.ts`; vitest picks up `**/*.test.ts`, and Deno `index_test.ts` files are not collected.
- **Auth for cron and admin endpoints.** Copy `authorize()` and `timingSafeEqual()` from `supabase/functions/dedupe-incidents/index.ts`: accept a timing-safe `CRON_SECRET`, the service-role key, or an admin JWT (`user_roles.role = 'admin'`). Never compare secrets with `===`.
- **Cron.** Schedule jobs in migrations with `public.record_cron_http_request(jobname, 'https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/<fn>', body, timeout_ms)`. Unschedule any job with the same name first. Each job runs at most 48 times a day, because Lovable Cloud blocks jobs that run 96 times a day. Start each cron migration with a `-- lovable-cron-fallback-reviewed: <why a poll>` line, as in `20261010120000_add_telegram_alerts.sql`.
- **RPC signatures.** A migration that changes an RPC signature drops the old signature in the same file.
- **New tables** are service-role only: `GRANT ALL ... TO service_role; REVOKE ALL ... FROM anon, authenticated;`, RLS enabled, and one `FOR ALL TO service_role` policy.
- **Runs.** Every builder and sender records a sanitized row through `recordIngestionRun` (`_shared/ingestion-health.ts`). Never log email addresses; log subscription ids or counts.
- **Commands.** One test file: `rtk proxy npx vitest run <file>`. Full suite: `rtk proxy npx vitest run`. Typecheck: `npx tsc --noEmit -p tsconfig.app.json`. Lint: `npx eslint <files>`. Each edge entry: `bun build supabase/functions/<fn>/index.ts --no-bundle > /dev/null`. Build: `node node_modules/vite/bin/vite.js build`.
- **Git.** Stage files by path, never `git add -A` or `git add .`. Use conventional commits with no AI attribution and no `Co-Authored-By`. Never touch `AGENTS.md` or `ROADMAP.md`/`roadmap.md`.
- **New function entries** go in `supabase/config.toml` with `verify_jwt = false`; the functions enforce auth themselves.

## Order and file ownership

| Id | Workstream | Depends on | Migration |
|---|---|---|---|
| W1 | Data model and shared contracts | none | `20261013100000_newsletter_data_model.sql` |
| W2 | Real-time alerts and compliance | W1 | `20261013110000_email_compliance_jobs.sql` |
| W3 | Daily brief builder and newsletter sender | W1 | `20261013120000_daily_newsletter_jobs.sql` |
| W4 | Weekly deep-dive builder with AI guardrails | W1; final wiring task after W3 | `20261013130000_weekly_newsletter_jobs.sql` |
| W5 | Weekly public page and Telegram link post | W1 (content contract only) | `20261013140000_weekly_newsletter_public.sql` |
| W6 | Subscribe UI and preference endpoints | W1 | none |

W1 merges first. W2, W3, W5 and W6 then run in parallel. W4 runs in parallel too, except for its last task (wiring the weekly renderer into W3's sender), which it rebases onto W3 first. Migrations merge in timestamp order. Two shared files get one-line edits from several workstreams: `src/App.tsx` (W2 for `/unsubscribe`, W5 for the weekly route) and `supabase/config.toml` (W2, W3, W4). Resolve those conflicts by keeping both sides.

---

## W1. Data model and shared contracts

### Migration `supabase/migrations/20261013100000_newsletter_data_model.sql`

`subscriptions` gets these new columns:

| Column | Definition |
|---|---|
| `wants_realtime`, `wants_daily`, `wants_weekly` | `boolean NOT NULL DEFAULT false` |
| `timezone` | `text NULL CHECK (timezone IS NULL OR (length(timezone) BETWEEN 1 AND 64 AND timezone ~ '^[A-Za-z]+(/[A-Za-z0-9_+-]+){0,2}$'))`. The API validates IANA names with `Intl`. |
| `include_preliminary` | `boolean NOT NULL DEFAULT true` |
| `chains` | `text[] NOT NULL DEFAULT '{}' CHECK (cardinality(chains) <= 10)` |
| `consented_at` | `timestamptz` |
| `consent_source` | `text CHECK (consent_source IN ('threat-intel-form','quick-subscribe','manage','resubscribe','legacy'))` |
| `consent_ip_hash` | `text CHECK (consent_ip_hash IS NULL OR consent_ip_hash ~ '^[0-9a-f]{64}$')` |
| `unsubscribed_at` | `timestamptz` |
| `optin_token` | `uuid` (single-use re-subscribe confirmation) |
| `optin_token_expires_at` | `timestamptz` |
| `optin_pending` | `jsonb` (preferences applied when the re-subscribe is confirmed) |

Backfills, in this order:
1. `wants_realtime = frequency='immediate'`, `wants_daily = frequency='daily'`, `wants_weekly = frequency='weekly'`.
2. `consented_at = created_at, consent_source = 'legacy'` where `is_verified`.
3. `unsubscribed_at = updated_at` where `NOT is_active`.

Trigger `sync_subscription_delivery_channels()` (BEFORE INSERT OR UPDATE, plpgsql):
- INSERT with no `wants_*` true: derive the `wants_*` columns from `frequency`. Otherwise set `frequency` from `wants_*`, in priority order `immediate`, then `daily`, then `weekly`.
- UPDATE where any `wants_*` IS DISTINCT FROM OLD: set `frequency` from `wants_*`. If all three are false, keep the old `frequency`.
- UPDATE where only `frequency` changed: set the `wants_*` columns from it, exclusively.

New tables, all service-role only:

```sql
newsletter_issues (
  id uuid PK DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('daily','weekly')),
  period_start timestamptz NOT NULL, period_end timestamptz NOT NULL CHECK (period_end > period_start),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','ready','sent','failed')),
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text CHECK (error IS NULL OR length(error) <= 300),
  generated_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, period_start))
email_suppressions (
  email_hash text PRIMARY KEY CHECK (email_hash ~ '^[0-9a-f]{64}$'),
  reason text NOT NULL CHECK (reason IN ('bounce','complaint','manual')),
  source_event_id text CHECK (length(source_event_id) <= 100),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())
email_sends (
  id uuid PK, subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('alert','alert_followup','daily','weekly')),
  item_key text NOT NULL CHECK (length(item_key) BETWEEN 1 AND 300),
  issue_id uuid REFERENCES newsletter_issues(id) ON DELETE SET NULL,
  article_id uuid REFERENCES news_articles(id) ON DELETE SET NULL, article_uid text,
  idempotency_key text NOT NULL CHECK (length(idempotency_key) <= 256),
  status text NOT NULL CHECK (status IN ('claimed','sent','failed','unknown','suppressed','skipped')),
  attempts integer NOT NULL DEFAULT 0, resend_id text, snapshot jsonb,
  last_event text CHECK (last_event IN ('delivered','bounced','complained','delivery_delayed')),
  error text CHECK (error IS NULL OR length(error) <= 300),
  created_at timestamptz NOT NULL DEFAULT now(), sent_at timestamptz, updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subscription_id, kind, item_key))
incident_status_events (
  id bigint GENERATED ALWAYS AS IDENTITY PK, article_uid text NOT NULL, article_id uuid REFERENCES news_articles(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('confirmed','revised','retracted')),
  snapshot jsonb NOT NULL, previous_amount_usd numeric, amount_usd numeric,
  created_at timestamptz NOT NULL DEFAULT now())
```

Indexes:
- `email_sends (resend_id)`
- `email_sends (kind, status, created_at DESC)`
- `newsletter_issues (kind, period_end DESC)`
- `incident_status_events (created_at DESC)`
- `subscriptions (is_active, is_verified) WHERE wants_realtime OR wants_daily OR wants_weekly`

Backfill `email_sends` from `notification_log`: rows with `status='sent'`, joined to `news_articles` for `uid`, become `kind='alert'`, `item_key=uid`, `article_uid=uid`, `status='sent'`, `idempotency_key='legacy/'||id`, `sent_at`, and `snapshot = {sent_severity, sent_verification}` taken from the current row. Use `ON CONFLICT DO NOTHING`.

Trigger `log_incident_status_change()`: AFTER UPDATE OR DELETE ON `news_articles`, FOR EACH ROW, `WHEN (OLD.metadata->>'is_web3_incident' = 'true')`, SECURITY DEFINER, `SET search_path = public`. It ignores rows where `OLD.metadata ? 'duplicate_of_uid'`.
- `confirmed`: `verification_status` changes from `'unverified'` to `'verified'`.
- `revised`: both old and new `amount_lost_usd` are numeric, and `abs(new - old) > greatest(1, 0.005 * old)`.
- `retracted`: DELETE, or `classification_relevant` changes to `false`.
- `snapshot` holds the old row's `title, severity, category, link, source_name, tags, affected_technologies, created_at` and the metadata keys `provider, project_name, chain, attack_type, amount_lost_usd, amount_display, verification_status, is_web3_incident, incident_date, sources`.

Importers upsert every row on each sync, so the trigger must stay cheap and only write a row when one of these conditions holds.

### Shared modules (all pure, each with a `.test.ts`)

**`_shared/subscription-preferences.ts`**
```ts
export interface DeliveryChannels { realtime: boolean; daily: boolean; weekly: boolean }
export function channelsFromFrequency(frequency: unknown): DeliveryChannels;
export function frequencyFromChannels(c: DeliveryChannels): 'immediate' | 'daily' | 'weekly' | null;
export function readDeliveryChannels(row: { wants_realtime?: unknown; wants_daily?: unknown; wants_weekly?: unknown; frequency?: unknown }): DeliveryChannels;
export const CONSENT_SOURCES: readonly ['threat-intel-form','quick-subscribe','manage','resubscribe','legacy'];
export type ConsentSource = typeof CONSENT_SOURCES[number];
export const MAX_SUBSCRIPTION_CHAINS = 10;
export function isValidTimeZone(value: unknown): value is string;   // Intl.DateTimeFormat(undefined,{timeZone}) does not throw; ≤64 chars
export function normalizeChain(value: unknown): string | null;       // same rule as src/lib/threatIntel/query.ts normalizeFacetValue
export interface SubscriptionPreferences {
  categories: string[]; technologies: string[]; content_scope: 'all' | 'web3-incidents';
  severity_threshold: 'critical' | 'high' | 'medium' | 'low' | 'info';
  channels: DeliveryChannels; include_preliminary: boolean; chains: string[];
  timezone: string | null; timezone_offset: number; preferred_hour: number;
}
export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };
export function parseSubscriptionPreferences(input: unknown): ParseResult<SubscriptionPreferences>;
export function preferencesToColumns(p: SubscriptionPreferences): Record<string, unknown>; // wants_*, frequency, chains, ...
```
`parseSubscriptionPreferences` accepts the new payload (`wants_realtime`, `wants_daily`, `wants_weekly`, `include_preliminary`, `chains`, `timezone`) and also the legacy payload (`frequency`, plus `severity` or `severity_threshold`), so old frontends keep working.
- At least one channel is required ("Choose at least one email type").
- Categories are validated against `VALID_NEWS_CATEGORIES`, and the error strings from today's functions are reused.
- An invalid timezone is rejected. A missing timezone becomes `null`, with `timezone_offset` as the fallback.
- Chains are normalized and de-duplicated, with at most 10.
- `preferred_hour` must be an integer from 0 to 23. `preferred_day` is ignored, because the weekly goes out on Mondays.

Tests:
- Legacy `frequency` maps to channels and back.
- Rejects zero channels, more than 10 chains, `"Mars/Base"`, and a non-boolean `include_preliminary`.
- Accepts `Asia/Kolkata`.
- `preferencesToColumns` keeps `frequency` consistent with the trigger's priority order.

**`_shared/subscription-delivery.ts`** (edit):
- Extend `DeliveryPreferences` with `chains?: string[] | null; include_preliminary?: boolean | null`.
- Add `export function isPreliminaryArticle(a: DeliverableArticle): boolean`, defined as `readIncidentFields(a.metadata).verification === 'unverified'`.
- `matchesDeliveryPreferences` now also:
  - rejects any article with `metadata.duplicate_of_uid`;
  - rejects preliminary articles when `include_preliminary === false`;
  - when `chains` is non-empty, requires a Web3 incident's normalized `metadata.chain` to be in the list. A Web3 incident without a chain fails. Non-incident articles are unaffected, matching the page, where the chain filter only applies to the incident view.

New tests for these cases. Existing tests stay green.

**`_shared/send-window.ts`**
```ts
export type Zone = { kind: 'iana'; timeZone: string } | { kind: 'offset'; offsetMinutes: number };
export function resolveZone(timezone: string | null | undefined, offsetHours: number | null | undefined): Zone; // invalid IANA -> offset; neither -> UTC
export interface LocalClock { date: string; weekday: number; minutes: number } // date YYYY-MM-DD, 0=Sunday
export function localClock(now: Date, zone: Zone): LocalClock;
export function zonedInstant(localDate: string, hour: number, zone: Zone): Date; // DST gap -> first valid instant after
export const NEWSLETTER_GRACE_MINUTES = 180;
export function dailyIssueDateFor(now: Date, zone: Zone): string;               // subscriber's local date
export function weeklyIssueDateFor(now: Date, zone: Zone): string | null;       // local date if local weekday is Monday, else null
export function isNewsletterDue(o: { now: Date; zone: Zone; preferredHour: number; issueDate: string; issueReadyAt: Date }): boolean;
```

Issue keys:
- The daily issue for date D covers `[D-1 00:00Z, D 00:00Z)`, with `period_end = D 00:00Z`.
- The weekly issue whose `period_end` is Monday M covers `[M-7d, M)`. Its public URL date is `period_start`.
- A subscriber whose local date is D gets the daily issue with `period_end` date D, and on a local Monday M the weekly issue with `period_end` date M.

Due rule: let `p = zonedInstant(D, preferredHour, zone)`. A send is due when `localClock(now).date === D`, `now >= p`, and `now < max(p, issueReadyAt) + NEWSLETTER_GRACE_MINUTES`.

Tests:
- Asia/Kolkata at hour 9: the 03:30Z slot is due and the 03:15Z slot is not.
- America/New_York across the March and November DST changes: delivery stays at 9:00 local.
- Asia/Tokyo at hour 9, issue ready at 00:05Z: the 00:00Z slot is not due and the 00:15Z slot is.
- Pacific/Kiritimati (UTC+14) at hour 6: weekly on local Monday goes out after the issue is ready (about 14:15 local) and not before.
- Expired grace window: not due.
- An invalid IANA name falls back to the offset.
- A quarter-hour offset (+5.75) works.

**`_shared/email-compliance.ts`**
```ts
export interface UnsubscribeLinks { oneClickUrl: string; unsubscribePageUrl: string; manageUrl: string }
export function buildUnsubscribeLinks(o: { siteUrl: string; functionsBaseUrl: string; email: string; token: string }): UnsubscribeLinks;
//  oneClickUrl        = `${functionsBaseUrl}/one-click-unsubscribe?token=..&email=..` (RFC 8058 POST target)
//  unsubscribePageUrl = `${siteUrl}/unsubscribe?email=..&token=..` (body link; page unsubscribes on load, W2)
//  manageUrl          = `${siteUrl}/manage-subscription?email=..&token=..`
export function listUnsubscribeHeaders(l: UnsubscribeLinks): { 'List-Unsubscribe': string; 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' };
export function readPostalAddress(raw: string | null | undefined): string | null; // trim, collapse whitespace, 10..300 chars, else null
export function renderComplianceFooterHtml(o: { links: UnsubscribeLinks; postalAddress: string | null; reason: string; testWarning?: boolean }): string;
export function renderComplianceFooterText(o: same): string;
export function renderEmailDocument(o: { title: string; preheader: string; bodyHtml: string; footerHtml: string }): string; // shared shell, 640px, dark theme of current digest
export function normalizeEmail(email: string): string;   // trim + lower-case
export async function emailHash(email: string): Promise<string>; // sha256 hex of normalizeEmail, via globalThis.crypto.subtle
```

Tests:
- The footer contains the escaped postal address and both links, with the unsubscribe link first and "Manage preferences" beside it.
- With no address, the footer has no address line.
- `testWarning` renders the warning.
- The headers are exactly `<oneClickUrl>` and the RFC 8058 post value.
- Emails and tokens are URL-encoded.
- `emailHash(' A@B.com ') === emailHash('a@b.com')`.
- `readPostalAddress('  ')` returns null.

**`_shared/resend-client.ts`**
```ts
export interface ResendEmail { from: string; to: [string]; subject: string; html: string; text: string; reply_to: string; headers: Record<string, string>; tags?: { name: string; value: string }[] }
export type ResendOutcome =
  | { status: 'sent'; id: string }
  | { status: 'failed'; retryable: boolean; error: string; httpStatus?: number }
  | { status: 'unknown'; error: string };
export const RESEND_MIN_INTERVAL_MS = 550;
export function createThrottle(minIntervalMs: number, deps?: { now(): number; sleep(ms: number): Promise<void> }): () => Promise<void>;
export async function sendResendEmail(o: { fetchImpl: typeof fetch; apiKey: string; email: ResendEmail; idempotencyKey: string; timeoutMs?: number; sleep?: (ms: number) => Promise<void> }): Promise<ResendOutcome>;
```

Behaviour:
- POST `https://api.resend.com/emails` with the `Idempotency-Key` header.
- 200 with an `id` returns `sent`.
- 429 sleeps for `retry-after` (capped at 10 s) and retries once with the same key. A second 429 returns `failed` with `retryable: true`.
- 409 returns `unknown`, so the email is not re-sent.
- Other 4xx returns `failed` with `retryable: false`. 5xx returns `failed` with `retryable: true`.
- A timeout or network error returns `unknown`.
- Error text is truncated to 300 characters and never includes the API key.

Tests use a fake `fetchImpl` and a fake sleep. The throttle spaces calls at least `minIntervalMs` apart.

**`_shared/email-ledger.ts`**
```ts
export type EmailSendKind = 'alert' | 'alert_followup' | 'daily' | 'weekly';
export function emailIdempotencyKey(kind: EmailSendKind, itemKey: string, subscriptionId: string): string; // `${kind}/${itemKey}/${subscriptionId}`; itemKey > 150 chars -> sha256-free stable FNV-1a hex
export interface ExistingSend { status: string; attempts: number; created_at: string }
export type ClaimPlan = 'insert' | 'reclaim' | 'skip';
export function planEmailClaim(existing: ExistingSend | null, kind: EmailSendKind, now: Date): ClaimPlan;
//  null -> insert; failed && attempts < 3 -> reclaim; unknown && kind in (daily, weekly) && created_at > now-23h -> reclaim (Resend dedupes the key for 24h);
//  everything else (sent, claimed, suppressed, skipped, unknown alerts) -> skip
export interface LedgerDb { /* minimal structural type over supabase-js: from(table).select/insert/update/eq/... */ }
export async function claimEmailSend(db: LedgerDb, row: { subscription_id: string; kind: EmailSendKind; item_key: string; issue_id?: string; article_id?: string; article_uid?: string; snapshot?: Record<string, unknown> }): Promise<{ id: string; idempotencyKey: string } | null>;
export async function finishEmailSend(db: LedgerDb, id: string, outcome: ResendOutcome | { status: 'suppressed' | 'skipped' }): Promise<void>;
```
The claim inserts with `ignoreDuplicates`. A reclaim is a conditional update guarded by `status = 'failed'` or `'unknown'`, so two concurrent runs cannot both claim the same row. Tests cover the `planEmailClaim` table and the key format and length.

**`_shared/newsletter-content.ts`** (types, mapper and caps; this is the contract for W3, W4, W5 and W6)
```ts
export const NEWSLETTER_CONTENT_VERSION = 1;
export const MAX_PLAUSIBLE_LOSS_USD = 100_000_000_000; // same rule as src/lib/threatIntel/incidentDisplay.ts
export type ItemStatus = 'confirmed' | 'unconfirmed' | null; // null = source has no verification flow; show source name only
export interface NewsletterItem {
  uid: string; articleId: string | null; title: string; incidentUrl: string; sourceName: string | null; sourceUrl: string | null;
  providers: string[]; severity: 'critical' | 'high' | 'medium' | 'low' | 'info'; category: string; isWeb3Incident: boolean;
  status: ItemStatus; projectName: string | null; chain: string | null; attackType: string | null;
  amountUsd: number | null; amountDisplay: string | null; fundsReturned: boolean | null; incidentDate: string | null;
  cveId: string | null; tags: string[]; technologies: string[]; summary: string; createdAt: string;
}
export interface StatusChange { change: 'confirmed' | 'revised' | 'retracted'; at: string; item: NewsletterItem; previousAmountUsd: number | null; amountUsd: number | null }
export interface SecurityAction { id: string; text: string; url: string; guideTitle: string }
export interface DailyBriefContent {
  version: 1; kind: 'daily'; issueDate: string; periodStart: string; periodEnd: string;
  incidents: NewsletterItem[]; unconfirmed: NewsletterItem[]; statusChanges: StatusChange[]; vulnerabilities: NewsletterItem[];
  action: SecurityAction;
}
export interface WeeklyParagraph { id: string; text: string; origin: 'ai' | 'template' }
export interface WeeklyBreakdown { key: string; label: string; count: number; lossUsd: number }
export interface WeeklyTotals {
  lossUsd: number; previousLossUsd: number; unconfirmedLossUsd: number; incidentCount: number; unconfirmedCount: number;
  fundsReturnedCount: number; lateReportCount: number; byAttackType: WeeklyBreakdown[]; byChain: WeeklyBreakdown[];
}
export interface WeeklyPublicContent {
  version: 1; kind: 'weekly'; weekStart: string; weekEnd: string; issueDate: string; // weekEnd = Sunday, issueDate = send Monday
  totals: WeeklyTotals; top: { item: NewsletterItem; what: WeeklyParagraph; action: WeeklyParagraph }[];
  trends: WeeklyParagraph; vulnerabilities: { items: NewsletterItem[]; summary: WeeklyParagraph };
  opsecTip: SecurityAction; sources: string[];
}
export interface WeeklyArchive {
  aiEnabled: boolean; model: string | null; input: unknown; prompt: { system: string; user: string } | null;
  rawOutput: string | null; validation: { paragraphId: string; accepted: boolean; reasons: string[] }[]; error: string | null;
}
export interface WeeklyIssueContent extends WeeklyPublicContent { archive: WeeklyArchive }
export const DAILY_CAPS: { incidents: 15; unconfirmed: 10; statusChanges: 15; vulnerabilities: 10 };
export function toNewsletterItem(row: { id: string; uid: string; title: string; summary: string | null; severity: string; category: string; link: string | null; source_name: string | null; cve_id: string | null; tags: string[] | null; affected_technologies: string[] | null; created_at: string; metadata: unknown }, siteUrl: string): NewsletterItem;
export function statusChangeItem(snapshot: unknown, uid: string, siteUrl: string): NewsletterItem; // from incident_status_events.snapshot
export function newsletterItemToDeliverable(item: NewsletterItem): DeliverableArticle;              // for matchesDeliveryPreferences
export function formatLossReported(amountUsd: number | null): string | null; // "~$4.2M reported" via formatCompactUsd; null if missing or implausible
export function compareItems(a: NewsletterItem, b: NewsletterItem): number;    // severity, then amount desc, then createdAt desc
```

Mapper rules:
- `incidentUrl` is `${siteUrl}/threat-intel/${id}`.
- `status`: `verified` maps to `confirmed`, `unverified` to `unconfirmed`, and anything else to null.
- `summary` is stripped of HTML and cut with `truncateAtWord(…, 280)`.
- Amounts above `MAX_PLAUSIBLE_LOSS_USD` become null.
- `providers` comes from `metadata.sources`.

Tests:
- A QuillMonitor fixture row maps correctly.
- A legacy 3.8e12 amount becomes null.
- A missing link falls back to `incidentUrl`.
- `newsletterItemToDeliverable` round-trips through `matchesDeliveryPreferences`, including the preliminary and chain filters.

**`_shared/security-actions.ts`**
```ts
export const SECURITY_ACTIONS: readonly SecurityAction[]; // 8-12 reviewed entries, url = https://www.digibastion.com/category/<id> or an officialLinks URL (revoke.cash etc.)
export function pickSecurityAction(o: { seed: string; attackTypes: string[]; categories: string[] }): SecurityAction;
```
`pickSecurityAction` matches on attack-type and category signals: phishing and drainers map to approvals and `/category/wallet`; private key and access control map to `/category/opsec`; supply chain and npm map to `/category/developers`. When nothing matches, it rotates deterministically by `seed` (the issue date).

Tests:
- Selection is deterministic.
- Every `/category/<id>` matches a file basename in `src/data/categories/`; the test reads the directory with `fs`.
- No entry text contains hype words.

### Acceptance (W1)

- All new tests pass, the full suite is green, and `tsc` and `eslint` pass on the touched files.
- The migration is idempotent where cheap (`IF NOT EXISTS`) and runs after `20261012090000`.
- Reviewer SQL check, after applying to a copy: `count(*) FILTER (WHERE frequency='daily') = count(*) FILTER (WHERE wants_daily AND NOT wants_realtime)` for each value.
- `UPDATE subscriptions SET frequency='weekly'` flips `wants_*`, and `UPDATE ... SET wants_realtime=true` sets `frequency='immediate'`.
- One commit: `feat(newsletters): add subscription channels, issue and send ledgers, shared email contracts`.

---

## W2. Real-time alerts and compliance

### Files

- Modify `supabase/functions/send-critical-alerts/index.ts` (rewrite).
- Create `supabase/functions/_shared/alert-email.ts` with a test.
- Create `supabase/functions/resend-webhook/index.ts`.
- Create `supabase/functions/_shared/resend-webhook.ts` with a test.
- Modify `supabase/functions/one-click-unsubscribe/index.ts` and `supabase/functions/unsubscribe/index.ts`.
- Create `src/pages/Unsubscribe.tsx` with `src/pages/__tests__/Unsubscribe.test.tsx`.
- Route `/unsubscribe` to the new page in `src/App.tsx`. Today it renders `ManageSubscription`.
- Add a `config.toml` entry for `resend-webhook`.

### Interfaces

```ts
// _shared/alert-email.ts
export function buildAlertSubject(items: NewsletterItem[]): string;
//  1 incident:   "High: Example Protocol bridge exploit, ~$4.2M reported"   (Severity: project + attack, loss)
//  unconfirmed:  "[Unconfirmed] High: Example Protocol bridge exploit, ~$4.2M reported"
//  non-incident: "Critical: CVE-2026-1234 in OpenSSL" (title ≤ 90 chars, cut at word)
//  n > 1:        "<subject of first by compareItems> (+<n-1> more)"; total ≤ 120 chars, no newlines, no emoji
export function buildFollowUpSubject(kind: 'retracted' | 'upgraded_critical', item: NewsletterItem): string;
//  "Retracted: Example Protocol incident report withdrawn by QuillMonitor" | "Now critical: Example Protocol bridge exploit, ~$40M reported"
export type FollowUpPlan = { kind: 'retracted' | 'upgraded_critical' } | null;
export function planAlertFollowUp(sent: { sent_severity?: string; sent_verification?: string }, current: { severity: string; metadata: unknown } | null): FollowUpPlan;
//  current null or classification_relevant === false -> retracted; duplicate_of_uid set -> null (merged, not retracted);
//  severity critical && sent_severity !== critical -> upgraded_critical; verification changes -> null (daily brief covers them)
export function renderAlertEmail(o: { items: NewsletterItem[]; links: UnsubscribeLinks; postalAddress: string | null }): { html: string; text: string };
export function renderFollowUpEmail(o: { kind: 'retracted' | 'upgraded_critical'; item: NewsletterItem; links: UnsubscribeLinks; postalAddress: string | null }): { html: string; text: string };

// _shared/resend-webhook.ts
export async function verifyResendSignature(o: { secret: string; id: string | null; timestamp: string | null; signatureHeader: string | null; body: string; now: Date; toleranceSeconds?: number }): Promise<boolean>;
//  Svix scheme: secret "whsec_<base64>"; signed = `${id}.${timestamp}.${body}`; HMAC-SHA256 base64; header "v1,<sig> v1,<sig2>"; constant-time compare; |now - ts| ≤ 300s
export type ResendEvent = { kind: 'bounce' | 'complaint' | 'delivered' | 'delayed' | 'ignored'; emailId: string | null; recipients: string[]; eventId: string | null };
export function parseResendEvent(payload: unknown): ResendEvent;
//  email.bounced -> bounce unless data.bounce.type is 'Transient'/'transient' (then delayed); email.complained -> complaint;
//  email.delivered -> delivered; email.delivery_delayed -> delayed; anything else -> ignored
```

### Behaviour

**`send-critical-alerts`**
- Auth uses the shared pattern; replace the current `===` check.
- Articles: `severity in (critical, high)` and `created_at >= now()-6h`. Drop the `published_at` filter, because it misses QuillMonitor and SlowMist rows stamped at midnight UTC. Exclude `duplicate_of_uid` and `classification_relevant=false`. Map with `toNewsletterItem`.
- Subscribers: `is_active AND is_verified AND wants_realtime`, with a non-null `verification_token`.
- For each subscriber, filter with `matchesDeliveryPreferences(newsletterItemToDeliverable(item), sub)`, which now handles `include_preliminary` and `chains`.
- Drop items already in `email_sends` (`kind='alert'`, `item_key=uid`). Also drop items in `notification_log` with `status='sent'` from the last 7 days; this is a transition guard, removed in a later phase.
- Check suppression via `emailHash`. A suppressed subscriber gets `suppressed` ledger rows and no send.
- Send one email per subscriber per run, with up to 10 items. Claim one ledger row per item. The Resend key is `emailIdempotencyKey('alert', <FNV of sorted uids>, sub.id)`.
- Snapshot per row: `{ sent_severity, sent_verification }`.
- Use `listUnsubscribeHeaders`. The footer renders the postal address when it is set; alerts do not require it.
- Follow-ups: load `email_sends` rows with `kind='alert'`, `status='sent'`, `sent_at > now()-14d`, then the matching articles by `article_uid`, then `planAlertFollowUp`. Send one follow-up per (subscriber, uid, kind) with `kind='alert_followup'` and `item_key = uid + ':' + kind`.
- Throttle with `createThrottle(RESEND_MIN_INTERVAL_MS)`. Stop starting new sends after 100 s of wall time, and report `deferred`.
- An admin-only `{ test_email }` mode sends the latest matching item to the signed-in admin with the same headers and footer.
- Record runs under the `critical-alerts` pipeline.

**`resend-webhook`**
- POST only, and the raw body must be at most 256 KB.
- Missing `RESEND_WEBHOOK_SECRET` returns 500 `not configured`. A bad signature or stale timestamp returns 401.
- `bounce` and `complaint`: upsert `email_suppressions(email_hash, reason, source_event_id)`, where a complaint overwrites a bounce. Set the matching subscription to `is_active=false, unsubscribed_at=now()`. Update `email_sends.last_event` by `resend_id`.
- `delivered` and `delayed`: update `email_sends.last_event` only.
- Return 200 `{ ok: true }` for duplicates and ignored events. Never log recipient addresses.

**`one-click-unsubscribe` and `unsubscribe`**
- Set `is_active=false, unsubscribed_at=now()`.
- Neither function ever sets `is_active=true`.
- One-click keeps GET non-mutating (it redirects) and POST-only mutation.
- Already-inactive rows return success without changes, which prevents enumeration.

**`src/pages/Unsubscribe.tsx`**
- With `email` and `token`, the page invokes `unsubscribe` once on mount; a ref guards against StrictMode double effects.
- It then shows "You're unsubscribed from all DigiBastion emails.", a "Manage preferences" link, and a "Changed your mind? Resubscribe" link to `/manage-subscription?...`. That page starts the opt-in flow from W6.
- Without parameters it shows a link to the management page.

### Migration `20261013110000_email_compliance_jobs.sql`

- Unschedule `send-critical-alerts-hourly`. Schedule `send-critical-alerts-30min` at `25,55 * * * *` (48 runs a day; QuillMonitor syncs at :17/:47 and Telegram posts at :20/:50) through `record_cron_http_request(..., '{}'::jsonb, 150000)`.
- Unschedule, then schedule `cleanup-unverified-subscriptions` at `40 3 * * *` as plain SQL: `DELETE FROM public.subscriptions WHERE is_verified = false AND created_at < now() - interval '7 days';`.

### Secrets

`RESEND_WEBHOOK_SECRET` (new). Existing: `RESEND_API_KEY`, `CRON_SECRET`. Optional: `NEWSLETTER_POSTAL_ADDRESS`, used in the footer.

### Tests

- `alert-email.test.ts`:
  - subject formats for each case;
  - the 120-character cap;
  - no emoji and no "Immediate Action Required";
  - the unconfirmed prefix;
  - the HTML contains the source name, "~$… reported", the unsubscribe link, the manage link and the postal address when given;
  - every `planAlertFollowUp` branch, including that a duplicate merge produces no follow-up.
- `resend-webhook.test.ts`:
  - a signature computed in the test with WebCrypto verifies;
  - a tampered body, a wrong secret, a timestamp skew over 300 s, and a missing header each fail;
  - multiple `v1,` signatures where only the second matches still pass;
  - `parseResendEvent` covers bounce (permanent and transient), complaint, delivered and an unknown type.
- `Unsubscribe.test.tsx`:
  - calls `unsubscribe` exactly once with the email and token;
  - shows the manage link;
  - with no token, makes no call.

### Acceptance (W2)

- `bun build` succeeds for `send-critical-alerts`, `resend-webhook`, `one-click-unsubscribe` and `unsubscribe`.
- `grep -n "Immediate Action Required\|authHeader !== " supabase/functions/send-critical-alerts/index.ts` finds nothing.
- Every `fetch('https://api.resend.com` in W2's files goes through `sendResendEmail`.
- Commits: `feat(alerts): select by ingestion time, honour channel prefs and send follow-ups`, then `feat(email): add Resend webhook suppression and one-click unsubscribe page`.

---

## W3. Daily brief builder and newsletter sender

### Files

- Create `supabase/functions/build-daily-newsletter/index.ts`.
- Create `supabase/functions/send-newsletters/index.ts`.
- Create `supabase/functions/_shared/daily-brief.ts` with a test.
- Create `supabase/functions/_shared/newsletter-render.ts` with a test.
- Make a small edit to `supabase/functions/send-digest-emails/index.ts`: add the cutover guard, and add List-Unsubscribe headers to its test sends.
- Add `config.toml` entries for both new functions.

### Interfaces

```ts
// _shared/daily-brief.ts
export interface DailyBriefInput { issueDate: string; periodStart: string; periodEnd: string; recent: NewsletterItem[]; stillUnconfirmed: NewsletterItem[]; statusChanges: StatusChange[] }
export function buildDailyBriefContent(input: DailyBriefInput): DailyBriefContent;
//  incidents = recent Web3 incidents with status !== 'unconfirmed'; unconfirmed = recent ∪ stillUnconfirmed with status 'unconfirmed' (dedupe by uid);
//  vulnerabilities = recent non-incident items, severity critical|high, category vulnerability-disclosure|supply-chain or cveId;
//  sort with compareItems, cap with DAILY_CAPS; action = pickSecurityAction({ seed: issueDate, attackTypes, categories })
export function filterDailyBriefForSubscriber(c: DailyBriefContent, prefs: DeliveryPreferences): DailyBriefContent | null; // null when sections 1-4 all empty
export function buildDailySubject(c: DailyBriefContent): string; // "Daily brief, Oct 11: 3 incidents, 1 unconfirmed, 2 status changes" (omit zero parts)

// _shared/newsletter-render.ts
export interface RenderContext { links: UnsubscribeLinks; postalAddress: string | null; testWarning?: boolean; siteUrl: string }
export function renderDailyBriefEmail(c: DailyBriefContent, ctx: RenderContext): { subject: string; html: string; text: string };
export function renderNewsletterEmail(kind: 'daily' | 'weekly', content: unknown, ctx: RenderContext): { subject: string; html: string; text: string } | null;
//  'weekly' returns null until W4 wires renderWeeklyEmail here (one-line edit owned by W4)
```

Daily section titles:
1. "Incidents"
2. "Still unconfirmed"
3. "Status changes"
4. "Vulnerabilities and supply-chain"
5. "One thing to do today"

Each item shows:
- a status word only when `status` is non-null;
- the source name with a link;
- the loss via `formatLossReported`;
- chain and attack type;
- a link to the DigiBastion incident page.

Status changes read "Confirmed by QuillMonitor", "Revised: loss now ~$X reported (was ~$Y)" and "Retracted by the source".

Emails carry no tracking pixel. After a send, insert an `email_events` row with `event_type='sent'` and `email_type='daily_brief'` so admin analytics keep counting sends.

### Behaviour

**`build-daily-newsletter`** (POST, shared auth)
- Body: `{ issueDate?: 'YYYY-MM-DD', force?: boolean, dryRun?: boolean }`. `issueDate` defaults to today's UTC date.
- Queries:
  - `news_articles` with `created_at` in `[D-1, D)`, limit 500;
  - Web3 incidents with `verification_status='unverified'` and `created_at > D-7d`, limit 50;
  - `incident_status_events` in `[D-1, D)`, mapped with `statusChangeItem`.
- Exclude duplicates and `classification_relevant=false` throughout.
- Upsert `newsletter_issues` on `(kind, period_start)` with `status='ready'` and `generated_at=now()`.
- Refuse (409) to rebuild an issue that already has `email_sends` rows. `force` overrides only when there are no sends.
- Record runs under the `newsletter-build` pipeline.

**`send-newsletters`** (POST, shared auth; cron sends `{ "source": "cron" }`)
- Gate: no postal address means the function returns `skipped` and records the run.
- Load ready issues:
  - daily issues with `period_end` date in {UTC today - 1, today, today + 1};
  - weekly issues with `period_end` in the last 8 days.
- Subscribers: `is_active AND is_verified AND (wants_daily OR wants_weekly)` with a token.
- For each subscriber:
  - `zone = resolveZone(timezone, timezone_offset)`;
  - for each wanted kind, find the issue for `dailyIssueDateFor` or `weeklyIssueDateFor`;
  - send when `isNewsletterDue(…, issueReadyAt = generated_at)`.
- Then check suppression. Daily content goes through `filterDailyBriefForSubscriber`; a null result records the ledger row as `skipped`. Weekly is not filtered: it is one shared edition, matching the public page.
- Claim the ledger row (`item_key = issue.id`), send through `sendResendEmail` with key `emailIdempotencyKey(kind, issue.id, sub.id)`, then finish the row.
- Throttle sends. Stop starting new sends after 100 s or 150 sends; later slots inside the grace window pick up the rest.
- Set the issue to `status='sent'` after its first successful send.
- `{ dryRun: true }` returns counts per kind with no sends and no ledger writes.
- `{ test_email, kind, issueId? }` (admin only) sends the newest ready issue of that kind to the admin. It uses real headers, built from the admin's subscription token when one exists, and `testWarning` when the address is missing. It writes no ledger row.
- Record runs under the `digest-emails` pipeline.

**`send-digest-emails` (legacy)**
- Directly after auth: `if (readPostalAddress(Deno.env.get('NEWSLETTER_POSTAL_ADDRESS'))) return 200 { success: true, skipped: 'newsletters_live' }`.
- Its test send gains `headers: listUnsubscribeHeaders(...)`. Nothing else changes.

### Migration `20261013120000_daily_newsletter_jobs.sql`

- Replace the `threat_intel_ingestion_runs_pipeline_check` constraint, keeping every current value and adding `'newsletter-build'`.
- `CREATE OR REPLACE public.get_threat_intel_health()` with the same signature, adding `('newsletter-build', 26)` to the pipelines list. Copy the latest body from `20261010120000_add_telegram_alerts.sql` and change only that list.
- Schedule `build-daily-newsletter` at `5 0 * * *` with body `{"source":"cron"}` and timeout 150000.
- Schedule `send-newsletters-00`, `-15`, `-30` and `-45` at `N * * * *` (24 runs a day each) with body `{"source":"cron"}` and timeout 180000. Do not touch `send-digests-hourly-*`.

### Secrets

`NEWSLETTER_POSTAL_ADDRESS` (new, the launch switch). Existing: `RESEND_API_KEY`, `CRON_SECRET`, `PUBLIC_SITE_URL` (optional).

### Tests

- `daily-brief.test.ts`:
  - section assignment, covering confirmed, null-status and unconfirmed items;
  - still-unconfirmed carry-over with de-duplication;
  - status changes kept;
  - caps;
  - per-subscriber filtering for severity threshold, `content_scope='web3-incidents'`, chains, and `include_preliminary=false` (drops the unconfirmed section and unconfirmed items);
  - a filter that empties everything returns null;
  - subject wording, with no zero parts;
  - the action is deterministic per date.
- `newsletter-render.test.ts`:
  - the HTML has all five section titles when populated and hides empty sections;
  - the postal address renders;
  - the unsubscribe link sits beside the manage link;
  - every item shows its source name and an incident URL;
  - unconfirmed items show "unconfirmed";
  - no "verified by DigiBastion" text appears;
  - an issue with the maximum caps renders under 90 KB, below Gmail's clipping limit;
  - the text part mirrors the HTML;
  - `renderNewsletterEmail('weekly', …)` returns null before W4.

### Acceptance (W3)

- `bun build` succeeds for the three touched functions.
- With no postal address, `send-newsletters {dryRun:true}` reports `skipped: postal_address_missing` and `send-digest-emails` behaves as before.
- With the address set, the legacy function skips.
- Commits: `feat(newsletters): build the daily brief issue`, then `feat(newsletters): send daily and weekly issues at subscriber local time`.

---

## W4. Weekly deep-dive builder with AI guardrails

### Files

- Create `supabase/functions/build-weekly-newsletter/index.ts`.
- Create, each with a test:
  - `_shared/weekly-stats.ts`
  - `_shared/weekly-templates.ts`
  - `_shared/weekly-validator.ts`
  - `_shared/weekly-ai.ts`
  - `_shared/weekly-content.ts`
  - `_shared/weekly-render.ts`
- Final task, after rebasing on W3: a one-line weekly branch in `_shared/newsletter-render.ts`.
- Add a `config.toml` entry.

### Interfaces

```ts
// weekly-stats.ts
export interface WeeklyStatsInput { weekStart: string; thisWeek: NewsletterItem[]; previousWeek: NewsletterItem[] }
export function computeWeeklyTotals(i: WeeklyStatsInput): WeeklyTotals;
//  counted = Web3 incidents ingested (createdAt) in the week, excluding incidentDate older than weekStart-30d (counted in lateReportCount only);
//  lossUsd/previousLossUsd sum confirmed + null-status plausible amounts; unconfirmed amounts go to unconfirmedLossUsd only;
//  byAttackType/byChain: top 5 by lossUsd then count, rest folded into key 'other'
export function selectTopIncidents(items: NewsletterItem[], n?: 5): NewsletterItem[]; // amount desc (nulls last), then compareItems

// weekly-templates.ts (deterministic fallback, no model)
export function templateWhat(item: NewsletterItem): string;    // "Unconfirmed: Example Protocol on Ethereum lost ~$4.2M reported in a bridge exploit, according to QuillMonitor (Oct 7)."
export function templateAction(item: NewsletterItem): string;  // from pickSecurityAction signals, phrased for users and builders
export function templateTrends(t: WeeklyTotals): string;
export function templateVulnerabilities(items: NewsletterItem[]): string;

// weekly-validator.ts
export const WEEKLY_PLACEHOLDERS: { item: readonly ['project','loss','chain','attack','date','status','source']; trends: readonly ['week_loss','previous_week_loss','incident_count','unconfirmed_count','top_attack','top_chain','funds_returned_count']; vulnerabilities: readonly ['vuln_count'] };
export interface ValidationContext { section: 'item' | 'trends' | 'vulnerabilities'; values: Record<string, string | null>; allowedTerms: string[]; knownProjectNames: string[]; inputProjectNames: string[]; isUnconfirmed: boolean; maxLength: number }
export type ValidationResult = { ok: true; text: string } | { ok: false; reasons: string[] };
export function validateAndFill(raw: string, ctx: ValidationContext): ValidationResult;
//  on raw text with placeholders removed, reject when it has:
//   - a currency symbol or word ($ € £ ¥ ₿, USD, ETH amount, million|billion|thousand|bn|mn|k$)
//   - any token containing a digit that is not in allowedTerms (e.g. "Web3", "ERC-20", "2FA" are in the static list)
//   - a URL or domain-like token (http, www., \b[\w-]+\.(com|io|xyz|org|net|finance|fi|app|dev|co)\b)
//   - a known project name not in inputProjectNames (case-insensitive, word boundary)
//   - a capitalised token not at sentence start and not in allowedTerms
//   - an unknown placeholder, or a placeholder whose value is null
//   - markup characters < > * # [ ] or a backtick
//   - hype words or "verified by"
//   - length outside 20..maxLength
//  then fill placeholders; when isUnconfirmed, the filled text must match /\b(unconfirmed|reported)\b/i
//  and must not contain /\bconfirmed\b/ outside "unconfirmed"

// weekly-ai.ts
export const DEFAULT_WEEKLY_MODEL = 'google/gemini-2.5-pro';
export const ALLOWED_WEEKLY_MODELS: readonly string[]; // confirm against the Lovable AI gateway list at implementation time
export function buildWeeklyPrompt(input: WeeklyGroundedInput): { system: string; user: string };
export function parseWeeklyModelOutput(raw: string): { top: { uid: string; what: string; action: string }[]; trends: string; vulnerabilities: string } | null;
export interface WeeklyGroundedInput { weekStart: string; totals: WeeklyTotals; top: Pick<NewsletterItem,'uid'|'projectName'|'chain'|'attackType'|'status'|'sourceName'|'incidentDate'|'summary'|'fundsReturned'>[]; vulnerabilities: Pick<NewsletterItem,'uid'|'title'|'sourceName'|'cveId'|'summary'>[] }

// weekly-content.ts
export function assembleWeeklyContent(o: { weekStart: string; totals: WeeklyTotals; top: NewsletterItem[]; vulnerabilities: NewsletterItem[]; modelOutput: ReturnType<typeof parseWeeklyModelOutput>; aiEnabled: boolean; model: string | null; prompt: { system: string; user: string } | null; rawOutput: string | null; error: string | null; knownProjectNames: string[] }): WeeklyIssueContent;
//  each paragraph: model text -> validateAndFill -> accepted (origin 'ai') or template (origin 'template'); every decision recorded in archive.validation

// weekly-render.ts
export function buildWeeklySubject(c: WeeklyPublicContent): string; // "Weekly deep-dive, week of Oct 5: ~$12.3M reported across 9 incidents"
export function renderWeeklyEmail(c: WeeklyPublicContent, ctx: RenderContext): { subject: string; html: string; text: string };
export function toPublicWeekly(c: WeeklyIssueContent): WeeklyPublicContent; // strips archive
```

### Behaviour

**`build-weekly-newsletter`** (POST, shared auth)
- Body: `{ weekStart?: 'YYYY-MM-DD', force?: boolean, dryRun?: boolean }`. `weekStart` defaults to the Monday before the current UTC Monday and must be a Monday.
- Query the week and the previous week of Web3 incidents, plus this week's vulnerability and supply-chain items (critical or high, cap 10). Exclude duplicates and irrelevant rows.
- `knownProjectNames`: distinct non-null `metadata.project_name` from the last 365 days, limit 5000.
- AI runs only when `Deno.env.get('WEEKLY_AI_ENABLED') === 'true'` and `LOVABLE_API_KEY` is set.
- Model: `WEEKLY_AI_MODEL` when it is in `ALLOWED_WEEKLY_MODELS`, otherwise `DEFAULT_WEEKLY_MODEL`.
- Call `https://ai.gateway.lovable.dev/v1/chat/completions` as `summarize-article` does, with `temperature: 0.2`, a 60 s timeout, and a JSON-only response (a tool call or `response_format: json_object`, whichever the gateway supports).
- The prompt contains only `WeeklyGroundedInput` and tells the model:
  - use placeholders for every name, number, chain, attack type and date;
  - add no facts, names, figures or links;
  - for unconfirmed items, say "unconfirmed" or "reported".
- A 402, a 429, a timeout or unparseable output falls back to templates for every paragraph, and the error goes in the archive.
- Store the full `WeeklyIssueContent` (input, prompt, raw output, validation) with `kind='weekly'`, `period_start = weekStart 00:00Z`, `period_end = +7d`, and `status='ready'`.
- Apply the same 409 rule as the daily builder for rebuilding an issue that has already been sent.
- Record runs under the `newsletter-build` pipeline with metadata `{ kind: 'weekly', ai_used, paragraphs_ai, paragraphs_template }`.

### Migration `20261013130000_weekly_newsletter_jobs.sql`

Schedule `build-weekly-newsletter` at `10 0 * * 1` with body `{"source":"cron"}` and timeout 240000.

### Secrets

`WEEKLY_AI_ENABLED` (new; `false` at first, `true` once a dry run looks right). `WEEKLY_AI_MODEL` (new, optional). Existing: `LOVABLE_API_KEY`.

### Tests

- `weekly-stats`:
  - week boundaries;
  - the late-report exclusion;
  - unconfirmed losses kept separate;
  - implausible amounts ignored;
  - top-5 ordering with null amounts last;
  - the "other" bucket.
- `weekly-validator`, one test per rejection reason:
  - "$4.2M";
  - "4.2 million";
  - a bare "12";
  - "https://x.io";
  - "x.finance";
  - a known project that is not in the input;
  - an unknown placeholder;
  - a null placeholder value;
  - an unconfirmed item without "unconfirmed" or "reported";
  - an unconfirmed item described as "confirmed";
  - "verified by DigiBastion";
  - "massive";
  - markdown.

  Accept cases: "Web3", "ERC-20", a sentence-initial capital, and an allowed chain name. Placeholders are filled from `values`.
- `weekly-templates`:
  - every template passes `validateAndFill` with its own context;
  - unconfirmed templates contain "unconfirmed";
  - unknown loss and chain values produce clean sentences.
- `weekly-ai`:
  - the prompt contains only input fields and no URLs;
  - the prompt contains the placeholder list;
  - the parser rejects malformed JSON, missing uids and extra uids.
- `weekly-content`:
  - AI off means every paragraph has `origin: 'template'` and the archive has `aiEnabled: false`;
  - a mixed model output keeps the valid paragraphs and falls back on the invalid ones, with the reasons archived;
  - `toPublicWeekly` drops `archive`.
- `weekly-render`:
  - the totals text comes from code;
  - top items show sources and incident URLs;
  - the postal address and unsubscribe link appear;
  - the email is under 90 KB;
  - the subject format.

### Acceptance (W4)

- `bun build` succeeds for `build-weekly-newsletter`.
- After wiring, `renderNewsletterEmail('weekly', …)` returns an email, and W3's test is updated to match.
- Commits: `feat(newsletters): build the weekly deep-dive with grounded AI and validator`, then `feat(newsletters): send the weekly deep-dive`.

---

## W5. Weekly public page and Telegram link post

### Files

- Create `src/pages/WeeklyNewsletter.tsx` with `src/pages/__tests__/WeeklyNewsletter.test.tsx`.
- Create `src/lib/threatIntel/weekly.ts` with a test.
- Add the route `/threat-intel/weekly/:weekStart` in `src/App.tsx`, declared before `/threat-intel/:articleId`.
- Modify `supabase/functions/post-telegram-alerts/index.ts`.
- Modify `supabase/functions/_shared/telegram-alerts.ts` and its tests.
- Modify `supabase/functions/generate-sitemap/index.ts` to add `/threat-intel/weekly/<weekStart>` for ready and sent issues.
- Optionally add a link to the latest weekly on the methodology page.

### Interfaces

```sql
-- migration 20261013140000_weekly_newsletter_public.sql
CREATE FUNCTION public.get_weekly_newsletter(p_week_start date) RETURNS jsonb
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
-- returns jsonb_build_object('content', content - 'archive', 'generated_at', generated_at,
--   'previous_week_start', <latest ready|sent weekly period_start before>, 'next_week_start', <earliest after>)
-- for kind='weekly' AND status IN ('ready','sent') AND period_start = p_week_start::timestamptz; NULL otherwise
GRANT EXECUTE ON FUNCTION public.get_weekly_newsletter(date) TO anon, authenticated, service_role;
```

```ts
// src/lib/threatIntel/weekly.ts
export function parseWeekStart(value: string | undefined): string | null; // valid YYYY-MM-DD that is a Monday
export function isWeeklyPublicContent(value: unknown): value is WeeklyPublicContent; // runtime guard, version 1
export function weeklyPageTitle(c: WeeklyPublicContent): string; // "Web3 security week of Oct 5, 2026"
// _shared/telegram-alerts.ts
export function buildWeeklyLinkMessage(c: WeeklyPublicContent, url: string): string; // HTML-escaped, ≤ 1024 chars, names sources, "reported" wording
export const WEEKLY_POST_UID_PREFIX = 'weekly:';
```

### Behaviour

**Page**
- Fetch with `supabase.rpc('get_weekly_newsletter', { p_week_start })`. Validate with `isWeeklyPublicContent`.
- Render:
  - totals tiles, with numbers taken from `totals` and formatted in code;
  - the top 5 cards, each with a status badge, source link and incident link;
  - trends;
  - the vulnerabilities list;
  - the opsec tip;
  - the sources list;
  - previous and next week links;
  - a subscribe CTA linking to `buildSubscribeHref({ scope: 'web3-incidents' })` with the weekly box pre-checked (`&weekly=1`, which W6 reads).
- Paragraphs with `origin: 'ai'` get a small "Written by AI from the data above" note.
- An invalid date or missing issue shows the not-found state. `MetaTags` gets the title and description.

**Telegram**
- `RequestSchema.mode` gains `'weekly'`. With it, the function loads the latest ready or sent weekly issue with `period_start` in the last 8 days.
- It claims a `telegram_posts` row with `article_uid = 'weekly:' + weekStart` and `article_id = null`, then posts `buildWeeklyLinkMessage(toPublicWeekly(content), siteUrl + '/threat-intel/weekly/' + weekStart)` using the existing send path, test and live mode, and `TELEGRAM_POSTING_ENABLED` gate.
- `syncPostedMessages` and `loadCandidates` must skip `article_uid LIKE 'weekly:%'`. Otherwise the edit pass finds no article for the weekly post and edits it to RETRACTED.
- Cron in the same migration: `post-weekly-telegram` at `0 1 * * 1` with body `{"mode":"weekly"}` and timeout 120000.

### Tests

- `weekly.test.ts`:
  - `parseWeekStart` accepts a Monday and rejects a Tuesday, `2026-02-30`, and garbage input;
  - the runtime guard rejects content missing `totals` or carrying a wrong version.
- `WeeklyNewsletter.test.tsx` with the RPC mocked:
  - renders totals, five items with source names, and the AI note only on AI paragraphs;
  - the not-found state on null;
  - no "verified by DigiBastion" text.
- `telegram-alerts` tests:
  - the weekly message escapes HTML, stays within its length limit, and includes the URL and "reported";
  - the sync planner ignores weekly rows. This one is a unit test on the filter helper; extract `isIncidentPostUid(uid)`.

### Acceptance (W5)

- `bun build post-telegram-alerts` and `generate-sitemap` succeed.
- The Vite build passes.
- A manual check in `npm run dev` with a seeded issue: `/threat-intel/weekly/2026-10-05` renders on a 390 px viewport with no horizontal scroll.
- Commits: `feat(threat-intel): public weekly deep-dive page`, then `feat(telegram): post the weekly deep-dive link`.

---

## W6. Subscribe UI and preference endpoints

### Files

- Modify:
  - `supabase/functions/submit-form/index.ts`
  - `supabase/functions/update-subscription/index.ts`
  - `supabase/functions/get-subscription/index.ts`
  - `supabase/functions/verify-email/index.ts`
  - `supabase/functions/request-management-link/index.ts` (suppression check only)
  - `src/components/news/SubscriptionForm.tsx`
  - `src/components/newsletter/QuickSubscribeCard.tsx`
  - `src/pages/ManageSubscription.tsx`
  - `src/components/news/EmailPreview.tsx`
  - `src/pages/News.tsx` (pass the current view's filters into the form)
  - `src/lib/digestSchedule.ts` (add `getBrowserTimeZone()`)
- Create `src/lib/subscriptionPayload.ts` with a test.

### Endpoint contracts

All three endpoints validate with `parseSubscriptionPreferences` (W1) and keep accepting the legacy payload.

**`submit-form`** (type `subscription`)
- Payload: `{ email, name?, categories, technologies?, content_scope, severity, wants_realtime, wants_daily, wants_weekly, include_preliminary, chains, timezone, timezone_offset, preferred_hour, consent_source: 'threat-intel-form' | 'quick-subscribe' }`.
- New rows store `consent_source` and `consent_ip_hash = sha256(client IP)`. Use the same hashing as `hashIdentifier`; never store the raw IP.
- Suppressed address: send no email and return the normal "check your email" response. That prevents enumeration and protects the sender's reputation.
- Existing, verified, inactive subscriber (re-subscribe):
  - set `optin_token`, `optin_token_expires_at = now()+24h`, and `optin_pending` = the parsed preferences;
  - email "Confirm you want DigiBastion emails again" with `https://www.digibastion.com/verify-email?token=<optin_token>`;
  - never touch `is_active`, the preferences, or `verification_token`;
  - rate limit with scope `subscription:resubscribe:email` at 3 per hour.
- Existing, verified, active subscriber: behaviour is unchanged ("already subscribed" email). The email now lists the three channels instead of `frequency`.

**`verify-email`**
- Lookup order:
  1. `verification_token` with `is_verified=false` (the existing path), which now also sets `consented_at=now()`.
  2. Otherwise, `optin_token` that has not expired. This applies `optin_pending` through `preferencesToColumns`, sets `is_active=true`, `unsubscribed_at=null`, `consented_at=now()` and `consent_source='resubscribe'`, and clears the three `optin_*` columns. The management token is kept.
- Both paths return the existing response shape.

**`update-subscription`**
- Accepts the new fields.
- Never writes `is_active`; delete the `is_active: true` line, which is the bug at today's line 232.
- Saving while inactive succeeds and the row stays inactive.
- New `{ action: 'resubscribe', email, token }`: same opt-in email as above, using the stored preferences, with the same rate limit.
- Returns the new fields and `is_active`.

**`get-subscription`**: also selects the new fields: `wants_*`, `include_preliminary`, `chains`, `timezone` and `unsubscribed_at`.

**`request-management-link`**: skips sending when the address is suppressed, with the same response as a normal send.

### UI

```ts
// src/lib/subscriptionPayload.ts
export interface SubscriptionFormState { categories: string[]; technologies: string[]; scope: 'all' | 'web3-incidents'; severity: SeverityLevel; realtime: boolean; daily: boolean; weekly: boolean; includePreliminary: boolean; chains: string[]; preferredHour: number; timezone: string | null; timezoneOffset: number }
export function buildSubscriptionPayload(s: SubscriptionFormState, consentSource: 'threat-intel-form' | 'quick-subscribe' | 'manage'): Record<string, unknown>;
export function initialStateFromView(o: { categories?: string[]; scope?: 'all' | 'web3-incidents'; chains?: string[]; verification?: 'all' | 'confirmed' | 'unconfirmed'; weekly?: boolean }): Partial<SubscriptionFormState>;
//  verification 'confirmed' -> includePreliminary false; weekly true -> weekly box pre-checked
```

**`SubscriptionForm`**
- Replace the frequency select with three checkboxes: "Real-time alerts", "Daily brief" and "Weekly deep-dive (Mondays)". At least one is required, with an inline error.
- Add a "Join on Telegram" button (`TELEGRAM_CHANNEL_URL`, `target="_blank" rel="noopener noreferrer"`).
- Add an "Include unconfirmed reports" switch, on by default.
- Add a chains multi-select fed by `useThreatIntelFacets` (the `threat_intel_facets` RPC), shown only in the Web3 incidents scope.
- Show the detected browser timezone (`Intl.DateTimeFormat().resolvedOptions().timeZone`) with a "change" select that falls back to the offset list.
- Show delivery time only when daily or weekly is checked. Remove the weekday select.
- New props: `initialChains`, `initialVerification` and `initialWeekly`.
- In `News.tsx`, "Subscribe to this view" passes the current `scope`, `categories`, `chains` and `verification`.

**`QuickSubscribeCard`**
- Sends `consent_source: 'quick-subscribe'`, `content_scope: 'web3-incidents'` and its category list.
- Shows the three checkboxes with real-time alerts checked by default, and sends the timezone.
- Hard-coded `frequency: 'daily'` is removed.
- The subscriber-count label ("10+ security professionals") is replaced by a link that opens `EmailPreview` (spec section 9).

**`ManageSubscription`**
- The same controls as the form.
- When inactive, it shows "You're unsubscribed. Saving keeps your preferences without sending emails." and a "Resubscribe" button that calls `update-subscription {action:'resubscribe'}` and confirms "Check your inbox to confirm".
- It never shows a control that re-activates directly.

**`EmailPreview`**: three tabs (Alert, Daily brief, Weekly) with static sample content that follows the copy rules.

### Tests

- `subscriptionPayload.test.ts`:
  - the payload has `wants_*` booleans and no `frequency`;
  - `initialStateFromView` handles verification `confirmed` (preliminary off), chains and weekly.
- `SubscriptionForm.test.tsx` (update):
  - submitting with nothing checked shows the error and invokes nothing;
  - submitting sends the three booleans, the timezone, the chains and `include_preliminary`;
  - the Telegram button links to `t.me/digibastion`;
  - "Subscribe to this view" pre-fills the form.
- `QuickSubscribeCard.test.tsx` (update): sends `consent_source` and the channel booleans.
- `ManageSubscription` test (new, `src/pages/__tests__/ManageSubscription.test.tsx`):
  - an inactive subscription shows "Resubscribe";
  - saving never sends `is_active`;
  - "Resubscribe" calls the action.
- Edge functions have no unit harness (Deno is not installed). The validation lives in W1's pure module and its tests. Check each entry with `bun build`.

### Acceptance (W6)

- `grep -n "is_active: true" supabase/functions/update-subscription/index.ts` finds nothing.
- `tsc`, `eslint`, the full vitest suite and the Vite build pass.
- At 390 px the form has no horizontal scroll.
- Commits:
  - `feat(subscriptions): channel preferences, opt-in resubscribe and consent audit`
  - `feat(threat-intel): subscribe form with alert, daily and weekly choices`

---

## Release

Every phase gets a short `docs/LOVABLE_PHASE3_NEWSLETTERS_RELEASE.md`, as previous releases did. The final integrator writes it from this section with the exact merge SHA.

### Before Lovable (user, outside Lovable)

1. **Postal address.** Choose a valid physical postal address for CAN-SPAM (a registered PO box or a commercial mailbox is acceptable). It goes in `NEWSLETTER_POSTAL_ADDRESS` at launch, not before.
2. **Resend webhook.** In Resend, open Webhooks and add the endpoint `https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/resend-webhook`. Select the events `email.bounced`, `email.complained`, `email.delivered` and `email.delivery_delayed`. Copy the signing secret (`whsec_…`) into the Lovable secret `RESEND_WEBHOOK_SECRET`; never paste it into chat.
3. **DNS.**
   - In Resend's Domains page, `digibastion.com` shows Verified for DKIM (`resend._domainkey`) and SPF on the return-path subdomain (`send`).
   - `_dmarc.digibastion.com` has a TXT record of at least `v=DMARC1; p=none; rua=mailto:<address>`.
   - Send a test to Gmail and use "Show original": SPF, DKIM and DMARC should all show PASS, aligned to `digibastion.com`.
   - Optionally register with Google Postmaster Tools to watch the spam rate.

### Lovable deploy (one prompt, posting and newsletters stay off)

```text
Use View Backend for the existing managed Lovable Cloud project and use GitHub main commit <EXACT_SHA>.
Do not rewrite application source, create another backend, or print any secret value.

1. Apply, in this order, only these migrations:
   supabase/migrations/20261013100000_newsletter_data_model.sql
   supabase/migrations/20261013110000_email_compliance_jobs.sql
   supabase/migrations/20261013120000_daily_newsletter_jobs.sql
   supabase/migrations/20261013130000_weekly_newsletter_jobs.sql
   supabase/migrations/20261013140000_weekly_newsletter_public.sql
2. Deploy the repository versions (with their _shared imports) of:
   send-critical-alerts, resend-webhook, one-click-unsubscribe, unsubscribe, submit-form, update-subscription,
   get-subscription, verify-email, request-management-link, build-daily-newsletter, build-weekly-newsletter,
   send-newsletters, send-digest-emails, post-telegram-alerts, generate-sitemap.
   Confirm verify_jwt = false for every one of them as declared in supabase/config.toml.
3. Confirm these secrets exist without showing values: RESEND_API_KEY, CRON_SECRET, LOVABLE_API_KEY,
   RESEND_WEBHOOK_SECRET, WEEKLY_AI_ENABLED (must be "false"). Confirm NEWSLETTER_POSTAL_ADDRESS is NOT set.
4. Run and return results:
   a. SELECT frequency, count(*), sum(wants_realtime::int), sum(wants_daily::int), sum(wants_weekly::int)
      FROM subscriptions GROUP BY frequency;  (each frequency maps only to its own wants_ column)
   b. SELECT count(*) FROM email_sends WHERE idempotency_key LIKE 'legacy/%';  (equals sent rows in notification_log that still have an article)
   c. SELECT jobname, schedule, active FROM cron.job WHERE jobname IN ('send-critical-alerts-30min',
      'send-critical-alerts-hourly','cleanup-unverified-subscriptions','build-daily-newsletter','send-newsletters-00',
      'send-newsletters-15','send-newsletters-30','send-newsletters-45','build-weekly-newsletter','post-weekly-telegram',
      'send-digests-hourly-00');  (send-critical-alerts-hourly must be absent; send-digests-hourly-00 still present)
   d. RLS is enabled with no anon/authenticated access on newsletter_issues, email_sends, email_suppressions,
      incident_status_events; get_weekly_newsletter(date) is executable by anon.
5. Invoke with an authorized POST and return each JSON response:
   a. send-critical-alerts {}            -> success true
   b. build-daily-newsletter {}          -> an issue with status ready
   c. send-newsletters {"dryRun": true}  -> skipped "postal_address_missing"
   d. build-weekly-newsletter {}         -> status ready, archive.aiEnabled false, all paragraphs origin "template"
   e. resend-webhook with an unsigned POST -> 401
6. Publish the frontend. Return the deployed revision and all results.
```

### Checks after deploy (admin)

- Send a Resend dashboard test event to the webhook and expect a 200 response.
- In the admin session, run `send-newsletters {"test_email":"<admin email>","kind":"daily"}` and `{"kind":"weekly"}`. Check the rendering and the "Postal address not configured" warning. "Show original" should show the `List-Unsubscribe` and `List-Unsubscribe-Post` headers.
- Set `WEEKLY_AI_ENABLED=true`, then run `build-weekly-newsletter {"force": true}`. That works only while no sends exist for the issue.
- Read `newsletter_issues.content->'archive'->'validation'` and check that the rejected paragraphs fell back to templates.
- Open `/threat-intel/weekly/<weekStart>`.
- With `TELEGRAM_POSTING_ENABLED=test`, run `post-telegram-alerts {"mode":"weekly"}` and check the post in the test channel.

### Launch

1. Set `NEWSLETTER_POSTAL_ADDRESS`. From the next quarter-hour slot, `send-newsletters` sends and the legacy `send-digest-emails` skips.
2. Watch `threat_intel_ingestion_runs` for the `digest-emails`, `newsletter-build` and `critical-alerts` pipelines, plus `email_sends` grouped by status and `last_event`, for the first 24 hours.
3. Rollback: unset `NEWSLETTER_POSTAL_ADDRESS` and the legacy digest resumes. Real-time alerts are unaffected either way.

### Later cleanup (next phase, not in this plan)

- Drop `frequency`, `preferred_day`, the sync trigger, the `notification_log` guard, the `send-digests-hourly-*` jobs and `send-digest-emails` once a full week has run cleanly on the new path.

## Risks

1. **The edge-function time limit stops large sends.** A run stops after 100 s or 150 sends, and later slots inside the 180-minute grace window carry on. Above roughly 2,000 daily subscribers, move to Resend's batch API or a queue.
2. **The weekly validator is strict and may reject most AI paragraphs.** The fallback is safe (templates), but the weekly reads flat. Tune `allowedTerms` from `archive.validation` after the first two issues; do not loosen the number, URL or unconfirmed rules.
3. **Mail scanners can prefetch the body unsubscribe page.** A security scanner that runs JavaScript could unsubscribe a user. RFC 8058 header unsubscribe stays POST-only. The page offers an immediate "Resubscribe" path, and the opt-in email makes recovery cheap.
4. **Some users get the daily brief late in the far-east timezones.** At UTC+13 and UTC+14 the issue for the local date is built after the local morning, so the daily arrives around 14:00 local. This is documented, not fixed.
5. **Suppressed addresses cannot re-subscribe without support.** Complaints and bounces are only cleared by a manual delete from `email_suppressions`.
6. **The status-event trigger fires on every importer upsert.** It only inserts on real changes, but a bad condition could flood `incident_status_events`. Check the row count after the first QuillMonitor sync.
7. **Deploy order.** The functions need W1's columns. Migrations must be applied before any function deploy; the release prompt orders them.
