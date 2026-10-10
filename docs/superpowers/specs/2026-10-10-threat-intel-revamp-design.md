# Threat Intel revamp: design spec

Date: 2026-10-10
Status: draft for review
Owner: Raiders (product), with design and exec review

## 1. Goal

Make digibastion.com/threat-intel the one place a Web3 user or builder needs for security news and incident alerts. A user should be able to:

- open the page and see the incidents that matter, without duplicates or noise;
- filter to exactly what they care about and subscribe to that same view;
- get an alert on Telegram or by email when a hack happens, with a link back to a DigiBastion incident page;
- get a daily brief and a weekly deep-dive by email if they want them.

Success after launch:

| Metric | Target |
|---|---|
| Time from incident reaching our database to Telegram post | under 5 minutes |
| Duplicate incidents on the first page of the Web3 view | 0 |
| Incident cards with a named source and a deep link | 100% |
| Spam complaint rate on newsletters | under 0.1% (Gmail sender guideline) |
| Preliminary items later retracted that were not corrected on Telegram | 0 |

End-to-end latency also depends on QuillMonitor, whose own workflow checks Telegram sources every 30 minutes. We cannot change that, so the Telegram target above is measured from ingestion.

## 2. Decisions already made

| Topic | Decision |
|---|---|
| Telegram bot | New bot `@digibastion_alerts_bot`. The old bot is retired. |
| Telegram target | Post to the `@digibastion` channel only. `Digibastion Community Chat` is its linked discussion group, so Telegram copies every post there automatically. |
| Telegram code location | In this repo, as an edge function with a cron job, like the other pipelines. |
| Preliminary incidents | Auto-posted with an "UNCONFIRMED" label, then edited in place when verified or retracted. |
| Email cadence | Subscribers can pick any combination of real-time alerts, a daily brief, and a weekly deep-dive. |
| Weekly write-up | Fully automated AI, with the guardrails in section 8.4. |

## 3. What we found (current state)

Five parallel reviews covered the frontend code, the subscription and email system, the ingestion pipeline, the live site, and comparable products. The findings that shape this design:

**Data trust**

- The same incident appears several times. On the live Web3 view, NEAR Intents ($3.8M) shows three times and Meter twice; Limit Break and Magic Eden are one incident with two loss figures. Only the SlowMist importer checks other providers for duplicates. The `fetch-web3-incidents` second feed scrapes the QuillAudits hacks page, which is the same data the QuillMonitor API already gives us.
- `fetch-web3-incidents` treats full-dollar amounts of 1000 or more as millions and matches "billion" anywhere in the text (`index.ts:62-71`). Words like "major" or "massive" make an item critical (`index.ts:78-96`).
- Unparseable dates fall back to `now()` in two importers, so old items look new. QuillMonitor and SlowMist set `published_at` to midnight UTC of the incident date, so `send-critical-alerts` (which requires `published_at` within 6 hours) never alerts on most of them.
- Cards labelled "AI Summary" often show publisher excerpts cut mid-word. Some Web3 cards have no source link at all.
- A preliminary "Ledger: Security incident ($86M loss)" record shows as Critical in the alerts list with only a small badge.

**Page**

- `src/pages/News.tsx` is 1,182 lines and holds the feed, alerts, subscribe form and detail view together.
- "Sort by severity" and the severity stat tiles work on the current 20-item page only. The Alerts tab ignores the scope toggle. Search refetches on every keystroke.
- On a 390px phone the first card starts about 1,340px down.
- There is no methodology, source list, or explanation of "Preliminary".
- Production is served by Lovable hosting behind Cloudflare, not Vercel. The bot rewrites in `vercel.json` do not run, so crawlers and link previews (including Telegram's) see the homepage title and image for every Threat Intel URL.

**Email**

- `subscriptions.frequency` holds one value, so a user cannot take both daily and weekly.
- Digest summaries are cut to 190 characters. Web3 incident records are inserted with `is_processed=true`, so they never get AI summaries.
- No postal address in the footer, no bounce or complaint handling, no suppression list. Saving preferences silently re-activates an unsubscribed user (`update-subscription/index.ts:232`).
- Timezones are stored as fixed offsets, so delivery shifts by an hour across daylight-saving changes.

**Telegram**

- No Telegram code exists in this repo today.

## 4. Approach

We considered three ways to run this:

1. **Fix data first, then ship channels (chosen).** Phase 0 cleans up dedup, amounts, dates and provenance. Telegram, the page and the newsletters all build on that. Slower to the first Telegram post (about a week), but every channel shows the same clean incident.
2. **Ship Telegram first on today's data.** Fastest, but duplicates and inflated amounts would go to a public channel under our name, and every fix later means correcting public posts.
3. **Separate "incidents" table and rebuild everything around it.** The cleanest model long term, but it rewrites every importer, the feed RPCs and the email system at once. Too much risk for this round.

Option 1 keeps `news_articles` as the single store (consistent with `AGENTS.md`) and adds a small amount of structure on top.

## 5. Phase 0: data trust foundation

Everything else depends on this phase.

### 5.1 One incident, one record

- Move the cross-provider matcher from `fetch-slowmist-incidents/index.ts:236-307` into `supabase/functions/_shared/incident-dedup.ts`.
- Run it in every Web3 importer (QuillMonitor, web3-incidents, SlowMist) before insert. Match on normalized project name, incident date within ±2 days, and loss amount within 10% or the same reference URL.
- Provider priority stays QuillMonitor > web3-incidents > SlowMist. The lower-priority record is kept but marked `metadata.duplicate_of_uid` and `classification_relevant=false`. The primary record collects every source in `metadata.sources: [{provider, url, amount_usd}]`.
- Turn off the QuillAudits page scrape (`fetch-web3-incidents` feed-2). The QuillMonitor API covers the same incidents with stable IDs and verification status.
- One-time backfill: run the matcher across the last 90 days and mark existing duplicates. It runs as a dry run first, and its output is reviewed before any writes.

### 5.2 Amounts, dates and severity

- Fix `extractAmount` in `fetch-web3-incidents`: parse the unit next to the number only ("$3.8M", "3.8 million", "$3,800,000"). Do not scale raw dollar values.
- Remove "major" and "massive" as severity triggers. Severity for Web3 incidents uses the shared loss-based rubric already in `quillmonitor.ts:216-226`.
- When a date cannot be parsed, store `metadata.incident_date_unknown=true` and keep `published_at` as the ingestion date, instead of silently using `now()`.
- Every incident shows two dates: the incident date and the date we added it.
- Add `metadata.funds_returned` (boolean) and `metadata.amount_status` (`reported` | `confirmed` | `revised`) where the provider gives them.

### 5.3 Provenance

- Every card and incident page shows a named source and a deep link. QuillMonitor records link to `reference_url` when present, not the generic hacks-database page.
- The "AI Summary" badge appears only when `summarize-article` wrote the summary. Add `metadata.summary_source: 'ai' | 'publisher' | 'provider'`. Publisher excerpts are cut at a word boundary with "…".
- Let `summarize-article` process Web3 incident records whose summary is empty or "Summary pending".

### 5.4 Apply the relevance filter everywhere

The homepage alerts list, related articles, mobile badges and realtime toasts all skip the `classification_relevant=false` filter today. Move the row-to-article mapping and filtering into one shared module (`src/lib/threatIntel/articleRow.ts`) and use it in all of them.

## 6. Phase 1: Telegram alerts

### 6.1 Setup (done or in progress)

- Bot `@digibastion_alerts_bot` created; join-groups disabled after adding it to Community Chat.
- Bot is an admin of `@digibastion` with Post, Edit and Delete rights only.
- Lovable function secrets: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHANNEL_ID=@digibastion`, `TELEGRAM_TEST_CHANNEL_ID`, `TELEGRAM_POSTING_ENABLED=false`.
- Old bot removed as admin from the channel and the chat.

### 6.2 Components

**Table `telegram_posts`** (service role only; never in `news_articles.metadata`, because importers overwrite metadata and the table is public):

| Column | Purpose |
|---|---|
| `article_id` uuid, `chat_id` text | unique together; one post per incident per chat |
| `message_id` bigint | for edits |
| `status` | `claimed`, `sent`, `failed`, `retracted`, `seeded` |
| `posted_verification`, `posted_severity`, `posted_amount` | what the live message currently says |
| `posted_text_hash` | skip edits when nothing changed |
| `attempts`, `last_error`, timestamps | retries and health |

**Edge function `post-telegram-alerts`**

- Auth: timing-safe `CRON_SECRET` or admin JWT, same as `fetch-quillmonitor-incidents`.
- Modes:
  - `check`: calls `getMe`, `getChat` and `getChatMember` for each configured chat and reports the bot's rights. It never posts.
  - `seed`: marks every currently eligible incident as `seeded` so launch does not flood the channel.
  - `run`: the normal mode.
  - `dryRun: true`: sends to the test channel instead of `@digibastion`.
- Selection for new posts:
  - `metadata.is_web3_incident = true`;
  - severity `critical` or `high`;
  - `created_at` within the last 24 hours (not `published_at`);
  - not a duplicate and not `classification_relevant=false`;
  - not from SlowMist until reuse permission is confirmed;
  - no existing `telegram_posts` row for that article and chat.
- Selection for edits: posted incidents where verification status, severity or loss amount changed since the post, or that became duplicates or irrelevant (these are edited to "RETRACTED" or "MERGED" with a link to the primary incident).
- Claim before send: insert the `telegram_posts` row with status `claimed` under the unique key. If the insert conflicts, another run already has it. This makes concurrent runs safe.
- Sending:
  - `sendMessage` with `parse_mode: HTML`, escaping `<`, `>` and `&` in all scraped text;
  - messages capped at 4,096 characters;
  - link previews disabled (`link_preview_options.is_disabled=true`), because previews of our URLs show the homepage card until section 7.5 ships;
  - one message every 3 seconds and at most 10 new posts per run;
  - on HTTP 429, wait `retry_after` and stop the run if it exceeds 30 seconds.
- Every run records a row in `threat_intel_ingestion_runs` with pipeline `telegram`. This needs the CHECK constraint widened and `ingestion-health.ts` updated. The bot token never appears in logs or error summaries.

**Triggers**

- Cron at `:20` and `:50` through `record_cron_http_request`, so it shows on `/admin/cron`.
- `fetch-quillmonitor-incidents` also calls the poster when it inserts or updates incident rows (fire-and-forget, the same pattern `fetch-rss-news` uses for `summarize-article`). This is what makes posting near-instant after ingestion. The claim step prevents double posts when both fire.

### 6.3 Message format

New preliminary incident:

```
🟠 UNCONFIRMED · Bridge exploit · Ethereum
Example Protocol: ~$4.2M reported lost
Attack: private key compromise
Source: QuillMonitor
Details: https://www.digibastion.com/threat-intel/<id>?utm_source=telegram&utm_medium=social&utm_campaign=alerts
Check your token approvals: https://revoke.cash
```

When verified, the same message is edited:

```
🔴 CONFIRMED · Bridge exploit · Ethereum
Example Protocol: ~$4.2M lost
...
Updated 14:05 UTC: verified by QuillMonitor
```

Rules:

- Preliminary posts always say "UNCONFIRMED" and "reported". They never use "drained" or "stolen" as a statement of fact.
- Severity icon: 🔴 critical, 🟠 high.
- Only links to digibastion.com, the provider's incident page, block explorers, and revoke.cash. No wallet-connect links of any kind.
- A pinned message in `@digibastion` lists the official accounts, so users can spot impersonators.

### 6.4 Rollout

1. Deploy with `TELEGRAM_POSTING_ENABLED=false`. Run `check`.
2. Run with `dryRun: true` against the test channel for 48 hours. Review wording, labels, edits and links.
3. Run `seed`, then set `TELEGRAM_POSTING_ENABLED=true`.
4. Watch `/admin/cron` and the channel for the first week.

## 7. Phase 2: Threat Intel page

### 7.1 Structure

Split `News.tsx` into route-level pages under `src/pages/threat-intel/`:

- `ThreatIntelPage` (list and filters)
- `IncidentPage` (detail)
- `AlertsPanel`
- `SubscribePage` (`/threat-intel/subscribe`, with `?tab=subscribe` redirected)
- `MethodologyPage` (`/threat-intel/methodology`)

Data access moves to React Query hooks. One taxonomy module (`src/lib/threatIntel/taxonomy.ts`) replaces the copies in `types/news.ts`, `data/newsData.ts`, `News.tsx` and `newsIncident.ts`. Server code imports the same definitions through `supabase/functions/_shared/`, with a test that fails if the two lists drift.

### 7.2 Default view and filters

- Top-level views: **Web3 incidents** | **All security news**. The default is an open decision (section 11).
- Filters: severity, category, verification (confirmed / unconfirmed), chain, attack type, source, date range, and search. Search is debounced at 300 ms.
- All filters live in the URL, so any view can be shared and subscribed to.
- Severity sort and the stat tiles come from the database through a new `threat_intel_stats(filters)` RPC, so they reflect the whole result, not one page. Tiles are labelled "in this view".
- On mobile, filters open in a bottom sheet behind a "Filters (n)" button. The stat tiles shrink to one row, and the first card sits above the fold at 390px.

### 7.3 Cards and incident page

- Cards are real `<a>` links (crawlable, open in new tab).
- Each card shows severity, verification badge (with a tooltip that explains it), loss and amount status, "funds returned" when known, chain, attack type, incident date and date added, and every source with a deep link.
- The incident page adds a status history (first reported, verified, revised), a "What should I do?" block (revoke.cash, Chainabuse, and SEAL 911 for teams under attack), a "Get alerts like this" subscribe card, and a "Join @digibastion on Telegram" button.
- Alerts follow the selected view and filters, and paginate.

### 7.4 Methodology page

Lists every source, the severity rubric, what "unconfirmed" and "confirmed" mean, how duplicates are merged, how corrections work (with a contact address), and the official channels (site, Telegram channel, email sender address).

### 7.5 Link previews and SEO

Because production runs on Lovable hosting, `vercel.json` rewrites do not apply. To give Telegram, X and search engines the right title and image per incident, we need server-rendered meta tags for `/threat-intel` and `/threat-intel/<id>`. Options, decided in section 11:

- a Cloudflare Worker on the digibastion.com zone that serves meta tags to known bots and passes everyone else through;
- moving frontend hosting to Vercel, where the existing `api/og-tags.ts` pattern works;
- or accepting SPA-only meta for now and keeping Telegram link previews disabled.

Separately, the served `/sitemap.xml` is the static file in `public/`. Point `sitemap-index.xml` at the dynamic `generate-sitemap` function, which already lists incident URLs.

### 7.6 Bugs fixed along the way

- Subscribe breadcrumb leaves `tab=subscribe` in the URL (`News.tsx:1160`).
- Unknown category crashes cards (`NewsCard.tsx:80`, `NewsDetail.tsx:180`).
- Realtime channels are recreated on every filter change.
- Scope state carries over between URLs through the localStorage cache key.
- Unused skeleton imports; the Alerts tab shows nothing while loading.
- Tabs lack `tablist`/`aria-selected`; search has no label.
- Dead code: `ThreatStatsDashboard.tsx`, `data/currentNewsData.ts`, `mockNewsArticles`.

## 8. Phase 3: subscriptions and newsletters

Phases 2 and 3 can run in parallel.

### 8.1 Data model

Add to `subscriptions` (migration, with a backfill from `frequency`):

| Column | Type | Notes |
|---|---|---|
| `wants_realtime` | boolean | was `frequency='immediate'` |
| `wants_daily` | boolean | was `frequency='daily'` |
| `wants_weekly` | boolean | was `frequency='weekly'` |
| `timezone` | text | IANA name such as `Asia/Kolkata`; fixes daylight-saving drift. `timezone_offset` stays as a fallback. |
| `include_preliminary` | boolean, default true | lets cautious users skip unconfirmed items |
| `chains` | text[] | filter parity with the page |
| `consented_at`, `consent_source`, `consent_ip_hash` | | audit trail for opt-in |
| `unsubscribed_at` | timestamptz | |

`frequency` stays readable during the transition and is dropped once all functions use the new columns.

New tables:

- `newsletter_issues (id, kind daily|weekly, period_start, period_end, status draft|ready|sent|failed, content jsonb, generated_at)`: one shared edition per period.
- `email_suppressions (email_hash, reason bounce|complaint|manual, created_at)`: written by a Resend webhook.
- `email_sends (subscription_id, issue_id or article_id, kind, resend_id, status)`: idempotency for every send, replacing the alerts-only `notification_log` over time.

### 8.2 Real-time email alerts

- Select by `created_at`, not `published_at` (fixes the midnight-UTC miss).
- Respect `include_preliminary`. Preliminary alerts say "Unconfirmed" in the subject.
- Send a follow-up only when an incident is retracted or upgraded to critical. Other verification changes go into the next daily brief.
- Use the timing-safe secret check (`send-critical-alerts/index.ts:173` uses plain `===` today).
- Replace the alarm-style subject ("Immediate Action Required") with a factual one, e.g. "High: Example Protocol bridge exploit, ~$4.2M reported".

### 8.3 Daily brief

One shared issue per day, built at 00:00 UTC for the previous 24 hours and stored in `newsletter_issues`. Each subscriber gets it at their chosen local hour, filtered by their preferences. Sections:

1. Confirmed incidents (loss, chain, attack, link)
2. Still unconfirmed
3. Status changes: verified, revised, retracted
4. Critical vulnerabilities and supply-chain items
5. One action to take today

### 8.4 Weekly deep-dive (fully automated AI)

Built Monday 00:00 UTC for the previous Monday to Sunday, and sent at each subscriber's local hour on the send day set by decision 5 in section 11. It also gets a public web page (`/threat-intel/weekly/<date>`), and a short post with that link goes to `@digibastion`.

Content:

- Totals: losses this week vs last week, number of incidents, funds returned, by attack type and by chain. All computed by code.
- Top 5 incidents: two short paragraphs each (what happened; what users and builders should do).
- Trends paragraph.
- Vulnerabilities and supply-chain round-up.
- One opsec tip with a link to the relevant DigiBastion guide.

Guardrails, because there is no human review:

1. **Numbers come from code, not the model.** The model writes prose around placeholders such as `{loss}` and `{chain}`, and the renderer fills them from the database.
2. **Grounded input only.** The prompt contains only fields we stored for that week. It instructs the model not to add facts, names or figures.
3. **Validator.** After generation, reject any paragraph that contains a currency amount, a number, a project name, or a URL that is not in the input. A rejected paragraph falls back to a template sentence built from the data.
4. **Preliminary wording.** Unconfirmed incidents are passed with a flag, and the validator rejects a paragraph about one unless it contains "unconfirmed" or "reported".
5. **Kill switch.** `WEEKLY_AI_ENABLED`. When off, or when generation fails, the issue goes out with template sentences only.
6. **Archive.** Every issue's input and output are stored in `newsletter_issues.content`, so any complaint can be traced.

Model: the Lovable AI gateway is already used by `summarize-article` (`google/gemini-2.5-flash-lite`). The weekly issue uses a stronger model from the same gateway; the exact model is chosen at implementation time from what the gateway offers.

### 8.5 Compliance and deliverability

- Postal address in every footer (CAN-SPAM). Needs the address to use.
- The body's unsubscribe link unsubscribes immediately (one-click), with a "manage preferences" link next to it.
- Saving preferences never re-activates an unsubscribed address. Re-subscribing goes through opt-in again.
- Resend webhook for bounces and complaints writes `email_suppressions`. Every sender checks it.
- Unverified sign-ups are deleted after 7 days.
- Resend `Idempotency-Key` on every send. Sends are throttled to stay under Resend's rate limit.
- Test sends carry the same `List-Unsubscribe` headers as real sends.
- Before launch, confirm SPF, DKIM and DMARC alignment for `alerts@digibastion.com` (Gmail and Yahoo bulk-sender rules).

### 8.6 Subscribing

- "Subscribe to this view" on the Threat Intel page opens the form pre-filled with the current filters.
- The form shows three checkboxes (Real-time alerts, Daily brief, Weekly deep-dive), plus a Telegram button.
- `QuickSubscribeCard` on the homepage sends a scope and uses the new checkboxes instead of its hard-coded values.

## 9. Copy

Draft hero for the Web3 view (final wording with design):

> **Crypto and Web3 security incidents, as they happen**
> Hacks, exploits, phishing and supply-chain attacks, collected from QuillMonitor and other incident trackers, merged into one record per incident, and labelled confirmed or unconfirmed. Free alerts on Telegram and by email.
> [Join on Telegram] [Get email alerts]

Rules for all copy:

- Name sources; never claim "verified by DigiBastion" for data we relay.
- Use the incident's own status words: unconfirmed, confirmed, revised, retracted.
- Replace "10+ security professionals" with a sample email preview.

References linked from the methodology page and incident pages:

| Source | Use |
|---|---|
| CISA Known Exploited Vulnerabilities catalog | which CVEs are being exploited |
| NVD | CVE records and scores |
| OWASP Smart Contract Top 10 | attack-type vocabulary |
| SEAL 911 (securityalliance.org) | emergency help for teams under attack |
| Chainabuse | report and check scam addresses |
| Revoke.cash | revoke token approvals |
| Chainalysis and TRM Labs annual crypto crime reports | yearly loss context |
| Immunefi loss reports | quarterly loss context |
| ScamSniffer annual phishing report | drainer and phishing trends |

## 10. Later (not in this round)

- Ingest the CISA KEV JSON feed and OSV/GitHub advisories for malicious npm and PyPI packages.
- Replace the web3isgoinggreat scrape with its RSS feed (`/feed.xml`).
- Public RSS and JSON feeds per filter, with stable incident IDs.
- Recovery ledger (funds returned over time) and side-by-side loss figures from each source.
- SlowMist posting, once reuse permission is confirmed.

## 11. Open decisions

| # | Question | Recommendation |
|---|---|---|
| 1 | Default view on /threat-intel: Web3 incidents or all security news? | Web3 incidents. It matches the brand and the homepage copy. |
| 2 | Link previews and SEO: Cloudflare Worker, move to Vercel, or defer? | Cloudflare Worker, if we control the Cloudflare zone; otherwise defer and keep previews off. |
| 3 | Postal address for email footers | Needed before newsletters launch. |
| 4 | Retire the QuillAudits page scrape (web3-incidents feed-2)? | Yes. QuillMonitor covers it. |
| 5 | Weekly send: subscriber's chosen day, or one fixed day for everyone? | Fixed Monday at the subscriber's local hour. One shared issue is easier to promote. |

## 12. Execution plan and parallel workstreams

Work runs in five workstreams with separate file ownership, so several agents or people can work at once without editing the same files.

| Workstream | Owns | Depends on |
|---|---|---|
| A. Data trust (Phase 0) | `supabase/functions/_shared/incident-dedup.ts`, `fetch-*` importers, `summarize-article` | none |
| B. Telegram (Phase 1) | `post-telegram-alerts`, `telegram_posts` migration, cron migration | A (dedup fields) |
| C. Page (Phase 2) | `src/pages/threat-intel/*`, `src/components/news/*`, `src/lib/threatIntel/*`, stats RPC | A (metadata fields) |
| D. Email (Phase 3) | `send-*`, `submit-form`, `*-subscription`, `unsubscribe*`, subscription migrations, Resend webhook | A; shares taxonomy module with C |
| E. Copy and SEO | methodology content, hero copy, sitemap, link-preview solution | C for page structure |

Coordination rules:

1. **Contracts first.** Before the workstreams start, one change lands that defines the shared metadata fields (`sources`, `duplicate_of_uid`, `summary_source`, `amount_status`, `funds_returned`, `incident_date_unknown`) and the taxonomy module. Everyone builds against those.
2. **One migration owner.** Migrations are written by the workstreams but merged in order by one person, so timestamps and constraint changes do not collide.
3. **Each workstream ships behind a flag or in dry-run mode** and has its own tests. Phase 0 fixes are covered by importer unit tests with fixtures from real records (NEAR Intents, Meter, Limit Break/Magic Eden).
4. **Lovable release per phase.** Each phase gets a short `docs/LOVABLE_<PHASE>_RELEASE.md`, as previous releases did: secrets, migrations to apply, functions to deploy, and checks to run.

Order:

1. Week 1: contracts change, then Workstream A.
2. Week 2: B (Telegram dry run, then live) in parallel with C and D.
3. Week 3: C and D finish; E ships with C; newsletters launch after the postal address and DNS checks.
4. Then the marketing launch: homepage refresh, Telegram and newsletter announcement.

A task-level implementation plan for each workstream is written after this spec is approved.
